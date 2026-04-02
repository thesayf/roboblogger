// Shared setup prompt template used by /start and /docs pages
// Use getSetupPrompt(apiKey) to get a personalized version with the API key baked in

const SETUP_PROMPT_TEMPLATE = `I want to add a blog to my site using the Vibeblogger API. Before creating the blog, audit and fix the SEO on my existing site. Here is everything you need:

## Part 1: Audit & Fix Existing Site SEO (do this first)
Scan every existing page in the app and fix the following:
- Every page must have a unique, descriptive <title> and <meta description> via generateMetadata()
- Add Open Graph metadata (og:title, og:description, og:image, og:url, og:type) to every page
- Add Twitter card metadata (twitter:card, twitter:title, twitter:description) to every page
- Add canonical URLs (alternates.canonical) to every page to prevent duplicate content
- Ensure every page has exactly one <h1> and headings follow proper hierarchy (h1 > h2 > h3, no skipping)
- Add alt text to every <img> tag — if missing, write a descriptive alt based on context
- Use semantic HTML throughout: <header>, <nav>, <main>, <article>, <section>, <footer>
- Add JSON-LD Organization structured data to the homepage (@type: Organization with name, url, logo)
- Check that the site has a robots.txt (create at app/robots.ts if missing) — allow all crawlers, reference sitemap
- Check that the site has a sitemap (create or update app/sitemap.ts) — include ALL public pages with lastModified dates
- Ensure all internal links use proper <a> tags or Next.js <Link> components (no broken links)
- Lazy load images below the fold (use Next.js Image component or loading="lazy")
- Set width and height on images to prevent Cumulative Layout Shift (CLS)

## Part 2: Add the Blog
Now create the blog using the Vibeblogger API.

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

export const SETUP_PROMPT = SETUP_PROMPT_TEMPLATE;

export function getSetupPrompt(apiKey?: string): string {
  if (!apiKey) return SETUP_PROMPT_TEMPLATE;

  return SETUP_PROMPT_TEMPLATE
    .replace(
      '- Auth: Authorization: Bearer header using process.env.VIBEBLOGGER_API_KEY',
      `- Auth: Authorization: Bearer header using process.env.VIBEBLOGGER_API_KEY\n- API Key: ${apiKey}\n- IMPORTANT: Add this key to the project's .env.local file as VIBEBLOGGER_API_KEY=${apiKey} (create the file if it doesn't exist)`
    );
}
