export type DeepResearchStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled';

export type DeepResearchPhase =
  | 'queued'
  | 'planning'
  | 'researching'
  | 'evaluating'
  | 'revising'
  | 'synthesizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ResearchPlanItemStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface ResearchPlanItem {
  id: string;
  title: string;
  objective: string;
  requiredEvidence: string[];
  suggestedTools: string[];
  status: ResearchPlanItemStatus;
  summary?: string;
  evidence: string[];
  sourceUrls: string[];
}
export interface DeepResearchPlan {
  title: string;
  summary: string;
  queryStrategy: string[];
  items: ResearchPlanItem[];
}

export interface DeepResearchAcceptanceCriteria {
  minSuccessfulResearchCalls: number;
  minDistinctResearchTools: number;
  minExternalSources: number;
  minKeywordResults: number;
  requireKeywordData: boolean;
  requireCompetitorResearch: boolean;
  requireExistingContentReview: boolean;
}

export interface DeepResearchToolCall {
  name: string;
  input: Record<string, unknown>;
  result?: string;
  success: boolean;
  createdAt: Date | string;
}

export interface DeepResearchEvaluationCheck {
  id: string;
  label: string;
  passed: boolean;
  actual: number | string | boolean;
  required: number | string | boolean;
  detail: string;
}

export interface DeepResearchEvaluation {
  passed: boolean;
  score: number;
  checks: DeepResearchEvaluationCheck[];
  feedback: string[];
  evaluatedAt: Date | string;
  deterministicPassed: boolean;
  modelPassed: boolean;
}

export interface DeepResearchRunSnapshot {
  id: string;
  objective: string;
  status: DeepResearchStatus;
  phase: DeepResearchPhase;
  phaseDetail: string;
  progress: number;
  plan?: DeepResearchPlan;
  evaluation?: DeepResearchEvaluation;
  report?: string;
  error?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}
