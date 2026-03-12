import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/blog/admin/", "/mockup/", "/blog/component-showcase", "/super-admin"],
    },
    sitemap: "https://vibeblogger.io/sitemap.xml",
  };
}
