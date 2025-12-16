"use client"

import Link from 'next/link'

export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
            RoboBlogger
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm font-mono text-gray-900 hover:text-gray-900">
              About
            </Link>
            <Link href="/pricing" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/blog-redesign" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Content - Centered */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl text-gray-900 mb-12" style={{ fontFamily: "Lora, Georgia, serif" }}>
            About RoboBlogger
          </h1>

          <div className="space-y-6 text-2xl text-gray-700 leading-relaxed mb-12" style={{ fontFamily: "Lora, Georgia, serif" }}>
            <p>
              Organize your day fast. And I mean fast.
            </p>

            <p>
              Learn a couple commands and you can schedule your days and life in seconds.
            </p>

            <p>
              Two views: one to manage today, one to organize your goals and future.
            </p>

            <p>
              If you need help, you have a friendly AI assistant with ⌘A who can do everything for you.
            </p>

            <p>
              It&apos;s hard to explain. Just try it. Free for 30 days, no credit card required.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/sign-up"
              className="inline-block px-8 py-4 bg-gray-900 text-white font-mono text-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 RoboBlogger. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  )
}
