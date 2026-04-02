"use client";

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

const SETUP_PROMPT = `I want to add a blog to my site using the Vibeblogger API. Here is everything you need:

## API Info
- Base URL: https://vibeblogger.io/api/v1
- Auth: Authorization: Bearer header using process.env.VIBEBLOGGER_API_KEY
- Endpoints:
  - GET /api/v1/posts — list all published posts (query params: page, limit, category, tag)
  - GET /api/v1/posts/:slug — get a single post by slug

## Response Shape
{
  "posts": [{
    "_id": "...",
    "title": "Post Title",
    "slug": "post-title",
    "description": "Short description",
    "featuredImage": "https://...",
    "seoTitle": "SEO Title (use for meta title, fallback to title)",
    "seoDescription": "SEO Description (use for meta description, fallback to description)",
    "status": "published",
    "publishedAt": "2024-01-15T...",
    "updatedAt": "2024-01-16T...",
    "readTime": 5,
    "tags": ["tech", "ai"],
    "category": "Technology",
    "author": { "name": "John Doe", "imageUrl": "https://..." },
    "components": [
      { "_id": "...", "type": "rich_text", "order": 0, "content": "Markdown string..." },
      { "_id": "...", "type": "image", "order": 1, "url": "...", "alt": "..." }
    ]
  }],
  "pagination": { "page": 1, "limit": 10, "total": 25, "pages": 3, "hasMore": true }
}

## 16 Component Types (all must be rendered)
- rich_text: content (Markdown — MUST use react-markdown to parse, NOT raw HTML)
- image: url, alt, caption, width, height
- callout: variant (info/success/warning/error), title, content (Markdown)
- quote: content (Markdown), author, citation
- cta: text, link, style (primary/secondary/outline)
- video: videoUrl, thumbnail, videoTitle (support YouTube and Vimeo embed URLs)
- table: headers[], rows[][], tableCaption
- bar_chart: data.labels, data.datasets[{label, data[]}]
- line_chart: data.labels, data.datasets[{label, data[]}]
- pie_chart: data.labels, data.values
- comparison_table: data.items[], data.features[]
- pros_cons: data.pros[], data.cons[]
- timeline: data.events[{date, title, content}]
- flowchart: data.nodes[], data.edges[]
- step_by_step: data.steps[{title, content}]
- code_block: content, data.language

## BlogRenderer Component
Create a BlogComponentRenderer that switches on component.type and renders each of the 16 types above. Use react-markdown for any Markdown content (rich_text, callout content, quote content). Sort components by their "order" field before rendering.

## SEO Requirements (Critical)
1. generateMetadata() on the [slug] page:
   - title: post.seoTitle || post.title
   - description: post.seoDescription || post.description
   - openGraph: { type: "article", title, description, images: [post.featuredImage], publishedTime: post.publishedAt, modifiedTime: post.updatedAt }
   - twitter: { card: "summary_large_image" }
   - alternates: { canonical: \`https://YOUR_DOMAIN/blog/\${post.slug}\` }

2. generateMetadata() on the blog listing page:
   - title: "Blog | YOUR_SITE_NAME"
   - description: A compelling description of your blog
   - openGraph and twitter card metadata

3. JSON-LD structured data on each post page:
   - @type: "BlogPosting" with headline, description, image, datePublished, dateModified, author (@type: Person), publisher (@type: Organization), mainEntityOfPage

4. JSON-LD BreadcrumbList on each post page:
   - Home > Blog > Post Title

5. generateStaticParams() on the [slug] page:
   - Fetch all post slugs from the API, return { slug } for each
   - Add: export const revalidate = 3600

6. Dynamic sitemap at app/blog/sitemap.ts:
   - Fetch all posts, return MetadataRoute.Sitemap array with url, lastModified, changeFrequency: "weekly", priority: 0.8
   - Include the blog listing page itself with priority: 1.0

7. RSS feed at app/blog/feed.xml/route.ts:
   - GET handler returning RSS XML with Content-Type: application/rss+xml
   - Include title, link, description, pubDate, guid for each post

8. robots.txt at app/robots.ts:
   - Allow all pages, reference sitemap URL

## On-Page SEO Best Practices
- Use exactly one <h1> per page (the post title)
- Headings in content should start at <h2> and follow proper hierarchy (no skipping levels)
- All images must have descriptive alt text (use the alt field from the API)
- Lazy load images below the fold (use Next.js Image component or loading="lazy")
- Set width and height on images to prevent layout shift
- Use semantic HTML elements: <article>, <header>, <nav>, <time>, <footer>
- Add a canonical URL on every page to prevent duplicate content issues
- Render dates with <time datetime="..."> for machine readability
- Include an author section with structured data
- Ensure proper heading hierarchy in rendered markdown content

## Performance
- Use Next.js Image component for optimized image loading where possible
- Add revalidation (ISR) with next: { revalidate: 3600 } so pages update when new posts are published
- Implement pagination on the blog listing page — don't load all posts at once

## Files to Create
1. lib/blog.ts — API client with getBlogPosts() and getBlogPost(slug) functions, using fetch with Authorization header and next: { revalidate: 3600 }
2. components/BlogRenderer.tsx — Component renderer for all 16 types
3. app/blog/page.tsx — Blog listing page with post cards, featured images, pagination, and generateMetadata
4. app/blog/[slug]/page.tsx — Single post page with generateMetadata, generateStaticParams, JSON-LD (BlogPosting + BreadcrumbList), and BlogContent renderer
5. app/blog/sitemap.ts — Dynamic sitemap including listing page and all posts
6. app/blog/feed.xml/route.ts — RSS feed
7. app/robots.ts — robots.txt with sitemap reference

## Dependencies to Install
- react-markdown

## Important Notes
- The rich_text component content is MARKDOWN, not HTML. You must use react-markdown.
- Use Next.js App Router patterns (not Pages Router).
- Replace YOUR_DOMAIN with the actual domain in canonical URLs, sitemap, and robots.txt.
- Every page must have unique, descriptive <title> and <meta description> tags.
- Test that the sitemap is accessible at /blog/sitemap.xml and the RSS feed at /blog/feed.xml.`;

// Parse the prompt into structured sections for the modal display
function parsePromptSections(prompt: string) {
  const sections: { title: string; content: string; isCode: boolean }[] = [];
  const lines = prompt.split('\n');
  let currentTitle = 'Overview';
  let currentLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLines.length > 0) {
        const content = currentLines.join('\n').trim();
        if (content) {
          sections.push({ title: currentTitle, content, isCode: currentTitle === 'Response Shape' });
        }
      }
      currentTitle = line.replace('## ', '');
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    const content = currentLines.join('\n').trim();
    if (content) {
      sections.push({ title: currentTitle, content, isCode: false });
    }
  }
  return sections;
}

export default function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SETUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full text-[13px] font-semibold text-white bg-[#333333] px-6 py-3 rounded-full hover:bg-[#444444] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          Copied to clipboard
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy setup prompt
        </>
      )}
    </button>
  );
}

export function ViewPromptButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SETUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = parsePromptSections(SETUP_PROMPT);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[13px] font-medium text-[#888888] hover:text-[#111111] transition-colors whitespace-nowrap cursor-pointer"
      >
        View full prompt &rarr;
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#111111] rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
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
                  onClick={handleCopy}
                  className="text-[12px] font-medium text-white bg-[#2A2A2A] px-4 py-1.5 rounded-full hover:bg-[#3A3A3A] transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-[#3A3A3A]"
                >
                  {copied ? (
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
                  onClick={() => setOpen(false)}
                  className="text-[#666666] hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-[11px] font-semibold text-[#88CCFF] uppercase tracking-[0.15em] mb-3">
                    {section.title}
                  </h3>
                  {section.isCode ? (
                    <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-4">
                      <pre className="text-[12px] text-[#CCCCCC] font-mono leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#AAAAAA] font-mono leading-[1.8] whitespace-pre-wrap">
                      {section.content.split('\n').map((line, j) => {
                        if (line.startsWith('- ')) {
                          return (
                            <div key={j} className="flex gap-2 pl-2">
                              <span className="text-[#555555] shrink-0">&bull;</span>
                              <span>{line.slice(2)}</span>
                            </div>
                          );
                        }
                        if (/^\d+\.\s/.test(line)) {
                          const num = line.match(/^(\d+)\.\s/)?.[1];
                          const text = line.replace(/^\d+\.\s/, '');
                          return (
                            <div key={j} className="flex gap-2 pl-2">
                              <span className="text-[#88CCFF] shrink-0 w-4 text-right">{num}.</span>
                              <span>{text}</span>
                            </div>
                          );
                        }
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={j} className="flex gap-2 pl-6">
                              <span className="text-[#444444] shrink-0">-</span>
                              <span className="text-[#888888]">{line.trim().slice(2)}</span>
                            </div>
                          );
                        }
                        return <div key={j}>{line}</div>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
