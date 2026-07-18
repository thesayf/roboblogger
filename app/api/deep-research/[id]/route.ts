import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import DeepResearchRun from '@/models/DeepResearchRun';
import ChatMessage from '@/models/ChatMessage';
import { serializeDeepResearchRun } from '@/lib/deep-research/serialize';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await dbConnect();
    const run = await DeepResearchRun.findOne({ _id: id, owner: user.mongoId }).lean();
    if (!run) return NextResponse.json({ error: 'Deep research run not found.' }, { status: 404 });
    return NextResponse.json({ run: serializeDeepResearchRun(run) });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to load deep research.',
    }, { status: 500 });
  }
}
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await dbConnect();
    const run = await DeepResearchRun.findOne({ _id: id, owner: user.mongoId });
    if (!run) return NextResponse.json({ error: 'Deep research run not found.' }, { status: 404 });
    if (['completed', 'partial', 'failed'].includes(run.status)) {
      return NextResponse.json({ error: 'This deep research run has already finished.' }, { status: 409 });
    }

    run.status = 'cancelled';
    run.phase = 'cancelled';
    run.phaseDetail = 'Cancelled by user';
    run.completedAt = new Date();
    run.liveLog.push({ timestamp: new Date(), type: 'phase', message: 'Cancelled by user' });
    await run.save();
    if (run.assistantMessageId) {
      await ChatMessage.findByIdAndUpdate(run.assistantMessageId, { $set: { content: 'Deep research cancelled.' } });
    }
    return NextResponse.json({ run: serializeDeepResearchRun(run.toObject()) });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to cancel deep research.',
    }, { status: 500 });
  }
}
