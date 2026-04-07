/**
 * Exa Provider Implementation
 * Uses Exa for neural search, similar content discovery, and full content retrieval
 */

import Exa from 'exa-js';
import { AIProvider, AIProviderConfig, AICompletionOptions, AIResponse } from './types';

export interface ExaConfig extends AIProviderConfig {
  model?: string;
}

export interface ExaSearchResult {
  url: string;
  title: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  publishedDate?: string;
  author?: string;
}

export interface ExaSearchResponse extends AIResponse {
  results: ExaSearchResult[];
}

export class ExaProvider extends AIProvider {
  private client: Exa;

  constructor(config: ExaConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error('Exa API key is required');
    }
    this.client = new Exa(config.apiKey);
  }

  getName(): string {
    return 'exa';
  }

  async generateCompletion(options: AICompletionOptions): Promise<AIResponse> {
    // Exa is a search tool, not a completion API — route through searchContent
    const response = await this.searchContent({
      query: options.prompt,
      numResults: 5,
    });
    return {
      content: response.results.map(r => r.highlights?.join('\n') || r.text || '').join('\n\n'),
      raw: response,
    };
  }

  /**
   * Neural/keyword search with content extraction
   */
  async searchContent(options: {
    query: string;
    numResults?: number;
    category?: string;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
  }): Promise<ExaSearchResponse> {
    console.log(`[Exa] Searching: "${options.query}" (${options.numResults || 5} results)`);

    try {
      const searchOptions: any = {
        numResults: options.numResults || 5,
        contents: {
          highlights: { maxCharacters: 4000 },
          text: { maxCharacters: 2000 },
        },
      };

      if (options.category) searchOptions.category = options.category;
      if (options.includeDomains) searchOptions.includeDomains = options.includeDomains;
      if (options.excludeDomains) searchOptions.excludeDomains = options.excludeDomains;
      if (options.startPublishedDate) searchOptions.startPublishedDate = options.startPublishedDate;
      if (options.endPublishedDate) searchOptions.endPublishedDate = options.endPublishedDate;

      const response = await this.client.search(options.query, searchOptions);

      const results: ExaSearchResult[] = (response.results || []).map((r: any) => ({
        url: r.url,
        title: r.title || '',
        text: r.text || '',
        highlights: r.highlights || [],
        highlightScores: r.highlightScores || [],
        publishedDate: r.publishedDate || '',
        author: r.author || '',
      }));

      console.log(`[Exa] Search returned ${results.length} results`);

      return {
        content: results.map(r => `${r.title}\n${r.url}\n${r.highlights?.join('\n') || r.text || ''}`).join('\n\n'),
        results,
      };
    } catch (error) {
      console.error('[Exa] Search error:', error);
      throw error;
    }
  }

  /**
   * Find pages semantically similar to a given URL
   */
  async findSimilar(options: {
    url: string;
    numResults?: number;
    excludeDomains?: string[];
  }): Promise<ExaSearchResponse> {
    console.log(`[Exa] Finding similar to: ${options.url}`);

    try {
      const findOptions: any = {
        numResults: options.numResults || 5,
        contents: {
          highlights: { maxCharacters: 4000 },
          text: { maxCharacters: 2000 },
        },
      };

      if (options.excludeDomains) findOptions.excludeDomains = options.excludeDomains;

      const response = await this.client.findSimilar(options.url, findOptions);

      const results: ExaSearchResult[] = (response.results || []).map((r: any) => ({
        url: r.url,
        title: r.title || '',
        text: r.text || '',
        highlights: r.highlights || [],
        highlightScores: r.highlightScores || [],
        publishedDate: r.publishedDate || '',
        author: r.author || '',
      }));

      console.log(`[Exa] Found ${results.length} similar pages`);

      return {
        content: results.map(r => `${r.title}\n${r.url}\n${r.highlights?.join('\n') || r.text || ''}`).join('\n\n'),
        results,
      };
    } catch (error) {
      console.error('[Exa] FindSimilar error:', error);
      throw error;
    }
  }

  /**
   * Retrieve full content from specific URLs
   */
  async getContents(options: {
    urls: string[];
  }): Promise<ExaSearchResponse> {
    console.log(`[Exa] Getting contents for ${options.urls.length} URLs`);

    try {
      const response = await this.client.getContents(options.urls, {
        text: { maxCharacters: 5000 },
      });

      const results: ExaSearchResult[] = (response.results || []).map((r: any) => ({
        url: r.url,
        title: r.title || '',
        text: r.text || '',
        highlights: r.highlights || [],
        publishedDate: r.publishedDate || '',
        author: r.author || '',
      }));

      console.log(`[Exa] Retrieved content for ${results.length} pages`);

      return {
        content: results.map(r => `${r.title}\n${r.url}\n${r.text || ''}`).join('\n\n'),
        results,
      };
    } catch (error) {
      console.error('[Exa] GetContents error:', error);
      throw error;
    }
  }
}
