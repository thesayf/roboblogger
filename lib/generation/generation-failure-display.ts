import type { GenerationProvider } from './generation-mode';

interface GenerationFailureTopic {
  generationProvider?: GenerationProvider;
  errorMessage?: string;
  failureReason?: string;
  generationMetadata?: {
    requestedProvider?: GenerationProvider;
    attempts?: Array<{ provider?: GenerationProvider; error?: string }>;
  } | null;
}

export interface GenerationFailureDisplay {
  summary: string;
  detail: string;
  failedProvider?: GenerationProvider;
  currentProvider: GenerationProvider;
  providerChanged: boolean;
}

function inferProvider(topic: GenerationFailureTopic, detail: string): GenerationProvider | undefined {
  const attempts = topic.generationMetadata?.attempts || [];
  const latestAttempt = attempts[attempts.length - 1];
  if (latestAttempt?.provider) return latestAttempt.provider;
  if (topic.generationMetadata?.requestedProvider) return topic.generationMetadata.requestedProvider;

  if (/anthropic|claude/i.test(detail)) return 'anthropic';
  if (/deepseek|dseek/i.test(detail)) return 'deepseek';

  // This message came from the retired Claude-only workflow.
  if (/workflow failed.*content generation failed/i.test(detail)) return 'anthropic';
  return undefined;
}

export function getGenerationFailureDisplay(
  topic: GenerationFailureTopic,
): GenerationFailureDisplay {
  const detail = topic.errorMessage || topic.failureReason || 'Generation failed';
  const currentProvider = topic.generationProvider || 'deepseek';
  const failedProvider = inferProvider(topic, detail);
  const providerChanged = Boolean(failedProvider && failedProvider !== currentProvider);

  let message: string;
  if (/credit balance is too low/i.test(detail) && failedProvider === 'anthropic') {
    message = 'Claude could not run because the Anthropic API balance was empty.';
  } else if (/workflow failed.*content generation failed/i.test(detail)) {
    message = 'The retired Claude-only workflow failed before provider-aware generation was enabled.';
  } else if (/completed without evaluating or saving/i.test(detail)) {
    message = 'The model stopped before evaluating and saving the post.';
  } else if (/quality evaluation did not pass/i.test(detail)) {
    message = 'The draft did not pass the configured quality evaluation.';
  } else {
    message = detail.length > 180 ? `${detail.slice(0, 177)}...` : detail;
  }

  const failedLabel = failedProvider === 'anthropic'
    ? 'Premium'
    : failedProvider === 'deepseek'
      ? 'Efficient'
      : 'previous';
  const currentLabel = currentProvider === 'anthropic' ? 'Premium' : 'Efficient';
  const summary = providerChanged
    ? `Previous ${failedLabel} attempt failed. Current mode is ${currentLabel}; retry will use ${currentProvider === 'anthropic' ? 'Claude' : 'DeepSeek'}.`
    : message;

  return {
    summary,
    detail: message,
    failedProvider,
    currentProvider,
    providerChanged,
  };
}
