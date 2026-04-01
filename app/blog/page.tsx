import BlogPageClient from "./BlogPageClient";
import { generateBlogListSchema } from "@/utils/schema";
import type { Metadata } from "next";

// Revalidate every 60 seconds
export const revalidate = 60;

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

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://vibeblogger.io";
const API_KEY = process.env.VIBEBLOGGER_API_KEY;

async function getBlogPosts(): Promise<CleanBlogPost[]> {
  if (!API_KEY) {
    console.error("VIBEBLOGGER_API_KEY not set");
    return [];
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/posts?limit=50`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("Failed to fetch posts:", res.status, await res.text());
      return [];
    }

    const { posts } = await res.json();

    return posts.map((post: any) => ({
      id: post._id,
      uid: post.slug,
      data: {
        title: post.title,
        description: post.description,
        date: post.publishedAt || post.createdAt,
        category: post.category,
        featured_image: post.featuredImage
          ? { url: post.featuredImage, alt: post.title }
          : undefined,
      },
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

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

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const schema = generateBlogListSchema(posts);

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
