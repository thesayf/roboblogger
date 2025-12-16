"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

type CleanBlogPost = {
  id: string;
  uid: string;
  data: {
    title: string;
    description: string;
    date: string;
    category?: string;
  };
};

export default function BlogHomeDraftPage() {
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

  const featuredArticle = posts.length > 0 ? posts[0] : null;
  const otherArticles = posts.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 font-mono">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-mono text-gray-900 tracking-tight">
            Daybook
          </Link>
          <nav className="flex items-center gap-6 text-sm font-mono">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/app" className="text-gray-600 hover:text-gray-900">
              Go to App
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-normal text-gray-900 mb-4 font-mono">
            Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Evidence-based productivity methods. No fluff, no hacks, no &quot;one weird trick.&quot;
            Just research-backed approaches that actually work.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <Link href={`/blog/${featuredArticle.uid}`} className="block group">
              <div className="flex items-start gap-2 text-xs text-gray-500 mb-3 font-mono">
                <span className="uppercase tracking-wide">Featured</span>
                <span>·</span>
                <time dateTime={featuredArticle.data.date}>
                  {formatDate(featuredArticle.data.date)}
                </time>
              </div>
              <h2 className="text-3xl font-normal text-gray-900 mb-3 group-hover:text-gray-600 transition-colors"
                  style={{ fontFamily: 'Georgia, serif' }}>
                {featuredArticle.data.title}
              </h2>
              <p className="text-gray-600 text-lg mb-4 leading-relaxed max-w-3xl"
                 style={{ fontFamily: 'Georgia, serif' }}>
                {featuredArticle.data.description}
              </p>
              {featuredArticle.data.category && (
                <div className="flex items-center gap-3 text-sm text-gray-500 font-mono">
                  <span>{featuredArticle.data.category}</span>
                </div>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-8 font-mono">
            All Articles
          </h2>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-mono">No articles yet. Check back soon!</p>
            </div>
          )}

          <div className="space-y-12">
            {otherArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.uid}`}
                className="block group"
              >
                <div className="flex items-start gap-2 text-xs text-gray-500 mb-2 font-mono">
                  <time dateTime={article.data.date}>
                    {formatDate(article.data.date)}
                  </time>
                  {article.data.category && (
                    <>
                      <span>·</span>
                      <span>{article.data.category}</span>
                    </>
                  )}
                </div>
                <h3 className="text-2xl font-normal text-gray-900 mb-2 group-hover:text-gray-600 transition-colors"
                    style={{ fontFamily: 'Georgia, serif' }}>
                  {article.data.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-3xl"
                   style={{ fontFamily: 'Georgia, serif' }}>
                  {article.data.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-gray-200 mt-24">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-normal text-gray-900 mb-4">
            Ready to try time-blocking?
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Daybook combines the best of GTD and time-blocking into a keyboard-first tool
            that stays out of your way.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gray-900 text-white font-mono hover:bg-gray-800 transition-colors"
          >
            Get Started — Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2025 Daybook</p>
            <Link href="/" className="hover:text-gray-900">
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
