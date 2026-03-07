/**
 * Routine Agent Runner
 *
 * Called by the Upstash Workflow. Runs the agent with the routine's prompt
 * and returns the result. Does NOT update execution/routine records —
 * that's handled by the workflow after this returns.
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import Routine from '@/models/Routine';
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
      return NextResponse.json({ success: false, error: 'Routine not found' }, { status: 404 });
    }

    const user = await User.findById(routine.owner);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.credits < 0.1) {
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
    }

    const currentUser: CurrentUser = {
      clerkId: routine.ownerClerkId,
      mongoId: routine.owner.toString(),
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus || 'none',
    };

    console.log(`[RoutineRun] Executing routine ${id}: "${routine.name}"`);

    const result = await executeAgent({
      user: currentUser,
      message: `[AUTOMATED ROUTINE: ${routine.name}]\n\n${routine.prompt}`,
      maxCredits: routine.maxCreditsPerRun,
    });

    console.log(`[RoutineRun] Completed ${id}: ${result.toolCalls.length} tool calls, ${result.creditsUsed} credits`);

    return NextResponse.json({
      success: true,
      response: result.response,
      toolCalls: result.toolCalls,
      dataChanged: result.dataChanged,
      creditsUsed: result.creditsUsed,
    });
  } catch (error: any) {
    console.error(`[RoutineRun] Failed ${id}:`, error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Agent execution failed',
    }, { status: 500 });
  }
}
