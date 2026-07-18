import type {
  DeepResearchAcceptanceCriteria,
  DeepResearchEvaluationCheck,
  DeepResearchPlan,
  DeepResearchToolCall,
} from './types';

export const EVIDENCE_RESEARCH_TOOLS = new Set([
  'search_keyword_data',
  'search_related_keywords',
  'search_trending_topics',
  'search_competitor_content',
  'search_content_gaps',
  'web_search',
  'get_existing_posts',
  'get_blog_stats',
  'get_brand_settings',
  'get_content_strategy',
  'check_post_rankings',
  'get_search_console_top_pages',
]);

const URL_PATTERN = /https?:\/\/[^\s"'<>\\)\]]+/g;

export function buildAcceptanceCriteria(objective: string): DeepResearchAcceptanceCriteria {
  const normalized = objective.toLocaleLowerCase();
  const requireKeywordData = /\b(keyword|search query|search term|seo|rank|search volume|difficulty)\b/.test(normalized);
  const requireCompetitorResearch = /\b(competitors?|competitive|market landscape|alternatives|versus|vs)\b/.test(normalized);
  const requireExistingContentReview = /\b(existing|current|our posts|my posts|content library|content strategy|blog strategy)\b/.test(normalized);

  return {
    minSuccessfulResearchCalls: 6,
    minDistinctResearchTools: 3,
    minExternalSources: 5,
    minKeywordResults: requireKeywordData ? 20 : 0,
    requireKeywordData,
    requireCompetitorResearch,
    requireExistingContentReview,
  };
}

export function extractSourceUrls(toolCalls: DeepResearchToolCall[]): string[] {
  const urls = new Set<string>();
  for (const call of toolCalls) {
    if (!call.success || !call.result) continue;
    for (const match of call.result.match(URL_PATTERN) || []) {
      urls.add(match.replace(/[.,;:]+$/, ''));
    }
  }
  return Array.from(urls);
}

export function countKeywordResults(toolCalls: DeepResearchToolCall[]): number {
  const keywords = new Set<string>();

  for (const call of toolCalls) {
    if (!call.success || !call.result || !['search_keyword_data', 'search_related_keywords'].includes(call.name)) continue;
    try {
      const parsed = JSON.parse(call.result);
      const rows = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : Array.isArray(parsed.relatedKeywords)
          ? parsed.relatedKeywords
          : [];
      for (const row of rows) {
        const keyword = typeof row?.keyword === 'string' ? row.keyword.trim().toLocaleLowerCase() : '';
        if (keyword) keywords.add(keyword);
      }
    } catch {
      // Malformed tool output is covered by the evidence checks below.
    }
  }

  return keywords.size;
}

export function runDeterministicEvaluation(input: {
  plan?: DeepResearchPlan;
  criteria: DeepResearchAcceptanceCriteria;
  toolCalls: DeepResearchToolCall[];
  researchMemo: string;
}): { passed: boolean; score: number; checks: DeepResearchEvaluationCheck[]; feedback: string[] } {
  const { plan, criteria, toolCalls, researchMemo } = input;
  const successfulEvidenceCalls = toolCalls.filter((call) => call.success && EVIDENCE_RESEARCH_TOOLS.has(call.name));
  const distinctResearchTools = new Set(successfulEvidenceCalls.map((call) => call.name));
  const sourceUrls = extractSourceUrls(toolCalls);
  const keywordResults = countKeywordResults(toolCalls);
  const planItems = plan?.items || [];
  const resolvedPlanItems = planItems.filter((item) => item.status === 'completed' || item.status === 'blocked');

  const checks: DeepResearchEvaluationCheck[] = [
    {
      id: 'plan-coverage',
      label: 'Research plan coverage',
      passed: planItems.length >= 3 && resolvedPlanItems.length === planItems.length,
      actual: `${resolvedPlanItems.length}/${planItems.length}`,
      required: 'Every workstream resolved',
      detail: 'Each planned workstream must be completed or explicitly blocked with evidence.',
    },
    {
      id: 'research-calls',
      label: 'Evidence collection',
      passed: successfulEvidenceCalls.length >= criteria.minSuccessfulResearchCalls,
      actual: successfulEvidenceCalls.length,
      required: criteria.minSuccessfulResearchCalls,
      detail: 'Successful research and first-party analysis calls provide the evidence base.',
    },
    {
      id: 'tool-diversity',
      label: 'Research method diversity',
      passed: distinctResearchTools.size >= criteria.minDistinctResearchTools,
      actual: distinctResearchTools.size,
      required: criteria.minDistinctResearchTools,
      detail: 'The run must triangulate the answer rather than relying on one source or method.',
    },
    {
      id: 'external-sources',
      label: 'External source coverage',
      passed: sourceUrls.length >= criteria.minExternalSources,
      actual: sourceUrls.length,
      required: criteria.minExternalSources,
      detail: 'External claims need traceable URLs in the collected evidence.',
    },
    {
      id: 'research-memo',
      label: 'Evidence memo depth',
      passed: researchMemo.trim().length >= 1800,
      actual: researchMemo.trim().length,
      required: 1800,
      detail: 'The synthesis stage needs a substantive evidence memo, not a short conversational answer.',
    },
  ];

  if (criteria.requireKeywordData) {
    checks.push({
      id: 'keyword-data',
      label: 'Keyword dataset coverage',
      passed: keywordResults >= criteria.minKeywordResults,
      actual: keywordResults,
      required: criteria.minKeywordResults,
      detail: 'SEO recommendations must be grounded in a sufficiently broad keyword dataset.',
    });
  }

  if (criteria.requireCompetitorResearch) {
    const hasCompetitorResearch = successfulEvidenceCalls.some((call) => call.name === 'search_competitor_content');
    checks.push({
      id: 'competitor-research',
      label: 'Competitor evidence',
      passed: hasCompetitorResearch,
      actual: hasCompetitorResearch,
      required: true,
      detail: 'Competitive claims require a successful competitor-content research call.',
    });
  }

  if (criteria.requireExistingContentReview) {
    const hasExistingContentReview = successfulEvidenceCalls.some((call) =>
      ['get_existing_posts', 'get_blog_stats', 'get_content_strategy'].includes(call.name)
    );
    checks.push({
      id: 'existing-content',
      label: 'Existing content review',
      passed: hasExistingContentReview,
      actual: hasExistingContentReview,
      required: true,
      detail: 'Recommendations about the current blog must inspect its real posts or strategy.',
    });
  }

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / Math.max(checks.length, 1)) * 100);
  const feedback = checks.filter((check) => !check.passed).map((check) => `${check.label}: ${check.detail}`);

  return {
    passed: checks.every((check) => check.passed),
    score,
    checks,
    feedback,
  };
}
