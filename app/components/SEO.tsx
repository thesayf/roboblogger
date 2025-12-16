"use client";
import Head from "next/head";
import { usePathname } from "next/navigation"; // Changed from useRouter

interface SEOSchema {
  [key: string]: any;
}

interface SEOProps {
  title: string;
  description: string;
  image?: string | null;
  article?: boolean;
  schema?: SEOSchema | null;
}

export default function SEO({
  title,
  description,
  image = null,
  article = false,
  schema = null, // Add this parameter
}: SEOProps) {
  const pathname = usePathname(); // Changed from useRouter
  const canonicalUrl = `https://schedulegenius.ai${pathname}`; // Changed from router.asPath

  // Default values
  const defaultTitle = "ScheduleGenius - Optimize Your Productivity";
  const defaultDescription =
    "Create the perfect routine based on proven techniques from top performers";
  const defaultImage = "https://schedulegenius.ai/default-og-image.jpg";

  // Use provided values or fallbacks
  const seoTitle = title ? `${title} | ScheduleGenius` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoImage = image || defaultImage;

  return (
    <Head>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={article ? "article" : "website"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </Head>
  );
}
