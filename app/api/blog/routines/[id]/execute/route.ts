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

  try {
    await dbConnect();

    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

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

    // Create execution record
    const execution = await RoutineExecution.create({
      routine: routine._id,
      owner: routine.owner,
      ownerClerkId: routine.ownerClerkId,
      startedAt: new Date(),
      status: 'running',
      prompt: routine.prompt,
    });

    // Trigger the Upstash Workflow via QStash
    const baseUrl =
      process.env.UPSTASH_WORKFLOW_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const workflowUrl = `${baseUrl}/api/workflow/execute-routine`;

    console.log(`[Routine] Triggering workflow for routine ${id}: "${routine.name}"`);
    console.log(`[Routine] Workflow URL: ${workflowUrl}`);

    const client = new Client({ token: process.env.QSTASH_TOKEN! });
    const { workflowRunId } = await client.trigger({
      url: workflowUrl,
      body: JSON.stringify({
        routineId: routine._id.toString(),
        executionId: execution._id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`[Routine] Workflow triggered for routine ${id}, runId: ${workflowRunId}`);

    return NextResponse.json({
      success: true,
      executionId: execution._id.toString(),
      workflowRunId,
      message: 'Routine execution started',
    });
  } catch (error: any) {
    console.error(`[Routine] Trigger error for ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
