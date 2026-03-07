import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

export const dynamic = 'force-dynamic';

const MAX_ROUTINES_PER_USER = 10;

// GET - List user's routines
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  const routines = await Routine.find({ owner: user.mongoId })
    .sort({ createdAt: -1 })
    .lean();

  // Get last execution for each routine
  const routineIds = routines.map((r: any) => r._id);
  const lastExecutions = await RoutineExecution.aggregate([
    { $match: { routine: { $in: routineIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$routine', lastExecution: { $first: '$$ROOT' } } },
  ]);

  const executionMap = new Map(
    lastExecutions.map((e: any) => [e._id.toString(), e.lastExecution])
  );

  const result = routines.map((r: any) => ({
    id: r._id.toString(),
    name: r.name,
    prompt: r.prompt,
    schedule: r.schedule,
    enabled: r.enabled,
    nextRunAt: r.nextRunAt,
    lastRunAt: r.lastRunAt,
    lastRunStatus: r.lastRunStatus,
    maxCreditsPerRun: r.maxCreditsPerRun,
    templateId: r.templateId,
    totalRuns: r.totalRuns,
    successfulRuns: r.successfulRuns,
    totalCreditsUsed: r.totalCreditsUsed,
    createdAt: r.createdAt,
    lastExecution: executionMap.get(r._id.toString()) ? (() => {
      const exec = executionMap.get(r._id.toString()) as any;
      return {
        id: exec._id.toString(),
        status: exec.status,
        phase: exec.phase || 'queued',
        phaseDetail: exec.phaseDetail,
        response: exec.response?.slice(0, 500),
        toolCalls: exec.toolCalls?.length || 0,
        creditsUsed: exec.creditsUsed,
        completedAt: exec.completedAt,
        startedAt: exec.startedAt,
        error: exec.error,
        liveLog: (exec.liveLog || []).slice(-5).map((entry: any) => ({
          timestamp: entry.timestamp,
          type: entry.type,
          message: entry.message,
        })),
      };
    })() : null,
  }));

  return NextResponse.json({ routines: result });
}

// POST - Create a new routine
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  // Check routine limit
  const count = await Routine.countDocuments({ owner: user.mongoId });
  if (count >= MAX_ROUTINES_PER_USER) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROUTINES_PER_USER} routines allowed` },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, prompt, schedule, maxCreditsPerRun, templateId } = body;

  if (!name || !prompt || !schedule?.frequency || schedule.hour == null || schedule.minute == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const nextRunAt = calculateNextRun(schedule);

  const routine = await Routine.create({
    owner: user.mongoId,
    ownerClerkId: user.clerkId,
    name,
    prompt,
    schedule,
    maxCreditsPerRun: maxCreditsPerRun || 1.0,
    templateId,
    nextRunAt,
    enabled: true,
  });

  return NextResponse.json({
    message: 'Routine created',
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
