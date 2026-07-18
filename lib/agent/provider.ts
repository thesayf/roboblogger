import Anthropic from '@anthropic-ai/sdk';
import type { ChatMode } from '@/lib/chat/chat-mode';

export interface AgentProviderConfig {
  mode: ChatMode;
  provider: 'anthropic' | 'deepseek';
  model: string;
  pricing: {
    input: number;
    output: number;
  };
}

export function getAgentProviderConfig(mode: ChatMode): AgentProviderConfig {
  if (mode === 'efficient') {
    return {
      mode,
      provider: 'deepseek',
      model: process.env.DEEPSEEK_CHAT_MODEL || process.env.DEEPSEEK_GENERATION_MODEL || 'deepseek-v4-pro',
      pricing: { input: 0.435, output: 0.87 },
    };
  }

  return {
    mode,
    provider: 'anthropic',
    model: process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-4-6',
    pricing: { input: 3, output: 15 },
  };
}

export function createAgentClient(config: AgentProviderConfig): Anthropic {
  if (config.provider === 'deepseek') {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
    return new Anthropic({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/anthropic',
      maxRetries: 5,
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ maxRetries: 5 });
}

export function toManualApiTools(tools: any[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));
}

export async function executeManualToolCalls(tools: any[], toolUseBlocks: any[]) {
  return Promise.all(toolUseBlocks.map(async (block) => {
    const tool = tools.find((candidate) => candidate.name === block.name);
    if (!tool) {
      return {
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: `Error: Unknown tool ${block.name}`,
        is_error: true,
      };
    }

    try {
      const result = await tool.run(tool.parse(block.input));
      return {
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      };
    } catch (error) {
      return {
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true,
      };
    }
  }));
}
