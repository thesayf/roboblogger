"use client";

import React from 'react';
import { Sparkles, Key } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  // Clerk handles authentication - this component just provides the admin header wrapper
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">RoboBlogger</span>
              </Link>
              <div className="hidden sm:flex items-center">
                <span className="text-slate-600 mx-3">/</span>
                <span className="text-sm font-medium text-slate-300">Dashboard</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/blog/admin/api-keys"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </Link>
              <Link
                href="/blog"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                View Blog
              </Link>

              {/* Clerk User Button - handles auth state and logout */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content with dark background */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
