import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import {
  executeSearchKeywordData,
  executeSearchRelatedKeywords,
  executeSearchTrendingTopics,
  executeSearchCompetitorContent,
  executeSearchContentGaps,
} from '@/lib/seo-research/tool-executors';
import { PerplexityProvider } from '@/lib/ai-providers/perplexity-provider';

function wrapTool(ctx: ToolContext, toolName: string, fn: (input: any) => Promise<string>) {
  return async (input: any): Promise<string> => {
    const callInfo: ToolCallInfo = { name: toolName, input, success: false };
    ctx.toolCalls.push(callInfo);
    ctx.sendEvent('tool_start', { toolName, toolInput: input });

    try {
      const result = await fn(input);
      callInfo.result = result;
      callInfo.success = true;
      ctx.sendEvent('tool_end', { toolName, success: true });
      return result;
    } catch (error: any) {
      callInfo.success = false;
      ctx.sendEvent('tool_end', { toolName, success: false });
      return JSON.stringify({ error: error.message });
    }
  };
}

export function buildResearchTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'search_keyword_data',
      description: 'Get SEO metrics for keywords including search volume, CPC, competition, and difficulty from DataForSEO. Use this to evaluate keyword opportunities.',
      inputSchema: z.object({
        keywords: z.array(z.string()).max(10).describe('Keywords to analyze (max 10)'),
        location: z.string().optional().describe('Location for search data, e.g., "United States"'),
        language: z.string().optional().describe('Language code, e.g., "en"'),
      }),
      run: wrapTool(ctx, 'search_keyword_data', async (input) => {
        const result = await executeSearchKeywordData(input);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'search_related_keywords',
      description: 'Find related and long-tail keywords for a seed keyword using DataForSEO. Great for expanding keyword lists and finding low-competition opportunities.',
      inputSchema: z.object({
        seedKeyword: z.string().describe('The main keyword to find related terms for'),
        limit: z.number().optional().describe('Maximum results to return (default 20, max 50)'),
        location: z.string().optional().describe('Location for search data'),
      }),
      run: wrapTool(ctx, 'search_related_keywords', async (input) => {
        const result = await executeSearchRelatedKeywords(input);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'search_trending_topics',
      description: 'Find trending topics and emerging discussions in a niche using web search. Use this to identify timely content opportunities.',
      inputSchema: z.object({
        niche: z.string().describe('The industry or niche to search trends for'),
        focus: z.enum(['trends', 'news', 'emerging', 'seasonal']).optional().describe('Type of trends to focus on'),
        timeframe: z.enum(['this-week', 'this-month', 'this-quarter', 'this-year']).optional().describe('Time period for trends'),
      }),
      run: wrapTool(ctx, 'search_trending_topics', async (input) => {
        const result = await executeSearchTrendingTopics(input);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'search_competitor_content',
      description: 'Analyze competitor blogs to understand their content strategy, popular topics, and content gaps. Provide competitor website names or URLs.',
      inputSchema: z.object({
        competitors: z.array(z.string()).max(5).describe('Competitor blog names or domains'),
        niche: z.string().describe('The industry niche for context'),
        focus: z.enum(['all-content', 'popular-content', 'recent-content', 'content-gaps']).optional().describe('What aspect of competitor content to analyze'),
      }),
      run: wrapTool(ctx, 'search_competitor_content', async (input) => {
        const result = await executeSearchCompetitorContent(input);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'search_content_gaps',
      description: 'Find underserved topics and content gaps in a niche. Identifies questions people are asking but not getting good answers to.',
      inputSchema: z.object({
        niche: z.string().describe('The industry niche to find gaps in'),
        seedTopics: z.array(z.string()).optional().describe('Starting topics to explore gaps around'),
        audienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional().describe('Target audience level'),
      }),
      run: wrapTool(ctx, 'search_content_gaps', async (input) => {
        const result = await executeSearchContentGaps(input);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'web_search',
      description: 'General web search using Perplexity AI. Use this for any research question, fact-checking, or finding current information about any topic.',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
      }),
      run: wrapTool(ctx, 'web_search', async (input) => {
        const provider = new PerplexityProvider({
          apiKey: process.env.PERPLEXITY_API_KEY!,
          model: 'sonar',
        });

        const response = await provider.generateCompletion({
          prompt: input.query,
          maxTokens: 2000,
          temperature: 0.2,
        });

        return JSON.stringify({
          answer: response.content,
          citations: response.citations?.map((c: any) => c.url) || [],
        });
      }),
    }),
  ];
}
