"use client";

import { useState } from "react";
import { useCredits } from "@/lib/contexts/CreditsContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, Plus, Sparkles, Check, Loader2, CreditCard } from "lucide-react";

const creditPacks = [
  {
    id: "small",
    credits: 5,
    price: "$25",
    pricePerCredit: "$5.00",
    popular: false,
  },
  {
    id: "medium",
    credits: 10,
    price: "$50",
    pricePerCredit: "$5.00",
    popular: true,
  },
  {
    id: "large",
    credits: 22,
    price: "$100",
    pricePerCredit: "$4.55",
    popular: false,
    bonus: "+2 bonus",
  },
];

export function CreditsDisplay() {
  const { credits, subscriptionStatus, isTrialing, trialEndsAt, isLoading } = useCredits();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Format trial end date
  const formatTrialEndDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const trialEndFormatted = formatTrialEndDate(trialEndsAt);

  const handleTopUp = async (packId: string) => {
    try {
      setSelectedPack(packId);
      setIsPurchasing(true);

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credits", creditPack: packId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Top up error:", error);
      setIsPurchasing(false);
      setSelectedPack(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to open billing portal");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Billing portal error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F4F0] rounded-full">
        <Loader2 className="h-4 w-4 animate-spin text-[#888888]" />
      </div>
    );
  }

  // Don't show if no subscription
  if (subscriptionStatus === "none") {
    return null;
  }

  const isOutOfCredits = credits === 0;

  return (
    <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
      <DialogTrigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors group ${
            isOutOfCredits
              ? "bg-red-50 hover:bg-red-100 border border-red-200"
              : "bg-[#F5F4F0] hover:bg-[#EDECEA]"
          }`}
        >
          {/* Trial end date - always show when trialing */}
          {isTrialing && trialEndFormatted && (
            <>
              <span className="text-[13px] text-emerald-600">
                Trial ends {trialEndFormatted}
              </span>
              <span className="text-[#CCCCCC]">•</span>
            </>
          )}
          {/* Credits count */}
          <div className="flex items-center gap-1.5">
            <Coins className={`h-4 w-4 ${isOutOfCredits ? "text-red-500" : "text-amber-500"}`} />
            <span className={`text-[14px] font-medium ${isOutOfCredits ? "text-red-600" : "text-[#111111]"}`}>
              {credits}
            </span>
            <span className={`text-[13px] ${isOutOfCredits ? "text-red-500" : "text-[#666666]"}`}>credits</span>
          </div>
          {/* Action button */}
          {isOutOfCredits ? (
            <span className="text-[11px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              Top up
            </span>
          ) : (
            <Plus className="h-3.5 w-3.5 text-[#888888] group-hover:text-[#111111] transition-colors" />
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] bg-white border-[#E0DED8]">
        <DialogHeader>
          <DialogTitle
            className="text-[20px] font-semibold text-[#111111] flex items-center gap-2"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            <Coins className="h-5 w-5 text-amber-500" />
            Add Credits
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#666666]">
            1 credit = 1 AI-generated blog post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Trial info banner */}
          {isTrialing && trialEndFormatted && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-[14px] text-emerald-800">
                <span className="font-medium">Free trial active</span> — your first payment of $49/month will be on {trialEndFormatted}
              </p>
              <p className="text-[13px] text-emerald-600 mt-1">
                Credits you buy now will stay in your account after the trial.
              </p>
            </div>
          )}

          {/* Current balance */}
          <div className={`rounded-xl p-4 flex items-center justify-between ${
            isOutOfCredits ? "bg-red-50 border border-red-200" : "bg-[#F5F4F0]"
          }`}>
            <div>
              <p className={`text-[12px] uppercase tracking-wide ${
                isOutOfCredits ? "text-red-500" : "text-[#888888]"
              }`}>
                Current Balance
              </p>
              <p className={`text-[28px] font-semibold ${
                isOutOfCredits ? "text-red-600" : "text-[#111111]"
              }`}>
                {credits}{" "}
                <span className={`text-[14px] font-normal ${
                  isOutOfCredits ? "text-red-500" : "text-[#666666]"
                }`}>
                  credits
                </span>
              </p>
              {isOutOfCredits && (
                <p className="text-[13px] text-red-600 mt-1">
                  You need credits to generate posts
                </p>
              )}
            </div>
            <Sparkles className={`h-8 w-8 ${isOutOfCredits ? "text-red-400/50" : "text-amber-500/50"}`} />
          </div>

          {/* Credit packs */}
          <div className="space-y-2">
            {creditPacks.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleTopUp(pack.id)}
                disabled={isPurchasing}
                className={`w-full p-4 rounded-xl border transition-all text-left relative ${
                  pack.popular
                    ? "border-[#111111] bg-[#FAFAF8]"
                    : "border-[#E0DED8] hover:border-[#CCCCCC] bg-white"
                } ${isPurchasing && selectedPack === pack.id ? "opacity-70" : ""}`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-4 text-[11px] font-medium text-white bg-[#111111] px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-semibold text-[#111111]">
                        {pack.credits} credits
                      </span>
                      {pack.bonus && (
                        <span className="text-[12px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {pack.bonus}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#888888] mt-0.5">
                      {pack.pricePerCredit} per credit
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] font-semibold text-[#111111]">
                      {pack.price}
                    </span>
                    {isPurchasing && selectedPack === pack.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#888888]" />
                    ) : (
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          pack.popular
                            ? "bg-[#111111] text-white"
                            : "bg-[#F5F4F0] text-[#666666]"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Manage billing */}
          <div className="pt-4 border-t border-[#F0EEE8]">
            <button
              onClick={handleManageBilling}
              className="w-full flex items-center justify-center gap-2 text-[14px] text-[#666666] hover:text-[#111111] transition-colors py-2"
            >
              <CreditCard className="h-4 w-4" />
              Manage subscription & billing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
