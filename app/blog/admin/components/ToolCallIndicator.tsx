"use client";

import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const TOOL_LABELS: Record<string, string> = {
  manage_task_plan: 'Updating research plan',
  search_keyword_data: 'Searching keyword data',
  search_related_keywords: 'Finding related keywords',
  search_trending_topics: 'Searching trending topics',
  search_competitor_content: 'Analyzing competitors',
  search_content_gaps: 'Finding content gaps',
  web_search: 'Searching the web',
  get_existing_posts: 'Checking existing content',
  get_blog_stats: 'Loading blog stats',
  get_brand_settings: 'Loading brand settings',
  get_topics_queue: 'Loading topics queue',
  search_chat_history: 'Searching past conversations',
  create_topic: 'Creating topic',
  create_topics_bulk: 'Creating topics',
  update_topic: 'Updating topic',
  update_post_status: 'Updating post status',
};

interface ToolCallIndicatorProps {
  name: string;
  status: 'running' | 'complete' | 'error';
}

export default function ToolCallIndicator({ name, status }: ToolCallIndicatorProps) {
  const label = TOOL_LABELS[name] || name;

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-[#F5F4F0] text-xs text-[#666666]">
      {status === 'running' && (
        <Loader2 className="w-3 h-3 animate-spin text-[#888888]" />
      )}
      {status === 'complete' && (
        <CheckCircle className="w-3 h-3 text-green-500" />
      )}
      {status === 'error' && (
        <AlertCircle className="w-3 h-3 text-red-500" />
      )}
      <span>{label}{status === 'running' ? '...' : ''}</span>
    </div>
  );
}
