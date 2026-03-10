import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';
import ChatMessage from '@/models/ChatMessage';
import { loadAgentContext } from '@/lib/agent/context-loader';
import { buildSystemPrompt, buildContextualMessage } from '@/lib/agent/system-prompt';
import { buildTools } from '@/lib/agent/tools';
import { ToolContext, ToolCallInfo } from '@/lib/agent/types';
import { generateChatEmbedding } from '@/lib/agent/embeddings';
import { createMemoryClient, addMemory } from '@/lib/agent/memory';
import { calculateChatCredits, deductCredits } from '@/lib/billing/credit-service';

export const maxDuration = 800; // ~13 minutes — Pro plan with Fluid Compute

const CHAT_MODEL = 'claude-sonnet-4-6';
const MIN_CREDITS_PREFLIGHT = 0.02; // Minimum credits to start a chat

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

    // Credits pre-flight check (minimum to start — actual cost calculated after)
    if (user.credits < MIN_CREDITS_PREFLIGHT) {
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
          clerkId: user.clerkId,
          sendEvent: send,
          dataChanged,
          toolCalls,
        };

        const tools = buildTools(toolCtx);

        // Save user message immediately so it's never lost
        await ChatMessage.create({
          conversationId: conv._id,
          owner: user.mongoId,
          date: today,
          role: 'user',
          content: message,
        });

        let assistantContent = '';
        let assistantMsgId: string | null = null;
        let lastSavedLength = 0;

        // Periodically flush assistant content to DB so it survives crashes/timeouts
        const flushAssistantContent = async () => {
          if (assistantContent.length === 0 || assistantContent.length === lastSavedLength) return;
          try {
            if (!assistantMsgId) {
              // Create the message on first flush
              const msg = await ChatMessage.create({
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
              assistantMsgId = msg._id.toString();
            } else {
              // Update existing message
              await ChatMessage.updateOne(
                { _id: assistantMsgId },
                {
                  $set: {
                    content: assistantContent,
                    toolCalls: toolCalls.map((tc) => ({
                      name: tc.name,
                      input: tc.input,
                      result: tc.result?.slice(0, 1000),
                    })),
                  },
                }
              );
            }
            lastSavedLength = assistantContent.length;
          } catch (err) {
            console.error('[Chat] Failed to flush assistant content:', err);
          }
        };

        // Flush every 5 seconds while streaming
        const flushInterval = setInterval(flushAssistantContent, 5000);

        try {
          const client = new Anthropic({ maxRetries: 5 });
          const runner = client.beta.messages.toolRunner({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            system: systemPrompt,
            tools,
            messages: claudeMessages,
            stream: true,
          });

          // Track token usage across all toolRunner iterations
          const tokenUsage = { inputTokens: 0, outputTokens: 0 };

          for await (const messageStream of runner) {
            for await (const event of messageStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                send('text_delta', { text: event.delta.text });
                assistantContent += event.delta.text;
              }
              // Accumulate token usage from each iteration
              if (event.type === 'message_start' && event.message?.usage) {
                tokenUsage.inputTokens += event.message.usage.input_tokens || 0;
              }
              if (event.type === 'message_delta' && (event as any).usage) {
                tokenUsage.outputTokens += (event as any).usage.output_tokens || 0;
              }
            }
            // Flush after each toolRunner iteration (after tool calls complete)
            await flushAssistantContent();
          }

          clearInterval(flushInterval);

          // Calculate actual credit cost based on usage
          const billing = calculateChatCredits({
            model: CHAT_MODEL,
            inputTokens: tokenUsage.inputTokens,
            outputTokens: tokenUsage.outputTokens,
            toolCalls,
          });

          // Final save of assistant message (may already exist from periodic flushes)
          await flushAssistantContent();

          // Deduct calculated credits with audit trail
          const creditsUsed = billing.credits;
          const deductResult = await deductCredits(
            user.mongoId,
            creditsUsed,
            'chat',
            `Chat exchange${toolCalls.length > 0 ? ` (${toolCalls.length} tool calls)` : ''}`,
            {
              conversationId: conv._id.toString(),
              toolCalls: toolCalls.map(tc => tc.name),
              claudeInputTokens: tokenUsage.inputTokens,
              claudeOutputTokens: tokenUsage.outputTokens,
              claudeCost: billing.claudeCost,
              toolCost: billing.toolCost,
              totalApiCost: billing.totalApiCost,
            },
          );

          // Update conversation
          const uniqueDataChanged = Array.from(new Set(dataChanged));
          await Conversation.findByIdAndUpdate(conv._id, {
            $inc: { creditsUsed },
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
            creditsUsed,
            newBalance: deductResult.success ? deductResult.newBalance : undefined,
            costBreakdown: {
              claudeTokens: { input: tokenUsage.inputTokens, output: tokenUsage.outputTokens },
              toolCalls: toolCalls.map(tc => tc.name),
              claudeCost: Math.round(billing.claudeCost * 10000) / 10000,
              toolCost: Math.round(billing.toolCost * 10000) / 10000,
              totalApiCost: Math.round(billing.totalApiCost * 10000) / 10000,
            },
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
          clearInterval(flushInterval);
          console.error('[Chat] Agent error:', error);

          // Save whatever assistant content we have so far
          await flushAssistantContent();

          const isOverloaded = error?.status === 529 || error?.error?.type === 'overloaded_error';
          const message = isOverloaded
            ? 'Claude is currently overloaded. Please try again in a few seconds.'
            : error.message || 'An error occurred';
          send('error', { message, code: isOverloaded ? 'OVERLOADED' : undefined });
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
