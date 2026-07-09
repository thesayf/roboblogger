interface PostData {
  title: string;
  description: string;
  featured_image?: {
    url?: string;
    alt?: string;
  };
  date: string;
  last_modified?: string;
  author?: string;
  category?: string;
}

interface Post {
  id?: string;
  uid: string;
  data: PostData;
}

const BASE_URL = "https://vibeblogger.io";
const BRAND_NAME = "Vibeblogger";

export function generateBlogListSchema(
  posts: Post[],
  baseUrl = BASE_URL
): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    headline: `The ${BRAND_NAME} Blog`,
    description:
      "SEO strategies, startup content ideas, and AI blogging insights for founders building a blog that fits their brand.",
    url: `${baseUrl}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${baseUrl}/blog/${post.uid}`,
        name: post.data.title,
      })),
    },
  };
}

export function generateBlogPostSchema(
  post: Post,
  baseUrl = BASE_URL
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.title,
    description: post.data.description,
    image:
      post.data.featured_image?.url || `${baseUrl}/images/default-blog.jpg`,
    datePublished: post.data.date,
    dateModified: post.data.last_modified || post.data.date,
    author: {
      "@type": "Person",
      name: post.data.author || `${BRAND_NAME} Team`,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/V.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.uid}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${baseUrl}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.data.title,
          item: `${baseUrl}/blog/${post.uid}`,
        },
      ],
    },
  };
}

export function generateHomePageSchema(baseUrl = BASE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: baseUrl,
    description:
      "AI-powered blog engine for startups. Work with AI agents to create deep, meaningful blog posts that fit your brand, connect with your users, and make your product easier to find across Google and AI search.",
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/V.png`,
      },
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: BRAND_NAME,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Content Management",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "AI-powered blog engine for startups",
        "SEO keyword research and optimization",
        "Headless API for any frontend",
        "Brand voice settings",
        "15+ content component types",
        "AI-generated images",
        "Auto-publish scheduling",
      ],
    },
  };
}
