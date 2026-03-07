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
} from "@/components/ui/dialog";
import {
  Sparkles,
  Check,
  Loader2,
  Zap,
  FileText,
  Calendar,
  Palette,
} from "lucide-react";

const features = [
  { icon: FileText, text: "AI-powered blog post generation" },
  { icon: Zap, text: "SEO research & optimization" },
  { icon: Calendar, text: "Scheduled publishing" },
  { icon: Palette, text: "Custom brand voice & style" },
];

interface SubscriptionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionPrompt({
  open,
  onOpenChange,
}: SubscriptionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border-[#E0DED8]">
        <DialogHeader>
          <DialogTitle
            className="text-[24px] font-semibold text-[#111111] text-center"
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            Start Your Free Trial
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#666666] text-center">
            5-day free trial with $20 free credits included
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[42px] font-semibold text-[#111111]">
                $49
              </span>
              <span className="text-[16px] text-[#888888]">/month</span>
            </div>
            <p className="text-[13px] text-[#888888] mt-1">
              after 5-day free trial
            </p>
          </div>

          {/* Trial benefits */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-[14px] font-medium text-emerald-800">
                Free trial includes
              </span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-[14px] text-emerald-700">
                <Check className="h-4 w-4 text-emerald-500" />
                $20 free credits to get started
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
          <div className="space-y-3">
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

          {/* CTA */}
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full h-12 bg-[#111111] hover:bg-[#333333] text-white rounded-full text-[15px] font-medium"
          >
            {isLoading ? (
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
          <p className="text-[12px] text-[#888888] text-center">
            You won't be charged until your trial ends. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use subscription prompt
export function useSubscriptionPrompt() {
  const { subscriptionStatus, hasActiveSubscription } = useCredits();

  const needsSubscription = subscriptionStatus === "none";

  return {
    needsSubscription,
    hasActiveSubscription,
  };
}
