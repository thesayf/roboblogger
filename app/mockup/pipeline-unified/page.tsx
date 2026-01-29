"use client";

import { useState } from "react";
import {
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Plus,
  Brain,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  Trash2,
  Play,
  Sparkles
} from "lucide-react";

// Mock data showing different states
const mockTopics = [
  {
    id: "1",
    topic: "The Future of Remote Work in 2026",
    status: "scheduled",
    scheduledFor: "2026-02-01T09:00:00",
    audience: "Working professionals",
    tone: "Professional",
  },
  {
    id: "2",
    topic: "10 AI Tools Every Marketer Needs",
    status: "scheduled",
    scheduledFor: "2026-02-03T14:00:00",
    audience: "Digital marketers",
    tone: "Casual",
  },
  {
    id: "3",
    topic: "Building a Personal Brand on LinkedIn",
    status: "pending",
    scheduledFor: null,
    audience: "Entrepreneurs",
    tone: "Professional",
  },
  {
    id: "4",
    topic: "How to Start a Successful Newsletter",
    status: "generating",
    scheduledFor: null,
    audience: "Content creators",
    tone: "Conversational",
    progress: 65,
  },
  {
    id: "5",
    topic: "The Complete Guide to SEO in 2026",
    status: "failed",
    scheduledFor: null,
    audience: "Business owners",
    tone: "Technical",
    error: "API rate limit exceeded",
  },
  {
    id: "6",
    topic: "Productivity Hacks for Busy Founders",
    status: "pending",
    scheduledFor: null,
    audience: "Startup founders",
    tone: "Casual",
  },
];

type FilterStatus = "all" | "scheduled" | "pending" | "generating" | "failed";

export default function PipelineUnifiedMockup() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const filteredTopics = filter === "all"
    ? mockTopics
    : mockTopics.filter(t => t.status === filter);

  const statusCounts = {
    scheduled: mockTopics.filter(t => t.status === "scheduled").length,
    pending: mockTopics.filter(t => t.status === "pending").length,
    generating: mockTopics.filter(t => t.status === "generating").length,
    failed: mockTopics.filter(t => t.status === "failed").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="h-3 w-3" />
            Scheduled
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "generating":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      {/* Header */}
      <header className="border-b border-[#E0DED8] bg-white">
        <div className="max-w-[1080px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                Vibeblogger
              </span>
              <span className="text-[#888888]">/</span>
              <span className="text-[#666666]">Dashboard</span>
            </div>
            <div className="flex items-center gap-4 text-[14px]">
              <span className="text-[#666666]">Docs</span>
              <span className="text-[#666666]">API Keys</span>
              <span className="text-[#666666]">View Blog</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1080px] mx-auto px-8 py-8">
        {/* Tabs (visual only) */}
        <div className="flex gap-8 border-b border-[#E0DED8] mb-8">
          <button className="pb-3 text-[15px] text-[#888888]">Posts</button>
          <button className="pb-3 text-[15px] text-[#111111] border-b-2 border-[#111111] font-medium">Pipeline</button>
          <button className="pb-3 text-[15px] text-[#888888]">Media</button>
          <button className="pb-3 text-[15px] text-[#888888]">Settings</button>
        </div>

        {/* Page Title & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Content Pipeline
            </h1>
            <p className="text-[14px] text-[#666666] mt-1">
              Topics queued for AI generation
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTopics.length > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-[14px] font-medium hover:bg-purple-700 transition-colors">
                <Sparkles className="h-4 w-4" />
                Generate {selectedTopics.length} Selected
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 border border-[#E0DED8] rounded-full text-[14px] hover:bg-[#F5F4F0] transition-colors">
              <Brain className="h-4 w-4" />
              AI Generate
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-full text-[14px] font-medium hover:bg-[#333333] transition-colors">
              <Plus className="h-4 w-4" />
              Add Topic
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              filter === "all"
                ? "bg-[#111111] text-white"
                : "bg-white border border-[#E0DED8] text-[#666666] hover:bg-[#F5F4F0]"
            }`}
          >
            All ({mockTopics.length})
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              filter === "scheduled"
                ? "bg-blue-600 text-white"
                : "bg-white border border-[#E0DED8] text-[#666666] hover:bg-[#F5F4F0]"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Scheduled ({statusCounts.scheduled})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              filter === "pending"
                ? "bg-amber-500 text-white"
                : "bg-white border border-[#E0DED8] text-[#666666] hover:bg-[#F5F4F0]"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilter("generating")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              filter === "generating"
                ? "bg-purple-600 text-white"
                : "bg-white border border-[#E0DED8] text-[#666666] hover:bg-[#F5F4F0]"
            }`}
          >
            <Loader2 className={`h-3.5 w-3.5 ${filter === "generating" ? "" : ""}`} />
            Generating ({statusCounts.generating})
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
              filter === "failed"
                ? "bg-red-600 text-white"
                : "bg-white border border-[#E0DED8] text-[#666666] hover:bg-[#F5F4F0]"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Failed ({statusCounts.failed})
          </button>
        </div>

        {/* Topics Table */}
        <div className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_120px_140px_100px_48px] gap-4 px-5 py-3 border-b border-[#F0EEE8] bg-[#FAFAF8]">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#E0DED8]"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTopics(filteredTopics.map(t => t.id));
                  } else {
                    setSelectedTopics([]);
                  }
                }}
              />
            </div>
            <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">Topic</span>
            <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">Status</span>
            <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">Scheduled</span>
            <span className="text-[11px] uppercase tracking-wider text-[#888888] font-medium">Audience</span>
            <span></span>
          </div>

          {/* Table Rows */}
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="grid grid-cols-[auto_1fr_120px_140px_100px_48px] gap-4 px-5 py-4 border-b border-[#F0EEE8] hover:bg-[#FAFAF8] transition-colors items-center"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#E0DED8]"
                  checked={selectedTopics.includes(topic.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTopics([...selectedTopics, topic.id]);
                    } else {
                      setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                    }
                  }}
                />
              </div>

              <div>
                <p className="text-[15px] text-[#111111] font-medium" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  {topic.topic}
                </p>
                {topic.status === "generating" && topic.progress && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#F0EEE8] rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#888888]">{topic.progress}%</span>
                  </div>
                )}
                {topic.status === "failed" && topic.error && (
                  <p className="text-[12px] text-red-600 mt-1">{topic.error}</p>
                )}
              </div>

              <div>{getStatusBadge(topic.status)}</div>

              <div className="text-[13px] text-[#666666]">
                {topic.scheduledFor ? formatScheduledDate(topic.scheduledFor) : "—"}
              </div>

              <div className="text-[13px] text-[#666666] truncate">
                {topic.audience}
              </div>

              <div className="flex items-center justify-end">
                {topic.status === "failed" ? (
                  <button className="p-2 hover:bg-[#F5F4F0] rounded-lg transition-colors text-amber-600" title="Retry">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                ) : topic.status === "pending" ? (
                  <button className="p-2 hover:bg-[#F5F4F0] rounded-lg transition-colors text-purple-600" title="Generate Now">
                    <Play className="h-4 w-4" />
                  </button>
                ) : (
                  <button className="p-2 hover:bg-[#F5F4F0] rounded-lg transition-colors text-[#888888]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[14px] text-blue-900 font-medium">How it works</p>
              <p className="text-[13px] text-blue-700 mt-1">
                When a topic is successfully generated, it automatically moves to the <strong>Posts</strong> tab as a draft.
                Failed topics stay here so you can retry them. The system checks for scheduled topics every 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
