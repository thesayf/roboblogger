"use client";

import React, { useState } from 'react';
import { Key, MessageSquare } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { CreditsDisplay } from '@/app/blog/admin/components/CreditsDisplay';
import ChatPanel from '@/app/blog/admin/components/ChatPanel';

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-[#E0DED8] sticky top-0 z-50">
        <div className={`mx-auto px-3 sm:px-6 lg:px-8 transition-all duration-300 ${chatOpen ? "sm:mr-[440px]" : ""}`} style={{ maxWidth: "1600px" }}>
          <div className="flex items-center justify-between h-16">
            <div className="flex shrink-0 items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-lora text-xl font-bold text-[#111111]">Vibeblogger</span>
              </Link>
              <div className="hidden sm:flex items-center">
                <span className="text-[#CCCCCC] mx-3">/</span>
                <span className="text-sm font-medium text-[#888888]">Dashboard</span>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Link
                href="/blog/admin/quick-start"
                className="hidden text-sm text-[#666666] hover:text-[#111111] transition-colors lg:block"
              >
                Setup Guide
              </Link>
              <Link
                href="/docs"
                className="hidden text-sm text-[#666666] hover:text-[#111111] transition-colors lg:block"
              >
                Docs
              </Link>
              <Link
                href="/blog/admin/api-keys"
                className="hidden items-center gap-1.5 text-sm text-[#666666] hover:text-[#111111] transition-colors lg:flex"
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </Link>
              <Link
                href="/blog"
                className="hidden text-sm text-[#666666] hover:text-[#111111] transition-colors md:block"
              >
                View Blog
              </Link>

              {/* Credits display and top-up */}
              <CreditsDisplay />

              {/* Clerk User Button - handles auth state and logout */}
              <UserButton
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

      {/* Content — slides left when chat opens */}
      <div className={`admin-content transition-all duration-300 ${chatOpen ? "sm:mr-[440px]" : ""}`}>
        {children}
      </div>

      {/* Chat FAB — hidden when chat is open */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#111111] text-white shadow-lg hover:bg-[#333333] flex items-center justify-center transition-all hover:scale-105 z-40"
          aria-label="Open chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Chat sidebar — fixed right panel */}
      <div className={`fixed top-0 right-0 h-full w-full bg-white border-l border-[#E0DED8] z-50 flex flex-col transition-transform duration-300 sm:w-[440px] ${chatOpen ? "translate-x-0" : "translate-x-full"}`}>
        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      </div>
    </div>
  );
}
