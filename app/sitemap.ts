import { MetadataRoute } from "next";
import { blogApi } from "@/lib/blogApi";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://schedulegenius.ai";

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  // Dynamic blog posts
  let blogPosts: any[] = [];
  try {
    const { posts } = await blogApi.getPosts({
      status: "published",
      limit: 1000, // Get all published posts
    });

    blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
  }

  return [...staticPages, ...blogPosts];
}
