import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Integrate Vibeblogger into your app. Fetch blog content via headless API and render with your own components. Works with Next.js, Remix, Astro, or any frontend.",
  alternates: {
    canonical: "https://vibeblogger.io/docs",
  },
  openGraph: {
    title: "API Documentation | Vibeblogger",
    description:
      "Integrate Vibeblogger into your app. Headless API for blog content.",
    url: "https://vibeblogger.io/docs",
    siteName: "Vibeblogger",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
