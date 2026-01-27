"use client";

import React from 'react';
import { Key } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  // Clerk handles authentication - this component just provides the admin header wrapper
  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E0DED8] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-lora text-xl font-bold text-[#111111]">Vibeblogger</span>
              </Link>
              <div className="hidden sm:flex items-center">
                <span className="text-[#CCCCCC] mx-3">/</span>
                <span className="text-sm font-medium text-[#888888]">Dashboard</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm text-[#666666] hover:text-[#111111] transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/blog/admin/api-keys"
                className="flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#111111] transition-colors"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </Link>
              <Link
                href="/blog"
                className="text-sm text-[#666666] hover:text-[#111111] transition-colors"
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

      {/* Content with editorial background */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
