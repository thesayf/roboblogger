"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, ChevronLeft, Key, Zap, Plus, MessageSquare, Bot, Search } from 'lucide-react';
import { getSetupPrompt } from '@/lib/setup-prompt';

export default function QuickStartPage() {
  const [keys, setKeys] = useState<{ _id: string; name: string; keyPrefix: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState('');

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
      // No keys yet
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndCopy = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Quick Start' })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to generate key');
        setIsGenerating(false);
        return;
      }
      const key = data.rawKey;
      setGeneratedKey(key);
      const prompt = getSetupPrompt(key);
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 3000);
      fetchKeys();
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPromptAgain = async () => {
    if (generatedKey) {
      const prompt = getSetupPrompt(generatedKey);
      await navigator.clipboard.writeText(prompt);
    }
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <div className="max-w-[700px] mx-auto p-6 sm:p-8 pb-20">
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
          Setup Guide
        </h1>
        <p className="text-[15px] text-[#666666] leading-relaxed">
          Everything you need to go from zero to a live, SEO-optimised blog.
          Follow these steps in order — most people finish in under 15 minutes.
        </p>
      </div>

      {/* ============================================
          STEP 1 — Brand Voice
          ============================================ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            1
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#111111]">Set your brand voice</h2>
            <p className="text-[12px] text-[#888888]">2 minutes</p>
          </div>
        </div>

        <div className="ml-11">
          <div className="rounded-xl overflow-hidden border border-[#E0DED8] mb-3">
            <video autoPlay loop muted playsInline className="w-full h-auto">
              <source src="https://pub-71f1bcca1eeb4a92894ea145c8ed6bc0.r2.dev/brandsettingsnew.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <p className="text-sm text-[#666666] leading-relaxed mb-3">
              Go to the <Link href="/blog/admin" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">Brand tab</Link> in your dashboard and fill in your brand details. This is how the AI learns to write like you.
            </p>
            <div className="space-y-2">
              {[
                "Blog/Brand Name",
                "Industry & target audience",
                "Tone (professional, casual, technical, etc.)",
                "Topics you cover & things to avoid",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#CCCCCC] mt-0.5 shrink-0" />
                  <span className="text-[13px] text-[#444444]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-3 mt-3">
            <p className="text-[13px] text-[#8B6914]">
              <strong>Tip:</strong> Paste 2-3 paragraphs of your best writing into &quot;Example Content&quot; so the AI can match your style.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          STEP 2 — Generate key & copy setup prompt
          ============================================ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            2
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#111111]">Run the setup prompt</h2>
            <p className="text-[12px] text-[#888888]">2 minutes</p>
          </div>
        </div>

        <div className="ml-11">
          <div className="bg-[#111111] rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#88CCFF]" />
              <p className="text-[13px] font-medium text-[#888888]">Setup Prompt</p>
            </div>
            <p className="text-[14px] text-[#888888] leading-relaxed mb-5">
              One click generates your API key and copies a prompt that audits your site&apos;s SEO
              and builds your entire blog. Paste it into Cursor, Claude Code, or any AI coding agent.
            </p>

            {/* Prompt preview */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden mb-4">
              <div className="p-4 max-h-[130px] overflow-hidden relative">
                <pre className="text-[11px] text-[#888888] font-mono leading-relaxed whitespace-pre-wrap">{`## Part 1: Audit & Fix Existing Site SEO
- Every page: unique <title>, <meta description>, OG tags
- Fix heading hierarchy, add alt text, canonical URLs...

## Part 2: Add the Blog
- API Key: ${generatedKey || 'YOUR_API_KEY'} (included automatically)
- 16 component renderers, SEO metadata, sitemap, RSS feed...`}</pre>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
              </div>
            </div>

            {!generatedKey ? (
              <button
                onClick={generateAndCopy}
                disabled={isGenerating || isLoading}
                className="w-full text-[14px] font-semibold text-[#111111] bg-white px-8 py-3.5 rounded-full hover:bg-[#F0F0F0] disabled:bg-[#666666] disabled:text-[#999999] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#111111]" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate API key & copy prompt
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={copyPromptAgain}
                className="w-full text-[14px] font-semibold text-[#111111] bg-white px-8 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {promptCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy prompt again
                  </>
                )}
              </button>
            )}

            {error && <p className="text-[13px] text-red-400 mt-3">{error}</p>}
          </div>

          {/* Generated key */}
          {generatedKey && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <p className="text-[13px] font-medium text-emerald-700">API key generated & included in prompt</p>
              </div>
              <code className="block px-3 py-2 bg-[#111111] rounded-lg text-[12px] text-[#CCCCCC] font-mono overflow-x-auto">
                {generatedKey}
              </code>
              <p className="text-[11px] text-emerald-600 mt-1.5">
                The coding agent will create your .env.local file with this key automatically.
              </p>
            </div>
          )}

          {/* Existing keys note */}
          {!generatedKey && keys.length > 0 && !isLoading && (
            <p className="text-[12px] text-[#888888] mt-2">
              You have {keys.length} existing key{keys.length > 1 ? 's' : ''}. This will generate a new one and include it in the prompt.
            </p>
          )}

          <div className="bg-white border border-[#E0DED8] rounded-lg p-5 mt-3">
            <p className="text-sm font-medium text-[#111111] mb-2">The prompt will:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Fix SEO on all existing pages",
                "Create blog listing & post pages",
                "Build 16 component renderers",
                "Set up sitemap & RSS feed",
                "Add structured data & breadcrumbs",
                "Create robots.txt & .env.local",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-[13px] text-[#444444]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#F0F8FF] border border-[#C8DFF0] rounded-lg p-3 mt-3">
            <p className="text-[13px] text-[#2A6496]">
              <strong>Don&apos;t want to do this yourself?</strong>{' '}
              <a href="https://calendly.com/hello-vibeblogger/30min" target="_blank" rel="noopener noreferrer" className="text-[#2A6496] underline underline-offset-2 hover:text-[#1A4A6A]">Book a free setup call</a> and we&apos;ll do it with you.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          STEP 3 — Google Search Console
          ============================================ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            3
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#111111]">Submit to Google Search Console</h2>
            <p className="text-[12px] text-[#888888]">5 minutes — don&apos;t skip this</p>
          </div>
        </div>

        <div className="ml-11 space-y-3">
          <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-3">
            <p className="text-[13px] text-[#8B6914]">
              <strong>Why this matters:</strong> Without Search Console, Google may take weeks to find your blog. With it, pages can be indexed in 2-7 days.
            </p>
          </div>

          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <h4 className="text-sm font-semibold text-[#111111] mb-3">a. Add your site</h4>
            <ol className="space-y-2.5">
              <li className="flex gap-3">
                <span className="text-[13px] font-medium text-[#888888] shrink-0">1.</span>
                <p className="text-[13px] text-[#444444] leading-relaxed">
                  Go to <span className="font-medium text-[#111111]">search.google.com/search-console</span> and sign in.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-[13px] font-medium text-[#888888] shrink-0">2.</span>
                <p className="text-[13px] text-[#444444] leading-relaxed">
                  Click <strong>&quot;Add property&quot;</strong> → <strong>&quot;URL prefix&quot;</strong> → enter your domain.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-[13px] font-medium text-[#888888] shrink-0">3.</span>
                <div>
                  <p className="text-[13px] text-[#444444] leading-relaxed mb-2">
                    <strong>Verify ownership</strong> — pick whichever is easiest:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      { method: "HTML tag", desc: "Copy the meta tag into your root layout.tsx" },
                      { method: "DNS record", desc: "Add a TXT record to your DNS settings" },
                      { method: "HTML file", desc: "Download and put in your /public folder" },
                    ].map((v) => (
                      <div key={v.method} className="bg-[#FAFAF8] border border-[#E0DED8] rounded p-2.5">
                        <span className="text-[12px] font-medium text-[#111111]">{v.method}</span>
                        <span className="text-[12px] text-[#888888]"> — {v.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <h4 className="text-sm font-semibold text-[#111111] mb-3">b. Submit your sitemap</h4>
            <p className="text-[13px] text-[#444444] leading-relaxed">
              In Search Console, go to <strong>Sitemaps</strong> → enter <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-[11px]">blog/sitemap.xml</code> → click <strong>Submit</strong>.
            </p>
          </div>

          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <h4 className="text-sm font-semibold text-[#111111] mb-3">c. Request indexing</h4>
            <p className="text-[13px] text-[#444444] leading-relaxed">
              Paste your blog URL into the <strong>URL Inspection</strong> bar → click <strong>&quot;Request Indexing&quot;</strong>.
              Do this for the blog listing page and your first few posts. Google indexes them within <strong>2-7 days</strong>.
              The sitemap handles new posts automatically going forward.
            </p>
          </div>

          <div className="bg-[#F0FFF0] border border-[#C0E8C0] rounded-lg p-3">
            <p className="text-[13px] text-[#2A6B2A]">
              <strong>What to expect:</strong> Indexing in 2-7 days. Rankings in 2-8 weeks. Meaningful traffic over 2-6 months.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          STEP 4 — Strategy & Content
          ============================================ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            4
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#111111]">Strategise & queue your content</h2>
            <p className="text-[12px] text-[#888888]">5 minutes</p>
          </div>
        </div>

        <div className="ml-11 space-y-3">
          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <p className="text-sm text-[#666666] leading-relaxed mb-3">
              Open the <strong>Chat</strong> panel on the right side of your dashboard. Have a conversation about your SEO direction — it knows your niche, your competitors, and where the opportunities are.
            </p>

            <p className="text-sm font-medium text-[#111111] mb-2">Example prompts:</p>
            <div className="space-y-2">
              {[
                "Research my niche and find the best keyword opportunities",
                "Analyse my top 3 competitors and find content gaps",
                "Queue 40 blog posts targeting a mix of high-volume and long-tail keywords",
              ].map((prompt) => (
                <div key={prompt} className="bg-[#1A1A1A] rounded-lg p-3">
                  <p className="text-[12px] text-[#88CCFF] font-mono">&quot;{prompt}&quot;</p>
                </div>
              ))}
            </div>

            <p className="text-[13px] text-[#666666] leading-relaxed mt-3">
              Posts start generating immediately once topics are queued.
            </p>
          </div>

          <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-3">
            <p className="text-[13px] text-[#8B6914]">
              <strong>Tip:</strong> Don&apos;t just queue topics — have a real conversation about strategy. Ask which keywords are realistic to rank for and what order to publish in.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          STEP 5 — Enable Agents
          ============================================ */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            5
          </div>
          <div>
            <h2 className="text-lg font-medium text-[#111111]">Enable your agents</h2>
            <p className="text-[12px] text-[#888888]">1 minute</p>
          </div>
        </div>

        <div className="ml-11">
          <div className="bg-white border border-[#E0DED8] rounded-lg p-5">
            <p className="text-sm text-[#666666] leading-relaxed mb-3">
              Go to the <strong>Agents</strong> tab in your dashboard. Enable the agents that keep your blog growing:
            </p>

            <div className="space-y-2">
              {[
                {
                  name: "Weekly Backlink Monitor",
                  desc: "Finds backlink opportunities and tracks domain authority",
                  recommended: true,
                },
                {
                  name: "Weekly Topic Research",
                  desc: "Finds trending topics and keeps your queue full",
                  recommended: true,
                },
                {
                  name: "SEO Audit",
                  desc: "Reviews posts for SEO issues and suggests improvements",
                  recommended: false,
                },
              ].map((agent) => (
                <div key={agent.name} className="bg-[#FAFAF8] border border-[#E0DED8] rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[#111111]">{agent.name}</p>
                    <p className="text-[12px] text-[#888888]">{agent.desc}</p>
                  </div>
                  {agent.recommended && (
                    <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0 ml-3">
                      Recommended
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          Done
          ============================================ */}
      <div className="border-t border-[#E0DED8] pt-10 mt-10">
        <div className="bg-[#111111] text-white rounded-xl p-8 text-center">
          <h2 className="font-lora text-[24px] font-normal mb-3">
            You&apos;re done.
          </h2>
          <p className="text-[14px] text-[#888888] leading-relaxed max-w-[420px] mx-auto mb-6">
            Your SEO is cleaned up. Your blog is live. Google is indexing.
            Your agents are running. Check back in a few hours — your first posts will be ready.
          </p>
          <Link
            href="/blog/admin"
            className="text-[14px] font-semibold text-[#111111] bg-white px-8 py-3 rounded-full hover:bg-[#F0F0F0] transition-colors inline-flex items-center gap-2"
          >
            Go to dashboard
          </Link>
        </div>
      </div>

      {/* Help */}
      <div className="mt-8 bg-white border border-[#E0DED8] rounded-lg p-5">
        <p className="text-sm text-[#666666]">
          <strong className="text-[#111111]">Need help?</strong>{' '}
          <a href="https://calendly.com/hello-vibeblogger/30min" target="_blank" rel="noopener noreferrer" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">Book a free setup call</a> or email{' '}
          <a href="mailto:support@vibeblogger.io" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">support@vibeblogger.io</a>.
        </p>
      </div>
    </div>
  );
}
