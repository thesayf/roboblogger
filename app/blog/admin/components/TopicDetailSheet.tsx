"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Edit,
  Trash2,
  PlayCircle,
  RefreshCw,
  Loader2,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  ChevronDown,
  ImageIcon,
  AlertCircle,
  Sparkles,
  Link2,
} from "lucide-react";
import { utcToLocalDateTime, localDateTimeToUTC } from "@/lib/timezone-utils";

interface TopicDetailSheetProps {
  topic: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (topicId: string, data: any) => Promise<void>;
  onDelete: (topicId: string) => Promise<void>;
  onGenerate: (topicId: string) => Promise<void>;
}

const defaultForm = {
  topic: "",
  audience: "",
  tone: "Professional but approachable",
  length: "Medium (800-1200 words)",
  includeImages: true,
  includeCallouts: true,
  includeCTA: true,
  additionalRequirements: "",
  brandContext: "",
  imageContext: "",
  referenceImages: [] as string[],
  scheduledAt: "",
  priority: "medium",
  tags: [] as string[],
  notes: "",
  internalLinks: [] as Array<{ postId: string; slug: string; title: string; description?: string }>,
  estimatedDuration: 5,
  seo: {
    primaryKeyword: "",
    secondaryKeywords: [] as string[],
    longTailKeywords: [] as string[],
    lsiKeywords: [] as string[],
    searchIntent: "informational" as "informational" | "commercial" | "navigational" | "transactional",
    metaTitle: "",
    metaDescription: "",
    openGraph: { title: "", description: "", image: "", type: "article" },
    schemaType: "BlogPosting" as "Article" | "BlogPosting" | "NewsArticle" | "HowToArticle" | "FAQPage",
    slug: "",
    canonicalUrl: "",
  },
};

function populateForm(topic: any) {
  return {
    topic: topic.topic || "",
    audience: topic.audience || "",
    tone: topic.tone || "Professional but approachable",
    length: topic.length || "Medium (800-1200 words)",
    includeImages: topic.includeImages !== undefined ? topic.includeImages : true,
    includeCallouts: topic.includeCallouts !== undefined ? topic.includeCallouts : true,
    includeCTA: topic.includeCTA !== undefined ? topic.includeCTA : true,
    additionalRequirements: topic.additionalRequirements || "",
    brandContext: topic.brandContext || "",
    imageContext: topic.imageContext || "",
    referenceImages: topic.referenceImages || [],
    priority: topic.priority || "medium",
    tags: topic.tags || [],
    notes: topic.notes || "",
    internalLinks: topic.internalLinks || [],
    estimatedDuration: topic.estimatedDuration || 5,
    scheduledAt: topic.scheduledAt ? utcToLocalDateTime(topic.scheduledAt) : "",
    seo: {
      primaryKeyword: topic.seo?.primaryKeyword || "",
      secondaryKeywords: topic.seo?.secondaryKeywords || [],
      longTailKeywords: topic.seo?.longTailKeywords || [],
      lsiKeywords: topic.seo?.lsiKeywords || [],
      searchIntent: topic.seo?.searchIntent || "informational",
      metaTitle: topic.seo?.metaTitle || "",
      metaDescription: topic.seo?.metaDescription || "",
      openGraph: {
        title: topic.seo?.openGraph?.title || "",
        description: topic.seo?.openGraph?.description || "",
        image: topic.seo?.openGraph?.image || "",
        type: topic.seo?.openGraph?.type || "article",
      },
      schemaType: topic.seo?.schemaType || "BlogPosting",
      slug: topic.seo?.slug || "",
      canonicalUrl: topic.seo?.canonicalUrl || "",
    },
  };
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// Read-only field row
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || (typeof value === "string" && !value.trim())) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-[12px] uppercase tracking-wider text-[#888888] w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-[14px] text-[#111111]">{value}</span>
    </div>
  );
}

function KeywordList({ keywords }: { keywords: string[] }) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw, i) => (
        <span key={i} className="px-2 py-0.5 rounded-full text-[12px] bg-[#F5F4F0] text-[#666666] border border-[#E0DED8]">
          {kw}
        </span>
      ))}
    </div>
  );
}

export function TopicDetailSheet({
  topic,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onGenerate,
}: TopicDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [newLongTailKeyword, setNewLongTailKeyword] = useState("");
  const [newLsiKeyword, setNewLsiKeyword] = useState("");
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkSearchResults, setLinkSearchResults] = useState<any[]>([]);
  const [isSearchingLinks, setIsSearchingLinks] = useState(false);

  // Reset edit state when topic changes or sheet closes
  useEffect(() => {
    if (topic && open) {
      setFormData(populateForm(topic));
      setIsEditing(false);
      setNewTagInput("");
      setNewSecondaryKeyword("");
      setNewLongTailKeyword("");
      setNewLsiKeyword("");
      setLinkSearchQuery("");
      setLinkSearchResults([]);
    }
  }, [topic, open]);

  const searchLinkedPosts = async (query: string) => {
    if (!query.trim()) {
      setLinkSearchResults([]);
      return;
    }
    setIsSearchingLinks(true);
    try {
      const res = await fetch('/api/blog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'searchRelatedBlogs', topic: query, limit: 8 }),
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out posts already in internalLinks
        const existingSlugs = new Set(formData.internalLinks.map((l) => l.slug));
        setLinkSearchResults((data.results || []).filter((r: any) => !existingSlugs.has(r.slug)));
      }
    } catch (err) {
      console.error("Link search error:", err);
    } finally {
      setIsSearchingLinks(false);
    }
  };

  if (!topic) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        scheduledAt: formData.scheduledAt ? localDateTimeToUTC(formData.scheduledAt) : undefined,
        referenceImages: formData.referenceImages,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
      };
      await onSave(topic._id, data);
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (t: any) => {
    const status = t.status === "pending" && t.scheduledAt ? "scheduled" : t.status;
    const map: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      scheduled: { className: "bg-blue-50 text-blue-700 border-blue-200", icon: <Calendar className="h-3 w-3" />, label: "Scheduled" },
      pending: { className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" />, label: "Pending" },
      generating: { className: "bg-purple-50 text-purple-700 border-purple-200", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Generating" },
      completed: { className: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="h-3 w-3" />, label: "Completed" },
      failed: { className: "bg-red-50 text-red-700 border-red-200", icon: <AlertTriangle className="h-3 w-3" />, label: "Failed" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.className}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: "bg-red-50 text-red-700 border-red-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low: "bg-green-50 text-green-700 border-green-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${map[priority] || map.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const addTag = () => {
    if (newTagInput.trim() && !formData.tags.includes(newTagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTagInput.trim()] }));
      setNewTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addKeyword = (type: "secondaryKeywords" | "longTailKeywords" | "lsiKeywords", value: string, setter: (v: string) => void, max: number) => {
    if (value.trim() && formData.seo[type].length < max) {
      setFormData((prev) => ({
        ...prev,
        seo: { ...prev.seo, [type]: [...prev.seo[type], value.trim()] },
      }));
      setter("");
    }
  };

  const removeKeyword = (type: "secondaryKeywords" | "longTailKeywords" | "lsiKeywords", keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, [type]: prev.seo[type].filter((k) => k !== keyword) },
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const searchIntentLabel: Record<string, string> = {
    informational: "Informational",
    commercial: "Commercial",
    navigational: "Navigational",
    transactional: "Transactional",
  };

  // --- READ MODE ---
  const readModeContent = (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
        <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-4">Overview</h3>
        <div className="space-y-1">
          <Field label="Audience" value={topic.audience} />
          <Field label="Tone" value={topic.tone} />
          <Field label="Length" value={topic.length} />
          <Field label="Priority" value={getPriorityBadge(topic.priority || "medium")} />
          <Field label="Scheduled" value={topic.scheduledAt ? formatDate(topic.scheduledAt) : null} />
          <Field label="Source" value={topic.source} />
          <Field label="Tags" value={topic.tags?.length > 0 ? <KeywordList keywords={topic.tags} /> : null} />
          <Field label="Notes" value={topic.notes} />
          <Field
            label="Content"
            value={
              <div className="flex items-center gap-2">
                {topic.includeImages !== false && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#F5F4F0] border border-[#E0DED8]">Images</span>}
                {topic.includeCallouts !== false && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#F5F4F0] border border-[#E0DED8]">Callouts</span>}
                {topic.includeCTA !== false && <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#F5F4F0] border border-[#E0DED8]">CTA</span>}
              </div>
            }
          />
        </div>
      </div>

      {/* SEO Section */}
      {(topic.seo?.primaryKeyword || topic.seo?.secondaryKeywords?.length > 0 || topic.seo?.searchIntent || topic.seo?.metaTitle || topic.seo?.slug) && (
        <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
          <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-4">SEO</h3>
          <div className="space-y-1">
            <Field label="Primary KW" value={topic.seo?.primaryKeyword} />
            <Field label="Secondary KW" value={topic.seo?.secondaryKeywords?.length > 0 ? <KeywordList keywords={topic.seo.secondaryKeywords} /> : null} />
            <Field label="Long-tail KW" value={topic.seo?.longTailKeywords?.length > 0 ? <KeywordList keywords={topic.seo.longTailKeywords} /> : null} />
            <Field label="LSI KW" value={topic.seo?.lsiKeywords?.length > 0 ? <KeywordList keywords={topic.seo.lsiKeywords} /> : null} />
            <Field label="Search Intent" value={topic.seo?.searchIntent ? searchIntentLabel[topic.seo.searchIntent] : null} />
            <Field
              label="Meta Title"
              value={topic.seo?.metaTitle ? (
                <span>{topic.seo.metaTitle} <span className="text-[11px] text-[#888888]">({topic.seo.metaTitle.length}/60)</span></span>
              ) : null}
            />
            <Field
              label="Meta Desc"
              value={topic.seo?.metaDescription ? (
                <span>{topic.seo.metaDescription} <span className="text-[11px] text-[#888888]">({topic.seo.metaDescription.length}/155)</span></span>
              ) : null}
            />
            <Field label="Slug" value={topic.seo?.slug ? <span className="font-mono text-[13px]">{topic.seo.slug}</span> : null} />
            <Field label="Canonical" value={topic.seo?.canonicalUrl} />
          </div>
        </div>
      )}

      {/* Content Settings Section */}
      {(topic.additionalRequirements || topic.brandContext || topic.imageContext) && (
        <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
          <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-4">Content Settings</h3>
          <div className="space-y-1">
            <Field label="Requirements" value={topic.additionalRequirements} />
            <Field label="Brand Context" value={topic.brandContext} />
            <Field label="Image Context" value={topic.imageContext} />
          </div>
        </div>
      )}

      {/* Internal Links (read-only) */}
      {topic.internalLinks && topic.internalLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
          <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-3">Internal Links</h3>
          <div className="space-y-1.5">
            {topic.internalLinks.map((link: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-[#888888] shrink-0" />
                <span className="text-[13px] text-[#111111]">{link.title}</span>
                <span className="text-[11px] text-[#888888]">/blog/{link.slug}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status & History Section (always read-only) */}
      <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
        <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-4">Status & History</h3>
        <div className="space-y-1">
          <Field label="Created" value={topic.createdAt ? formatDate(topic.createdAt) : null} />
          <Field label="Updated" value={topic.updatedAt ? formatDate(topic.updatedAt) : null} />
          {topic.status === "failed" && topic.error && (
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-[12px] uppercase tracking-wider text-[#888888] w-32 shrink-0 pt-0.5">Error</span>
              <span className="text-[14px] text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">{topic.error}</span>
            </div>
          )}
          <Field label="Phase" value={topic.generationPhase} />
          <Field label="Retries" value={topic.retryCount > 0 ? topic.retryCount : null} />
        </div>
      </div>
    </div>
  );

  // --- EDIT MODE ---
  const editModeContent = (
    <div className="space-y-5">
      {/* Topic Title */}
      <div>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">
          Topic Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.topic}
          onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
          placeholder="e.g., The Future of Remote Work in 2025"
          className="w-full h-11 bg-white border-[#E0DED8] focus:border-[#111111] focus:ring-[#111111] text-[15px]"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[13px] font-medium text-[#111111] mb-2 block">Target Audience</label>
          <Input
            value={formData.audience}
            onChange={(e) => setFormData((prev) => ({ ...prev, audience: e.target.value }))}
            placeholder="e.g., Marketing professionals"
            className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#111111] mb-2 block">Tone</label>
          <Select value={formData.tone} onValueChange={(value) => setFormData((prev) => ({ ...prev, tone: value }))}>
            <SelectTrigger className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional but approachable">Professional</SelectItem>
              <SelectItem value="Casual and friendly">Casual</SelectItem>
              <SelectItem value="Technical and authoritative">Technical</SelectItem>
              <SelectItem value="Conversational">Conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#111111] mb-2 block">Length</label>
          <Select value={formData.length} onValueChange={(value) => setFormData((prev) => ({ ...prev, length: value }))}>
            <SelectTrigger className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Short (400-600 words)">Short (400-600)</SelectItem>
              <SelectItem value="Medium (800-1200 words)">Medium (800-1200)</SelectItem>
              <SelectItem value="Long (1200-1500 words)">Long (1200-1500)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#111111] mb-2 block">Priority</label>
          <Select value={formData.priority} onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}>
            <SelectTrigger className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schedule */}
      <div className={topic.status === "completed" || topic.generatedPostId ? "opacity-50 pointer-events-none" : ""}>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">
          Schedule <span className="text-[#888888] font-normal">(Optional)</span>
        </label>
        <DateTimePicker
          value={formData.scheduledAt}
          onChange={(value) => setFormData((prev) => ({ ...prev, scheduledAt: value }))}
          placeholder="Pick a date and time"
        />
      </div>

      {/* Content Options */}
      <div className="bg-white rounded-xl border border-[#E0DED8] p-4">
        <label className="text-[13px] font-medium text-[#111111] mb-3 block">Content Options</label>
        <div className="flex items-center gap-4">
          {[
            { key: "includeImages" as const, label: "Images", icon: <ImageIcon className="h-3.5 w-3.5" /> },
            { key: "includeCallouts" as const, label: "Callouts", icon: <AlertCircle className="h-3.5 w-3.5" /> },
            { key: "includeCTA" as const, label: "CTA", icon: <Sparkles className="h-3.5 w-3.5" /> },
          ].map(({ key, label, icon }) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all text-[13px] ${
                formData[key] ? "bg-[#111111] text-white" : "bg-[#F5F4F0] text-[#666666] hover:bg-[#E8E6E1]"
              }`}
            >
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="sr-only"
              />
              {icon}
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Image Context */}
      {formData.includeImages && (
        <div className="bg-[#F5F4F0] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-[#666666]" />
            <span className="text-[13px] font-medium text-[#111111]">Image Options</span>
          </div>
          <label className="text-[12px] font-medium text-[#666666] mb-1.5 block">Image Style Description</label>
          <Textarea
            value={formData.imageContext}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageContext: e.target.value }))}
            placeholder="e.g., Modern minimalist with blue corporate tones..."
            rows={2}
            className="bg-white border-[#E0DED8] focus:border-[#111111] text-[13px] resize-none"
          />
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">Tags</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="Add a tag and press Enter..."
            onKeyPress={(e) => e.key === "Enter" && addTag()}
            className="flex-1 h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]"
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={!newTagInput.trim()} className="h-10 border-[#E0DED8] hover:bg-[#F5F4F0]">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[13px] bg-[#111111] text-white cursor-pointer hover:bg-[#333333] transition-colors"
                onClick={() => removeTag(tag)}
              >
                {tag} <X className="h-3 w-3" />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Additional Instructions */}
      <div>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">Additional Instructions (Optional)</label>
        <Textarea
          value={formData.additionalRequirements}
          onChange={(e) => setFormData((prev) => ({ ...prev, additionalRequirements: e.target.value }))}
          placeholder="Any specific requirements, keywords to include..."
          rows={3}
          className="bg-white border-[#E0DED8] focus:border-[#111111] text-[14px] resize-none"
        />
      </div>

      {/* Brand Context */}
      <div>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">Brand Context (Optional)</label>
        <Textarea
          value={formData.brandContext}
          onChange={(e) => setFormData((prev) => ({ ...prev, brandContext: e.target.value }))}
          placeholder="Specific brand guidelines for this topic..."
          rows={2}
          className="bg-white border-[#E0DED8] focus:border-[#111111] text-[14px] resize-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-[13px] font-medium text-[#111111] mb-2 block">Notes (Optional)</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Internal notes about this topic..."
          rows={2}
          className="bg-white border-[#E0DED8] focus:border-[#111111] text-[14px] resize-none"
        />
      </div>

      {/* Advanced SEO */}
      <details className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden group">
        <summary className="px-4 py-3 cursor-pointer text-[13px] font-medium text-[#111111] hover:bg-[#FAFAF8] transition-colors flex items-center justify-between list-none">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#888888]" />
            Advanced SEO Options
          </span>
          <ChevronDown className="h-4 w-4 text-[#888888] transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4 border-t border-[#E0DED8] bg-[#FAFAF8]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#111111] mb-2 block">Primary Keyword</label>
              <Input
                value={formData.seo.primaryKeyword}
                onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, primaryKeyword: e.target.value } }))}
                placeholder="e.g., remote work tips"
                className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#111111] mb-2 block">Search Intent</label>
              <Select
                value={formData.seo.searchIntent}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, searchIntent: value } }))}
              >
                <SelectTrigger className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="navigational">Navigational</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary Keywords */}
          <div>
            <label className="text-[13px] font-medium text-[#111111] mb-2 block">Secondary Keywords</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSecondaryKeyword}
                onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                placeholder="Add keyword..."
                onKeyPress={(e) => e.key === "Enter" && addKeyword("secondaryKeywords", newSecondaryKeyword, setNewSecondaryKeyword, 5)}
                className="flex-1 h-9 bg-white border-[#E0DED8] focus:border-[#111111] text-[13px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addKeyword("secondaryKeywords", newSecondaryKeyword, setNewSecondaryKeyword, 5)}
                disabled={!newSecondaryKeyword.trim()}
                className="h-9 border-[#E0DED8]"
              >
                Add
              </Button>
            </div>
            {formData.seo.secondaryKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.seo.secondaryKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#111111] text-white cursor-pointer" onClick={() => removeKeyword("secondaryKeywords", kw)}>
                    {kw} <X className="h-2.5 w-2.5" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Long-tail Keywords */}
          <div>
            <label className="text-[13px] font-medium text-[#111111] mb-2 block">Long-tail Keywords</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newLongTailKeyword}
                onChange={(e) => setNewLongTailKeyword(e.target.value)}
                placeholder="Add keyword..."
                onKeyPress={(e) => e.key === "Enter" && addKeyword("longTailKeywords", newLongTailKeyword, setNewLongTailKeyword, 3)}
                className="flex-1 h-9 bg-white border-[#E0DED8] focus:border-[#111111] text-[13px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addKeyword("longTailKeywords", newLongTailKeyword, setNewLongTailKeyword, 3)}
                disabled={!newLongTailKeyword.trim()}
                className="h-9 border-[#E0DED8]"
              >
                Add
              </Button>
            </div>
            {formData.seo.longTailKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.seo.longTailKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#111111] text-white cursor-pointer" onClick={() => removeKeyword("longTailKeywords", kw)}>
                    {kw} <X className="h-2.5 w-2.5" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* LSI Keywords */}
          <div>
            <label className="text-[13px] font-medium text-[#111111] mb-2 block">LSI Keywords</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newLsiKeyword}
                onChange={(e) => setNewLsiKeyword(e.target.value)}
                placeholder="Add keyword..."
                onKeyPress={(e) => e.key === "Enter" && addKeyword("lsiKeywords", newLsiKeyword, setNewLsiKeyword, 5)}
                className="flex-1 h-9 bg-white border-[#E0DED8] focus:border-[#111111] text-[13px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addKeyword("lsiKeywords", newLsiKeyword, setNewLsiKeyword, 5)}
                disabled={!newLsiKeyword.trim()}
                className="h-9 border-[#E0DED8]"
              >
                Add
              </Button>
            </div>
            {formData.seo.lsiKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.seo.lsiKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#111111] text-white cursor-pointer" onClick={() => removeKeyword("lsiKeywords", kw)}>
                    {kw} <X className="h-2.5 w-2.5" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* URL Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium text-[#111111] mb-2 block">URL Slug</label>
              <div className="flex gap-2">
                <Input
                  value={formData.seo.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, slug: generateSlug(e.target.value) } }))}
                  placeholder="auto-generated"
                  className="flex-1 h-10 bg-white border-[#E0DED8] focus:border-[#111111] font-mono text-[13px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const source = formData.seo.primaryKeyword || formData.topic;
                    if (source) setFormData((prev) => ({ ...prev, seo: { ...prev.seo, slug: generateSlug(source) } }));
                  }}
                  disabled={!formData.seo.primaryKeyword && !formData.topic}
                  className="h-10 border-[#E0DED8] hover:bg-white text-[13px]"
                >
                  Auto
                </Button>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#111111] mb-2 block">Canonical URL</label>
              <Input
                value={formData.seo.canonicalUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: e.target.value } }))}
                placeholder="https://..."
                className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]"
              />
            </div>
          </div>

          {/* Meta Title */}
          <div>
            <label className="text-[13px] font-medium text-[#111111] mb-2 block">
              Meta Title
              <span className={`ml-2 text-[11px] ${formData.seo.metaTitle.length > 50 ? "text-red-500" : "text-[#888888]"}`}>
                {formData.seo.metaTitle.length}/60
              </span>
            </label>
            <Input
              value={formData.seo.metaTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value.slice(0, 60) } }))}
              placeholder="Leave blank to auto-generate"
              maxLength={60}
              className="h-10 bg-white border-[#E0DED8] focus:border-[#111111] text-[14px]"
            />
          </div>

          {/* Meta Description */}
          <div>
            <label className="text-[13px] font-medium text-[#111111] mb-2 block">
              Meta Description
              <span className={`ml-2 text-[11px] ${formData.seo.metaDescription.length > 140 ? "text-red-500" : "text-[#888888]"}`}>
                {formData.seo.metaDescription.length}/155
              </span>
            </label>
            <Textarea
              value={formData.seo.metaDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value.slice(0, 155) } }))}
              placeholder="Leave blank to auto-generate"
              rows={2}
              maxLength={155}
              className="bg-white border-[#E0DED8] focus:border-[#111111] text-[14px] resize-none"
            />
          </div>
        </div>
      </details>

      {/* Internal Links */}
      <details className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden group">
        <summary className="px-4 py-3 cursor-pointer text-[13px] font-medium text-[#111111] hover:bg-[#FAFAF8] transition-colors flex items-center justify-between list-none">
          <span className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#888888]" />
            Internal Links
            {formData.internalLinks.length > 0 && (
              <span className="text-[11px] text-[#888888]">({formData.internalLinks.length})</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-[#888888] transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-[#E0DED8] bg-[#FAFAF8]">
          <p className="text-[12px] text-[#888888]">
            Select existing posts to link to. These will be woven into the generated content.
          </p>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              value={linkSearchQuery}
              onChange={(e) => setLinkSearchQuery(e.target.value)}
              placeholder="Search published posts..."
              onKeyDown={(e) => e.key === "Enter" && searchLinkedPosts(linkSearchQuery)}
              className="flex-1 h-9 bg-white border-[#E0DED8] focus:border-[#111111] text-[13px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => searchLinkedPosts(linkSearchQuery)}
              disabled={!linkSearchQuery.trim() || isSearchingLinks}
              className="h-9 border-[#E0DED8]"
            >
              {isSearchingLinks ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            </Button>
          </div>

          {/* Search results */}
          {linkSearchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {linkSearchResults.map((post: any) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => {
                    if (formData.internalLinks.length >= 6) return;
                    setFormData((prev) => ({
                      ...prev,
                      internalLinks: [...prev.internalLinks, {
                        postId: post._id || post.slug,
                        slug: post.slug,
                        title: post.title,
                        description: post.description?.slice(0, 200) || '',
                      }],
                    }));
                    setLinkSearchResults((prev) => prev.filter((r) => r.slug !== post.slug));
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E0DED8] transition-colors"
                >
                  <p className="text-[13px] font-medium text-[#111111] truncate">{post.title}</p>
                  <p className="text-[11px] text-[#888888] truncate">/blog/{post.slug}</p>
                </button>
              ))}
            </div>
          )}

          {/* Selected links */}
          {formData.internalLinks.length > 0 && (
            <div className="space-y-1.5">
              {formData.internalLinks.map((link, i) => (
                <div key={link.slug} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E0DED8]">
                  <Link2 className="h-3.5 w-3.5 text-[#888888] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111111] truncate">{link.title}</p>
                    <p className="text-[11px] text-[#888888] truncate">/blog/{link.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      internalLinks: prev.internalLinks.filter((_, j) => j !== i),
                    }))}
                    className="text-[#888888] hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {formData.internalLinks.length >= 6 && (
            <p className="text-[11px] text-[#888888]">Maximum 6 internal links reached.</p>
          )}
        </div>
      </details>

      {/* Status & History (always read-only, even in edit mode) */}
      <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
        <h3 className="text-[13px] font-semibold text-[#111111] uppercase tracking-wider mb-4">Status & History</h3>
        <div className="space-y-1">
          <Field label="Created" value={topic.createdAt ? formatDate(topic.createdAt) : null} />
          <Field label="Updated" value={topic.updatedAt ? formatDate(topic.updatedAt) : null} />
          {topic.status === "failed" && topic.error && (
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-[12px] uppercase tracking-wider text-[#888888] w-32 shrink-0 pt-0.5">Error</span>
              <span className="text-[14px] text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">{topic.error}</span>
            </div>
          )}
          <Field label="Phase" value={topic.generationPhase} />
          <Field label="Retries" value={topic.retryCount > 0 ? topic.retryCount : null} />
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E0DED8] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-[20px] font-semibold text-[#111111] truncate" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {topic.topic}
              </SheetTitle>
              <SheetDescription className="sr-only">Topic details</SheetDescription>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(topic)}
                {getPriorityBadge(topic.priority || "medium")}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(populateForm(topic));
                    setIsEditing(true);
                  }}
                  className="border-[#E0DED8] hover:bg-[#F5F4F0] text-[13px]"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {(topic.status === "pending" || topic.status === "failed") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerate(topic._id)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 text-[13px]"
                >
                  {topic.status === "failed" ? (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Retry</>
                  ) : (
                    <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Generate</>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(topic._id)}
                className="border-red-200 text-red-600 hover:bg-red-50 text-[13px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#FAFAF8]">
          {isEditing ? editModeContent : readModeContent}
        </div>

        {/* Sticky Footer (edit mode only) */}
        {isEditing && (
          <div className="sticky bottom-0 bg-white border-t border-[#E0DED8] px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFormData(populateForm(topic));
                setIsEditing(false);
              }}
              className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#666666] hover:bg-[#F5F4F0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !formData.topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium bg-[#111111] text-white hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Edit className="h-4 w-4" />Save Changes</>
              )}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
