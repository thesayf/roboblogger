import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import RoutineExecution from '@/models/RoutineExecution';

export const dynamic = 'force-dynamic';

// GET - Lightweight polling endpoint for a single execution's live status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { executionId } = await params;
  await dbConnect();

  const execution = await RoutineExecution.findOne({
    _id: executionId,
    owner: user.mongoId,
  }).lean() as any;

  if (!execution) {
    console.warn(`[ExecPoll] Execution not found: ${executionId} (user: ${user.mongoId})`);
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: execution._id.toString(),
    status: execution.status,
    phase: execution.phase || 'queued',
    phaseDetail: execution.phaseDetail,
    liveLog: (execution.liveLog || []).map((entry: any) => ({
      timestamp: entry.timestamp,
      type: entry.type,
      message: entry.message,
    })),
    startedAt: execution.startedAt,
    completedAt: execution.completedAt,
    response: execution.status !== 'running' ? execution.response?.slice(0, 1000) : undefined,
    toolCalls: (execution.toolCalls || []).map((tc: any) => ({
      name: tc.name,
      success: tc.success,
      input: tc.input ? JSON.stringify(tc.input).slice(0, 500) : undefined,
      result: tc.result?.slice(0, 1000),
    })),
    dataChanged: execution.dataChanged,
    creditsUsed: execution.creditsUsed,
    error: execution.error,
  });
}
