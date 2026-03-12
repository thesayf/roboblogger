"use client";

import React from "react";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";
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
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/blog" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Blog
          </Link>
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Article */}
      <article className="max-w-[720px] mx-auto px-8 pt-16 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#AAAAAA] mb-10">
          <Link href="/blog" className="hover:text-[#111111] transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-[#666666] truncate">{post.data.title}</span>
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[#888888] mb-6">
            <time dateTime={post.data.date}>{formatDate(post.data.date)}</time>
            {post.data.last_modified && post.data.last_modified !== post.data.date && (
              <>
                <span>·</span>
                <span>Updated {formatDate(post.data.last_modified)}</span>
              </>
            )}
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

          <h1 className="font-lora text-[36px] sm:text-[48px] font-normal leading-[1.15] tracking-[-0.02em] mb-6">
            {post.data.title}
          </h1>

          <p className="text-lg text-[#666666] leading-[1.7]">
            {post.data.description}
          </p>

          {post.data.author && (
            <p className="text-sm text-[#888888] mt-6">
              By {post.data.author}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.data.featured_image?.url && (
          <div className="mb-12 rounded-lg overflow-hidden border border-[#E0DED8]">
            <img
              src={post.data.featured_image.url}
              alt={post.data.featured_image.alt || post.data.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="prose prose-lg max-w-none prose-headings:font-lora prose-headings:font-normal prose-p:text-[#444444] prose-p:leading-[1.8] prose-a:text-[#111111] prose-a:underline prose-a:underline-offset-2">
          {post.data.content && Array.isArray(post.data.content) && (
            <BlogComponentRenderer components={post.data.content} />
          )}
        </div>
      </article>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <>
          <section className="max-w-[900px] mx-auto px-8 py-16">
            <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-10">
              More articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.uid}`}
                  className="block group"
                >
                  {related.data.featured_image?.url && (
                    <div className="bg-white border border-[#E0DED8] rounded-lg overflow-hidden mb-4">
                      <img
                        src={related.data.featured_image.url}
                        alt={related.data.featured_image.alt || related.data.title}
                        className="w-full h-[160px] object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}
                  <div className="text-xs text-[#AAAAAA] mb-2">
                    {formatDate(related.data.date)}
                  </div>
                  <h3 className="font-lora text-lg font-normal leading-[1.3] group-hover:text-[#666666] transition-colors">
                    {related.data.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>

          <div className="mx-8 border-b border-[#E0DED8]" />
        </>
      )}

      {/* CTA */}
      <section className="bg-[#111111] text-white mt-16">
        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h2 className="font-lora text-4xl font-normal tracking-tight mb-4">Ready to start?</h2>
          <p className="text-base text-[#999999] mb-9">Your first blog post is free. No credit card required.</p>
          <SignUpButton mode="modal">
            <button className="text-[15px] font-semibold text-[#111111] bg-white px-9 py-3.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer">
              Create your first post →
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 text-center">
        <p className="text-[13px] text-[#AAAAAA]">vibeblogger.io</p>
      </footer>
    </div>
  );
}
