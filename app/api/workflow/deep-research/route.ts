import { serve } from '@upstash/workflow/nextjs';
import { markDeepResearchFailed } from '@/lib/deep-research/execute';

interface PhaseResult {
  success: boolean;
  passed?: boolean;
  feedback?: string[];
  error?: string;
  cancelled?: boolean;
}

function getBaseUrl(): string {
  return (
    process.env.UPSTASH_WORKFLOW_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export const { POST } = serve<{ runId: string; workflowToken: string }>(
  async (context) => {
    const { runId, workflowToken } = context.requestPayload;
    const phaseUrl = `${getBaseUrl()}/api/deep-research/${runId}/run`;

    const callPhase = async (
      name: string,
      phase: 'plan' | 'research' | 'evaluate' | 'synthesize',
      extra: Record<string, unknown> = {},
      timeout: '600s' | '900s' | '1200s' | '1800s' = '900s',
    ) => {
      const result = await context.call<PhaseResult>(name, {
        url: phaseUrl,
        method: 'POST',
        body: JSON.stringify({ phase, workflowToken, ...extra }),
        headers: { 'Content-Type': 'application/json' },
        retries: 1,
        timeout,
      });
      if (result.status === 409 && result.body?.cancelled) return result.body;
      if (result.status !== 200 || !result.body?.success) {
        throw new Error(result.body?.error || `${name} failed with status ${result.status}`);
      }
      return result.body;
    };

    const plan = await callPhase('plan-research', 'plan', {}, '600s');
    if (plan.cancelled) return;
    const research = await callPhase('collect-evidence', 'research', {}, '1800s');
    if (research.cancelled) return;
    let evaluation = await callPhase('evaluate-evidence', 'evaluate', {}, '600s');
    if (evaluation.cancelled) return;

    if (!evaluation.passed) {
      const revision = await callPhase(
        'repair-evidence-gaps',
        'research',
        { revisionFeedback: evaluation.feedback || ['The evidence did not satisfy the evaluation gate.'] },
        '1800s',
      );
      if (revision.cancelled) return;
      evaluation = await callPhase('re-evaluate-evidence', 'evaluate', {}, '600s');
      if (evaluation.cancelled) return;
    }

    await callPhase('synthesize-report', 'synthesize', {}, '1200s');
  },
  {
    failureFunction: async ({ context, failStatus, failResponse }) => {
      const { runId } = context.requestPayload;
      const detail = typeof failResponse === 'string'
        ? failResponse.slice(0, 1000)
        : JSON.stringify(failResponse ?? '').slice(0, 1000);
      await markDeepResearchFailed(runId, `Workflow failed (${failStatus}): ${detail}`);
    },
  },
);
