import mongoose from 'mongoose';
import BlogComponent from '@/models/BlogComponent';
import BlogPost from '@/models/BlogPost';
import Series from '@/models/Series';
import Topic from '@/models/Topic';
import TopicCluster from '@/models/TopicCluster';

export type GenerationStrategyRole = 'pillar' | 'series' | 'supporting' | 'unstructured';

export type GenerationStrategyMetadata = {
  version: 1;
  role: GenerationStrategyRole;
  clusterId?: string;
  seriesId?: string;
  pillarPostId?: string;
  pillarTopicId?: string;
  inspectedPostIds: string[];
  inspectedTopicIds: string[];
};

export type GenerationStrategyContext = {
  prompt: string;
  metadata: GenerationStrategyMetadata;
};

function idString(value: unknown) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value && '_id' in value) {
    return idString((value as { _id: unknown })._id);
  }
  return String(value);
}

function componentText(component: any) {
  const candidates = [
    component.content,
    component.text,
    component.title,
    component.caption,
    component.quote,
  ];
  return candidates.filter((value) => typeof value === 'string').join('\n');
}

function compactPost(post: any, components: any[]) {
  const body = components
    .filter((component) => idString(component.blogPost) === post._id.toString())
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map(componentText)
    .filter(Boolean)
    .join('\n');
  const headings = Array.from(body.matchAll(/^#{2,3}\s+(.+)$/gm))
    .slice(0, 12)
    .map((match) => match[1].trim());
  const excerpt = body
    .replace(/[#*_>`\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

  return {
    id: post._id.toString(),
    title: post.title,
    description: post.description,
    slug: post.slug,
    headings,
    excerpt,
  };
}

function formatPost(label: string, post: ReturnType<typeof compactPost>) {
  const lines = [`${label}: "${post.title}"`, `URL: /blog/${post.slug}`];
  if (post.description) lines.push(`Description: ${post.description}`);
  if (post.headings.length) lines.push(`Outline: ${post.headings.join(' | ')}`);
  if (post.excerpt) lines.push(`Excerpt: ${post.excerpt}`);
  return lines.join('\n');
}

export async function buildGenerationStrategyContext(
  ownerId: string,
  topic: any
): Promise<GenerationStrategyContext> {
  const clusterId = idString(topic.clusterId);
  const seriesId = idString(topic.seriesId);
  const empty: GenerationStrategyContext = {
    prompt: '',
    metadata: {
      version: 1,
      role: 'unstructured',
      inspectedPostIds: [],
      inspectedTopicIds: [],
    },
  };
  if (!clusterId && !seriesId) return empty;

  const [cluster, series] = await Promise.all([
    clusterId ? TopicCluster.findOne({ _id: clusterId, owner: ownerId }).lean() as any : null,
    seriesId ? Series.findOne({ _id: seriesId, owner: ownerId }).lean() as any : null,
  ]);

  const isPillar = Boolean(
    cluster && idString(cluster.primaryPillarTopicId) === topic._id.toString()
  );
  const role: GenerationStrategyRole = isPillar ? 'pillar' : series ? 'series' : 'supporting';
  const pillarPostId = idString(cluster?.primaryPillarPostId);
  const pillarTopicId = idString(cluster?.primaryPillarTopicId);

  const structuredPostFilter: Record<string, unknown>[] = [];
  if (pillarPostId) structuredPostFilter.push({ _id: pillarPostId });
  if (seriesId) structuredPostFilter.push({ seriesId });
  if (clusterId && role === 'pillar') structuredPostFilter.push({ clusterId });

  const posts = structuredPostFilter.length
    ? await BlogPost.find({
        owner: ownerId,
        status: 'published',
        $or: structuredPostFilter,
      })
        .select('title description slug clusterId seriesId sourceTopicId publishedAt')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(10)
        .lean() as any[]
    : [];

  const siblingTopics = seriesId
    ? await Topic.find({
        owner: ownerId,
        seriesId,
        _id: { $ne: topic._id },
      })
        .select('topic status scheduledAt generatedPostId seo.primaryKeyword additionalRequirements')
        .sort({ scheduledAt: 1, createdAt: 1 })
        .limit(12)
        .lean() as any[]
    : [];

  let pillarTopic = null;
  if (pillarTopicId && pillarTopicId !== topic._id.toString()) {
    pillarTopic = await Topic.findOne({ _id: pillarTopicId, owner: ownerId })
      .select('topic status scheduledAt generatedPostId seo.primaryKeyword additionalRequirements')
      .lean() as any;
  }

  const components = posts.length
    ? await BlogComponent.find({ blogPost: { $in: posts.map((post) => post._id) } })
        .select('blogPost type order content text title caption quote')
        .sort({ order: 1 })
        .lean() as any[]
    : [];
  const compactPosts = posts.map((post) => compactPost(post, components));
  const pillarPost = pillarPostId
    ? compactPosts.find((post) => post.id === pillarPostId)
    : undefined;
  const siblingPosts = compactPosts.filter((post) => post.id !== pillarPostId).slice(0, 8);

  const sections: string[] = [];
  sections.push('## CONTENT STRATEGY CONTEXT');
  sections.push(`Content role: ${role}`);
  if (cluster) {
    sections.push(`Topic cluster: ${cluster.name}`);
    if (cluster.description) sections.push(`Cluster purpose: ${cluster.description}`);
  }
  if (series) {
    sections.push(`Series: ${series.name}`);
    if (series.description) sections.push(`Series purpose: ${series.description}`);
    if (!series.clusterId) sections.push('This is a standalone series with no cluster pillar.');
  }

  if (pillarPost) {
    sections.push(formatPost('PRIMARY PILLAR TO READ AND LINK TO', pillarPost));
  } else if (pillarTopic && !pillarTopic.generatedPostId) {
    sections.push([
      `PLANNED PRIMARY PILLAR: "${pillarTopic.topic}"`,
      pillarTopic.seo?.primaryKeyword ? `Target keyword: ${pillarTopic.seo.primaryKeyword}` : '',
      pillarTopic.additionalRequirements ? `Plan: ${pillarTopic.additionalRequirements}` : '',
    ].filter(Boolean).join('\n'));
  }

  if (siblingPosts.length) {
    sections.push('EXISTING RELATED POSTS TO DIFFERENTIATE FROM:');
    siblingPosts.forEach((post, index) => {
      sections.push(formatPost(`Related post ${index + 1}`, post));
    });
  }

  const plannedSiblings = siblingTopics.filter((entry) => !entry.generatedPostId);
  if (plannedSiblings.length) {
    sections.push('PLANNED SERIES TOPICS TO AVOID DUPLICATING:');
    for (const sibling of plannedSiblings) {
      sections.push([
        `- ${sibling.topic} [${sibling.status}]`,
        sibling.seo?.primaryKeyword ? `keyword: ${sibling.seo.primaryKeyword}` : '',
        sibling.additionalRequirements ? `angle: ${sibling.additionalRequirements}` : '',
      ].filter(Boolean).join(' | '));
    }
  }

  sections.push([
    'STRATEGY RULES:',
    '- Use the context above to choose a distinct angle and avoid repeating existing explanations, examples, or headings.',
    role === 'pillar'
      ? '- Write broad, durable pillar coverage and link naturally to relevant existing supporting posts.'
      : '- Link naturally to the primary pillar when a published pillar URL is provided.',
    role === 'series'
      ? '- Maintain continuity with the series while making this entry independently useful and clearly differentiated.'
      : '- Keep this post aligned with the cluster purpose without forcing a series format.',
    '- Only use internal URLs explicitly provided here or returned by searchInternalPosts. Never invent a slug.',
  ].join('\n'));

  const prompt = sections.join('\n\n').slice(0, 16000);
  return {
    prompt,
    metadata: {
      version: 1,
      role,
      clusterId,
      seriesId,
      pillarPostId,
      pillarTopicId,
      inspectedPostIds: compactPosts.map((post) => post.id),
      inspectedTopicIds: siblingTopics.map((entry) => entry._id.toString()),
    },
  };
}
