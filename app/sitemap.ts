import { MetadataRoute } from "next";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://vibeblogger.io";
const API_KEY = process.env.VIBEBLOGGER_API_KEY;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://vibeblogger.io";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let blogPosts: MetadataRoute.Sitemap = [];

  if (API_KEY) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/posts?limit=1000`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const { posts } = await res.json();
        blogPosts = posts.map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
      }
    } catch (error) {
      console.error("Error fetching blog posts for sitemap:", error);
    }
  }

  return [...staticPages, ...blogPosts];
}
