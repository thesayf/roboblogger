import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolCallInfo, ToolContext } from '../types';

const deepResearchSchema = z.object({
  objective: z.string().min(15).max(12000).describe(
    'A self-contained research objective preserving the user scope, requested comparisons, geography, audience, metrics, and desired decision or deliverable.',
  ),
});

export function buildDeepResearchTools(ctx: ToolContext) {
  if (!ctx.deepResearch) return [];

  return [
    betaZodTool({
      name: 'start_deep_research',
      description: `Delegate a substantial, multi-source research brief to Vibeblogger's durable research workflow. Use this when the user explicitly asks for deep, thorough, proper, comprehensive, or evidence-backed research; asks you to take your time; or requests a market, competitor, keyword, or strategy report that needs many independent sources and data checks. Do not use it for quick lookups, ordinary conversation, simple keyword checks, CRUD actions, questions answerable from existing blog data, or image-dependent requests. The workflow plans, researches, evaluates, repairs weak evidence, and writes the final report back into this same conversation. After starting it, do not perform the research yourself or call additional tools; briefly tell the user the research is underway and that they can leave and return.`,
      inputSchema: deepResearchSchema,
      run: async (input): Promise<string> => {
        const callInfo: ToolCallInfo = { name: 'start_deep_research', input, success: false };
        ctx.toolCalls.push(callInfo);
        ctx.sendEvent('tool_start', { toolName: callInfo.name, toolInput: input });

        try {
          if (!ctx.deepResearch) throw new Error('Research delegation is unavailable in this context.');
          if (ctx.deepResearch.startedRunId) {
            const existing = JSON.stringify({
              started: true,
              runId: ctx.deepResearch.startedRunId,
              instruction: 'The research is already running. Do not start another run.',
            });
            callInfo.result = existing;
            callInfo.success = true;
            ctx.sendEvent('tool_end', { toolName: callInfo.name, success: true });
            return existing;
          }

          const started = await ctx.deepResearch.start(input.objective);
          ctx.deepResearch.startedRunId = started.run.id;
          callInfo.result = JSON.stringify({
            started: true,
            runId: started.run.id,
            instruction: 'Research is running durably. End this turn with a short acknowledgement only.',
          });
          callInfo.success = true;
          ctx.sendEvent('deep_research_started', started);
          ctx.sendEvent('tool_end', { toolName: callInfo.name, success: true });
          return callInfo.result;
        } catch (error) {
          const result = JSON.stringify({
            started: false,
            error: error instanceof Error ? error.message : 'Unable to start research.',
          });
          callInfo.result = result;
          ctx.sendEvent('tool_end', { toolName: callInfo.name, success: false });
          return result;
        }
      },
    }),
  ];
}
