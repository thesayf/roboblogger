"use client";

import Link from 'next/link';
import React from 'react';

export default function BlogDraftPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-mono text-gray-900 tracking-tight">
            Daybook
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              All Posts
            </Link>
            <Link href="/app" className="text-gray-600 hover:text-gray-900">
              Go to App
            </Link>
          </nav>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 py-16">
        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <time dateTime="2025-10-08">Oct 8, 2025</time>
            <span>·</span>
            <span>8 min read</span>
            <span>·</span>
            <span>Productivity</span>
          </div>

          <h1 className="text-4xl font-normal text-gray-900 mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Why Time-Blocking Beats Todo Lists: The Science of Deep Work
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
            Todo lists feel productive. But research shows they&apos;re terrible at helping you actually get things done. Here&apos;s why.
          </p>
        </header>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none" style={{ fontFamily: 'Georgia, serif' }}>
          <p className="text-gray-800 leading-relaxed mb-6">
            Most productivity systems fail because they ignore a fundamental truth about human attention:
            your brain can&apos;t prioritize on the fly. When you look at a list of 20 tasks, your brain
            defaults to what&apos;s easiest, not what&apos;s most important.
          </p>

          <p className="text-gray-800 leading-relaxed mb-6">
            This is where time-blocking comes in. Instead of maintaining an ever-growing list,
            you schedule specific blocks of time for specific work. The decision is made once,
            during planning—not 30 times throughout the day.
          </p>

          <h2 className="text-2xl font-normal text-gray-900 mt-12 mb-4">
            The Research Behind Time-Blocking
          </h2>

          <p className="text-gray-800 leading-relaxed mb-6">
            Cal Newport, computer science professor and author of <em>Deep Work</em>, argues that
            &ldquo;the ability to perform deep work is becoming increasingly rare at exactly the same time
            it is becoming increasingly valuable in our economy.&rdquo;<sup className="text-blue-600">1</sup>
          </p>

          <p className="text-gray-800 leading-relaxed mb-6">
            His method is simple: at the start of each day, assign every hour a task. When 3pm arrives
            and your calendar says &ldquo;Write report,&rdquo; you write the report. No debate. No scrolling through
            a list. Just execution.
          </p>

          <h2 className="text-2xl font-normal text-gray-900 mt-12 mb-4">
            Combining Time-Blocking with GTD
          </h2>

          <p className="text-gray-800 leading-relaxed mb-6">
            David Allen&apos;s Getting Things Done (GTD) method adds another layer: separate capture
            from execution. Your &ldquo;inventory&rdquo; holds everything you might do. Your &ldquo;timeline&rdquo; holds
            only what you&apos;re doing today.
          </p>

          <p className="text-gray-800 leading-relaxed mb-6">
            This separation prevents decision fatigue. When it&apos;s time to work, you&apos;re not
            re-evaluating 50 tasks. You&apos;re executing the 5 you already decided mattered most.
          </p>

          {/* In-Article CTA */}
          <div className="my-12 p-8 bg-gray-50 border border-gray-200">
            <p className="text-gray-900 font-medium mb-3">
              Try time-blocking for free
            </p>
            <p className="text-gray-600 text-sm mb-4">
              Daybook combines time-blocking and GTD into a keyboard-first tool built for speed.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-mono hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>

          <h2 className="text-2xl font-normal text-gray-900 mt-12 mb-4">
            How to Start Time-Blocking
          </h2>

          <p className="text-gray-800 leading-relaxed mb-6">
            Here&apos;s a practical approach to implement time-blocking today:
          </p>

          <ol className="list-decimal list-outside ml-6 space-y-3 mb-6">
            <li className="text-gray-800 leading-relaxed pl-2">
              <strong>Capture everything</strong> — Brain dump all tasks into an inbox
            </li>
            <li className="text-gray-800 leading-relaxed pl-2">
              <strong>Pick 3-5 for today</strong> — Be realistic about what fits
            </li>
            <li className="text-gray-800 leading-relaxed pl-2">
              <strong>Assign time blocks</strong> — Give each task a specific time slot
            </li>
            <li className="text-gray-800 leading-relaxed pl-2">
              <strong>Execute</strong> — When the time comes, do the work
            </li>
            <li className="text-gray-800 leading-relaxed pl-2">
              <strong>Review at day&apos;s end</strong> — What worked? What didn&apos;t?
            </li>
          </ol>

          <p className="text-gray-800 leading-relaxed mb-6">
            The first few days feel rigid. Then it clicks: you&apos;re spending less time thinking
            about your tasks and more time actually doing them.
          </p>

          <h2 className="text-2xl font-normal text-gray-900 mt-12 mb-4">
            Common Mistakes to Avoid
          </h2>

          <p className="text-gray-800 leading-relaxed mb-6">
            <strong>Over-scheduling.</strong> Leave buffer time. Back-to-back blocks lead to burnout.
          </p>

          <p className="text-gray-800 leading-relaxed mb-6">
            <strong>No flex time.</strong> Life happens. Build in 30-60 minutes of unscheduled time
            for interruptions.
          </p>

          <p className="text-gray-800 leading-relaxed mb-6">
            <strong>Treating it like a todo list.</strong> Time-blocking isn&apos;t about listing tasks—it&apos;s
            about committing to when you&apos;ll do them.
          </p>

          {/* References */}
          <div className="mt-16 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-2">References</p>
            <ol className="text-xs text-gray-500 space-y-1">
              <li>
                <sup>1</sup> Newport, Cal. <em>Deep Work: Rules for Focused Success in a Distracted World</em>.
                Grand Central Publishing, 2016.
              </li>
            </ol>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-24">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              ← Back to Daybook
            </Link>
            <Link href="/blog" className="hover:text-gray-900">
              More articles
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
