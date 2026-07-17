/**
 * Topic Research Tool Definitions
 * These tools are used by Claude to research SEO opportunities and generate optimized topics
 */

import Anthropic from '@anthropic-ai/sdk';

export const topicResearchTools: Anthropic.Tool[] = [
  {
    name: 'searchKeywordData',
    description: `Get SEO metrics for keywords using DataForSEO. Returns search volume, CPC in USD, Google Ads competition, and organic keyword difficulty on a 0-100 scale.
Use this to:
- Validate keyword opportunities
- Compare keyword potential
- Find the best primary keywords for topics
- Understand keyword competition

Do not confuse paidCompetition with organic keywordDifficulty, assume CPC uses the target country's currency, or treat low difficulty as a ranking guarantee. Call with specific keywords you want to analyze. You can search up to 100 keywords at once.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of keywords to get SEO data for (max 100)',
          maxItems: 100
        },
        location: {
          type: 'string',
          description: 'Target location for search data (e.g., "United States", "United Kingdom"). Defaults to United States.',
          default: 'United States'
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., "en", "es"). Defaults to "en".',
          default: 'en'
        }
      },
      required: ['keywords']
    }
  },
  {
    name: 'searchRelatedKeywords',
    description: `Find related keywords and long-tail variations using DataForSEO.
Use this to:
- Expand from seed keywords to find more opportunities
- Discover long-tail keyword variations
- Find semantically related terms
- Build out keyword clusters

Returns related keywords with their SEO metrics.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        seedKeyword: {
          type: 'string',
          description: 'The seed keyword to find related terms for'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of related keywords to return (default 20, max 100)',
          default: 20
        },
        location: {
          type: 'string',
          description: 'Target location (e.g., "United States")',
          default: 'United States'
        }
      },
      required: ['seedKeyword']
    }
  },
  {
    name: 'searchTrendingTopics',
    description: `Search for trending topics, news, and emerging content opportunities in a niche using web search.
Use this to:
- Find what's currently hot in the industry
- Discover timely content angles
- Identify emerging trends before they peak
- Find newsworthy topics to cover

Returns trending topics with context and sources.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        niche: {
          type: 'string',
          description: 'The industry or niche to find trends in (e.g., "SaaS marketing", "email automation")'
        },
        focus: {
          type: 'string',
          enum: ['trends', 'news', 'emerging', 'seasonal'],
          description: 'What type of trending content to focus on'
        },
        timeframe: {
          type: 'string',
          enum: ['this-week', 'this-month', 'this-quarter', 'this-year'],
          description: 'How recent the trends should be',
          default: 'this-month'
        }
      },
      required: ['niche']
    }
  },
  {
    name: 'searchCompetitorContent',
    description: `Analyze competitor websites to see what topics they're covering using web search.
Use this to:
- Understand what competitors are writing about
- Find content gaps (topics they haven't covered)
- Get inspiration for topic angles
- Identify successful content patterns

Provide competitor URLs or brand names to analyze.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        competitors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Competitor URLs or brand names to analyze (max 5)',
          maxItems: 5
        },
        niche: {
          type: 'string',
          description: 'The niche/industry context for the analysis'
        },
        focus: {
          type: 'string',
          enum: ['all-content', 'popular-content', 'recent-content', 'content-gaps'],
          description: 'What aspect of competitor content to focus on',
          default: 'popular-content'
        }
      },
      required: ['competitors', 'niche']
    }
  },
  {
    name: 'searchExistingContent',
    description: `Search the user's existing blog posts and queued topics to avoid duplicates and find content gaps.
Use this to:
- Check if a topic has already been covered
- Find related content that exists
- Identify internal linking opportunities
- Avoid suggesting duplicate topics

Uses semantic search to find related content even if exact keywords don't match.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Topic or keyword to search for in existing content'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default 10)',
          default: 10
        },
        includeQueued: {
          type: 'boolean',
          description: 'Whether to include queued/pending topics in results (default true)',
          default: true
        }
      },
      required: ['query']
    }
  },
  {
    name: 'searchContentGaps',
    description: `Find content gaps and underserved topics in a niche using web search.
Use this to:
- Find topics that aren't well covered online
- Identify questions people are asking but not getting good answers to
- Discover niche angles on popular topics
- Find low-competition content opportunities

Returns potential content gaps with supporting evidence.`,
    input_schema: {
      type: 'object' as const,
      properties: {
        niche: {
          type: 'string',
          description: 'The niche/industry to find content gaps in'
        },
        seedTopics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Seed topics to explore gaps around (optional)',
          maxItems: 5
        },
        audienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced', 'all'],
          description: 'Target audience expertise level',
          default: 'all'
        }
      },
      required: ['niche']
    }
  }
];

/**
 * Topic research result types
 */
export interface KeywordData {
  keyword: string;
  searchVolume: number | null;
  /** @deprecated Use paidCompetition. This is Google Ads competition, not organic difficulty. */
  competition: number | null;
  /** @deprecated Use paidCompetitionLevel. */
  competitionLevel: 'low' | 'medium' | 'high' | 'unknown';
  paidCompetition: number | null;
  paidCompetitionLevel: 'low' | 'medium' | 'high' | 'unknown';
  cpc: number | null;
  keywordDifficulty: number | null;
  trend: 'rising' | 'stable' | 'declining' | 'unknown';
  monthlySearches?: Array<{ year: number; month: number; searchVolume: number }>;
  searchIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  dataAvailable: boolean;
}

export interface RelatedKeyword extends KeywordData {
  relevanceScore: number;
  searchType: 'related' | 'question' | 'long-tail';
}

export interface TrendingTopic {
  topic: string;
  trendStrength: 'emerging' | 'growing' | 'peak' | 'declining';
  context: string;
  sources: string[];
  relevanceToNiche: string;
}

export interface CompetitorContent {
  competitor: string;
  topics: Array<{
    title: string;
    url?: string;
    estimatedPerformance?: 'high' | 'medium' | 'low';
  }>;
  contentGaps: string[];
  patterns: string[];
}

export interface ExistingContent {
  posts: Array<{
    title: string;
    slug: string;
    publishedAt?: string;
    keywords?: string[];
    similarity: number;
  }>;
  queuedTopics: Array<{
    topic: string;
    status: string;
    similarity: number;
  }>;
  summary: string;
}

export interface ContentGap {
  gap: string;
  description: string;
  evidence: string;
  potentialKeywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TopicResearchResult {
  researchComplete: boolean;
  summary: string;
  keywordOpportunities: KeywordData[];
  trendingTopics: TrendingTopic[];
  contentGaps: ContentGap[];
  existingContentAnalysis?: ExistingContent;
  competitorAnalysis?: CompetitorContent[];
  recommendedTopics: Array<{
    topic: string;
    primaryKeyword: string;
    rationale: string;
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    estimatedPotential: 'low' | 'medium' | 'high';
  }>;
  searchIterations: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}
