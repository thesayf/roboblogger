import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/blog/admin/"],
    },
    sitemap: "https://roboblogger.com/sitemap.xml",
  };
}
