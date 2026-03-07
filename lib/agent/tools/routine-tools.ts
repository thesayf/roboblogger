import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import dbConnect from '@/lib/mongo';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

function wrapTool(ctx: ToolContext, toolName: string, fn: (input: any) => Promise<string>) {
  return async (input: any): Promise<string> => {
    const callInfo: ToolCallInfo = { name: toolName, input, success: false };
    ctx.toolCalls.push(callInfo);
    ctx.sendEvent('tool_start', { toolName, toolInput: input });

    try {
      const result = await fn(input);
      callInfo.result = result;
      callInfo.success = true;
      ctx.sendEvent('tool_end', { toolName, success: true });
      return result;
    } catch (error: any) {
      callInfo.success = false;
      ctx.sendEvent('tool_end', { toolName, success: false });
      return JSON.stringify({ error: error.message });
    }
  };
}

const MAX_ROUTINES_PER_USER = 10;

export function buildRoutineTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'list_routines',
      description: 'List all routines for the current user, including their schedule, status, and recent execution info.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'list_routines', async () => {
        await dbConnect();

        const routines = await Routine.find({ owner: ctx.userId })
          .sort({ createdAt: -1 })
          .lean();

        if (routines.length === 0) {
          return JSON.stringify({ routines: [], message: 'No routines found.' });
        }

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
          totalRuns: r.totalRuns,
          successfulRuns: r.successfulRuns,
          totalCreditsUsed: r.totalCreditsUsed,
        }));

        return JSON.stringify({ routines: result, count: result.length });
      }),
    }),

    betaZodTool({
      name: 'create_routine',
      description: 'Create a new automated routine that runs on a schedule. The routine will execute the given prompt using the AI agent at the specified time.',
      inputSchema: z.object({
        name: z.string().describe('Name for the routine'),
        prompt: z.string().describe('The prompt/instructions the agent should execute when the routine runs'),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'once']).describe('How often the routine runs'),
        dayOfWeek: z.number().min(0).max(6).optional().describe('Day of week for weekly routines (0=Sunday, 1=Monday, ..., 6=Saturday)'),
        dayOfMonth: z.number().min(1).max(28).optional().describe('Day of month for monthly routines (1-28)'),
        hour: z.number().min(0).max(23).describe('Hour to run (UTC, 0-23)'),
        minute: z.number().min(0).max(59).describe('Minute to run (UTC, 0-59)'),
        maxCreditsPerRun: z.number().min(0.1).max(10).optional().describe('Maximum credits allowed per execution (default: 1.0)'),
      }),
      run: wrapTool(ctx, 'create_routine', async (input) => {
        await dbConnect();

        const count = await Routine.countDocuments({ owner: ctx.userId });
        if (count >= MAX_ROUTINES_PER_USER) {
          return JSON.stringify({ error: `Maximum ${MAX_ROUTINES_PER_USER} routines allowed.` });
        }

        const schedule = {
          frequency: input.frequency,
          hour: input.hour,
          minute: input.minute,
          ...(input.frequency === 'weekly' && { dayOfWeek: input.dayOfWeek ?? 1 }),
          ...(input.frequency === 'monthly' && { dayOfMonth: input.dayOfMonth ?? 1 }),
        };

        const nextRunAt = calculateNextRun(schedule as any);

        const routine = await Routine.create({
          owner: ctx.userId,
          ownerClerkId: ctx.clerkId,
          name: input.name,
          prompt: input.prompt,
          schedule,
          maxCreditsPerRun: input.maxCreditsPerRun || 1.0,
          nextRunAt,
          enabled: true,
        });

        ctx.dataChanged.push('routines');

        return JSON.stringify({
          success: true,
          routineId: routine._id.toString(),
          name: routine.name,
          schedule,
          nextRunAt,
          message: `Routine "${input.name}" created and enabled.`,
        });
      }),
    }),

    betaZodTool({
      name: 'update_routine',
      description: 'Update an existing routine. Can change the name, prompt, schedule, max credits, or enabled status.',
      inputSchema: z.object({
        routineId: z.string().describe('The routine ID to update'),
        name: z.string().optional().describe('New name'),
        prompt: z.string().optional().describe('New prompt/instructions'),
        frequency: z.enum(['daily', 'weekly', 'monthly', 'once']).optional().describe('New frequency'),
        dayOfWeek: z.number().min(0).max(6).optional().describe('New day of week (0=Sunday)'),
        dayOfMonth: z.number().min(1).max(28).optional().describe('New day of month'),
        hour: z.number().min(0).max(23).optional().describe('New hour (UTC)'),
        minute: z.number().min(0).max(59).optional().describe('New minute (UTC)'),
        maxCreditsPerRun: z.number().min(0.1).max(10).optional().describe('New max credits per run'),
        enabled: z.boolean().optional().describe('Enable or disable the routine'),
      }),
      run: wrapTool(ctx, 'update_routine', async (input) => {
        await dbConnect();

        const routine = await Routine.findOne({ _id: input.routineId, owner: ctx.userId });
        if (!routine) {
          return JSON.stringify({ error: 'Routine not found or not owned by this user.' });
        }

        if (input.name) routine.name = input.name;
        if (input.prompt) routine.prompt = input.prompt;
        if (input.maxCreditsPerRun !== undefined) routine.maxCreditsPerRun = input.maxCreditsPerRun;
        if (input.enabled !== undefined) routine.enabled = input.enabled;

        if (input.frequency || input.hour !== undefined || input.minute !== undefined || input.dayOfWeek !== undefined || input.dayOfMonth !== undefined) {
          routine.schedule.frequency = input.frequency || routine.schedule.frequency;
          if (input.hour !== undefined) routine.schedule.hour = input.hour;
          if (input.minute !== undefined) routine.schedule.minute = input.minute;
          if (input.dayOfWeek !== undefined) routine.schedule.dayOfWeek = input.dayOfWeek;
          if (input.dayOfMonth !== undefined) routine.schedule.dayOfMonth = input.dayOfMonth;
          routine.nextRunAt = calculateNextRun(routine.schedule);
        }

        await routine.save();
        ctx.dataChanged.push('routines');

        return JSON.stringify({
          success: true,
          message: `Routine "${routine.name}" updated.`,
        });
      }),
    }),

    betaZodTool({
      name: 'delete_routine',
      description: 'Delete a routine and all its execution history.',
      inputSchema: z.object({
        routineId: z.string().describe('The routine ID to delete'),
      }),
      run: wrapTool(ctx, 'delete_routine', async (input) => {
        await dbConnect();

        const routine = await Routine.findOneAndDelete({ _id: input.routineId, owner: ctx.userId });
        if (!routine) {
          return JSON.stringify({ error: 'Routine not found or not owned by this user.' });
        }

        await RoutineExecution.deleteMany({ routine: input.routineId });
        ctx.dataChanged.push('routines');

        return JSON.stringify({
          success: true,
          message: `Routine "${routine.name}" deleted.`,
        });
      }),
    }),

    betaZodTool({
      name: 'get_routine_history',
      description: 'Get the execution history for a routine, showing recent runs, their status, credits used, and what actions were taken.',
      inputSchema: z.object({
        routineId: z.string().describe('The routine ID to get history for'),
        limit: z.number().min(1).max(20).optional().describe('Number of recent executions to return (default: 5)'),
      }),
      run: wrapTool(ctx, 'get_routine_history', async (input) => {
        await dbConnect();

        const routine = await Routine.findOne({ _id: input.routineId, owner: ctx.userId }).lean();
        if (!routine) {
          return JSON.stringify({ error: 'Routine not found or not owned by this user.' });
        }

        const executions = await RoutineExecution.find({ routine: input.routineId })
          .sort({ createdAt: -1 })
          .limit(input.limit || 5)
          .lean();

        const result = executions.map((e: any) => ({
          id: e._id.toString(),
          status: e.status,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          creditsUsed: e.creditsUsed,
          toolCalls: e.toolCalls?.length || 0,
          dataChanged: e.dataChanged,
          response: e.response?.slice(0, 500),
          error: e.error,
        }));

        return JSON.stringify({
          routine: (routine as any).name,
          executions: result,
          totalRuns: (routine as any).totalRuns,
          successfulRuns: (routine as any).successfulRuns,
          totalCreditsUsed: (routine as any).totalCreditsUsed,
        });
      }),
    }),
  ];
}
