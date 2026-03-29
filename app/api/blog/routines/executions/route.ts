import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Routine from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

export const dynamic = 'force-dynamic';

// GET - List all executions across all agents for the current user
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status'); // 'success' | 'failed' | 'running'

  // Get all routine IDs owned by this user
  const routines = await Routine.find({ owner: user.mongoId }, '_id name').lean() as any[];
  const routineIds = routines.map((r: any) => r._id);
  const routineNames: Record<string, string> = {};
  for (const r of routines) {
    routineNames[r._id.toString()] = r.name;
  }

  const filter: any = { routine: { $in: routineIds } };
  if (status) filter.status = status;

  const [executions, total] = await Promise.all([
    RoutineExecution.find(filter)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RoutineExecution.countDocuments(filter),
  ]);

  return NextResponse.json({
    executions: executions.map((e: any) => ({
      id: e._id.toString(),
      routineId: e.routine.toString(),
      routineName: routineNames[e.routine.toString()] || 'Deleted Agent',
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      status: e.status,
      phase: e.phase || 'queued',
      phaseDetail: e.phaseDetail,
      response: e.response?.slice(0, 500),
      toolCalls: (e.toolCalls || []).map((tc: any) => ({ name: tc.name, success: tc.success })),
      dataChanged: e.dataChanged || [],
      creditsUsed: e.creditsUsed || 0,
      error: e.error,
      liveLog: (e.liveLog || []).map((entry: any) => ({
        timestamp: entry.timestamp,
        type: entry.type,
        message: entry.message,
      })),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
