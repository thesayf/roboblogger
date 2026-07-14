import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import BlogPost from '@/models/BlogPost';
import TopicCluster from '@/models/TopicCluster';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import {
  contentStructureErrorResponse,
  resolveContentStructure,
} from '@/lib/content-structure';

// GET /api/blog/topics/[id] - Get a single topic by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const topic = await Topic.findById(params.id);

    if (!topic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);

  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { message: 'Failed to fetch topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/blog/topics/[id] - Update a single topic by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - you must be logged in to update topics' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Don't allow updating certain fields directly
    const { _id, createdAt, generatedPostId, owner, ...updateData } = body;

    // Get the existing topic first to check ownership
    const existingTopic = await Topic.findById(params.id);
    if (!existingTopic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingTopic.owner.toString() !== currentUser.mongoId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own topics' },
        { status: 403 }
      );
    }

    const { clusterId, seriesId, ...nonStructureUpdates } = updateData;
    const updateOperation: Record<string, any> = {
      $set: {
        ...nonStructureUpdates,
        updatedAt: new Date()
      }
    };

    if (clusterId !== undefined || seriesId !== undefined) {
      const structure = await resolveContentStructure({
        ownerId: currentUser.mongoId,
        clusterId: clusterId !== undefined ? clusterId : existingTopic.clusterId?.toString(),
        seriesId: seriesId !== undefined ? seriesId : existingTopic.seriesId?.toString(),
      });
      updateOperation.$unset = {};

      if (structure.clusterId) updateOperation.$set.clusterId = structure.clusterId;
      else updateOperation.$unset.clusterId = '';
      if (structure.seriesId) updateOperation.$set.seriesId = structure.seriesId;
      else updateOperation.$unset.seriesId = '';
    }

    // Update the topic
    const topic = await Topic.findByIdAndUpdate(
      params.id,
      updateOperation,
      { new: true, runValidators: true }
    );

    if ((clusterId !== undefined || seriesId !== undefined) && topic.generatedPostId) {
      const setFields: Record<string, unknown> = {};
      const unsetFields: Record<string, ''> = {};
      if (topic.clusterId) setFields.clusterId = topic.clusterId;
      else unsetFields.clusterId = '';
      if (topic.seriesId) setFields.seriesId = topic.seriesId;
      else unsetFields.seriesId = '';
      const structureUpdate = {
        ...(Object.keys(setFields).length ? { $set: setFields } : {}),
        ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}),
      };

      await BlogPost.findOneAndUpdate(
        { _id: topic.generatedPostId, owner: currentUser.mongoId },
        structureUpdate
      );
      await TopicCluster.updateMany(
        {
          owner: currentUser.mongoId,
          primaryPillarTopicId: topic._id,
          ...(topic.clusterId && !topic.seriesId
            ? { _id: { $ne: topic.clusterId } }
            : {}),
        },
        { $unset: { primaryPillarTopicId: '', primaryPillarPostId: '' } }
      );
    }

    // Vercel Cron will handle scheduled generation
    // No need to manage jobs with Agenda anymore
    const newScheduledAt = topic.scheduledAt;

    if (newScheduledAt && newScheduledAt > new Date()) {
      console.log(`Topic rescheduled for ${newScheduledAt} - will be processed by Vercel Cron`);
    }

    return NextResponse.json(topic);

  } catch (error) {
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json(
        { message: structureError.message },
        { status: structureError.status }
      );
    }
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { message: 'Failed to update topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/topics/[id] - Delete a single topic by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - you must be logged in to delete topics' },
        { status: 401 }
      );
    }

    // Find the topic first to check its status and ownership
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
        { error: 'Forbidden - You can only delete your own topics' },
        { status: 403 }
      );
    }

    // Only allow deleting pending or failed topics to prevent data loss
    if (topic.status === 'generating') {
      return NextResponse.json(
        { message: 'Cannot delete topic that is currently being generated' },
        { status: 400 }
      );
    }

    if (topic.status === 'completed' && topic.generatedPostId) {
      return NextResponse.json(
        { message: 'Cannot delete topic that has generated a blog post. Archive it instead.' },
        { status: 400 }
      );
    }

    // No need to cancel jobs - Vercel Cron will skip deleted topics

    await TopicCluster.updateMany(
      { owner: currentUser.mongoId, primaryPillarTopicId: topic._id },
      { $unset: { primaryPillarTopicId: '', primaryPillarPostId: '' } }
    );

    // Delete the topic
    await Topic.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Topic deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { message: 'Failed to delete topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
