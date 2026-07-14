"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ExternalLink,
  FileText,
  FolderTree,
  Layers3,
  Loader2,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type StrategyItem = {
  id: string;
  contentType: "topic" | "post";
  topicId?: string;
  postId?: string;
  title: string;
  description?: string;
  slug?: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  clusterId?: string;
  seriesId?: string;
  primaryKeyword?: string;
};

type ContentSeries = {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  status: "draft" | "active" | "archived";
  clusterId?: string;
  items: StrategyItem[];
};

type TopicCluster = {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  status: "draft" | "active" | "archived";
  primaryPillarTopicId?: string;
  primaryPillarPostId?: string;
  pillar?: StrategyItem;
  series: ContentSeries[];
  supporting: StrategyItem[];
  counts: { total: number; published: number; planned: number };
};

type StrategyData = {
  summary: {
    clusters: number;
    activeClusters: number;
    standaloneSeries: number;
    published: number;
    planned: number;
    unassigned: number;
  };
  clusters: TopicCluster[];
  standaloneSeries: ContentSeries[];
  unassigned: StrategyItem[];
};

type Selection = `cluster:${string}` | `series:${string}` | "unassigned";
type EditorMode = "cluster" | "series" | "pillar" | "organize" | "topic" | null;

const emptyData: StrategyData = {
  summary: {
    clusters: 0,
    activeClusters: 0,
    standaloneSeries: 0,
    published: 0,
    planned: 0,
    unassigned: 0,
  },
  clusters: [],
  standaloneSeries: [],
  unassigned: [],
};

async function strategyRequest(path: string, method = "GET", body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || "The request failed");
  }
  return data;
}

function statusClasses(status: string) {
  if (status === "published" || status === "active") return "bg-[#EAF5EC] text-[#216C34]";
  if (status === "failed" || status === "archived") return "bg-[#FCECEC] text-[#9A3030]";
  if (status === "generating") return "bg-[#EAF1FB] text-[#245A9B]";
  if (status === "pending") return "bg-[#FFF4D8] text-[#895E00]";
  return "bg-[#F1F0EC] text-[#666666]";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${statusClasses(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatItemDate(item: StrategyItem) {
  const value = item.scheduledAt || item.publishedAt || item.updatedAt;
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function ItemRow({
  item,
  onOrganize,
}: {
  item: StrategyItem;
  onOrganize: (item: StrategyItem) => void;
}) {
  const href = item.contentType === "post"
    ? `/blog/admin/manual?edit=${item.postId || item.id}`
    : undefined;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_36px] items-center gap-3 border-t border-[#EEECE6] px-4 py-3 first:border-t-0 sm:min-w-[620px] sm:grid-cols-[minmax(260px,1fr)_110px_100px_42px] sm:gap-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] bg-[#F3F2EE] text-[#77736C]">
          {item.contentType === "post" ? <FileText className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          {href ? (
            <a href={href} className="block truncate text-[14px] font-medium hover:underline">
              {item.title}
            </a>
          ) : (
            <p className="truncate text-[14px] font-medium">{item.title}</p>
          )}
          <p className="mt-0.5 truncate text-[12px] text-[#888888]">
            {item.primaryKeyword || (item.contentType === "post" ? "Published post" : "Planned topic")}
            <span className="sm:hidden"> · {item.status}</span>
          </p>
        </div>
      </div>
      <div className="hidden sm:block"><StatusBadge status={item.status} /></div>
      <span className="hidden text-[12px] text-[#77736C] sm:block">{formatItemDate(item)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${item.title}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOrganize(item)}>
            <FolderTree className="mr-2 h-4 w-4" />
            Organize
          </DropdownMenuItem>
          {item.slug && (
            <DropdownMenuItem onClick={() => window.open(`/blog/${item.slug}`, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View live
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="border-t border-[#EEECE6] px-5 py-7 text-center text-[13px] text-[#888888]">
      {label}
    </div>
  );
}

export function StrategyTab() {
  const [data, setData] = useState<StrategyData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<Selection>("unassigned");
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<StrategyItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "draft",
    clusterId: "none",
    seriesId: "none",
    pillar: "none",
    topic: "",
  });

  const loadStrategy = useCallback(async (preserveSelection = true) => {
    try {
      setError("");
      const nextData = await strategyRequest("/api/blog/strategy");
      setData(nextData);
      setSelection((current) => {
        if (preserveSelection) {
          if (current.startsWith("cluster:") && nextData.clusters.some((c: TopicCluster) => `cluster:${c._id}` === current)) return current;
          if (current.startsWith("series:") && nextData.standaloneSeries.some((s: ContentSeries) => `series:${s._id}` === current)) return current;
          if (current === "unassigned") return current;
        }
        return nextData.clusters[0] ? `cluster:${nextData.clusters[0]._id}` : "unassigned";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load strategy");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const notifyStrategyChanged = () => {
    window.dispatchEvent(new CustomEvent("strategy-data-changed"));
  };

  useEffect(() => {
    loadStrategy(false);
  }, [loadStrategy]);

  useEffect(() => {
    const handler = (event: Event) => {
      const collections = (event as CustomEvent).detail?.collections || [];
      if (collections.some((name: string) => ["strategy", "topics", "posts"].includes(name))) {
        loadStrategy();
      }
    };
    window.addEventListener("chat-data-changed", handler);
    return () => window.removeEventListener("chat-data-changed", handler);
  }, [loadStrategy]);

  const selectedCluster = selection.startsWith("cluster:")
    ? data.clusters.find((cluster) => `cluster:${cluster._id}` === selection)
    : undefined;
  const selectedStandaloneSeries = selection.startsWith("series:")
    ? data.standaloneSeries.find((series) => `series:${series._id}` === selection)
    : undefined;

  const allSeries = useMemo(
    () => [...data.clusters.flatMap((cluster) => cluster.series), ...data.standaloneSeries],
    [data]
  );

  const filteredClusters = data.clusters.filter((cluster) =>
    cluster.name.toLowerCase().includes(search.toLowerCase())
  );

  const compatibleSeries = allSeries.filter((series) => {
    if (form.clusterId === "none") return !series.clusterId;
    return series.clusterId === form.clusterId;
  });

  const resetForm = () => setForm({
    name: "",
    description: "",
    status: "draft",
    clusterId: "none",
    seriesId: "none",
    pillar: "none",
    topic: "",
  });

  const openCreateCluster = () => {
    resetForm();
    setEditingId(null);
    setEditor("cluster");
  };

  const openEditCluster = (cluster: TopicCluster) => {
    setEditingId(cluster._id);
    setForm((current) => ({
      ...current,
      name: cluster.name,
      description: cluster.description || "",
      status: cluster.status,
    }));
    setEditor("cluster");
  };

  const openCreateSeries = (clusterId?: string) => {
    resetForm();
    setEditingId(null);
    setForm((current) => ({ ...current, clusterId: clusterId || "none" }));
    setEditor("series");
  };

  const openEditSeries = (series: ContentSeries) => {
    setEditingId(series._id);
    setForm((current) => ({
      ...current,
      name: series.name,
      description: series.description || "",
      status: series.status,
      clusterId: series.clusterId || "none",
    }));
    setEditor("series");
  };

  const openPillar = (cluster: TopicCluster) => {
    setEditingId(cluster._id);
    setForm((current) => ({
      ...current,
      pillar: cluster.pillar ? `${cluster.pillar.contentType}:${cluster.pillar.id}` : "none",
    }));
    setEditor("pillar");
  };

  const openOrganize = (item: StrategyItem) => {
    setEditingItem(item);
    setForm((current) => ({
      ...current,
      clusterId: item.clusterId || "none",
      seriesId: item.seriesId || "none",
    }));
    setEditor("organize");
  };

  const openTopic = (clusterId?: string, seriesId?: string) => {
    resetForm();
    setForm((current) => ({
      ...current,
      clusterId: clusterId || "none",
      seriesId: seriesId || "none",
    }));
    setEditor("topic");
  };

  const saveEditor = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      let nextSelection: Selection | undefined;
      if (editor === "cluster") {
        const path = editingId ? `/api/blog/clusters/${editingId}` : "/api/blog/clusters";
        const savedCluster = await strategyRequest(path, editingId ? "PUT" : "POST", {
          name: form.name,
          description: form.description,
          status: form.status,
        });
        nextSelection = `cluster:${savedCluster._id}`;
      }
      if (editor === "series") {
        const path = editingId ? `/api/blog/series/${editingId}` : "/api/blog/series";
        const savedSeries = await strategyRequest(path, editingId ? "PUT" : "POST", {
          name: form.name,
          description: form.description,
          status: form.status,
          clusterId: form.clusterId === "none" ? null : form.clusterId,
        });
        nextSelection = savedSeries.clusterId
          ? `cluster:${savedSeries.clusterId}`
          : `series:${savedSeries._id}`;
      }
      if (editor === "pillar" && editingId) {
        if (form.pillar === "none") {
          await strategyRequest(`/api/blog/clusters/${editingId}`, "PUT", {
            primaryPillarTopicId: null,
          });
        } else {
          const [contentType, contentId] = form.pillar.split(":");
          await strategyRequest(`/api/blog/clusters/${editingId}`, "PUT", {
            [contentType === "post" ? "primaryPillarPostId" : "primaryPillarTopicId"]: contentId,
          });
        }
      }
      if (editor === "organize" && editingItem) {
        await strategyRequest("/api/blog/strategy/assign", "PUT", {
          contentType: editingItem.contentType,
          contentId: editingItem.id,
          clusterId: form.clusterId === "none" ? null : form.clusterId,
          seriesId: form.seriesId === "none" ? null : form.seriesId,
        });
      }
      if (editor === "topic") {
        await strategyRequest("/api/blog/topics", "POST", {
          topic: form.topic,
          priority: "medium",
          generationProvider: "deepseek",
          clusterId: form.clusterId === "none" ? undefined : form.clusterId,
          seriesId: form.seriesId === "none" ? undefined : form.seriesId,
          source: "individual",
        });
      }
      setEditor(null);
      setEditingItem(null);
      await loadStrategy();
      if (nextSelection) setSelection(nextSelection);
      notifyStrategyChanged();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCluster = async (cluster: TopicCluster) => {
    if (!window.confirm(`Delete "${cluster.name}"? Its posts and series will be kept and become unassigned.`)) return;
    try {
      await strategyRequest(`/api/blog/clusters/${cluster._id}`, "DELETE");
      setSelection("unassigned");
      await loadStrategy(false);
      notifyStrategyChanged();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete cluster");
    }
  };

  const deleteSeries = async (series: ContentSeries) => {
    if (!window.confirm(`Delete "${series.name}"? Its posts and topics will be kept.`)) return;
    try {
      await strategyRequest(`/api/blog/series/${series._id}`, "DELETE");
      setSelection(series.clusterId ? `cluster:${series.clusterId}` : "unassigned");
      await loadStrategy(false);
      notifyStrategyChanged();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete series");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-sm text-[#666666]">Loading strategy...</span>
      </div>
    );
  }

  const pillarCandidates = selectedCluster
    ? [...(selectedCluster.pillar ? [selectedCluster.pillar] : []), ...selectedCluster.supporting, ...data.unassigned]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-lora text-[26px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Content strategy
          </h2>
          <p className="mt-1 text-[14px] text-[#666666]">
            {data.summary.clusters} clusters · {data.summary.activeClusters} active · {data.summary.published} published · {data.summary.planned} planned
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setSelection("unassigned")}
          >
            <CircleDot className="mr-2 h-4 w-4" />
            Unassigned
            <span className="ml-2 text-[#888888]">{data.summary.unassigned}</span>
          </Button>
          <Button className="rounded-full bg-[#111111] hover:bg-[#303030]" onClick={openCreateCluster}>
            <Plus className="mr-2 h-4 w-4" />
            New cluster
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[8px] border border-[#E0DED8] bg-white lg:grid lg:min-h-[650px] lg:grid-cols-[265px_minmax(0,1fr)]">
        <aside className="border-b border-[#E0DED8] bg-[#FCFCFA] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#E8E6E0] p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#99958E]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search strategy"
                className="h-10 bg-white pl-9"
              />
            </div>
          </div>
          <div className="max-h-[310px] overflow-y-auto p-2 lg:max-h-none">
            <p className="px-2 pb-2 pt-1 text-[12px] font-semibold text-[#77736C]">Topic clusters</p>
            {filteredClusters.map((cluster) => {
              const active = selection === `cluster:${cluster._id}`;
              return (
                <button
                  key={cluster._id}
                  type="button"
                  onClick={() => setSelection(`cluster:${cluster._id}`)}
                  className={`mb-1 flex w-full items-start gap-3 rounded-[6px] px-3 py-3 text-left ${active ? "bg-[#ECEBE6]" : "hover:bg-[#F3F2EE]"}`}
                >
                  <FolderTree className="mt-0.5 h-4 w-4 shrink-0 text-[#77736C]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{cluster.name}</span>
                    <span className="mt-0.5 block text-[12px] text-[#888888]">{cluster.counts.total} items · {cluster.status}</span>
                  </span>
                  {!cluster.pillar && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B7791F]" />}
                </button>
              );
            })}

            <div className="mx-2 my-3 border-t border-[#E0DED8]" />
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-[12px] font-semibold text-[#77736C]">Standalone series</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCreateSeries()} aria-label="Add standalone series">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {data.standaloneSeries.map((series) => (
              <button
                key={series._id}
                type="button"
                onClick={() => setSelection(`series:${series._id}`)}
                className={`mb-1 flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left ${selection === `series:${series._id}` ? "bg-[#ECEBE6]" : "hover:bg-[#F3F2EE]"}`}
              >
                <Layers3 className="h-4 w-4 text-[#77736C]" />
                <span className="min-w-0 flex-1 truncate text-[14px]">{series.name}</span>
                <span className="text-[12px] text-[#99958E]">{series.items.length}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelection("unassigned")}
              className={`mt-2 flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left ${selection === "unassigned" ? "bg-[#ECEBE6]" : "hover:bg-[#F3F2EE]"}`}
            >
              <CircleDot className="h-4 w-4 text-[#77736C]" />
              <span className="flex-1 text-[14px]">Unassigned</span>
              <span className="text-[12px] text-[#99958E]">{data.unassigned.length}</span>
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          {selectedCluster && (
            <>
              <div className="border-b border-[#E0DED8] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-lora text-[22px] font-semibold" style={{ fontFamily: "'Lora', Georgia, serif" }}>{selectedCluster.name}</h3>
                      <StatusBadge status={selectedCluster.status} />
                    </div>
                    {selectedCluster.description && <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[#666666]">{selectedCluster.description}</p>}
                    <p className="mt-3 text-[12px] text-[#888888]">
                      {selectedCluster.counts.published} published · {selectedCluster.counts.planned} planned · {selectedCluster.series.length} series
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditCluster(selectedCluster)}><PenLine className="mr-2 h-4 w-4" />Edit cluster</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateSeries(selectedCluster._id)}><Plus className="mr-2 h-4 w-4" />Add series</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteCluster(selectedCluster)}><Trash2 className="mr-2 h-4 w-4" />Delete cluster</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-6">
                <section className="overflow-hidden rounded-[7px] border border-[#DAD7D0]">
                  <div className="flex items-center justify-between bg-[#F8F7F3] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#77736C]" />
                      <span className="text-[13px] font-semibold">Primary pillar</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => openPillar(selectedCluster)}>
                      {selectedCluster.pillar ? "Replace" : "Set pillar"}
                    </Button>
                  </div>
                  {selectedCluster.pillar ? (
                    <ItemRow item={selectedCluster.pillar} onOrganize={openOrganize} />
                  ) : (
                    <div className="flex items-center gap-3 border-t border-[#EEECE6] px-5 py-5 text-[13px] text-[#8A6410]">
                      <AlertCircle className="h-4 w-4" />
                      No primary pillar selected
                    </div>
                  )}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-[13px] font-semibold text-[#55514A]">Series</h4>
                    <Button variant="ghost" size="sm" onClick={() => openCreateSeries(selectedCluster._id)}><Plus className="mr-1 h-4 w-4" />Add series</Button>
                  </div>
                  <div className="space-y-3">
                    {selectedCluster.series.map((series) => {
                      const expanded = expandedSeries.includes(series._id);
                      return (
                        <div key={series._id} className="overflow-hidden rounded-[7px] border border-[#E0DED8]">
                          <div className="flex items-center gap-3 bg-[#FCFCFA] px-4 py-3">
                            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpandedSeries((current) => expanded ? current.filter((id) => id !== series._id) : [...current, series._id])}>
                              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <Layers3 className="h-4 w-4 text-[#77736C]" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-medium">{series.name}</span>
                                <span className="block truncate text-[12px] text-[#888888]">{series.items.length} items · {series.status}</span>
                              </span>
                            </button>
                            <Button variant="ghost" size="sm" onClick={() => openTopic(selectedCluster._id, series._id)}><Plus className="mr-1 h-4 w-4" />Topic</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditSeries(series)}><PenLine className="mr-2 h-4 w-4" />Edit series</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteSeries(series)}><Trash2 className="mr-2 h-4 w-4" />Delete series</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {expanded && (
                            <div className="overflow-x-auto">
                              {series.items.length > 0 ? series.items.map((item) => <ItemRow key={`${item.contentType}:${item.id}`} item={item} onOrganize={openOrganize} />) : <EmptySection label="No content in this series" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedCluster.series.length === 0 && <div className="rounded-[7px] border border-dashed border-[#DAD7D0] px-5 py-6 text-center text-[13px] text-[#888888]">No series yet</div>}
                  </div>
                </section>

                <section className="overflow-hidden rounded-[7px] border border-[#E0DED8]">
                  <div className="flex items-center justify-between bg-[#FCFCFA] px-4 py-3">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#77736C]" /><span className="text-[13px] font-semibold">Supporting content</span></div>
                    <Button variant="ghost" size="sm" onClick={() => openTopic(selectedCluster._id)}><Plus className="mr-1 h-4 w-4" />Add topic</Button>
                  </div>
                  <div className="overflow-x-auto">
                    {selectedCluster.supporting.length > 0 ? selectedCluster.supporting.map((item) => <ItemRow key={`${item.contentType}:${item.id}`} item={item} onOrganize={openOrganize} />) : <EmptySection label="No supporting content" />}
                  </div>
                </section>
              </div>
            </>
          )}

          {selectedStandaloneSeries && (
            <>
              <div className="border-b border-[#E0DED8] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-lora text-[22px] font-semibold" style={{ fontFamily: "'Lora', Georgia, serif" }}>{selectedStandaloneSeries.name}</h3><StatusBadge status={selectedStandaloneSeries.status} /></div>
                    {selectedStandaloneSeries.description && <p className="mt-1 text-[14px] text-[#666666]">{selectedStandaloneSeries.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditSeries(selectedStandaloneSeries)}><PenLine className="mr-2 h-4 w-4" />Edit series</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => deleteSeries(selectedStandaloneSeries)}><Trash2 className="mr-2 h-4 w-4" />Delete series</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => openTopic(undefined, selectedStandaloneSeries._id)}><Plus className="mr-2 h-4 w-4" />Add topic</Button></div>
                <div className="overflow-x-auto rounded-[7px] border border-[#E0DED8]">
                  {selectedStandaloneSeries.items.length > 0 ? selectedStandaloneSeries.items.map((item) => <ItemRow key={`${item.contentType}:${item.id}`} item={item} onOrganize={openOrganize} />) : <EmptySection label="No content in this series" />}
                </div>
              </div>
            </>
          )}

          {selection === "unassigned" && (
            <>
              <div className="border-b border-[#E0DED8] px-5 py-5 sm:px-6">
                <h3 className="font-lora text-[22px] font-semibold" style={{ fontFamily: "'Lora', Georgia, serif" }}>Unassigned content</h3>
                <p className="mt-1 text-[14px] text-[#666666]">{data.unassigned.length} posts and topics</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto rounded-[7px] border border-[#E0DED8]">
                  {data.unassigned.length > 0 ? data.unassigned.map((item) => <ItemRow key={`${item.contentType}:${item.id}`} item={item} onOrganize={openOrganize} />) : <EmptySection label="Everything is organized" />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={saveEditor}>
            <DialogHeader>
              <DialogTitle>
                {editor === "cluster" && (editingId ? "Edit cluster" : "New cluster")}
                {editor === "series" && (editingId ? "Edit series" : "New series")}
                {editor === "pillar" && "Primary pillar"}
                {editor === "organize" && "Organize content"}
                {editor === "topic" && "Add topic"}
              </DialogTitle>
              <DialogDescription>
                {editor === "pillar" ? "Select one post or planned topic." : editor === "organize" ? editingItem?.title : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-5">
              {(editor === "cluster" || editor === "series") && (
                <>
                  <div className="space-y-2"><Label htmlFor="strategy-name">Name</Label><Input id="strategy-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoFocus /></div>
                  <div className="space-y-2"><Label htmlFor="strategy-description">Description</Label><Textarea id="strategy-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} /></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
                </>
              )}

              {editor === "series" && (
                <div className="space-y-2"><Label>Topic cluster</Label><Select value={form.clusterId} onValueChange={(clusterId) => setForm({ ...form, clusterId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Standalone series</SelectItem>{data.clusters.map((cluster) => <SelectItem key={cluster._id} value={cluster._id}>{cluster.name}</SelectItem>)}</SelectContent></Select></div>
              )}

              {editor === "pillar" && (
                <div className="space-y-2"><Label>Pillar content</Label><Select value={form.pillar} onValueChange={(pillar) => setForm({ ...form, pillar })}><SelectTrigger><SelectValue placeholder="Select pillar" /></SelectTrigger><SelectContent><SelectItem value="none">No pillar</SelectItem>{pillarCandidates.map((item) => <SelectItem key={`${item.contentType}:${item.id}`} value={`${item.contentType}:${item.id}`}>{item.title} ({item.contentType})</SelectItem>)}</SelectContent></Select></div>
              )}

              {(editor === "organize" || editor === "topic") && (
                <>
                  {editor === "topic" && <div className="space-y-2"><Label htmlFor="topic-title">Topic</Label><Input id="topic-title" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} required autoFocus /></div>}
                  <div className="space-y-2"><Label>Cluster</Label><Select value={form.clusterId} onValueChange={(clusterId) => setForm({ ...form, clusterId, seriesId: "none" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No cluster</SelectItem>{data.clusters.map((cluster) => <SelectItem key={cluster._id} value={cluster._id}>{cluster.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Series</Label><Select value={form.seriesId} onValueChange={(seriesId) => { const selected = allSeries.find((series) => series._id === seriesId); setForm({ ...form, seriesId, clusterId: selected?.clusterId || form.clusterId }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No series</SelectItem>{compatibleSeries.map((series) => <SelectItem key={series._id} value={series._id}>{series.name}</SelectItem>)}</SelectContent></Select></div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="bg-[#111111] hover:bg-[#303030]">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
