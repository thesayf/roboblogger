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

export const maxDuration = 800; // ~13 minutes — Pro plan with Fluid Compute
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tag = `[Run:${id.slice(-6)}]`;
  const runStart = Date.now();

  console.log(`${tag} ── ROUTINE RUN ─────────────────────────────`);
  console.log(`${tag} Routine ID: ${id}`);

  try {
    await dbConnect();

    const routine = await Routine.findById(id);
    if (!routine) {
      console.error(`${tag} Routine not found`);
      return NextResponse.json({ success: false, error: 'Routine not found' }, { status: 404 });
    }

    console.log(`${tag} Routine: "${routine.name}"`);

    const user = await User.findById(routine.owner);
    if (!user) {
      console.error(`${tag} User not found: ${routine.owner}`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    console.log(`${tag} User: ${routine.ownerClerkId}, credits: ${user.credits}`);

    if (user.credits < 0.1) {
      console.warn(`${tag} BLOCKED: insufficient credits (${user.credits})`);
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
    }

    const currentUser: CurrentUser = {
      clerkId: routine.ownerClerkId,
      mongoId: routine.owner.toString(),
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus || 'none',
    };

    // Parse executionId from body
    let executionId: string | undefined;
    try {
      let body = await request.json();
      // Handle double-stringified body from Upstash context.call
      if (typeof body === 'string') {
        console.log(`${tag} Body was double-stringified, parsing again`);
        body = JSON.parse(body);
      }
      executionId = body?.executionId;
      console.log(`${tag} Execution ID from body: ${executionId || 'NOT PROVIDED'}`);
    } catch (parseErr) {
      console.warn(`${tag} Could not parse request body:`, parseErr);
    }

    const agentMessage = `[AUTOMATED ROUTINE: ${routine.name}]\n\n${routine.prompt}`;
    console.log(`${tag} Calling executeAgent with maxCredits=${routine.maxCreditsPerRun}`);
    console.log(`${tag} Prompt (first 200 chars): ${routine.prompt.slice(0, 200)}`);

    const result = await executeAgent({
      user: currentUser,
      message: agentMessage,
      maxCredits: routine.maxCreditsPerRun,
      executionId,
    });

    const elapsed = Date.now() - runStart;
    console.log(`${tag} ── RUN COMPLETE ────────────────────────────`);
    console.log(`${tag} Tool calls: ${result.toolCalls.length}`);
    console.log(`${tag} Credits used: ${result.creditsUsed}`);
    console.log(`${tag} Data changed: ${result.dataChanged.join(', ') || 'none'}`);
    console.log(`${tag} Response length: ${result.response.length} chars`);
    console.log(`${tag} Total run time: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`${tag} ────────────────────────────────────────────`);

    return NextResponse.json({
      success: true,
      response: result.response,
      toolCalls: result.toolCalls,
      dataChanged: result.dataChanged,
      creditsUsed: result.creditsUsed,
    });
  } catch (error: any) {
    const elapsed = Date.now() - runStart;
    console.error(`${tag} ── RUN FAILED ─────────────────────────────`);
    console.error(`${tag} Error: ${error.message}`);
    console.error(`${tag} Error type: ${error.name || error.constructor?.name}`);
    if (error.status) console.error(`${tag} HTTP status: ${error.status}`);
    if (error.error?.type) console.error(`${tag} API error type: ${error.error.type}`);
    if (error.stack) console.error(`${tag} Stack: ${error.stack.split('\n').slice(0, 5).join(' | ')}`);
    console.error(`${tag} Failed after: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.error(`${tag} ────────────────────────────────────────────`);

    return NextResponse.json({
      success: false,
      error: error.message || 'Agent execution failed',
    }, { status: 500 });
  }
}
