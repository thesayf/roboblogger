import type { DeepResearchRunSnapshot } from './types';
import { normalizeChatMode } from '@/lib/chat/chat-mode';

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
export function serializeDeepResearchRun(run: any): DeepResearchRunSnapshot {
  return {
    id: run._id.toString(),
    objective: run.objective,
    mode: normalizeChatMode(run.mode),
    provider: run.provider === 'deepseek' ? 'deepseek' : 'anthropic',
    model: run.modelName || (run.provider === 'deepseek' ? 'deepseek-v4-pro' : 'claude-sonnet-4-6'),
    status: run.status,
    phase: run.phase,
    phaseDetail: run.phaseDetail || '',
    progress: run.progress || 0,
    plan: run.plan,
    evaluation: run.evaluation ? {
      ...run.evaluation,
      evaluatedAt: toIsoString(run.evaluation.evaluatedAt) || new Date(0).toISOString(),
    } : undefined,
    report: run.report || undefined,
    error: run.error || undefined,
    creditsUsed: run.creditsUsed || 0,
    createdAt: toIsoString(run.createdAt) || new Date(0).toISOString(),
    completedAt: toIsoString(run.completedAt),
  };
}
