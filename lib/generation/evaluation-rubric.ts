import { readFileSync } from 'fs';
import { join } from 'path';

const RUBRIC_PATH = join(process.cwd(), 'evals', 'blog-post-quality.md');
const DEFAULT_MAX_ATTEMPTS = 4;

const FALLBACK_RUBRIC = `# Blog Post Quality Eval

Score audience and intent, thesis and original insight, evidence integrity,
brand voice and trust, structure and usefulness, and search and distribution
readiness from 0 to 2. The draft passes with at least 10/12, no zero scores,
and all deterministic checks passing. Revise failed work before saving.`;

let cachedRubric: string | null = null;

export function loadBlogPostEvaluationRubric(): string {
  if (cachedRubric) return cachedRubric;

  try {
    cachedRubric = readFileSync(RUBRIC_PATH, 'utf8').trim();
  } catch (error) {
    console.warn('[generation] Could not load evals/blog-post-quality.md; using fallback rubric.', error);
    cachedRubric = FALLBACK_RUBRIC;
  }

  return cachedRubric;
}

export function getBlogEvaluationMaxAttempts(): number {
  const parsed = Number(process.env.BLOG_EVALUATION_MAX_ATTEMPTS);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_MAX_ATTEMPTS;
  return Math.min(parsed, 6);
}
