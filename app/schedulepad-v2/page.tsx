"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function SchedulepadV2Home() {
  const router = useRouter();
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        router.push("/app");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-mono">
      {/* Navigation bar matching timeline */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left side - Navigation links */}
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-900 font-medium">SCHEDULEPAD</span>
            <nav className="flex gap-4">
              <Link href="/app" className="text-xs text-gray-600 hover:text-gray-900">
                Timeline
              </Link>
              <Link href="/inventory-5.0" className="text-xs text-gray-600 hover:text-gray-900">
                Inventory
              </Link>
              <Link href="/blog" className="text-xs text-gray-600 hover:text-gray-900">
                Blog
              </Link>
            </nav>
          </div>

          {/* Right side - User info and time */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {user && (
              <span className="text-gray-500">
                {user.firstName || user.emailAddresses[0]?.emailAddress}
              </span>
            )}
            <div className="text-right">
              <div>{formatTime(currentTime)}</div>
              <div className="text-gray-400">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 flex items-center justify-center">
        {/* Notebook design centered in content area */}
        <div className="relative w-full max-w-2xl bg-white" style={{
          aspectRatio: '8.5/11',
          minHeight: '500px',
          maxHeight: '70vh'
        }}>
          {/* Subtle border */}
          <div className="absolute inset-0 border border-gray-100 rounded-sm" />

          {/* Logo and tagline positioned off-center */}
          <div className="absolute" style={{
            top: '50%',
            left: '58%',
            transform: 'translate(-50%, -50%)'
          }}>
            <h1 className="text-sm font-medium tracking-[0.25em] text-gray-900 mb-3">
              SCHEDULEPAD
            </h1>
            <p className="text-xs font-light text-gray-400 tracking-wider">
              Endless possibilities for planning,<br />
              scheduling, and organizing
            </p>
          </div>

          {/* Enter prompt at bottom */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <p className="text-[10px] text-gray-300 tracking-widest animate-pulse">
              PRESS ENTER
            </p>
          </div>

          {/* Subtle left margin line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-red-50" />

          {/* Subtle horizontal lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 27px,
              #e5e5e5 27px,
              #e5e5e5 28px
            )`
          }} />
        </div>
      </div>

      {/* Footer with keyboard shortcuts */}
      <footer className="border-t border-gray-100 px-6 py-2">
        <div className="max-w-4xl mx-auto flex justify-between text-[10px] text-gray-400">
          <div className="flex gap-4">
            <span>ENTER → Timeline</span>
            <span>⌘I → Inventory</span>
            <span>⌘B → Blog</span>
          </div>
          <div>
            <span>v2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}