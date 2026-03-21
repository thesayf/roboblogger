"use client";

import { useEffect, useState } from 'react';
import { FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  publishedPosts: number;
  topicsResearched: number;
  components: number;
}

export default function LiveProofBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  const postsLabel = stats ? `${stats.publishedPosts.toLocaleString()} posts generated` : 'Posts generated';
  const topicsLabel = stats ? `${stats.topicsResearched.toLocaleString()} topics researched` : 'Topics researched';

  return (
    <section className="bg-[#FAFAF8] border-b border-[#E0DED8]">
      <div className="max-w-[900px] mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#888888]" />
          <span className="text-sm text-[#666666]">{postsLabel}</span>
        </div>
        <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#888888]" />
          <span className="text-sm text-[#666666]">{topicsLabel}</span>
        </div>
        <div className="hidden sm:block w-1 h-1 rounded-full bg-[#CCCCCC]" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#666666]">
            <Link href="/blog" className="underline underline-offset-2 hover:text-[#111111] transition-colors">
              This blog
            </Link> is 100% Vibeblogger
          </span>
        </div>
      </div>
    </section>
  );
}
