"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, ChevronLeft, Key, Zap, ExternalLink } from 'lucide-react';
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
      // Generate a new API key
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

      // Copy prompt with the key baked in
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

  const copyPromptWithExistingKey = async () => {
    // For users who already generated — copy again with the key
    if (generatedKey) {
      const prompt = getSetupPrompt(generatedKey);
      await navigator.clipboard.writeText(prompt);
    }
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

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
          One click generates your API key and copies the setup prompt.
          Paste it into Cursor, Claude Code, or any AI coding agent — it does the rest.
        </p>
      </div>

      {/* Main action */}
      <div className="bg-[#111111] rounded-2xl p-8 sm:p-10 text-white mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-[#88CCFF]" />
          <h2 className="font-lora text-[22px] font-normal">Setup Prompt</h2>
        </div>
        <p className="text-[14px] text-[#888888] leading-relaxed mb-6">
          This prompt audits your site&apos;s SEO, creates your blog pages,
          sets up 16 component renderers, sitemap, RSS feed, and structured data.
          Your API key is included so the coding agent can set up everything automatically.
        </p>

        {/* Prompt preview */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden mb-5">
          <div className="p-4 max-h-[160px] overflow-hidden relative">
            <pre className="text-[12px] text-[#AAAAAA] font-mono leading-relaxed whitespace-pre-wrap">{`I want to add a blog to my site using the Vibeblogger API.
Before creating the blog, audit and fix the SEO on my existing site.

## Part 1: Audit & Fix Existing Site SEO
- Every page must have unique <title> and <meta description>
- Add Open Graph and Twitter card metadata to every page
- Add canonical URLs, proper heading hierarchy, alt text...

## Part 2: Add the Blog
- API Key: ${generatedKey || 'YOUR_API_KEY'} (included automatically)
- 16 component renderers, SEO metadata, sitemap, RSS feed...`}</pre>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
          </div>
        </div>

        {!generatedKey ? (
          <button
            onClick={generateAndCopy}
            disabled={isGenerating || isLoading}
            className="w-full text-[15px] font-semibold text-[#111111] bg-white px-8 py-4 rounded-full hover:bg-[#F0F0F0] disabled:bg-[#666666] disabled:text-[#999999] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#111111]" />
                Generating key & copying prompt...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate API key & copy setup prompt
              </>
            )}
          </button>
        ) : (
          <button
            onClick={copyPromptWithExistingKey}
            className="w-full text-[15px] font-semibold text-[#111111] bg-white px-8 py-4 rounded-full hover:bg-[#F0F0F0] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {promptCopied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied to clipboard
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy setup prompt again
              </>
            )}
          </button>
        )}

        {error && (
          <p className="text-[13px] text-red-400 mt-3">{error}</p>
        )}
      </div>

      {/* Generated key display */}
      {generatedKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">API key generated & included in prompt</p>
          </div>
          <code className="block px-3 py-2 bg-[#111111] rounded-lg text-[13px] text-[#CCCCCC] font-mono overflow-x-auto">
            {generatedKey}
          </code>
          <p className="text-[12px] text-emerald-600 mt-2">
            This key is baked into the prompt you just copied. The coding agent will create your <code className="bg-emerald-100 px-1 py-0.5 rounded">.env.local</code> file with it automatically.
          </p>
        </div>
      )}

      {/* Existing keys note */}
      {!generatedKey && keys.length > 0 && !isLoading && (
        <div className="bg-white border border-[#E0DED8] rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F5F4F0] rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-[#888888]" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">
                You already have {keys.length} API key{keys.length > 1 ? 's' : ''}. Clicking the button above will generate a new one and include it in the prompt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What to do next */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-[#111111] mb-1">What to do next</h2>
        <p className="text-[13px] text-[#888888] mb-4">After the coding agent finishes setting up your blog:</p>
        <div className="space-y-3">
          <div className="bg-white border border-[#E0DED8] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#111111] text-white rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0">1</div>
              <div>
                <p className="text-sm font-medium text-[#111111]">Chat with your strategist</p>
                <p className="text-[13px] text-[#888888]">Open the chat in your dashboard. Research keywords and queue ~40 posts.</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E0DED8] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#111111] text-white rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0">2</div>
              <div>
                <p className="text-sm font-medium text-[#111111]">Enable agents</p>
                <p className="text-[13px] text-[#888888]">Turn on the weekly backlink monitor and topic research agents.</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E0DED8] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#111111] text-white rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0">3</div>
              <div>
                <p className="text-sm font-medium text-[#111111]">Submit to Google Search Console</p>
                <p className="text-[13px] text-[#888888]">Add your site, submit your sitemap, and request indexing. <Link href="/guide" className="text-[#111111] underline underline-offset-2">Full guide here.</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
