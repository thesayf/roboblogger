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
    metadataBase: new URL("https://roboblogger.com"),
    title: "Blog - Productivity Tips & Scheduling Science",
    description:
      "Productivity tips, scheduling science, and insights to help you make the most of your time.",
    openGraph: {
      title: "Blog - Productivity Tips & Scheduling Science",
      description:
        "Productivity tips, scheduling science, and insights to help you make the most of your time.",
      type: "website",
      url: "https://roboblogger.com/blog",
      images: [
        {
          url: "/homepage-og.jpg",
          width: 1200,
          height: 630,
          alt: "RoboBlogger AI Productivity Tool",
        },
      ],
      siteName: "RoboBlogger",
    },
    twitter: {
      card: "summary_large_image",
      title: "Blog - Productivity Tips & Scheduling Science",
      description:
        "Productivity tips, scheduling science, and insights to help you make the most of your time.",
      images: ["https://roboblogger.com/images/og-blog.jpg"],
    },
    alternates: {
      canonical: "https://roboblogger.com/blog",
    },
  };
}

// The main page component - runs at build time
export default async function BlogPage() {
  const posts = await getBlogPosts();
  const schema = generateBlogListSchema(posts);

  // Pass the pre-fetched data to client component
  return <BlogPageClient initialPosts={posts} schema={schema} />;
}
