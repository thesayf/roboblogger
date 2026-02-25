import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
import ChatMessage from '@/models/ChatMessage';
import { loadAgentContext } from '@/lib/agent/context-loader';
import { buildSystemPrompt, buildContextualMessage } from '@/lib/agent/system-prompt';
import { buildTools } from '@/lib/agent/tools';
import { ToolContext, ToolCallInfo } from '@/lib/agent/types';
import { generateChatEmbedding } from '@/lib/agent/embeddings';
import { createMemoryClient, addMemory } from '@/lib/agent/memory';

const CREDITS_PER_EXCHANGE = 0.1;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Credits pre-flight check
    if (user.credits < CREDITS_PER_EXCHANGE) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }),
        { status: 402 }
      );
    }

    await dbConnect();

    // Get or create today's conversation
    const today = new Date().toISOString().split('T')[0];
    let conv;

    if (conversationId) {
      conv = await Conversation.findOne({ _id: conversationId, owner: user.mongoId });
      if (!conv) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 });
      }
    } else {
      // Get or create today's conversation
      conv = await Conversation.findOne({ owner: user.mongoId, date: today });
      if (!conv) {
        conv = await Conversation.create({
          owner: user.mongoId,
          date: today,
          title: message.slice(0, 100),
        });
      }
    }

    // Load previous messages for this conversation
    const previousMessages = await ChatMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .select('role content')
      .lean() as any[];

    // Build messages array for Claude
    const claudeMessages: Anthropic.MessageParam[] = previousMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    // Load context (brand settings, 7-day history, Mem0 memories)
    const context = await loadAgentContext(user, message);

    // Add current message with injected context
    const contextualMessage = buildContextualMessage(message, context);
    claudeMessages.push({ role: 'user', content: contextualMessage });

    const systemPrompt = buildSystemPrompt(context);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: any) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            // Controller may be closed
          }
        };

        const dataChanged: string[] = [];
        const toolCalls: ToolCallInfo[] = [];

        const toolCtx: ToolContext = {
          userId: user.mongoId,
          sendEvent: send,
          dataChanged,
          toolCalls,
        };

        const tools = buildTools(toolCtx);

        try {
          const client = new Anthropic();
          const runner = client.beta.messages.toolRunner({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: systemPrompt,
            tools,
            messages: claudeMessages,
            stream: true,
          });

          let assistantContent = '';

          for await (const messageStream of runner) {
            for await (const event of messageStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                send('text_delta', { text: event.delta.text });
                assistantContent += event.delta.text;
              }
            }
          }

          // Save user message
          await ChatMessage.create({
            conversationId: conv._id,
            owner: user.mongoId,
            date: today,
            role: 'user',
            content: message,
          });

          // Save assistant message
          await ChatMessage.create({
            conversationId: conv._id,
            owner: user.mongoId,
            date: today,
            role: 'assistant',
            content: assistantContent,
            toolCalls: toolCalls.map((tc) => ({
              name: tc.name,
              input: tc.input,
              result: tc.result?.slice(0, 1000),
            })),
          });

          // Deduct credits
          await User.findByIdAndUpdate(user.mongoId, {
            $inc: { credits: -CREDITS_PER_EXCHANGE, lifetimeCreditsUsed: CREDITS_PER_EXCHANGE },
          });

          // Update conversation
          const uniqueDataChanged = Array.from(new Set(dataChanged));
          await Conversation.findByIdAndUpdate(conv._id, {
            $inc: { creditsUsed: CREDITS_PER_EXCHANGE },
            $addToSet: { dataChanged: { $each: uniqueDataChanged } },
          });

          // Update title if this is the first message
          if (previousMessages.length === 0) {
            await Conversation.findByIdAndUpdate(conv._id, {
              title: message.slice(0, 100),
            });
          }

          send('done', {
            conversationId: conv._id.toString(),
            creditsUsed: CREDITS_PER_EXCHANGE,
            dataChanged: uniqueDataChanged,
          });

          // Fire-and-forget: generate embeddings for both messages
          (async () => {
            try {
              const [userEmb, assistantEmb] = await Promise.all([
                generateChatEmbedding(message),
                generateChatEmbedding(assistantContent),
              ]);

              const userMsg = await ChatMessage.findOne({
                conversationId: conv._id,
                role: 'user',
                content: message,
              }).sort({ createdAt: -1 });

              const assistantMsg = await ChatMessage.findOne({
                conversationId: conv._id,
                role: 'assistant',
                content: assistantContent,
              }).sort({ createdAt: -1 });

              if (userMsg && userEmb) {
                await ChatMessage.updateOne(
                  { _id: userMsg._id },
                  { $set: { embedding: userEmb } }
                );
              }
              if (assistantMsg && assistantEmb) {
                await ChatMessage.updateOne(
                  { _id: assistantMsg._id },
                  { $set: { embedding: assistantEmb } }
                );
              }
            } catch (err) {
              console.error('[Chat] Embedding generation failed:', err);
            }
          })();

          // Fire-and-forget: store to Mem0
          (async () => {
            try {
              const memClient = createMemoryClient();
              await addMemory(memClient, user.clerkId, message, assistantContent);
            } catch (err) {
              console.error('[Chat] Mem0 storage failed:', err);
            }
          })();

        } catch (error: any) {
          console.error('[Chat] Agent error:', error);
          send('error', { message: error.message || 'An error occurred' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[Chat] Route error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    );
  }
}
