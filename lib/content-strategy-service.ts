import mongoose from 'mongoose';
import BlogPost from '@/models/BlogPost';
import Series from '@/models/Series';
import Topic from '@/models/Topic';
import TopicCluster from '@/models/TopicCluster';
import {
  resolveContentStructure,
  uniqueOwnedSlug,
} from '@/lib/content-structure';

export type StrategyStatus = 'draft' | 'active' | 'archived';
export type StrategyContentType = 'topic' | 'post';

export class ContentStrategyServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ContentStrategyServiceError';
    this.status = status;
  }
}

function ensureStatus(value: unknown): StrategyStatus | undefined {
  if (value === undefined) return undefined;
  if (value === 'draft' || value === 'active' || value === 'archived') return value;
  throw new ContentStrategyServiceError('Status must be draft, active, or archived');
}

function idString(value: unknown) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value && '_id' in value) {
    return idString((value as { _id: unknown })._id);
  }
  return String(value);
}

function sameId(left: unknown, right: unknown) {
  const leftId = idString(left);
  const rightId = idString(right);
  return Boolean(leftId && rightId && leftId === rightId);
}

async function requireCluster(ownerId: string, clusterId: string) {
  const cluster = await TopicCluster.findOne({ _id: clusterId, owner: ownerId });
  if (!cluster) throw new ContentStrategyServiceError('Topic cluster not found', 404);
  return cluster;
}

async function requireSeries(ownerId: string, seriesId: string) {
  const series = await Series.findOne({ _id: seriesId, owner: ownerId });
  if (!series) throw new ContentStrategyServiceError('Series not found', 404);
  return series;
}

export async function createTopicCluster(
  ownerId: string,
  input: { name: string; description?: string; slug?: string; status?: StrategyStatus }
) {
  if (typeof input.name !== 'string' || !input.name.trim()) {
    throw new ContentStrategyServiceError('Name is required');
  }

  const slug = await uniqueOwnedSlug(
    TopicCluster,
    ownerId,
    typeof input.slug === 'string' ? input.slug : input.name
  );

  return TopicCluster.create({
    owner: ownerId,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    slug,
    status: ensureStatus(input.status) || 'draft',
  });
}

export async function setClusterPillar(
  ownerId: string,
  clusterId: string,
  input: { contentType?: StrategyContentType; contentId?: string | null }
) {
  const cluster = await requireCluster(ownerId, clusterId);

  if (!input.contentId) {
    cluster.primaryPillarTopicId = undefined;
    cluster.primaryPillarPostId = undefined;
    await cluster.save();
    return cluster;
  }

  if (input.contentType !== 'topic' && input.contentType !== 'post') {
    throw new ContentStrategyServiceError('contentType must be topic or post');
  }

  if (input.contentType === 'topic') {
    const topic = await Topic.findOne({ _id: input.contentId, owner: ownerId });
    if (!topic) throw new ContentStrategyServiceError('Pillar topic not found', 404);

    const conflict = await TopicCluster.exists({
      owner: ownerId,
      primaryPillarTopicId: topic._id,
      _id: { $ne: cluster._id },
    });
    if (conflict) {
      throw new ContentStrategyServiceError(
        'This topic is already the primary pillar of another cluster',
        409
      );
    }

    let generatedPost = null;
    if (topic.generatedPostId) {
      generatedPost = await BlogPost.findOne({
        _id: topic.generatedPostId,
        owner: ownerId,
      });
      if (generatedPost) {
        const postConflict = await TopicCluster.exists({
          owner: ownerId,
          primaryPillarPostId: generatedPost._id,
          _id: { $ne: cluster._id },
        });
        if (postConflict) {
          throw new ContentStrategyServiceError(
            "The topic's generated post is already the primary pillar of another cluster",
            409
          );
        }
      }
    }

    topic.clusterId = cluster._id;
    topic.seriesId = undefined;
    await topic.save();

    if (generatedPost) {
      generatedPost.clusterId = cluster._id;
      generatedPost.seriesId = undefined;
      generatedPost.sourceTopicId = topic._id;
      await generatedPost.save();
    }

    cluster.primaryPillarTopicId = topic._id;
    cluster.primaryPillarPostId = generatedPost?._id;
  } else {
    const post = await BlogPost.findOne({ _id: input.contentId, owner: ownerId });
    if (!post) throw new ContentStrategyServiceError('Pillar post not found', 404);

    const conflict = await TopicCluster.exists({
      owner: ownerId,
      primaryPillarPostId: post._id,
      _id: { $ne: cluster._id },
    });
    if (conflict) {
      throw new ContentStrategyServiceError(
        'This post is already the primary pillar of another cluster',
        409
      );
    }

    let sourceTopic = null;
    if (post.sourceTopicId) {
      sourceTopic = await Topic.findOne({ _id: post.sourceTopicId, owner: ownerId });
      if (sourceTopic) {
        const topicConflict = await TopicCluster.exists({
          owner: ownerId,
          primaryPillarTopicId: sourceTopic._id,
          _id: { $ne: cluster._id },
        });
        if (topicConflict) {
          throw new ContentStrategyServiceError(
            "The post's source topic is already the primary pillar of another cluster",
            409
          );
        }
      }
    }

    post.clusterId = cluster._id;
    post.seriesId = undefined;
    await post.save();

    if (sourceTopic) {
      sourceTopic.clusterId = cluster._id;
      sourceTopic.seriesId = undefined;
      await sourceTopic.save();
    }

    cluster.primaryPillarPostId = post._id;
    cluster.primaryPillarTopicId = sourceTopic?._id;
  }

  await cluster.save();
  return cluster;
}

export async function updateTopicCluster(
  ownerId: string,
  clusterId: string,
  input: {
    name?: string;
    description?: string | null;
    slug?: string;
    status?: StrategyStatus;
    primaryPillarTopicId?: string | null;
    primaryPillarPostId?: string | null;
  }
) {
  const cluster = await requireCluster(ownerId, clusterId);

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new ContentStrategyServiceError('Name cannot be empty');
    cluster.name = input.name.trim();
  }
  if (input.description !== undefined) {
    cluster.description = input.description?.trim() || undefined;
  }
  const status = ensureStatus(input.status);
  if (status) cluster.status = status;
  if (input.slug !== undefined || input.name !== undefined) {
    cluster.slug = await uniqueOwnedSlug(
      TopicCluster,
      ownerId,
      input.slug || cluster.name,
      clusterId
    );
  }
  await cluster.save();

  if (input.primaryPillarTopicId !== undefined) {
    await setClusterPillar(ownerId, clusterId, {
      contentType: 'topic',
      contentId: input.primaryPillarTopicId,
    });
  } else if (input.primaryPillarPostId !== undefined) {
    await setClusterPillar(ownerId, clusterId, {
      contentType: 'post',
      contentId: input.primaryPillarPostId,
    });
  }

  return requireCluster(ownerId, clusterId);
}

export async function deleteTopicCluster(ownerId: string, clusterId: string) {
  const cluster = await requireCluster(ownerId, clusterId);
  await Promise.all([
    Series.updateMany(
      { owner: ownerId, clusterId: cluster._id },
      { $unset: { clusterId: '' } }
    ),
    Topic.updateMany(
      { owner: ownerId, clusterId: cluster._id },
      { $unset: { clusterId: '' } }
    ),
    BlogPost.updateMany(
      { owner: ownerId, clusterId: cluster._id },
      { $unset: { clusterId: '' } }
    ),
  ]);
  await cluster.deleteOne();
  return { message: 'Topic cluster deleted; its content was left intact' };
}

export async function createContentSeries(
  ownerId: string,
  input: {
    name: string;
    description?: string;
    slug?: string;
    clusterId?: string | null;
    status?: StrategyStatus;
  }
) {
  if (typeof input.name !== 'string' || !input.name.trim()) {
    throw new ContentStrategyServiceError('Name is required');
  }
  const structure = await resolveContentStructure({
    ownerId,
    clusterId: input.clusterId,
  });
  const slug = await uniqueOwnedSlug(
    Series,
    ownerId,
    typeof input.slug === 'string' ? input.slug : input.name
  );
  return Series.create({
    owner: ownerId,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    slug,
    clusterId: structure.clusterId,
    status: ensureStatus(input.status) || 'draft',
  });
}

export async function updateContentSeries(
  ownerId: string,
  seriesId: string,
  input: {
    name?: string;
    description?: string | null;
    slug?: string;
    clusterId?: string | null;
    status?: StrategyStatus;
  }
) {
  const series = await requireSeries(ownerId, seriesId);
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new ContentStrategyServiceError('Name cannot be empty');
    series.name = input.name.trim();
  }
  if (input.description !== undefined) {
    series.description = input.description?.trim() || undefined;
  }
  const status = ensureStatus(input.status);
  if (status) series.status = status;
  if (input.slug !== undefined || input.name !== undefined) {
    series.slug = await uniqueOwnedSlug(
      Series,
      ownerId,
      input.slug || series.name,
      seriesId
    );
  }

  if (input.clusterId !== undefined) {
    const structure = await resolveContentStructure({
      ownerId,
      clusterId: input.clusterId,
    });
    series.clusterId = structure.clusterId;
    const contentFilter = { owner: ownerId, seriesId: series._id };
    const update = structure.clusterId
      ? { $set: { clusterId: structure.clusterId } }
      : { $unset: { clusterId: '' } };
    await Promise.all([
      Topic.updateMany(contentFilter, update),
      BlogPost.updateMany(contentFilter, update),
    ]);
  }

  await series.save();
  return series;
}

export async function deleteContentSeries(ownerId: string, seriesId: string) {
  const series = await requireSeries(ownerId, seriesId);
  const contentFilter = { owner: ownerId, seriesId: series._id };
  await Promise.all([
    Topic.updateMany(contentFilter, { $unset: { seriesId: '' } }),
    BlogPost.updateMany(contentFilter, { $unset: { seriesId: '' } }),
  ]);
  await series.deleteOne();
  return { message: 'Series deleted; its content was left intact' };
}

export async function assignContentStructure(
  ownerId: string,
  input: {
    contentType: StrategyContentType;
    contentId: string;
    clusterId?: string | null;
    seriesId?: string | null;
  }
) {
  const structure = await resolveContentStructure({
    ownerId,
    clusterId: input.clusterId,
    seriesId: input.seriesId,
  });

  if (input.contentType === 'topic') {
    const topic = await Topic.findOne({ _id: input.contentId, owner: ownerId });
    if (!topic) throw new ContentStrategyServiceError('Topic not found', 404);

    const remainsPillar = Boolean(
      structure.clusterId && !structure.seriesId && sameId(topic.clusterId, structure.clusterId)
    );
    if (!remainsPillar) {
      await TopicCluster.updateMany(
        { owner: ownerId, primaryPillarTopicId: topic._id },
        { $unset: { primaryPillarTopicId: '', primaryPillarPostId: '' } }
      );
    }

    topic.clusterId = structure.clusterId;
    topic.seriesId = structure.seriesId;
    await topic.save();

    if (topic.generatedPostId) {
      const update: Record<string, Record<string, unknown>> = { $set: {}, $unset: {} };
      if (structure.clusterId) update.$set.clusterId = structure.clusterId;
      else update.$unset.clusterId = '';
      if (structure.seriesId) update.$set.seriesId = structure.seriesId;
      else update.$unset.seriesId = '';
      await BlogPost.findOneAndUpdate(
        { _id: topic.generatedPostId, owner: ownerId },
        update
      );
    }
    return topic;
  }

  if (input.contentType === 'post') {
    const post = await BlogPost.findOne({ _id: input.contentId, owner: ownerId });
    if (!post) throw new ContentStrategyServiceError('Post not found', 404);

    const remainsPillar = Boolean(
      structure.clusterId && !structure.seriesId && sameId(post.clusterId, structure.clusterId)
    );
    if (!remainsPillar) {
      await TopicCluster.updateMany(
        { owner: ownerId, primaryPillarPostId: post._id },
        { $unset: { primaryPillarTopicId: '', primaryPillarPostId: '' } }
      );
    }

    post.clusterId = structure.clusterId;
    post.seriesId = structure.seriesId;
    await post.save();

    if (post.sourceTopicId) {
      const update: Record<string, Record<string, unknown>> = { $set: {}, $unset: {} };
      if (structure.clusterId) update.$set.clusterId = structure.clusterId;
      else update.$unset.clusterId = '';
      if (structure.seriesId) update.$set.seriesId = structure.seriesId;
      else update.$unset.seriesId = '';
      await Topic.findOneAndUpdate(
        { _id: post.sourceTopicId, owner: ownerId },
        update
      );
    }
    return post;
  }

  throw new ContentStrategyServiceError('contentType must be topic or post');
}

export async function assignContentStructureBulk(
  ownerId: string,
  inputs: Array<{
    contentType: StrategyContentType;
    contentId: string;
    clusterId?: string | null;
    seriesId?: string | null;
  }>
) {
  const results = [];
  for (const input of inputs) {
    try {
      await assignContentStructure(ownerId, input);
      results.push({ contentId: input.contentId, success: true });
    } catch (error) {
      results.push({
        contentId: input.contentId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  return results;
}

type StrategyItem = {
  id: string;
  contentType: StrategyContentType;
  topicId?: string;
  postId?: string;
  title: string;
  description?: string;
  slug?: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  clusterId?: string;
  seriesId?: string;
  primaryKeyword?: string;
};

function topicItem(topic: any): StrategyItem {
  return {
    id: topic._id.toString(),
    contentType: 'topic',
    topicId: topic._id.toString(),
    title: topic.topic,
    description: topic.additionalRequirements,
    status: topic.status,
    scheduledAt: topic.scheduledAt?.toISOString(),
    updatedAt: topic.updatedAt?.toISOString(),
    clusterId: idString(topic.clusterId),
    seriesId: idString(topic.seriesId),
    primaryKeyword: topic.seo?.primaryKeyword,
  };
}

function postItem(post: any): StrategyItem {
  return {
    id: post._id.toString(),
    contentType: 'post',
    topicId: idString(post.sourceTopicId),
    postId: post._id.toString(),
    title: post.title,
    description: post.description,
    slug: post.slug,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString(),
    updatedAt: post.updatedAt?.toISOString(),
    clusterId: idString(post.clusterId),
    seriesId: idString(post.seriesId),
  };
}

export async function getContentStrategy(ownerId: string) {
  const [clusters, series, posts, topics] = await Promise.all([
    TopicCluster.find({ owner: ownerId }).sort({ status: 1, createdAt: -1 }).lean() as any,
    Series.find({ owner: ownerId }).sort({ status: 1, createdAt: -1 }).lean() as any,
    BlogPost.find({ owner: ownerId })
      .select('title description slug status clusterId seriesId sourceTopicId publishedAt createdAt updatedAt')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean() as any,
    Topic.find({ owner: ownerId })
      .select('topic additionalRequirements status clusterId seriesId generatedPostId scheduledAt seo.primaryKeyword createdAt updatedAt')
      .sort({ scheduledAt: 1, createdAt: -1 })
      .lean() as any,
  ]);

  const postIds = new Set(posts.map((post: any) => post._id.toString()));
  const items: StrategyItem[] = [
    ...posts.map(postItem),
    ...topics
      .filter((topic: any) => !topic.generatedPostId || !postIds.has(topic.generatedPostId.toString()))
      .map(topicItem),
  ];
  const itemMap = new Map<string, StrategyItem>();
  for (const item of items) {
    itemMap.set(`${item.contentType}:${item.id}`, item);
    if (item.topicId) itemMap.set(`topic:${item.topicId}`, item);
    if (item.postId) itemMap.set(`post:${item.postId}`, item);
  }

  const seriesData = series.map((entry: any) => ({
    _id: entry._id.toString(),
    name: entry.name,
    description: entry.description,
    slug: entry.slug,
    status: entry.status,
    clusterId: idString(entry.clusterId),
    items: items.filter((item) => sameId(item.seriesId, entry._id)),
  }));

  const clusterData = clusters.map((cluster: any) => {
    const clusterId = cluster._id.toString();
    const pillar = cluster.primaryPillarPostId
      ? itemMap.get(`post:${idString(cluster.primaryPillarPostId)}`)
      : cluster.primaryPillarTopicId
        ? itemMap.get(`topic:${idString(cluster.primaryPillarTopicId)}`)
        : undefined;
    const clusterSeries = seriesData.filter((entry: any) => entry.clusterId === clusterId);
    const supporting = items.filter(
      (item) => item.clusterId === clusterId && !item.seriesId && item !== pillar
    );
    const allItems = [
      ...(pillar ? [pillar] : []),
      ...clusterSeries.flatMap((entry: any) => entry.items),
      ...supporting,
    ];

    return {
      _id: clusterId,
      name: cluster.name,
      description: cluster.description,
      slug: cluster.slug,
      status: cluster.status,
      primaryPillarTopicId: idString(cluster.primaryPillarTopicId),
      primaryPillarPostId: idString(cluster.primaryPillarPostId),
      pillar,
      series: clusterSeries,
      supporting,
      counts: {
        total: allItems.length,
        published: allItems.filter((item) => item.status === 'published').length,
        planned: allItems.filter((item) => item.contentType === 'topic' && item.status === 'pending').length,
      },
    };
  });

  const standaloneSeries = seriesData.filter((entry: any) => !entry.clusterId);
  const unassigned = items.filter((item) => !item.clusterId && !item.seriesId);

  return {
    summary: {
      clusters: clusterData.length,
      activeClusters: clusterData.filter((cluster: any) => cluster.status === 'active').length,
      standaloneSeries: standaloneSeries.length,
      published: items.filter((item) => item.status === 'published').length,
      planned: items.filter((item) => item.contentType === 'topic' && item.status === 'pending').length,
      unassigned: unassigned.length,
    },
    clusters: clusterData,
    standaloneSeries,
    unassigned,
  };
}

export function contentStrategyServiceError(error: unknown) {
  if (error instanceof ContentStrategyServiceError) {
    return { message: error.message, status: error.status };
  }
  return null;
}
