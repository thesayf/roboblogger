import React, { useState } from "react";
import {
  Brain,
  Menu,
  Calendar,
  ChevronLeft,
  Share2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  content: string; // HTML or markdown content
  components?: any[]; // Blog components from database
}

interface BlogPost {
  uid: string;
  id?: string; // Added for relatedPosts
  data: BlogPostData;
}

// Type for SEO schema
interface SEOSchema {
  [key: string]: any; // Schema can have various properties
}

// Main component props
interface BlogPostPageClientProps {
  post: BlogPost;
  schema: SEOSchema;
  relatedPosts?: BlogPost[];
}

export default function BlogPostPageClient({
  post,
  schema,
  relatedPosts = [],
}: BlogPostPageClientProps) {
  // const [isSheetOpen, setIsSheetOpen] = useState(false);
  // No need for loading state, useEffect, or data fetching anymore

  // const handleAuthClick = () => {
  //   setIsSheetOpen(false);
  // };

  const sharePage = async () => {
    if (!post) return;

    const shareData = {
      title: post.data.title,
      text: post.data.description || "",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share(shareData);
        console.log("Shared successfully");
      } else {
        // Fallback to clipboard if Web Share API is not available
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // User likely canceled the share operation, no need to show an error
    }
  };

  // Format date
  const formatDate = (date: string | number | Date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Debug logging to understand the data structure
  console.log("=== POST DATA DEBUG ===");
  // Debug logging for post data
  console.log("Full post object:", post);
  console.log("Post data:", post.data);
  console.log("=== END DEBUG ===");

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <SEO
        title={post.data.title}
        description={post.data.description}
        image={post.data.featured_image?.url}
        article={true}
        schema={schema}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold text-[#1e293b]">
              RoboBlogger
            </span>
          </Link>

          {/* Blog section indicator */}
          <div className="ml-4 flex items-center text-sm font-medium text-[#64748b]">
            <Link href="/blog" className="hover:text-blue-600">
              / Blog
            </Link>
            <span>/ {post?.data.title}</span>
          </div>

          {/* Desktop Navigation */}
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

          {/* Mobile Navigation */}
          {/* <div className="ml-auto md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4">
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

                  <div className="flex flex-col gap-2 mt-4">
                    <SignedOut>
                      <SignUpButton mode="modal">
                        <Button
                          className="w-full bg-blue-600 text-white hover:bg-blue-700"
                          size="sm"
                          onClick={handleAuthClick}
                        >
                          Sign Up
                        </Button>
                      </SignUpButton>
                      <SignInButton mode="modal">
                        <Button
                          className="w-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-600"
                          size="sm"
                          onClick={handleAuthClick}
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
              </SheetContent>
            </Sheet>
          </div> */}
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
            {/* Main content area - now in a grid */}
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
                      {post.data.category || "Uncategorized"}
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

                  {/* Share button */}
                  {/* <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-[#64748b] hover:text-blue-600 hover:bg-blue-50"
                      onClick={sharePage}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div> */}
                </CardContent>
              </Card>

              {/* Article content card */}
              <Card className="mb-8 overflow-hidden border border-gray-100 shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="prose max-w-none text-[#1e293b]">
                    {/* Main article content */}
                    <p className="text-lg text-[#64748b] mb-6">
                      {post.data.description}
                    </p>

                    {/* Render any content before slices */}
                    <div className="rich-text mb-8">
                      {/* Render content as HTML */}
                      {post.data.content && (
                        <div dangerouslySetInnerHTML={{ __html: post.data.content }} />
                      )}
                    </div>

                    {/* Render components if any */}
                    {post.data.components && post.data.components.length > 0 && (
                      <div className="components-section">
                        {post.data.components.map((component: any, index: number) => (
                          <div key={index} className="component-block mb-6">
                            {/* Render each component based on its type */}
                            <div dangerouslySetInnerHTML={{ __html: component.content || '' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
                        daily life? RoboBlogger helps you create the perfect
                        routine based on proven techniques from top performers.
                      </p>
                      <div className="flex gap-3 w-full">
                        <SignedOut>
                          <SignUpButton mode="modal">
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                              Try RoboBlogger Free
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

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-[#1e293b]">
                RoboBlogger
              </span>
            </div>
            <div className="text-sm text-[#64748b]">
              © 2025 RoboBlogger. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
