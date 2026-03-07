import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

export const dynamic = 'force-dynamic';

// GET - Get routine with recent executions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const routine = await Routine.findOne({ _id: id, owner: user.mongoId }).lean() as any;
  if (!routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });

  const executions = await RoutineExecution.find({ routine: id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return NextResponse.json({
    routine: {
      id: routine._id.toString(),
      name: routine.name,
      prompt: routine.prompt,
      schedule: routine.schedule,
      enabled: routine.enabled,
      nextRunAt: routine.nextRunAt,
      lastRunAt: routine.lastRunAt,
      lastRunStatus: routine.lastRunStatus,
      maxCreditsPerRun: routine.maxCreditsPerRun,
      totalRuns: routine.totalRuns,
      successfulRuns: routine.successfulRuns,
      totalCreditsUsed: routine.totalCreditsUsed,
      createdAt: routine.createdAt,
    },
    executions: executions.map((e: any) => ({
      id: e._id.toString(),
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      status: e.status,
      phase: e.phase || 'queued',
      phaseDetail: e.phaseDetail,
      response: e.response?.slice(0, 1000),
      toolCalls: e.toolCalls?.map((tc: any) => ({ name: tc.name, success: tc.success })),
      dataChanged: e.dataChanged,
      creditsUsed: e.creditsUsed,
      error: e.error,
      liveLog: (e.liveLog || []).map((entry: any) => ({
        timestamp: entry.timestamp,
        type: entry.type,
        message: entry.message,
      })),
    })),
  });
}

// PUT - Update routine
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const routine = await Routine.findOne({ _id: id, owner: user.mongoId });
  if (!routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });

  const body = await request.json();
  const { name, prompt, schedule, enabled, maxCreditsPerRun } = body;

  if (name !== undefined) routine.name = name;
  if (prompt !== undefined) routine.prompt = prompt;
  if (maxCreditsPerRun !== undefined) routine.maxCreditsPerRun = maxCreditsPerRun;

  if (enabled !== undefined) {
    routine.enabled = enabled;
    if (enabled && !routine.nextRunAt) {
      routine.nextRunAt = calculateNextRun(routine.schedule);
    }
  }

  if (schedule) {
    routine.schedule = { ...routine.schedule.toObject?.() || routine.schedule, ...schedule };
    routine.nextRunAt = routine.enabled ? calculateNextRun(routine.schedule) : null;
  }

  await routine.save();

  return NextResponse.json({
    message: 'Routine updated',
    routine: {
      id: routine._id.toString(),
      name: routine.name,
      prompt: routine.prompt,
      schedule: routine.schedule,
      enabled: routine.enabled,
      nextRunAt: routine.nextRunAt,
      maxCreditsPerRun: routine.maxCreditsPerRun,
    },
  });
}

// DELETE - Delete routine and its executions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const routine = await Routine.findOne({ _id: id, owner: user.mongoId });
  if (!routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });

  await Promise.all([
    Routine.deleteOne({ _id: id }),
    RoutineExecution.deleteMany({ routine: id }),
  ]);

  return NextResponse.json({ message: 'Routine deleted' });
}
