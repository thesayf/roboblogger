export type GenerationProvider = 'anthropic' | 'deepseek';
export type GenerationMode = 'efficient' | 'premium';

export const DEFAULT_GENERATION_MODE: GenerationMode = 'efficient';

export const GENERATION_MODE_OPTIONS: Array<{
  value: GenerationMode;
  label: string;
  description: string;
  provider: GenerationProvider;
}> = [
  {
    value: 'efficient',
    label: 'Efficient',
    description: 'DeepSeek V4 Pro',
    provider: 'deepseek',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Claude Opus 4.6 (Anthropic credits required)',
    provider: 'anthropic',
  },
];

export function generationModeToProvider(mode?: GenerationMode): GenerationProvider {
  return mode === 'premium' ? 'anthropic' : 'deepseek';
}

export function generationProviderToMode(provider?: GenerationProvider): GenerationMode {
  return provider === 'anthropic' ? 'premium' : 'efficient';
}
