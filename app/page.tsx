import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { generateHomePageSchema } from '@/utils/schema'
import { Check, ArrowRight, Zap, Search, PenTool, Image, Calendar, Code2, BarChart3, FileText, MessageSquare, Quote, Table, Target, TrendingUp, Shield, Clock, Users } from 'lucide-react'
import LiveProofBar from '@/components/LiveProofBar'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/blog/admin')
  }

  const schema = generateHomePageSchema()

  return (
    <div className="min-h-screen text-[#111111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* ============================================
          NAV
          ============================================ */}
      <nav className="max-w-[1100px] mx-auto px-6 sm:px-8 py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/about" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            About
          </Link>
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/guide" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Setup Guide
          </Link>
          <Link href="/blog" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Blog
          </Link>
          <SignInButton mode="modal">
            <button className="text-sm text-[#666666] hover:text-[#111111] transition-colors cursor-pointer hidden sm:block">
              Sign in
            </button>
          </SignInButton>
          <Link
            href="/start"
            className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer"
          >
            Get 100 Free Posts
          </Link>
        </div>
      </nav>

      {/* ============================================
          HERO — Dark
          ============================================ */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-28">
          <div className="max-w-[720px] mx-auto text-center">
            <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
              Your AI content team
            </p>
            <h1 className="font-lora text-[36px] sm:text-[60px] font-normal leading-[1.12] tracking-[-0.02em] mb-7">
              Your blog.<br />
              On autopilot.
            </h1>
            <p className="text-[17px] sm:text-lg text-[#999999] leading-[1.7] max-w-[520px] mx-auto mb-10">
              Tell Vibeblogger your niche. It researches keywords, writes posts,
              generates images, and publishes on your schedule. Like having an
              SEO expert on your team for $49/mo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/start"
                className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                Get 100 free posts
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/blog"
                className="text-[15px] font-medium text-white border border-[#444444] px-9 py-3.5 rounded-full hover:border-[#666666] transition-colors text-center"
              >
                See live examples
              </Link>
            </div>
            <p className="text-[13px] text-[#666666]">
              100 free posts. 5-minute setup. No credit card.
            </p>
          </div>

          {/* Hero visual — Agent chat preview */}
          <div className="max-w-[700px] mx-auto mt-16">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2A2A2A]">
                <div className="w-3 h-3 rounded-full bg-[#333333]" />
                <div className="w-3 h-3 rounded-full bg-[#333333]" />
                <div className="w-3 h-3 rounded-full bg-[#333333]" />
                <span className="text-[12px] text-[#555555] ml-3 font-mono">Vibeblogger — Strategist</span>
              </div>
              <div className="p-6 space-y-5">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-[#2A2A2A] rounded-2xl rounded-br-md px-5 py-3 max-w-[85%]">
                    <p className="text-[14px] text-[#E0E0E0] leading-relaxed">
                      I run a project management SaaS. Research what keywords my competitors rank for and queue 10 posts for the next month.
                    </p>
                  </div>
                </div>
                {/* Agent response */}
                <div className="flex justify-start">
                  <div className="bg-[#222222] border border-[#2A2A2A] rounded-2xl rounded-bl-md px-5 py-3 max-w-[85%]">
                    <p className="text-[14px] text-[#CCCCCC] leading-relaxed">
                      Found 47 keyword gaps across 3 competitors. I&apos;ve queued 10 posts targeting high-volume, low-difficulty keywords:
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {[
                        '"Best Project Management Tools 2025" — 12,100 searches/mo',
                        '"Agile vs Waterfall: Which Is Right?" — 8,400 searches/mo',
                        '"How to Run a Sprint Planning Meeting" — 6,200 searches/mo',
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-[#999999]">{item}</span>
                        </div>
                      ))}
                      <p className="text-[13px] text-[#666666] mt-1">+ 7 more queued for the next 4 weeks</p>
                    </div>
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="bg-[#222222] border border-[#2A2A2A] rounded-2xl rounded-bl-md px-5 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#555555] animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-[#555555] animate-pulse [animation-delay:150ms]" />
                      <div className="w-2 h-2 rounded-full bg-[#555555] animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SOCIAL PROOF BAR — Live data
          ============================================ */}
      <LiveProofBar />

      {/* ============================================
          THE PROBLEM
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-4">
            You know you need a blog. You don&apos;t have time.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[480px] mx-auto mb-16">
            Every option sucks — until now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-7">
              <div className="text-[13px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-4">Hiring a writer</div>
              <ul className="space-y-2.5">
                {["$300–500 per post", "Weeks of back and forth", "Quality varies wildly", "No SEO expertise included"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[#CC4444] mt-0.5 text-sm shrink-0">✕</span>
                    <span className="text-sm text-[#666666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#E0DED8] rounded-lg p-7">
              <div className="text-[13px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-4">Using ChatGPT</div>
              <ul className="space-y-2.5">
                {["Generic AI slop", "No keyword research", "No images or formatting", "Hours of copy-paste"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[#CC4444] mt-0.5 text-sm shrink-0">✕</span>
                    <span className="text-sm text-[#666666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#E0DED8] rounded-lg p-7">
              <div className="text-[13px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-4">Doing it yourself</div>
              <ul className="space-y-2.5">
                {["Keyword research takes hours", "Writing takes days", "Still need images & SEO", "Unsustainable long-term"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[#CC4444] mt-0.5 text-sm shrink-0">✕</span>
                    <span className="text-sm text-[#666666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SOLUTION REVEAL — "Your AI Content Team"
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            The solution
          </p>
          <h2 className="font-lora text-[28px] sm:text-[40px] font-normal leading-snug text-center mb-5">
            Meet your AI content team
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[500px] mx-auto mb-16">
            A strategist that plans your content. Agents that execute it daily.
            One product that replaces your entire content workflow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <MessageSquare className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Strategist</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Tell it your goals in plain English. It researches your competitors,
                finds keyword gaps, and builds your content calendar.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <PenTool className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Creator</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Researches real data, writes long-form posts with 15+ component types,
                generates images, and optimizes every page for SEO.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <Zap className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Agents</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Set agents to run daily, weekly, or monthly. They audit SEO, find trending
                topics, publish posts, and improve your results — on autopilot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          AGENTS SECTION — "Works While You Sleep"
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-6">
                Set it and forget it
              </p>
              <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug mb-5">
                Your blog grows<br />while you sleep
              </h2>
              <p className="text-[15px] text-[#666666] leading-relaxed mb-8">
                Set up agents that work on your blog every day. Research trends,
                publish posts, audit SEO issues — all on a schedule you define.
                Wake up to a better blog than you left.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: Calendar, label: "Daily publishing on autopilot" },
                  { icon: Search, label: "Weekly trend & keyword research" },
                  { icon: Shield, label: "Monthly SEO audits & fixes" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-[#444444] font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent card mockup */}
            <div className="bg-white border border-[#E0DED8] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#111111]">Content Publisher</div>
                    <div className="text-[12px] text-[#888888]">Runs daily at 9:00 AM</div>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</div>
              </div>
              <div className="bg-[#FAFAF8] rounded-lg p-4 mb-5">
                <p className="text-[13px] text-[#666666] leading-relaxed italic">
                  &ldquo;Research trending topics in my niche, pick the best one, write a full post with images, and publish it.&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#888888] border-t border-[#F0EEE8] pt-4">
                <span>Last run: Today, 9:00 AM</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Published &ldquo;5 Sprint Planning Tips&rdquo;
                </span>
              </div>
              {/* Second agent card */}
              <div className="mt-4 pt-4 border-t border-[#F0EEE8]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center">
                      <Search className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#111111]">SEO Auditor</div>
                      <div className="text-[12px] text-[#888888]">Runs weekly on Mondays</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</div>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#888888]">
                  <span>Last run: Monday, 8:00 AM</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Fixed 3 SEO issues
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          QUALITY — "Not AI Slop"
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            Content quality
          </p>
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-5">
            Research-backed content. Not AI slop.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[520px] mx-auto mb-16">
            Every post starts with real keyword data and multi-source research.
            Then it&apos;s built from structured components — not a wall of text.
          </p>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Typical AI */}
            <div className="border border-[#E0DED8] rounded-lg p-6 bg-[#FAFAF8]">
              <div className="text-[11px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-5">Typical AI blog post</div>
              <div className="space-y-3">
                <div className="h-3 bg-[#E0DED8] rounded w-full" />
                <div className="h-3 bg-[#E0DED8] rounded w-[95%]" />
                <div className="h-3 bg-[#E0DED8] rounded w-full" />
                <div className="h-3 bg-[#E0DED8] rounded w-[88%]" />
                <div className="h-5 my-3" />
                <div className="h-3 bg-[#E0DED8] rounded w-full" />
                <div className="h-3 bg-[#E0DED8] rounded w-[92%]" />
                <div className="h-3 bg-[#E0DED8] rounded w-full" />
                <div className="h-3 bg-[#E0DED8] rounded w-[97%]" />
                <div className="h-5 my-3" />
                <div className="h-3 bg-[#E0DED8] rounded w-full" />
                <div className="h-3 bg-[#E0DED8] rounded w-[90%]" />
              </div>
              <p className="text-[12px] text-[#999999] mt-5 italic">Wall of generic text. No structure. No data.</p>
            </div>

            {/* Vibeblogger */}
            <div className="border-2 border-[#111111] rounded-lg p-6 bg-white">
              <div className="text-[11px] font-medium text-[#111111] uppercase tracking-[0.1em] mb-5">Vibeblogger post</div>
              <div className="space-y-3">
                {/* Title */}
                <div className="h-4 bg-[#111111] rounded w-[70%]" />
                <div className="h-2.5 bg-[#E0DED8] rounded w-[40%]" />
                {/* Paragraph */}
                <div className="flex gap-1 mt-2">
                  <div className="h-2.5 bg-[#E0DED8] rounded flex-1" />
                  <div className="h-2.5 bg-[#E0DED8] rounded flex-1" />
                </div>
                {/* Callout */}
                <div className="bg-blue-50 border-l-2 border-blue-400 rounded-r p-2.5 mt-1">
                  <div className="h-2 bg-blue-200 rounded w-[80%]" />
                  <div className="h-2 bg-blue-200 rounded w-[60%] mt-1.5" />
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-[#F5F4F0] rounded p-2 text-center">
                    <div className="h-3 bg-[#111111] rounded w-[60%] mx-auto" />
                    <div className="h-2 bg-[#E0DED8] rounded w-[80%] mx-auto mt-1" />
                  </div>
                  <div className="bg-[#F5F4F0] rounded p-2 text-center">
                    <div className="h-3 bg-[#111111] rounded w-[50%] mx-auto" />
                    <div className="h-2 bg-[#E0DED8] rounded w-[70%] mx-auto mt-1" />
                  </div>
                  <div className="bg-[#F5F4F0] rounded p-2 text-center">
                    <div className="h-3 bg-[#111111] rounded w-[55%] mx-auto" />
                    <div className="h-2 bg-[#E0DED8] rounded w-[75%] mx-auto mt-1" />
                  </div>
                </div>
                {/* Image placeholder */}
                <div className="bg-[#F0EEE8] rounded h-14 flex items-center justify-center">
                  <Image className="w-4 h-4 text-[#BBBBBB]" />
                </div>
                {/* CTA */}
                <div className="bg-[#111111] rounded-full h-7 w-[45%]" />
              </div>
              <p className="text-[12px] text-[#666666] mt-5 italic">Rich components. Real data. SEO-optimized.</p>
            </div>
          </div>

          {/* Component bento grid */}
          <h3 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-8">
            15+ content components
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: "Rich text" },
              { icon: BarChart3, label: "Charts" },
              { icon: Table, label: "Comparison tables" },
              { icon: Image, label: "AI images" },
              { icon: Quote, label: "Expert quotes" },
              { icon: Target, label: "Call-to-actions" },
              { icon: Code2, label: "Code blocks" },
              { icon: Clock, label: "Timelines" },
            ].map((comp) => (
              <div key={comp.label} className="flex items-center gap-2.5 bg-[#FAFAF8] border border-[#E0DED8] rounded-lg px-4 py-3">
                <comp.icon className="w-4 h-4 text-[#888888] shrink-0" />
                <span className="text-[13px] text-[#444444]">{comp.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          HEADLESS API — Developer Section
          ============================================ */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            Built for developers
          </p>
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-5">
            Your blog. Your frontend. Our engine.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[480px] mx-auto mb-14">
            Fetch posts via API. Build with Next.js, Astro, Remix —
            whatever you want. Structured JSON, ready to render.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Code snippet */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2A2A2A]">
                <span className="text-[12px] text-[#555555] font-mono">fetch.ts</span>
              </div>
              <pre className="p-5 text-[13px] leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-[#CC99FF]">const</span>{" "}
                  <span className="text-[#88CCFF]">res</span>{" "}
                  <span className="text-[#999999]">=</span>{" "}
                  <span className="text-[#CC99FF]">await</span>{" "}
                  <span className="text-[#FFCC66]">fetch</span>
                  <span className="text-[#999999]">(</span>
                  {"\n"}
                  {"  "}
                  <span className="text-[#99CC99]">&apos;https://vibeblogger.io/api/v1/posts&apos;</span>
                  <span className="text-[#999999]">,</span>
                  {"\n"}
                  {"  "}
                  <span className="text-[#999999]">{"{"}</span>
                  {"\n"}
                  {"    "}
                  <span className="text-[#88CCFF]">headers</span>
                  <span className="text-[#999999]">:</span>{" "}
                  <span className="text-[#999999]">{"{"}</span>
                  {"\n"}
                  {"      "}
                  <span className="text-[#99CC99]">&apos;Authorization&apos;</span>
                  <span className="text-[#999999]">:</span>{" "}
                  <span className="text-[#99CC99]">&apos;Bearer vb_live_...&apos;</span>
                  {"\n"}
                  {"    "}
                  <span className="text-[#999999]">{"}"}</span>
                  {"\n"}
                  {"  "}
                  <span className="text-[#999999]">{"}"}</span>
                  {"\n"}
                  <span className="text-[#999999]">)</span>
                  {"\n"}
                  {"\n"}
                  <span className="text-[#CC99FF]">const</span>{" "}
                  <span className="text-[#999999]">{"{"}</span>{" "}
                  <span className="text-[#88CCFF]">posts</span>{" "}
                  <span className="text-[#999999]">{"}"}</span>{" "}
                  <span className="text-[#999999]">=</span>{" "}
                  <span className="text-[#CC99FF]">await</span>{" "}
                  <span className="text-[#88CCFF]">res</span>
                  <span className="text-[#999999]">.</span>
                  <span className="text-[#FFCC66]">json</span>
                  <span className="text-[#999999]">()</span>
                  {"\n"}
                  {"\n"}
                  <span className="text-[#555555]">{"// => SEO-optimized posts with"}</span>
                  {"\n"}
                  <span className="text-[#555555]">{"//    structured components, images,"}</span>
                  {"\n"}
                  <span className="text-[#555555]">{"//    and full metadata"}</span>
                </code>
              </pre>
            </div>

            {/* What you get */}
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
                <div className="text-[11px] text-[#555555] uppercase tracking-[0.1em] mb-3">What you get back</div>
                <div className="space-y-3">
                  {[
                    "Full post content with structured components",
                    "SEO metadata (title, description, Open Graph)",
                    "AI-generated images with alt text",
                    "Internal links mapped across posts",
                    "Schema.org markup (Article, HowTo, FAQ)",
                    "Pagination & filtering built in",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-[13px] text-[#CCCCCC]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "Astro", "Remix", "Nuxt", "SvelteKit", "HTML"].map((fw) => (
                  <span key={fw} className="text-[12px] text-[#888888] border border-[#333333] rounded-full px-3 py-1">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          COMPARISON TABLE
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-5">
            How it compares
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[480px] mx-auto mb-14">
            One tool that replaces your entire content stack.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#111111]">
                  <th className="text-left py-4 pr-4 text-[12px] font-medium text-[#888888] uppercase tracking-[0.1em]" />
                  <th className="text-center py-4 px-3 text-[12px] font-medium text-[#888888] uppercase tracking-[0.1em]">Freelancer</th>
                  <th className="text-center py-4 px-3 text-[12px] font-medium text-[#888888] uppercase tracking-[0.1em]">ChatGPT</th>
                  <th className="text-center py-4 px-3 text-[12px] font-medium text-[#888888] uppercase tracking-[0.1em]">Surfer / Jasper</th>
                  <th className="text-center py-4 px-3 text-[12px] font-medium text-[#111111] uppercase tracking-[0.1em] bg-[#F0EEE8] rounded-t-lg">Vibeblogger</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {[
                  { label: "Cost per post", vals: ["$300–500", "Free*", "$5–15", "~$5"] },
                  { label: "SEO research", vals: ["Maybe", "No", "Partial", "Full"] },
                  { label: "AI images", vals: ["No", "No", "No", "Yes"] },
                  { label: "Auto-publish", vals: ["No", "No", "No", "Yes"] },
                  { label: "Headless API", vals: ["No", "No", "No", "Yes"] },
                  { label: "Autonomous agents", vals: ["No", "No", "No", "Yes"] },
                  { label: "Time per post", vals: ["3–7 days", "2–3 hours", "30–60 min", "~2 min"] },
                ].map((row, i) => (
                  <tr key={row.label} className={i < 6 ? "border-b border-[#E0DED8]" : ""}>
                    <td className="py-3.5 pr-4 text-[#444444] font-medium">{row.label}</td>
                    {row.vals.map((val, j) => (
                      <td key={j} className={`text-center py-3.5 px-3 ${j === 3 ? "bg-[#F0EEE8] font-medium text-[#111111]" : "text-[#666666]"} ${j === 3 && i === 6 ? "rounded-b-lg" : ""}`}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-[#999999] mt-4">
            * Plus hours of your time prompting, formatting, researching, and publishing.
          </p>
        </div>
      </section>

      {/* ============================================
          FEATURES GRID
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
            Everything included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-10">
            {[
              { icon: Search, title: "SEO keyword research", desc: "Real search volume, difficulty, and competitor data. Not guesswork." },
              { icon: PenTool, title: "Long-form AI writing", desc: "2,000+ word articles that read naturally. Your brand voice, every time." },
              { icon: Image, title: "AI-generated images", desc: "Custom images generated to match your content and brand style." },
              { icon: Code2, title: "Headless API", desc: "Structured JSON. Build your frontend however you want." },
              { icon: Zap, title: "Autonomous agents", desc: "Set agents to work daily — publishing, auditing, and improving." },
              { icon: TrendingUp, title: "Competitor analysis", desc: "See what keywords competitors rank for. Then outrank them." },
              { icon: BarChart3, title: "SEO audits", desc: "Find and fix issues across your blog. Automatically." },
              { icon: Calendar, title: "Auto-publish scheduling", desc: "Queue posts weeks ahead. They publish on time, every time." },
              { icon: Users, title: "Brand voice settings", desc: "Set your tone, audience, and guidelines once. Every post follows them." },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="w-9 h-9 bg-[#F5F4F0] rounded-lg flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-[#111111]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[#111111] mb-1.5">{feature.title}</h3>
                  <p className="text-[13px] text-[#666666] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          PRICING PREVIEW
          ============================================ */}
      <section className="bg-[#FAFAF8]">
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-20 sm:py-24 text-center">
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug mb-4">
            Less than a single freelance blog post
          </h2>
          <p className="text-[15px] text-[#666666] leading-relaxed mb-2">
            A freelance writer charges $300–500 per post.
          </p>
          <p className="text-[15px] text-[#666666] leading-relaxed mb-10">
            Vibeblogger gives you an entire AI content team for <span className="text-[#111111] font-semibold">$49/month</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <SignUpButton mode="modal">
              <button className="text-[15px] font-semibold text-white bg-[#111111] px-9 py-3.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer inline-flex items-center justify-center gap-2">
                Start with 100 free posts
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignUpButton>
            <Link
              href="/pricing"
              className="text-[15px] font-medium text-[#111111] border border-[#CCCCCC] px-9 py-3.5 rounded-full hover:border-[#999999] transition-colors text-center"
            >
              See full pricing
            </Link>
          </div>
          <p className="text-[13px] text-[#999999]">No credit card required</p>
        </div>
      </section>

      {/* ============================================
          FAQ
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
            Common questions
          </h2>
          <div className="space-y-10">
            {[
              {
                q: "Will Google penalize AI content?",
                a: "Google doesn't penalize AI content — it penalizes low-quality content. Every Vibeblogger post is backed by real keyword data and multi-source research. 86% of top-ranking pages already contain AI-assisted content."
              },
              {
                q: "Does it actually sound human?",
                a: "Every post follows your brand voice settings and uses 15+ content components — callouts, quotes, tables, CTAs. No walls of text. No \"in today's fast-paced world.\""
              },
              {
                q: "What if I want to edit posts after?",
                a: "Full control. Edit any component in the dashboard, or just tell the agent in chat — \"update the intro on my latest post\" — and it handles it."
              },
              {
                q: "Can I use this with my existing site?",
                a: "Yes. The headless API delivers structured JSON. Use it with Next.js, Astro, Remix, WordPress, or anything else. Your design, our content engine."
              },
              {
                q: "What's included in the free plan?",
                a: "5 blog posts, full SEO research, agent chat, and API access. No credit card required. Upgrade to Pro when you're ready for agents, auto-publish, and images."
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
        <div className="max-w-[600px] mx-auto px-6 sm:px-8 py-24 sm:py-28 text-center">
          <h2 className="font-lora text-[32px] sm:text-[40px] font-normal tracking-tight mb-4">
            Your competitors are blogging.<br />Are you?
          </h2>
          <p className="text-base text-[#999999] mb-9">
            100 free posts. 5-minute setup. No credit card.
          </p>
          <Link
            href="/start"
            className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            Get your 100 free posts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="bg-[#FAFAF8] border-t border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="font-lora text-lg font-bold tracking-tight text-[#111111]">
              Vibeblogger
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-[13px] text-[#888888] hover:text-[#111111] transition-colors">About</Link>
              <Link href="/blog" className="text-[13px] text-[#888888] hover:text-[#111111] transition-colors">Blog</Link>
              <Link href="/pricing" className="text-[13px] text-[#888888] hover:text-[#111111] transition-colors">Pricing</Link>
              <Link href="/docs" className="text-[13px] text-[#888888] hover:text-[#111111] transition-colors">Docs</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#E0DED8] text-center">
            <p className="text-[12px] text-[#AAAAAA]">
              vibeblogger.io — This blog is powered by Vibeblogger
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
