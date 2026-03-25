"use client";

import { useState, useEffect, useRef } from "react";
import { useCredits } from "@/lib/contexts/CreditsContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import {
  Sparkles,
  Loader2,
  Check,
  Zap,
  FileText,
  Calendar,
  Palette,
  AlertCircle,
  CreditCard,
  LogOut,
} from "lucide-react";

const features = [
  { icon: FileText, text: "AI-powered blog post generation" },
  { icon: Zap, text: "SEO research & optimization" },
  { icon: Calendar, text: "Scheduled publishing" },
  { icon: Palette, text: "Custom brand voice & style" },
];

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { subscriptionStatus, isLoading, refreshCredits } = useCredits();
  const { signOut } = useClerk();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSynced = useRef(false);
  const hasRefreshed = useRef(false);

  // Always refresh credits on mount to prevent stale state from a previous session
  useEffect(() => {
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshCredits();
    }
  }, [refreshCredits]);

  // Proactively sync subscription status from Stripe if gate would show paywall
  useEffect(() => {
    if (!isLoading && !hasSynced.current && subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
      hasSynced.current = true;
      setIsSyncing(true);
      fetch('/api/user/sync-subscription', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.synced && (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing')) {
            refreshCredits();
          }
        })
        .catch(() => {})
        .finally(() => setIsSyncing(false));
    }
  }, [isLoading, subscriptionStatus, refreshCredits]);

  const handleOpenBillingPortal = async () => {
    try {
      setIsOpeningPortal(true);
      setError(null);

      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsOpeningPortal(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsCheckingOut(true);
      setError(null);

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription" }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If Stripe says they already have a subscription, sync the DB and refresh
        if (response.status === 400 && data.error?.includes('already have an active subscription')) {
          setIsCheckingOut(false);
          setIsSyncing(true);
          try {
            await fetch('/api/user/sync-subscription', { method: 'POST' });
            await refreshCredits();
          } finally {
            setIsSyncing(false);
          }
          return;
        }
        console.error("Checkout error:", data);
        throw new Error(data.error || data.details || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCheckingOut(false);
    }
  };

  // Show loading state (including while syncing subscription from Stripe)
  if (isLoading || isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF8' }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#888888]" />
      </div>
    );
  }

  // Allow access if user has active subscription or is trialing
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return <>{children}</>;
  }

  // Show payment failed message for past_due status
  if (subscriptionStatus === "past_due") {
    return (
      <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
        {/* Minimal header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-[#E0DED8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-lora text-xl font-bold text-[#111111]">Vibeblogger</span>
              </Link>
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#111111] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Payment failed content */}
        <div className="flex items-center justify-center p-4 pt-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border border-[#E0DED8] shadow-sm p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <h1
                  className="text-[28px] font-semibold text-[#111111] mb-2"
                  style={{ fontFamily: "'Lora', Georgia, serif" }}
                >
                  Payment Failed
                </h1>
                <p className="text-[15px] text-[#666666]">
                  We couldn't process your payment. Please update your payment method to regain access.
                </p>
              </div>

              {/* Info box */}
              <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6">
                <p className="text-[14px] text-red-700">
                  Your subscription is on hold until payment is resolved. Your posts and settings are safe.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              {/* CTA */}
              <Button
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
                className="w-full h-12 bg-[#111111] hover:bg-[#333333] text-white rounded-full text-[15px] font-medium"
              >
                {isOpeningPortal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </>
                )}
              </Button>

              {/* Help text */}
              <p className="text-[12px] text-[#888888] text-center mt-4">
                Need help? Contact us at support@vibeblogger.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show resubscribe message for canceled users
  if (subscriptionStatus === "canceled") {
    return (
      <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
        {/* Minimal header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-[#E0DED8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-lora text-xl font-bold text-[#111111]">Vibeblogger</span>
              </Link>
              <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#111111] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Canceled subscription content */}
        <div className="flex items-center justify-center p-4 pt-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border border-[#E0DED8] shadow-sm p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h1
                  className="text-[28px] font-semibold text-[#111111] mb-2"
                  style={{ fontFamily: "'Lora', Georgia, serif" }}
                >
                  Subscription Canceled
                </h1>
                <p className="text-[15px] text-[#666666]">
                  Your subscription has ended. Resubscribe to continue creating AI-powered blog posts.
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[48px] font-bold text-[#111111]">$49</span>
                  <span className="text-[16px] text-[#888888]">/month</span>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-[#F5F4F0] rounded-xl p-4 border border-[#E0DED8] mb-6">
                <p className="text-[14px] text-[#666666]">
                  Your posts and settings are still saved. Pick up right where you left off.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              {/* CTA */}
              <Button
                onClick={handleSubscribe}
                disabled={isCheckingOut}
                className="w-full h-12 bg-[#111111] hover:bg-[#333333] text-white rounded-full text-[15px] font-medium"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Resubscribe
                  </>
                )}
              </Button>

              {/* Help text */}
              <p className="text-[12px] text-[#888888] text-center mt-4">
                Questions? Contact us at support@vibeblogger.com
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show paywall for new users without subscription
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Minimal header - just logo */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E0DED8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <span className="font-lora text-xl font-bold text-[#111111]">Vibeblogger</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-[#666666] hover:text-[#111111] transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Paywall content */}
      <div className="flex items-center justify-center p-4 pt-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl border border-[#E0DED8] shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1
              className="text-[28px] font-semibold text-[#111111] mb-2"
              style={{ fontFamily: "'Lora', Georgia, serif" }}
            >
              Welcome to Vibeblogger
            </h1>
            <p className="text-[15px] text-[#666666]">
              Start your free trial to create AI-powered blog posts
            </p>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[48px] font-bold text-[#111111]">$49</span>
              <span className="text-[16px] text-[#888888]">/month</span>
            </div>
            <p className="text-[13px] text-[#888888] mt-1">
              after 30-day free trial
            </p>
          </div>

          {/* Trial benefits */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-[14px] font-medium text-emerald-800">
                Free trial includes
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-[14px] text-emerald-700">
                <Check className="h-4 w-4 text-emerald-500" />
                100 free blog posts to get started
              </li>
              <li className="flex items-center gap-2 text-[14px] text-emerald-700">
                <Check className="h-4 w-4 text-emerald-500" />
                Full access to all features
              </li>
              <li className="flex items-center gap-2 text-[14px] text-emerald-700">
                <Check className="h-4 w-4 text-emerald-500" />
                Cancel anytime during trial
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#F5F4F0] flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-[#666666]" />
                </div>
                <span className="text-[14px] text-[#444444]">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            disabled={isCheckingOut}
            className="w-full h-12 bg-[#111111] hover:bg-[#333333] text-white rounded-full text-[15px] font-medium"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Free Trial
              </>
            )}
          </Button>

          {/* Fine print */}
          <p className="text-[12px] text-[#888888] text-center mt-4">
            You won't be charged until your trial ends. Cancel anytime.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
