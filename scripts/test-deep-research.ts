import assert from 'node:assert/strict';
import {
  buildAcceptanceCriteria,
  countKeywordResults,
  extractSourceUrls,
  runDeterministicEvaluation,
} from '../lib/deep-research/evaluation';
import type { DeepResearchPlan, DeepResearchToolCall } from '../lib/deep-research/types';

const keywordRows = Array.from({ length: 24 }, (_, index) => ({
  keyword: `startup seo keyword ${index + 1}`,
  searchVolume: 100 + index,
  keywordDifficulty: 10 + index,
}));

const calls: DeepResearchToolCall[] = [
  {
    name: 'search_keyword_data',
    input: { keywords: keywordRows.map((row) => row.keyword) },
    result: JSON.stringify({ keywords: keywordRows }),
    success: true,
    createdAt: new Date(),
  },
  {
    name: 'search_related_keywords',
    input: { seedKeyword: 'startup seo' },
    result: JSON.stringify({ relatedKeywords: keywordRows.slice(0, 10) }),
    success: true,
    createdAt: new Date(),
  },
  {
    name: 'search_competitor_content',
    input: { competitors: ['example.com'] },
    result: JSON.stringify({ sources: ['https://example.com/blog', 'https://example.org/report'] }),
    success: true,
    createdAt: new Date(),
  },
  {
    name: 'web_search',
    input: { query: 'startup seo evidence' },
    result: JSON.stringify({ citations: ['https://source-one.test/study', 'https://source-two.test/data'] }),
    success: true,
    createdAt: new Date(),
  },
  {
    name: 'search_content_gaps',
    input: { niche: 'startup marketing' },
    result: JSON.stringify({ sources: ['https://source-three.test/questions'] }),
    success: true,
    createdAt: new Date(),
  },
  {
    name: 'get_existing_posts',
    input: { query: 'seo' },
    result: JSON.stringify({ posts: [{ title: 'Existing post' }] }),
    success: true,
    createdAt: new Date(),
  },
];

const plan: DeepResearchPlan = {
  title: 'Startup SEO market research',
  summary: 'Find evidence-backed opportunities.',
  queryStrategy: ['Inspect current coverage', 'Measure demand', 'Compare competitors'],
  items: ['baseline', 'keywords', 'competitors', 'synthesis'].map((id) => ({
    id,
    title: id,
    objective: `Complete ${id}`,
    requiredEvidence: ['Concrete evidence'],
    suggestedTools: [],
    status: 'completed' as const,
    summary: `${id} completed`,
    evidence: ['Evidence collected'],
    sourceUrls: [],
  })),
};

const objective = 'Research our existing startup SEO content, keyword opportunities, and competitors.';
const criteria = buildAcceptanceCriteria(objective);
assert.equal(criteria.requireKeywordData, true);
assert.equal(criteria.requireCompetitorResearch, true);
assert.equal(criteria.requireExistingContentReview, true);
assert.equal(countKeywordResults(calls), 24);
assert.equal(extractSourceUrls(calls).length, 5);

const passing = runDeterministicEvaluation({
  plan,
  criteria,
  toolCalls: calls,
  researchMemo: 'Evidence-backed research memo. '.repeat(90),
});
assert.equal(passing.passed, true, JSON.stringify(passing.feedback));
assert.equal(passing.score, 100);

const failing = runDeterministicEvaluation({
  plan: { ...plan, items: plan.items.map((item, index) => index === 0 ? { ...item, status: 'pending' as const } : item) },
  criteria,
  toolCalls: calls.slice(0, 2),
  researchMemo: 'Too short.',
});
assert.equal(failing.passed, false);
assert.ok(failing.feedback.length >= 4);

console.log('Deep research evaluation tests passed.');
