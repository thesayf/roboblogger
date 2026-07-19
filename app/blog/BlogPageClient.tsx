"use client";
import React from "react";
import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";

interface BlogPageClientProps {
  initialPosts: Array<{
    id: string;
    uid: string;
    data: {
      title: string;
      description: string;
      date: string;
      category?: string;
      featured_image?: {
        url?: string;
        alt?: string;
      };
    };
  }>;
  schema: Record<string, any>;
}

export default function BlogPageClient({
  initialPosts,
  schema,
}: BlogPageClientProps) {
  const posts = initialPosts;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "No date";
    }
  };

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const latestPosts = posts.slice(1, 13);
  const archivePosts = posts.slice(13);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Nav */}
      <nav className="max-w-[1100px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-lora text-2xl font-bold tracking-tight">
          Vibeblogger
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/about" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            About
          </Link>
          <Link href="/pricing" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm text-[#666666] hover:text-[#111111] transition-colors hidden sm:block">
            Docs
          </Link>
          <Link href="/blog" className="text-sm text-[#111111] font-medium hidden sm:block">
            Blog
          </Link>
        </div>
      </nav>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Hero */}
      <section className="max-w-[720px] mx-auto px-8 pt-20 pb-16 text-center">
        <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
          Blog
        </p>
        <h1 className="font-lora text-[40px] sm:text-[56px] font-normal leading-[1.15] tracking-[-0.02em] mb-6">
          Ideas, guides &amp; insights
        </h1>
        <p className="text-lg text-[#666666] leading-[1.7] max-w-[480px] mx-auto">
          AI blogging tips, SEO strategies, and content automation insights. Publish better content with less effort.
        </p>
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* Featured Article */}
      {featuredPost && (
        <>
          <section className="max-w-[900px] mx-auto px-8 py-16">
            <Link href={`/blog/${featuredPost.uid}`} className="block group">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {featuredPost.data.featured_image?.url && (
                  <div className="bg-white border border-[#E0DED8] rounded-lg overflow-hidden">
                    <img
                      src={featuredPost.data.featured_image.url}
                      alt={featuredPost.data.featured_image.alt || featuredPost.data.title}
                      className="w-full h-[280px] object-cover"
                    />
                  </div>
                )}
                <div className={featuredPost.data.featured_image?.url ? "" : "md:col-span-2"}>
                  <div className="flex items-center gap-2 text-sm text-[#888888] mb-4">
                    <span className="uppercase tracking-[0.1em] text-xs font-medium">Featured</span>
                    <span>·</span>
                    <time dateTime={featuredPost.data.date}>
                      {formatDate(featuredPost.data.date)}
                    </time>
                    {featuredPost.data.category && (
                      <>
                        <span>·</span>
                        <span>{featuredPost.data.category}</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-lora text-[28px] sm:text-[32px] font-normal leading-[1.2] mb-4 group-hover:text-[#666666] transition-colors">
                    {featuredPost.data.title}
                  </h2>
                  <p className="text-[15px] text-[#666666] leading-relaxed">
                    {featuredPost.data.description}
                  </p>
                </div>
              </div>
            </Link>
          </section>

          <div className="mx-8 border-b border-[#E0DED8]" />
        </>
      )}

      {/* All Articles */}
      <section className="max-w-[900px] mx-auto px-8 py-16">
        <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-12">
          All Articles
        </h2>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#888888] text-lg">No articles yet. Check back soon.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.uid}`}
              className="block group"
            >
              {post.data.featured_image?.url && (
                <div className="bg-white border border-[#E0DED8] rounded-lg overflow-hidden mb-4">
                  <img
                    src={post.data.featured_image.url}
                    alt={post.data.featured_image.alt || post.data.title}
                    className="w-full h-[180px] object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-[#AAAAAA] mb-2">
                <time dateTime={post.data.date}>
                  {formatDate(post.data.date)}
                </time>
                {post.data.category && (
                  <>
                    <span>·</span>
                    <span>{post.data.category}</span>
                  </>
                )}
              </div>
              <h3 className="font-lora text-[20px] font-normal leading-[1.3] mb-2 group-hover:text-[#666666] transition-colors">
                {post.data.title}
              </h3>
              <p className="text-[13px] text-[#666666] leading-relaxed line-clamp-3">
                {post.data.description}
              </p>
            </Link>
          ))}
        </div>

        {archivePosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#E0DED8]">
            <h2 className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] mb-8">
              Article archive
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
              {archivePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.uid}`}
                  className="group border-b border-[#E0DED8] pb-5"
                >
                  <time dateTime={post.data.date} className="text-xs text-[#AAAAAA]">
                    {formatDate(post.data.date)}
                  </time>
                  <h3 className="font-lora text-[17px] leading-[1.35] mt-1 group-hover:text-[#666666] transition-colors">
                    {post.data.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="mx-8 border-b border-[#E0DED8]" />

      {/* CTA */}
      <section className="bg-[#111111] text-white mt-16">
        <div className="max-w-[600px] mx-auto px-8 py-24 text-center">
          <h2 className="font-lora text-4xl font-normal tracking-tight mb-4">Ready to start?</h2>
          <p className="text-base text-[#999999] mb-9">Your first blog post is free.</p>
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
