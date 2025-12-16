import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

export const maxDuration = 300;

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

    const body = await request.json();
    
    // Don't allow updating certain fields directly
    const { _id, createdAt, generatedPostId, ...updateData } = body;
    
    // Get the existing topic first to compare scheduled dates
    const existingTopic = await Topic.findById(params.id);
    if (!existingTopic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update the topic
    const topic = await Topic.findByIdAndUpdate(
      params.id,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    // Vercel Cron will handle scheduled generation
    // No need to manage jobs with Agenda anymore
    const newScheduledAt = topic.scheduledAt;
    
    if (newScheduledAt && newScheduledAt > new Date()) {
      console.log(`Topic rescheduled for ${newScheduledAt} - will be processed by Vercel Cron`);
    }

    return NextResponse.json(topic);

  } catch (error) {
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

    // Find the topic first to check its status
    const topic = await Topic.findById(params.id);

    if (!topic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
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