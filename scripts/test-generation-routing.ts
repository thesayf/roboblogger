import assert from 'node:assert/strict';
import {
  getGenerationProviderAttempts,
} from '../lib/generation/generation-provider';
import { getGenerationFailureDisplay } from '../lib/generation/generation-failure-display';

const originalFallback = process.env.DEEPSEEK_FALLBACK_TO_CLAUDE;

try {
  delete process.env.DEEPSEEK_FALLBACK_TO_CLAUDE;
  assert.deepEqual(
    getGenerationProviderAttempts('deepseek').map(attempt => attempt.provider),
    ['deepseek'],
    'Efficient mode must not silently use Claude by default',
  );

  process.env.DEEPSEEK_FALLBACK_TO_CLAUDE = 'true';
  assert.deepEqual(
    getGenerationProviderAttempts('deepseek').map(attempt => attempt.provider),
    ['deepseek', 'anthropic'],
    'Claude fallback should remain available when explicitly enabled',
  );

  assert.deepEqual(
    getGenerationProviderAttempts('anthropic').map(attempt => attempt.provider),
    ['anthropic'],
    'Premium mode should use only Anthropic',
  );

  const staleClaudeFailure = getGenerationFailureDisplay({
    generationProvider: 'deepseek',
    errorMessage: 'Your credit balance is too low to access the Anthropic API.',
  });
  assert.equal(staleClaudeFailure.failedProvider, 'anthropic');
  assert.equal(staleClaudeFailure.providerChanged, true);
  assert.match(staleClaudeFailure.summary, /retry will use DeepSeek/);

  const currentDeepSeekFailure = getGenerationFailureDisplay({
    generationProvider: 'deepseek',
    generationMetadata: {
      requestedProvider: 'deepseek',
      attempts: [{ provider: 'deepseek', error: 'Request timed out' }],
    },
    errorMessage: 'Request timed out',
  });
  assert.equal(currentDeepSeekFailure.providerChanged, false);
  assert.equal(currentDeepSeekFailure.summary, 'Request timed out');

  console.log('Generation routing tests passed.');
} finally {
  if (originalFallback === undefined) {
    delete process.env.DEEPSEEK_FALLBACK_TO_CLAUDE;
  } else {
    process.env.DEEPSEEK_FALLBACK_TO_CLAUDE = originalFallback;
  }
}
