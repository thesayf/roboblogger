"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SchedulepadHome() {
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
      {/* Main container - horizontal notebook proportions */}
      <div className="relative w-full max-w-4xl bg-white shadow-sm border border-gray-200" style={{
        aspectRatio: '16/10',
        minHeight: '500px'
      }}>
        {/* Logo and tagline positioned off-center like Montblanc */}
        <div className="absolute" style={{
          top: '52%',
          left: '58%',
          transform: 'translate(-50%, -50%)'
        }}>
          <h1 className="text-sm font-medium tracking-[0.25em] text-gray-900 mb-3">
            SCHEDULEPAD
          </h1>
          <p className="text-xs font-light text-gray-400 tracking-wider">
            Endless possibilities for planning,<br />
            scheduling, and organizing ✏️
          </p>
        </div>

        {/* Enter prompt at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <p className="text-[10px] text-gray-300 tracking-widest animate-pulse">
            PRESS ENTER
          </p>
        </div>

        {/* Subtle left margin line like a notebook */}
        <div className="absolute left-12 top-0 bottom-0 w-px bg-red-100 opacity-50" />

        {/* Optional: subtle page texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
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
  );
}