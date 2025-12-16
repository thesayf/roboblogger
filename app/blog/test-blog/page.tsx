import { Metadata } from "next";
import TestBlogPageClient from "./TestBlogPageClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://schedulegenius.ai"),
  title: "The Ultimate Guide to Deep Work: Strategies for Peak Productivity",
  description:
    "Discover proven strategies to achieve deep work states, eliminate distractions, and maximize your productive output in today's attention-economy.",
  openGraph: {
    title: "The Ultimate Guide to Deep Work: Strategies for Peak Productivity",
    description:
      "Discover proven strategies to achieve deep work states, eliminate distractions, and maximize your productive output in today's attention-economy.",
    images: ["/images/blog/deep-work-hero.jpg"],
    type: "article",
  },
  alternates: {
    canonical: "https://schedulegenius.ai/blog/test-blog",
  },
  other: {
    "og:article:published_time": "2024-12-20",
    "og:article:modified_time": "2024-12-20",
  },
};

const mockPost = {
  uid: "test-blog",
  id: "test-1",
  data: {
    title: "The Ultimate Guide to Deep Work: Strategies for Peak Productivity",
    description:
      "Discover proven strategies to achieve deep work states, eliminate distractions, and maximize your productive output in today's attention-economy.",
    featured_image: {
      url: "/images/blog/deep-work-hero.jpg",
      alt: "Person working deeply focused at a minimalist desk setup",
    },
    category: "Productivity",
    date: "2024-12-20",
    read_in_minutes: 8,
    content: [],
    slices: [],
  },
};

const relatedPosts = [
  {
    uid: "time-blocking-mastery",
    id: "related-1",
    data: {
      title: "Time Blocking Mastery: How to Structure Your Perfect Day",
      description:
        "Learn the art of time blocking to create focused work sessions and eliminate decision fatigue.",
      featured_image: {
        url: "/images/blog/time-blocking-thumb.jpg",
        alt: "Calendar with blocked time segments",
      },
      category: "Time Management",
      date: "2024-12-15",
      read_in_minutes: 6,
      content: [],
      slices: [],
    },
  },
  {
    uid: "digital-minimalism",
    id: "related-2",
    data: {
      title: "Digital Minimalism: Reclaiming Your Attention in a Noisy World",
      description:
        "Practical steps to reduce digital clutter and create space for meaningful work.",
      featured_image: {
        url: "/images/blog/digital-minimalism-thumb.jpg",
        alt: "Clean workspace with minimal technology",
      },
      category: "Focus",
      date: "2024-12-10",
      read_in_minutes: 7,
      content: [],
      slices: [],
    },
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: mockPost.data.title,
  description: mockPost.data.description,
  image: mockPost.data.featured_image?.url,
  datePublished: mockPost.data.date,
  dateModified: mockPost.data.date,
  author: {
    "@type": "Organization",
    name: "ScheduleGenius",
  },
};

export default function TestBlogPage() {
  return (
    <TestBlogPageClient
      post={mockPost}
      schema={schema}
      relatedPosts={relatedPosts}
    />
  );
}
