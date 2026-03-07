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
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export const { POST } = serve<{ routineId: string; executionId: string }>(
  async (context) => {
    const { routineId, executionId } = context.requestPayload;
    const baseUrl = getBaseUrl();

    // Step 1: Call the agent execution endpoint
    const result = await context.call<{
      success: boolean;
      response?: string;
      toolCalls?: Array<{ name: string; input: any; result?: string; success: boolean }>;
      dataChanged?: string[];
      creditsUsed?: number;
      error?: string;
    }>('run-agent', {
      url: `${baseUrl}/api/blog/routines/${routineId}/run`,
      method: 'POST',
      body: JSON.stringify({ executionId }),
      headers: { 'Content-Type': 'application/json' },
      retries: 1,
      timeout: '300s',
    });

    // Step 2: Update execution and routine records based on result
    await context.run('update-records', async () => {
      await dbConnect();

      const execution = await RoutineExecution.findById(executionId);
      const routine = await Routine.findById(routineId);

      if (!execution || !routine) {
        console.error(`[RoutineWorkflow] Missing records: execution=${!!execution} routine=${!!routine}`);
        return;
      }

      if (result.status === 200 && result.body?.success) {
        execution.status = 'success';
        execution.completedAt = new Date();
        execution.response = result.body.response || '';
        execution.toolCalls = result.body.toolCalls || [];
        execution.dataChanged = result.body.dataChanged || [];
        execution.creditsUsed = result.body.creditsUsed || 0;
        await execution.save();

        routine.lastRunAt = new Date();
        routine.lastRunStatus = 'success';
        routine.totalRuns += 1;
        routine.successfulRuns += 1;
        routine.totalCreditsUsed += result.body.creditsUsed || 0;
        routine.nextRunAt = calculateNextRun(routine.schedule);

        if (routine.schedule.frequency === 'once') {
          routine.enabled = false;
        }

        await routine.save();

        console.log(`[RoutineWorkflow] Completed ${routineId}: ${result.body.toolCalls?.length || 0} tool calls, ${result.body.creditsUsed || 0} credits`);
      } else {
        const errorMsg = result.body?.error || `Agent call failed with status ${result.status}`;

        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error = errorMsg;
        await execution.save();

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
        if (recentFailures >= 3) {
          routine.enabled = false;
          console.log(`[RoutineWorkflow] Disabled ${routineId} after 3 failures`);
        }

        await routine.save();

        console.error(`[RoutineWorkflow] Failed ${routineId}: ${errorMsg}`);
      }
    });
  },
  {
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error(`[RoutineWorkflow] Pipeline failed. Status: ${failStatus}, Response: ${failResponse}`);
      try {
        const { routineId, executionId } = context.requestPayload;
        await dbConnect();

        const execution = await RoutineExecution.findById(executionId);
        if (execution && execution.status === 'running') {
          execution.status = 'failed';
          execution.completedAt = new Date();
          execution.error = `Workflow failed (status ${failStatus})`;
          await execution.save();
        }

        const routine = await Routine.findById(routineId);
        if (routine) {
          routine.lastRunAt = new Date();
          routine.lastRunStatus = 'failed';
          routine.totalRuns += 1;
          routine.nextRunAt = calculateNextRun(routine.schedule);
          await routine.save();
        }
      } catch (err) {
        console.error('[RoutineWorkflow] Failed to update records on failure:', err);
      }
    },
  }
);
