import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
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

export async function executeAgent(options: {
  user: CurrentUser;
  message: string;
  maxCredits?: number;
}): Promise<ExecuteAgentResult> {
  const { user, message, maxCredits = 1.0 } = options;

  await dbConnect();

  if (user.credits < CREDITS_PER_EXCHANGE) {
    throw new Error('Insufficient credits');
  }

  const context = await loadAgentContext(user, message);
  const systemPrompt = buildSystemPrompt(context);
  const contextualMessage = buildContextualMessage(message, context);

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

  for await (const messageStream of runner) {
    // Each iteration is one agent turn (message + tool calls + response)
    totalCreditsUsed += CREDITS_PER_EXCHANGE;

    for (const block of messageStream.content) {
      if (block.type === 'text') {
        assistantContent += block.text;
      }
    }

    // Stop if we've hit the credit cap
    if (totalCreditsUsed >= maxCredits) {
      break;
    }
  }

  // Deduct credits
  if (totalCreditsUsed > 0) {
    await User.findByIdAndUpdate(user.mongoId, {
      $inc: { credits: -totalCreditsUsed, lifetimeCreditsUsed: totalCreditsUsed },
    });
  }

  return {
    response: assistantContent,
    toolCalls,
    dataChanged: Array.from(new Set(dataChanged)),
    creditsUsed: totalCreditsUsed,
  };
}
