"use client";
import React, { useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

const blogPosts = [
  {
    id: 1,
    title: "The Science of Deep Work",
    excerpt: "Understanding how focused work sessions can transform your productivity and the neuroscience behind deep concentration.",
    date: "September 20, 2025",
    readTime: "5 min",
    category: "Productivity"
  },
  {
    id: 2,
    title: "Building Sustainable Routines",
    excerpt: "How to create daily routines that stick and adapt to your changing life circumstances.",
    date: "September 15, 2025",
    readTime: "4 min",
    category: "Habits"
  },
  {
    id: 3,
    title: "Time Blocking Fundamentals",
    excerpt: "A comprehensive guide to time blocking and how it can revolutionize your daily schedule.",
    date: "September 10, 2025",
    readTime: "6 min",
    category: "Time Management"
  },
  {
    id: 4,
    title: "The Art of Prioritization",
    excerpt: "Learn how to identify what truly matters and allocate your time accordingly.",
    date: "September 5, 2025",
    readTime: "4 min",
    category: "Strategy"
  },
  {
    id: 5,
    title: "Energy Management Over Time Management",
    excerpt: "Why managing your energy levels is more important than managing time alone.",
    date: "September 1, 2025",
    readTime: "5 min",
    category: "Wellness"
  }
];

export default function BlogNew() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Productivity", "Habits", "Time Management", "Strategy", "Wellness"];

  const filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-sm font-light tracking-[0.3em] text-gray-900 cursor-pointer hover:text-gray-600 transition-colors">
              SCHEDULEGENIUS
            </h1>
          </Link>

          <nav className="flex items-center gap-8">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Menu
            </button>
          </nav>
        </div>
      </header>

      {/* Side menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform z-40 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-8">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="mb-8 text-gray-500 hover:text-gray-900"
          >
            ✕
          </button>

          <nav className="space-y-6">
            <Link href="/" className="block text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link href="/blog" className="block text-gray-700 hover:text-gray-900">
              Blog
            </Link>
            <div className="pt-6 space-y-4 border-t">
              <SignUpButton mode="modal">
                <button className="block w-full text-left text-gray-700 hover:text-gray-900">
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="block w-full text-left text-gray-700 hover:text-gray-900">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="pt-32 pb-20 px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Page title */}
          <div className="mb-16">
            <h2 className="text-sm font-light tracking-[0.2em] text-gray-500 mb-4">JOURNAL</h2>
            <p className="text-gray-600 font-light max-w-2xl" style={{ fontFamily: 'Georgia, serif' }}>
              Thoughts on productivity, time management, and building sustainable work habits.
            </p>
          </div>

          {/* Category filter */}
          <div className="mb-12 flex gap-6 pb-8 border-b border-gray-200">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-sm transition-all ${
                  selectedCategory === category
                    ? "text-gray-900 border-b border-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Blog posts */}
          <div className="space-y-8">
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="bg-white rounded-sm p-8 hover:shadow-sm transition-shadow border border-transparent hover:border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl text-gray-200 font-light">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-xl mb-3 text-gray-900 hover:text-gray-600 transition-colors cursor-pointer"
                      style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                  </h3>
                </Link>

                <p className="text-gray-600 font-light leading-relaxed mb-4"
                   style={{ fontFamily: 'Georgia, serif', fontSize: '15px' }}>
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {post.date}
                  </span>
                  <Link href={`/blog/${post.id}`}>
                    <span className="text-sm text-gray-900 hover:text-gray-600 transition-colors cursor-pointer">
                      Read →
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter signup */}
          <div className="mt-20 pt-12 border-t border-gray-200">
            <div className="bg-white rounded-sm p-12 text-center">
              <h3 className="text-sm font-light tracking-[0.2em] text-gray-900 mb-4">
                STAY UPDATED
              </h3>
              <p className="text-gray-600 font-light mb-8 max-w-md mx-auto"
                 style={{ fontFamily: 'Georgia, serif' }}>
                Get weekly insights on productivity and time management delivered to your inbox.
              </p>
              <div className="flex max-w-md mx-auto gap-4">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-gray-400 text-sm"
                />
                <button className="px-6 py-3 text-sm tracking-wide text-gray-900 border border-gray-900 rounded-sm hover:bg-gray-900 hover:text-white transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}