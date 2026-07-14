import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import 'dotenv/config';

import BlogComponent from '@/models/BlogComponent';
import BlogPost from '@/models/BlogPost';
import Series from '@/models/Series';
import Topic from '@/models/Topic';
import TopicCluster from '@/models/TopicCluster';
import {
  assignContentStructure,
  createContentSeries,
  createTopicCluster,
  deleteContentSeries,
  deleteTopicCluster,
  getContentStrategy,
  setClusterPillar,
  updateContentSeries,
  updateTopicCluster,
} from '@/lib/content-strategy-service';
import { buildGenerationStrategyContext } from '@/lib/generation/content-strategy-context';

function id(value: unknown) {
  return value ? String(value) : undefined;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri);

  const owner = new mongoose.Types.ObjectId();
  const outsider = new mongoose.Types.ObjectId();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const postIds: mongoose.Types.ObjectId[] = [];
  const checks: string[] = [];

  try {
    const cluster = await createTopicCluster(owner.toString(), {
      name: `QA Daily Planning ${suffix}`,
      description: 'A temporary cluster used by the content strategy integration test.',
      status: 'active',
    });
    const secondCluster = await createTopicCluster(owner.toString(), {
      name: `QA Focus ${suffix}`,
      status: 'draft',
    });
    assert.notEqual(cluster.slug, secondCluster.slug);
    checks.push('cluster CRUD and unique slugs');

    const series = await createContentSeries(owner.toString(), {
      name: `QA Celebrity Schedules ${suffix}`,
      clusterId: cluster._id.toString(),
      status: 'active',
    });
    const standaloneSeries = await createContentSeries(owner.toString(), {
      name: `QA Founder Diaries ${suffix}`,
      status: 'draft',
    });
    assert.equal(id(series.clusterId), cluster._id.toString());
    assert.equal(id(standaloneSeries.clusterId), undefined);
    checks.push('clustered and standalone series creation');

    const pillarTopic = await Topic.create({
      owner,
      topic: `The Complete Guide to Planning Your Day ${suffix}`,
      status: 'completed',
      generationProvider: 'deepseek',
      priority: 'high',
      source: 'individual',
    });
    const pillarPost = await BlogPost.create({
      owner,
      author: owner,
      sourceTopicId: pillarTopic._id,
      title: `The Complete Guide to Planning Your Day ${suffix}`,
      description: 'A durable planning guide used as the cluster pillar.',
      slug: `qa-planning-guide-${suffix}`,
      status: 'published',
      publishedAt: new Date(),
      tags: [],
      components: [],
    });
    postIds.push(pillarPost._id as mongoose.Types.ObjectId);
    pillarTopic.generatedPostId = pillarPost._id.toString();
    await pillarTopic.save();
    const pillarComponent = await BlogComponent.create({
      blogPost: pillarPost._id,
      type: 'rich_text',
      order: 0,
      content: '## Build a reliable daily plan\nStart with a short list of outcomes and protect time for focused work.',
    });
    pillarPost.components = [pillarComponent._id as mongoose.Types.ObjectId];
    await pillarPost.save();

    await setClusterPillar(owner.toString(), cluster._id.toString(), {
      contentType: 'topic',
      contentId: pillarTopic._id.toString(),
    });
    const [syncedPillarTopic, syncedPillarPost, syncedCluster] = await Promise.all([
      Topic.findById(pillarTopic._id),
      BlogPost.findById(pillarPost._id),
      TopicCluster.findById(cluster._id),
    ]);
    assert.equal(id(syncedPillarTopic?.clusterId), cluster._id.toString());
    assert.equal(id(syncedPillarPost?.clusterId), cluster._id.toString());
    assert.equal(id(syncedPillarTopic?.seriesId), undefined);
    assert.equal(id(syncedCluster?.primaryPillarTopicId), pillarTopic._id.toString());
    assert.equal(id(syncedCluster?.primaryPillarPostId), pillarPost._id.toString());
    checks.push('pillar topic and generated post synchronization');

    const siblingTopic = await Topic.create({
      owner,
      topic: `How a Founder Structures Their Day ${suffix}`,
      status: 'completed',
      generationProvider: 'deepseek',
      priority: 'medium',
      source: 'individual',
    });
    const siblingPost = await BlogPost.create({
      owner,
      author: owner,
      sourceTopicId: siblingTopic._id,
      title: `How a Founder Structures Their Day ${suffix}`,
      description: 'A specific schedule analysis in the series.',
      slug: `qa-founder-schedule-${suffix}`,
      status: 'published',
      publishedAt: new Date(Date.now() - 60_000),
      tags: [],
      components: [],
    });
    postIds.push(siblingPost._id as mongoose.Types.ObjectId);
    siblingTopic.generatedPostId = siblingPost._id.toString();
    await siblingTopic.save();
    const siblingComponent = await BlogComponent.create({
      blogPost: siblingPost._id,
      type: 'rich_text',
      order: 0,
      content: '## Morning schedule\nThis article focuses on one founder and the tradeoffs in their routine.',
    });
    siblingPost.components = [siblingComponent._id as mongoose.Types.ObjectId];
    await siblingPost.save();

    await assignContentStructure(owner.toString(), {
      contentType: 'topic',
      contentId: siblingTopic._id.toString(),
      seriesId: series._id.toString(),
    });
    const [syncedSiblingTopic, syncedSiblingPost] = await Promise.all([
      Topic.findById(siblingTopic._id),
      BlogPost.findById(siblingPost._id),
    ]);
    assert.equal(id(syncedSiblingTopic?.clusterId), cluster._id.toString());
    assert.equal(id(syncedSiblingPost?.clusterId), cluster._id.toString());
    assert.equal(id(syncedSiblingPost?.seriesId), series._id.toString());
    checks.push('generated topic/post assignment synchronization');

    const targetTopic = await Topic.create({
      owner,
      topic: `How Another Founder Structures Their Day ${suffix}`,
      status: 'pending',
      generationProvider: 'deepseek',
      priority: 'medium',
      source: 'individual',
      clusterId: cluster._id,
      seriesId: series._id,
      seo: { primaryKeyword: 'founder daily schedule' },
    });
    const plannedSibling = await Topic.create({
      owner,
      topic: `How a Third Founder Structures Their Day ${suffix}`,
      status: 'pending',
      generationProvider: 'deepseek',
      priority: 'low',
      source: 'individual',
      clusterId: cluster._id,
      seriesId: series._id,
      additionalRequirements: 'Focus on delegation rather than morning routines.',
    });

    const generationContext = await buildGenerationStrategyContext(
      owner.toString(),
      targetTopic
    );
    assert.equal(generationContext.metadata.role, 'series');
    assert.equal(generationContext.metadata.clusterId, cluster._id.toString());
    assert.equal(generationContext.metadata.seriesId, series._id.toString());
    assert(generationContext.metadata.inspectedPostIds.includes(pillarPost._id.toString()));
    assert(generationContext.metadata.inspectedPostIds.includes(siblingPost._id.toString()));
    assert(generationContext.metadata.inspectedTopicIds.includes(plannedSibling._id.toString()));
    assert.match(generationContext.prompt, /PRIMARY PILLAR TO READ AND LINK TO/);
    assert.match(generationContext.prompt, /EXISTING RELATED POSTS TO DIFFERENTIATE FROM/);
    assert.match(generationContext.prompt, /PLANNED SERIES TOPICS TO AVOID DUPLICATING/);
    checks.push('generation reads pillar, published siblings, and planned siblings');

    const strategy = await getContentStrategy(owner.toString());
    const normalizedCluster = strategy.clusters.find(
      (entry: { _id: string }) => entry._id === cluster._id.toString()
    );
    assert(normalizedCluster);
    assert.equal(normalizedCluster.pillar?.postId, pillarPost._id.toString());
    assert.equal(normalizedCluster.series[0].items.length, 3);
    assert.equal(
      normalizedCluster.series[0].items.filter(
        (item: { postId?: string }) => item.postId === siblingPost._id.toString()
      ).length,
      1,
      'A completed topic and its generated post must appear once'
    );
    checks.push('normalized strategy aggregate without generated-post duplicates');

    await updateContentSeries(owner.toString(), series._id.toString(), { clusterId: null });
    const [standaloneMovedSeries, standaloneMovedTopic, standaloneMovedPost, standaloneTarget] = await Promise.all([
      Series.findById(series._id),
      Topic.findById(siblingTopic._id),
      BlogPost.findById(siblingPost._id),
      Topic.findById(targetTopic._id),
    ]);
    assert.equal(id(standaloneMovedSeries?.clusterId), undefined);
    assert.equal(id(standaloneMovedTopic?.clusterId), undefined);
    assert.equal(id(standaloneMovedPost?.clusterId), undefined);
    assert.equal(id(standaloneTarget?.clusterId), undefined);
    assert.equal(id(standaloneTarget?.seriesId), series._id.toString());

    await updateContentSeries(owner.toString(), series._id.toString(), {
      clusterId: cluster._id.toString(),
    });
    const [clusteredSeries, clusteredPost, clusteredTarget] = await Promise.all([
      Series.findById(series._id),
      BlogPost.findById(siblingPost._id),
      Topic.findById(targetTopic._id),
    ]);
    assert.equal(id(clusteredSeries?.clusterId), cluster._id.toString());
    assert.equal(id(clusteredPost?.clusterId), cluster._id.toString());
    assert.equal(id(clusteredTarget?.clusterId), cluster._id.toString());
    checks.push('series moves cascade to all member topics and posts');

    await assignContentStructure(owner.toString(), {
      contentType: 'post',
      contentId: siblingPost._id.toString(),
      seriesId: standaloneSeries._id.toString(),
    });
    const [standaloneSiblingTopic, standaloneSiblingPost] = await Promise.all([
      Topic.findById(siblingTopic._id),
      BlogPost.findById(siblingPost._id),
    ]);
    assert.equal(id(standaloneSiblingPost?.clusterId), undefined);
    assert.equal(id(standaloneSiblingTopic?.clusterId), undefined);
    assert.equal(id(standaloneSiblingTopic?.seriesId), standaloneSeries._id.toString());

    await assert.rejects(
      assignContentStructure(owner.toString(), {
        contentType: 'topic',
        contentId: targetTopic._id.toString(),
        clusterId: cluster._id.toString(),
        seriesId: standaloneSeries._id.toString(),
      }),
      /Attach the standalone series to the cluster/
    );
    checks.push('standalone-series assignment and incompatible hierarchy rejection');

    await assert.rejects(
      setClusterPillar(owner.toString(), secondCluster._id.toString(), {
        contentType: 'post',
        contentId: pillarPost._id.toString(),
      }),
      /already the primary pillar/
    );
    await assert.rejects(
      updateTopicCluster(outsider.toString(), cluster._id.toString(), { name: 'Not allowed' }),
      /not found/i
    );
    checks.push('single-pillar and owner-isolation enforcement');

    await deleteContentSeries(owner.toString(), series._id.toString());
    const topicAfterSeriesDelete = await Topic.findById(targetTopic._id);
    assert.equal(id(topicAfterSeriesDelete?.seriesId), undefined);
    assert.equal(id(topicAfterSeriesDelete?.clusterId), cluster._id.toString());

    const remainingSeries = await createContentSeries(owner.toString(), {
      name: `QA Remaining Series ${suffix}`,
      clusterId: cluster._id.toString(),
    });
    await deleteTopicCluster(owner.toString(), cluster._id.toString());
    const [topicAfterClusterDelete, seriesAfterClusterDelete] = await Promise.all([
      Topic.findById(targetTopic._id),
      Series.findById(remainingSeries._id),
    ]);
    assert.equal(id(topicAfterClusterDelete?.clusterId), undefined);
    assert.equal(id(seriesAfterClusterDelete?.clusterId), undefined);
    assert(await Topic.findById(targetTopic._id));
    assert(await Series.findById(remainingSeries._id));
    checks.push('non-destructive series and cluster deletion');

    console.log(JSON.stringify({ ok: true, checks }, null, 2));
  } finally {
    if (postIds.length) await BlogComponent.deleteMany({ blogPost: { $in: postIds } });
    await Promise.all([
      BlogPost.deleteMany({ owner }),
      Topic.deleteMany({ owner }),
      Series.deleteMany({ owner }),
      TopicCluster.deleteMany({ owner }),
    ]);
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
