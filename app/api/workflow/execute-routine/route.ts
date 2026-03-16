/**
 * Upstash Workflow for Routine Execution
 *
 * Durable single-stage pipeline: run the agent with the routine's prompt.
 * Uses context.call() so the agent gets its own serverless invocation
 * with no time pressure from the cron or trigger function.
 */

import { serve } from '@upstash/workflow/nextjs';
import dbConnect from '@/lib/mongo';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

function getBaseUrl(): string {
  return (
    process.env.UPSTASH_WORKFLOW_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  );
}

export const { POST } = serve<{ routineId: string; executionId: string }>(
  async (context) => {
    const { routineId, executionId } = context.requestPayload;
    const tag = `[Workflow:${executionId.slice(-6)}]`;
    const baseUrl = getBaseUrl();

    console.log(`${tag} ── WORKFLOW START ──────────────────────────`);
    console.log(`${tag} Routine: ${routineId}`);
    console.log(`${tag} Execution: ${executionId}`);
    console.log(`${tag} Base URL: ${baseUrl}`);

    // Step 1: Call the agent execution endpoint
    const runUrl = `${baseUrl}/api/blog/routines/${routineId}/run`;
    console.log(`${tag} Step 1: Calling agent at ${runUrl}`);

    const result = await context.call<{
      success: boolean;
      response?: string;
      toolCalls?: Array<{ name: string; input: any; result?: string; success: boolean }>;
      dataChanged?: string[];
      creditsUsed?: number;
      error?: string;
    }>('run-agent', {
      url: runUrl,
      method: 'POST',
      body: JSON.stringify({ executionId }),
      headers: { 'Content-Type': 'application/json' },
      retries: 1,
      timeout: '1800s',
    });

    console.log(`${tag} Step 1 result: status=${result.status}, success=${result.body?.success}`);
    if (result.body?.error) console.error(`${tag} Step 1 error body: ${result.body.error}`);
    if (result.body?.toolCalls) console.log(`${tag} Step 1 tool calls: ${result.body.toolCalls.length}`);
    if (result.body?.creditsUsed) console.log(`${tag} Step 1 credits: ${result.body.creditsUsed}`);

    // Step 2: Update execution and routine records based on result
    await context.run('update-records', async () => {
      console.log(`${tag} Step 2: Updating records...`);
      await dbConnect();

      const execution = await RoutineExecution.findById(executionId);
      const routine = await Routine.findById(routineId);

      if (!execution || !routine) {
        console.error(`${tag} CRITICAL: Missing records — execution=${!!execution} routine=${!!routine}`);
        return;
      }

      if (result.status === 200 && result.body?.success) {
        console.log(`${tag} Result: SUCCESS`);

        execution.status = 'success';
        execution.phase = 'completed';
        execution.completedAt = new Date();
        execution.response = result.body.response || '';
        execution.toolCalls = result.body.toolCalls || [];
        execution.dataChanged = result.body.dataChanged || [];
        execution.creditsUsed = result.body.creditsUsed || 0;
        await execution.save();
        console.log(`${tag} Execution ${executionId} → success`);

        routine.lastRunAt = new Date();
        routine.lastRunStatus = 'success';
        routine.totalRuns += 1;
        routine.successfulRuns += 1;
        routine.totalCreditsUsed += result.body.creditsUsed || 0;

        if (routine.schedule.frequency === 'once') {
          routine.enabled = false;
          routine.nextRunAt = null;
          console.log(`${tag} Routine is 'once' — disabling, nextRunAt=null`);
        } else {
          routine.nextRunAt = calculateNextRun(routine.schedule);
        }

        await routine.save();

        console.log(`${tag} Routine updated: runs=${routine.totalRuns}, success=${routine.successfulRuns}, nextRunAt=${routine.nextRunAt?.toISOString() || 'null'}`);
        console.log(`${tag} ── WORKFLOW COMPLETE (SUCCESS) ─────────────`);
      } else {
        const errorMsg = result.body?.error || `Agent call failed with status ${result.status}`;
        console.error(`${tag} Result: FAILED — ${errorMsg}`);

        execution.status = 'failed';
        execution.phase = 'failed';
        execution.completedAt = new Date();
        execution.error = errorMsg;
        execution.liveLog.push({
          timestamp: new Date(),
          type: 'error',
          message: errorMsg,
        });
        await execution.save();
        console.log(`${tag} Execution ${executionId} → failed`);

        routine.lastRunAt = new Date();
        routine.lastRunStatus = 'failed';
        routine.totalRuns += 1;
        routine.nextRunAt = calculateNextRun(routine.schedule);

        // Disable after 3 consecutive failures
        const recentFailures = await RoutineExecution.countDocuments({
          routine: routineId,
          status: 'failed',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });
        console.log(`${tag} Recent failures in last 7 days: ${recentFailures}`);

        if (recentFailures >= 3) {
          routine.enabled = false;
          console.warn(`${tag} AUTO-DISABLED: 3+ failures in 7 days`);
        }

        await routine.save();
        console.log(`${tag} Routine updated: runs=${routine.totalRuns}, nextRunAt=${routine.nextRunAt?.toISOString() || 'null'}`);
        console.error(`${tag} ── WORKFLOW COMPLETE (FAILED) ──────────────`);
      }
    });
  },
  {
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const { routineId, executionId } = context.requestPayload;
      const tag = `[WorkflowFail:${executionId.slice(-6)}]`;

      console.error(`${tag} ── WORKFLOW FAILURE HANDLER ────────────────`);
      console.error(`${tag} Routine: ${routineId}`);
      console.error(`${tag} Execution: ${executionId}`);
      console.error(`${tag} Fail status: ${failStatus}`);
      console.error(`${tag} Fail response: ${typeof failResponse === 'string' ? failResponse.slice(0, 500) : JSON.stringify(failResponse).slice(0, 500)}`);

      try {
        await dbConnect();

        const execution = await RoutineExecution.findById(executionId);
        if (execution && execution.status === 'running') {
          execution.status = 'failed';
          execution.phase = 'failed';
          execution.completedAt = new Date();
          execution.error = `Workflow failed (status ${failStatus})`;
          execution.liveLog.push({
            timestamp: new Date(),
            type: 'error',
            message: `Workflow pipeline failed with status ${failStatus}`,
          });
          await execution.save();
          console.error(`${tag} Execution marked as failed`);
        } else {
          console.error(`${tag} Execution not found or already completed (status=${execution?.status})`);
        }

        const routine = await Routine.findById(routineId);
        if (routine) {
          routine.lastRunAt = new Date();
          routine.lastRunStatus = 'failed';
          routine.totalRuns += 1;
          routine.nextRunAt = calculateNextRun(routine.schedule);
          await routine.save();
          console.error(`${tag} Routine marked as failed, nextRunAt=${routine.nextRunAt?.toISOString() || 'null'}`);
        } else {
          console.error(`${tag} Routine not found: ${routineId}`);
        }
      } catch (err) {
        console.error(`${tag} CRITICAL: Failed to update records on failure:`, err);
      }

      console.error(`${tag} ────────────────────────────────────────────`);
    },
  }
);
