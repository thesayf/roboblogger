"use client"

import Link from 'next/link'

export default function HomepageRedesign() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-mono">
            Daybook
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/blog" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <h1 className="text-7xl text-gray-900 mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
          Daybook
        </h1>
        <p className="text-2xl text-gray-700 mb-12 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
          Plan your day in plain text
        </p>

        {/* Keyboard Shortcut CTA */}
        <button className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-mono text-lg hover:bg-gray-800 transition-colors mb-8">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-sm">
            <span>⌘</span>
            <span>K</span>
          </span>
          <span>to get started</span>
        </button>

        <p className="text-sm text-gray-600" style={{ fontFamily: "Inter, monospace" }}>
          Already have an account?{' '}
          <Link href="/sign-in" className="underline hover:text-gray-900">
            Sign in
          </Link>
        </p>
      </section>

      {/* Feature Trio */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Timeline */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wide text-gray-500 mb-4">
              Timeline
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Schedule deep work blocks. Time-block your day with visual clarity. See exactly when you'll work on what matters.
            </p>
            <div className="border border-gray-200 bg-gray-50 aspect-[4/3] flex items-center justify-center text-sm text-gray-400 font-mono">
              [Timeline screenshot]
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wide text-gray-500 mb-4">
              Inventory
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Track goals, projects, and routines in one organized view. Review weekly. Keep everything in sight.
            </p>
            <div className="border border-gray-200 bg-gray-50 aspect-[4/3] flex items-center justify-center text-sm text-gray-400 font-mono">
              [Inventory screenshot]
            </div>
          </div>

          {/* Command */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wide text-gray-500 mb-4">
              Command
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Type, don't click. Every action is a keystroke away. Navigate your entire day without touching your mouse.
            </p>
            <div className="border border-gray-200 bg-gray-50 aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm mb-2">
                  <span className="text-2xl">⌘</span>
                  <span className="text-2xl font-mono">K</span>
                </div>
                <p className="text-sm text-gray-500 font-mono">Command palette</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Product Demo */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl text-gray-900 text-center mb-12" style={{ fontFamily: "Lora, Georgia, serif" }}>
          Your day, your way
        </h2>
        <div className="border border-gray-200 bg-gray-50 rounded-lg aspect-[16/9] flex items-center justify-center text-sm text-gray-400 font-mono">
          [Large timeline screenshot with deep work blocks, scheduled tasks, and chat modal]
        </div>
        <p className="text-xl text-gray-600 text-center mt-8" style={{ fontFamily: "Lora, Georgia, serif" }}>
          Everything surfaces when you need it
        </p>
      </section>

      {/* Keyboard Shortcuts Showcase */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-4xl text-gray-900 text-center mb-16" style={{ fontFamily: "Lora, Georgia, serif" }}>
          Built for speed
        </h2>

        <div className="space-y-6 mb-16">
          <div className="flex items-start gap-8">
            <div className="flex items-center gap-2 w-32">
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘</kbd>
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">K</kbd>
            </div>
            <p className="text-lg text-gray-700 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Open command palette
            </p>
          </div>

          <div className="flex items-start gap-8">
            <div className="flex items-center gap-2 w-32">
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">N</kbd>
            </div>
            <p className="text-lg text-gray-700 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
              New task
            </p>
          </div>

          <div className="flex items-start gap-8">
            <div className="flex items-center gap-2 w-32">
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">/</kbd>
            </div>
            <p className="text-lg text-gray-700 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Search anywhere
            </p>
          </div>

          <div className="flex items-start gap-8">
            <div className="flex items-center gap-2 w-32">
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">⌘</kbd>
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">↵</kbd>
            </div>
            <p className="text-lg text-gray-700 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Deep work block
            </p>
          </div>

          <div className="flex items-start gap-8">
            <div className="flex items-center gap-2 w-32">
              <kbd className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-mono">?</kbd>
            </div>
            <p className="text-lg text-gray-700 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Show all shortcuts
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 font-mono mb-6">
            No credit card required • Free to start
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-3 bg-gray-900 text-white font-mono hover:bg-gray-800 transition-colors">
              Get started
            </button>
            <Link href="/sign-in" className="px-8 py-3 border border-gray-300 text-gray-700 font-mono hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 Daybook. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  )
}
