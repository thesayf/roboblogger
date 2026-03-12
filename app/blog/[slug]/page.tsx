import { generateBlogPostSchema } from "@/utils/schema";
import SimpleBlogPostClient from "./SimpleBlogPostClient";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";

interface BlogPostParams {
  params: {
    slug: string;
  };
}

interface BlogPostData {
  id: string;
  uid: string;
  data: {
    title: string;
    description: string;
    featured_image?: {
      url: string;
      alt?: string;
    };
    category?: string;
    date: string;
    last_modified?: string;
    content: string; // HTML or markdown content from database
    components?: any[]; // Blog components from database
    read_in_minutes: number;
    author?: string;
  };
}

// Revalidate content every hour
export const revalidate = 3600;

// Dummy posts for design preview — remove when real content is ready
const DUMMY_POSTS: Record<string, BlogPostData> = {
  "ai-blog-generator-complete-guide": {
    id: "1",
    uid: "ai-blog-generator-complete-guide",
    data: {
      title: "The Complete Guide to AI Blog Generators in 2026",
      description: "AI blog generators have changed how startups approach content marketing. Here's everything you need to know — how they work, what to look for, and how to use them without publishing generic AI slop.",
      featured_image: { url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80", alt: "AI blog generator concept" },
      category: "AI & Content",
      date: "2026-03-10",
      last_modified: "2026-03-10",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## Why AI Blog Generators Matter\n\nMost startups know they need a blog. SEO is the highest-ROI marketing channel — but nobody has time to research keywords, write 2,000-word articles, and publish consistently.\n\nThat's where AI blog generators come in. They automate the research, writing, and even image generation, letting you publish quality content at scale." },
        { _id: "c2", type: "callout", order: 2, variant: "info", title: "Key Insight", content: "The best AI blog generators don't just write — they research. They analyze keywords, study competitors, and structure content with real data." },
        { _id: "c3", type: "rich_text", order: 3, content: "## What to Look For\n\nNot all AI content tools are created equal. Here are the features that separate the good from the generic:\n\n- **Real research** — Tools that pull from current data, not just training data\n- **Structured components** — Callouts, tables, CTAs, not just walls of text\n- **SEO optimization** — Meta tags, heading hierarchy, keyword placement\n- **Headless delivery** — API-first so you control the frontend\n- **Brand voice** — Configurable tone that doesn't sound like ChatGPT" },
        { _id: "c4", type: "rich_text", order: 4, content: "## The Problem with Generic AI Content\n\nYou've seen it everywhere — blog posts that start with \"In today's fast-paced world...\" and say nothing useful. That's what happens when you use AI without research, without structure, and without intent.\n\nThe solution isn't to avoid AI. It's to use AI that's backed by real keyword research, structured with engaging components, and optimized for the queries your audience actually searches for." },
        { _id: "c5", type: "quote", order: 5, content: "Content that ranks isn't about word count — it's about answering the question better than anyone else.", author: "Vibeblogger Team" },
        { _id: "c6", type: "rich_text", order: 6, content: "## How to Get Started\n\nThe fastest path is simple:\n\n1. Define your niche and target audience\n2. Let AI handle keyword research and gap analysis\n3. Generate structured, component-based articles\n4. Review, refine, and publish via your headless API\n5. Track what ranks and double down\n\nThe key is consistency. One great post per week beats ten mediocre ones per month." },
        { _id: "c7", type: "cta", order: 7, text: "Try Vibeblogger Free →", link: "/", style: "primary" },
      ],
      read_in_minutes: 8,
      author: "Vibeblogger Team",
    },
  },
  "seo-for-saas-startups": {
    id: "2",
    uid: "seo-for-saas-startups",
    data: {
      title: "SEO for SaaS Startups: Why Your Blog Is Your Best Growth Channel",
      description: "Paid ads get expensive. Social is unpredictable. But a blog that ranks compounds over time. Here's how early-stage SaaS companies can build organic traffic from day one.",
      featured_image: { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", alt: "SEO analytics dashboard" },
      category: "SEO",
      date: "2026-03-07",
      last_modified: "2026-03-07",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## The Compounding Power of Organic Traffic\n\nEvery SaaS founder eventually hits the same wall: paid acquisition costs keep going up, and the moment you stop spending, the traffic stops too.\n\nOrganic search is different. A blog post that ranks today will still bring visitors next month, next quarter, and next year. It compounds." },
        { _id: "c2", type: "rich_text", order: 2, content: "## Start with Bottom-of-Funnel Keywords\n\nMost startups make the mistake of going after broad, high-volume keywords first. Don't. Start with keywords that indicate buying intent:\n\n- \"best [your category] tools\"\n- \"[competitor] alternatives\"\n- \"how to [problem your product solves]\"\n\nThese pages convert better and are often less competitive." },
        { _id: "c3", type: "callout", order: 3, variant: "success", title: "Pro Tip", content: "Write comparison posts (\"X vs Y\") early. They rank well, convert at high rates, and establish your product as a player in the category." },
        { _id: "c4", type: "rich_text", order: 4, content: "## Consistency Beats Perfection\n\nYou don't need to publish every day. But you do need to publish consistently. Two well-researched posts per week will outperform a burst of ten posts followed by three months of silence.\n\nThis is where automation helps. Use AI to handle the research and first draft, then spend your time refining and adding your unique perspective." },
      ],
      read_in_minutes: 6,
      author: "Vibeblogger Team",
    },
  },
  "headless-cms-vs-traditional": {
    id: "3",
    uid: "headless-cms-vs-traditional",
    data: {
      title: "Headless CMS vs Traditional: Which One Actually Fits Your Stack?",
      description: "WordPress, Ghost, headless APIs — the options keep multiplying. We break down when each approach makes sense and why more teams are going headless in 2026.",
      featured_image: { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80", alt: "Code on screen" },
      category: "Engineering",
      date: "2026-03-04",
      last_modified: "2026-03-04",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## The Traditional Approach\n\nWordPress, Ghost, Squarespace — traditional CMSes give you everything in one package. Content management, templating, hosting, and rendering all bundled together. It works, and for many use cases, it's still the right choice." },
        { _id: "c2", type: "rich_text", order: 2, content: "## When to Go Headless\n\nHeadless makes sense when:\n\n- You already have a frontend (Next.js, Remix, Astro)\n- You want full control over design and performance\n- You need content across multiple channels (web, mobile, email)\n- You care about page speed and Core Web Vitals\n- Your engineering team prefers working in their own stack" },
        { _id: "c3", type: "comparison_table", order: 3, data: { items: ["Traditional CMS", "Headless CMS"], features: [{ name: "Setup speed", values: ["Fast", "Medium"] }, { name: "Design flexibility", values: ["Limited", "Full control"] }, { name: "Performance", values: ["Varies", "Excellent"] }, { name: "Developer experience", values: ["Template-based", "API-first"] }] } },
        { _id: "c4", type: "rich_text", order: 4, content: "## The Best of Both Worlds\n\nThe ideal setup in 2026: a headless content API that handles generation, storage, and delivery — paired with your own frontend for rendering. You get the speed of automation with the flexibility of custom design." },
      ],
      read_in_minutes: 5,
      author: "Vibeblogger Team",
    },
  },
  "content-automation-without-losing-quality": {
    id: "4",
    uid: "content-automation-without-losing-quality",
    data: {
      title: "How to Automate Content Without Losing Quality",
      description: "Automation doesn't have to mean generic. Learn how to set up a content pipeline that publishes consistently while maintaining the quality your readers expect.",
      featured_image: { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80", alt: "Automation workflow" },
      category: "Content Strategy",
      date: "2026-02-28",
      last_modified: "2026-02-28",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## The Quality Problem\n\nAutomation has a reputation problem. People associate it with spam, thin content, and SEO tricks from 2015. But modern content automation is fundamentally different.\n\nThe key insight: automate the research and structure, not the thinking." },
        { _id: "c2", type: "rich_text", order: 2, content: "## Build a Pipeline, Not a Shortcut\n\nA good content pipeline looks like this:\n\n1. **Keyword research** — AI identifies high-intent, low-competition topics\n2. **Deep research** — Multiple sources analyzed, not just training data\n3. **Structured draft** — Components, headings, and flow generated automatically\n4. **Human review** — You refine the voice, add unique insights, fact-check\n5. **Publish and measure** — Track rankings, iterate on what works" },
        { _id: "c3", type: "callout", order: 3, variant: "warning", title: "Common Mistake", content: "Don't skip the review step. Even the best AI needs a human editor to catch tone issues, add personal experience, and ensure accuracy." },
      ],
      read_in_minutes: 5,
      author: "Vibeblogger Team",
    },
  },
  "keyword-research-ai-tools": {
    id: "5",
    uid: "keyword-research-ai-tools",
    data: {
      title: "Keyword Research with AI: Beyond Search Volume",
      description: "Search volume is just one signal. Modern keyword research uses AI to understand intent, competition gaps, and topical authority. Here's how to do it right.",
      featured_image: { url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80", alt: "Data analytics" },
      category: "SEO",
      date: "2026-02-24",
      last_modified: "2026-02-24",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## Search Volume Is Overrated\n\nEvery keyword tool shows you search volume. But a keyword with 10,000 monthly searches and massive competition is worth less than one with 500 searches and zero good results.\n\nThe real opportunity is in the gaps — questions nobody is answering well." },
        { _id: "c2", type: "rich_text", order: 2, content: "## What AI Brings to Keyword Research\n\nAI can analyze thousands of SERPs in seconds, identifying:\n\n- **Content gaps** — Topics where existing results are thin or outdated\n- **Intent clusters** — Related queries that a single post can target\n- **Difficulty signals** — Beyond domain authority, looking at content quality\n- **Trending topics** — Emerging searches before they peak" },
      ],
      read_in_minutes: 6,
      author: "Vibeblogger Team",
    },
  },
  "structured-content-components": {
    id: "6",
    uid: "structured-content-components",
    data: {
      title: "Why Structured Content Components Beat Long Markdown Blobs",
      description: "Callouts, comparison tables, CTAs, charts — structured components make blog posts more engaging and easier to maintain. Here's the case for component-based content.",
      featured_image: { url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80", alt: "Content components" },
      category: "Content Strategy",
      date: "2026-02-20",
      last_modified: "2026-02-20",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## The Markdown Problem\n\nMarkdown is great for writing. But for blog content that needs to engage, convert, and rank — a single blob of markdown isn't enough.\n\nReaders scan. They jump to headings, notice callout boxes, compare options in tables, and click CTAs. You need structure." },
        { _id: "c2", type: "rich_text", order: 2, content: "## Component-Based Content\n\nInstead of one long text field, break your content into typed components:\n\n- **Rich text** for narrative sections\n- **Callouts** for tips, warnings, and key insights\n- **Tables** for comparisons and data\n- **CTAs** for conversion points\n- **Code blocks** for technical content\n- **Charts** for visual data stories\n\nEach component has its own schema, making content portable, searchable, and renderable in any frontend." },
      ],
      read_in_minutes: 4,
      author: "Vibeblogger Team",
    },
  },
  "api-first-blog-nextjs": {
    id: "7",
    uid: "api-first-blog-nextjs",
    data: {
      title: "Building an API-First Blog with Next.js and a Headless Backend",
      description: "Step-by-step guide to setting up a performant blog using Next.js App Router with a headless content API. Static generation, ISR, and SEO included.",
      featured_image: { url: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80", alt: "Next.js development" },
      category: "Engineering",
      date: "2026-02-15",
      last_modified: "2026-02-15",
      content: [
        { _id: "c1", type: "rich_text", order: 1, content: "## Why API-First?\n\nAn API-first blog separates your content from your presentation. Your content lives in a headless backend, and your Next.js frontend fetches and renders it however you want.\n\nThis means:\n- Full design control\n- Excellent performance with static generation\n- Content reusable across web, mobile, newsletters\n- No vendor lock-in on the frontend" },
        { _id: "c2", type: "code_block", order: 2, content: "// app/blog/page.tsx\nconst { posts } = await fetch('https://vibeblogger.io/api/v1/posts', {\n  headers: { Authorization: `Bearer ${process.env.VIBEBLOGGER_API_KEY}` },\n  next: { revalidate: 60 }\n}).then(r => r.json());", data: { language: "typescript" } },
        { _id: "c3", type: "rich_text", order: 3, content: "## Static Generation + ISR\n\nNext.js App Router gives you the best of both worlds. Generate pages at build time for speed, then use Incremental Static Regeneration to keep them fresh.\n\nSet `revalidate: 60` and your pages update within a minute of new content being published — no redeploy needed." },
      ],
      read_in_minutes: 7,
      author: "Vibeblogger Team",
    },
  },
};

// Generate paths for all published blog posts at build time
export async function generateStaticParams() {
  try {
    // Connect to database directly
    await dbConnect();

    // Query published posts directly from MongoDB
    const posts = await BlogPost.find({ status: "published" })
      .select("slug") // Only select slug field for efficiency
      .limit(100)
      .lean();

    return posts.map((post: any) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

function mapDatabasePost(post: any): BlogPostData {
  return {
    id: post._id.toString(),
    uid: post.slug,
    data: {
      title: post.title,
      description: post.description,
      featured_image: (post.featuredImage || post.featuredImageThumbnail)
        ? {
            url: post.featuredImage || post.featuredImageThumbnail,
            alt: post.title,
          }
        : undefined,
      category: post.category,
      date: post.publishedAt?.toString() || post.createdAt.toString(),
      last_modified: post.updatedAt.toString(),
      content: post.components, // Pass components as content
      slices: post.components || [], // Pass components as slices too
      read_in_minutes: post.readTime || 5, // Default to 5 min if not set
      author: post.author?.name || "Vibeblogger Team",
    },
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: BlogPostParams): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: post.data.title,
    description: post.data.description,
    openGraph: {
      title: post.data.title,
      description: post.data.description,
      images: post.data.featured_image?.url
        ? [post.data.featured_image.url]
        : [],
      type: "article",
      siteName: "Vibeblogger",
    },
    alternates: {
      canonical: `https://vibeblogger.io/blog/${params.slug}`,
    },
    other: {
      "og:article:published_time": post.data.date,
      "og:article:modified_time": post.data.last_modified || post.data.date,
    },
  };
}

// Fetch the post data — check dummy posts first, then database
async function getPost(slug: string): Promise<BlogPostData | null> {
  // TODO: Remove dummy post lookup when real content is ready
  if (DUMMY_POSTS[slug]) {
    return DUMMY_POSTS[slug];
  }

  try {
    await dbConnect();

    const post = await BlogPost.findOne({
      slug: slug,
      status: "published",
    })
      .populate({
        path: "components",
        options: { sort: { order: 1 } },
      })
      .lean();

    if (!post) {
      return null;
    }

    return mapDatabasePost(post);
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error);
    return null;
  }
}

async function getRelatedPosts(
  currentPost: BlogPostData
): Promise<BlogPostData[]> {
  // TODO: Remove dummy related posts when real content is ready
  const dummyRelated = Object.values(DUMMY_POSTS)
    .filter((p) => p.uid !== currentPost.uid)
    .slice(0, 3);
  if (dummyRelated.length > 0) {
    return dummyRelated;
  }

  try {
    await dbConnect();

    const posts = await BlogPost.find({
      status: "published",
      slug: { $ne: currentPost.uid },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean();

    return posts.map((post: any) => mapDatabasePost(post));
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
}

// Main page component - runs at build time
export default async function BlogPostPage({ params }: BlogPostParams) {
  const post = await getPost(params.slug);

  if (!post) {
    // Use Next.js notFound() for proper 404 handling
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);

  // Generate schema for the post
  const schema = generateBlogPostSchema(post);

  // Pass pre-fetched data to client component
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <SimpleBlogPostClient
        post={post}
        schema={schema}
        relatedPosts={relatedPosts}
      />
    </>
  );
}
