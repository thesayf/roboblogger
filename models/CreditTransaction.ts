import mongoose, { Schema, Document } from "mongoose";

export interface ICreditTransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  action: 'chat' | 'blog_generation' | 'batch_generation' | 'topup_purchase' | 'subscription_grant' | 'trial_grant' | 'adjustment';
  description: string;
  metadata?: {
    // Chat-specific
    conversationId?: string;
    mode?: 'efficient' | 'premium';
    provider?: 'anthropic' | 'deepseek';
    model?: string;
    toolCalls?: string[];
    claudeInputTokens?: number;
    claudeOutputTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    claudeCost?: number;
    modelCost?: number;
    toolCost?: number;
    totalApiCost?: number;
    // Blog generation-specific
    topicId?: string;
    postId?: string;
    // Purchase-specific
    stripePaymentId?: string;
    creditPack?: string;
  };
}

const CreditTransactionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // negative = deduction, positive = grant
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    action: {
      type: String,
      enum: ['chat', 'blog_generation', 'batch_generation', 'topup_purchase', 'subscription_grant', 'trial_grant', 'adjustment'],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for querying user transaction history
CreditTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.CreditTransaction ||
  mongoose.model<ICreditTransaction>("CreditTransaction", CreditTransactionSchema);
