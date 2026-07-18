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
import {
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MAX_COUNT,
  CHAT_IMAGE_MIME_TYPES,
  type ChatImageAttachment,
} from '@/lib/chat/attachments';
import {
  AGENT_COMPACTION_PROMPT,
  buildCompletionCorrection,
  getTaskPlanCompletionIssue,
  MAX_AGENT_ITERATIONS,
  MAX_COMPLETION_CORRECTIONS,
  requiresResearchPlan,
} from '@/lib/agent/long-task';
import { startDeepResearchRun } from '@/lib/deep-research/start';

const CHAT_MODEL = 'claude-sonnet-4-6';
const MIN_CREDITS_PREFLIGHT = 0.02; // Minimum credits to start a chat
const HISTORICAL_IMAGE_MESSAGE_LIMIT = 2;

function normalizeAttachments(value: unknown, ownerId: string): ChatImageAttachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Attachments must be an array.');
  if (value.length > CHAT_IMAGE_MAX_COUNT) {
    throw new Error(`You can attach up to ${CHAT_IMAGE_MAX_COUNT} images.`);
  }

  const imagekitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, '');
  if (!imagekitEndpoint && value.length > 0) {
    throw new Error('Image uploads are not configured.');
  }
  const ownedPath = `${imagekitEndpoint}/chat-images/${ownerId}/`;

  return value.map((attachment) => {
    if (!attachment || typeof attachment !== 'object') {
      throw new Error('Invalid image attachment.');
    }

    const candidate = attachment as Record<string, unknown>;
    const mimeType = typeof candidate.mimeType === 'string' ? candidate.mimeType : '';
    const url = typeof candidate.url === 'string' ? candidate.url : '';
    const thumbnailUrl = typeof candidate.thumbnailUrl === 'string' ? candidate.thumbnailUrl : undefined;
    const size = typeof candidate.size === 'number' ? candidate.size : Number.NaN;

    if (
      candidate.type !== 'image' ||
      typeof candidate.fileId !== 'string' ||
      typeof candidate.name !== 'string' ||
      !CHAT_IMAGE_MIME_TYPES.includes(mimeType as (typeof CHAT_IMAGE_MIME_TYPES)[number]) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > CHAT_IMAGE_MAX_BYTES ||
      !url.startsWith(ownedPath) ||
      (thumbnailUrl && !thumbnailUrl.startsWith(imagekitEndpoint!))
    ) {
      throw new Error('Invalid image attachment.');
    }

    return {
      type: 'image',
      fileId: candidate.fileId,
      name: candidate.name,
      url,
      thumbnailUrl,
      mimeType,
      size,
      width: typeof candidate.width === 'number' ? candidate.width : undefined,
      height: typeof candidate.height === 'number' ? candidate.height : undefined,
    };
  });
}

function buildUserContent(
  text: string,
  attachments: ChatImageAttachment[]
): Anthropic.ContentBlockParam[] | string {
  if (attachments.length === 0) return text;

  return [
    ...attachments.map((attachment): Anthropic.ImageBlockParam => ({
      type: 'image',
      source: { type: 'url', url: attachment.url },
    })),
    { type: 'text', text },
  ];
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const conversationId = body.conversationId;
    let attachments: ChatImageAttachment[];

    try {
      attachments = normalizeAttachments(body.attachments, user.mongoId);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid attachments' }),
        { status: 400 }
      );
    }

    if (!message && attachments.length === 0) {
      return new Response(JSON.stringify({ error: 'Message or image is required' }), { status: 400 });
    }

    const modelMessage = message || 'Please analyse the attached image or images.';
    const conversationTitle = message || `Image: ${attachments[0].name}`;

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
          title: conversationTitle.slice(0, 100),
        });
      }
    }

    // Load previous messages for this conversation
    const previousMessages = await ChatMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .select('role content attachments')
      .lean() as any[];

    const recentImageMessageIndexes = new Set(
      previousMessages
        .map((msg, index) => ({ index, hasImages: Array.isArray(msg.attachments) && msg.attachments.length > 0 }))
        .filter(({ hasImages }) => hasImages)
        .slice(-HISTORICAL_IMAGE_MESSAGE_LIMIT)
        .map(({ index }) => index)
    );

    // Build messages array for Claude
    const claudeMessages: Anthropic.MessageParam[] = previousMessages.map((msg: any, index) => {
      const role = msg.role === 'user' ? 'user' as const : 'assistant' as const;
      const previousAttachments = Array.isArray(msg.attachments) ? msg.attachments : [];
      const attachmentLabel = previousAttachments.length > 0
        ? `[Previously attached images: ${previousAttachments.map((attachment: ChatImageAttachment) => attachment.name).join(', ')}]`
        : '';
      return {
        role,
        content: role === 'user' && recentImageMessageIndexes.has(index)
          ? buildUserContent(msg.content || 'Please analyse the attached image or images.', previousAttachments)
          : [msg.content, attachmentLabel].filter(Boolean).join('\n'),
      };
    });

    // Load context (brand settings, 7-day history, Mem0 memories)
    // The full current conversation is already in claudeMessages. Avoid injecting a
    // second, truncated copy of it through the rolling seven-day context.
    const context = await loadAgentContext(user, modelMessage, { includeChatHistory: false });

    // Add current message with injected context
    const contextualMessage = buildContextualMessage(modelMessage, context);
    claudeMessages.push({ role: 'user', content: buildUserContent(contextualMessage, attachments) });

    const systemPrompt = buildSystemPrompt(context, { deepResearchEnabled: attachments.length === 0 });

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
        const taskPlanRequired = requiresResearchPlan(modelMessage);

        // Save user message immediately so it's never lost
        const savedUserMessage = await ChatMessage.create({
          conversationId: conv._id,
          owner: user.mongoId,
          date: today,
          role: 'user',
          content: message,
          attachments,
        });

        let assistantContent = '';
        let assistantMsgId: string | null = null;
        let lastSavedLength = 0;

        const toolCtx: ToolContext = {
          userId: user.mongoId,
          clerkId: user.clerkId,
          sendEvent: send,
          dataChanged,
          toolCalls,
          deepResearch: attachments.length === 0 ? {
            start: async (objective) => {
              const started = await startDeepResearchRun({
                ownerId: user.mongoId,
                ownerClerkId: user.clerkId,
                conversationId: conv._id.toString(),
                date: today,
                objective,
                availableCredits: user.credits,
                onAssistantCreated: (messageId) => {
                  assistantMsgId = messageId;
                },
              });
              assistantMsgId = started.assistantMessageId;
              return started;
            },
          } : undefined,
        };

        const tools = buildTools(toolCtx);

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

        // Send heartbeat every 15s to keep the connection alive during long tool calls
        const heartbeatInterval = setInterval(() => {
          send('heartbeat', { ts: Date.now() });
        }, 15000);

        try {
          const client = new Anthropic({ maxRetries: 5 });
          const runner = client.beta.messages.toolRunner({
            model: 'claude-sonnet-4-6',
            max_tokens: 32000,
            system: systemPrompt,
            tools,
            messages: claudeMessages,
            stream: true,
            max_iterations: MAX_AGENT_ITERATIONS,
            compactionControl: {
              enabled: true,
              contextTokenThreshold: 100000,
              summaryPrompt: AGENT_COMPACTION_PROMPT,
            },
          });

          // Track token usage across all toolRunner iterations
          const tokenUsage = { inputTokens: 0, outputTokens: 0 };
          let completionCorrections = 0;
          let lastStopReason: string | null = null;

          for await (const messageStream of runner) {
            let iterationText = '';
            for await (const event of messageStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                iterationText += event.delta.text;
              }
              // Accumulate token usage from each iteration
              if (event.type === 'message_start' && event.message?.usage) {
                tokenUsage.inputTokens += event.message.usage.input_tokens || 0;
              }
              if (event.type === 'message_delta' && (event as any).usage) {
                tokenUsage.outputTokens += (event as any).usage.output_tokens || 0;
              }
            }
            const completedMessage = await messageStream.finalMessage();
            lastStopReason = completedMessage.stop_reason;
            const delegatedResearch = Boolean(toolCtx.deepResearch?.startedRunId);
            const completionIssue = completedMessage.stop_reason === 'max_tokens'
              ? 'The response hit the output-token limit before it could finish.'
              : completedMessage.stop_reason === 'tool_use'
                ? null
                : getTaskPlanCompletionIssue(taskPlanRequired && !delegatedResearch, toolCtx.taskPlan);

            if (completionIssue && completionCorrections < MAX_COMPLETION_CORRECTIONS) {
              completionCorrections++;
              runner.pushMessages({
                role: 'user',
                content: buildCompletionCorrection(completionIssue),
              });
              send('task_status', {
                status: 'continuing',
                issue: completionIssue,
                correction: completionCorrections,
              });
              continue;
            }
            if (completionIssue) {
              throw new Error(`Agent could not complete the requested work: ${completionIssue}`);
            }

            if (iterationText) {
              send('text_delta', { text: iterationText });
              assistantContent += iterationText;
            }

            // Flush after each toolRunner iteration (after tool calls complete)
            await flushAssistantContent();
          }

          if (lastStopReason === 'tool_use') {
            throw new Error(`Agent reached the ${MAX_AGENT_ITERATIONS}-iteration safety limit before completing the task.`);
          }

          clearInterval(flushInterval);
          clearInterval(heartbeatInterval);

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
              title: conversationTitle.slice(0, 100),
            });
          }

          send('done', {
            conversationId: conv._id.toString(),
            deepResearchRunId: toolCtx.deepResearch?.startedRunId,
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
                generateChatEmbedding(modelMessage),
                generateChatEmbedding(assistantContent),
              ]);

              const assistantMsg = await ChatMessage.findOne({
                conversationId: conv._id,
                role: 'assistant',
                content: assistantContent,
              }).sort({ createdAt: -1 });

              if (userEmb) {
                await ChatMessage.updateOne(
                  { _id: savedUserMessage._id },
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
              await addMemory(memClient, user.clerkId, modelMessage, assistantContent);
            } catch (err) {
              console.error('[Chat] Mem0 storage failed:', err);
            }
          })();

        } catch (error: any) {
          clearInterval(flushInterval);
          clearInterval(heartbeatInterval);
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
