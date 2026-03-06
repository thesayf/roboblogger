"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Routine {
  id: string;
  name: string;
  prompt: string;
  schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
  };
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt?: string;
  lastRunStatus?: string;
  maxCreditsPerRun: number;
  templateId?: string;
  totalRuns: number;
  successfulRuns: number;
  totalCreditsUsed: number;
  createdAt: string;
  lastExecution?: {
    status: string;
    response: string;
    toolCalls: number;
    creditsUsed: number;
    completedAt: string;
  } | null;
}

interface RoutineExecution {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  response: string;
  toolCalls: Array<{ name: string; success: boolean }>;
  dataChanged: string[];
  creditsUsed: number;
  error?: string;
}

const TEMPLATES = [
  {
    id: "weekly-research",
    name: "Weekly Topic Research",
    prompt: "Research trending topics in my niche, check for content gaps against my existing posts, and queue 3-5 new topics with full SEO data (primary keyword, secondary keywords, search intent, audience, and additional requirements).",
    schedule: { frequency: "weekly" as const, dayOfWeek: 1, hour: 9, minute: 0 },
  },
  {
    id: "content-filler",
    name: "Content Calendar Filler",
    prompt: "Check my topic queue. If there are fewer than 5 pending topics, research my niche for opportunities and add enough topics to maintain a consistent publishing schedule. Include full SEO data for each.",
    schedule: { frequency: "weekly" as const, dayOfWeek: 3, hour: 9, minute: 0 },
  },
  {
    id: "seo-audit",
    name: "SEO Audit",
    prompt: "Review my 5 most recent published posts. For each, check the title, meta description, keyword usage, and internal linking. Report any issues found and suggest specific improvements.",
    schedule: { frequency: "monthly" as const, dayOfMonth: 1, hour: 10, minute: 0 },
  },
  {
    id: "internal-links",
    name: "Internal Link Builder",
    prompt: "Review my 3 most recent published posts. For each, search for older posts that are topically related and could be linked. Edit the posts to add 2-3 relevant internal links where they naturally fit.",
    schedule: { frequency: "weekly" as const, dayOfWeek: 5, hour: 14, minute: 0 },
  },
  {
    id: "stale-refresh",
    name: "Stale Content Refresh",
    prompt: "Find my 3 oldest published posts. Evaluate whether they need updating with current information, better SEO, or improved content. If so, edit them with improvements.",
    schedule: { frequency: "monthly" as const, dayOfMonth: 15, hour: 10, minute: 0 },
  },
  {
    id: "competitor-watch",
    name: "Competitor Watch",
    prompt: "Search for recent blog posts from competitors in my niche using web search. Identify topics they are covering that I have not written about yet. Report your findings with specific topic suggestions.",
    schedule: { frequency: "weekly" as const, dayOfWeek: 1, hour: 8, minute: 0 },
  },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatSchedule(schedule: Routine["schedule"]): string {
  const time = `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")} UTC`;
  switch (schedule.frequency) {
    case "daily":
      return `Daily at ${time}`;
    case "weekly":
      return `${DAY_NAMES[schedule.dayOfWeek ?? 1]}s at ${time}`;
    case "monthly":
      return `${schedule.dayOfMonth ?? 1}${getOrdinalSuffix(schedule.dayOfMonth ?? 1)} of each month at ${time}`;
    case "once":
      return `Once at ${time}`;
    default:
      return schedule.frequency;
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function RoutinesTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<Record<string, RoutineExecution[]>>({});
  const [executingRoutines, setExecutingRoutines] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: "",
    prompt: "",
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 9,
    minute: 0,
    maxCreditsPerRun: 1.0,
  });

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blog/routines");
      const data = await response.json();
      if (response.ok) setRoutines(data.routines || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutionHistory = async (routineId: string) => {
    try {
      const response = await fetch(`/api/blog/routines/${routineId}`);
      const data = await response.json();
      if (response.ok) {
        setExecutionHistory((prev) => ({ ...prev, [routineId]: data.executions || [] }));
      }
    } catch (error) {
      console.error("Error fetching execution history:", error);
    }
  };

  const createRoutine = async (overrides?: Partial<typeof form>) => {
    const data = overrides ? { ...form, ...overrides } : form;
    if (!data.name || !data.prompt) {
      setSaveMessage({ type: "error", text: "Name and prompt are required" });
      return;
    }

    setSaving(true);
    try {
      const schedule: any = {
        frequency: data.frequency,
        hour: data.hour,
        minute: data.minute,
      };
      if (data.frequency === "weekly") schedule.dayOfWeek = data.dayOfWeek;
      if (data.frequency === "monthly") schedule.dayOfMonth = data.dayOfMonth;

      const response = await fetch("/api/blog/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          prompt: data.prompt,
          schedule,
          maxCreditsPerRun: data.maxCreditsPerRun,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: "success", text: "Routine created" });
        setShowCreate(false);
        setShowTemplates(false);
        setForm({ name: "", prompt: "", frequency: "weekly", dayOfWeek: 1, dayOfMonth: 1, hour: 9, minute: 0, maxCreditsPerRun: 1.0 });
        fetchRoutines();
      } else {
        const err = await response.json();
        setSaveMessage({ type: "error", text: err.error || "Failed to create routine" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to create routine" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const toggleRoutine = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/blog/routines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    } catch (error) {
      console.error("Error toggling routine:", error);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      await fetch(`/api/blog/routines/${id}`, { method: "DELETE" });
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting routine:", error);
    }
  };

  const executeRoutine = async (id: string) => {
    setExecutingRoutines((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/blog/routines/${id}/execute`, { method: "POST" });
      // Refresh after a delay to let execution complete
      setTimeout(() => {
        fetchRoutines();
        if (expandedRoutine === id) fetchExecutionHistory(id);
        setExecutingRoutines((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 5000);
    } catch (error) {
      console.error("Error executing routine:", error);
      setExecutingRoutines((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setForm({
      name: template.name,
      prompt: template.prompt,
      frequency: template.schedule.frequency,
      dayOfWeek: template.schedule.dayOfWeek ?? 1,
      dayOfMonth: template.schedule.dayOfMonth ?? 1,
      hour: template.schedule.hour,
      minute: template.schedule.minute,
      maxCreditsPerRun: 1.0,
    });
    setShowTemplates(false);
    setShowCreate(true);
  };

  const toggleExpand = (id: string) => {
    if (expandedRoutine === id) {
      setExpandedRoutine(null);
    } else {
      setExpandedRoutine(id);
      if (!executionHistory[id]) {
        fetchExecutionHistory(id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[#111111]">Routines</h2>
          <p className="text-[13px] text-[#888888] mt-1">
            Automated recurring tasks powered by your AI agent
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-[13px]"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Templates
          </Button>
          <Button
            size="sm"
            className="rounded-full text-[13px] bg-[#111111] hover:bg-[#333333] text-white"
            onClick={() => { setShowCreate(!showCreate); setShowTemplates(false); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Routine
          </Button>
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`px-4 py-2 rounded-lg text-[13px] ${saveMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {saveMessage.text}
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE8]">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#666666]" />
              <h3 className="text-[16px] font-semibold text-[#111111]">Quick Start Templates</h3>
            </div>
            <p className="text-[13px] text-[#888888] mt-1">Pre-configured routines you can add with one click</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="text-left p-4 rounded-lg border border-[#E0DED8] hover:border-[#111111] hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="font-medium text-[14px] text-[#111111]">{template.name}</div>
                <div className="text-[12px] text-[#888888] mt-1 line-clamp-2">{template.prompt}</div>
                <div className="text-[11px] text-[#AAAAAA] mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatSchedule(template.schedule)}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Create Form */}
      {showCreate && (
        <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE8]">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#666666]" />
              <h3 className="text-[16px] font-semibold text-[#111111]">Create Routine</h3>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <Label className="text-[13px] font-medium text-[#444444]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Weekly Topic Research"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[13px] font-medium text-[#444444]">Prompt</Label>
              <Textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                placeholder="What should the agent do? Be specific..."
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-[13px] font-medium text-[#444444]">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="once">Once</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.frequency === "weekly" && (
                <div>
                  <Label className="text-[13px] font-medium text-[#444444]">Day</Label>
                  <Select value={String(form.dayOfWeek)} onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: parseInt(v) }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAY_NAMES.map((day, i) => (
                        <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.frequency === "monthly" && (
                <div>
                  <Label className="text-[13px] font-medium text-[#444444]">Day of Month</Label>
                  <Select value={String(form.dayOfMonth)} onValueChange={(v) => setForm((f) => ({ ...f, dayOfMonth: parseInt(v) }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-[13px] font-medium text-[#444444]">Hour (UTC)</Label>
                <Select value={String(form.hour)} onValueChange={(v) => setForm((f) => ({ ...f, hour: parseInt(v) }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[13px] font-medium text-[#444444]">Max Credits</Label>
                <Select value={String(form.maxCreditsPerRun)} onValueChange={(v) => setForm((f) => ({ ...f, maxCreditsPerRun: parseFloat(v) }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5</SelectItem>
                    <SelectItem value="1">1.0</SelectItem>
                    <SelectItem value="2">2.0</SelectItem>
                    <SelectItem value="5">5.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => createRoutine()}
                disabled={saving}
                className="rounded-full text-[13px] bg-[#111111] hover:bg-[#333333] text-white"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                Create Routine
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="rounded-full text-[13px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Routines List */}
      {routines.length === 0 && !showCreate && !showTemplates ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E0DED8]">
          <Clock className="h-10 w-10 text-[#CCCCCC] mx-auto mb-3" />
          <h3 className="text-[16px] font-medium text-[#444444]">No routines yet</h3>
          <p className="text-[13px] text-[#888888] mt-1 max-w-md mx-auto">
            Create automated routines to have your AI agent research topics, audit content, and manage your blog on autopilot.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-[13px]"
              onClick={() => setShowTemplates(true)}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Browse Templates
            </Button>
            <Button
              size="sm"
              className="rounded-full text-[13px] bg-[#111111] hover:bg-[#333333] text-white"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Routine
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden"
            >
              {/* Routine Header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleExpand(routine.id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${routine.enabled ? "bg-green-500" : "bg-[#CCCCCC]"}`} />
                    <span className="font-medium text-[14px] text-[#111111]">{routine.name}</span>
                    {routine.lastRunStatus === "failed" && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 ml-4">
                    <span className="text-[12px] text-[#888888] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatSchedule(routine.schedule)}
                    </span>
                    {routine.lastRunAt && (
                      <span className="text-[12px] text-[#AAAAAA]">
                        Last run: {timeAgo(routine.lastRunAt)}
                      </span>
                    )}
                    {routine.totalRuns > 0 && (
                      <span className="text-[12px] text-[#AAAAAA]">
                        {routine.successfulRuns}/{routine.totalRuns} runs
                      </span>
                    )}
                    {routine.nextRunAt && routine.enabled && (
                      <span className="text-[12px] text-[#AAAAAA] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Next: {new Date(routine.nextRunAt).toLocaleDateString()} {new Date(routine.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => executeRoutine(routine.id)}
                    disabled={executingRoutines.has(routine.id)}
                    title="Run now"
                  >
                    {executingRoutines.has(routine.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleRoutine(routine.id, !routine.enabled)}
                    title={routine.enabled ? "Pause" : "Enable"}
                  >
                    {routine.enabled ? (
                      <Pause className="h-3.5 w-3.5 text-[#666666]" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-[#888888]" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                    onClick={() => deleteRoutine(routine.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleExpand(routine.id)}
                  >
                    {expandedRoutine === routine.id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedRoutine === routine.id && (
                <div className="border-t border-[#F0EEE8]">
                  {/* Prompt */}
                  <div className="px-5 py-3 bg-[#FAFAF8]">
                    <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide mb-1">Prompt</div>
                    <div className="text-[13px] text-[#444444] whitespace-pre-wrap">{routine.prompt}</div>
                  </div>

                  {/* Execution History */}
                  <div className="px-5 py-3">
                    <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide mb-2">Recent Executions</div>
                    {!executionHistory[routine.id] ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#888888]" />
                        <span className="text-[12px] text-[#888888]">Loading...</span>
                      </div>
                    ) : executionHistory[routine.id].length === 0 ? (
                      <div className="text-[12px] text-[#AAAAAA] py-2">No executions yet</div>
                    ) : (
                      <div className="space-y-2">
                        {executionHistory[routine.id].map((exec) => (
                          <div
                            key={exec.id}
                            className="rounded-lg border border-[#E0DED8] p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {exec.status === "success" ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                ) : exec.status === "running" ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                ) : (
                                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                )}
                                <span className="text-[12px] font-medium text-[#444444]">
                                  {exec.status === "success" ? "Completed" : exec.status === "running" ? "Running" : "Failed"}
                                </span>
                                <span className="text-[11px] text-[#AAAAAA]">
                                  {timeAgo(exec.startedAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-[#AAAAAA]">
                                {exec.toolCalls?.length > 0 && (
                                  <span>{exec.toolCalls.length} tools</span>
                                )}
                                {exec.creditsUsed > 0 && (
                                  <span>{exec.creditsUsed.toFixed(1)} credits</span>
                                )}
                                {exec.dataChanged?.length > 0 && (
                                  <span className="text-blue-500">Changed: {exec.dataChanged.join(", ")}</span>
                                )}
                              </div>
                            </div>
                            {exec.response && (
                              <div className="mt-2 text-[12px] text-[#666666] whitespace-pre-wrap line-clamp-4">
                                {exec.response}
                              </div>
                            )}
                            {exec.error && (
                              <div className="mt-2 text-[12px] text-red-500">{exec.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
