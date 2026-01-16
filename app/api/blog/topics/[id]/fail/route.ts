import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// POST /api/blog/topics/[id]/fail - Mark topic as failed with error message
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
    const { errorMessage } = body;

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

    // Mark as failed using the model method
    await topic.markAsFailed(errorMessage || 'Unknown error');

    return NextResponse.json({
      success: true,
      message: 'Topic marked as failed',
      topic: {
        id: topic._id,
        status: topic.status, // May be 'pending' if retries remaining, or 'failed'
        errorMessage: topic.errorMessage,
        retryCount: topic.retryCount,
        retryAfter: topic.retryAfter
      }
    });

  } catch (error) {
    console.error('Error failing topic:', error);
    return NextResponse.json(
      { message: 'Failed to mark topic as failed', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
