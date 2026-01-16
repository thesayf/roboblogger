/**
 * Research Tool Definitions for Blog Generation
 * These tools are used by Claude to orchestrate research via Perplexity
 */

import Anthropic from '@anthropic-ai/sdk';

export const researchTools: Anthropic.Tool[] = [
  {
    name: 'searchTopicInfo',
    description: `Search for factual information about a topic using real-time web search.
Use this to find: statistics, current trends, recent news, how-to information, factual data.
Call multiple times with different queries if initial results are insufficient or too generic.
The search has access to current web data, so results will be up-to-date.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Specific search query for factual information. Be specific and targeted.'
        },
        infoType: {
          type: 'string',
          enum: ['statistics', 'trends', 'news', 'how-to', 'general'],
          description: 'Type of information to prioritize in the search'
        },
        recency: {
          type: 'string',
          enum: ['last-week', 'last-month', 'last-year', 'any'],
          description: 'How recent the information should be. Use "last-year" for most topics, "last-month" for fast-changing topics.'
        }
      },
      required: ['query', 'infoType']
    }
  },
  {
    name: 'searchExpertOpinions',
    description: `Search for expert opinions, quotes, and research studies using real-time web search.
Use this to find: expert quotes with attribution, academic research, industry reports, case studies.
Prioritizes authoritative sources like research papers, industry publications, and recognized experts.
Call multiple times if you need different types of expert input (academic vs industry vs practitioner).`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query for expert opinions or research. Include the topic and what kind of insight you need.'
        },
        expertiseArea: {
          type: 'string',
          description: 'Field of expertise to focus on (e.g., "sleep medicine", "productivity research", "digital marketing")'
        },
        sourceType: {
          type: 'string',
          enum: ['academic', 'industry', 'practitioner', 'any'],
          description: 'Type of expert source to prioritize. "academic" for research/studies, "industry" for business insights, "practitioner" for practical experience.'
        }
      },
      required: ['query', 'expertiseArea']
    }
  }
];

/**
 * Research result types
 */
export interface ResearchStatistic {
  fact: string;
  source: string;
  sourceUrl?: string;
  year?: string;
  context?: string; // Why this stat matters for this specific article
}

export interface ResearchExpertQuote {
  quote: string;
  expert: string;
  title?: string;
  organization?: string;
  sourceUrl?: string;
  context?: string; // What perspective this quote adds
}

export interface ResearchTrend {
  trend: string;
  source: string;
  sourceUrl?: string;
  implication?: string; // What this means for the reader
}

export interface ResearchKeyInsight {
  insight: string; // The "aha" moment or connection
  supportingEvidence?: string; // What backs this up
  articleAngle?: string; // How to use this in the article
}

export interface ResearchCounterpoint {
  point: string; // The nuance or "it depends" finding
  context: string; // When/why this applies
}

export interface ResearchResult {
  researchComplete: boolean;
  summary: string;
  narrativeSummary?: string; // 2-3 paragraphs providing context and story
  statistics: ResearchStatistic[];
  expertQuotes: ResearchExpertQuote[];
  trends: ResearchTrend[];
  keyInsights?: ResearchKeyInsight[]; // "Aha" moments that don't fit neat categories
  counterpoints?: ResearchCounterpoint[]; // Nuances and "it depends" findings
  keyPoints: string[];
  searchIterations?: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}
