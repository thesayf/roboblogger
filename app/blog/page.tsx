import BlogPageClient from "./BlogPageClient";
import { generateBlogListSchema } from "@/utils/schema";
import type { Metadata } from "next";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";

// This enables static generation with hourly revalidation
export const revalidate = 3600; // seconds (1 hour)

export type CleanBlogPost = {
  id: string;
  uid: string;
  data: {
    title: string;
    description: string;
    date: string;
    category?: string;
    featured_image?: {
      url?: string;
      alt?: string;
    };
  };
};

interface BlogPageClientProps {
  initialPosts: CleanBlogPost[];
  schema: Record<string, any>;
}

// This function runs at build time to fetch data directly from the database
async function getBlogPosts(): Promise<CleanBlogPost[]> {
  try {
    // Connect to database directly (no HTTP request needed)
    await dbConnect();

    // Query published posts directly from MongoDB
    const posts = await BlogPost.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(50)
      .lean(); // Use lean() for better performance in server components

    // Transform database posts to match the expected format
    const cleanPosts: CleanBlogPost[] = posts.map((post: any) => ({
      id: post._id.toString(),
      uid: post.slug,
      data: {
        title: post.title,
        description: post.description,
        date: post.publishedAt?.toString() || post.createdAt.toString(),
        category: post.category,
        featured_image: (post.featuredImage || post.featuredImageThumbnail)
          ? {
              url: post.featuredImage || post.featuredImageThumbnail,
              alt: post.title,
            }
          : undefined,
      },
    }));

    return cleanPosts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Sets the metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog - AI Blogging Tips & SEO Strategies",
    description:
      "AI blogging tips, SEO strategies, and insights to help you publish content that ranks — with zero effort.",
    openGraph: {
      title: "Blog - AI Blogging Tips & SEO Strategies",
      description:
        "AI blogging tips, SEO strategies, and insights to help you publish content that ranks — with zero effort.",
      type: "website",
      url: "https://vibeblogger.io/blog",
      siteName: "Vibeblogger",
    },
    twitter: {
      card: "summary_large_image",
      title: "Blog - AI Blogging Tips & SEO Strategies",
      description:
        "AI blogging tips, SEO strategies, and insights to help you publish content that ranks — with zero effort.",
    },
    alternates: {
      canonical: "https://vibeblogger.io/blog",
    },
  };
}

// Dummy posts for design preview — replace with getBlogPosts() when ready
const DUMMY_POSTS: CleanBlogPost[] = [
  {
    id: "1",
    uid: "ai-blog-generator-complete-guide",
    data: {
      title: "The Complete Guide to AI Blog Generators in 2026",
      description: "AI blog generators have changed how startups approach content marketing. Here's everything you need to know — how they work, what to look for, and how to use them without publishing generic AI slop.",
      date: "2026-03-10",
      category: "AI & Content",
      featured_image: {
        url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        alt: "AI blog generator concept",
      },
    },
  },
  {
    id: "2",
    uid: "seo-for-saas-startups",
    data: {
      title: "SEO for SaaS Startups: Why Your Blog Is Your Best Growth Channel",
      description: "Paid ads get expensive. Social is unpredictable. But a blog that ranks compounds over time. Here's how early-stage SaaS companies can build organic traffic from day one.",
      date: "2026-03-07",
      category: "SEO",
      featured_image: {
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        alt: "SEO analytics dashboard",
      },
    },
  },
  {
    id: "3",
    uid: "headless-cms-vs-traditional",
    data: {
      title: "Headless CMS vs Traditional: Which One Actually Fits Your Stack?",
      description: "WordPress, Ghost, headless APIs — the options keep multiplying. We break down when each approach makes sense and why more teams are going headless in 2026.",
      date: "2026-03-04",
      category: "Engineering",
      featured_image: {
        url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
        alt: "Code on screen",
      },
    },
  },
  {
    id: "4",
    uid: "content-automation-without-losing-quality",
    data: {
      title: "How to Automate Content Without Losing Quality",
      description: "Automation doesn't have to mean generic. Learn how to set up a content pipeline that publishes consistently while maintaining the quality your readers expect.",
      date: "2026-02-28",
      category: "Content Strategy",
      featured_image: {
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        alt: "Automation workflow",
      },
    },
  },
  {
    id: "5",
    uid: "keyword-research-ai-tools",
    data: {
      title: "Keyword Research with AI: Beyond Search Volume",
      description: "Search volume is just one signal. Modern keyword research uses AI to understand intent, competition gaps, and topical authority. Here's how to do it right.",
      date: "2026-02-24",
      category: "SEO",
      featured_image: {
        url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80",
        alt: "Data analytics",
      },
    },
  },
  {
    id: "6",
    uid: "structured-content-components",
    data: {
      title: "Why Structured Content Components Beat Long Markdown Blobs",
      description: "Callouts, comparison tables, CTAs, charts — structured components make blog posts more engaging and easier to maintain. Here's the case for component-based content.",
      date: "2026-02-20",
      category: "Content Strategy",
      featured_image: {
        url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
        alt: "Content components",
      },
    },
  },
  {
    id: "7",
    uid: "api-first-blog-nextjs",
    data: {
      title: "Building an API-First Blog with Next.js and a Headless Backend",
      description: "Step-by-step guide to setting up a performant blog using Next.js App Router with a headless content API. Static generation, ISR, and SEO included.",
      date: "2026-02-15",
      category: "Engineering",
      featured_image: {
        url: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80",
        alt: "Next.js development",
      },
    },
  },
];

// The main page component - runs at build time
export default async function BlogPage() {
  // TODO: Replace dummy posts with real data when content is ready
  // const posts = await getBlogPosts();
  const posts = DUMMY_POSTS;
  const schema = generateBlogListSchema(posts);

  // Pass the pre-fetched data to client component
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BlogPageClient initialPosts={posts} schema={schema} />
    </>
  );
}
