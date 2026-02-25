"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CreditsState {
  credits: number;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  subscriptionCurrentPeriodEnd?: string;
  trialEndsAt?: string;
  freeCreditsUsed: boolean;
  lifetimeCreditsUsed: number;
  lifetimeCreditsPurchased: number;
  isLoading: boolean;
  error: string | null;
}

interface CreditsContextType extends CreditsState {
  refreshCredits: () => Promise<void>;
  deductCredits: (amount?: number, action?: string) => Promise<boolean>;
  hasActiveSubscription: boolean;
  isTrialing: boolean;
  canGenerate: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    subscriptionStatus: 'none',
    freeCreditsUsed: false,
    lifetimeCreditsUsed: 0,
    lifetimeCreditsPurchased: 0,
    isLoading: true,
    error: null,
  });

  const fetchCredits = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/user/credits');

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - this is fine
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        credits: data.credits,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionCurrentPeriodEnd: data.subscriptionCurrentPeriodEnd,
        trialEndsAt: data.trialEndsAt,
        freeCreditsUsed: data.freeCreditsUsed,
        lifetimeCreditsUsed: data.lifetimeCreditsUsed,
        lifetimeCreditsPurchased: data.lifetimeCreditsPurchased,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error fetching credits:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch credits',
      }));
    }
  }, []);

  const deductCredits = useCallback(async (amount: number = 1, action?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, action }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          // Insufficient credits
          setState(prev => ({ ...prev, error: 'Insufficient credits' }));
          return false;
        }
        throw new Error(data.error || 'Failed to deduct credits');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        credits: data.credits,
        lifetimeCreditsUsed: prev.lifetimeCreditsUsed + amount,
      }));
      return true;
    } catch (err) {
      console.error('Error deducting credits:', err);
      return false;
    }
  }, []);

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const hasActiveSubscription = state.subscriptionStatus === 'active' || state.subscriptionStatus === 'trialing';
  const isTrialing = state.subscriptionStatus === 'trialing';
  const canGenerate = hasActiveSubscription && state.credits > 0;

  return (
    <CreditsContext.Provider
      value={{
        ...state,
        refreshCredits: fetchCredits,
        deductCredits,
        hasActiveSubscription,
        isTrialing,
        canGenerate,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
