import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { generateHomePageSchema } from '@/utils/schema'
import { Check, ArrowRight, Zap, Search, PenTool, Image, Calendar, Code2, BarChart3, MessageSquare, TrendingUp, Shield, Users } from 'lucide-react'
import LiveProofBar from '@/components/LiveProofBar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://vibeblogger.io/',
  },
}

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
            Start your blog
          </Link>
        </div>
      </nav>

      {/* ============================================
          HERO — Dark
          ============================================ */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-28">
          <div className="max-w-[820px] mx-auto text-center">
            <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
              For startups that need to be found
            </p>
            <h1 className="font-lora text-[36px] sm:text-[60px] font-normal leading-[1.12] tracking-[-0.02em] mb-7">
              An AI-powered blog engine for startups.{' '}<br />
              $49/month.
            </h1>
            <p className="text-[17px] sm:text-lg text-[#999999] leading-[1.7] max-w-[650px] mx-auto mb-10">
              Work with AI agents to create deep, meaningful blog posts that fit
              your brand, connect with your users, and make your product easier
              to find across Google and AI search.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/start"
                className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                Start your blog
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="https://calendly.com/hello-vibeblogger/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] font-medium text-white border border-[#444444] px-9 py-3.5 rounded-full hover:border-[#666666] transition-colors text-center"
              >
                Book a live demo
              </Link>
            </div>
            <p className="text-[13px] text-[#666666]">
              100 starter posts included. Then $49/month.
            </p>
          </div>

          {/* Hero visual — Demo video */}
          <div className="max-w-[900px] mx-auto mt-16">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-[#2A2A2A]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="https://ik.imagekit.io/1eqqea9acu/vibebloggerhero.mp4" type="video/mp4" />
              </video>
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
            Your app needs to rank. You don&apos;t have time to become the blog team.
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[560px] mx-auto mb-16">
            A proper blog has to live on your site, fit your brand, answer real
            questions, and keep publishing while you are still building the product.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-7">
              <div className="text-[13px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-4">Hiring a writer</div>
              <ul className="space-y-2.5">
                {["$300-500+ per post", "You still manage strategy", "Hard to explain your product", "Slow edits and publishing"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[#CC4444] mt-0.5 text-sm shrink-0">✕</span>
                    <span className="text-sm text-[#666666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#E0DED8] rounded-lg p-7">
              <div className="text-[13px] font-medium text-[#CC4444] uppercase tracking-[0.1em] mb-4">Using generic AI</div>
              <ul className="space-y-2.5">
                {["Generic AI slop", "No brand memory", "No search strategy", "You still copy, paste, format"].map((item) => (
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
                {["Research eats weekends", "Writing competes with product", "Images and SEO still missing", "Publishing never compounds"].map((item) => (
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
            A blog that learns your brand and publishes to your site
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[560px] mx-auto mb-16">
            Vibeblogger gives startups AI agents that research your market, write
            useful posts in your voice, create images, and deliver everything
            through your own website.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <MessageSquare className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Strategist</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Turns your product, audience, and competitors into topics built
                around search demand and customer intent.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <PenTool className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Creator</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Writes researched, structured articles that explain your point of
                view instead of sounding like everyone else.
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F4F0] rounded-full mb-5">
                <Zap className="w-5 h-5 text-[#111111]" />
              </div>
              <h3 className="font-lora text-[20px] font-normal mb-3">Agents</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Queue posts, create images, audit SEO, and refresh content so your
                blog keeps improving without a content team.
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
                Founder-led, agent-run
              </p>
              <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug mb-5">
                You set the tone.<br />Agents handle the workflow.
              </h2>
              <p className="text-[15px] text-[#666666] leading-relaxed mb-8">
                Give Vibeblogger your niche, brand voice, product context, and
                topics. Agents turn that into blog posts that live on your site
                and support discovery in Google and AI search.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: Calendar, label: "Brand-aware publishing on your schedule" },
                  { icon: Search, label: "Weekly keyword and customer-question research" },
                  { icon: Shield, label: "SEO audits, internal links, and refreshes" },
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
                    <div className="text-sm font-medium text-[#111111]">Brand Blog Agent</div>
                    <div className="text-[12px] text-[#888888]">Runs on your schedule</div>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</div>
              </div>
              <div className="bg-[#FAFAF8] rounded-lg p-4 mb-5">
                <p className="text-[13px] text-[#666666] leading-relaxed italic">
                  &ldquo;Research my market, write an on-brand post for founders building with AI, create images, and queue it for review.&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#888888] border-t border-[#F0EEE8] pt-4">
                <span>Last run: Today, 9:00 AM</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  Queued &ldquo;How to Get Your First Users&rdquo;
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
                      <div className="text-sm font-medium text-[#111111]">Search Visibility Agent</div>
                      <div className="text-[12px] text-[#888888]">Runs weekly on Mondays</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</div>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#888888]">
                  <span>Last run: Monday, 8:00 AM</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Found 3 refresh opportunities
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          QUALITY — Content Showcase
          ============================================ */}
      <section className="bg-white border-y border-[#E0DED8]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
            Content quality
          </p>
          <h2 className="font-lora text-[28px] sm:text-[36px] font-normal leading-snug text-center mb-5">
            Deep, structured content built to be found
          </h2>
          <p className="text-[15px] text-[#666666] text-center max-w-[560px] mx-auto mb-16">
            Every post can include data tables, callouts, charts, images, FAQs,
            and more. Real research, your voice, and a page that belongs on your website.
          </p>

          <div className="rounded-xl overflow-hidden shadow-lg border border-[#E0DED8]">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            >
              <source src="https://ik.imagekit.io/1eqqea9acu/Area.mp4" type="video/mp4" />
            </video>
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
            Your blog. Your website. Your brand.
          </h2>
          <p className="text-[15px] text-[#888888] text-center max-w-[540px] mx-auto mb-14">
            Fetch posts via API. Build with Next.js, Astro, Remix, or whatever
            you use. The content lives on your product site, not a generic blog subdomain.
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
                  <span className="text-[#555555]">{"// => on-brand posts with"}</span>
                  {"\n"}
                  <span className="text-[#555555]">{"//    structured components, images,"}</span>
                  {"\n"}
                  <span className="text-[#555555]">{"//    links, metadata, and assets"}</span>
                </code>
              </pre>
            </div>

            {/* What you get */}
            <div className="space-y-4">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
                <div className="text-[11px] text-[#555555] uppercase tracking-[0.1em] mb-3">What you get back</div>
                <div className="space-y-3">
                  {[
                    "Structured article components",
                    "SEO metadata and schema-friendly content",
                    "AI-generated images with alt text",
                    "Internal links across your library",
                    "Brand voice and audience context",
                    "Pagination and filtering built in",
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
          <p className="text-[15px] text-[#666666] text-center max-w-[560px] mx-auto mb-14">
            Built for startups that need a real blog without hiring a writer or
            managing a content stack.
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
                  { label: "Cost per post", vals: ["$300-500+", "Free*", "$5-15", "~$5"] },
                  { label: "Brand fit", vals: ["Takes handoff", "Weak", "Templates", "Brand settings"] },
                  { label: "SEO research", vals: ["Maybe", "No", "Partial", "Full"] },
                  { label: "Lives on your site", vals: ["Manual", "No", "Usually no", "Headless API"] },
                  { label: "AI search readiness", vals: ["Maybe", "No", "Partial", "Structured content"] },
                  { label: "Autonomous agents", vals: ["No", "No", "No", "Yes"] },
                  { label: "Time per post", vals: ["3-7 days", "2-3 hours", "30-60 min", "~2 min"] },
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
              { icon: Search, title: "SEO keyword research", desc: "Find search demand, customer questions, and competitor gaps before each post." },
              { icon: PenTool, title: "Long-form AI writing", desc: "Thoughtful articles written from your brand settings, not generic prompts." },
              { icon: Image, title: "AI-generated images", desc: "Custom images generated to match your content and brand style." },
              { icon: Code2, title: "Headless API", desc: "Publish directly into your existing app site with structured JSON." },
              { icon: Zap, title: "Autonomous agents", desc: "Run research, publishing, SEO audits, and refresh workflows on a cadence." },
              { icon: TrendingUp, title: "Competitor analysis", desc: "See what similar products rank for, then build better posts." },
              { icon: BarChart3, title: "SEO audits", desc: "Improve metadata, internal links, and search structure after posts go live." },
              { icon: Calendar, title: "Auto-publish scheduling", desc: "Queue content for review or publish on your schedule." },
              { icon: Users, title: "Brand voice settings", desc: "Set tone, audience, positioning, and rules once. Every post follows them." },
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
            A startup blog for less than one freelance article
          </h2>
          <p className="text-[15px] text-[#666666] leading-relaxed mb-2">
            A freelance writer can cost $300-500 per post.
          </p>
          <p className="text-[15px] text-[#666666] leading-relaxed mb-10">
            Vibeblogger gives you research, writing, images, publishing, and agents for <span className="text-[#111111] font-semibold">$49/month</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <SignUpButton mode="modal">
              <button className="text-[15px] font-semibold text-white bg-[#111111] px-9 py-3.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer inline-flex items-center justify-center gap-2">
                Start your blog
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
          <p className="text-[13px] text-[#999999]">100 starter posts included. Cancel anytime.</p>
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
                q: "Will this help with Google and AI search?",
                a: "No tool can guarantee rankings. Vibeblogger creates researched, structured, crawlable articles on your own site, with metadata, internal links, and content that helps search engines and answer engines understand what your product does."
              },
              {
                q: "Does it actually sound human?",
                a: "Every post follows your brand voice settings and uses 15+ content components like callouts, quotes, tables, and CTAs. No walls of text. No \"in today's fast-paced world.\""
              },
              {
                q: "What if I want to edit posts after?",
                a: "Full control. Edit any component in the dashboard, or just tell the agent in chat — \"update the intro on my latest post\" — and it handles it."
              },
              {
                q: "Can I use this with my existing site?",
                a: "Yes. The headless API delivers structured JSON. Use it with Next.js, Astro, Remix, WordPress, or anything else. Your design, your website, Vibeblogger content."
              },
              {
                q: "What's included in the starter offer?",
                a: "You get 100 starter posts so you can build out a real blog before paying for a writer or committing to a content team."
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
            Give your startup the blog it keeps putting off.
          </h2>
          <p className="text-base text-[#999999] mb-9">
            Deep, on-brand posts on your site. 100 starter posts included.
          </p>
          <Link
            href="/start"
            className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            Start your blog
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
              vibeblogger.io — AI-powered blog engine for startups
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
