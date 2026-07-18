import { generateBlogPostSchema } from "@/utils/schema";
import SimpleBlogPostClient from "./SimpleBlogPostClient";
import { getBlogPostRedirectTarget } from "@/lib/blog-post-redirects";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

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
    content: any;
    read_in_minutes: number;
    author?: string;
  };
}

export const revalidate = 60;

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://vibeblogger.io";
const API_KEY = process.env.VIBEBLOGGER_API_KEY;

function mapApiPost(post: any): BlogPostData {
  return {
    id: post._id,
    uid: post.slug,
    data: {
      title: post.title,
      description: post.description,
      featured_image: post.featuredImage
        ? { url: post.featuredImage, alt: post.title }
        : undefined,
      category: post.category,
      date: post.publishedAt || post.createdAt,
      last_modified: post.updatedAt,
      content: post.components || [],
      read_in_minutes: post.readTime || 5,
      author: post.author?.name || "Vibeblogger Team",
    },
  };
}

async function getPost(slug: string): Promise<BlogPostData | null> {
  if (!API_KEY) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/posts/${slug}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const { post } = await res.json();
    return mapApiPost(post);
  } catch (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }
}

async function getRelatedPosts(currentSlug: string): Promise<BlogPostData[]> {
  if (!API_KEY) return [];

  try {
    const res = await fetch(`${API_BASE}/api/v1/posts?limit=4`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];

    const { posts } = await res.json();
    return posts
      .filter((p: any) => p.slug !== currentSlug)
      .slice(0, 3)
      .map(mapApiPost);
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: BlogPostParams): Promise<Metadata> {
  const redirectTarget = await getBlogPostRedirectTarget(params.slug);

  if (redirectTarget) {
    return {
      alternates: {
        canonical: `https://vibeblogger.io/blog/${redirectTarget}`,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

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

export default async function BlogPostPage({ params }: BlogPostParams) {
  const redirectTarget = await getBlogPostRedirectTarget(params.slug);

  if (redirectTarget) {
    permanentRedirect(`/blog/${redirectTarget}`);
  }

  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(params.slug);
  const schema = generateBlogPostSchema(post);

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
