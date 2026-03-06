import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';
import { executeAgent } from '@/lib/agent/execute-agent';
import { CurrentUser } from '@/lib/auth/getCurrentUser';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await dbConnect();

    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Load user
    const user = await User.findById(routine.owner);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Credit preflight
    if (user.credits < 0.1) {
      console.log(`[Routine] Skipping ${id}: insufficient credits (${user.credits})`);
      routine.lastRunStatus = 'failed';
      routine.lastRunAt = new Date();
      await routine.save();
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Check credit cap
    if (user.credits < routine.maxCreditsPerRun) {
      console.log(`[Routine] User credits (${user.credits}) below routine cap (${routine.maxCreditsPerRun})`);
    }

    // Create execution record
    const execution = await RoutineExecution.create({
      routine: routine._id,
      owner: routine.owner,
      ownerClerkId: routine.ownerClerkId,
      startedAt: new Date(),
      status: 'running',
      prompt: routine.prompt,
    });

    const currentUser: CurrentUser = {
      clerkId: routine.ownerClerkId,
      mongoId: routine.owner.toString(),
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus || 'none',
    };

    try {
      console.log(`[Routine] Executing routine ${id}: "${routine.name}"`);

      const result = await executeAgent({
        user: currentUser,
        message: `[AUTOMATED ROUTINE: ${routine.name}]\n\n${routine.prompt}`,
        maxCredits: routine.maxCreditsPerRun,
      });

      // Update execution
      execution.status = 'success';
      execution.completedAt = new Date();
      execution.response = result.response;
      execution.toolCalls = result.toolCalls;
      execution.dataChanged = result.dataChanged;
      execution.creditsUsed = result.creditsUsed;
      await execution.save();

      // Update routine stats
      routine.lastRunAt = new Date();
      routine.lastRunStatus = 'success';
      routine.totalRuns += 1;
      routine.successfulRuns += 1;
      routine.totalCreditsUsed += result.creditsUsed;
      routine.nextRunAt = calculateNextRun(routine.schedule);

      // Disable one-time routines after execution
      if (routine.schedule.frequency === 'once') {
        routine.enabled = false;
      }

      await routine.save();

      console.log(`[Routine] Completed ${id}: ${result.toolCalls.length} tool calls, ${result.creditsUsed} credits`);

      return NextResponse.json({
        success: true,
        executionId: execution._id.toString(),
        creditsUsed: result.creditsUsed,
        toolCalls: result.toolCalls.length,
        dataChanged: result.dataChanged,
      });
    } catch (error: any) {
      console.error(`[Routine] Failed ${id}:`, error);

      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error.message || 'Unknown error';
      await execution.save();

      routine.lastRunAt = new Date();
      routine.lastRunStatus = 'failed';
      routine.totalRuns += 1;
      routine.nextRunAt = calculateNextRun(routine.schedule);

      // Disable after 3 consecutive failures
      const recentFailures = await RoutineExecution.countDocuments({
        routine: id,
        status: 'failed',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      if (recentFailures >= 3) {
        routine.enabled = false;
        console.log(`[Routine] Disabled ${id} after 3 failures`);
      }

      await routine.save();

      return NextResponse.json({
        success: false,
        error: error.message,
        executionId: execution._id.toString(),
      });
    }
  } catch (error: any) {
    console.error(`[Routine] Route error for ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
