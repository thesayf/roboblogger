import assert from 'node:assert/strict';
import { calculateChatCredits } from '../lib/billing/credit-service';
import { normalizeChatMode } from '../lib/chat/chat-mode';
import {
  executeManualToolCalls,
  getAgentProviderConfig,
  toManualApiTools,
} from '../lib/agent/provider';
import { serializeDeepResearchRun } from '../lib/deep-research/serialize';

async function run() {
  assert.equal(normalizeChatMode('efficient'), 'efficient');
  assert.equal(normalizeChatMode('premium'), 'premium');
  assert.equal(normalizeChatMode('unexpected'), 'premium');

  const efficient = getAgentProviderConfig('efficient');
  const premium = getAgentProviderConfig('premium');
  assert.equal(efficient.provider, 'deepseek');
  assert.equal(premium.provider, 'anthropic');
  assert.match(efficient.model, /deepseek/i);
  assert.match(premium.model, /claude/i);

  const fakeTool = {
    name: 'echo_tool',
    description: 'Echo a value.',
    input_schema: { type: 'object', properties: { value: { type: 'string' } } },
    parse: (input: unknown) => input,
    run: async (input: { value: string }) => JSON.stringify({ echoed: input.value }),
  };
  assert.deepEqual(toManualApiTools([fakeTool]), [{
    name: 'echo_tool',
    description: 'Echo a value.',
    input_schema: fakeTool.input_schema,
  }]);

  const [toolResult, missingToolResult] = await executeManualToolCalls([fakeTool], [
    { id: 'call-1', name: 'echo_tool', input: { value: 'works' } },
    { id: 'call-2', name: 'missing_tool', input: {} },
  ]);
  assert.equal(JSON.parse(toolResult.content).echoed, 'works');
  assert.equal(missingToolResult.is_error, true);

  const efficientBilling = calculateChatCredits({
    model: efficient.model,
    inputTokens: 100_000,
    outputTokens: 20_000,
    toolCalls: [],
    pricing: efficient.pricing,
  });
  const premiumBilling = calculateChatCredits({
    model: premium.model,
    inputTokens: 100_000,
    outputTokens: 20_000,
    toolCalls: [],
    pricing: premium.pricing,
  });
  assert.ok(efficientBilling.modelCost < premiumBilling.modelCost);
  assert.ok(efficientBilling.credits < premiumBilling.credits);

  const snapshot = serializeDeepResearchRun({
    _id: { toString: () => 'research-1' },
    objective: 'Research a market deeply.',
    mode: 'efficient',
    provider: 'deepseek',
    modelName: 'deepseek-v4-pro',
    status: 'queued',
    phase: 'queued',
    phaseDetail: 'Research queued',
    progress: 2,
    creditsUsed: 0,
    createdAt: new Date('2026-07-18T12:00:00.000Z'),
  });
  assert.equal(snapshot.mode, 'efficient');
  assert.equal(snapshot.provider, 'deepseek');
  assert.equal(snapshot.model, 'deepseek-v4-pro');

  console.log('Chat mode tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
