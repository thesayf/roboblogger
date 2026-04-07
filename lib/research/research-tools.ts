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
  },
  {
    name: 'searchWithExa',
    description: `Neural search for high-quality source documents, articles, and research papers.
Use this to find: specific blog posts, research papers, in-depth articles, authoritative sources.
Returns actual source URLs with content excerpts — ideal for finding citable material.
Better than searchTopicInfo for finding specific source documents rather than synthesized answers.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query — can be natural language, a question, or a topic description.'
        },
        numResults: {
          type: 'number',
          description: 'Number of results to return (default: 5, max: 10)'
        },
        category: {
          type: 'string',
          enum: ['research paper', 'news', 'company', 'personal site'],
          description: 'Filter by content category. Use "research paper" for academic sources, "news" for current events.'
        },
        includeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only search these domains (e.g., ["arxiv.org", "nature.com"])'
        },
        startDate: {
          type: 'string',
          description: 'Only include results published after this date (ISO format, e.g., "2025-01-01")'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'findSimilarContent',
    description: `Find web pages semantically similar to a given URL. Use this when you find one excellent source and want to discover related articles, alternative perspectives, or complementary research.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'URL of a page to find similar content for'
        },
        numResults: {
          type: 'number',
          description: 'Number of similar results to return (default: 5)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'getFullContent',
    description: `Retrieve the full text content of specific web pages. Use this to read an article in full after finding it via search — for example, to extract exact quotes, detailed data, or understand the full context of a finding.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to retrieve full content from (max 3 at a time)'
        }
      },
      required: ['urls']
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

/**
 * New research brief format — replaces the rigid stats/quotes/trends structure
 * with an editorial brief that provides narrative direction
 */

export interface ResearchSource {
  url: string;
  title: string;
  excerpt?: string;
  publishedDate?: string;
  credibility?: 'high' | 'medium' | 'low';
}

export interface ResearchEvidence {
  claim: string;
  source: ResearchSource;
  type: 'statistic' | 'quote' | 'finding' | 'example' | 'data_point';
  attribution?: string; // e.g. "According to [name], [title] at [org]"
}

export interface ResearchBrief {
  researchComplete: boolean;
  // Editorial direction
  angle: string;              // The specific angle/thesis for this piece
  thesis: string;             // One-sentence thesis statement
  whyNow: string;             // Timeliness hook — why this matters right now
  gapInCoverage: string;      // What existing coverage misses
  briefNarrative: string;     // 3-5 paragraph editorial brief
  // Supporting evidence (no hardcoded limits)
  evidence: ResearchEvidence[];
  // For exploratory mode
  recommendedTitle?: string;
  recommendedAudience?: string;
  // Meta
  confidenceLevel: 'high' | 'medium' | 'low';
  searchesPerformed: number;
}

/**
 * Type guard to detect legacy research format vs new brief format
 */
export function isLegacyResearchFormat(data: any): data is ResearchResult {
  return data && Array.isArray(data.statistics);
}
