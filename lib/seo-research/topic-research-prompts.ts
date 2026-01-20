/**
 * Topic Research Prompts
 * Three-phase approach: Research → Summarize → Generate
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

// =============================================================================
// PHASE 1: RESEARCH - Gather data using tools
// =============================================================================

export function generateResearchPhaseSystemPrompt(): string {
  return `You are an SEO research specialist. Your ONLY job in this phase is to GATHER DATA using the available tools. Do NOT generate final topics yet.

You have access to these research tools:
1. searchKeywordData - Get SEO metrics (search volume, competition, CPC) for specific keywords
2. searchRelatedKeywords - Find related keywords and long-tail variations
3. searchTrendingTopics - Find what's currently trending in a niche
4. searchCompetitorContent - Analyze what topics competitors are covering
5. searchExistingContent - Search the user's existing blog posts to avoid duplicates
6. searchContentGaps - Find underserved topics and content opportunities

RESEARCH STRATEGY:
1. Start with searchExistingContent to see what's already been covered
2. Use searchKeywordData to get metrics on seed keywords
3. Use searchRelatedKeywords to find variations
4. Use searchTrendingTopics or searchContentGaps based on user's goals
5. If competitors provided, use searchCompetitorContent

IMPORTANT RULES:
- Make 3-6 tool calls to gather comprehensive data
- Focus on GATHERING information, not analyzing it yet
- When you have enough data, respond with "RESEARCH_COMPLETE" followed by a brief summary of what data you collected
- Do NOT generate topic recommendations in this phase`;
}

export function generateResearchPhaseUserPrompt(config: TopicResearchConfig): string {
  const {
    topicDescription,
    industryNiche,
    seedKeywords,
    competitorUrls,
    contentGoals,
  } = config;

  let prompt = `Research SEO opportunities for this topic area:

USER REQUEST: ${topicDescription}

`;

  if (industryNiche) {
    prompt += `INDUSTRY/NICHE: ${industryNiche}\n\n`;
  }

  if (seedKeywords && seedKeywords.length > 0) {
    prompt += `SEED KEYWORDS TO RESEARCH: ${seedKeywords.join(', ')}\n\n`;
  }

  if (competitorUrls && competitorUrls.length > 0) {
    prompt += `COMPETITOR URLS TO ANALYZE:\n${competitorUrls.join('\n')}\n\n`;
  }

  if (contentGoals && contentGoals.length > 0) {
    const goalDescriptions: Record<string, string> = {
      'trending': 'Find trending topics',
      'gaps': 'Identify content gaps',
      'high-volume': 'Target high search volume keywords',
      'long-tail': 'Focus on long-tail opportunities',
      'evergreen': 'Find evergreen content ideas',
    };
    prompt += `RESEARCH FOCUS: ${contentGoals.map(g => goalDescriptions[g] || g).join(', ')}\n\n`;
  }

  prompt += `Begin researching. Use the tools to gather keyword data, trends, and competitive insights. When done, respond with "RESEARCH_COMPLETE".`;

  return prompt;
}

// =============================================================================
// PHASE 2: SUMMARIZE - Condense research into key insights
// =============================================================================

export function generateSummarizePhasePrompt(rawResearch: string, config: TopicResearchConfig): string {
  return `You are an SEO analyst. Analyze the following raw research data and create a focused summary.

RAW RESEARCH DATA:
${rawResearch}

USER'S GOAL: ${config.topicDescription}
NUMBER OF TOPICS NEEDED: ${config.numberOfTopics}
${config.industryNiche ? `INDUSTRY: ${config.industryNiche}` : ''}

Create a JSON summary with this EXACT structure:
{
  "keywordOpportunities": [
    {
      "keyword": "keyword phrase",
      "searchVolume": 1000,
      "competition": "low|medium|high",
      "opportunity": "why this is good"
    }
  ],
  "trendingAngles": [
    "trending topic or angle 1",
    "trending topic or angle 2"
  ],
  "contentGaps": [
    "gap or underserved topic 1",
    "gap or underserved topic 2"
  ],
  "existingContent": [
    "topic already covered 1",
    "topic already covered 2"
  ],
  "competitorInsights": [
    "what competitors do/don't cover"
  ],
  "recommendedDirections": [
    "based on research, consider this angle",
    "this keyword + trend combination looks promising"
  ]
}

RULES:
- Include the TOP 10-15 keyword opportunities (best volume/competition ratio)
- Include 3-5 trending angles
- Include 3-5 content gaps
- List existing content to AVOID duplicating
- Keep each insight concise (1 sentence)
- Return ONLY the JSON, no other text`;
}

// =============================================================================
// PHASE 3: GENERATE - Create final topics from summary
// =============================================================================

export function generateTopicsPhasePrompt(summary: string, config: TopicResearchConfig): string {
  const { numberOfTopics, topicDescription, brandContext, searchIntents, topicFocus } = config;

  let prompt = `You are an expert content strategist. Based on the research summary below, generate ${numberOfTopics} SEO-optimized blog topic ideas.

RESEARCH SUMMARY:
${summary}

USER REQUEST: ${topicDescription}

`;

  if (brandContext) {
    prompt += `BRAND CONTEXT:\n`;
    if (brandContext.blogName) prompt += `Blog: ${brandContext.blogName}\n`;
    if (brandContext.blogDescription) prompt += `About: ${brandContext.blogDescription}\n`;
    if (brandContext.targetAudience) prompt += `Audience: ${brandContext.targetAudience}\n`;
    if (brandContext.tone) prompt += `Tone: ${brandContext.tone}\n`;
    if (brandContext.topicsWeCover) prompt += `Topics We Cover: ${brandContext.topicsWeCover}\n`;
    if (brandContext.thingsToAvoid) prompt += `Avoid: ${brandContext.thingsToAvoid}\n`;
    prompt += '\n';
  }

  if (searchIntents && searchIntents.length > 0) {
    prompt += `TARGET SEARCH INTENTS: ${searchIntents.join(', ')}\n\n`;
  }

  if (topicFocus) {
    const focusDescriptions: Record<string, string> = {
      'variety': 'Generate a diverse mix of topics',
      'series': 'Generate related topics that build on each other',
      'pillar': 'Generate comprehensive pillar content ideas',
    };
    prompt += `TOPIC STYLE: ${focusDescriptions[topicFocus] || topicFocus}\n\n`;
  }

  prompt += `Generate EXACTLY ${numberOfTopics} topics as a JSON object:
{
  "topics": [
    {
      "topic": "Compelling, SEO-optimized blog title",
      "primaryKeyword": "main keyword to target",
      "secondaryKeywords": ["related", "keywords"],
      "searchVolume": 1000,
      "competition": "low|medium|high",
      "searchIntent": "informational|commercial|transactional|navigational",
      "rationale": "Why this topic based on the research",
      "contentAngle": "Specific hook or angle",
      "estimatedDifficulty": "easy|medium|hard",
      "estimatedPotential": "low|medium|high"
    }
  ],
  "researchSummary": "Brief overview of what research revealed",
  "researchInsights": {
    "trendingAngles": ["angles used"],
    "contentGaps": ["gaps addressed"],
    "keywordOpportunities": ["keywords targeted"],
    "competitorInsights": ["competitive advantages"]
  }
}

RULES:
- Each topic MUST be unique and NOT duplicate existing content mentioned in research
- Prioritize high-volume, low-competition keywords from the research
- Make titles compelling and click-worthy
- Include the primary keyword naturally in each title
- Return ONLY the JSON object, no other text`;

  return prompt;
}

// =============================================================================
// Legacy function for backwards compatibility (not used in staged approach)
// =============================================================================

export function generateTopicResearchSystemPrompt(): string {
  return generateResearchPhaseSystemPrompt();
}

export function generateTopicResearchUserPrompt(config: TopicResearchConfig): string {
  return generateResearchPhaseUserPrompt(config);
}
