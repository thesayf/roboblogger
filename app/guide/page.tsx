import Link from 'next/link'
import { SignUpButton } from '@clerk/nextjs'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Setup Guide — From Zero to Live Blog in 5 Minutes",
  description: "Step-by-step guide to setting up your Vibeblogger-powered blog. From account creation to Google Search Console submission.",
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
            Zero to live blog.<br />8 steps.
          </h1>
          <p className="text-lg text-[#666666] leading-[1.7] max-w-[520px]">
            Follow this guide to set up your blog, start generating content,
            and get indexed by Google. Most people finish in under 10 minutes.
          </p>
        </div>

        {/* Progress overview */}
        <div className="bg-white border border-[#E0DED8] rounded-xl p-6 mb-16">
          <h3 className="text-sm font-medium text-[#888888] uppercase tracking-[0.1em] mb-5">What you&apos;ll set up</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { step: "1-2", label: "Account & brand", time: "2 min" },
              { step: "3-4", label: "API & blog pages", time: "2 min" },
              { step: "5-6", label: "Agents & content", time: "2 min" },
              { step: "7-8", label: "Google & analytics", time: "5 min" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p className="text-[13px] text-[#AAAAAA] mb-1">Steps {item.step}</p>
                <p className="text-sm font-medium text-[#111111]">{item.label}</p>
                <p className="text-[12px] text-[#888888] mt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            STEP 1
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              1
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Create your account</h2>
              <p className="text-[13px] text-[#888888]">1 minute</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">a.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed">
                      Go to{' '}
                      <Link href="/start" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                        vibeblogger.io/start
                      </Link>
                      {' '}and click <strong>&quot;Get 100 free posts.&quot;</strong>
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">b.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Sign up with your email or Google account. No credit card required.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">c.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    You&apos;ll land on your dashboard. You now have <strong>100 free credits</strong> and a 30-day trial.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 2
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              2
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Set your brand voice</h2>
              <p className="text-[13px] text-[#888888]">1 minute</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                This is how your AI learns to write like you. Go to the <strong>Settings</strong> tab in your dashboard and fill in:
              </p>
              <div className="space-y-3">
                {[
                  { field: "Blog/Brand Name", example: 'e.g., "The SaaS Playbook"' },
                  { field: "Blog Description", example: "What your blog is about in 1-2 sentences" },
                  { field: "Industry/Niche", example: 'e.g., "B2B SaaS", "Fitness tech", "Personal finance"' },
                  { field: "Target Audience", example: "Who you're writing for — be specific" },
                  { field: "Tone", example: "Professional, casual, technical, conversational, etc." },
                  { field: "Topics We Cover", example: "Your main content themes" },
                  { field: "Things to Avoid", example: "Competitors, topics, or phrases to skip" },
                ].map((item) => (
                  <div key={item.field} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#CCCCCC] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-[#111111]">{item.field}</span>
                      <span className="text-sm text-[#888888]"> — {item.example}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Tip:</strong> The more detail you give here, the better your content will be.
                Paste 2-3 paragraphs of your best writing into the &quot;Example Content&quot; field so the AI can match your style.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 3
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              3
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Get your API key</h2>
              <p className="text-[13px] text-[#888888]">30 seconds</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">a.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    In your dashboard, click{' '}
                    <Link href="/blog/admin/api-keys" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                      API Keys
                    </Link>
                    {' '}in the top navigation.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">b.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Click <strong>&quot;Generate Key&quot;</strong> and give it a name (e.g., &quot;My Website&quot;).
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">c.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    <strong>Copy the key immediately</strong> — it&apos;s only shown once. Add it to your project&apos;s <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">.env.local</code> file:
                  </p>
                </li>
              </ol>
              <div className="mt-4 bg-[#111111] rounded-lg p-4">
                <code className="text-[13px] text-[#CCCCCC] font-mono">VIBEBLOGGER_API_KEY=vb_live_your_key_here</code>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 4
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              4
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Add the blog to your site</h2>
              <p className="text-[13px] text-[#888888]">1-2 minutes</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                You have two options:
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#111111] mb-2">Option A: Use the setup prompt (recommended)</h4>
                  <p className="text-sm text-[#666666] leading-relaxed mb-3">
                    Go to the{' '}
                    <Link href="/start#how-it-works" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                      /start page
                    </Link>
                    {' '}and click <strong>&quot;Copy setup prompt&quot;</strong> in Step 3. Paste it into your coding agent (Cursor, Claude Code, Copilot, etc.). It will:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Create your blog list page and single post page",
                      "Build renderers for all 16 component types",
                      "Set up SEO metadata, Open Graph tags, and JSON-LD",
                      "Generate a dynamic sitemap and RSS feed",
                      "Install react-markdown as a dependency",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-[#444444]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[#E0DED8] pt-6">
                  <h4 className="text-sm font-semibold text-[#111111] mb-2">Option B: Follow the docs manually</h4>
                  <p className="text-sm text-[#666666] leading-relaxed">
                    If you prefer to build it yourself, follow the{' '}
                    <Link href="/docs" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
                      API documentation
                    </Link>
                    . It includes the full API reference, component type specs, a React component library you can copy-paste, and SEO setup instructions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#F0F8FF] border border-[#C8DFF0] rounded-lg p-4">
              <p className="text-sm text-[#2A6496]">
                <strong>Don&apos;t want to do this yourself?</strong>{' '}
                Book a free 15-minute setup call and we&apos;ll do it with you. We&apos;ll screenshare, paste the prompt into your coding agent, and make sure everything works.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 5
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              5
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Enable your publishing agents</h2>
              <p className="text-[13px] text-[#888888]">1 minute</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Go to the <strong>Agents</strong> tab in your dashboard. You&apos;ll see pre-built templates:
              </p>

              <div className="space-y-3">
                {[
                  {
                    name: "Weekly Topic Research",
                    desc: "Finds 3-5 trending topics in your niche every week",
                  },
                  {
                    name: "Content Calendar Filler",
                    desc: "Keeps your queue above 5 pending topics automatically",
                  },
                  {
                    name: "SEO Audit",
                    desc: "Reviews your recent posts for SEO issues",
                  },
                ].map((template) => (
                  <div key={template.name} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-4">
                    <p className="text-sm font-medium text-[#111111]">{template.name}</p>
                    <p className="text-[13px] text-[#888888]">{template.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#666666] leading-relaxed mt-4">
                Click on a template, choose your schedule (daily, weekly, etc.), and click <strong>Enable</strong>. The agent will run automatically — no input needed from you.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 6
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              6
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Generate your first topics</h2>
              <p className="text-[13px] text-[#888888]">1 minute</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Open the <strong>Chat</strong> panel on the right side of your dashboard. This is your AI blog strategist. Try these prompts:
              </p>

              <div className="space-y-3">
                {[
                  "Research my niche and queue 40 topics with the best SEO opportunities",
                  "Analyze my competitors and find content gaps I should fill",
                  "Create a content calendar for the next 3 months",
                  "Find trending topics in my industry and queue the top 10",
                ].map((prompt) => (
                  <div key={prompt} className="bg-[#1A1A1A] rounded-lg p-3.5">
                    <p className="text-[13px] text-[#88CCFF] font-mono">&quot;{prompt}&quot;</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#666666] leading-relaxed mt-4">
                The AI will research keywords, analyze search volume and difficulty, and automatically add topics to your queue. Posts will start generating immediately.
              </p>
            </div>

            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Tip:</strong> Start with 10-20 topics to review the quality before queuing all 40. You can always generate more later — you have 100 credits.
              </p>
            </div>
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-14" />

        {/* ============================================
            STEP 7 — Google Search Console
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              7
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Submit to Google Search Console</h2>
              <p className="text-[13px] text-[#888888]">3-5 minutes — don&apos;t skip this</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4">
              <p className="text-sm text-[#8B6914]">
                <strong>Why this matters:</strong> Without Search Console, Google may take weeks or months to discover your blog. With it, your pages can be indexed in 2-7 days. This is the single most important step for getting organic traffic.
              </p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">7a. Add your site to Search Console</h4>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">1.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Go to{' '}
                    <span className="text-[#111111] font-medium">search.google.com/search-console</span>
                    {' '}and sign in with your Google account.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">2.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Click <strong>&quot;Add property&quot;</strong> and choose <strong>&quot;URL prefix&quot;</strong>. Enter your full domain (e.g., <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">https://yourdomain.com</code>).
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">3.</span>
                  <div>
                    <p className="text-sm text-[#444444] leading-relaxed mb-2">
                      <strong>Verify ownership</strong> using one of these methods:
                    </p>
                    <div className="space-y-2 ml-2">
                      {[
                        { method: "HTML tag (easiest)", desc: 'Copy the meta tag into your <head>. For Next.js, add it to your root layout.tsx metadata.' },
                        { method: "DNS record", desc: "Add a TXT record to your domain's DNS settings. Works with any hosting provider." },
                        { method: "HTML file", desc: "Download the verification file and place it in your /public folder." },
                      ].map((v) => (
                        <div key={v.method} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-3">
                          <p className="text-sm font-medium text-[#111111]">{v.method}</p>
                          <p className="text-[13px] text-[#888888]">{v.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">7b. Submit your sitemap</h4>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">1.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    In Search Console, go to <strong>Sitemaps</strong> in the left sidebar.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">2.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Enter your sitemap URL: <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">blog/sitemap.xml</code>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">3.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Click <strong>Submit</strong>. Google will start crawling your blog pages. Status should show &quot;Success&quot; within a few hours.
                  </p>
                </li>
              </ol>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="text-sm font-semibold text-[#111111] mb-4">7c. Request indexing for key pages</h4>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">1.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    In Search Console, paste your blog URL into the <strong>URL Inspection</strong> bar at the top.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">2.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Click <strong>&quot;Request Indexing&quot;</strong>. Do this for your blog listing page and your top 5-10 posts.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="text-sm font-medium text-[#888888] shrink-0">3.</span>
                  <p className="text-sm text-[#444444] leading-relaxed">
                    Google typically indexes requested pages within <strong>2-7 days</strong>. You don&apos;t need to do this for every post — the sitemap handles new posts automatically going forward.
                  </p>
                </li>
              </ol>
            </div>

            <div className="bg-[#F0FFF0] border border-[#C0E8C0] rounded-lg p-4">
              <p className="text-sm text-[#2A6B2A]">
                <strong>What to expect:</strong> Pages get indexed in 2-7 days. Rankings start appearing in 2-8 weeks. Meaningful organic traffic typically builds over 2-6 months. Vibeblogger&apos;s research-backed content and consistent publishing accelerate this significantly.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            STEP 8 — Analytics
            ============================================ */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
              8
            </div>
            <div>
              <h2 className="font-lora text-[22px] font-normal">Track your traffic (optional)</h2>
              <p className="text-[13px] text-[#888888]">2 minutes</p>
            </div>
          </div>

          <div className="ml-14 space-y-4">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Set up analytics so you can see your blog&apos;s traffic growing. Choose one:
              </p>

              <div className="space-y-3">
                <div className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-4">
                  <p className="text-sm font-medium text-[#111111]">Google Analytics</p>
                  <p className="text-[13px] text-[#888888]">
                    Create a property at analytics.google.com, then add the tracking script to your site&apos;s <code className="text-[#111111] bg-[#F0EEE8] px-1 py-0.5 rounded text-xs">&lt;head&gt;</code>. For Next.js, use the <code className="text-[#111111] bg-[#F0EEE8] px-1 py-0.5 rounded text-xs">@next/third-parties</code> package.
                  </p>
                </div>
                <div className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-4">
                  <p className="text-sm font-medium text-[#111111]">Plausible / Umami / PostHog</p>
                  <p className="text-[13px] text-[#888888]">
                    Privacy-friendly alternatives. Single script tag, no cookie banner needed. Popular with indie hackers.
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#666666] leading-relaxed mt-4">
                Google Search Console (from Step 7) also shows your organic search performance — impressions, clicks, and ranking positions for each page.
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
            <p className="text-[15px] text-[#999999] leading-[1.7] max-w-[480px] mx-auto mb-3">
              Your blog is live. Your agents are running. Google is indexing your content.
              New posts will be researched, written, and published automatically.
            </p>
            <p className="text-[15px] text-[#666666] leading-[1.7] max-w-[480px] mx-auto mb-8">
              Check your dashboard in a few hours — your first posts should be ready.
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
                desc: "Check the quality. Edit anything you want. Tell the agent to adjust the tone if needed.",
              },
              {
                title: "Set up more agents",
                desc: "The SEO audit and internal link builder agents help improve existing content over time.",
              },
              {
                title: "Monitor Search Console",
                desc: "Check back in 1-2 weeks. You should see pages being indexed and impressions starting to appear.",
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
            Stuck on any step? Reach out at{' '}
            <a href="mailto:support@vibeblogger.io" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
              support@vibeblogger.io
            </a>
            {' '}or book a free setup call. We&apos;ll get you running.
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
