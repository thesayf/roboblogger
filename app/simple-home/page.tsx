"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function SimpleHomePage() {
  const [showAbout, setShowAbout] = useState(false);

  if (showAbout) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-mono">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <button
            onClick={() => setShowAbout(false)}
            className="text-xs text-gray-400 hover:text-gray-600 mb-8"
          >
            ← Back
          </button>

          <div className="space-y-6 text-sm leading-relaxed">
            <h2 className="text-2xl text-gray-900 font-normal mb-8">
              About Daybook
            </h2>

            <p className="text-gray-700">
              Daybook is a productivity tool built for people who value speed, efficiency, and clarity.
              No bloat. No distractions. Just a simple system to plan your day and get things done.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-gray-900 font-medium mb-2">Fast & Keyboard-First</h3>
                <p className="text-gray-600">
                  Built for speed. Navigate entirely with your keyboard. No mouse required.
                  Everything responds instantly.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 font-medium mb-2">Evidence-Based Methods</h3>
                <p className="text-gray-600">
                  Combines time-blocking (Cal Newport) with GTD principles (David Allen).
                  Separate planning from execution. Stay focused on what matters today.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 font-medium mb-2">AI-Assisted Planning</h3>
                <p className="text-gray-600">
                  Natural language task creation. AI helps you break down projects,
                  schedule blocks, and stay on track—without getting in your way.
                </p>
              </div>

              <div>
                <h3 className="text-gray-900 font-medium mb-2">Timeline + Inventory</h3>
                <p className="text-gray-600">
                  Your timeline is what you&apos;re doing today. Your inventory is everything else.
                  Pull tasks from projects into your schedule when you&apos;re ready to work on them.
                </p>
              </div>
            </div>

            <p className="text-gray-600 pt-4">
              Daybook is designed for builders, makers, and anyone who wants to spend less time
              managing their tasks and more time executing them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-mono">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-lg font-normal tracking-tight text-gray-900">
            Daybook
          </div>
          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => setShowAbout(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </button>
            <Link
              href="/blog"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content - centered */}
      <div className="flex-1 flex items-center justify-center px-8 pt-20">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo/Title */}
          <div>
            <h1 className="text-5xl font-normal tracking-tight text-gray-900 mb-4">
              Daybook
            </h1>
            <p className="text-gray-600 text-lg">
              Fast, keyboard-first productivity
            </p>
          </div>

          {/* CTA buttons */}
          <div className="space-y-3 pt-4">
            {/* Google sign in - primary */}
            <button className="w-full px-6 py-3 text-base font-mono bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Email sign in - secondary */}
            <button className="w-full px-6 py-3 text-base font-mono border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Sign in with Email
            </button>
          </div>

          {/* Footer text */}
          <p className="text-xs text-gray-400 pt-8">
            No credit card required • Free to start
          </p>
        </div>
      </div>
    </div>
  );
}
