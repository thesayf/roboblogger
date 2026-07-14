import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { uniqueOwnedSlug } from '@/lib/content-structure';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import Series from '@/models/Series';
import Topic from '@/models/Topic';
import TopicCluster from '@/models/TopicCluster';

async function ownedCluster(id: string, ownerId: string) {
  return TopicCluster.findOne({ _id: id, owner: ownerId });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cluster = await TopicCluster.findOne({
      _id: params.id,
      owner: currentUser.mongoId,
    })
      .populate('primaryPillarTopicId', 'topic status generatedPostId')
      .populate('primaryPillarPostId', 'title slug status')
      .lean();
    if (!cluster) {
      return NextResponse.json({ error: 'Topic cluster not found' }, { status: 404 });
    }

    return NextResponse.json(cluster);
  } catch (error) {
    console.error('Error fetching topic cluster:', error);
    return NextResponse.json({ error: 'Failed to fetch topic cluster' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cluster = await ownedCluster(params.id, currentUser.mongoId);
    if (!cluster) {
      return NextResponse.json({ error: 'Topic cluster not found' }, { status: 404 });
    }

    const body = await request.json();
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      cluster.name = body.name;
    }
    if (body.description !== undefined) cluster.description = body.description || undefined;
    if (body.status !== undefined) cluster.status = body.status;
    if (body.slug !== undefined || body.name !== undefined) {
      cluster.slug = await uniqueOwnedSlug(
        TopicCluster,
        currentUser.mongoId,
        typeof body.slug === 'string' ? body.slug : cluster.name,
        params.id
      );
    }

    if (body.primaryPillarTopicId !== undefined) {
      if (body.primaryPillarTopicId === null || body.primaryPillarTopicId === '') {
        cluster.primaryPillarTopicId = undefined;
        cluster.primaryPillarPostId = undefined;
      } else {
        const conflictingCluster = await TopicCluster.exists({
          owner: currentUser.mongoId,
          primaryPillarTopicId: body.primaryPillarTopicId,
          _id: { $ne: cluster._id },
        });
        if (conflictingCluster) {
          return NextResponse.json(
            { error: 'This topic is already the primary pillar of another cluster' },
            { status: 409 }
          );
        }

        const topic = await Topic.findOne({
          _id: body.primaryPillarTopicId,
          owner: currentUser.mongoId,
        });
        if (!topic) {
          return NextResponse.json({ error: 'Pillar topic not found' }, { status: 404 });
        }
        if (topic.generatedPostId) {
          const conflictingPostCluster = await TopicCluster.exists({
            owner: currentUser.mongoId,
            primaryPillarPostId: topic.generatedPostId,
            _id: { $ne: cluster._id },
          });
          if (conflictingPostCluster) {
            return NextResponse.json(
              { error: 'The topic\'s generated post is already the primary pillar of another cluster' },
              { status: 409 }
            );
          }
        }

        topic.clusterId = cluster._id;
        topic.seriesId = undefined;
        await topic.save();
        cluster.primaryPillarTopicId = topic._id;

        if (topic.generatedPostId) {
          const post = await BlogPost.findOneAndUpdate(
            { _id: topic.generatedPostId, owner: currentUser.mongoId },
            {
              $set: { clusterId: cluster._id, sourceTopicId: topic._id },
              $unset: { seriesId: '' },
            },
            { new: true }
          );
          cluster.primaryPillarPostId = post?._id;
        } else {
          cluster.primaryPillarPostId = undefined;
        }
      }
    }

    if (body.primaryPillarPostId !== undefined && body.primaryPillarTopicId === undefined) {
      if (body.primaryPillarPostId === null || body.primaryPillarPostId === '') {
        cluster.primaryPillarPostId = undefined;
      } else {
        const conflictingCluster = await TopicCluster.exists({
          owner: currentUser.mongoId,
          primaryPillarPostId: body.primaryPillarPostId,
          _id: { $ne: cluster._id },
        });
        if (conflictingCluster) {
          return NextResponse.json(
            { error: 'This post is already the primary pillar of another cluster' },
            { status: 409 }
          );
        }

        const post = await BlogPost.findOne({
          _id: body.primaryPillarPostId,
          owner: currentUser.mongoId,
        });
        if (!post) {
          return NextResponse.json({ error: 'Pillar post not found' }, { status: 404 });
        }

        if (post.sourceTopicId) {
          const conflictingTopicCluster = await TopicCluster.exists({
            owner: currentUser.mongoId,
            primaryPillarTopicId: post.sourceTopicId,
            _id: { $ne: cluster._id },
          });
          if (conflictingTopicCluster) {
            return NextResponse.json(
              { error: 'The post\'s source topic is already the primary pillar of another cluster' },
              { status: 409 }
            );
          }
        }

        post.clusterId = cluster._id;
        post.seriesId = undefined;
        await post.save();
        cluster.primaryPillarPostId = post._id;

        if (post.sourceTopicId) {
          const topic = await Topic.findOneAndUpdate(
            { _id: post.sourceTopicId, owner: currentUser.mongoId },
            { $set: { clusterId: cluster._id }, $unset: { seriesId: '' } },
            { new: true }
          );
          cluster.primaryPillarTopicId = topic?._id;
        } else {
          cluster.primaryPillarTopicId = undefined;
        }
      }
    }

    await cluster.save();
    return NextResponse.json(cluster);
  } catch (error) {
    console.error('Error updating topic cluster:', error);
    return NextResponse.json({ error: 'Failed to update topic cluster' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cluster = await ownedCluster(params.id, currentUser.mongoId);
    if (!cluster) {
      return NextResponse.json({ error: 'Topic cluster not found' }, { status: 404 });
    }

    await Promise.all([
      Series.updateMany(
        { owner: currentUser.mongoId, clusterId: cluster._id },
        { $unset: { clusterId: '' } }
      ),
      Topic.updateMany(
        { owner: currentUser.mongoId, clusterId: cluster._id },
        { $unset: { clusterId: '' } }
      ),
      BlogPost.updateMany(
        { owner: currentUser.mongoId, clusterId: cluster._id },
        { $unset: { clusterId: '' } }
      ),
    ]);
    await cluster.deleteOne();

    return NextResponse.json({ message: 'Topic cluster deleted; its content was left intact' });
  } catch (error) {
    console.error('Error deleting topic cluster:', error);
    return NextResponse.json({ error: 'Failed to delete topic cluster' }, { status: 500 });
  }
}
