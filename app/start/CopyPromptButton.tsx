"use client";

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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

2. JSON-LD structured data on each post page:
   - @type: "BlogPosting" with headline, description, image, datePublished, dateModified, author (@type: Person), publisher (@type: Organization), mainEntityOfPage

3. generateStaticParams() on the [slug] page:
   - Fetch all post slugs from the API, return { slug } for each
   - Add: export const revalidate = 3600

4. Dynamic sitemap at app/blog/sitemap.ts:
   - Fetch all posts, return MetadataRoute.Sitemap array with url, lastModified, changeFrequency: "weekly", priority: 0.8

5. RSS feed at app/blog/feed.xml/route.ts:
   - GET handler returning RSS XML with Content-Type: application/rss+xml
   - Include title, link, description, pubDate, guid for each post

## Files to Create
1. lib/blog.ts — API client with getBlogPosts() and getBlogPost(slug) functions, using fetch with Authorization header and next: { revalidate: 3600 }
2. components/BlogRenderer.tsx — Component renderer for all 16 types
3. app/blog/page.tsx — Blog listing page with post cards, featured images, pagination
4. app/blog/[slug]/page.tsx — Single post page with generateMetadata, generateStaticParams, JSON-LD, and BlogContent renderer
5. app/blog/sitemap.ts — Dynamic sitemap
6. app/blog/feed.xml/route.ts — RSS feed

## Dependencies to Install
- react-markdown

## Important Notes
- The rich_text component content is MARKDOWN, not HTML. You must use react-markdown.
- Use Next.js App Router patterns (not Pages Router).
- Add revalidation (ISR) so pages update when new posts are published.
- Replace YOUR_DOMAIN with the actual domain in canonical URLs and sitemap.`;

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
