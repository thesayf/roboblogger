"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  Book,
  Key,
  Code,
  Layers,
  Copy,
  Check,
  ChevronRight,
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
  Sparkles
} from 'lucide-react';

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = 'javascript', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-slate-300">{code}</code>
      </pre>
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">RoboBlogger</span>
            <span className="text-slate-500 mx-2">/</span>
            <span className="text-slate-300">Documentation</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog/admin" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/blog/admin/api-keys" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors text-sm">
              <Key className="w-4 h-4" />
              Get API Key
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">API Documentation</h1>
          <p className="text-xl text-slate-400 max-w-2xl">
            Integrate RoboBlogger into your website. Fetch your blog content via API and render it with your own components.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16" id="quick-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quick Start</h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">1. Get your API key</h3>
              <p className="text-slate-400 mb-4">
                Go to your <Link href="/blog/admin/api-keys" className="text-violet-400 hover:underline">API Keys dashboard</Link> and generate a new key.
              </p>
            </div>

            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">2. Store it in your environment</h3>
              <CodeBlock
                id="env"
                code={`# .env.local
ROBOBLOGGER_API_KEY=rb_live_your_key_here`}
              />
            </div>

            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">3. Fetch your posts</h3>
              <CodeBlock
                id="fetch"
                code={`const response = await fetch('https://roboblogger.vercel.app/api/v1/posts', {
  headers: {
    'Authorization': \`Bearer \${process.env.ROBOBLOGGER_API_KEY}\`
  }
});

const { posts } = await response.json();`}
              />
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16" id="api-reference">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">API Reference</h2>
          </div>

          <div className="space-y-6">
            {/* Authentication */}
            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
              <p className="text-slate-400 mb-4">
                All API requests require authentication via API key. Include it in the request headers:
              </p>
              <CodeBlock
                id="auth"
                code={`// Option 1: Authorization header (recommended)
Authorization: Bearer rb_live_your_key_here

// Option 2: X-API-Key header
X-API-Key: rb_live_your_key_here`}
              />
            </div>

            {/* List Posts */}
            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded">GET</span>
                <code className="text-white font-mono">/api/v1/posts</code>
              </div>
              <p className="text-slate-400 mb-4">List all published blog posts.</p>

              <h4 className="text-sm font-semibold text-slate-300 mb-2">Query Parameters</h4>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 text-slate-400 font-medium">Parameter</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Type</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/5">
                      <td className="py-2 font-mono text-violet-400">page</td>
                      <td className="py-2">number</td>
                      <td className="py-2">Page number (default: 1)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 font-mono text-violet-400">limit</td>
                      <td className="py-2">number</td>
                      <td className="py-2">Posts per page (default: 10, max: 100)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 font-mono text-violet-400">category</td>
                      <td className="py-2">string</td>
                      <td className="py-2">Filter by category</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-violet-400">tag</td>
                      <td className="py-2">string</td>
                      <td className="py-2">Filter by tag</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-semibold text-slate-300 mb-2">Response</h4>
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
            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded">GET</span>
                <code className="text-white font-mono">/api/v1/posts/:slug</code>
              </div>
              <p className="text-slate-400 mb-4">Get a single blog post by its slug.</p>

              <h4 className="text-sm font-semibold text-slate-300 mb-2">Response</h4>
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
            <div className="p-6 bg-slate-800/30 border border-white/10 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Rate Limits</h3>
              <p className="text-slate-400 mb-4">
                API requests are rate limited to <strong className="text-white">1,000 requests per hour</strong> per API key.
              </p>
              <p className="text-slate-400 mb-2">Rate limit headers are included in every response:</p>
              <CodeBlock
                id="rate-headers"
                code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705123456789`}
              />
            </div>
          </div>
        </section>

        {/* Component Types */}
        <section className="mb-16" id="components">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Component Types</h2>
          </div>

          <p className="text-slate-400 mb-6">
            Blog posts are made up of components. Each component has a <code className="text-violet-400">type</code> and type-specific fields.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { type: 'rich_text', icon: FileText, fields: 'content (HTML string)', desc: 'Rich text content with formatting' },
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
              <div key={type} className="p-4 bg-slate-800/30 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-violet-400" />
                  <code className="text-white font-mono text-sm">{type}</code>
                </div>
                <p className="text-slate-400 text-sm mb-2">{desc}</p>
                <p className="text-xs text-slate-500">Fields: {fields}</p>
              </div>
            ))}
          </div>
        </section>

        {/* React Components */}
        <section className="mb-16" id="react-components">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Code className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">React Component Library</h2>
          </div>

          <p className="text-slate-400 mb-6">
            Copy this component renderer into your project to render all blog component types:
          </p>

          <CodeBlock
            id="react-lib"
            code={`// components/BlogRenderer.tsx
import React from 'react';

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
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: component.content || '' }}
        />
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
          <div dangerouslySetInnerHTML={{ __html: component.content || '' }} />
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 my-6 italic">
          <div dangerouslySetInnerHTML={{ __html: component.content || '' }} />
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
      // Extract YouTube/Vimeo embed URL
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
            <h4 className="font-semibold text-green-800 mb-2">✓ Pros</h4>
            <ul className="space-y-1">
              {component.data?.pros?.map((pro: string, i: number) => (
                <li key={i} className="text-green-700">{pro}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">✗ Cons</h4>
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
      // For chart types and others, you might want to use a charting library
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

        {/* Full Example */}
        <section className="mb-16" id="full-example">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Book className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Full Integration Example</h2>
          </div>

          <p className="text-slate-400 mb-6">
            Here's a complete Next.js App Router integration:
          </p>

          <div className="space-y-6">
            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
              <h4 className="text-white font-mono text-sm mb-3">lib/blog.ts</h4>
              <CodeBlock
                id="full-lib"
                code={`const API_URL = 'https://roboblogger.vercel.app/api/v1';

export async function getBlogPosts(page = 1, limit = 10) {
  const res = await fetch(
    \`\${API_URL}/posts?page=\${page}&limit=\${limit}\`,
    {
      headers: {
        'Authorization': \`Bearer \${process.env.ROBOBLOGGER_API_KEY}\`
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
        'Authorization': \`Bearer \${process.env.ROBOBLOGGER_API_KEY}\`
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

            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
              <h4 className="text-white font-mono text-sm mb-3">app/blog/page.tsx</h4>
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
          Load more posts →
        </Link>
      )}
    </main>
  );
}`}
              />
            </div>

            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-lg">
              <h4 className="text-white font-mono text-sm mb-3">app/blog/[slug]/page.tsx</h4>
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

        {/* Help */}
        <section className="p-6 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
          <p className="text-slate-400">
            If you have questions or run into issues, reach out at{' '}
            <a href="mailto:support@roboblogger.com" className="text-violet-400 hover:underline">
              support@roboblogger.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
