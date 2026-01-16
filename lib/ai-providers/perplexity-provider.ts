/**
 * Perplexity Provider Implementation
 * Uses Perplexity Sonar for real-time web search capabilities
 */

import { AIProvider, AIProviderConfig, AICompletionOptions, AIResponse } from './types';

export type PerplexityModel = 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro';

export interface PerplexityConfig extends AIProviderConfig {
  model?: string;
}

export interface PerplexityCitation {
  url: string;
  text?: string;
}

export interface PerplexityResponse extends AIResponse {
  citations?: PerplexityCitation[];
}

export class PerplexityProvider extends AIProvider {
  private baseUrl = 'https://api.perplexity.ai';

  constructor(config: PerplexityConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error('Perplexity API key is required');
    }
  }

  getName(): string {
    return 'perplexity';
  }

  async generateCompletion(options: AICompletionOptions): Promise<PerplexityResponse> {
    const model = this.config.model || 'sonar-pro';
    console.log(`[Perplexity-${model}] Generating completion with web search`);
    console.log(`[Perplexity-${model}] Prompt length: ${options.prompt.length}`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI research assistant. Provide accurate, well-sourced information with specific details. Always cite your sources when possible.',
            },
            {
              role: 'user',
              content: options.prompt,
            },
          ],
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.2,
          return_citations: true,
          return_related_questions: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Perplexity-${model}] API Error:`, response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];

      console.log(`[Perplexity-${model}] Response received, length: ${content.length}`);
      console.log(`[Perplexity-${model}] Citations found: ${citations.length}`);

      return {
        content,
        citations: citations.map((url: string) => ({ url })),
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        raw: data,
      };
    } catch (error) {
      console.error(`[Perplexity-${model}] Error:`, error);
      throw error;
    }
  }

  /**
   * Search for topic information with structured output
   */
  async searchTopicInfo(options: {
    query: string;
    infoType: 'statistics' | 'trends' | 'news' | 'how-to' | 'general';
    recency?: 'last-week' | 'last-month' | 'last-year' | 'any';
  }): Promise<PerplexityResponse> {
    const recencyFilter = options.recency === 'last-week' ? 'from the past week' :
                         options.recency === 'last-month' ? 'from the past month' :
                         options.recency === 'last-year' ? 'from the past year' : '';

    const prompt = `Search for ${options.infoType} about: ${options.query}
${recencyFilter ? `Focus on information ${recencyFilter}.` : ''}

Provide accurate, factual information with specific data points, numbers, and sources where available.
Format your response clearly with the key findings.`;

    return this.generateCompletion({
      prompt,
      maxTokens: 4000,
      temperature: 0.1,
    });
  }

  /**
   * Search for expert opinions and research
   */
  async searchExpertOpinions(options: {
    query: string;
    expertiseArea: string;
    sourceType?: 'academic' | 'industry' | 'practitioner' | 'any';
  }): Promise<PerplexityResponse> {
    const sourceFilter = options.sourceType === 'academic' ? 'from academic sources and research papers' :
                        options.sourceType === 'industry' ? 'from industry reports and business publications' :
                        options.sourceType === 'practitioner' ? 'from practitioners and experts in the field' : '';

    const prompt = `Find expert opinions and research about: ${options.query}
Field of expertise: ${options.expertiseArea}
${sourceFilter ? `Prioritize information ${sourceFilter}.` : ''}

Look for:
1. Direct quotes from recognized experts
2. Research studies and their findings
3. Industry reports and statistics
4. Case studies with specific results

Include proper attribution (expert name, title, organization) for all quotes and findings.`;

    return this.generateCompletion({
      prompt,
      maxTokens: 4000,
      temperature: 0.1,
    });
  }
}

/**
 * Helper function to parse research results from Perplexity response
 */
export function parsePerplexityResearchResponse(response: PerplexityResponse): {
  content: string;
  citations: PerplexityCitation[];
} {
  return {
    content: response.content,
    citations: response.citations || [],
  };
}
