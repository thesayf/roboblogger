"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, ChevronLeft, Key, Plus, Zap, ExternalLink } from 'lucide-react';
import { SETUP_PROMPT, getSetupPrompt } from '@/lib/setup-prompt';

export default function QuickStartPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keys, setKeys] = useState<{ _id: string; name: string; keyPrefix: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      if (response.ok && data.keys?.length > 0) {
        setKeys(data.keys);
      }
    } catch (err) {
      // No keys yet, that's fine
    } finally {
      setIsLoading(false);
    }
  };

  const createKey = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Quick Start' })
      });
      const data = await response.json();
      if (response.ok) {
        setNewlyCreatedKey(data.rawKey);
        setApiKey(data.rawKey);
        fetchKeys();
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setIsCreating(false);
    }
  };

  const copyPrompt = async () => {
    const prompt = newlyCreatedKey ? getSetupPrompt(newlyCreatedKey) : SETUP_PROMPT;
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const hasKey = !!newlyCreatedKey || keys.length > 0;
  const displayKey = newlyCreatedKey || (keys.length > 0 ? keys[0].keyPrefix + '...' : null);

  return (
    <div className="max-w-[700px] mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/blog/admin"
          className="inline-flex items-center gap-2 text-[#666666] hover:text-[#111111] mb-4 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="font-lora text-[28px] sm:text-[36px] font-normal leading-tight mb-3">
          Quick Start
        </h1>
        <p className="text-[15px] text-[#666666] leading-relaxed">
          Generate your setup prompt and paste it into your coding agent.
          It audits your site&apos;s SEO and builds your entire blog.
        </p>
      </div>

      {/* Step 1: API Key */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            1
          </div>
          <h2 className="text-lg font-medium text-[#111111]">Your API Key</h2>
        </div>

        <div className="ml-11">
          {isLoading ? (
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F0EEE8] rounded-lg" />
                <div className="h-4 bg-[#F0EEE8] rounded w-48" />
              </div>
            </div>
          ) : newlyCreatedKey ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <Check className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">API key generated</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[#111111] rounded-lg text-sm text-[#CCCCCC] font-mono overflow-x-auto">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyKey(newlyCreatedKey)}
                  className="px-3 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                >
                  {keyCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#666666]" />
                  )}
                </button>
              </div>
              <p className="text-[12px] text-emerald-600 mt-2">
                Save this key — it won&apos;t be shown again. It&apos;s already included in your setup prompt below.
              </p>
            </div>
          ) : keys.length > 0 ? (
            <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F5F4F0] rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-[#111111]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{keys[0].name}</p>
                    <code className="text-[13px] text-[#888888] font-mono">{keys[0].keyPrefix}...</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
                  <Link
                    href="/blog/admin/api-keys"
                    className="text-[13px] text-[#888888] hover:text-[#111111] transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
              <div className="mt-3 bg-[#F5F4F0] rounded-lg p-3">
                <p className="text-[12px] text-[#666666]">
                  Make sure your key is in your project&apos;s <code className="bg-white px-1.5 py-0.5 rounded text-[#111111] text-[11px]">.env.local</code> file:
                </p>
                <code className="text-[11px] text-[#888888] font-mono mt-1 block">VIBEBLOGGER_API_KEY={keys[0].keyPrefix}...</code>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E0DED8] rounded-lg p-5 text-center">
              <Key className="w-8 h-8 text-[#888888] mx-auto mb-3" />
              <p className="text-sm text-[#666666] mb-4">You need an API key to connect your blog.</p>
              <button
                onClick={createKey}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#333333] disabled:bg-[#888888] text-white text-sm font-medium rounded-full transition-colors cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate API Key
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Copy Setup Prompt */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${hasKey ? 'bg-[#111111] text-white' : 'bg-[#E0DED8] text-[#888888]'}`}>
            2
          </div>
          <h2 className={`text-lg font-medium ${hasKey ? 'text-[#111111]' : 'text-[#888888]'}`}>Copy your setup prompt</h2>
        </div>

        <div className="ml-11">
          <div className="bg-[#111111] rounded-xl overflow-hidden">
            <div className="p-5 max-h-[200px] overflow-hidden relative">
              <pre className="text-[12px] text-[#AAAAAA] font-mono leading-relaxed whitespace-pre-wrap">{`I want to add a blog to my site using the Vibeblogger API. Before creating the blog, audit and fix the SEO on my existing site.

## Part 1: Audit & Fix Existing Site SEO
- Every page must have unique <title> and <meta description>
- Add Open Graph and Twitter card metadata to every page
- Add canonical URLs, proper heading hierarchy, alt text
- Create robots.txt and sitemap if missing...

## Part 2: Add the Blog
- API endpoints, 16 component renderers, SEO metadata,
  sitemap, RSS feed, structured data, and more...`}</pre>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#111111] to-transparent" />
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={copyPrompt}
                disabled={!hasKey}
                className={`w-full text-[14px] font-semibold px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  hasKey
                    ? 'text-[#111111] bg-white hover:bg-[#F0F0F0]'
                    : 'text-[#666666] bg-[#2A2A2A] cursor-not-allowed'
                }`}
              >
                {promptCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied to clipboard
                  </>
                ) : hasKey ? (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy setup prompt{newlyCreatedKey ? ' (with API key)' : ''}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Generate an API key first
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Paste into coding agent */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${hasKey ? 'bg-[#111111] text-white' : 'bg-[#E0DED8] text-[#888888]'}`}>
            3
          </div>
          <h2 className={`text-lg font-medium ${hasKey ? 'text-[#111111]' : 'text-[#888888]'}`}>Paste into your coding agent</h2>
        </div>

        <div className="ml-11">
          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <p className="text-sm text-[#666666] leading-relaxed">
              Open <strong>Cursor</strong>, <strong>Claude Code</strong>, or any AI coding agent in your project directory. Paste the prompt and let it run. It will:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Audit and fix SEO on all your existing pages",
                "Create your blog listing and post pages",
                "Build renderers for all 16 content component types",
                "Set up sitemap, RSS feed, robots.txt, and structured data",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-[13px] text-[#444444]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What's next */}
      <div className="ml-11 mt-10 pt-8 border-t border-[#E0DED8]">
        <h3 className="text-sm font-medium text-[#888888] uppercase tracking-[0.1em] mb-4">After setup</h3>
        <div className="space-y-3">
          <Link
            href="/blog/admin"
            className="flex items-center justify-between bg-white border border-[#E0DED8] rounded-lg p-4 hover:border-[#111111] transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-[#111111]">Chat with your strategist</p>
              <p className="text-[13px] text-[#888888]">Research keywords and queue your first 40 posts</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#111111] transition-colors" />
          </Link>
          <Link
            href="/blog/admin"
            className="flex items-center justify-between bg-white border border-[#E0DED8] rounded-lg p-4 hover:border-[#111111] transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-[#111111]">Enable agents</p>
              <p className="text-[13px] text-[#888888]">Set up backlink monitoring and weekly topic research</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#111111] transition-colors" />
          </Link>
          <Link
            href="/guide"
            className="flex items-center justify-between bg-white border border-[#E0DED8] rounded-lg p-4 hover:border-[#111111] transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-[#111111]">Full setup guide</p>
              <p className="text-[13px] text-[#888888]">Google Search Console, analytics, and more</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#111111] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
