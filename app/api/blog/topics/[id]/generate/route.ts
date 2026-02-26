import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

// POST /api/blog/topics/[id]/generate - Trigger blog generation workflow
export async function POST(
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

    if (topic.status === 'completed' && topic.generatedPostId) {
      return NextResponse.json(
        { message: 'Topic has already been generated. Blog post ID: ' + topic.generatedPostId },
        { status: 400 }
      );
    }

    // Mark as generating if not already
    if (topic.status !== 'generating') {
      topic.status = 'generating';
      topic.processingStartedAt = new Date();
      topic.generationPhase = 'initializing';
      await topic.save();
    }

    // Trigger the Upstash Workflow
    const baseUrl = process.env.UPSTASH_WORKFLOW_URL ||
                   process.env.NEXT_PUBLIC_BASE_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                   'http://localhost:3000');

    const workflowUrl = `${baseUrl}/api/workflow/generate-post`;

    console.log(`[Generate] Triggering workflow for topic ${topic._id}: "${topic.topic}"`);
    console.log(`[Generate] Workflow URL: ${workflowUrl}`);

    // The workflow serve() handler is designed to be called by QStash.
    // When we call it directly, it starts the workflow and returns a 200.
    // We don't fail on non-200 since the workflow may still have been triggered.
    try {
      const workflowResponse = await fetch(workflowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic._id.toString() }),
      });
      console.log(`[Generate] Workflow response: ${workflowResponse.status}`);
    } catch (fetchError) {
      // Log but don't fail — the workflow may have been triggered
      console.warn(`[Generate] Workflow fetch error (may still be running):`, fetchError);
    }

    console.log(`[Generate] Workflow triggered for topic ${topic._id}`);

    return NextResponse.json({
      message: 'Generation workflow started',
      topic: {
        id: topic._id,
        status: 'generating',
      }
    });

  } catch (error) {
    console.error('Error triggering topic generation:', error);
    return NextResponse.json(
      { message: 'Failed to trigger generation', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/blog/topics/[id]/generate - Get generation status
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

    // If completed, also fetch the generated blog post details
    let blogPost = null;
    if (topic.status === 'completed' && topic.generatedPostId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                       'http://localhost:3000');
        const getPostResponse = await fetch(`${baseUrl}/api/blog/posts/${topic.generatedPostId}`);
        if (getPostResponse.ok) {
          blogPost = await getPostResponse.json();
        }
      } catch (error) {
        console.warn('Could not fetch generated blog post:', error);
      }
    }

    return NextResponse.json({
      topic: {
        id: topic._id,
        status: topic.status,
        generationPhase: topic.generationPhase,
        errorMessage: topic.errorMessage,
        retryCount: topic.retryCount,
        generatedPostId: topic.generatedPostId,
        updatedAt: topic.updatedAt
      },
      blogPost
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch generation status', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
