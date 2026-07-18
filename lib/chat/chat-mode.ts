export type ChatMode = 'efficient' | 'premium';

export const DEFAULT_CHAT_MODE: ChatMode = 'premium';

export const CHAT_MODE_OPTIONS: Array<{
  value: ChatMode;
  label: string;
  description: string;
}> = [
  {
    value: 'efficient',
    label: 'Efficient',
    description: 'DeepSeek V4 Pro',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Claude Sonnet 4.6',
  },
];

export function normalizeChatMode(value: unknown): ChatMode {
  return value === 'efficient' ? 'efficient' : DEFAULT_CHAT_MODE;
}
