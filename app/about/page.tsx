import Link from 'next/link'
import { SignUpButton } from '@clerk/nextjs'

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111] flex flex-col">
      {/* Navigation */}
      <nav className="max-w-[1100px] mx-auto w-full px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/about" className="text-sm text-[#111111] font-medium hidden sm:block">
            About
          </Link>
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/blog" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Blog
          </Link>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Content */}
      <section className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="max-w-[600px]">
          <h1 className="font-lora text-[40px] sm:text-[56px] font-normal leading-[1.15] tracking-[-0.02em] mb-12">
            About Vibeblogger
          </h1>

          <div className="space-y-6 text-lg text-[#444444] leading-relaxed">
            <p>
              Most apps know they need a blog. SEO is the highest-ROI marketing channel for startups and SaaS products. But nobody has time to research keywords, write 2,000-word articles, generate images, and publish consistently.
            </p>

            <p>
              Vibeblogger does all of that for you. Tell it your niche and audience. It researches real keywords, writes long-form content that reads like a human wrote it, generates matching images, and delivers everything through a headless API.
            </p>

            <p>
              No generic AI slop. Every post is built from 15+ structured components — callouts, comparison tables, charts, CTAs — so your content stands out and keeps readers engaged.
            </p>

            <p>
              Plug the API into whatever frontend you're building. Next.js, Remix, Astro, plain HTML — it doesn't matter. Your blog, your design, our content engine.
            </p>
          </div>

          <div className="mt-12">
            <SignUpButton mode="modal">
              <button className="text-[15px] font-semibold text-white bg-[#111111] px-9 py-3.5 rounded-full hover:bg-[#333333] transition-colors cursor-pointer">
                Start publishing →
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Footer */}
      <footer className="px-8 py-8 text-center">
        <p className="text-[13px] text-[#AAAAAA]">vibeblogger.io</p>
      </footer>
    </div>
  )
}
