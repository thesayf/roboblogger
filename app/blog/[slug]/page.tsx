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
    seo_title?: string;
    seo_description?: string;
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
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
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
    const posts: any[] = [];
    let page = 1;

    while (page <= 50) {
      const res = await fetch(`${API_BASE}/api/v1/posts?page=${page}&limit=100`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 60 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      posts.push(...(data.posts || []));

      if (!data.pagination?.hasMore) break;
      page += 1;
    }

    const currentIndex = posts.findIndex((post: any) => post.slug === currentSlug);
    const orderedPosts = currentIndex >= 0
      ? [...posts.slice(currentIndex + 1), ...posts.slice(0, currentIndex)]
      : posts.filter((post: any) => post.slug !== currentSlug);

    return orderedPosts.slice(0, 3).map(mapApiPost);
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

  const title = post.data.seo_title || post.data.title;
  const description = post.data.seo_description || post.data.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
