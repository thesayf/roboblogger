import Link from 'next/link'
import { SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Check, ArrowRight, Clock, Zap, Shield, Search, PenTool, Image, Calendar, BarChart3, Code2, Bot, Gift, MessageSquare, TrendingUp, BookOpen } from 'lucide-react'
import CopyPromptButton from './CopyPromptButton'
import LiveStats from './LiveStats'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "100 Free Blog Posts in 5 Minutes",
  description: "Set up your AI-powered blog in 5 minutes. Get 100 research-backed, SEO-optimized posts — free. Your blog on autopilot.",
  alternates: {
    canonical: "https://vibeblogger.io/start",
  },
  openGraph: {
    title: "100 Free Blog Posts in 5 Minutes | Vibeblogger",
    description: "Set up your AI-powered blog in 5 minutes. Get 100 research-backed, SEO-optimized posts — free.",
    url: "https://vibeblogger.io/start",
    siteName: "Vibeblogger",
  },
}

export default async function StartPage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/blog/admin')
  }

  return (
    <div className="min-h-screen text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-6 sm:px-8 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/guide" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Setup Guide
          </Link>
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <SignUpButton mode="modal">
            <button className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* ============================================
          HERO — The Offer
          ============================================ */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-24">
          <div className="max-w-[720px] mx-auto text-center">
            <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
              The Autopilot Blog System
            </p>
            <h1 className="font-lora text-[36px] sm:text-[60px] font-normal leading-[1.12] tracking-[-0.02em] mb-7">
              100 blog posts.<br />
              5 minutes. Free.
            </h1>
            <p className="text-[17px] sm:text-lg text-[#999999] leading-[1.7] max-w-[540px] mx-auto mb-10">
              We research, write, optimize, and publish your entire blog.
              Every post backed by real data. Every image generated.
              You do nothing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <SignUpButton mode="modal">
                <button className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2">
                  Get 100 free posts
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
              <Link
                href="#how-it-works"
                className="text-[15px] font-medium text-white border border-[#444444] px-9 py-3.5 rounded-full hover:border-[#666666] transition-colors text-center"
              >
                See how it works
              </Link>
            </div>
            <p className="text-[13px] text-[#666666]">
              Set up in 5 minutes. Posts start generating immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          VALUE ANCHOR — What you're getting
          ============================================ */}
      <section className="bg-[#FAFAF8] border-b border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#888888]" />
            <span className="text-sm text-[#666666]">100 posts = <span className="text-[#111111] font-medium">$50,000</span> with freelancers</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#888888]" />
            <span className="text-sm text-[#666666]">Setup takes <span className="text-[#111111] font-medium">5 minutes</span></span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#888888]" />
            <span className="text-sm text-[#666666]">Your price: <span className="text-[#111111] font-medium">$0</span></span>
          </div>
        </div>
      </section>

      {/* ============================================
          LIVE PROOF
          ============================================ */}
      <LiveStats />

      {/* ============================================
          THE OFFER STACK
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            What you get
          </p>
          <h2 className="font-lora text-[28px] sm:text-[40px] font-normal leading-snug text-center mb-5">
            Everything included. Nothing held back.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[500px] mx-auto mb-16">
            Most tools give you a free trial with half the features locked.
            We give you the entire system.
          </p>

          <div className="max-w-[700px] mx-auto space-y-4">
            {/* Core offer */}
            <div className="bg-[#111111] text-white rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#222222] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-lora text-[20px] font-normal mb-1.5">100 AI-Researched Blog Posts</h3>
                      <p className="text-sm text-[#999999] leading-relaxed">
                        Every post starts with multi-source research — real statistics, expert quotes,
                        keyword data. Then written with 16 rich component types. Not walls of text.
                      </p>
                    </div>
                    <span className="text-sm text-[#666666] line-through whitespace-nowrap shrink-0">$50,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus 1 */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Search className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-lora text-[20px] font-normal">Full Competitor SEO Audit</h3>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded">Bonus</span>
                      </div>
                      <p className="text-sm text-[#666666] leading-relaxed">
                        Your AI strategist analyzes your competitors — what they rank for,
                        where the gaps are, what you should write about first.
                      </p>
                    </div>
                    <span className="text-sm text-[#AAAAAA] line-through whitespace-nowrap shrink-0">$2,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus 2 */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-lora text-[20px] font-normal">6-Month Content Calendar</h3>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded">Bonus</span>
                      </div>
                      <p className="text-sm text-[#666666] leading-relaxed">
                        Your AI researches your niche and builds a complete publishing calendar
                        with keyword data, search volume, and difficulty scores.
                      </p>
                    </div>
                    <span className="text-sm text-[#AAAAAA] line-through whitespace-nowrap shrink-0">$1,500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus 3 */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-lora text-[20px] font-normal">White-Glove Setup Call</h3>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded">Bonus</span>
                      </div>
                      <p className="text-sm text-[#666666] leading-relaxed">
                        Book a free 15-minute call. We&apos;ll set everything up with you —
                        brand voice, API integration, publishing agents. You do nothing.
                      </p>
                    </div>
                    <span className="text-sm text-[#AAAAAA] line-through whitespace-nowrap shrink-0">$500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus 4 */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-lora text-[20px] font-normal">3 Autonomous Agents</h3>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded">Bonus</span>
                      </div>
                      <p className="text-sm text-[#666666] leading-relaxed">
                        Pre-configured agents that run 24/7. Daily SEO monitoring.
                        Weekly topic research. Automatic publishing. No input needed.
                      </p>
                    </div>
                    <span className="text-sm text-[#AAAAAA] line-through whitespace-nowrap shrink-0">$1,200/mo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bonus 5 */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-lora text-[20px] font-normal">Brand Voice Training</h3>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded">Bonus</span>
                      </div>
                      <p className="text-sm text-[#666666] leading-relaxed">
                        Your AI learns your tone, your audience, your style.
                        Every post sounds like you wrote it — not like a robot.
                      </p>
                    </div>
                    <span className="text-sm text-[#AAAAAA] line-through whitespace-nowrap shrink-0">$500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total value + CTA */}
            <div className="bg-[#111111] text-white rounded-xl p-7 sm:p-8 mt-8">
              <div className="text-center">
                <p className="text-sm text-[#888888] mb-2">Total value</p>
                <p className="font-lora text-[32px] sm:text-[40px] font-normal mb-1">
                  <span className="text-[#666666] line-through mr-3">$55,700</span>
                  <span className="text-white">Free</span>
                </p>
                <p className="text-sm text-[#666666] mb-8">Then $49/mo to keep your blog on autopilot</p>
                <SignUpButton mode="modal">
                  <button className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2">
                    Claim your 100 free posts
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          5-MINUTE SETUP
          ============================================ */}
      <section id="how-it-works" className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            How it works
          </p>
          <h2 className="font-lora text-[28px] sm:text-[40px] font-normal leading-snug text-center mb-5">
            Live in 5 minutes
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[480px] mx-auto mb-16">
            You already use a coding agent. This takes one prompt.
          </p>

          <div className="max-w-[640px] mx-auto space-y-10">
            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  1
                </div>
                <div className="w-px h-full bg-[#E0DED8] mt-3" />
              </div>
              <div className="pb-2">
                <h3 className="font-lora text-[18px] font-normal mb-2">Create your account & set your brand voice</h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  Sign up, tell us your niche, audience, and tone. Takes 2 minutes.
                  This is how your AI learns to write like you.
                </p>
                <p className="text-[13px] text-[#888888] mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 2 minutes
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  2
                </div>
                <div className="w-px h-full bg-[#E0DED8] mt-3" />
              </div>
              <div className="pb-2">
                <h3 className="font-lora text-[18px] font-normal mb-2">Get your API key</h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  One click in your dashboard. Copy the key.
                </p>
                <p className="text-[13px] text-[#888888] mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 30 seconds
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  3
                </div>
                <div className="w-px h-full bg-[#E0DED8] mt-3" />
              </div>
              <div className="pb-2">
                <h3 className="font-lora text-[18px] font-normal mb-2">Paste one prompt into your coding agent</h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  Copy our setup prompt. Paste it into Cursor, Claude Code, or any AI coding tool.
                  It builds your blog pages, renders all 16 component types, and sets up
                  SEO metadata, sitemaps, and structured data — automatically.
                </p>
                <div className="mt-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#2A2A2A]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
                    <span className="text-[11px] text-[#555555] ml-2 font-mono">Your coding agent</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[13px] text-[#88CCFF] font-mono leading-relaxed">
                      &quot;Add a blog to my site using the Vibeblogger API.
                      Set up all 16 component renderers, SEO metadata,
                      sitemap, RSS feed, and structured data...&quot;
                    </p>
                    <p className="text-[12px] text-[#555555] font-mono mt-2">
                      // Full prompt includes API docs, component types, SEO setup, and more
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <CopyPromptButton />
                </div>
                <p className="text-[13px] text-[#888888] mt-3 leading-relaxed">
                  Or{' '}
                  <a href="https://calendly.com/hello-vibeblogger/30min" target="_blank" rel="noopener noreferrer" className="text-[#111111] font-medium underline underline-offset-2 hover:text-[#444444] transition-colors">
                    book a free setup call
                  </a>
                  {' '}and we&apos;ll do it for you.
                </p>
                <p className="text-[13px] text-[#888888] mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 1 minute
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  4
                </div>
                <div className="w-px h-full bg-[#E0DED8] mt-3" />
              </div>
              <div className="pb-2">
                <h3 className="font-lora text-[18px] font-normal mb-2">Enable your publishing agents</h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  Pre-built templates — just click to enable. Daily SEO monitoring.
                  Weekly topic research. Automatic publishing. All running 24/7.
                </p>
                <p className="text-[13px] text-[#888888] mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 1 minute
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  5
                </div>
              </div>
              <div>
                <h3 className="font-lora text-[18px] font-normal mb-2">Tell your SEO agent to generate your first topics</h3>
                <p className="text-sm text-[#666666] leading-relaxed">
                  Open the chat and type: &quot;Research my niche and queue 40 topics.&quot;
                  Your AI researches competitors, finds keyword gaps, and starts generating.
                </p>
                <p className="text-[13px] text-[#888888] mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 30 seconds
                </p>
              </div>
            </div>
          </div>

          {/* Total time */}
          <div className="max-w-[640px] mx-auto mt-12">
            <div className="bg-[#F5F4F0] border border-[#E0DED8] rounded-xl p-6 text-center">
              <p className="text-sm text-[#888888] mb-1">Total setup time</p>
              <p className="font-lora text-[28px] font-normal text-[#111111]">5 minutes</p>
              <p className="text-sm text-[#666666] mt-1">Then your blog runs itself.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          THE GUARANTEE
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[700px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="bg-white border-2 border-[#111111] rounded-xl p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#F5F4F0] rounded-full mb-6">
              <Shield className="w-6 h-6 text-[#111111]" />
            </div>
            <h2 className="font-lora text-[24px] sm:text-[32px] font-normal leading-snug mb-4">
              The 90-Day Traffic Guarantee
            </h2>
            <p className="text-[15px] text-[#666666] leading-[1.7] max-w-[480px] mx-auto mb-6">
              If you don&apos;t see organic traffic growth within 90 days of publishing,
              we&apos;ll generate another 100 posts — free. No questions asked.
            </p>
            <p className="text-sm text-[#888888]">
              We can make this guarantee because the system works.
              Every post is research-backed, not AI slop.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT'S INSIDE EACH POST
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            Not AI slop
          </p>
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-5">
            Research-backed content. 16 component types.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[500px] mx-auto mb-16">
            Every post starts with real keyword data and multi-source research.
            Then it&apos;s built from structured components — not a wall of text.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: "Real statistics" },
              { icon: MessageSquare, label: "Expert quotes" },
              { icon: BarChart3, label: "Charts & graphs" },
              { icon: Image, label: "AI images" },
              { icon: Code2, label: "Code blocks" },
              { icon: Search, label: "SEO metadata" },
              { icon: Gift, label: "Callout boxes" },
              { icon: Calendar, label: "Comparison tables" },
            ].map((item) => (
              <div key={item.label} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-4 text-center">
                <item.icon className="w-5 h-5 text-[#888888] mx-auto mb-2.5" />
                <span className="text-[13px] text-[#666666]">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-[#888888] text-center mt-6">
            + pros/cons lists, timelines, step-by-step guides, CTAs, video embeds, and more
          </p>
        </div>
      </section>

      {/* ============================================
          COMPARISON
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            How it compares
          </p>
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-16">
            The math is simple
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E0DED8]">
                  <th className="text-left py-4 pr-4 text-[#888888] font-medium"></th>
                  <th className="text-center py-4 px-4 text-[#888888] font-medium">Freelancer</th>
                  <th className="text-center py-4 px-4 text-[#888888] font-medium">ChatGPT</th>
                  <th className="text-center py-4 px-4 text-[#888888] font-medium">Jasper</th>
                  <th className="text-center py-4 px-4 text-[#111111] font-semibold bg-[#F5F4F0] rounded-t-lg">Vibeblogger</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "100 posts cost", freelancer: "$30,000–50,000", chatgpt: "Free*", jasper: "$5,900+", vb: "$0" },
                  { label: "SEO research", freelancer: "Maybe", chatgpt: "No", jasper: "Partial", vb: "Full" },
                  { label: "AI images", freelancer: "No", chatgpt: "No", jasper: "Yes", vb: "Yes" },
                  { label: "Auto-publish", freelancer: "No", chatgpt: "No", jasper: "No", vb: "Yes" },
                  { label: "Headless API", freelancer: "No", chatgpt: "No", jasper: "Enterprise", vb: "Yes" },
                  { label: "Autonomous agents", freelancer: "No", chatgpt: "No", jasper: "No", vb: "Yes" },
                  { label: "Time per 100 posts", freelancer: "3–6 months", chatgpt: "200+ hours", jasper: "50+ hours", vb: "5 minutes" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-[#E0DED8]">
                    <td className="py-3.5 pr-4 text-[#444444] font-medium">{row.label}</td>
                    <td className="py-3.5 px-4 text-center text-[#888888]">{row.freelancer}</td>
                    <td className="py-3.5 px-4 text-center text-[#888888]">{row.chatgpt}</td>
                    <td className="py-3.5 px-4 text-center text-[#888888]">{row.jasper}</td>
                    <td className="py-3.5 px-4 text-center text-[#111111] font-semibold bg-[#F5F4F0]">{row.vb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-[#AAAAAA] mt-4">
            * Plus 200+ hours of your time prompting, formatting, researching, and publishing.
          </p>
        </div>
      </section>

      {/* ============================================
          SCARCITY
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-16 text-center">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-6">
            Limited availability
          </p>
          <h2 className="font-lora text-[24px] sm:text-[32px] font-normal leading-snug mb-4">
            We&apos;re onboarding 50 founders this month
          </h2>
          <p className="text-[15px] text-[#666666] leading-[1.7] max-w-[440px] mx-auto">
            Each one gets 100 free posts and a white-glove setup call.
            When we hit 50, the free posts drop to 10 and the setup call goes away.
          </p>
        </div>
      </section>

      {/* ============================================
          FAQ
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-20">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
            Questions
          </p>
          <div className="space-y-10">
            {[
              {
                q: "Is this actually free?",
                a: "Yes. You get 100 credits — enough for 100 blog posts. After that, it's $49/mo to keep your blog on autopilot."
              },
              {
                q: "Will Google penalize AI content?",
                a: "Google penalizes low-quality content, not AI content. Every Vibeblogger post is research-backed with real data, expert quotes, and structured components. 86% of high-ranking pages already contain AI content."
              },
              {
                q: "What if I want to edit posts?",
                a: "Full control. Edit any component, update SEO metadata, change images. Or tell the agent \"update the intro on my latest post\" in chat."
              },
              {
                q: "Do I need to be technical?",
                a: "You need a website built with a modern framework (Next.js, Astro, Remix, etc.) and a coding agent like Cursor or Claude Code. The setup takes one prompt. Or book a free call and we'll do it for you."
              },
              {
                q: "What happens after 100 posts?",
                a: "Your posts stay live forever. To keep generating new content and running autonomous agents, subscribe for $49/mo. That's less than a single freelance blog post."
              },
              {
                q: "What's the 90-day guarantee?",
                a: "If you publish your 100 posts and don't see organic traffic growth within 90 days, we'll generate another 100 posts for free. We can offer this because the research-backed system works."
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-lora text-lg font-normal mb-2">{faq.q}</h3>
                <p className="text-sm text-[#666666] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-24 text-center">
          <h2 className="font-lora text-[32px] sm:text-[44px] font-normal tracking-tight leading-[1.15] mb-5">
            Your competitors are publishing.<br />
            Are you?
          </h2>
          <p className="text-base text-[#999999] mb-4">
            100 free posts. 5-minute setup.
          </p>
          <p className="text-sm text-[#666666] mb-9">
            Plus: competitor audit, content calendar, 3 autonomous agents,
            brand voice training, and a white-glove setup call. All free.
          </p>
          <SignUpButton mode="modal">
            <button className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2">
              Get your 100 free posts
              <ArrowRight className="w-4 h-4" />
            </button>
          </SignUpButton>
          <p className="text-[13px] text-[#555555] mt-5">
            Onboarding 50 founders this month. Claim your spot.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-[#222222] px-8 py-8 text-center">
        <p className="text-[13px] text-[#555555]">
          <Link href="/" className="hover:text-[#888888] transition-colors">vibeblogger.io</Link>
        </p>
      </footer>
    </div>
  )
}
