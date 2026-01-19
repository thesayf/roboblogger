/**
 * Embedding Service
 * Generates vector embeddings for blog posts using OpenAI
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Truncate if too long (model has 8191 token limit)
  const truncatedText = text.slice(0, 8000);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncatedText,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Filter out empty texts and truncate
  const validTexts = texts
    .filter(t => t && t.trim().length > 0)
    .map(t => t.slice(0, 8000));

  if (validTexts.length === 0) {
    return [];
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: validTexts,
  });

  return response.data.map((d: { embedding: number[] }) => d.embedding);
}

/**
 * Create a searchable text representation of a blog post
 * This combines title, content summary, and keywords for better semantic matching
 */
export function createPostEmbeddingText(post: {
  title: string;
  content?: string;
  seo?: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    metaDescription?: string;
  };
  tags?: string[];
}): string {
  const parts: string[] = [];

  // Title is most important
  if (post.title) {
    parts.push(`Title: ${post.title}`);
  }

  // Meta description is a good summary
  if (post.seo?.metaDescription) {
    parts.push(`Summary: ${post.seo.metaDescription}`);
  }

  // Keywords help with matching
  if (post.seo?.primaryKeyword) {
    parts.push(`Primary keyword: ${post.seo.primaryKeyword}`);
  }
  if (post.seo?.secondaryKeywords?.length) {
    parts.push(`Keywords: ${post.seo.secondaryKeywords.join(', ')}`);
  }

  // Tags provide additional context
  if (post.tags?.length) {
    parts.push(`Tags: ${post.tags.join(', ')}`);
  }

  // Include first part of content if available (for richer embedding)
  if (post.content) {
    // Strip HTML and take first 500 chars
    const plainContent = post.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
    if (plainContent) {
      parts.push(`Content: ${plainContent}`);
    }
  }

  return parts.join('\n');
}

/**
 * Create a searchable text representation of a topic in queue
 */
export function createTopicEmbeddingText(topic: {
  topic: string;
  audience?: string;
  additionalRequirements?: string;
  seo?: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
  };
  tags?: string[];
}): string {
  const parts: string[] = [];

  if (topic.topic) {
    parts.push(`Topic: ${topic.topic}`);
  }
  if (topic.audience) {
    parts.push(`Audience: ${topic.audience}`);
  }
  if (topic.seo?.primaryKeyword) {
    parts.push(`Primary keyword: ${topic.seo.primaryKeyword}`);
  }
  if (topic.seo?.secondaryKeywords?.length) {
    parts.push(`Keywords: ${topic.seo.secondaryKeywords.join(', ')}`);
  }
  if (topic.tags?.length) {
    parts.push(`Tags: ${topic.tags.join(', ')}`);
  }
  if (topic.additionalRequirements) {
    parts.push(`Requirements: ${topic.additionalRequirements.slice(0, 200)}`);
  }

  return parts.join('\n');
}
