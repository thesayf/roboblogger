import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../lib/agent/system-prompt';
import { buildDeepResearchTools } from '../lib/agent/tools/deep-research-tools';
import type { AgentContext, ToolContext } from '../lib/agent/types';

const agentContext: AgentContext = {
  userId: 'routing-eval-user',
  mongoId: 'routing-eval-user',
  brandSettings: {
    blogName: 'Vibeblogger',
    targetAudience: 'technical founders and solopreneurs',
    industryNiche: 'startup marketing and SEO',
  },
  recentPosts: [],
  queueStats: { pending: 0, generating: 0, completed: 0, failed: 0 },
  credits: 100,
  chatHistory: '',
  memories: '',
};

const cases = [
  {
    name: 'explicit thorough research',
    prompt: 'Research this properly and take your time. I want a sourced analysis of the UK market for automated startup SEO blogs, including competitors, pricing, keyword demand, and the best positioning opportunity.',
    shouldDelegate: true,
  },
  {
    name: 'large evidence brief',
    prompt: 'Produce a comprehensive comparison of ten founder-content categories using real keyword volume, organic difficulty, recent trends, competitor coverage, and Search Console evidence, then recommend the three strongest opportunities with limitations.',
    shouldDelegate: true,
  },
  {
    name: 'ordinary explanation',
    prompt: 'What does top of funnel mean?',
    shouldDelegate: false,
  },
];

async function evaluateCase(client: Anthropic, testCase: typeof cases[number]) {
  let delegatedObjective = '';
  const toolContext: ToolContext = {
    userId: 'routing-eval-user',
    clerkId: 'routing-eval-clerk',
    sendEvent: () => {},
    dataChanged: [],
    toolCalls: [],
    deepResearch: {
      start: async (objective) => {
        delegatedObjective = objective;
        return {
          workflowRunId: 'eval-workflow',
          conversationId: 'eval-conversation',
          assistantMessageId: 'eval-assistant',
          run: {
            id: 'eval-run',
            objective,
            mode: 'premium',
            provider: 'anthropic',
            model: 'claude-sonnet-4-6',
            status: 'queued',
            phase: 'queued',
            phaseDetail: 'Research queued',
            progress: 0,
            creditsUsed: 0,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
  };

  const runner = client.beta.messages.toolRunner({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    max_iterations: 3,
    system: buildSystemPrompt(agentContext, { deepResearchEnabled: true }),
    tools: buildDeepResearchTools(toolContext),
    messages: [{ role: 'user', content: testCase.prompt }],
  });

  for await (const _message of runner) {
    // The tool context records the routing decision; final prose is not graded here.
  }

  const delegated = toolContext.toolCalls.some(
    (call) => call.name === 'start_deep_research' && call.success,
  );
  assert.equal(
    delegated,
    testCase.shouldDelegate,
    `${testCase.name}: expected delegation=${testCase.shouldDelegate}, received ${delegated}`,
  );
  if (delegated) {
    assert(delegatedObjective.length >= 15, `${testCase.name}: delegated objective was incomplete`);
  }
  console.log(`PASS ${testCase.name}: ${delegated ? 'delegated' : 'answered in chat'}`);
}

async function main() {
  const client = new Anthropic({ maxRetries: 2 });
  for (const testCase of cases) {
    await evaluateCase(client, testCase);
  }
  console.log('Deep research routing eval passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
