/**
 * Topic Research Prompts
 * System and user prompts for the SEO topic research agentic loop
 */

export interface TopicResearchConfig {
  numberOfTopics: number;
  topicDescription: string;
  industryNiche?: string;
  seedKeywords?: string[];
  competitorUrls?: string[];
  searchIntents?: string[];
  contentGoals?: string[];
  topicFocus?: 'variety' | 'series' | 'pillar';
  brandContext?: {
    blogName?: string;
    blogDescription?: string;
    targetAudience?: string;
    tone?: string;
    styleGuidelines?: string;
    topicsWeCover?: string;
    thingsToAvoid?: string;
  };
}

export function generateTopicResearchSystemPrompt(): string {
  return `You are an expert SEO content strategist. Your job is to research and generate highly optimized blog topic ideas that will rank well in search engines and provide value to readers.

You have access to the following tools:
1. searchKeywordData - Get SEO metrics (search volume, competition, CPC) for specific keywords from DataForSEO
2. searchRelatedKeywords - Find related keywords and long-tail variations
3. searchTrendingTopics - Find what's currently trending in a niche using web search
4. searchCompetitorContent - Analyze what topics competitors are covering
5. searchExistingContent - Search the user's existing blog posts and queued topics to avoid duplicates
6. searchContentGaps - Find underserved topics and content opportunities

RESEARCH STRATEGY:
1. ALWAYS start by calling searchExistingContent to understand what the user has already written about
2. Use searchKeywordData to validate keyword opportunities with real data
3. Use searchTrendingTopics to find timely, relevant angles
4. If competitor URLs are provided, use searchCompetitorContent to find gaps
5. Use searchRelatedKeywords to expand promising keywords into topic clusters
6. Use searchContentGaps to find underserved opportunities

RESEARCH BEST PRACTICES:
- Search iteratively - refine your queries based on what you find
- Cross-reference findings - validate trends with keyword data
- Avoid duplicates - always check existing content first
- Look for low-competition opportunities - high volume + low competition = ideal
- Consider search intent - match topic format to what users want (how-to vs comparison vs listicle)
- Think about content clusters - suggest related topics that link together

When you have gathered enough research (typically 3-6 tool calls), generate your final topic recommendations.

OUTPUT FORMAT:
When ready, return a JSON object with this exact structure:
{
  "researchSummary": "Brief summary of what you found during research",
  "topics": [
    {
      "topic": "SEO-optimized title for the blog post",
      "primaryKeyword": "main keyword to target",
      "secondaryKeywords": ["related", "keywords"],
      "searchVolume": 1000,
      "competition": "low|medium|high",
      "searchIntent": "informational|commercial|transactional|navigational",
      "rationale": "Why this topic was chosen based on research",
      "contentAngle": "Specific angle or hook for this topic",
      "estimatedDifficulty": "easy|medium|hard",
      "estimatedPotential": "low|medium|high"
    }
  ],
  "researchInsights": {
    "trendingAngles": ["timely angles discovered"],
    "contentGaps": ["gaps found in the niche"],
    "keywordOpportunities": ["promising keywords found"],
    "competitorInsights": ["what competitors are/aren't covering"]
  },
  "confidenceLevel": "high|medium|low"
}

IMPORTANT:
- Generate EXACTLY the number of topics requested
- Each topic must be unique and not duplicate existing content
- Prioritize topics with the best combination of search volume and low competition
- Make titles compelling and click-worthy while including the primary keyword
- Return ONLY the JSON object, no additional text`;
}

export function generateTopicResearchUserPrompt(config: TopicResearchConfig): string {
  const {
    numberOfTopics,
    topicDescription,
    industryNiche,
    seedKeywords,
    competitorUrls,
    searchIntents,
    contentGoals,
    topicFocus,
    brandContext,
  } = config;

  let prompt = `Generate ${numberOfTopics} SEO-optimized blog topic ideas.

USER REQUEST:
${topicDescription}

`;

  if (industryNiche) {
    prompt += `INDUSTRY/NICHE: ${industryNiche}\n\n`;
  }

  if (seedKeywords && seedKeywords.length > 0) {
    prompt += `SEED KEYWORDS TO RESEARCH:
${seedKeywords.join(', ')}

`;
  }

  if (competitorUrls && competitorUrls.length > 0) {
    prompt += `COMPETITOR URLS TO ANALYZE:
${competitorUrls.join('\n')}

`;
  }

  if (searchIntents && searchIntents.length > 0) {
    prompt += `TARGET SEARCH INTENTS: ${searchIntents.join(', ')}\n\n`;
  }

  if (contentGoals && contentGoals.length > 0) {
    const goalDescriptions: Record<string, string> = {
      'trending': 'Find trending topics that are currently popular',
      'gaps': 'Identify content gaps that competitors have missed',
      'high-volume': 'Target high search volume keywords',
      'long-tail': 'Focus on long-tail, low-competition opportunities',
      'evergreen': 'Create evergreen content that stays relevant',
    };

    prompt += `CONTENT GOALS:
${contentGoals.map(g => `- ${goalDescriptions[g] || g}`).join('\n')}

`;
  }

  if (topicFocus) {
    const focusDescriptions: Record<string, string> = {
      'variety': 'Generate a diverse mix of different topics',
      'series': 'Generate related topics that build on each other (content series)',
      'pillar': 'Generate comprehensive pillar content ideas',
    };
    prompt += `TOPIC FOCUS: ${focusDescriptions[topicFocus] || topicFocus}\n\n`;
  }

  if (brandContext) {
    prompt += `BRAND CONTEXT:\n`;
    if (brandContext.blogName) prompt += `Blog Name: ${brandContext.blogName}\n`;
    if (brandContext.blogDescription) prompt += `About: ${brandContext.blogDescription}\n`;
    if (brandContext.targetAudience) prompt += `Target Audience: ${brandContext.targetAudience}\n`;
    if (brandContext.tone) prompt += `Tone: ${brandContext.tone}\n`;
    if (brandContext.topicsWeCover) prompt += `Topics We Cover: ${brandContext.topicsWeCover}\n`;
    if (brandContext.thingsToAvoid) prompt += `Things to Avoid: ${brandContext.thingsToAvoid}\n`;
    prompt += '\n';
  }

  prompt += `INSTRUCTIONS:
1. First, search existing content to understand what's already been covered
2. Research keyword opportunities using the SEO tools
3. Look for trending topics and content gaps
4. Generate ${numberOfTopics} unique, SEO-optimized topic ideas
5. Each topic should have clear keyword targeting and search intent
6. Avoid suggesting topics too similar to existing content
7. Prioritize topics with good search volume and manageable competition

Begin your research now.`;

  return prompt;
}
