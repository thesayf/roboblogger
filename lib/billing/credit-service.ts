import User from '@/models/User';
import CreditTransaction from '@/models/CreditTransaction';
import dbConnect from '@/lib/mongo';

// Claude model pricing (USD per million tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4 },
};

// Known cost per external tool call (USD)
const TOOL_COSTS: Record<string, number> = {
  web_search: 0.01,               // Perplexity sonar
  search_trending_topics: 0.02,   // Perplexity sonar-pro
  search_competitor_content: 0.02, // Perplexity sonar-pro
  search_content_gaps: 0.02,      // Perplexity sonar-pro
  search_keyword_data: 0.05,      // DataForSEO
  search_related_keywords: 0.05,  // DataForSEO
  check_post_rankings: 0.05,      // DataForSEO SERP
  view_image: 0.005,              // Claude Haiku vision
};

// 2x markup: at $5/credit, CREDITS_PER_DOLLAR = 0.4 so user pays 2x API cost.
// Formula: API cost × 0.4 = credits → credits × $5 = 2× API cost.
const CREDITS_PER_DOLLAR = 0.4;
const MIN_CREDITS_PER_CHAT = 0.02;
const BLOG_GENERATION_CREDITS = 1;

export interface ChatUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: Array<{ name: string }>;
}

/**
 * Calculate credit cost for a chat exchange based on actual usage
 */
export function calculateChatCredits(usage: ChatUsage): {
  credits: number;
  claudeCost: number;
  toolCost: number;
  totalApiCost: number;
} {
  const pricing = MODEL_PRICING[usage.model] || MODEL_PRICING['claude-sonnet-4-6'];

  const claudeCost =
    (usage.inputTokens * pricing.input / 1_000_000) +
    (usage.outputTokens * pricing.output / 1_000_000);

  const toolCost = usage.toolCalls.reduce(
    (sum, tc) => sum + (TOOL_COSTS[tc.name] || 0),
    0
  );

  const totalApiCost = claudeCost + toolCost;
  const credits = Math.max(MIN_CREDITS_PER_CHAT, Math.round(totalApiCost * CREDITS_PER_DOLLAR * 100) / 100);

  return { credits, claudeCost, toolCost, totalApiCost };
}

/**
 * Atomically deduct credits and log a transaction.
 * Returns null if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  action: ICreditTransactionAction,
  description: string,
  metadata?: Record<string, any>,
): Promise<{ success: true; newBalance: number } | { success: false; available: number; required: number }> {
  await dbConnect();

  // Atomic: only deduct if balance is sufficient
  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: amount } },
    { $inc: { credits: -amount, lifetimeCreditsUsed: amount } },
    { new: false } // return the doc BEFORE update so we get balanceBefore
  );

  if (!user) {
    // Either user not found or insufficient credits
    const checkUser = await User.findById(userId);
    return {
      success: false,
      available: checkUser?.credits ?? 0,
      required: amount,
    };
  }

  const balanceBefore = user.credits;
  const balanceAfter = balanceBefore - amount;

  // Log transaction (fire-and-forget is fine, don't block the response)
  CreditTransaction.create({
    user: userId,
    amount: -amount,
    balanceBefore,
    balanceAfter,
    action,
    description,
    metadata,
  }).catch((err: Error) => console.error('[CreditService] Failed to log transaction:', err));

  return { success: true, newBalance: balanceAfter };
}

/**
 * Grant credits and log a transaction (for purchases, subscriptions, etc.)
 */
export async function grantCredits(
  userId: string,
  amount: number,
  action: ICreditTransactionAction,
  description: string,
  metadata?: Record<string, any>,
): Promise<{ newBalance: number }> {
  await dbConnect();

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { credits: amount, lifetimeCreditsPurchased: amount } },
    { new: false }
  );

  if (!user) throw new Error(`User ${userId} not found`);

  const balanceBefore = user.credits;
  const balanceAfter = balanceBefore + amount;

  CreditTransaction.create({
    user: userId,
    amount,
    balanceBefore,
    balanceAfter,
    action,
    description,
    metadata,
  }).catch((err: Error) => console.error('[CreditService] Failed to log transaction:', err));

  return { newBalance: balanceAfter };
}

/**
 * Return a previously deducted credit when the paid action produces no result.
 * Refunds reverse usage rather than counting as purchased credits.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>,
): Promise<{ newBalance: number }> {
  await dbConnect();

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { credits: amount, lifetimeCreditsUsed: -amount } },
    { new: false },
  );

  if (!user) throw new Error(`User ${userId} not found`);

  const balanceBefore = user.credits;
  const balanceAfter = balanceBefore + amount;

  CreditTransaction.create({
    user: userId,
    amount,
    balanceBefore,
    balanceAfter,
    action: 'adjustment',
    description,
    metadata,
  }).catch((err: Error) => console.error('[CreditService] Failed to log refund:', err));

  return { newBalance: balanceAfter };
}

type ICreditTransactionAction = 'chat' | 'blog_generation' | 'batch_generation' | 'topup_purchase' | 'subscription_grant' | 'trial_grant' | 'adjustment';

export { BLOG_GENERATION_CREDITS, TOOL_COSTS, MODEL_PRICING, CREDITS_PER_DOLLAR };
