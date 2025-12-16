"use client";

import React from "react";
import Link from "next/link";
import BlogComponentRenderer from "@/components/blog/BlogComponentRenderer";
import "@/app/blog/blog-content.css";

interface BlogPost {
  id: string;
  uid: string;
  data: {
    title: string;
    description: string;
    featured_image?: {
      url: string;
      alt?: string;
    };
    category?: string;
    date: string;
    last_modified?: string;
    content: any;
    slices?: any[];
    read_in_minutes: number;
    author?: string;
  };
}

interface SimpleBlogPostClientProps {
  post: BlogPost;
  schema: Record<string, any>;
  relatedPosts?: BlogPost[];
}

export default function SimpleBlogPostClient({
  post,
  schema,
  relatedPosts = [],
}: SimpleBlogPostClientProps) {
  // Format date
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Matches homepage-minimal */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
            Daybook
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/pricing" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/blog-redesign" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 py-20">
        {/* Article Header */}
        <header className="mb-16">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 font-mono">
            <time dateTime={post.data.date}>{formatDate(post.data.date)}</time>
            {post.data.read_in_minutes && (
              <>
                <span>·</span>
                <span>{post.data.read_in_minutes} min read</span>
              </>
            )}
            {post.data.category && (
              <>
                <span>·</span>
                <span>{post.data.category}</span>
              </>
            )}
          </div>

          <h1 className="text-5xl text-gray-900 mb-8 leading-tight" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            {post.data.title}
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed mb-8" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            {post.data.description}
          </p>

          {/* Featured Image */}
          {post.data.featured_image?.url && (
            <div className="mb-8 overflow-hidden bg-gray-100">
              <img
                src={
                  post.uid === "energy-audit-peak-performance-hours"
                    ? "https://media.istockphoto.com/id/183311199/vector/feather-set.jpg?s=612x612&w=0&k=20&c=Uv0rtL49ykYKsdhSOudk4k9nWXOC1E3AYjwilI9cpRo="
                    : post.uid === "stephen-king-morning-writing-routine"
                    ? "https://static.vecteezy.com/system/resources/thumbnails/010/403/126/small_2x/illustration-in-doodle-style-simple-line-drawn-wildflowers-graphic-black-and-white-drawing-border-frame-abstract-flowers-leaves-branches-vector.jpg"
                    : post.data.featured_image.url
                }
                alt={post.data.featured_image.alt || post.data.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </header>

        {/* Article Body - Render Blog Components */}
        <div className="prose prose-xl max-w-none text-xl leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {post.data.content && Array.isArray(post.data.content) && (
            <BlogComponentRenderer components={post.data.content} />
          )}
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 Daybook. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  );
}
