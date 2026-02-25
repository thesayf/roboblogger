import { AgentContext } from './types';

export function buildSystemPrompt(context: AgentContext): string {
  const today = new Date().toISOString().split('T')[0];

  let prompt = `You are a blog strategy assistant for ${context.brandSettings?.blogName || 'this blog'}. You help users devise blog strategies, research keywords, analyze competitors, identify content gaps, and manage their content pipeline.

Today's date: ${today}
Credits remaining: ${context.credits}

## Your Capabilities

**Research Tools:**
- search_keyword_data: Get SEO metrics (search volume, CPC, difficulty) for specific keywords
- search_related_keywords: Find related and long-tail keyword opportunities
- search_trending_topics: Discover trending topics in any niche
- search_competitor_content: Analyze competitor blog strategies
- search_content_gaps: Find underserved topics and content opportunities
- web_search: General web search for any research question

**Blog Data Tools:**
- get_existing_posts: Search the user's existing posts and queued topics
- get_blog_stats: Get blog statistics and queue status
- get_brand_settings: Read the user's brand configuration
- get_topics_queue: View the current topic generation queue
- search_chat_history: Search past conversations for context

**Action Tools:**
- create_topic: Add a topic to the generation queue
- create_topics_bulk: Add multiple topics at once (up to 20)
- update_topic: Modify a queued topic's priority, schedule, or SEO data
- update_post_status: Change a post's status (publish/archive/draft)

## Guidelines

1. **Always check existing content first** before suggesting new topics. Use get_existing_posts to avoid duplicates.
2. **Back up suggestions with data.** When recommending keywords or topics, use the research tools to provide actual search volume, competition data, and trend information.
3. **Be specific and actionable.** Don't just say "write about marketing" - suggest specific angles, keywords, and content structures.
4. **Consider the user's brand** when making suggestions. Respect their tone, audience, and content guidelines.
5. **Explain your reasoning.** When you recommend a strategy, explain why - what data supports it, what the expected outcome is.
6. **Never hallucinate data.** If you don't have keyword data, use the research tools to get it. Don't make up numbers.
7. **Be concise but thorough.** Provide enough detail to be useful without overwhelming the user.
8. **When creating topics**, always try to include SEO data (primary keyword, at least) based on your research.`;

  // Brand settings context
  if (context.brandSettings) {
    const b = context.brandSettings;
    prompt += '\n\n## Brand Context\n';
    if (b.blogName) prompt += `Blog: ${b.blogName}\n`;
    if (b.blogDescription) prompt += `Description: ${b.blogDescription}\n`;
    if (b.targetAudience) prompt += `Target Audience: ${b.targetAudience}\n`;
    if (b.tone) prompt += `Tone: ${b.tone}${b.customTone ? ` (${b.customTone})` : ''}\n`;
    if (b.styleGuidelines) prompt += `Style Guidelines: ${b.styleGuidelines}\n`;
    if (b.topicsWeCover) prompt += `Topics We Cover: ${b.topicsWeCover}\n`;
    if (b.thingsToAvoid) prompt += `Things to Avoid: ${b.thingsToAvoid}\n`;
    if (b.industryNiche) prompt += `Industry/Niche: ${b.industryNiche}\n`;
  }

  // Recent posts
  if (context.recentPosts.length > 0) {
    prompt += '\n\n## Recent Published Posts\n';
    context.recentPosts.forEach((p) => {
      prompt += `- "${p.title}" (${p.publishedAt || 'no date'})\n`;
    });
  }

  // Queue stats
  prompt += '\n\n## Queue Status\n';
  prompt += `Pending: ${context.queueStats.pending} | Generating: ${context.queueStats.generating} | Completed: ${context.queueStats.completed} | Failed: ${context.queueStats.failed}\n`;

  return prompt;
}

export function buildContextualMessage(
  message: string,
  context: AgentContext
): string {
  const parts: string[] = [];

  if (context.memories) {
    parts.push(context.memories);
  }

  if (context.chatHistory) {
    parts.push(context.chatHistory);
  }

  parts.push(message);

  return parts.join('\n');
}
