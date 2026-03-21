"use client";

import { useEffect, useState } from 'react';
import { FileText, Search, Layers } from 'lucide-react';

interface Stats {
  publishedPosts: number;
  topicsResearched: number;
  components: number;
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  if (!stats || stats.publishedPosts === 0) return null;

  return (
    <section className="bg-white border-y border-[#E0DED8]">
      <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-10">
        <p className="text-sm font-medium text-[#888888] uppercase tracking-[0.15em] text-center mb-6">
          Live from our platform
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#888888]" />
              <span className="font-lora text-[32px] font-normal text-[#111111]">
                {stats.publishedPosts.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[#888888]">posts published</p>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Search className="w-4 h-4 text-[#888888]" />
              <span className="font-lora text-[32px] font-normal text-[#111111]">
                {stats.topicsResearched.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[#888888]">topics researched</p>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-[#888888]" />
              <span className="font-lora text-[32px] font-normal text-[#111111]">
                {stats.components.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-[#888888]">content components</p>
          </div>
        </div>
      </div>
    </section>
  );
}
