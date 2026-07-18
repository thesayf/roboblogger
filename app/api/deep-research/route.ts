import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';
import DeepResearchRun from '@/models/DeepResearchRun';
import { serializeDeepResearchRun } from '@/lib/deep-research/serialize';
import {
  DeepResearchStartError,
  startDeepResearchRun,
  validateDeepResearchStart,
} from '@/lib/deep-research/start';
import { normalizeChatMode } from '@/lib/chat/chat-mode';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const objective = typeof body.objective === 'string' ? body.objective.trim() : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
    const mode = normalizeChatMode(body.mode);

    try {
      validateDeepResearchStart(objective, user.credits);
    } catch (error) {
      const startError = error instanceof DeepResearchStartError ? error : null;
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Unable to start research.',
        code: startError?.code,
      }, { status: startError?.status || 400 });
    }

    await dbConnect();
    const today = new Date().toISOString().split('T')[0];
    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, owner: user.mongoId })
      : await Conversation.findOne({ owner: user.mongoId, date: today });

    if (conversationId && !conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    if (!conversation) {
      conversation = await Conversation.create({
        owner: user.mongoId,
        date: today,
        title: objective.slice(0, 100),
      });
    }

    try {
      const started = await startDeepResearchRun({
        ownerId: user.mongoId,
        ownerClerkId: user.clerkId,
        conversationId: conversation._id.toString(),
        date: today,
        objective,
        availableCredits: user.credits,
        mode,
        createUserMessage: true,
      });
      return NextResponse.json({
        success: true,
        ...started,
      }, { status: 202 });
    } catch (error) {
      const startError = error instanceof DeepResearchStartError ? error : null;
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Unable to start research.',
        code: startError?.code,
      }, { status: startError?.status || 500 });
    }
  } catch (error) {
    console.error('[DeepResearch] Trigger failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to start deep research.',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const runs = await DeepResearchRun.find({ owner: user.mongoId })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();
    return NextResponse.json({ runs: runs.map(serializeDeepResearchRun) });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to load deep research runs.',
    }, { status: 500 });
  }
}
