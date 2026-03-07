import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import RoutineExecution from '@/models/RoutineExecution';
import { loadAgentContext } from './context-loader';
import { buildSystemPrompt, buildContextualMessage } from './system-prompt';
import { buildTools } from './tools';
import { ToolContext, ToolCallInfo } from './types';
import { CurrentUser } from '@/lib/auth/getCurrentUser';

const CREDITS_PER_EXCHANGE = 0.1;

export interface ExecuteAgentResult {
  response: string;
  toolCalls: ToolCallInfo[];
  dataChanged: string[];
  creditsUsed: number;
}

/**
 * Helper to push a log entry and update phase on a RoutineExecution record.
 * Fire-and-forget — errors are swallowed to avoid breaking the agent loop.
 */
async function logProgress(
  executionId: string | undefined,
  phase: string,
  logEntry: { type: string; message: string },
  phaseDetail?: string,
) {
  if (!executionId) return;
  try {
    const update: any = {
      $push: { liveLog: { timestamp: new Date(), ...logEntry } },
      $set: { phase },
    };
    if (phaseDetail !== undefined) {
      update.$set.phaseDetail = phaseDetail;
    }
    await RoutineExecution.findByIdAndUpdate(executionId, update);
  } catch (err) {
    console.error('[Agent] logProgress DB write failed:', err);
  }
}

export async function executeAgent(options: {
  user: CurrentUser;
  message: string;
  maxCredits?: number;
  executionId?: string;
}): Promise<ExecuteAgentResult> {
  const { user, message, maxCredits = 1.0, executionId } = options;
  const tag = executionId ? `[Agent:${executionId.slice(-6)}]` : '[Agent]';
  const startTime = Date.now();

  console.log(`${tag} ── START ──────────────────────────────────`);
  console.log(`${tag} User: ${user.clerkId} (mongo: ${user.mongoId})`);
  console.log(`${tag} Credits available: ${user.credits}, max per run: ${maxCredits}`);
  console.log(`${tag} Message (first 200 chars): ${message.slice(0, 200)}`);

  await dbConnect();

  if (user.credits < CREDITS_PER_EXCHANGE) {
    console.error(`${tag} BLOCKED: insufficient credits (${user.credits} < ${CREDITS_PER_EXCHANGE})`);
    await logProgress(executionId, 'failed', {
      type: 'error',
      message: 'Insufficient credits to start',
    });
    throw new Error('Insufficient credits');
  }

  // Phase: loading context
  console.log(`${tag} Phase: loading_context`);
  await logProgress(executionId, 'loading_context', {
    type: 'phase',
    message: 'Loading brand settings, history, and context...',
  });

  const contextStart = Date.now();
  const context = await loadAgentContext(user, message);
  console.log(`${tag} Context loaded in ${Date.now() - contextStart}ms`);
  console.log(`${tag}   brand: ${context.brandSettings?.blogName || 'none'}`);
  console.log(`${tag}   recentPosts: ${context.recentPosts?.length || 0}`);
  console.log(`${tag}   queueStats: ${JSON.stringify(context.queueStats || {})}`);

  const systemPrompt = buildSystemPrompt(context);
  const contextualMessage = buildContextualMessage(message, context);
  console.log(`${tag} System prompt length: ${systemPrompt.length} chars`);
  console.log(`${tag} Contextual message length: ${contextualMessage.length} chars`);

  const dataChanged: string[] = [];
  const toolCalls: ToolCallInfo[] = [];

  const toolCtx: ToolContext = {
    userId: user.mongoId,
    clerkId: user.clerkId,
    sendEvent: () => {},
    dataChanged,
    toolCalls,
  };

  const tools = buildTools(toolCtx);
  console.log(`${tag} Tools available: ${tools.map((t: any) => t.name).join(', ')}`);

  // Phase: thinking
  console.log(`${tag} Phase: thinking — sending first request to Claude`);
  await logProgress(executionId, 'thinking', {
    type: 'phase',
    message: 'Agent is analyzing the request...',
  });

  const client = new Anthropic({ maxRetries: 5 });
  const runner = client.beta.messages.toolRunner({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    tools,
    messages: [{ role: 'user', content: contextualMessage }],
    stream: false,
  });

  let assistantContent = '';
  let totalCreditsUsed = 0;
  let turnNumber = 0;

  console.log(`${tag} Entering toolRunner loop...`);

  for await (const messageStream of runner) {
    turnNumber++;
    totalCreditsUsed += CREDITS_PER_EXCHANGE;
    const turnStart = Date.now();

    console.log(`${tag} ── Turn ${turnNumber} ──────────────────────────`);
    console.log(`${tag}   stop_reason: ${messageStream.stop_reason}`);
    console.log(`${tag}   content blocks: ${messageStream.content.length}`);
    console.log(`${tag}   credits so far: ${totalCreditsUsed.toFixed(1)}/${maxCredits}`);

    // With stream: false, the toolRunner yields a BetaMessage per turn.
    // tool_use blocks mean tools were ALREADY executed by the runner internally.
    const toolUseBlocks = messageStream.content.filter((b: any) => b.type === 'tool_use');
    const textBlocks = messageStream.content.filter((b: any) => b.type === 'text');
    const prevToolCount = toolCalls.length - toolUseBlocks.length;

    if (toolUseBlocks.length > 0) {
      console.log(`${tag}   tool_use blocks: ${toolUseBlocks.length}`);
      for (let i = 0; i < toolUseBlocks.length; i++) {
        const block = toolUseBlocks[i] as any;
        const tc = toolCalls[prevToolCount + i];
        const inputPreview = JSON.stringify(block.input).slice(0, 200);
        const resultPreview = tc?.result ? String(tc.result).slice(0, 200) : 'n/a';
        const success = tc ? tc.success !== false : 'unknown';

        console.log(`${tag}   tool[${i}]: ${block.name}`);
        console.log(`${tag}     input: ${inputPreview}`);
        console.log(`${tag}     success: ${success}`);
        console.log(`${tag}     result: ${resultPreview}`);

        const resultStr = tc
          ? `${tc.name}: ${tc.success !== false ? 'done' : 'failed'}`
          : `${block.name}: executed`;

        await logProgress(executionId, 'calling_tool', {
          type: 'tool_end',
          message: resultStr,
        }, block.name);
      }
    }

    // Process text blocks
    for (const block of textBlocks) {
      const text = (block as any).text;
      assistantContent += text;
      console.log(`${tag}   text (first 300 chars): ${text.slice(0, 300)}`);
    }

    console.log(`${tag}   turn ${turnNumber} completed in ${Date.now() - turnStart}ms`);

    // If there are more turns coming, log that we're thinking again
    if (totalCreditsUsed < maxCredits && messageStream.stop_reason === 'tool_use') {
      console.log(`${tag}   → more turns needed (stop_reason=tool_use)`);
      await logProgress(executionId, 'thinking', {
        type: 'phase',
        message: `Processing results (turn ${turnNumber})...`,
      });
    }

    // Stop if we've hit the credit cap
    if (totalCreditsUsed >= maxCredits) {
      console.log(`${tag}   ⚠ Credit limit reached (${totalCreditsUsed} >= ${maxCredits}), breaking loop`);
      await logProgress(executionId, 'thinking', {
        type: 'text',
        message: 'Credit limit reached, finishing up...',
      });
      break;
    }
  }

  // Deduct credits
  if (totalCreditsUsed > 0) {
    console.log(`${tag} Deducting ${totalCreditsUsed.toFixed(1)} credits from user ${user.mongoId}`);
    await User.findByIdAndUpdate(user.mongoId, {
      $inc: { credits: -totalCreditsUsed, lifetimeCreditsUsed: totalCreditsUsed },
    });
  }

  // Phase: completed
  await logProgress(executionId, 'completed', {
    type: 'phase',
    message: `Completed with ${toolCalls.length} tool calls, ${totalCreditsUsed.toFixed(1)} credits used`,
  });

  const elapsed = Date.now() - startTime;
  console.log(`${tag} ── DONE ───────────────────────────────────`);
  console.log(`${tag} Turns: ${turnNumber}`);
  console.log(`${tag} Tool calls: ${toolCalls.length} (${toolCalls.map(tc => tc.name).join(', ') || 'none'})`);
  console.log(`${tag} Data changed: ${dataChanged.length > 0 ? dataChanged.join(', ') : 'none'}`);
  console.log(`${tag} Credits used: ${totalCreditsUsed.toFixed(1)}`);
  console.log(`${tag} Response length: ${assistantContent.length} chars`);
  console.log(`${tag} Total elapsed: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
  console.log(`${tag} ────────────────────────────────────────────`);

  return {
    response: assistantContent,
    toolCalls,
    dataChanged: Array.from(new Set(dataChanged)),
    creditsUsed: totalCreditsUsed,
  };
}
