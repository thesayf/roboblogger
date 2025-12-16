"use client";

import React from 'react';

export default function HomeTestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-mono">
      {/* Centered container */}
      <div>
        {/* Logo - centered */}
        <div className="text-center mb-12">
          <div className="text-gray-900 font-normal tracking-[0.3em] text-3xl mb-2">
            DAYBOOK
          </div>
          <div className="text-gray-400 font-light tracking-[0.25em] text-sm uppercase text-left">
            Productivity
          </div>
        </div>

        {/* Nav list - left aligned */}
        <div className="space-y-3 text-base text-left">
          <button className="block text-gray-600 hover:text-gray-900 transition-colors">
            About Us
          </button>
          <button className="block text-gray-600 hover:text-gray-900 transition-colors">
            Blog
          </button>
          <button className="block text-gray-600 hover:text-gray-900 transition-colors">
            Sign In
          </button>
          <button className="block text-gray-600 hover:text-gray-900 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
