import { MetadataRoute } from "next";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://vibeblogger.io";
const API_KEY = process.env.VIBEBLOGGER_API_KEY;

export const revalidate = 300;

async function getAllPublishedPosts(): Promise<any[]> {
  if (!API_KEY) return [];

  const posts: any[] = [];
  let page = 1;

  while (page <= 50) {
    const res = await fetch(
      `${API_BASE}/api/v1/posts?page=${page}&limit=100`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      throw new Error(`Blog API returned ${res.status} on page ${page}`);
    }

    const data = await res.json();
    posts.push(...(data.posts || []));

    if (!data.pagination?.hasMore) break;
    page += 1;
  }

  return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vibeblogger.io";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let blogPosts: MetadataRoute.Sitemap = [];

  if (API_KEY) {
    try {
      const posts = await getAllPublishedPosts();
      blogPosts = posts.map((post: any) => {
        const lastModified = new Date(post.updatedAt);

        return {
          url: `${baseUrl}/blog/${post.slug}`,
          ...(Number.isNaN(lastModified.getTime()) ? {} : { lastModified }),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        };
      });
    } catch (error) {
      console.error("Error fetching blog posts for sitemap:", error);
    }
  }

  return [...staticPages, ...blogPosts];
}
