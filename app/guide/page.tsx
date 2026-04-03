import Link from 'next/link'
import { SignUpButton } from '@clerk/nextjs'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Setup Guide — 5 Steps to a Live Blog",
  description: "Step-by-step guide to setting up your Vibeblogger-powered blog. From account creation to queuing your first 40 posts.",
  alternates: {
    canonical: "https://vibeblogger.io/guide",
  },
  openGraph: {
    title: "Setup Guide | Vibeblogger",
    description: "Step-by-step guide to setting up your Vibeblogger-powered blog.",
    url: "https://vibeblogger.io/guide",
    siteName: "Vibeblogger",
  },
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-6 sm:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
            Vibeblogger
          </Link>
          <span className="text-[#CCCCCC]">/</span>
          <span className="text-[#666666] text-sm">Setup Guide</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link
            href="/start"
            className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors"
          >
            Get 100 Free Posts
          </Link>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      <div className="max-w-[800px] mx-auto px-6 sm:px-8 py-16">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-6">
            Setup Guide
          </p>
          <h1 className="font-lora text-[36px] sm:text-[48px] font-normal leading-[1.15] tracking-[-0.02em] mb-5">
            5 steps to a live blog.
          </h1>
          <p className="text-lg text-[#666666] leading-[1.7] max-w-[520px]">
            Create your account, run one prompt, submit to Google, and start
            publishing. Most people are done in under 10 minutes.
          </p>
        </div>

        {/* Progress overview */}
        <div className="bg-white border border-[#E0DED8] rounded-xl p-6 mb-16">
          <h3 className="text-sm font-medium text-[#888888] uppercase tracking-[0.1em] mb-5">What you&apos;ll set up</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { step: "1", label: "Account & brand", time: "3 min" },
              { step: "2", label: "Blog & SEO setup", time: "2 min" },
              { step: "3", label: "Google indexing", time: "5 min" },
              { step: "4", label: "Content strategy", time: "5 min" },
              { step: "5", label: "Agents", time: "1 min" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p className="text-[13px] text-[#AAAAAA] mb-1">Step {item.step}</p>
                <p className="text-sm font-medium text-[#111111]">{item.label}</p>
                <p className="text-[12px] text-[#888888] mt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            STEP 1 — Account, Brand Voice & API Key
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              1
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Create your account & set your brand voice</h2>
              <p className="text-[13px] text-[#888888]">3 minutes</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            {/* Video placeholder */}
            <div className="bg-[#111111] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-sm text-[#555555]">Video coming soon</p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <ol className="space-y-5">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">a.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed">
                      Go to{' '}
                      <Link href="/start" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                        vibeblogger.io/start
                      </Link>
                      {' '}and sign up. You&apos;ll get <strong>100 free credits</strong>.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">b.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed mb-3">
                      Go to the <strong>Brand</strong> tab and fill in your brand details. This is how the AI learns to write like you:
                    </p>
                    <div className="space-y-2">
                      {[
                        { field: "Blog/Brand Name", example: 'e.g., "The SaaS Playbook"' },
                        { field: "Blog Description", example: "What your blog is about in 1-2 sentences" },
                        { field: "Industry/Niche", example: 'e.g., "B2B SaaS", "Fitness tech"' },
                        { field: "Target Audience", example: "Who you're writing for — be specific" },
                        { field: "Tone", example: "Professional, casual, technical, etc." },
                        { field: "Topics We Cover", example: "Your main content themes" },
                        { field: "Things to Avoid", example: "Competitors, topics, or phrases to skip" },
                      ].map((item) => (
                        <div key={item.field} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-[#CCCCCC] mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[13px] font-medium text-[#111111]">{item.field}</span>
                            <span className="text-[13px] text-[#888888]"> — {item.example}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">c.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed">
                      Go to{' '}
                      <Link href="/blog/admin/api-keys" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                        API Keys
                      </Link>
                      {' '}in the nav, click <strong>&quot;Generate Key&quot;</strong>, and copy it. Add it to your project&apos;s <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">.env.local</code>:
                    </p>
                    <div className="mt-3 bg-[#111111] rounded-lg p-4">
                      <code className="text-[13px] text-[#CCCCCC] font-mono">VIBEBLOGGER_API_KEY=vb_live_your_key_here</code>
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Tip:</strong> The more detail you give in brand voice, the better your content will be. Paste 2-3 paragraphs of your best writing into the &quot;Example Content&quot; field so the AI can match your style.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 2 — Run the Setup Prompt
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Run the setup prompt</h2>
              <p className="text-[13px] text-[#888888]">2 minutes</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            {/* Video placeholder */}
            <div className="bg-[#111111] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-sm text-[#555555]">Video coming soon</p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                One prompt does everything. Go to the{' '}
                <Link href="/start#how-it-works" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                  /start page
                </Link>
                {' '}and click <strong>&quot;Copy setup prompt&quot;</strong> in Step 3. Paste it into your coding agent (Cursor, Claude Code, etc.).
              </p>

              <p className="text-sm font-medium text-[#111111] mb-3">The prompt will:</p>

              <div className="space-y-4">
                <div>
                  <p className="text-[13px] font-semibold text-[#888888] uppercase tracking-[0.1em] mb-2">Audit & fix your existing SEO</p>
                  <ul className="space-y-1.5">
                    {[
                      "Add proper meta titles, descriptions, and Open Graph tags to every existing page",
                      "Fix heading hierarchy, add alt text to images, use semantic HTML",
                      "Create or update your sitemap and robots.txt",
                      "Add JSON-LD structured data to your homepage",
                      "Add canonical URLs to prevent duplicate content",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-[13px] text-[#444444]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[#E0DED8] pt-4">
                  <p className="text-[13px] font-semibold text-[#888888] uppercase tracking-[0.1em] mb-2">Create your blog</p>
                  <ul className="space-y-1.5">
                    {[
                      "Blog listing page and individual post pages",
                      "Renderers for all 16 content component types",
                      "SEO metadata, JSON-LD structured data, and breadcrumbs on every page",
                      "Dynamic sitemap and RSS feed",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-[13px] text-[#444444]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#F0F8FF] border border-[#C8DFF0] rounded-lg p-4">
              <p className="text-sm text-[#2A6496]">
                <strong>Don&apos;t want to do this yourself?</strong>{' '}
                <a href="https://calendly.com/hello-vibeblogger/30min" target="_blank" rel="noopener noreferrer" className="text-[#2A6496] underline underline-offset-2 hover:text-[#1A4A6A]">Book a free setup call</a> and we&apos;ll screenshare and do it with you.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 3 — Google Search Console
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              3
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Submit to Google Search Console</h2>
              <p className="text-[13px] text-[#888888]">5 minutes — don&apos;t skip this</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            {/* Video placeholder */}
            <div className="bg-[#111111] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-sm text-[#555555]">Video coming soon</p>
            </div>

            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Why this matters:</strong> Without Search Console, Google may take weeks to discover your blog. With it, pages can be indexed in 2-7 days.
              </p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">a. Add your site</h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">1.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Go to{' '}
                    <span className="text-[#111111] font-medium">search.google.com/search-console</span>
                    {' '}and sign in.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">2.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Click <strong>&quot;Add property&quot;</strong> → <strong>&quot;URL prefix&quot;</strong> → enter your domain.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">3.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed mb-2">
                      <strong>Verify ownership</strong> — pick whichever is easiest for you:
                    </p>
                    <div className="space-y-2">
                      {[
                        { method: "HTML tag", desc: 'Copy the meta tag into your root layout.tsx metadata.' },
                        { method: "DNS record", desc: "Add a TXT record to your domain's DNS settings." },
                        { method: "HTML file", desc: "Download the file and put it in your /public folder." },
                      ].map((v) => (
                        <div key={v.method} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-3">
                          <p className="text-[13px] font-medium text-[#111111]">{v.method}</p>
                          <p className="text-[12px] text-[#888888]">{v.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">b. Submit your sitemap</h4>
              <ol className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">1.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    In Search Console, go to <strong>Sitemaps</strong> in the left sidebar.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">2.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Enter <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">blog/sitemap.xml</code> and click <strong>Submit</strong>.
                  </p>
                </li>
              </ol>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">c. Request indexing for key pages</h4>
              <p className="text-sm text-[#444444] leading-relaxed">
                Paste your blog URL into the <strong>URL Inspection</strong> bar and click <strong>&quot;Request Indexing&quot;</strong>. Do this for the blog listing page and your first few posts. Google typically indexes them within <strong>2-7 days</strong>. The sitemap handles new posts automatically going forward.
              </p>
            </div>

            <div className="bg-[#F0FFF0] border border-[#C0E8C0] rounded-lg p-4">
              <p className="text-sm text-[#2A6B2A]">
                <strong>What to expect:</strong> Indexing in 2-7 days. Rankings in 2-8 weeks. Meaningful organic traffic over 2-6 months. Consistent publishing accelerates this significantly.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 4 — Strategise & Queue Content
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              4
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Strategise & queue your content</h2>
              <p className="text-[13px] text-[#888888]">5 minutes</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            {/* Video placeholder */}
            <div className="bg-[#111111] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-sm text-[#555555]">Video coming soon</p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Open the <strong>Chat</strong> panel on the right side of your dashboard. This is your AI blog strategist. Have a conversation about your SEO direction — it knows your niche, your competitors, and where the opportunities are.
              </p>

              <p className="text-sm font-medium text-[#111111] mb-3">Example prompts to get started:</p>

              <div className="space-y-2.5">
                {[
                  "Research my niche and find the best keyword opportunities. What should we focus on first?",
                  "Analyze my top 3 competitors and find content gaps I should fill",
                  "Queue 40 blog posts targeting a mix of high-volume and long-tail keywords",
                  "Create a content calendar for the next 3 months",
                ].map((prompt) => (
                  <div key={prompt} className="bg-[#1A1A1A] rounded-lg p-3.5">
                    <p className="text-[13px] text-[#88CCFF] font-mono">&quot;{prompt}&quot;</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#666666] leading-relaxed mt-4">
                The AI researches keywords, analyses search volume and difficulty, and adds topics directly to your queue. Posts start generating immediately.
              </p>
            </div>

            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Tip:</strong> Don&apos;t just queue topics — have a real conversation about your strategy. Ask it which keywords are realistic to rank for, what your competitors are missing, and what order to publish in. The better your strategy, the faster you&apos;ll see results.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 5 — Enable Agents
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              5
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Enable your agents</h2>
              <p className="text-[13px] text-[#888888]">1 minute</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            {/* Video placeholder */}
            <div className="bg-[#111111] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-sm text-[#555555]">Video coming soon</p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Go to the <strong>Agents</strong> tab in your dashboard. Enable the agents that will keep your blog growing on autopilot:
              </p>

              <div className="space-y-3">
                {[
                  {
                    name: "Weekly Backlink Monitor",
                    desc: "Finds backlink opportunities and tracks your domain authority growth",
                    recommended: true,
                  },
                  {
                    name: "Weekly Topic Research",
                    desc: "Finds trending topics in your niche and keeps your queue full",
                    recommended: true,
                  },
                  {
                    name: "SEO Audit",
                    desc: "Reviews your posts for SEO issues and suggests improvements",
                    recommended: false,
                  },
                ].map((template) => (
                  <div key={template.name} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{template.name}</p>
                      <p className="text-[13px] text-[#888888]">{template.desc}</p>
                    </div>
                    {template.recommended && (
                      <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full shrink-0 ml-4">
                        Recommended
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#666666] leading-relaxed mt-4">
                Click on a template, choose your schedule, and enable it. The agents run automatically — no input needed from you.
              </p>
            </div>
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-14" />

        {/* ============================================
            You're done
            ============================================ */}
        <section className="mb-16">
          <div className="bg-[#111111] text-white rounded-xl p-8 sm:p-10 text-center">
            <h2 className="font-lora text-[28px] sm:text-[32px] font-normal mb-4">
              You&apos;re done.
            </h2>
            <p className="text-[15px] text-[#999999] leading-[1.7] max-w-[480px] mx-auto mb-8">
              Your site&apos;s SEO is cleaned up. Your blog is live. Google is indexing your content.
              Your agents are publishing new posts and monitoring your backlinks automatically.
            </p>
            <Link
              href="/blog/admin"
              className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors inline-flex items-center gap-2"
            >
              Go to your dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ============================================
            What's next
            ============================================ */}
        <section className="mb-16">
          <h2 className="font-lora text-[22px] font-normal mb-6">What to do next</h2>
          <div className="space-y-3">
            {[
              {
                title: "Review your first posts",
                desc: "Check the quality after a few posts generate. Tell the strategist to adjust tone or focus if needed.",
              },
              {
                title: "Monitor Search Console",
                desc: "Check back in 1-2 weeks. You should see pages being indexed and impressions starting to appear.",
              },
              {
                title: "Set up analytics",
                desc: "Add Google Analytics, Plausible, or PostHog to track your traffic growth. Search Console also shows organic performance.",
              },
              {
                title: "Keep publishing",
                desc: "SEO rewards consistency. With your agents running, your blog grows automatically — just check in occasionally to review.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#E0DED8] rounded-lg p-5">
                <p className="text-sm font-medium text-[#111111] mb-1">{item.title}</p>
                <p className="text-[13px] text-[#888888] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Help */}
        <section className="bg-white border border-[#E0DED8] rounded-lg p-6 mb-16">
          <h3 className="font-lora text-lg font-normal mb-2">Need help?</h3>
          <p className="text-sm text-[#666666]">
            Stuck on any step?{' '}
            <a href="https://calendly.com/hello-vibeblogger/30min" target="_blank" rel="noopener noreferrer" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">Book a free setup call</a> and we&apos;ll get you running. Or email{' '}
            <a href="mailto:support@vibeblogger.io" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
              support@vibeblogger.io
            </a>.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mx-8 border-b border-[#E0DED8]" />
      <footer className="px-8 py-8 text-center">
        <p className="text-[13px] text-[#AAAAAA]">vibeblogger.io</p>
      </footer>
    </div>
  )
}
