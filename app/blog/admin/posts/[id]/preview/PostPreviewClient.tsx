"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import BlogComponentRenderer from "@/components/blog/BlogComponentRenderer";
import "@/app/blog/blog-content.css";

interface PostData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  featuredImage?: string;
  category?: string;
  tags?: string[];
  status: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt: string;
  readTime?: number;
  author?: { name: string };
  components: any[];
}

export default function PostPreviewClient({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPost = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Listen for agent data changes and auto-refresh
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collections?.includes("posts")) {
        fetchPost(true);
      }
    };
    window.addEventListener("chat-data-changed", handler);
    return () => window.removeEventListener("chat-data-changed", handler);
  }, [fetchPost]);

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#888888] mb-4">Post not found</p>
          <Link href="/blog/admin" className="text-sm text-[#111111] underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      {/* Preview toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E0DED8] px-6 py-3">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/blog/admin"
              className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#111111] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <div className="h-4 w-px bg-[#E0DED8]" />
            <span className="text-sm font-medium text-[#111111]">Content Preview</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              post.status === "published"
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              {post.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPost(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#111111] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F5F5F0]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            {post.slug && (
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm text-[#888888] hover:text-[#111111] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F5F5F0]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View live
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Blog post content — same layout as public blog */}
      <article className="max-w-[720px] mx-auto px-8 pt-16 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#AAAAAA] mb-10">
          <span>Blog</span>
          <span>/</span>
          <span className="text-[#666666] truncate">{post.title}</span>
        </div>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[#888888] mb-6">
            <time>{formatDate(post.publishedAt || post.createdAt)}</time>
            {post.updatedAt && post.updatedAt !== (post.publishedAt || post.createdAt) && (
              <>
                <span>·</span>
                <span>Updated {formatDate(post.updatedAt)}</span>
              </>
            )}
            {post.readTime && (
              <>
                <span>·</span>
                <span>{post.readTime} min read</span>
              </>
            )}
            {post.category && (
              <>
                <span>·</span>
                <span>{post.category}</span>
              </>
            )}
          </div>

          <h1 className="font-lora text-[36px] sm:text-[48px] font-normal leading-[1.15] tracking-[-0.02em] mb-6">
            {post.title}
          </h1>

          <p className="text-lg text-[#666666] leading-[1.7]">
            {post.description}
          </p>

          {post.author?.name && (
            <p className="text-sm text-[#888888] mt-6">
              By {post.author.name}
            </p>
          )}
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-12 rounded-lg overflow-hidden border border-[#E0DED8]">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="prose prose-lg max-w-none prose-headings:font-lora prose-headings:font-normal prose-p:text-[#444444] prose-p:leading-[1.8] prose-a:text-[#111111] prose-a:underline prose-a:underline-offset-2">
          {post.components && Array.isArray(post.components) && (
            <BlogComponentRenderer components={post.components} />
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[#E0DED8]">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-[#888888] bg-[#F5F5F0] px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
