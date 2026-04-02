"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  FileText,
  Image,
  MessageSquare,
  Quote,
  MousePointer,
  Video,
  Table,
  BarChart3,
  LineChart,
  PieChart,
  GitCompare,
  ThumbsUp,
  Clock,
  GitBranch,
  ListOrdered,
  Terminal,
  Key,
  Zap,
  X,
} from 'lucide-react';
import { SETUP_PROMPT, getSetupPrompt } from '@/lib/setup-prompt';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [promptGenerated, setPromptGenerated] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-[#111111] rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-[#CCCCCC]">{code}</code>
      </pre>
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 p-2 bg-[#222222] hover:bg-[#333333] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-[#888888]" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
            Vibeblogger
          </Link>
          <span className="text-[#CCCCCC]">/</span>
          <span className="text-[#666666] text-sm">Documentation</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/blog/admin" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Dashboard
          </Link>
          <Link href="/blog/admin/api-keys" className="text-sm font-semibold text-white bg-[#111111] px-6 py-2.5 rounded-full hover:bg-[#333333] transition-colors hidden sm:block">
            Get API Key
          </Link>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      <div className="max-w-[800px] mx-auto px-8 py-16">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-6">
            API Documentation
          </p>
          <h1 className="font-lora text-[36px] sm:text-[48px] font-normal leading-[1.15] tracking-[-0.02em] mb-5">
            Integrate Vibeblogger<br />into your app
          </h1>
          <p className="text-lg text-[#666666] leading-[1.7] max-w-[520px]">
            Fetch your blog content via API and render it with your own components. Works with Next.js, Remix, Astro, or any frontend.
          </p>
        </div>

        {/* Setup Prompt Generator */}
        <section className="mb-16" id="setup-prompt">
          <div className="bg-[#111111] rounded-2xl p-8 sm:p-10 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-[#88CCFF]" />
              <h2 className="font-lora text-[24px] sm:text-[28px] font-normal">Setup Prompt Generator</h2>
            </div>
            <p className="text-[15px] text-[#888888] leading-relaxed mb-8 max-w-[520px]">
              Paste your API key below. We&apos;ll generate a single prompt that audits your site&apos;s SEO and builds your entire blog. Paste it into Cursor, Claude Code, or any AI coding agent.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#666666] uppercase tracking-[0.1em] block mb-2">
                  Your API Key
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); setPromptGenerated(false); }}
                      placeholder="vb_live_your_key_here"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-11 pr-4 py-3 text-[14px] text-white font-mono placeholder:text-[#444444] focus:outline-none focus:border-[#88CCFF] transition-colors"
                    />
                  </div>
                  <Link
                    href="/blog/admin/api-keys"
                    className="text-[13px] font-medium text-[#88CCFF] bg-[#1A1A1A] border border-[#2A2A2A] px-5 py-3 rounded-lg hover:bg-[#222222] transition-colors shrink-0 inline-flex items-center gap-2"
                  >
                    Get API Key
                  </Link>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const prompt = getSetupPrompt(apiKey || undefined);
                    navigator.clipboard.writeText(prompt);
                    setPromptGenerated(true);
                    setPromptCopied(true);
                    setTimeout(() => setPromptCopied(false), 2000);
                  }}
                  className="text-[14px] font-semibold text-[#111111] bg-white px-8 py-3 rounded-full hover:bg-[#F0F0F0] transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {promptCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied to clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {promptGenerated ? 'Copy again' : 'Generate & copy prompt'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPromptModal(true)}
                  className="text-[13px] font-medium text-[#888888] hover:text-white transition-colors inline-flex items-center cursor-pointer"
                >
                  Preview prompt &rarr;
                </button>
              </div>

              {promptGenerated && (
                <p className="text-[13px] text-[#666666]">
                  {apiKey ? (
                    <>Prompt generated with your API key baked in. Paste it into your coding agent.</>
                  ) : (
                    <>Prompt copied without an API key. You&apos;ll need to add it to your .env.local manually.</>
                  )}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Prompt preview modal */}
        {showPromptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPromptModal(false)} />
            <div className="relative bg-[#111111] rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#333333]" />
                    <div className="w-3 h-3 rounded-full bg-[#333333]" />
                    <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  </div>
                  <span className="text-[13px] text-[#666666] font-mono">setup-prompt.md</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getSetupPrompt(apiKey || undefined));
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 2000);
                    }}
                    className="text-[12px] font-medium text-white bg-[#2A2A2A] px-4 py-1.5 rounded-full hover:bg-[#3A3A3A] transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-[#3A3A3A]"
                  >
                    {promptCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy all
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPromptModal(false)}
                    className="text-[#666666] hover:text-white transition-colors cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-6">
                <pre className="text-[13px] text-[#AAAAAA] font-mono leading-relaxed whitespace-pre-wrap">
                  {getSetupPrompt(apiKey || undefined)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* Quick Start */}
        <section className="mb-16" id="quick-start">
          <h2 className="font-lora text-[28px] font-normal mb-8">Quick Start</h2>

          <div className="space-y-6">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">1. Get your API key</h3>
              <p className="text-sm text-[#666666] leading-relaxed">
                Go to your <Link href="/blog/admin/api-keys" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">API Keys dashboard</Link> and generate a new key.
              </p>
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">2. Store it in your environment</h3>
              <CodeBlock
                id="env"
                code={`# .env.local
VIBEBLOGGER_API_KEY=vb_live_your_key_here`}
              />
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">3. Fetch your posts</h3>
              <CodeBlock
                id="fetch"
                code={`const response = await fetch('https://vibeblogger.io/api/v1/posts', {
  headers: {
    'Authorization': \`Bearer \${process.env.VIBEBLOGGER_API_KEY}\`
  }
});

const { posts } = await response.json();`}
              />
            </div>
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* API Reference */}
        <section className="mb-16" id="api-reference">
          <h2 className="font-lora text-[28px] font-normal mb-8">API Reference</h2>

          <div className="space-y-6">
            {/* Authentication */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Authentication</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                All API requests require authentication via API key. Include it in the request headers:
              </p>
              <CodeBlock
                id="auth"
                code={`// Option 1: Authorization header (recommended)
Authorization: Bearer vb_live_your_key_here

// Option 2: X-API-Key header
X-API-Key: vb_live_your_key_here`}
              />
            </div>

            {/* List Posts */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-[#E8F5E8] text-[#1B7A1B] text-xs font-mono rounded">GET</span>
                <code className="text-[#111111] font-mono text-sm">/api/v1/posts</code>
              </div>
              <p className="text-sm text-[#666666] mb-4">List all published blog posts.</p>

              <h4 className="text-sm font-medium text-[#111111] mb-2">Query Parameters</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E0DED8]">
                      <th className="text-left py-2 text-[#888888] font-medium">Parameter</th>
                      <th className="text-left py-2 text-[#888888] font-medium">Type</th>
                      <th className="text-left py-2 text-[#888888] font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#444444]">
                    <tr className="border-b border-[#F0EEE8]">
                      <td className="py-2 font-mono text-[#111111]">page</td>
                      <td className="py-2">number</td>
                      <td className="py-2">Page number (default: 1)</td>
                    </tr>
                    <tr className="border-b border-[#F0EEE8]">
                      <td className="py-2 font-mono text-[#111111]">limit</td>
                      <td className="py-2">number</td>
                      <td className="py-2">Posts per page (default: 10, max: 100)</td>
                    </tr>
                    <tr className="border-b border-[#F0EEE8]">
                      <td className="py-2 font-mono text-[#111111]">category</td>
                      <td className="py-2">string</td>
                      <td className="py-2">Filter by category</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-[#111111]">tag</td>
                      <td className="py-2">string</td>
                      <td className="py-2">Filter by tag</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-medium text-[#111111] mb-2">Response</h4>
              <CodeBlock
                id="list-response"
                code={`{
  "posts": [
    {
      "_id": "...",
      "title": "My Blog Post",
      "slug": "my-blog-post",
      "description": "A short description...",
      "featuredImage": "https://...",
      "status": "published",
      "publishedAt": "2024-01-15T...",
      "readTime": 5,
      "tags": ["tech", "ai"],
      "author": {
        "name": "John Doe",
        "imageUrl": "https://..."
      },
      "components": [
        { "type": "rich_text", "content": "..." },
        { "type": "image", "url": "...", "alt": "..." }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasMore": true
  }
}`}
              />
            </div>

            {/* Get Single Post */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-[#E8F5E8] text-[#1B7A1B] text-xs font-mono rounded">GET</span>
                <code className="text-[#111111] font-mono text-sm">/api/v1/posts/:slug</code>
              </div>
              <p className="text-sm text-[#666666] mb-4">Get a single blog post by its slug.</p>

              <h4 className="text-sm font-medium text-[#111111] mb-2">Response</h4>
              <CodeBlock
                id="single-response"
                code={`{
  "post": {
    "_id": "...",
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "description": "A short description...",
    "featuredImage": "https://...",
    "components": [...],
    // ... full post data
  }
}`}
              />
            </div>

            {/* Rate Limits */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Rate Limits</h3>
              <p className="text-sm text-[#666666] mb-4">
                API requests are rate limited to <strong className="text-[#111111]">1,000 requests per hour</strong> per API key.
              </p>
              <p className="text-sm text-[#666666] mb-3">Rate limit headers are included in every response:</p>
              <CodeBlock
                id="rate-headers"
                code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705123456789`}
              />
            </div>
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* Component Types */}
        <section className="mb-16" id="components">
          <h2 className="font-lora text-[28px] font-normal mb-4">Component Types</h2>
          <p className="text-sm text-[#666666] leading-relaxed mb-8">
            Blog posts are made up of components. Each component has a <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">type</code> and type-specific fields.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { type: 'rich_text', icon: FileText, fields: 'content (Markdown string)', desc: 'Rich text content — requires markdown parsing' },
              { type: 'image', icon: Image, fields: 'url, alt, caption, width, height', desc: 'Image with optional caption' },
              { type: 'callout', icon: MessageSquare, fields: 'variant, title, content', desc: 'Highlighted box (info/success/warning/error)' },
              { type: 'quote', icon: Quote, fields: 'content, author, citation', desc: 'Blockquote with attribution' },
              { type: 'cta', icon: MousePointer, fields: 'text, link, style', desc: 'Call-to-action button' },
              { type: 'video', icon: Video, fields: 'videoUrl, thumbnail, videoTitle', desc: 'Embedded video' },
              { type: 'table', icon: Table, fields: 'headers, rows, tableCaption', desc: 'Data table' },
              { type: 'bar_chart', icon: BarChart3, fields: 'data.labels, data.datasets', desc: 'Bar chart visualization' },
              { type: 'line_chart', icon: LineChart, fields: 'data.labels, data.datasets', desc: 'Line chart visualization' },
              { type: 'pie_chart', icon: PieChart, fields: 'data.labels, data.values', desc: 'Pie chart visualization' },
              { type: 'comparison_table', icon: GitCompare, fields: 'data.items, data.features', desc: 'Feature comparison table' },
              { type: 'pros_cons', icon: ThumbsUp, fields: 'data.pros, data.cons', desc: 'Pros and cons list' },
              { type: 'timeline', icon: Clock, fields: 'data.events', desc: 'Timeline of events' },
              { type: 'flowchart', icon: GitBranch, fields: 'data.nodes, data.edges', desc: 'Process flowchart' },
              { type: 'step_by_step', icon: ListOrdered, fields: 'data.steps', desc: 'Numbered steps guide' },
              { type: 'code_block', icon: Terminal, fields: 'content, data.language', desc: 'Syntax-highlighted code' },
            ].map(({ type, icon: Icon, fields, desc }) => (
              <div key={type} className="bg-white border border-[#E0DED8] rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-4 h-4 text-[#888888]" />
                  <code className="text-[#111111] font-mono text-sm">{type}</code>
                </div>
                <p className="text-sm text-[#666666] mb-1">{desc}</p>
                <p className="text-xs text-[#AAAAAA]">Fields: {fields}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* React Components */}
        <section className="mb-16" id="react-components">
          <h2 className="font-lora text-[28px] font-normal mb-4">React Component Library</h2>
          <p className="text-sm text-[#666666] leading-relaxed mb-6">
            Copy this component renderer into your project to render all blog component types:
          </p>

          <div className="bg-[#FFF8E8] border border-[#E8DCC0] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#8B6914]">
              <strong>Important:</strong> The <code className="bg-[#F0E8D0] px-1 rounded text-xs">rich_text</code> component contains Markdown, not HTML.
              You need to parse it using a library like <code className="bg-[#F0E8D0] px-1 rounded text-xs">react-markdown</code>.
            </p>
            <p className="text-sm text-[#8B6914] mt-2 opacity-80">
              Install: <code className="bg-[#F0E8D0] px-1 rounded text-xs">npm install react-markdown</code>
            </p>
          </div>

          <CodeBlock
            id="react-lib"
            code={`// components/BlogRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown'; // npm install react-markdown

interface BlogComponent {
  _id: string;
  type: string;
  order: number;
  content?: string;
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  author?: string;
  citation?: string;
  text?: string;
  link?: string;
  style?: 'primary' | 'secondary' | 'outline';
  videoUrl?: string;
  videoTitle?: string;
  headers?: string[];
  rows?: string[][];
  tableCaption?: string;
  data?: any;
}

// Main renderer - renders a single component
export function BlogComponentRenderer({ component }: { component: BlogComponent }) {
  switch (component.type) {
    case 'rich_text':
      return (
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{component.content || ''}</ReactMarkdown>
        </div>
      );

    case 'image':
      return (
        <figure className="my-8">
          <img
            src={component.url || component.src}
            alt={component.alt || ''}
            className="w-full rounded-lg"
          />
          {component.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {component.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'callout':
      const variantStyles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800',
      };
      return (
        <div className={\`p-4 rounded-lg border \${variantStyles[component.variant || 'info']} my-6\`}>
          {component.title && <strong className="block mb-1">{component.title}</strong>}
          <ReactMarkdown>{component.content || ''}</ReactMarkdown>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 my-6 italic">
          <ReactMarkdown>{component.content || ''}</ReactMarkdown>
          {component.author && (
            <cite className="block mt-2 text-sm text-gray-600 not-italic">
              — {component.author}
              {component.citation && <span>, {component.citation}</span>}
            </cite>
          )}
        </blockquote>
      );

    case 'cta':
      const buttonStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
      };
      return (
        <div className="my-8 text-center">
          <a
            href={component.link}
            className={\`inline-block px-6 py-3 rounded-lg font-semibold transition-colors \${buttonStyles[component.style || 'primary']}\`}
          >
            {component.text}
          </a>
        </div>
      );

    case 'video':
      const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.match(/(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|watch\\?v=))([^&?]+)/)?.[1];
          return \`https://www.youtube.com/embed/\${videoId}\`;
        }
        if (url.includes('vimeo.com')) {
          const videoId = url.match(/vimeo\\.com\\/(?:video\\/)?(\\d+)/)?.[1];
          return \`https://player.vimeo.com/video/\${videoId}\`;
        }
        return url;
      };
      return (
        <div className="my-8 aspect-video">
          <iframe
            src={getEmbedUrl(component.videoUrl || '')}
            title={component.videoTitle || 'Video'}
            className="w-full h-full rounded-lg"
            allowFullScreen
          />
        </div>
      );

    case 'table':
      return (
        <div className="my-8 overflow-x-auto">
          <table className="w-full border-collapse">
            {component.headers && (
              <thead>
                <tr className="bg-gray-100">
                  {component.headers.map((header, i) => (
                    <th key={i} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {component.rows?.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-300 px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {component.tableCaption && (
            <p className="text-center text-sm text-gray-500 mt-2">{component.tableCaption}</p>
          )}
        </div>
      );

    case 'code_block':
      return (
        <pre className="my-6 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
          <code>{component.content}</code>
        </pre>
      );

    case 'pros_cons':
      return (
        <div className="my-8 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Pros</h4>
            <ul className="space-y-1">
              {component.data?.pros?.map((pro: string, i: number) => (
                <li key={i} className="text-green-700">{pro}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Cons</h4>
            <ul className="space-y-1">
              {component.data?.cons?.map((con: string, i: number) => (
                <li key={i} className="text-red-700">{con}</li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'step_by_step':
      return (
        <div className="my-8 space-y-4">
          {component.data?.steps?.map((step: { title: string; content: string }, i: number) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {i + 1}
              </div>
              <div>
                <h4 className="font-semibold">{step.title}</h4>
                <p className="text-gray-600">{step.content}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <div className="my-8 border-l-2 border-gray-300 pl-4 space-y-6">
          {component.data?.events?.map((event: { date: string; title: string; content: string }, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-6 w-3 h-3 bg-blue-600 rounded-full" />
              <time className="text-sm text-gray-500">{event.date}</time>
              <h4 className="font-semibold">{event.title}</h4>
              <p className="text-gray-600">{event.content}</p>
            </div>
          ))}
        </div>
      );

    default:
      console.warn(\`Unknown component type: \${component.type}\`);
      return null;
  }
}

// Render all components for a post
export function BlogContent({ components }: { components: BlogComponent[] }) {
  return (
    <div className="blog-content">
      {components
        .sort((a, b) => a.order - b.order)
        .map((component) => (
          <BlogComponentRenderer key={component._id} component={component} />
        ))}
    </div>
  );
}`}
          />
        </section>

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* Full Example */}
        <section className="mb-16" id="full-example">
          <h2 className="font-lora text-[28px] font-normal mb-4">Full Integration Example</h2>
          <p className="text-sm text-[#666666] leading-relaxed mb-6">
            Here's a complete Next.js App Router integration:
          </p>

          <div className="space-y-6">
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="font-mono text-sm text-[#888888] mb-3">lib/blog.ts</h4>
              <CodeBlock
                id="full-lib"
                code={`const API_URL = 'https://vibeblogger.io/api/v1';

export async function getBlogPosts(page = 1, limit = 10) {
  const res = await fetch(
    \`\${API_URL}/posts?page=\${page}&limit=\${limit}\`,
    {
      headers: {
        'Authorization': \`Bearer \${process.env.VIBEBLOGGER_API_KEY}\`
      },
      next: { revalidate: 60 } // Revalidate every 60 seconds
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }

  return res.json();
}

export async function getBlogPost(slug: string) {
  const res = await fetch(
    \`\${API_URL}/posts/\${slug}\`,
    {
      headers: {
        'Authorization': \`Bearer \${process.env.VIBEBLOGGER_API_KEY}\`
      },
      next: { revalidate: 60 }
    }
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch post');
  }

  return res.json();
}`}
              />
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="font-mono text-sm text-[#888888] mb-3">app/blog/page.tsx</h4>
              <CodeBlock
                id="full-list"
                code={`import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog';

export default async function BlogPage() {
  const { posts, pagination } = await getBlogPosts();

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="grid gap-8">
        {posts.map((post) => (
          <article key={post._id} className="border-b pb-8">
            <Link href={\`/blog/\${post.slug}\`}>
              {post.featuredImage && (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-2xl font-semibold hover:text-blue-600">
                {post.title}
              </h2>
              <p className="text-gray-600 mt-2">{post.description}</p>
              <div className="flex gap-2 mt-3">
                {post.tags?.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-sm rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </article>
        ))}
      </div>

      {pagination.hasMore && (
        <Link
          href={\`/blog?page=\${pagination.page + 1}\`}
          className="mt-8 inline-block text-blue-600 hover:underline"
        >
          Load more posts
        </Link>
      )}
    </main>
  );
}`}
              />
            </div>

            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h4 className="font-mono text-sm text-[#888888] mb-3">app/blog/[slug]/page.tsx</h4>
              <CodeBlock
                id="full-post"
                code={`import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/blog';
import { BlogContent } from '@/components/BlogRenderer';

export default async function PostPage({
  params
}: {
  params: { slug: string }
}) {
  const data = await getBlogPost(params.slug);

  if (!data) {
    notFound();
  }

  const { post } = data;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-xl text-gray-600">{post.description}</p>

        {post.author && (
          <div className="flex items-center gap-3 mt-6">
            {post.author.imageUrl && (
              <img
                src={post.author.imageUrl}
                alt={post.author.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-medium">{post.author.name}</span>
          </div>
        )}
      </header>

      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full rounded-lg mb-8"
        />
      )}

      <BlogContent components={post.components} />
    </article>
  );
}`}
              />
            </div>
          </div>
        </section>

        <div className="border-b border-[#E0DED8] mb-16" />

        {/* SEO & Discovery */}
        <section className="mb-16" id="seo">
          <h2 className="font-lora text-[28px] font-normal mb-4">SEO &amp; Discovery</h2>
          <p className="text-sm text-[#666666] leading-relaxed mb-6">
            Make your blog pages rank. The API returns <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">seoTitle</code> and <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">seoDescription</code> fields — use these for metadata when available, falling back to <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">title</code> and <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">description</code>.
          </p>

          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Page Metadata</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Use <code className="text-[#111111] bg-[#F0EEE8] px-1.5 py-0.5 rounded text-xs">generateMetadata</code> for dynamic SEO tags on each post page:
              </p>
              <CodeBlock
                id="seo-metadata"
                code={`// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { getBlogPost } from '@/lib/blog';

export async function generateMetadata({
  params
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const data = await getBlogPost(params.slug);
  if (!data) return { title: 'Post Not Found' };

  const { post } = data;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.description;
  const url = \`https://yourdomain.com/blog/\${post.slug}\`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      images: post.featuredImage ? [post.featuredImage] : [],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}`}
              />
            </div>

            {/* JSON-LD */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Structured Data (JSON-LD)</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Add BlogPosting schema to get rich results in Google:
              </p>
              <CodeBlock
                id="seo-jsonld"
                code={`// Add this inside your post page component's return:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.seoTitle || post.title,
      description: post.seoDescription || post.description,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: post.author?.name,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Your Site Name',
        logo: {
          '@type': 'ImageObject',
          url: 'https://yourdomain.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': \`https://yourdomain.com/blog/\${post.slug}\`,
      },
    }),
  }}
/>`}
              />
            </div>

            {/* Static Params */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Static Generation (ISR)</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Pre-build post pages at build time and revalidate periodically:
              </p>
              <CodeBlock
                id="seo-static-params"
                code={`// app/blog/[slug]/page.tsx
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const { posts } = await getBlogPosts(1, 100);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}`}
              />
            </div>

            {/* Sitemap */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">Dynamic Sitemap</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Auto-generate a sitemap that includes all your blog posts:
              </p>
              <CodeBlock
                id="seo-sitemap"
                code={`// app/blog/sitemap.ts
import { MetadataRoute } from 'next';
import { getBlogPosts } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getBlogPosts(1, 100);

  return posts.map((post) => ({
    url: \`https://yourdomain.com/blog/\${post.slug}\`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}`}
              />
            </div>

            {/* RSS Feed */}
            <div className="bg-white border border-[#E0DED8] rounded-lg p-6">
              <h3 className="font-lora text-lg font-normal mb-3">RSS Feed</h3>
              <p className="text-sm text-[#666666] leading-relaxed mb-4">
                Add an RSS feed for subscribers and syndication:
              </p>
              <CodeBlock
                id="seo-rss"
                code={`// app/blog/feed.xml/route.ts
import { getBlogPosts } from '@/lib/blog';

export async function GET() {
  const { posts } = await getBlogPosts(1, 50);

  const items = posts.map((post) => \`
    <item>
      <title><![CDATA[\${post.title}]]></title>
      <link>https://yourdomain.com/blog/\${post.slug}</link>
      <description><![CDATA[\${post.description}]]></description>
      <pubDate>\${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid>https://yourdomain.com/blog/\${post.slug}</guid>
    </item>\`).join('');

  const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Your Blog</title>
    <link>https://yourdomain.com/blog</link>
    <description>Your blog description</description>
    \${items}
  </channel>
</rss>\`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml' },
  });
}`}
              />
            </div>
          </div>
        </section>

        {/* Help */}
        <section className="bg-white border border-[#E0DED8] rounded-lg p-6 mb-16">
          <h3 className="font-lora text-lg font-normal mb-2">Need help?</h3>
          <p className="text-sm text-[#666666]">
            If you have questions or run into issues, reach out at{' '}
            <a href="mailto:support@vibeblogger.io" className="text-[#111111] underline underline-offset-2 hover:text-[#444444]">
              support@vibeblogger.io
            </a>
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mx-8 border-b border-[#E0DED8]" />
      <footer className="px-8 py-8 text-center">
        <p className="text-[13px] text-[#AAAAAA]">vibeblogger.io</p>
      </footer>
    </div>
  );
}
