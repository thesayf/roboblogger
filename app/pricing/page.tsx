import Link from 'next/link'
import { SignUpButton } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, honest pricing for Vibeblogger. Start free, upgrade when you're ready. AI-generated blog posts starting at $0.",
  alternates: {
    canonical: "https://vibeblogger.io/pricing",
  },
  openGraph: {
    title: "Pricing | Vibeblogger",
    description: "Simple, honest pricing for Vibeblogger. Start free, upgrade when you're ready.",
    url: "https://vibeblogger.io/pricing",
    siteName: "Vibeblogger",
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/pricing" className="text-sm text-[#111111] font-medium hidden sm:block">
            Pricing
          </Link>
          <SignUpButton mode="modal">
            <button className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Hero */}
      <section className="max-w-[720px] mx-auto px-8 pt-20 pb-16 text-center">
        <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
          Pricing
        </p>
        <h1 className="font-lora text-[40px] sm:text-[56px] font-normal leading-[1.15] tracking-[-0.02em] mb-6">
          Simple, honest pricing
        </h1>
        <p className="text-lg text-[#666666] leading-[1.7] max-w-[480px] mx-auto">
          Start free. Upgrade when you're ready. No surprises.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-[900px] mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[700px] mx-auto">
          {/* Free Plan */}
          <div className="bg-white border border-[#E0DED8] rounded-lg p-8">
            <div className="mb-6">
              <h3 className="font-lora text-[22px] font-normal mb-2">Free</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Try Vibeblogger with no commitment.
              </p>
            </div>
            <div className="mb-6">
              <span className="font-lora text-[40px] font-normal">$0</span>
              <span className="text-sm text-[#888888] ml-2">for 30 days</span>
            </div>
            <SignUpButton mode="modal">
              <button className="w-full text-[15px] font-medium text-[#111111] bg-transparent border border-[#CCCCCC] px-6 py-3 rounded-full hover:border-[#999999] transition-colors cursor-pointer mb-8">
                Start free trial
              </button>
            </SignUpButton>
            <ul className="space-y-3">
              {[
                "100 free blog posts",
                "SEO keyword research",
                "AI-generated content",
                "Headless API access",
                "15+ component types",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#111111] mt-0.5 shrink-0" />
                  <span className="text-sm text-[#444444]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#111111] text-white rounded-lg p-8">
            <div className="mb-6">
              <h3 className="font-lora text-[22px] font-normal mb-2">Pro</h3>
              <p className="text-sm text-[#999999] leading-relaxed">
                Everything you need to publish consistently.
              </p>
            </div>
            <div className="mb-6">
              <span className="font-lora text-[40px] font-normal">$49</span>
              <span className="text-sm text-[#888888] ml-2">/ month</span>
            </div>
            <SignUpButton mode="modal">
              <button className="w-full text-[15px] font-semibold text-[#111111] bg-white px-6 py-3 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer mb-8">
                Get started
              </button>
            </SignUpButton>
            <ul className="space-y-3">
              {[
                "Unlimited blog posts",
                "SEO keyword research",
                "AI-generated content",
                "AI-generated images",
                "Headless API access",
                "15+ component types",
                "Auto-publish scheduling",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white mt-0.5 shrink-0" />
                  <span className="text-sm text-[#CCCCCC]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Referral */}
      <section className="max-w-[600px] mx-auto px-8 py-20 text-center">
        <h2 className="font-lora text-3xl font-normal mb-4">
          Refer a friend, get a year free
        </h2>
        <p className="text-[15px] text-[#666666] leading-relaxed">
          Share Vibeblogger with a friend. When they sign up for Pro, you both get 12 months free. Simple as that.
        </p>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* FAQ */}
      <section className="max-w-[600px] mx-auto px-8 py-20">
        <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
          Questions
        </h2>
        <div className="space-y-10">
          {[
            {
              q: "What happens after the free trial?",
              a: "Your posts stay live. You just won't be able to generate new ones until you upgrade to Pro."
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel anytime from your dashboard. No contracts, no cancellation fees."
            },
            {
              q: "What counts as a blog post?",
              a: "Each AI-generated article counts as one post. Editing an existing post doesn't count as a new one."
            },
            {
              q: "Do I need a credit card for the free trial?",
              a: "No. Sign up with just your email. We'll only ask for payment when you're ready to upgrade."
            },
          ].map((faq) => (
            <div key={faq.q}>
              <h3 className="font-lora text-lg font-normal mb-2">{faq.q}</h3>
              <p className="text-sm text-[#666666] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h2 className="font-lora text-4xl font-normal tracking-tight mb-4">Ready to start?</h2>
          <p className="text-base text-[#999999] mb-9">Your first blog post is free. No credit card required.</p>
          <SignUpButton mode="modal">
            <button className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer">
              Create your first post →
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 text-center">
        <p className="text-[13px] text-[#AAAAAA]">vibeblogger.io</p>
      </footer>
    </div>
  )
}
