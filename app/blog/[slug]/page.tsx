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
      author: post.author?.name || "RoboBlogger Team",
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
    metadataBase: new URL("https://roboblogger.com"),
    title: post.data.title,
    description: post.data.description,
    openGraph: {
      title: post.data.title,
      description: post.data.description,
      images: post.data.featured_image?.url
        ? [post.data.featured_image.url]
        : [],
      type: "article",
    },
    // Add the alternates field for canonical URL
    alternates: {
      canonical: `https://roboblogger.com/blog/${params.slug}`,
    },
    // Optionally, add article metadata for more detailed OG tags
    other: {
      "og:article:published_time": post.data.date,
      "og:article:modified_time": post.data.last_modified || post.data.date,
    },
  };
}

// Fetch the post data directly from database
async function getPost(slug: string): Promise<BlogPostData | null> {
  try {
    // Connect to database directly
    await dbConnect();

    // Query the specific post by slug
    const post = await BlogPost.findOne({
      slug: slug,
      status: "published", // Only return published posts
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
  try {
    // Connect to database directly
    await dbConnect();

    // Query published posts, excluding the current one
    const posts = await BlogPost.find({
      status: "published",
      slug: { $ne: currentPost.uid }, // Exclude current post
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
    <SimpleBlogPostClient
      post={post}
      schema={schema}
      relatedPosts={relatedPosts}
    />
  );
}
