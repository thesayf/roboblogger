/**
 * Thin trigger for routine execution.
 *
 * Creates the RoutineExecution record, then fires an Upstash Workflow
 * via QStash client.trigger() and returns immediately.  The durable
 * workflow (execute-routine) handles the actual agent run + record updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/workflow';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import Routine from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tag = `[Trigger:${id.slice(-6)}]`;

  console.log(`${tag} ── ROUTINE TRIGGER ─────────────────────────`);
  console.log(`${tag} Routine ID: ${id}`);

  try {
    await dbConnect();

    const routine = await Routine.findById(id);
    if (!routine) {
      console.error(`${tag} Routine not found`);
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    console.log(`${tag} Routine: "${routine.name}"`);
    console.log(`${tag} Owner: ${routine.ownerClerkId} (mongo: ${routine.owner})`);
    console.log(`${tag} Schedule: ${routine.schedule.frequency} at ${routine.schedule.hour}:${String(routine.schedule.minute).padStart(2, '0')} UTC`);
    console.log(`${tag} Max credits: ${routine.maxCreditsPerRun}`);

    const user = await User.findById(routine.owner);
    if (!user) {
      console.error(`${tag} User not found for owner: ${routine.owner}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`${tag} User credits: ${user.credits}`);

    // Credit preflight
    if (user.credits < 0.1) {
      console.warn(`${tag} SKIPPED: insufficient credits (${user.credits} < 0.1)`);
      routine.lastRunStatus = 'failed';
      routine.lastRunAt = new Date();
      await routine.save();
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Create execution record
    const execution = await RoutineExecution.create({
      routine: routine._id,
      owner: routine.owner,
      ownerClerkId: routine.ownerClerkId,
      startedAt: new Date(),
      status: 'running',
      phase: 'queued',
      phaseDetail: 'Waiting for workflow to start...',
      liveLog: [{
        timestamp: new Date(),
        type: 'phase',
        message: `Routine "${routine.name}" triggered — queued for execution`,
      }],
      prompt: routine.prompt,
    });

    console.log(`${tag} Execution record created: ${execution._id}`);

    // Trigger the Upstash Workflow via QStash
    const baseUrl =
      process.env.UPSTASH_WORKFLOW_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const workflowUrl = `${baseUrl}/api/workflow/execute-routine`;

    console.log(`${tag} Triggering workflow...`);
    console.log(`${tag}   URL: ${workflowUrl}`);
    console.log(`${tag}   Payload: routineId=${routine._id}, executionId=${execution._id}`);

    const client = new Client({ token: process.env.QSTASH_TOKEN! });
    const { workflowRunId } = await client.trigger({
      url: workflowUrl,
      body: JSON.stringify({
        routineId: routine._id.toString(),
        executionId: execution._id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`${tag} Workflow triggered successfully`);
    console.log(`${tag}   workflowRunId: ${workflowRunId}`);
    console.log(`${tag} ────────────────────────────────────────────`);

    return NextResponse.json({
      success: true,
      executionId: execution._id.toString(),
      workflowRunId,
      message: 'Routine execution started',
    });
  } catch (error: any) {
    console.error(`${tag} TRIGGER FAILED:`, error);
    console.error(`${tag} Error name: ${error.name}`);
    console.error(`${tag} Error message: ${error.message}`);
    if (error.stack) console.error(`${tag} Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
