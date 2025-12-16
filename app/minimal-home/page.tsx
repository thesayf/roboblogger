"use client";

import React, { useState } from 'react';

export default function MinimalHomePage() {
  const [showAbout, setShowAbout] = useState(false);

  if (showAbout) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-mono">
        <div className="max-w-4xl w-full mx-auto flex justify-end items-center min-h-screen">
          <div className="flex flex-col justify-center pr-8 w-full max-w-2xl">
            <button
              onClick={() => setShowAbout(false)}
              className="text-xs text-gray-400 hover:text-gray-600 mb-8 text-left"
            >
              ← back
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
                    Your timeline is what you're doing today. Your inventory is everything else.
                    Pull tasks from projects into your schedule when you're ready to work on them.
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-mono">
      {/* App-width white column (same as /app page) */}
      <div className="max-w-4xl w-full bg-white min-h-screen flex items-center justify-center px-8">

        {/* Content */}
        <div className="w-full max-w-md py-12">

          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-5xl text-gray-900 font-normal tracking-tight">
              Daybook
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Fast, keyboard-first productivity
            </p>
          </div>

          {/* Navigation section */}
          <div className="mb-12">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              Learn More
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setShowAbout(true)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all rounded"
              >
                About Us
              </button>
              <a
                href="/blog"
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all rounded"
              >
                Blog
              </a>
            </div>
          </div>

          {/* Sign-in section */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              Get Started
            </div>
            <div className="space-y-3">
              {/* Google OAuth - primary */}
              <button className="w-full px-4 py-3 text-sm bg-gray-900 text-white hover:bg-gray-800 transition-all rounded flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Email sign in - secondary */}
              <button className="w-full px-4 py-3 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all rounded">
                Sign in with Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
