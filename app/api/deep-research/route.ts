import { randomUUID } from 'crypto';
import { Client } from '@upstash/workflow';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';
import ChatMessage from '@/models/ChatMessage';
import DeepResearchRun from '@/models/DeepResearchRun';
import { buildAcceptanceCriteria } from '@/lib/deep-research/evaluation';
import { serializeDeepResearchRun } from '@/lib/deep-research/serialize';

export const dynamic = 'force-dynamic';

const MIN_DEEP_RESEARCH_CREDITS = 1;
const MAX_OBJECTIVE_LENGTH = 12000;

function getWorkflowBaseUrl(): string {
  return (
    process.env.UPSTASH_WORKFLOW_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.credits < MIN_DEEP_RESEARCH_CREDITS) {
      return NextResponse.json({
        error: `Deep research requires at least ${MIN_DEEP_RESEARCH_CREDITS} available credit.`,
        code: 'INSUFFICIENT_CREDITS',
      }, { status: 402 });
    }

    const body = await request.json();
    const objective = typeof body.objective === 'string' ? body.objective.trim() : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : undefined;
    if (objective.length < 15) {
      return NextResponse.json({ error: 'Describe the research question in at least 15 characters.' }, { status: 400 });
    }
    if (objective.length > MAX_OBJECTIVE_LENGTH) {
      return NextResponse.json({ error: `Research request is limited to ${MAX_OBJECTIVE_LENGTH} characters.` }, { status: 400 });
    }
    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json({ error: 'Deep research workflow is not configured.' }, { status: 503 });
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

    await ChatMessage.create({
      conversationId: conversation._id,
      owner: user.mongoId,
      date: today,
      role: 'user',
      content: objective,
    });

    const workflowToken = randomUUID();
    const run = await DeepResearchRun.create({
      owner: user.mongoId,
      ownerClerkId: user.clerkId,
      conversationId: conversation._id,
      objective,
      acceptanceCriteria: buildAcceptanceCriteria(objective),
      workflowToken,
      liveLog: [{
        timestamp: new Date(),
        type: 'phase',
        message: 'Deep research queued',
      }],
    });

    const assistantMessage = await ChatMessage.create({
      conversationId: conversation._id,
      owner: user.mongoId,
      date: today,
      role: 'assistant',
      content: '',
      deepResearchRunId: run._id,
    });
    run.assistantMessageId = assistantMessage._id;
    await run.save();

    try {
      const client = new Client({ token: process.env.QSTASH_TOKEN });
      const { workflowRunId } = await client.trigger({
        url: `${getWorkflowBaseUrl()}/api/workflow/deep-research`,
        body: JSON.stringify({
          runId: run._id.toString(),
          workflowToken,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      return NextResponse.json({
        success: true,
        workflowRunId,
        conversationId: conversation._id.toString(),
        assistantMessageId: assistantMessage._id.toString(),
        run: serializeDeepResearchRun(run.toObject()),
      }, { status: 202 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start deep research workflow.';
      await DeepResearchRun.findByIdAndUpdate(run._id, {
        $set: { status: 'failed', phase: 'failed', phaseDetail: 'Unable to start workflow', error: message, completedAt: new Date() },
      });
      await ChatMessage.findByIdAndUpdate(assistantMessage._id, {
        $set: { content: `Deep research could not be started: ${message}` },
      });
      return NextResponse.json({ error: message }, { status: 502 });
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
