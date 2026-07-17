/**
 * Topic Research Tool Executors
 * Executes the actual API calls for each research tool
 */

import mongoose from 'mongoose';
import { PerplexityProvider } from '@/lib/ai-providers/perplexity-provider';
import { generateEmbedding } from '@/lib/embeddings/embedding-service';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import Topic from '@/models/Topic';
import {
  KeywordData,
  RelatedKeyword,
  TrendingTopic,
  CompetitorContent,
  ExistingContent,
  ContentGap,
} from './topic-research-tools';

// ============================================================================
// DataForSEO API Client
// ============================================================================

interface DataForSEOCredentials {
  login: string;
  password: string;
}

function getDataForSEOCredentials(): DataForSEOCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.');
  }

  return { login, password };
}

async function callDataForSEO(endpoint: string, data: any[]): Promise<any> {
  const { login, password } = getDataForSEOCredentials();
  const authString = Buffer.from(`${login}:${password}`).toString('base64');

  const response = await fetch(`https://api.dataforseo.com/v3${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DataForSEO] API Error:', response.status, errorText);
    throw new Error(`DataForSEO API error: ${response.status}`);
  }

  const payload = await response.json();
  const failedTask = payload.tasks?.find((task: any) => task.status_code !== 20000);
  if (payload.status_code !== 20000 || payload.tasks_error > 0 || failedTask) {
    const statusCode = failedTask?.status_code || payload.status_code || 'unknown';
    const statusMessage = failedTask?.status_message || payload.status_message || 'Unknown DataForSEO error';
    throw new Error(`DataForSEO task failed (${statusCode}): ${statusMessage}`);
  }

  return payload;
}

// Location codes for DataForSEO (common ones)
const LOCATION_CODES: Record<string, number> = {
  'United States': 2840,
  'United Kingdom': 2826,
  'Canada': 2124,
  'Australia': 2036,
  'Germany': 2276,
  'France': 2250,
  'Spain': 2724,
  'Italy': 2380,
  'Netherlands': 2528,
  'Brazil': 2076,
  'India': 2356,
};

function getLocationCode(location: string): number {
  return LOCATION_CODES[location] || LOCATION_CODES['United States'];
}

type CompetitionLevel = 'low' | 'medium' | 'high' | 'unknown';

function normalizeKeywords(keywords: string[], limit: number): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawKeyword of keywords) {
    const keyword = rawKeyword.trim();
    const key = keyword.toLocaleLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    normalized.push(keyword);
    if (normalized.length >= limit) break;
  }

  if (normalized.length === 0) throw new Error('At least one non-empty keyword is required.');
  return normalized;
}

function normalizePaidCompetition(item: any): { value: number | null; level: CompetitionLevel } {
  const rawLevel = typeof item?.competition_level === 'string'
    ? item.competition_level
    : typeof item?.competition === 'string'
      ? item.competition
      : null;
  const normalizedLevel = rawLevel?.toLocaleLowerCase();
  const index = typeof item?.competition_index === 'number' ? item.competition_index : null;
  const numericCompetition = typeof item?.competition === 'number' ? item.competition : null;
  const value = index !== null
    ? Math.max(0, Math.min(1, index / 100))
    : numericCompetition !== null
      ? Math.max(0, Math.min(1, numericCompetition))
      : null;

  if (normalizedLevel === 'low' || normalizedLevel === 'medium' || normalizedLevel === 'high') {
    return { value, level: normalizedLevel };
  }
  if (value === null) return { value: null, level: 'unknown' };
  return { value, level: value < 0.33 ? 'low' : value < 0.66 ? 'medium' : 'high' };
}

function normalizeMonthlySearches(value: any): Array<{ year: number; month: number; searchVolume: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => Number.isInteger(entry?.year) && Number.isInteger(entry?.month) && typeof entry?.search_volume === 'number')
    .map((entry) => ({ year: entry.year, month: entry.month, searchVolume: entry.search_volume }))
    .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
}

function deriveTrend(monthlySearches: Array<{ searchVolume: number }>): KeywordData['trend'] {
  if (monthlySearches.length < 2) return 'unknown';
  const newest = monthlySearches[0].searchVolume;
  const comparison = monthlySearches[Math.min(5, monthlySearches.length - 1)].searchVolume;
  if (comparison === 0) return newest > 0 ? 'rising' : 'stable';

  const change = (newest - comparison) / comparison;
  if (change > 0.1) return 'rising';
  if (change < -0.1) return 'declining';
  return 'stable';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * Get keyword SEO data from DataForSEO
 */
export async function executeSearchKeywordData(input: {
  keywords: string[];
  location?: string;
  language?: string;
}): Promise<{
  keywords: KeywordData[];
  metricDefinitions: {
    keywordDifficulty: string;
    paidCompetition: string;
    searchVolume: string;
    cpc: string;
  };
  location: string;
  language: string;
}> {
  const { location = 'United States', language = 'en' } = input;
  const keywords = normalizeKeywords(input.keywords, 100);

  console.log(`[DataForSEO] Searching keyword data for: ${keywords.join(', ')}`);

  const request = {
    keywords,
    location_code: getLocationCode(location),
    language_code: language,
  };

  const [volumeResult, difficultyResult] = await Promise.all([
    callDataForSEO('/keywords_data/google_ads/search_volume/live', [request]),
    callDataForSEO('/dataforseo_labs/google/bulk_keyword_difficulty/live', [request]),
  ]);

  const volumeItems = volumeResult.tasks?.[0]?.result || [];
  const difficultyItems = difficultyResult.tasks?.[0]?.result?.[0]?.items || [];
  const volumeByKeyword = new Map(
    volumeItems.map((item: any) => [String(item.keyword).toLocaleLowerCase(), item]),
  );
  const difficultyByKeyword = new Map<string, number | null>(
    difficultyItems.map((item: any): [string, number | null] => [
      String(item.keyword).toLocaleLowerCase(),
      numberOrNull(item.keyword_difficulty),
    ]),
  );

  const keywordData: KeywordData[] = keywords.map((keyword) => {
    const key = keyword.toLocaleLowerCase();
    const volumeItem: any = volumeByKeyword.get(key);
    const keywordDifficulty = difficultyByKeyword.has(key) ? difficultyByKeyword.get(key)! : null;
    const paidCompetition = normalizePaidCompetition(volumeItem);
    const monthlySearches = normalizeMonthlySearches(volumeItem?.monthly_searches);

    return {
      keyword: volumeItem?.keyword || keyword,
      searchVolume: numberOrNull(volumeItem?.search_volume),
      competition: paidCompetition.value,
      competitionLevel: paidCompetition.level,
      paidCompetition: paidCompetition.value,
      paidCompetitionLevel: paidCompetition.level,
      cpc: numberOrNull(volumeItem?.cpc),
      keywordDifficulty,
      trend: deriveTrend(monthlySearches),
      monthlySearches,
      dataAvailable: Boolean(volumeItem || keywordDifficulty !== null),
    };
  });

  console.log(`[DataForSEO] Found search data for ${keywordData.filter((item) => item.dataAvailable).length}/${keywordData.length} keywords`);
  return {
    keywords: keywordData,
    metricDefinitions: {
      keywordDifficulty: 'Organic difficulty of ranking in the Google top 10, from 0 to 100.',
      paidCompetition: 'Google Ads advertiser competition from 0 to 1. This is not organic SEO difficulty.',
      searchVolume: 'Approximate average monthly Google searches for the selected location.',
      cpc: 'Historical Google Ads cost per click in USD, regardless of the selected search location.',
    },
    location,
    language,
  };
}

/**
 * Get related keywords from DataForSEO
 */
export async function executeSearchRelatedKeywords(input: {
  seedKeyword: string;
  limit?: number;
  location?: string;
  language?: string;
}): Promise<{ relatedKeywords: RelatedKeyword[] }> {
  const { seedKeyword, limit = 20, location = 'United States', language = 'en' } = input;
  const safeLimit = Math.max(1, Math.min(limit, 100));

  console.log(`[DataForSEO] Finding related keywords for: ${seedKeyword}`);

  const depth = safeLimit <= 8 ? 1 : safeLimit <= 72 ? 2 : 3;
  const result = await callDataForSEO('/dataforseo_labs/google/related_keywords/live', [
    {
      keyword: seedKeyword.trim(),
      location_code: getLocationCode(location),
      language_code: language,
      include_seed_keyword: false,
      include_serp_info: true,
      depth,
      limit: safeLimit,
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    },
  ]);

  const items = result.tasks?.[0]?.result?.[0]?.items || [];
  const relatedKeywords: RelatedKeyword[] = items.map((item: any) => {
    const keywordData = item.keyword_data || {};
    const keywordInfo = keywordData.keyword_info || {};
    const keyword = String(keywordData.keyword || '');
    const paidCompetition = normalizePaidCompetition(keywordInfo);
    const monthlySearches = normalizeMonthlySearches(keywordInfo.monthly_searches);
    const depthValue = typeof item.depth === 'number' ? item.depth : 1;
    const isQuestion = /^(how|what|why|when|where|who|can|does|is)\b/i.test(keyword) || keyword.includes('?');
    const isLongTail = keyword.split(/\s+/).length >= 4;

    return {
      keyword,
      searchVolume: numberOrNull(keywordInfo.search_volume),
      competition: paidCompetition.value,
      competitionLevel: paidCompetition.level,
      paidCompetition: paidCompetition.value,
      paidCompetitionLevel: paidCompetition.level,
      cpc: numberOrNull(keywordInfo.cpc),
      keywordDifficulty: numberOrNull(keywordData.keyword_properties?.keyword_difficulty),
      trend: deriveTrend(monthlySearches),
      monthlySearches,
      searchIntent: keywordData.search_intent_info?.main_intent || null,
      dataAvailable: Boolean(keyword),
      relevanceScore: Math.max(0.1, 1 - (depthValue * 0.2)),
      searchType: isQuestion ? 'question' : isLongTail ? 'long-tail' : 'related',
    };
  });

  console.log(`[DataForSEO] Found ${relatedKeywords.length} related keywords`);
  return { relatedKeywords };
}

/**
 * Search for trending topics using Perplexity
 */
export async function executeSearchTrendingTopics(input: {
  niche: string;
  focus?: 'trends' | 'news' | 'emerging' | 'seasonal';
  timeframe?: 'this-week' | 'this-month' | 'this-quarter' | 'this-year';
}): Promise<{ trends: TrendingTopic[] }> {
  const { niche, focus = 'trends', timeframe = 'this-month' } = input;

  console.log(`[Perplexity] Searching trending topics in: ${niche}`);

  const provider = new PerplexityProvider({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    model: 'sonar-pro',
  });

  const timeframeText = {
    'this-week': 'in the past week',
    'this-month': 'in the past month',
    'this-quarter': 'in the past 3 months',
    'this-year': 'in 2025',
  }[timeframe];

  const focusText = {
    'trends': 'trending topics and popular discussions',
    'news': 'recent news and announcements',
    'emerging': 'emerging trends and new developments',
    'seasonal': 'seasonal topics and timely content opportunities',
  }[focus];

  const prompt = `Find ${focusText} in the ${niche} industry/niche ${timeframeText}.

Return a structured analysis of what's trending, including:
1. The specific topic or trend
2. Why it's trending (context)
3. How strong the trend is (emerging, growing, at peak, or declining)
4. Why it's relevant to the ${niche} niche

Focus on topics that would make good blog post subjects. Be specific with examples and data where available.`;

  try {
    const response = await provider.generateCompletion({
      prompt,
      maxTokens: 3000,
      temperature: 0.2,
    });

    // Parse the response into structured trending topics
    const trends: TrendingTopic[] = [];
    const content = response.content;

    // Simple parsing - look for numbered items or clear topic sections
    const lines = content.split('\n');
    let currentTopic: Partial<TrendingTopic> = {};

    for (const line of lines) {
      // Look for topic indicators
      if (line.match(/^\d+\.|^[-•*]|^#{1,3}\s/)) {
        if (currentTopic.topic) {
          trends.push({
            topic: currentTopic.topic,
            trendStrength: currentTopic.trendStrength || 'growing',
            context: currentTopic.context || '',
            sources: response.citations?.map(c => c.url) || [],
            relevanceToNiche: currentTopic.relevanceToNiche || `Relevant to ${niche}`,
          });
        }
        currentTopic = {
          topic: line.replace(/^\d+\.|^[-•*]|^#{1,3}\s/, '').trim(),
          trendStrength: 'growing',
        };
      } else if (line.trim() && currentTopic.topic) {
        currentTopic.context = (currentTopic.context || '') + ' ' + line.trim();
      }
    }

    // Don't forget the last topic
    if (currentTopic.topic) {
      trends.push({
        topic: currentTopic.topic,
        trendStrength: currentTopic.trendStrength || 'growing',
        context: currentTopic.context || '',
        sources: response.citations?.map(c => c.url) || [],
        relevanceToNiche: `Relevant to ${niche}`,
      });
    }

    console.log(`[Perplexity] Found ${trends.length} trending topics`);
    return { trends: trends.slice(0, 10) }; // Limit to 10 trends
  } catch (error) {
    console.error('[Perplexity] Error searching trending topics:', error);
    return { trends: [] };
  }
}

/**
 * Analyze competitor content using Perplexity
 */
export async function executeSearchCompetitorContent(input: {
  competitors: string[];
  niche: string;
  focus?: 'all-content' | 'popular-content' | 'recent-content' | 'content-gaps';
}): Promise<{ analysis: CompetitorContent[] }> {
  const { competitors, niche, focus = 'popular-content' } = input;

  console.log(`[Perplexity] Analyzing competitors: ${competitors.join(', ')}`);

  const provider = new PerplexityProvider({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    model: 'sonar-pro',
  });

  const focusText = {
    'all-content': 'all their blog content and topics',
    'popular-content': 'their most popular and high-performing content',
    'recent-content': 'their most recent blog posts and content',
    'content-gaps': 'topics they haven\'t covered well or are missing',
  }[focus];

  const prompt = `Analyze the blog content from these competitors in the ${niche} space: ${competitors.join(', ')}

Focus on: ${focusText}

For each competitor, provide:
1. Key topics they cover
2. Content patterns (what types of posts they create)
3. Any content gaps you notice (topics they should cover but don't)
4. Their apparent content strategy

Be specific with actual blog post titles or topics where possible.`;

  try {
    const response = await provider.generateCompletion({
      prompt,
      maxTokens: 4000,
      temperature: 0.2,
    });

    // Parse response into structured competitor analysis
    const analysis: CompetitorContent[] = competitors.map(competitor => ({
      competitor,
      topics: [],
      contentGaps: [],
      patterns: [],
    }));

    // For now, return a simplified structure
    // The AI will interpret the raw content
    if (analysis.length > 0) {
      analysis[0].topics = [{ title: 'See full analysis in raw response' }];
    }

    console.log(`[Perplexity] Competitor analysis complete`);
    return {
      analysis,
      // Include raw response for Claude to interpret
      rawAnalysis: response.content,
    } as any;
  } catch (error) {
    console.error('[Perplexity] Error analyzing competitors:', error);
    return { analysis: [] };
  }
}

/**
 * Search existing content using MongoDB vector search
 */
export async function executeSearchExistingContent(
  input: {
    query: string;
    limit?: number;
    includeQueued?: boolean;
  },
  userId: string
): Promise<ExistingContent> {
  const { query, limit = 10, includeQueued = true } = input;

  console.log(`[VectorSearch] Searching existing content for: "${query}"`);

  await dbConnect();

  // Generate embedding for the query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {
    console.error('[VectorSearch] Error generating embedding:', error);
    // Fall back to text search if embedding fails
    return executeTextSearchFallback(query, limit, includeQueued, userId);
  }

  const posts: ExistingContent['posts'] = [];
  const queuedTopics: ExistingContent['queuedTopics'] = [];

  // Vector search on blog posts
  // Note: We filter by owner after vectorSearch to avoid needing owner indexed as filter
  try {
    const postResults = await BlogPost.aggregate([
      {
        $vectorSearch: {
          index: 'blog_post_embeddings',
          path: 'embedding.vector',
          queryVector: queryEmbedding,
          numCandidates: limit * 20,
          limit: limit * 5, // Get more results to filter down
        },
      },
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          title: 1,
          slug: 1,
          publishedAt: 1,
          seoTitle: 1,
          tags: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    for (const post of postResults) {
      posts.push({
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt?.toISOString(),
        keywords: post.tags || [],
        similarity: post.score || 0,
      });
    }

    // If vector search returned few results, supplement with text search
    // (catches posts without embeddings, e.g. newly generated posts)
    if (posts.length < limit) {
      const existingSlugs = new Set(posts.map(p => p.slug));
      const textPosts = await BlogPost.find({
        owner: userId,
        slug: { $nin: Array.from(existingSlugs) },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { seoTitle: { $regex: query, $options: 'i' } },
          { tags: { $in: query.split(' ') } },
        ],
      })
        .select('title slug publishedAt tags')
        .limit(limit - posts.length)
        .lean();

      for (const post of textPosts) {
        posts.push({
          title: post.title,
          slug: post.slug,
          publishedAt: post.publishedAt?.toISOString(),
          keywords: post.tags || [],
          similarity: 0.5,
        });
      }
    }
  } catch (error) {
    console.error('[VectorSearch] Error searching posts:', error);
    // Vector search might not be set up yet, fall back to text search
    const textPosts = await BlogPost.find({
      owner: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { seoTitle: { $regex: query, $options: 'i' } },
        { tags: { $in: query.split(' ') } },
      ],
    })
      .select('title slug publishedAt tags')
      .limit(limit)
      .lean();

    for (const post of textPosts) {
      posts.push({
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt?.toISOString(),
        keywords: post.tags || [],
        similarity: 0.5, // Approximate similarity for text matches
      });
    }
  }

  // Search queued topics
  // Note: We filter by owner after vectorSearch to avoid needing owner indexed as filter
  if (includeQueued) {
    try {
      const topicResults = await Topic.aggregate([
        {
          $vectorSearch: {
            index: 'topic_embeddings',
            path: 'embedding.vector',
            queryVector: queryEmbedding,
            numCandidates: limit * 10,
            limit: limit * 5, // Get more results to filter down
          },
        },
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            topic: 1,
            status: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      for (const topic of topicResults) {
        queuedTopics.push({
          topic: topic.topic,
          status: topic.status,
          similarity: topic.score || 0,
        });
      }
    } catch (error) {
      console.error('[VectorSearch] Error searching topics:', error);
      // Fall back to text search
      const textTopics = await Topic.find({
        owner: userId,
        status: { $in: ['pending', 'generating'] },
        topic: { $regex: query, $options: 'i' },
      })
        .select('topic status')
        .limit(limit)
        .lean();

      for (const topic of textTopics) {
        queuedTopics.push({
          topic: topic.topic,
          status: topic.status,
          similarity: 0.5,
        });
      }
    }
  }

  console.log(`[VectorSearch] Found ${posts.length} posts and ${queuedTopics.length} queued topics`);

  return {
    posts,
    queuedTopics,
    summary: `Found ${posts.length} existing posts and ${queuedTopics.length} queued topics related to "${query}"`,
  };
}

/**
 * Fallback text search when vector search is not available
 */
async function executeTextSearchFallback(
  query: string,
  limit: number,
  includeQueued: boolean,
  userId: string
): Promise<ExistingContent> {
  console.log('[TextSearch] Using text search fallback');

  const posts = await BlogPost.find({
    owner: userId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { seoTitle: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  })
    .select('title slug publishedAt tags')
    .limit(limit)
    .lean();

  const queuedTopics: ExistingContent['queuedTopics'] = [];

  if (includeQueued) {
    const topics = await Topic.find({
      owner: userId,
      status: { $in: ['pending', 'generating'] },
      $or: [
        { topic: { $regex: query, $options: 'i' } },
        { 'seo.primaryKeyword': { $regex: query, $options: 'i' } },
      ],
    })
      .select('topic status')
      .limit(limit)
      .lean();

    for (const topic of topics) {
      queuedTopics.push({
        topic: topic.topic,
        status: topic.status,
        similarity: 0.5,
      });
    }
  }

  return {
    posts: posts.map(p => ({
      title: p.title,
      slug: p.slug,
      publishedAt: p.publishedAt?.toISOString(),
      keywords: p.tags || [],
      similarity: 0.5,
    })),
    queuedTopics,
    summary: `Found ${posts.length} existing posts and ${queuedTopics.length} queued topics (text search)`,
  };
}

/**
 * Search for content gaps using Perplexity
 */
export async function executeSearchContentGaps(input: {
  niche: string;
  seedTopics?: string[];
  audienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
}): Promise<{ gaps: ContentGap[] }> {
  const { niche, seedTopics = [], audienceLevel = 'all' } = input;

  console.log(`[Perplexity] Finding content gaps in: ${niche}`);

  const provider = new PerplexityProvider({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    model: 'sonar-pro',
  });

  const seedContext = seedTopics.length > 0
    ? `Consider these seed topics as starting points: ${seedTopics.join(', ')}`
    : '';

  const audienceContext = audienceLevel !== 'all'
    ? `Focus on content gaps for ${audienceLevel}-level audiences.`
    : '';

  const prompt = `Find content gaps and underserved topics in the ${niche} industry.

${seedContext}
${audienceContext}

Look for:
1. Questions people are asking but not getting good answers to
2. Topics that are poorly covered by existing content
3. Niche angles on popular topics that haven't been explored
4. Emerging topics with little existing content

For each gap, explain:
- What the gap is
- Why it represents an opportunity
- What keywords might be associated with it
- How difficult it would be to fill this gap (easy, medium, hard)

Be specific and provide evidence for why these are actual gaps.`;

  try {
    const response = await provider.generateCompletion({
      prompt,
      maxTokens: 3000,
      temperature: 0.3,
    });

    // Parse gaps from response
    const gaps: ContentGap[] = [];
    const content = response.content;

    // Simple parsing - this will be interpreted by Claude anyway
    const sections = content.split(/\d+\.\s+/).filter(Boolean);

    for (const section of sections.slice(0, 5)) { // Limit to 5 gaps
      const lines = section.split('\n');
      const gap = lines[0]?.trim();

      if (gap && gap.length > 10) {
        gaps.push({
          gap: gap,
          description: lines.slice(1, 3).join(' ').trim() || gap,
          evidence: 'Based on web search analysis',
          potentialKeywords: [],
          difficulty: 'medium',
        });
      }
    }

    console.log(`[Perplexity] Found ${gaps.length} content gaps`);
    return { gaps };
  } catch (error) {
    console.error('[Perplexity] Error finding content gaps:', error);
    return { gaps: [] };
  }
}

/**
 * Main tool executor dispatcher
 */
export async function executeTopicResearchTool(
  toolName: string,
  toolInput: Record<string, any>,
  userId: string
): Promise<string> {
  console.log(`\n[ToolExecutor] Executing: ${toolName}`);
  console.log(`[ToolExecutor] Input:`, JSON.stringify(toolInput, null, 2));

  let result: any;

  switch (toolName) {
    case 'searchKeywordData':
      result = await executeSearchKeywordData(toolInput as any);
      break;

    case 'searchRelatedKeywords':
      result = await executeSearchRelatedKeywords(toolInput as any);
      break;

    case 'searchTrendingTopics':
      result = await executeSearchTrendingTopics(toolInput as any);
      break;

    case 'searchCompetitorContent':
      result = await executeSearchCompetitorContent(toolInput as any);
      break;

    case 'searchExistingContent':
      result = await executeSearchExistingContent(toolInput as any, userId);
      break;

    case 'searchContentGaps':
      result = await executeSearchContentGaps(toolInput as any);
      break;

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  const resultStr = JSON.stringify(result, null, 2);
  console.log(`[ToolExecutor] Result length: ${resultStr.length} chars`);

  return resultStr;
}
