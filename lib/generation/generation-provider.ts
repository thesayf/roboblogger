import Anthropic from '@anthropic-ai/sdk';
import type { GenerationProvider } from './generation-mode';

export type { GenerationProvider } from './generation-mode';

export interface GenerationProviderConfig {
  provider: GenerationProvider;
  model: string;
  maxTurns: number;
  pricing: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
}

export interface GenerationTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

const DEFAULT_MAX_TURNS = 50;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveGenerationProvider(override?: GenerationProvider): GenerationProvider {
  if (override) return override;

  return process.env.BLOG_GENERATION_PROVIDER?.toLowerCase() === 'deepseek'
    ? 'deepseek'
    : 'anthropic';
}

export function getGenerationProviderConfig(provider: GenerationProvider): GenerationProviderConfig {
  if (provider === 'deepseek') {
    return {
      provider,
      model: process.env.DEEPSEEK_GENERATION_MODEL || 'deepseek-v4-pro',
      maxTurns: positiveInteger(process.env.DEEPSEEK_GENERATION_MAX_TURNS, DEFAULT_MAX_TURNS),
      pricing: {
        input: 0.435,
        output: 0.87,
        cacheRead: 0.003625,
        cacheWrite: 0.435,
      },
    };
  }

  return {
    provider,
    model: process.env.ANTHROPIC_GENERATION_MODEL || 'claude-opus-4-6',
    maxTurns: positiveInteger(process.env.ANTHROPIC_GENERATION_MAX_TURNS, DEFAULT_MAX_TURNS),
    pricing: {
      input: 5,
      output: 25,
      cacheRead: 0.5,
      cacheWrite: 6.25,
    },
  };
}

export function getGenerationProviderAttempts(
  requestedProvider: GenerationProvider,
): GenerationProviderConfig[] {
  const primary = getGenerationProviderConfig(requestedProvider);
  const fallbackEnabled = process.env.DEEPSEEK_FALLBACK_TO_CLAUDE !== 'false';

  if (requestedProvider !== 'deepseek' || !fallbackEnabled) {
    return [primary];
  }

  return [primary, getGenerationProviderConfig('anthropic')];
}

export function createGenerationClient(config: GenerationProviderConfig): Anthropic {
  if (config.provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

    return new Anthropic({
      apiKey,
      baseURL: 'https://api.deepseek.com/anthropic',
      maxRetries: 5,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  return new Anthropic({ maxRetries: 5 });
}

export function emptyGenerationTokenUsage(): GenerationTokenUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  };
}

export function addGenerationTokenUsage(
  total: GenerationTokenUsage,
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  },
): void {
  if (!usage) return;

  total.inputTokens += usage.input_tokens || 0;
  total.outputTokens += usage.output_tokens || 0;
  total.cacheReadInputTokens += usage.cache_read_input_tokens || 0;
  total.cacheCreationInputTokens += usage.cache_creation_input_tokens || 0;
}

export function estimateGenerationModelCost(
  config: GenerationProviderConfig,
  usage: GenerationTokenUsage,
): number {
  const cost = (
    (usage.inputTokens * config.pricing.input)
    + (usage.outputTokens * config.pricing.output)
    + (usage.cacheReadInputTokens * config.pricing.cacheRead)
    + (usage.cacheCreationInputTokens * config.pricing.cacheWrite)
  ) / 1_000_000;

  return Math.round(cost * 1_000_000) / 1_000_000;
}
