import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Vibeblogger is the AI-powered blog engine that researches, writes, and publishes SEO-optimized content for your app. Headless API. Beautiful components. Zero effort.",
  alternates: {
    canonical: "https://vibeblogger.io/about",
  },
  openGraph: {
    title: "About | Vibeblogger",
    description:
      "AI that researches, writes, and publishes SEO-optimized blog posts for your app.",
    url: "https://vibeblogger.io/about",
    siteName: "Vibeblogger",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
