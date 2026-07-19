import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import {
  deductCredits,
  refundCredits,
  BLOG_GENERATION_CREDITS,
} from '@/lib/billing/credit-service';
import { executeGenerationAgent } from '@/lib/generation/unified-agent';

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

    if (topic.status === 'generating') {
      return NextResponse.json({
        message: 'Generation is already in progress',
        topic: {
          id: topic._id,
          status: topic.status,
          generationPhase: topic.generationPhase,
        },
      });
    }

    // Deduct credits before starting generation
    const ownerId = topic.owner?.toString();
    let creditsDeducted = false;
    let creditsRefunded = false;
    if (ownerId) {
      const creditResult = await deductCredits(
        ownerId,
        BLOG_GENERATION_CREDITS,
        'blog_generation',
        `Blog generation: "${topic.topic}"`,
        { topicId: topic._id.toString() },
      );

      if (!creditResult.success) {
        return NextResponse.json(
          {
            message: 'Insufficient credits for blog generation',
            required: BLOG_GENERATION_CREDITS,
            available: creditResult.available,
          },
          { status: 402 }
        );
      }
      creditsDeducted = true;
    }

    const refundGenerationCredit = async (description: string, error?: string) => {
      if (!creditsDeducted || creditsRefunded || !ownerId) return;
      creditsRefunded = true;
      try {
        await refundCredits(
          ownerId,
          BLOG_GENERATION_CREDITS,
          description,
          { topicId: topic._id.toString(), error },
        );
      } catch (refundError) {
        creditsRefunded = false;
        console.error(`[Generate] Failed to refund topic ${topic._id}:`, refundError);
      }
    };

    // A manual retry is a fresh attempt. Clear the previous provider's error and
    // retry backoff so changing from Premium to Efficient does not leave stale
    // Claude state attached to the new DeepSeek run.
    if (topic.status === 'failed') {
      topic.retryCount = 0;
    }
    topic.status = 'generating';
    topic.processingStartedAt = new Date();
    topic.generationPhase = 'initializing';
    topic.errorMessage = undefined;
    topic.failureReason = undefined;
    topic.retryAfter = undefined;
    await topic.save();

    // Fire and forget — the agent runs in the background on Railway (no serverless timeout)
    console.log(`[Generate] Starting unified agent for topic ${topic._id} with provider ${topic.generationProvider}: "${topic.topic}"`);

    executeGenerationAgent({
      topicId: topic._id.toString(),
      ownerId: topic.owner.toString(),
      provider: topic.generationProvider,
    })
      .then(async generationResult => {
        console.log(`[Generate] Agent completed for topic ${topic._id}: ${generationResult.success ? 'success' : 'failed'}${generationResult.postId ? ` (post ${generationResult.postId})` : ''}${generationResult.error ? ` — ${generationResult.error}` : ''}`);
        if (!generationResult.success) {
          await refundGenerationCredit(
            `Refund for failed blog generation: "${topic.topic}"`,
            generationResult.error,
          );
        }
      })
      .catch(async err => {
        console.error(`[Generate] Agent crashed for topic ${topic._id}:`, err);
        await refundGenerationCredit(
          `Refund for crashed blog generation: "${topic.topic}"`,
          err instanceof Error ? err.message : String(err),
        );
      });

    return NextResponse.json({
      message: 'Generation started',
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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
        generationMetadata: topic.generationMetadata,
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
