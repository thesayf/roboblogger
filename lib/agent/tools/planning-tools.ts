import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { TaskPlanState, ToolCallInfo, ToolContext } from '../types';

const taskPlanSchema = z.object({
  objective: z.string().min(5).describe('The user objective this plan must fully satisfy'),
  items: z.array(z.object({
    id: z.string().min(1).max(40).describe('Stable short ID, such as research-demand'),
    task: z.string().min(3).describe('A concrete deliverable or verification step'),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
    evidence: z.string().max(1000).optional().describe('Result, source, tool output, or blocker evidence'),
  })).min(2).max(25),
  overallStatus: z.enum(['in_progress', 'completed', 'partial']),
});

function validatePlan(next: TaskPlanState, previous?: TaskPlanState) {
  const ids = next.items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Task plan item IDs must be unique.');
  }
  if (next.items.filter((item) => item.status === 'in_progress').length > 1) {
    throw new Error('Only one task plan item can be in progress at a time.');
  }
  if (next.overallStatus === 'completed' && next.items.some((item) => item.status !== 'completed')) {
    throw new Error('A completed plan cannot contain pending, in-progress, or blocked items.');
  }
  if (
    next.overallStatus === 'partial' &&
    (next.items.some((item) => item.status === 'pending' || item.status === 'in_progress') ||
      !next.items.some((item) => item.status === 'blocked'))
  ) {
    throw new Error('A partial plan must have no unfinished items and at least one evidenced blocker.');
  }
  if (next.items.some((item) => item.status === 'blocked' && !item.evidence?.trim())) {
    throw new Error('Blocked task plan items require evidence.');
  }
  if (next.items.some((item) => item.status === 'completed' && !item.evidence?.trim())) {
    throw new Error('Completed task plan items require evidence.');
  }
  if (
    next.overallStatus === 'in_progress' &&
    next.items.filter((item) => item.status === 'in_progress').length !== 1
  ) {
    throw new Error('An in-progress task plan must have exactly one item in progress.');
  }

  if (previous) {
    const nextById = new Map(next.items.map((item) => [item.id, item]));
    for (const oldItem of previous.items) {
      const newItem = nextById.get(oldItem.id);
      if (!newItem) throw new Error(`Task plan item ${oldItem.id} cannot be removed.`);
      if (oldItem.status === 'completed' && newItem.status !== 'completed') {
        throw new Error(`Completed task plan item ${oldItem.id} cannot be reopened.`);
      }
    }
  }
}

export function buildPlanningTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'manage_task_plan',
      description: `Create or update the execution checklist for a complex, multi-step task. Use this before the first research call when the request has several deliverables, and update it after each phase. Preserve existing item IDs and never mark an item completed without evidence. The final answer is only allowed when the plan is completed, or partial with evidenced blockers.`,
      inputSchema: taskPlanSchema,
      run: async (input): Promise<string> => {
        const callInfo: ToolCallInfo = { name: 'manage_task_plan', input, success: false };
        ctx.toolCalls.push(callInfo);
        ctx.sendEvent('tool_start', { toolName: 'manage_task_plan', toolInput: input });

        try {
          const next = input as TaskPlanState;
          validatePlan(next, ctx.taskPlan);
          ctx.taskPlan = next;

          const remaining = next.items.filter((item) => item.status === 'pending' || item.status === 'in_progress');
          const result = JSON.stringify({
            saved: true,
            overallStatus: next.overallStatus,
            completed: next.items.filter((item) => item.status === 'completed').length,
            blocked: next.items.filter((item) => item.status === 'blocked').length,
            remaining: remaining.map((item) => ({ id: item.id, task: item.task, status: item.status })),
          });
          callInfo.result = result;
          callInfo.success = true;
          ctx.sendEvent('task_status', { plan: next });
          ctx.sendEvent('tool_end', { toolName: 'manage_task_plan', success: true });
          return result;
        } catch (error: any) {
          const result = JSON.stringify({ error: error.message });
          callInfo.result = result;
          ctx.sendEvent('tool_end', { toolName: 'manage_task_plan', success: false });
          return result;
        }
      },
    }),
  ];
}
