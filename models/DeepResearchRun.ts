import mongoose, { Document, Schema } from 'mongoose';
import type {
  DeepResearchAcceptanceCriteria,
  DeepResearchEvaluation,
  DeepResearchPhase,
  DeepResearchPlan,
  DeepResearchStatus,
  DeepResearchToolCall,
} from '@/lib/deep-research/types';
import type { ChatMode } from '@/lib/chat/chat-mode';

export interface IDeepResearchRun extends Document {
  owner: mongoose.Types.ObjectId;
  ownerClerkId: string;
  conversationId: mongoose.Types.ObjectId;
  assistantMessageId?: mongoose.Types.ObjectId;
  objective: string;
  mode: ChatMode;
  provider: 'anthropic' | 'deepseek';
  modelName: string;
  status: DeepResearchStatus;
  phase: DeepResearchPhase;
  phaseDetail: string;
  progress: number;
  plan?: DeepResearchPlan;
  acceptanceCriteria: DeepResearchAcceptanceCriteria;
  researchMemo: string;
  report: string;
  evaluation?: DeepResearchEvaluation;
  revisionCount: number;
  toolCalls: DeepResearchToolCall[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  creditsUsed: number;
  billedAt?: Date;
  liveLog: Array<{
    timestamp: Date;
    type: 'phase' | 'tool' | 'evaluation' | 'error';
    message: string;
  }>;
  workflowToken: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

const PlanItemSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  objective: { type: String, required: true },
  requiredEvidence: [{ type: String }],
  suggestedTools: [{ type: String }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'blocked'],
    default: 'pending',
  },
  summary: String,
  evidence: [{ type: String }],
  sourceUrls: [{ type: String }],
}, { _id: false });

const EvaluationCheckSchema = new Schema({
  id: String,
  label: String,
  passed: Boolean,
  actual: Schema.Types.Mixed,
  required: Schema.Types.Mixed,
  detail: String,
}, { _id: false });

const DeepResearchRunSchema = new Schema<IDeepResearchRun>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerClerkId: { type: String, required: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  assistantMessageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },
  objective: { type: String, required: true, maxlength: 12000 },
  mode: { type: String, enum: ['efficient', 'premium'], default: 'premium', required: true },
  provider: { type: String, enum: ['anthropic', 'deepseek'], default: 'anthropic', required: true },
  modelName: { type: String, default: 'claude-sonnet-4-6', required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'partial', 'failed', 'cancelled'],
    default: 'queued',
    required: true,
  },
  phase: {
    type: String,
    enum: ['queued', 'planning', 'researching', 'evaluating', 'revising', 'synthesizing', 'completed', 'failed', 'cancelled'],
    default: 'queued',
    required: true,
  },
  phaseDetail: { type: String, default: 'Waiting for the research workflow to start...' },
  progress: { type: Number, min: 0, max: 100, default: 2 },
  plan: {
    title: String,
    summary: String,
    queryStrategy: [{ type: String }],
    items: [PlanItemSchema],
  },
  acceptanceCriteria: {
    minSuccessfulResearchCalls: { type: Number, required: true },
    minDistinctResearchTools: { type: Number, required: true },
    minExternalSources: { type: Number, required: true },
    minKeywordResults: { type: Number, required: true },
    requireKeywordData: { type: Boolean, required: true },
    requireCompetitorResearch: { type: Boolean, required: true },
    requireExistingContentReview: { type: Boolean, required: true },
  },
  researchMemo: { type: String, default: '' },
  report: { type: String, default: '' },
  evaluation: {
    passed: Boolean,
    score: Number,
    checks: [EvaluationCheckSchema],
    feedback: [{ type: String }],
    evaluatedAt: Date,
    deterministicPassed: Boolean,
    modelPassed: Boolean,
  },
  revisionCount: { type: Number, default: 0 },
  toolCalls: [{
    _id: false,
    name: String,
    input: Schema.Types.Mixed,
    result: String,
    success: Boolean,
    createdAt: { type: Date, default: Date.now },
  }],
  tokenUsage: {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
  },
  creditsUsed: { type: Number, default: 0 },
  billedAt: Date,
  liveLog: [{
    _id: false,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['phase', 'tool', 'evaluation', 'error'] },
    message: String,
  }],
  workflowToken: { type: String, required: true, select: false },
  startedAt: Date,
  completedAt: Date,
  error: String,
}, { timestamps: true });

DeepResearchRunSchema.index({ owner: 1, createdAt: -1 });
DeepResearchRunSchema.index({ conversationId: 1, createdAt: 1 });
DeepResearchRunSchema.index({ status: 1, updatedAt: 1 });

export default mongoose.models.DeepResearchRun ||
  mongoose.model<IDeepResearchRun>('DeepResearchRun', DeepResearchRunSchema);
