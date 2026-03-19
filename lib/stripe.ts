import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Pricing configuration
export const PRICING = {
  // Monthly subscription
  subscription: {
    priceId: process.env.STRIPE_SUBSCRIPTION_PRICE_ID || '', // Set after creating in Stripe
    amount: 4900, // $49.00
    trialDays: 30,
  },
  // Credit packs
  creditPacks: {
    small: {
      priceId: process.env.STRIPE_CREDIT_SMALL_PRICE_ID || '',
      amount: 2500, // $25.00
      credits: 5,
    },
    medium: {
      priceId: process.env.STRIPE_CREDIT_MEDIUM_PRICE_ID || '',
      amount: 5000, // $50.00
      credits: 10,
    },
    large: {
      priceId: process.env.STRIPE_CREDIT_LARGE_PRICE_ID || '',
      amount: 10000, // $100.00
      credits: 22, // 2 bonus credits
    },
  },
  // Free trial credits ($500 value at $5/credit)
  freeTrialCredits: 100,
  // Cost per credit (for display)
  costPerCredit: 500, // $5.00
};

// Helper to get credit pack by size
export function getCreditPack(size: 'small' | 'medium' | 'large') {
  return PRICING.creditPacks[size];
}

// Format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
