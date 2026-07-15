import { createHash } from 'crypto';

export const BLOG_EVALUATION_RUBRIC_VERSION = '1.0';
export const BLOG_EVALUATION_PASS_SCORE = 10;
export const BLOG_EVALUATION_MAX_SCORE = 12;

export const BLOG_EVALUATION_CRITERIA = [
  'audienceAndIntent',
  'thesisAndOriginalInsight',
  'evidenceIntegrity',
  'brandVoiceAndTrust',
  'structureAndUsefulness',
  'searchAndDistributionReadiness',
] as const;

export type BlogEvaluationCriterionId = typeof BLOG_EVALUATION_CRITERIA[number];
export type BlogEvaluationScore = 0 | 1 | 2;

export interface BlogDraftMetadata {
  title: string;
  description: string;
  slug: string;
  category?: string;
  readTime?: number;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  featuredImage?: string;
  featuredImageThumbnail?: string;
}

export interface BlogDraftComponent {
  type: string;
  order: number;
  [key: string]: unknown;
}

export interface BlogPostDraft {
  blogPost: BlogDraftMetadata;
  components: BlogDraftComponent[];
}

export interface BlogSelfAssessmentCriterion {
  score: BlogEvaluationScore;
  evidence: string;
  revisionNeeded?: string;
}

export type BlogSelfAssessment = Record<
  BlogEvaluationCriterionId,
  BlogSelfAssessmentCriterion
>;

export interface BlogEvaluationRequirements {
  requestedLength?: string;
  includeImages?: boolean;
  includeCTA?: boolean;
  blogUrl?: string;
  primaryKeyword?: string;
}

export interface BlogEvaluationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface BlogEvaluationRecord {
  rubricVersion: string;
  attempt: number;
  passed: boolean;
  score: number;
  maxScore: number;
  passScore: number;
  criteria: BlogSelfAssessment;
  deterministicChecks: {
    passed: boolean;
    wordCount: number;
    issues: BlogEvaluationIssue[];
  };
  revisionInstructions: string[];
  draftFingerprint: string;
  evaluatedAt: Date;
}

const TEXT_EXCLUDED_KEYS = new Set([
  '_id',
  'blogPost',
  'type',
  'order',
  'url',
  'imageUrl',
  'thumbnailUrl',
  'featuredImage',
  'featuredImageThumbnail',
  'link',
  'href',
  'variant',
  'style',
  'tableStyle',
  'fileId',
  'createdAt',
  'updatedAt',
]);

function collectReadableText(value: unknown, key = ''): string[] {
  if (typeof value === 'string') {
    if (TEXT_EXCLUDED_KEYS.has(key) || /^https?:\/\//i.test(value)) return [];
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => collectReadableText(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .flatMap(([childKey, childValue]) => collectReadableText(childValue, childKey));
  }

  return [];
}

export function countDraftWords(components: BlogDraftComponent[]): number {
  const text = collectReadableText(components).join(' ');
  return text.match(/\b[A-Za-z0-9][A-Za-z0-9'’-]*\b/g)?.length || 0;
}

function parseRequestedWordRange(requestedLength?: string): { min: number; max: number } | null {
  if (!requestedLength) return null;

  const range = requestedLength.match(/([\d,]+)\s*(?:-|–|—|to)\s*([\d,]+)\s*words?/i);
  if (range) {
    return {
      min: Number(range[1].replace(/,/g, '')),
      max: Number(range[2].replace(/,/g, '')),
    };
  }

  const exact = requestedLength.match(/([\d,]+)\s*words?/i);
  if (!exact) return null;

  const target = Number(exact[1].replace(/,/g, ''));
  return { min: target, max: target };
}

function findComponentLinks(component: BlogDraftComponent): string[] {
  const links: string[] = [];

  const visit = (value: unknown, key = '') => {
    if (typeof value === 'string') {
      if (['link', 'href', 'url'].includes(key)) links.push(value);
      Array.from(value.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
        .forEach(match => links.push(match[1]));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => visit(item, key));
      return;
    }
    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
        visit(childValue, childKey);
      });
    }
  };

  visit(component);
  return links;
}

function getConfiguredHostname(blogUrl?: string): string | null {
  if (!blogUrl) return null;
  try {
    return new URL(blogUrl.startsWith('http') ? blogUrl : `https://${blogUrl}`).hostname;
  } catch {
    return null;
  }
}

export function validateBlogDraft(
  draft: BlogPostDraft,
  requirements: BlogEvaluationRequirements,
): { passed: boolean; wordCount: number; issues: BlogEvaluationIssue[] } {
  const issues: BlogEvaluationIssue[] = [];
  const { blogPost, components } = draft;
  const wordCount = countDraftWords(components);
  const requestedRange = parseRequestedWordRange(requirements.requestedLength);

  if (requestedRange) {
    const toleratedMin = Math.floor(requestedRange.min * 0.9);
    const toleratedMax = Math.ceil(requestedRange.max * 1.1);
    if (wordCount < toleratedMin || wordCount > toleratedMax) {
      issues.push({
        code: 'word_count_out_of_range',
        severity: 'error',
        message: `Draft has ${wordCount} words; requested ${requestedRange.min}-${requestedRange.max} words (allowed tolerance ${toleratedMin}-${toleratedMax}).`,
      });
    }
  }

  const seoTitleLength = blogPost.seoTitle?.trim().length || 0;
  if (seoTitleLength < 50 || seoTitleLength > 60) {
    issues.push({
      code: 'seo_title_length',
      severity: 'error',
      message: `SEO title must be 50-60 characters; received ${seoTitleLength}.`,
    });
  }

  const seoDescriptionLength = blogPost.seoDescription?.trim().length || 0;
  if (seoDescriptionLength < 150 || seoDescriptionLength > 160) {
    issues.push({
      code: 'seo_description_length',
      severity: 'error',
      message: `SEO description must be 150-160 characters; received ${seoDescriptionLength}.`,
    });
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blogPost.slug)) {
    issues.push({
      code: 'invalid_slug',
      severity: 'error',
      message: 'Slug must contain only lowercase words, numbers, and single hyphens.',
    });
  }

  if (/(?:^|-)(?:\d{10}|\d{13})(?:-|$)/.test(blogPost.slug)) {
    issues.push({
      code: 'timestamp_slug',
      severity: 'error',
      message: 'Slug must not contain a generated Unix timestamp.',
    });
  }

  const richTextComponents = components.filter(component => component.type === 'rich_text');
  if (richTextComponents.length === 0) {
    issues.push({
      code: 'missing_article_content',
      severity: 'error',
      message: 'Draft must contain at least one rich_text component.',
    });
  }

  const containsH1 = richTextComponents.some(component => {
    const content = typeof component.content === 'string' ? component.content : '';
    return /(^|\n)#\s+/.test(content);
  });
  if (containsH1) {
    issues.push({
      code: 'content_contains_h1',
      severity: 'error',
      message: 'Article components must not repeat the page title as an H1.',
    });
  }

  if (requirements.includeImages) {
    if (!blogPost.featuredImage) {
      issues.push({
        code: 'missing_featured_image',
        severity: 'error',
        message: 'A featured image was requested but is missing.',
      });
    }
    if (!components.some(component => component.type === 'image')) {
      issues.push({
        code: 'missing_content_image',
        severity: 'error',
        message: 'Images were requested but the article has no image component.',
      });
    }
  }

  if (requirements.includeCTA && !components.some(component => component.type === 'cta')) {
    issues.push({
      code: 'missing_cta',
      severity: 'error',
      message: 'A call to action was requested but the article has no CTA component.',
    });
  }

  const orders = components.map(component => component.order);
  if (new Set(orders).size !== orders.length) {
    issues.push({
      code: 'duplicate_component_order',
      severity: 'error',
      message: 'Component order values must be unique.',
    });
  }

  const configuredHostname = getConfiguredHostname(requirements.blogUrl);
  if (configuredHostname) {
    const invalidCtaLinks = components
      .filter(component => component.type === 'cta')
      .flatMap(findComponentLinks)
      .filter(link => {
        if (link.startsWith('/')) return false;
        try {
          return new URL(link).hostname !== configuredHostname;
        } catch {
          return true;
        }
      });

    if (invalidCtaLinks.length > 0) {
      issues.push({
        code: 'unapproved_cta_domain',
        severity: 'error',
        message: `CTA links must be relative or use ${configuredHostname}; found ${invalidCtaLinks.join(', ')}.`,
      });
    }
  }

  if (requirements.primaryKeyword) {
    const keyword = requirements.primaryKeyword.toLowerCase();
    const searchableText = `${blogPost.title} ${collectReadableText(components).join(' ')}`.toLowerCase();
    if (!searchableText.includes(keyword)) {
      issues.push({
        code: 'primary_keyword_missing',
        severity: 'warning',
        message: `Primary topic phrase "${requirements.primaryKeyword}" does not appear in the title or article text.`,
      });
    }
  }

  return {
    passed: !issues.some(issue => issue.severity === 'error'),
    wordCount,
    issues,
  };
}

export function fingerprintBlogDraft(draft: BlogPostDraft): string {
  return createHash('sha256').update(JSON.stringify(draft)).digest('hex');
}

export function evaluateBlogDraft(options: {
  draft: BlogPostDraft;
  selfAssessment: BlogSelfAssessment;
  requirements: BlogEvaluationRequirements;
  attempt: number;
}): BlogEvaluationRecord {
  const { draft, selfAssessment, requirements, attempt } = options;
  const deterministicChecks = validateBlogDraft(draft, requirements);
  const score = BLOG_EVALUATION_CRITERIA.reduce(
    (total, criterion) => total + selfAssessment[criterion].score,
    0,
  );
  const zeroScoreCriteria = BLOG_EVALUATION_CRITERIA.filter(
    criterion => selfAssessment[criterion].score === 0,
  );
  const passed = (
    score >= BLOG_EVALUATION_PASS_SCORE
    && zeroScoreCriteria.length === 0
    && deterministicChecks.passed
  );

  const revisionInstructions = [
    ...zeroScoreCriteria.map(criterion => (
      `${criterion}: ${selfAssessment[criterion].revisionNeeded || 'Revise this failed criterion using the rubric.'}`
    )),
    ...BLOG_EVALUATION_CRITERIA
      .filter(criterion => selfAssessment[criterion].score === 1 && selfAssessment[criterion].revisionNeeded)
      .map(criterion => `${criterion}: ${selfAssessment[criterion].revisionNeeded}`),
    ...deterministicChecks.issues
      .filter(issue => issue.severity === 'error')
      .map(issue => issue.message),
  ];

  if (score < BLOG_EVALUATION_PASS_SCORE && zeroScoreCriteria.length === 0) {
    revisionInstructions.unshift(
      `Improve the weakest criteria until the score reaches ${BLOG_EVALUATION_PASS_SCORE}/${BLOG_EVALUATION_MAX_SCORE}.`,
    );
  }

  return {
    rubricVersion: BLOG_EVALUATION_RUBRIC_VERSION,
    attempt,
    passed,
    score,
    maxScore: BLOG_EVALUATION_MAX_SCORE,
    passScore: BLOG_EVALUATION_PASS_SCORE,
    criteria: selfAssessment,
    deterministicChecks,
    revisionInstructions,
    draftFingerprint: fingerprintBlogDraft(draft),
    evaluatedAt: new Date(),
  };
}
