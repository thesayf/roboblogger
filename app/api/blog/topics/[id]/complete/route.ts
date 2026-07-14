import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import BlogPost from '@/models/BlogPost';
import TopicCluster from '@/models/TopicCluster';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// POST /api/blog/topics/[id]/complete - Mark topic as completed with generated post ID
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - you must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generatedPostId } = body;

    if (!generatedPostId) {
      return NextResponse.json(
        { error: 'generatedPostId is required' },
        { status: 400 }
      );
    }

    // Find the topic
    const topic = await Topic.findById(params.id);
    if (!topic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (topic.owner.toString() !== currentUser.mongoId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own topics' },
        { status: 403 }
      );
    }

    // Mark as completed using the model method
    await topic.markAsCompleted(generatedPostId);

    await BlogPost.findOneAndUpdate(
      { _id: generatedPostId, owner: currentUser.mongoId },
      {
        $set: {
          sourceTopicId: topic._id,
          ...(topic.clusterId ? { clusterId: topic.clusterId } : {}),
          ...(topic.seriesId ? { seriesId: topic.seriesId } : {}),
        },
        ...(!topic.clusterId || !topic.seriesId
          ? {
              $unset: {
                ...(!topic.clusterId ? { clusterId: '' } : {}),
                ...(!topic.seriesId ? { seriesId: '' } : {}),
              },
            }
          : {}),
      }
    );
    await TopicCluster.findOneAndUpdate(
      { owner: currentUser.mongoId, primaryPillarTopicId: topic._id },
      { $set: { primaryPillarPostId: generatedPostId } }
    );

    return NextResponse.json({
      success: true,
      message: 'Topic marked as completed',
      topic: {
        id: topic._id,
        status: 'completed',
        generatedPostId
      }
    });

  } catch (error) {
    console.error('Error completing topic:', error);
    return NextResponse.json(
      { message: 'Failed to complete topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
