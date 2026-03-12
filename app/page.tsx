import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { generateHomePageSchema } from '@/utils/schema'

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/blog/admin')
  }

  const schema = generateHomePageSchema()

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between">
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
          <Link href="/blog" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Blog
          </Link>
          <SignInButton mode="modal">
            <button className="text-sm text-[#666666] hover:text-[#111111] transition-colors cursor-pointer hidden sm:block">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Hero */}
      <section className="max-w-[720px] mx-auto px-8 pt-[120px] pb-20 text-center">
        <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
          The AI-powered blog engine
        </p>
        <h1 className="font-lora text-[40px] sm:text-[64px] font-normal leading-[1.15] tracking-[-0.02em] mb-7">
          Write less.<br />
          Publish more.<br />
          <em>Rank higher.</em>
        </h1>
        <p className="text-lg text-[#666666] leading-[1.7] max-w-[480px] mx-auto mb-12">
          Vibeblogger researches, writes, and publishes SEO-optimized blog posts for your app. Headless. Automated. Beautiful.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignUpButton mode="modal">
            <button className="text-[15px] font-semibold text-white bg-[#111111] px-9 py-3.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer">
              Start publishing →
            </button>
          </SignUpButton>
          <Link
            href="/blog"
            className="text-[15px] font-medium text-[#111111] bg-transparent border border-[#CCCCCC] px-9 py-3.5 rounded-full hover:border-[#999999] transition-colors text-center"
          >
            See examples
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-[120px] mx-auto border-b-2 border-[#111111]" />

      {/* How It Works */}
      <section className="max-w-[900px] mx-auto px-8 py-20">
        <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-12">
          {[
            { num: "01", title: "Describe your niche", desc: "Tell us your industry, audience, and competitors. Our AI handles the keyword and topic research." },
            { num: "02", title: "AI creates everything", desc: "Research, writing, images, SEO metadata — all generated automatically with your brand voice." },
            { num: "03", title: "Fetch via API", desc: "Structured JSON content delivered through our headless API. Plug into any frontend you're building." }
          ].map((item) => (
            <div key={item.num}>
              <div className="text-[13px] text-[#AAAAAA] mb-3">{item.num}</div>
              <h3 className="font-lora text-[22px] font-normal mb-3">{item.title}</h3>
              <p className="text-sm text-[#666666] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Content Preview */}
      <section className="max-w-[900px] mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <h2 className="font-lora text-3xl sm:text-4xl font-normal leading-snug mb-5">
              Content that reads like<br />a <em>human</em> wrote it
            </h2>
            <p className="text-[15px] text-[#666666] leading-relaxed mb-6">
              No generic AI slop. Every post is researched with real data, structured with 15+ component types, and optimized for the keywords your audience is actually searching for.
            </p>
            <div className="flex flex-col gap-3">
              {["SEO keyword research & gap analysis", "15+ content components (callouts, tables, CTAs)", "AI-generated images matching your brand", "Automatic meta tags & Open Graph data"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111111] shrink-0" />
                  <span className="text-sm text-[#444444]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E0DED8] rounded p-8">
            <div className="text-[11px] text-[#AAAAAA] uppercase tracking-[0.1em] mb-4">Generated post preview</div>
            <div className="font-lora text-[22px] font-normal mb-3">10 Home Workouts That Build Muscle Without Equipment</div>
            <div className="text-[13px] text-[#999999] mb-4">
              home workouts · 33,100 searches/mo · Medium difficulty
            </div>
            <div className="border-t border-[#E0DED8] pt-4 flex gap-4">
              <span className="text-xs text-[#666666]">2,400 words</span>
              <span className="text-xs text-[#666666]">8 components</span>
              <span className="text-xs text-[#666666]">SEO: 94/100</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Features Grid */}
      <section className="max-w-[900px] mx-auto px-8 py-20">
        <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-16">
          Everything included
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
          {[
            { title: "SEO Research", desc: "Keywords, trends, competitor analysis — all automated." },
            { title: "AI Writing", desc: "Long-form articles that read naturally, not like ChatGPT." },
            { title: "Visual Components", desc: "Callouts, tables, comparisons, CTAs — auto-structured." },
            { title: "Headless API", desc: "JSON responses. Build your frontend however you want." },
            { title: "AI Images", desc: "DALL-E images generated to match your content." },
            { title: "Auto-publish", desc: "Set your schedule. Content flows automatically." },
          ].map((feature) => (
            <div key={feature.title} className="pb-6 border-b border-[#E0DED8]">
              <h3 className="font-lora text-lg font-normal mb-2">{feature.title}</h3>
              <p className="text-[13px] text-[#666666] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111111] text-white">
        <div className="max-w-[600px] mx-auto px-8 py-24 sm:py-28 text-center">
          <h2 className="font-lora text-4xl sm:text-[40px] font-normal tracking-tight mb-4">Ready to start?</h2>
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
