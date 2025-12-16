"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

// Mock the CleanBlogPost type from your actual blog
type CleanBlogPost = {
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
};

export default function BlogRedesignPage() {
  const [posts, setPosts] = useState<CleanBlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real posts from your API
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/blog/posts?status=published&limit=50');
        const data = await response.json();
        // API returns { posts: [...], pagination: {...} }
        const transformedPosts: CleanBlogPost[] = data.posts.map((post: any) => ({
          id: post._id,
          uid: post.slug,
          data: {
            title: post.title,
            description: post.description,
            date: post.publishedAt || post.createdAt,
            category: post.category,
            featured_image: (post.featuredImage || post.featuredImageThumbnail)
              ? {
                  url: post.featuredImage || post.featuredImageThumbnail,
                  alt: post.title,
                }
              : undefined,
          },
        }));
        setPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'No date';
    }
  };

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const otherPosts = posts.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 font-mono">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
            <Link href="/blog-redesign" className="text-sm font-mono text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-20">
          {/* Header */}
          <div className="mb-20">
            <h1 className="text-5xl text-gray-900 mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Blog
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Evidence-based productivity methods. No fluff, no hacks, no &quot;one weird trick.&quot; Just research-backed approaches that actually work.
            </p>
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>No articles yet. Check back soon.</p>
            </div>
          )}

          {/* All Articles - Clean list */}
          {posts.length > 0 && (
            <div className="space-y-16">
              {posts.map((post, index) => (
                <article key={post.id} className="group">
                  <Link href={`/blog/${post.uid}`} className="block">
                    {/* Image */}
                    <div className="mb-6 overflow-hidden bg-gray-100">
                      <img
                        src={
                          index === 0
                            ? "https://media.istockphoto.com/id/183311199/vector/feather-set.jpg?s=612x612&w=0&k=20&c=Uv0rtL49ykYKsdhSOudk4k9nWXOC1E3AYjwilI9cpRo="
                            : index === 1
                            ? "https://static.vecteezy.com/system/resources/thumbnails/010/403/126/small_2x/illustration-in-doodle-style-simple-line-drawn-wildflowers-graphic-black-and-white-drawing-border-frame-abstract-flowers-leaves-branches-vector.jpg"
                            : post.data.featured_image?.url
                        }
                        alt={post.data.featured_image?.alt || post.data.title}
                        className="w-full h-64 object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </div>

                    <h2 className="text-3xl text-gray-900 mb-3 group-hover:text-gray-700 transition-colors leading-snug" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {post.data.title}
                    </h2>
                  </Link>
                  <p className="text-lg text-gray-600 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                    {post.data.description}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 Daybook. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  );
}
