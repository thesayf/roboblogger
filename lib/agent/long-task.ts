import { TaskPlanState } from './types';

const RESEARCH_TERMS = /\b(research|keyword|competitor|market|seo|content gap|strategy|strategies|analyse|analyze|audit|opportunit(?:y|ies))\b/i;
const BROAD_SCOPE_TERMS = /\b(full|proper|comprehensive|complete|all|each|every|breakdown|decision-grade|deep dive|phases?|categories|subcategories|compare)\b/i;

export const MAX_AGENT_ITERATIONS = 60;
export const MAX_COMPLETION_CORRECTIONS = 3;

export const AGENT_COMPACTION_PROMPT = `Summarize the unfinished Vibeblogger task so another agent can continue without losing scope or evidence. Preserve:
1. The user's exact objective, requested deliverables, constraints, and target market or location.
2. The complete manage_task_plan checklist with every item ID, status, and evidence.
3. Every tool already called, the useful numeric results, source limitations, and failed calls.
4. Work still required before the answer can honestly be called complete.
5. Any content or data changes already made.
Do not turn missing work into completed work. Wrap the continuation summary in <summary></summary> tags.`;

export function requiresResearchPlan(message: string): boolean {
  const normalized = message.replace(/^\[AUTOMATED ROUTINE:[^\]]+\]\s*/i, '').trim();
  if (!RESEARCH_TERMS.test(normalized)) return false;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const numberedItems = (normalized.match(/(?:^|\n)\s*(?:\d+[.)]|[-*])\s+/g) || []).length;

  return wordCount >= 80 || numberedItems >= 3 || (wordCount >= 35 && BROAD_SCOPE_TERMS.test(normalized));
}

export function getTaskPlanCompletionIssue(
  planRequired: boolean,
  plan?: TaskPlanState,
): string | null {
  if (planRequired && !plan) {
    return 'This is a complex research task, but no task plan was created.';
  }
  if (!plan) return null;

  const unfinished = plan.items.filter((item) => item.status === 'pending' || item.status === 'in_progress');
  if (unfinished.length > 0) {
    return `The task plan still has unfinished items: ${unfinished.map((item) => `${item.id}: ${item.task}`).join('; ')}`;
  }
  if (plan.overallStatus === 'in_progress') {
    return 'The task plan is still marked in progress.';
  }
  if (plan.overallStatus === 'completed' && plan.items.some((item) => item.status !== 'completed')) {
    return 'The plan is marked completed even though one or more items are blocked.';
  }

  return null;
}

export function buildCompletionCorrection(issue: string): string {
  return `[COMPLETION CHECK]
Your proposed final answer was not accepted because the work is incomplete: ${issue}

Continue the task now. Use manage_task_plan to create or update the checklist, perform the missing research with tools, and only give the final answer when every item is completed. If a required item genuinely cannot be completed, mark it blocked with evidence, set the plan to partial, and clearly identify the limitation in the final answer. Do not reduce the requested scope or describe partial work as complete.`;
}
