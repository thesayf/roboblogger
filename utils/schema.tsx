// utils/schema.js

interface PostData {
  title: string;
  description: string;
  featured_image?: {
    url?: string; // url is now optional
    alt?: string; // added alt field
  };
  date: string;
  last_modified?: string;
  author?: string;
  category?: string; // added category field
}

interface Post {
  id?: string; // added optional id field
  uid: string;
  data: PostData;
}

export function generateBlogListSchema(
  posts: Post[],
  baseUrl = "https://schedulegenius.ai"
): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    headline: "The ScheduleGenius Blog",
    description:
      "Productivity tips, scheduling science, and insights to help you make the most of your time.",
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
  baseUrl = "https://schedulegenius.ai"
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
      name: post.data.author || "ScheduleGenius Team",
    },
    publisher: {
      "@type": "Organization",
      name: "ScheduleGenius",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.jpg`,
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

// utils/schema.js
// Add this function alongside your other schema generators

// utils/schema.js
export function generateHomePageSchema(baseUrl = "https://schedulegenius.ai") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ScheduleGenius",
    url: baseUrl,
    description:
      "Optimize your schedule with AI and behavioral science principles to maximize productivity",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "ScheduleGenius",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.jpg`,
      },
      sameAs: [
        // Add your social media profiles here if applicable
        // "https://twitter.com/ScheduleGenius",
        // "https://www.linkedin.com/company/ScheduleGenius",
      ],
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "ScheduleGenius",
      applicationCategory: "ProductivityApplication",
      applicationSubCategory: "Scheduling Software",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0", // If you have a free tier
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          priceType: "https://schema.org/FreeTrial",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON", // Month
          },
          price: "0",
        },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8", // If you have ratings
        ratingCount: "250", // Number of ratings
      },
      featureList: [
        "AI-powered schedule optimization",
        "Behavioral science integration",
        "Personalized productivity templates",
        "Pomodoro technique integration",
        "Deep work scheduling",
      ],
      screenshot: `${baseUrl}/images/app-screenshot.jpg`,
      softwareRequirements: "Works in any modern web browser",
      softwareVersion: "1.0",
      downloadUrl: baseUrl,
    },
    about: {
      "@type": "Thing",
      name: "Productivity Software",
      description:
        "Tools designed to help individuals and teams maximize their efficiency and output",
    },
  };
}
