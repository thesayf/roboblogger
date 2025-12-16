"use client";

import React from "react";
import {
  Brain,
  Calendar,
  ChevronLeft,
  BookOpen,
  Clock,
  Target,
  Zap,
  Shield,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import SEO from "@/app/components/SEO";
import MobileNavigationSheet from "@/app/components/MobileNavigationSheet";

interface FeaturedImage {
  url: string;
  alt?: string;
}

interface BlogPostData {
  title: string;
  description: string;
  featured_image?: FeaturedImage;
  category?: string;
  date: string;
  read_in_minutes: number;
  content: any;
  slices?: any[];
}

interface BlogPost {
  uid: string;
  id?: string;
  data: BlogPostData;
}

interface SEOSchema {
  [key: string]: any;
}

interface TestBlogPageClientProps {
  post: BlogPost;
  schema: SEOSchema;
  relatedPosts?: BlogPost[];
}

export default function TestBlogPageClient({
  post,
  schema,
  relatedPosts = [],
}: TestBlogPageClientProps) {
  const formatDate = (date: string | number | Date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SEO
        title={post.data.title}
        description={post.data.description}
        image={post.data.featured_image?.url}
        article={true}
        schema={schema}
      />

      {/* Header - Same as existing */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold text-[#1e293b]">
              ScheduleGenius
            </span>
          </Link>

          <div className="ml-4 flex items-center text-sm font-medium text-[#64748b]">
            <Link href="/blog" className="hover:text-blue-600">
              / Blog
            </Link>
            <span>/ {post?.data.title}</span>
          </div>

          <nav className="ml-auto hidden md:flex items-center gap-6">
            <Link
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-blue-600"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              href="/blog"
            >
              Blog
            </Link>
            <Link
              className="text-sm font-medium text-[#64748b] transition-colors hover:text-indigo-600"
              href="/about"
            >
              About
            </Link>

            <div className="flex items-center gap-2">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button
                    className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-600"
                    size="sm"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </nav>

          <MobileNavigationSheet />
        </div>
      </header>

      <main className="flex-1">
        {/* Back to blog link */}
        <div className="container mx-auto px-4 pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to all articles
          </Link>
        </div>

        {/* Blog post content */}
        <article className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content area */}
            <div className="lg:col-span-8">
              {/* Article header card */}
              <Card className="mb-8 overflow-hidden border border-gray-100 shadow-md">
                <CardContent className="p-6 sm:p-8 bg-white">
                  {/* Category, date, reading time */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      {post.data.category || "Productivity"}
                    </Badge>
                    <span className="text-sm text-[#64748b] flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />{" "}
                      {formatDate(post.data.date)}
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {post.data.read_in_minutes} {""}
                      minute read
                    </span>
                  </div>

                  {/* Title with improved styling */}
                  <h1 className="text-3xl md:text-4xl font-bold text-[#1e293b] mb-6 leading-tight">
                    {post.data.title}
                  </h1>

                  {/* Featured image */}
                  {post.data.featured_image?.url && (
                    <div className="w-full overflow-hidden rounded-lg mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.data.featured_image.url}
                        alt={
                          post.data.featured_image.alt ||
                          `Featured image for article: ${post.data.title}`
                        }
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: "500px" }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Article content - Notion-style minimalist */}
              <div className="bg-white py-8 px-12">
                <div className="max-w-none">
                  {/* Main article content */}
                  <p className="text-xl text-gray-600 leading-relaxed mb-12">
                    {post.data.description}
                  </p>

                  {/* Introduction */}
                  <div className="mb-16">
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {`In today's hyper-connected world, the ability to engage in
                      deep work has become both increasingly rare and incredibly
                      valuable. While most people are caught in cycles of
                      shallow work—checking emails, attending meetings,
                      scrolling through social media—those who master deep work
                      gain a significant competitive advantage.`}
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      This guide will show you exactly how to cultivate deep
                      work habits, eliminate distractions, and create the
                      conditions for your most productive and meaningful work.
                    </p>
                  </div>

                  {/* Main content sections */}
                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      What is Deep Work?
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6">
                      {`Deep work is the ability to focus without distraction on
                      cognitively demanding tasks. It's the skill that allows
                      you to quickly master complicated information and produce
                      better results in less time.`}
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 my-8 rounded-r-md">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <blockquote className="text-gray-800 text-lg leading-relaxed italic font-medium">
                            {`"Deep work is like a superpower in our increasingly
                            competitive twenty-first century economy."`}
                          </blockquote>
                          <footer className="text-gray-600 text-base mt-3 not-italic">
                            — Cal Newport
                          </footer>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg text-gray-700 leading-relaxed">
                      Unlike shallow work—tasks that are logistical in nature,
                      often performed while distracted—deep work pushes your
                      cognitive capabilities to their limit and creates new
                      value.
                    </p>
                  </section>

                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      The Four Rules of Deep Work
                    </h2>

                    <div className="space-y-12">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          Rule #1: Work Deeply
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          {`Transform deep work from aspiration to regular
                          practice by developing rituals and routines. Decide
                          where you'll work, when you'll work, and how you'll
                          structure your deep work sessions.`}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          Rule #2: Embrace Boredom
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Train your brain to resist distracting stimuli. The
                          ability to concentrate is a skill that must be
                          trained, and constant task-switching weakens your
                          mental muscles.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          Rule #3: Quit Social Media
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Be selective about the tools you use. Every moment you
                          spend on social media is a moment not spent on deep
                          work. Choose your digital tools intentionally.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          Rule #4: Drain the Shallows
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Minimize shallow work to make room for deep work.
                          Schedule every minute of your day and quantify the
                          depth of every activity to optimize your time
                          allocation.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      Practical Strategies for Implementation
                    </h2>

                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Time Blocking
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Schedule dedicated blocks of time for deep work. Treat
                          these appointments as seriously as any meeting.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Digital Minimalism
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Remove distracting apps, use website blockers, and
                          create phone-free work zones.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Environmental Design
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          {`Create a dedicated workspace that signals to your
                          brain it's time for focused work.`}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Ritual Development
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">
                          Develop consistent routines that help you transition
                          into and maintain deep work states.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      The Compound Effect of Deep Work
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-8">
                      The benefits of deep work compound over time. Each deep
                      work session not only produces valuable output but also
                      strengthens your ability to concentrate for future
                      sessions.
                    </p>

                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      Key Benefits:
                    </h3>
                    <ul className="space-y-3 text-lg text-gray-700">
                      <li>
                        • Increased productivity and quality of work output
                      </li>
                      <li>
                        • Enhanced ability to learn complex skills quickly
                      </li>
                      <li>
                        • Greater sense of fulfillment and purpose in work
                      </li>
                      <li>• Competitive advantage in knowledge work</li>
                    </ul>
                  </section>

                  <section className="mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                      Your Next Steps
                    </h2>
                    <p className="text-lg text-gray-700 leading-relaxed mb-8">
                      {`Starting your deep work practice doesn't require a
                      complete life overhaul. Begin with these simple steps:`}
                    </p>

                    <ol className="space-y-4 text-lg text-gray-700">
                      <li>
                        <strong>1.</strong> Choose one hour each day for
                        uninterrupted deep work
                      </li>
                      <li>
                        <strong>2.</strong> Remove all digital distractions from
                        your workspace
                      </li>
                      <li>
                        <strong>3.</strong> Track your deep work hours to build
                        consistency
                      </li>
                      <li>
                        <strong>4.</strong> Gradually increase your deep work
                        sessions as your focus improves
                      </li>
                    </ol>
                  </section>
                </div>
              </div>
            </div>

            {/* Sidebar - CTAs and other widgets */}
            <div className="lg:col-span-4">
              <div className="space-y-8 sticky top-24">
                {/* Featured CTA - Schedule Transformation */}
                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <Brain className="h-10 w-10 text-blue-600 mb-3" />
                      <h3 className="text-xl font-bold text-[#1e293b] mb-2">
                        Transform Your Schedule Today
                      </h3>
                      <p className="text-[#64748b] mb-4">
                        Want to apply these productivity principles to your
                        daily life? ScheduleGenius helps you create the perfect
                        routine based on proven techniques from top performers.
                      </p>
                      <div className="flex gap-3 w-full">
                        <SignedOut>
                          <SignUpButton mode="modal">
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                              Try ScheduleGenius Free
                            </Button>
                          </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                            <Link href="/app">Go to Schedule</Link>
                          </Button>
                        </SignedIn>
                        <Button
                          variant="outline"
                          className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Link href="/features">Learn More</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Newsletter signup */}
                <Card className="border border-blue-100">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-[#1e293b]">
                        Subscribe to our newsletter
                      </h3>
                    </div>
                    <p className="text-sm text-[#64748b] mb-4">
                      Get the latest productivity tips and scheduling insights
                      delivered to your inbox.
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="Your email address"
                        className="border-gray-200 focus:ring-blue-300"
                      />
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Subscribe
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-[#1e293b] mb-4">
                      Related Articles
                    </h3>
                    <div className="space-y-4">
                      {relatedPosts.length > 0 ? (
                        relatedPosts.map((relatedPost) => (
                          <div key={relatedPost.id} className="flex gap-3">
                            <div className="w-16 h-16 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                              <img
                                src={
                                  relatedPost.data.featured_image?.url ||
                                  "/images/placeholder-thumb.jpg"
                                }
                                alt={
                                  relatedPost.data.featured_image?.alt ||
                                  `Thumbnail for ${relatedPost.data.title}`
                                }
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium text-[#1e293b] text-sm hover:text-blue-600">
                                <Link href={`/blog/${relatedPost.uid}`}>
                                  {relatedPost.data.title}
                                </Link>
                              </h4>
                              <p className="text-xs text-[#64748b] mt-1">
                                {formatDate(relatedPost.data.date)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No related articles found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer - Same as existing */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-[#1e293b]">
                ScheduleGenius
              </span>
            </div>
            <div className="text-sm text-[#64748b]">
              © 2025 ScheduleGenius. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
