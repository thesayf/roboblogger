/**
 * AI Provider Types and Interfaces
 * Common types for all AI providers (Perplexity, etc.)
 */

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any;
}

export abstract class AIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract generateCompletion(options: AICompletionOptions): Promise<AIResponse>;
  abstract getName(): string;
}
