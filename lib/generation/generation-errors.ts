import type { BlogEvaluationRecord } from './blog-evaluation';

interface FailedProviderAttempt {
  provider: string;
  model: string;
  error?: string;
}

const NON_RETRYABLE_ERROR_PATTERNS = [
  /credit balance is too low/i,
  /api key is not configured/i,
  /authentication_error/i,
  /invalid x-api-key/i,
  /invalid api key/i,
  /permission_error/i,
];

export function isRetryableGenerationError(error: string): boolean {
  return !NON_RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(error));
}

export function describeUnsavedGenerationAttempt(
  evaluations: BlogEvaluationRecord[],
): string {
  const latest = evaluations.at(-1);

  if (!latest) {
    return 'Agent completed without evaluating or saving a blog post.';
  }

  if (latest.passed) {
    return 'Quality evaluation passed, but the agent did not save the approved blog post.';
  }

  const issues = latest.revisionInstructions.length > 0
    ? latest.revisionInstructions.join('; ')
    : 'The draft did not meet the quality threshold.';

  return `Quality evaluation did not pass after ${evaluations.length} attempt${evaluations.length === 1 ? '' : 's'}: ${issues}`;
}

export function summarizeGenerationFailures(attempts: FailedProviderAttempt[]): string {
  return attempts
    .map(attempt => `${attempt.provider}/${attempt.model}: ${attempt.error || 'Generation failed'}`)
    .join(' | ');
}
