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
      "AI blogging tips, SEO strategies, and insights to help you publish content that ranks — with zero effort.",
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
      "AI that researches, writes, and publishes SEO-optimized blog posts for your app. Headless API. Beautiful components. Zero effort.",
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
        "AI-powered blog post generation",
        "SEO keyword research and optimization",
        "Headless API for any frontend",
        "15+ content component types",
        "AI-generated images",
        "Auto-publish scheduling",
      ],
    },
  };
}
