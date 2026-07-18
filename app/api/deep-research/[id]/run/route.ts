import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import DeepResearchRun from '@/models/DeepResearchRun';
import type { CurrentUser } from '@/lib/auth/getCurrentUser';
import {
  collectDeepResearch,
  evaluateDeepResearch,
  planDeepResearch,
  synthesizeDeepResearch,
} from '@/lib/deep-research/execute';

export const dynamic = 'force-dynamic';

function tokensMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let body: any = await request.json();
    if (typeof body === 'string') body = JSON.parse(body);
    const phase = body?.phase;
    const workflowToken = typeof body?.workflowToken === 'string' ? body.workflowToken : '';
    if (!['plan', 'research', 'evaluate', 'synthesize'].includes(phase)) {
      return NextResponse.json({ success: false, error: 'Invalid deep research phase.' }, { status: 400 });
    }

    await dbConnect();
    const run = await DeepResearchRun.findById(id).select('+workflowToken');
    if (!run) return NextResponse.json({ success: false, error: 'Deep research run not found.' }, { status: 404 });
    if (!tokensMatch(workflowToken, run.workflowToken)) {
      return NextResponse.json({ success: false, error: 'Invalid workflow token.' }, { status: 401 });
    }
    if (run.status === 'cancelled') {
      return NextResponse.json({ success: false, cancelled: true, error: 'Deep research run was cancelled.' }, { status: 409 });
    }

    const userRecord = await User.findById(run.owner);
    if (!userRecord) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    const user: CurrentUser = {
      clerkId: run.ownerClerkId,
      mongoId: run.owner.toString(),
      credits: userRecord.credits,
      subscriptionStatus: userRecord.subscriptionStatus || 'none',
    };

    let result: any;
    if (phase === 'plan') result = await planDeepResearch(id, user);
    if (phase === 'research') result = await collectDeepResearch(id, user, { revisionFeedback: body?.revisionFeedback });
    if (phase === 'evaluate') result = await evaluateDeepResearch(id);
    if (phase === 'synthesize') result = await synthesizeDeepResearch(id, user);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[DeepResearch] Phase failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Deep research phase failed.',
    }, { status: 500 });
  }
}
