"use client";

import { useState } from "react";
import { useCredits } from "@/lib/contexts/CreditsContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X, AlertCircle, Clock } from "lucide-react";
import { SubscriptionPrompt } from "./SubscriptionPrompt";

export function SubscriptionBanner() {
  const { subscriptionStatus, credits, trialEndsAt, isLoading } = useCredits();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsCheckingOut(true);
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Subscribe error:", error);
      setIsCheckingOut(false);
    }
  };

  if (isLoading || isDismissed) {
    return null;
  }

  // Show nothing if user has active subscription (not trialing or none)
  if (subscriptionStatus === "active") {
    return null;
  }

  // Trial warning banner
  if (subscriptionStatus === "trialing" && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    const now = new Date();
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 2) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-amber-800">
                Your trial ends {daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
              </p>
              <p className="text-[13px] text-amber-700">
                Subscribe now to keep your credits and continue generating blog posts
              </p>
            </div>
          </div>
          <Button
            onClick={handleSubscribe}
            disabled={isCheckingOut}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-5"
          >
            {isCheckingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </div>
      );
    }
    return null;
  }

  // Past due warning
  if (subscriptionStatus === "past_due") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-red-800">
              Payment failed
            </p>
            <p className="text-[13px] text-red-700">
              Please update your payment method to continue using Vibeblogger
            </p>
          </div>
        </div>
        <Button
          onClick={async () => {
            const response = await fetch("/api/stripe/portal", {
              method: "POST",
            });
            const { url } = await response.json();
            window.location.href = url;
          }}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5"
        >
          Update Payment
        </Button>
      </div>
    );
  }

  // No subscription - show subscribe banner
  if (subscriptionStatus === "none" || subscriptionStatus === "canceled") {
    return (
      <>
        <div className="bg-gradient-to-r from-[#111111] to-[#333333] rounded-xl p-6 mb-6 flex items-center justify-between text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-[18px] font-semibold">
                Start your free trial
              </p>
              <p className="text-[14px] text-white/70">
                5-day trial • 10 free credits included • Cancel anytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-[24px] font-bold">$49</p>
              <p className="text-[12px] text-white/60">/month after trial</p>
            </div>
            <Button
              onClick={() => setShowSubscribeModal(true)}
              className="bg-white text-[#111111] hover:bg-gray-100 rounded-full px-6 h-11 text-[14px] font-medium"
            >
              Get Started
            </Button>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-3 right-3 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SubscriptionPrompt
          open={showSubscribeModal}
          onOpenChange={setShowSubscribeModal}
        />
      </>
    );
  }

  return null;
}
