import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import { BLOG_GENERATION_CREDITS, deductCredits } from '@/lib/billing/credit-service';
import { executeGenerationAgent } from '@/lib/generation/unified-agent';
import { authenticateApiRequest, optionsResponse, withCors } from '@/lib/api/v1-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, 'topics:generate');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const topic = await Topic.findOne({ _id: params.id, owner: auth.validation.ownerId });
  if (!topic) {
    return withCors(NextResponse.json({ error: 'Topic not found' }, { status: 404 }));
  }
  if (topic.status === 'generating') {
    return withCors(NextResponse.json({
      message: 'Generation already in progress',
      topic: { id: topic._id.toString(), status: topic.status, generationPhase: topic.generationPhase },
    }));
  }
  if (topic.status === 'completed' && topic.generatedPostId) {
    return withCors(NextResponse.json({ error: 'Topic has already generated a post', generatedPostId: topic.generatedPostId }, { status: 400 }));
  }

  const creditResult = await deductCredits(
    auth.validation.ownerId!,
    BLOG_GENERATION_CREDITS,
    'blog_generation',
    `API blog generation: "${topic.topic}"`,
    { topicId: topic._id.toString(), apiKeyId: auth.validation.apiKey!._id.toString() }
  );
  if (!creditResult.success) {
    return withCors(NextResponse.json({
      error: 'Insufficient credits for blog generation',
      required: BLOG_GENERATION_CREDITS,
      available: creditResult.available,
    }, { status: 402 }));
  }

  topic.status = 'generating';
  topic.processingStartedAt = new Date();
  topic.generationPhase = 'initializing';
  await topic.save();

  executeGenerationAgent({
    topicId: topic._id.toString(),
    ownerId: auth.validation.ownerId!,
    provider: topic.generationProvider,
  }).catch((error) => {
    console.error(`[API v1] Generation crashed for topic ${topic._id}:`, error);
  });

  return withCors(NextResponse.json({
    message: 'Generation started',
    topic: {
      id: topic._id.toString(),
      status: topic.status,
      generationPhase: topic.generationPhase,
    },
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, 'topics:read');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const topic = await Topic.findOne({ _id: params.id, owner: auth.validation.ownerId })
    .select('topic status generationPhase errorMessage retryCount generatedPostId generationMetadata updatedAt')
    .lean() as any;

  if (!topic) {
    return withCors(NextResponse.json({ error: 'Topic not found' }, { status: 404 }));
  }

  return withCors(NextResponse.json({ topic }));
}

export async function OPTIONS() {
  return optionsResponse();
}
