import assert from 'node:assert/strict';
import {
  BlogPostDraft,
  BlogSelfAssessment,
  evaluateBlogDraft,
  fingerprintBlogDraft,
} from '../lib/generation/blog-evaluation';
import { loadBlogPostEvaluationRubric } from '../lib/generation/evaluation-rubric';
import {
  describeUnsavedGenerationAttempt,
  isRetryableGenerationError,
  summarizeGenerationFailures,
} from '../lib/generation/generation-errors';

function textWithWordCount(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ');
}

function fixedLength(text: string, length: number): string {
  return text.slice(0, length).padEnd(length, 'x');
}

const passingAssessment: BlogSelfAssessment = {
  audienceAndIntent: { score: 2, evidence: 'The opening names the requested reader and their decision.' },
  thesisAndOriginalInsight: { score: 2, evidence: 'The draft advances and supports one explicit thesis.' },
  evidenceIntegrity: { score: 2, evidence: 'Claims are attributed to the researched sources.' },
  brandVoiceAndTrust: { score: 2, evidence: 'The prose follows the configured direct, practical voice.' },
  structureAndUsefulness: { score: 2, evidence: 'Sections build toward a concrete implementation checklist.' },
  searchAndDistributionReadiness: { score: 2, evidence: 'Metadata, internal links, image text, and CTA are complete.' },
};

const validDraft: BlogPostDraft = {
  blogPost: {
    title: 'AI Consulting Metrics That Make Project Value Visible',
    description: 'A practical system for defining and reporting AI consulting outcomes.',
    slug: 'ai-consulting-metrics-project-value',
    seoTitle: fixedLength('AI Consulting Metrics: A Practical KPI Framework', 54),
    seoDescription: fixedLength('A practical framework for defining, tracking, and reporting AI consulting metrics that clients understand, trust, and use to approve the next project.', 155),
    featuredImage: 'https://ik.imagekit.io/example/featured.png',
    featuredImageThumbnail: 'https://ik.imagekit.io/example/featured-thumb.png',
    tags: ['AI consulting', 'KPIs'],
  },
  components: [
    { type: 'rich_text', order: 0, content: `## A useful framework\n\n${textWithWordCount(1250)} ai consulting metrics` },
    { type: 'image', order: 1, url: 'https://ik.imagekit.io/example/chart.png', alt: 'AI consulting KPI framework' },
    { type: 'cta', order: 2, title: 'Build your measurement system', content: 'Start with a defensible baseline.', text: 'Get started', link: '/start' },
  ],
};

const requirements = {
  requestedLength: 'Long (1200-1500 words)',
  includeImages: true,
  includeCTA: true,
  blogUrl: 'https://example.com',
  primaryKeyword: 'ai consulting metrics',
};

const passing = evaluateBlogDraft({
  draft: validDraft,
  selfAssessment: passingAssessment,
  requirements,
  attempt: 1,
});

assert.equal(passing.passed, true);
assert.equal(passing.score, 12);
assert.equal(passing.deterministicChecks.passed, true);

const invalidDraft: BlogPostDraft = {
  ...validDraft,
  blogPost: {
    ...validDraft.blogPost,
    slug: 'ai-consulting-metrics-1775380141612',
    seoDescription: fixedLength('Too long', 220),
  },
  components: validDraft.components.map(component => (
    component.type === 'rich_text'
      ? { ...component, content: textWithWordCount(2200) }
      : { ...component }
  )),
};

const mechanicallyFailing = evaluateBlogDraft({
  draft: invalidDraft,
  selfAssessment: passingAssessment,
  requirements,
  attempt: 1,
});

assert.equal(mechanicallyFailing.passed, false);
assert.deepEqual(
  mechanicallyFailing.deterministicChecks.issues
    .filter(issue => issue.severity === 'error')
    .map(issue => issue.code)
    .sort(),
  ['seo_description_length', 'timestamp_slug', 'word_count_out_of_range'],
);

const nearRangeDraft: BlogPostDraft = {
  ...validDraft,
  blogPost: {
    ...validDraft.blogPost,
    seoTitle: fixedLength('Useful AI consulting metrics guide', 40),
    seoDescription: fixedLength('A useful but slightly long SEO description', 175),
  },
  components: validDraft.components.map(component => (
    component.type === 'rich_text'
      ? { ...component, content: `${textWithWordCount(1700)} ai consulting metrics` }
      : { ...component }
  )),
};

const nearRangePassing = evaluateBlogDraft({
  draft: nearRangeDraft,
  selfAssessment: passingAssessment,
  requirements,
  attempt: 1,
});

assert.equal(nearRangePassing.passed, true);
assert.equal(nearRangePassing.deterministicChecks.passed, true);
assert.deepEqual(
  nearRangePassing.deterministicChecks.issues.map(issue => issue.severity),
  ['warning', 'warning'],
);

const lowQualityAssessment: BlogSelfAssessment = {
  ...passingAssessment,
  thesisAndOriginalInsight: {
    score: 0,
    evidence: 'The draft repeats the standard summary and does not state a thesis.',
    revisionNeeded: 'State a defensible thesis and rebuild the sections around it.',
  },
};

const editoriallyFailing = evaluateBlogDraft({
  draft: validDraft,
  selfAssessment: lowQualityAssessment,
  requirements,
  attempt: 1,
});

assert.equal(editoriallyFailing.passed, false);
assert.equal(editoriallyFailing.score, 10);
assert.match(editoriallyFailing.revisionInstructions[0], /thesisAndOriginalInsight/);
assert.match(describeUnsavedGenerationAttempt([editoriallyFailing]), /did not pass after 1 attempt/);
assert.match(describeUnsavedGenerationAttempt([passing]), /passed, but the agent did not save/);
assert.equal(isRetryableGenerationError('Temporary upstream timeout'), true);
assert.equal(
  isRetryableGenerationError('Your credit balance is too low to access the Anthropic API'),
  false,
);
assert.match(
  summarizeGenerationFailures([
    { provider: 'deepseek', model: 'deepseek-v4-pro', error: 'Quality evaluation failed' },
    { provider: 'anthropic', model: 'claude-opus-4-6', error: 'Credit balance is too low' },
  ]),
  /deepseek\/deepseek-v4-pro.*anthropic\/claude-opus-4-6/,
);
assert.equal(fingerprintBlogDraft(validDraft), fingerprintBlogDraft(validDraft));
assert.notEqual(fingerprintBlogDraft(validDraft), fingerprintBlogDraft(invalidDraft));

assert.match(loadBlogPostEvaluationRubric(), /Evidence integrity/);

console.log('Blog evaluation tests passed');
