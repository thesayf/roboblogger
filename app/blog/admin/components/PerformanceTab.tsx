"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ExternalLink,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel?: string;
}

interface PageMetric {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PropertiesResponse {
  connected: boolean;
  needsReconnect?: boolean;
  email?: string;
  error?: string;
  sites: SearchConsoleSite[];
  selectedSiteUrl: string | null;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(Math.round(value));
}

export function PerformanceTab() {
  const [properties, setProperties] = useState<PropertiesResponse | null>(null);
  const [pages, setPages] = useState<PageMetric[]>([]);
  const [days, setDays] = useState("28");
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSiteUrl = properties?.selectedSiteUrl || "";

  const totals = useMemo(() => {
    return pages.reduce(
      (acc, page) => {
        acc.clicks += page.clicks;
        acc.impressions += page.impressions;
        return acc;
      },
      { clicks: 0, impressions: 0 }
    );
  }, [pages]);

  const loadProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/google/search-console/properties");
      const data = await res.json();
      setProperties(data);
      if (!res.ok) setError(data.error || "Failed to load Search Console properties");
    } catch {
      setError("Failed to load Search Console properties");
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  const loadPerformance = useCallback(async () => {
    if (!selectedSiteUrl) return;
    setIsLoadingPerformance(true);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/google/search-console/performance?days=${days}&limit=25`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load performance data");
        setPages([]);
        return;
      }
      setPages(data.pages || []);
    } catch {
      setError("Failed to load performance data");
      setPages([]);
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [selectedSiteUrl, days]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    if (selectedSiteUrl) {
      loadPerformance();
    }
  }, [selectedSiteUrl, days, loadPerformance]);

  async function selectProperty(siteUrl: string) {
    setIsSelecting(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/google/search-console/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to select property");
        return;
      }
      setProperties((prev) => prev ? { ...prev, selectedSiteUrl: data.selectedSiteUrl } : prev);
    } catch {
      setError("Failed to select property");
    } finally {
      setIsSelecting(false);
    }
  }

  function connectGoogle() {
    window.location.href = "/api/integrations/google/auth";
  }

  if (isLoadingProperties) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#888888]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Search Performance
          </h2>
          <p className="text-[14px] text-[#666666] mt-1">
            Connect Search Console so the agent can use real URL, query, click, and impression data.
          </p>
        </div>
        <Button
          onClick={() => {
            loadProperties();
            if (selectedSiteUrl) loadPerformance();
          }}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-[14px]">{error}</span>
        </div>
      )}

      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[#666666]" />
              <h3 className="font-medium text-[#111111]">Google Search Console</h3>
              {selectedSiteUrl && (
                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-[#666666] mt-1">
              {properties?.email ? `Google account: ${properties.email}` : "Google account not connected"}
            </p>
          </div>
          {(!properties?.connected || properties?.needsReconnect) && (
            <Button onClick={connectGoogle} className="bg-[#111111] hover:bg-[#333333] text-white rounded-full">
              {properties?.needsReconnect ? "Reconnect Google" : "Connect Google"}
            </Button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {properties?.needsReconnect && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[14px] text-amber-800">
              Google is connected for Docs, but Search Console permission is missing. Reconnect once and approve Search Console access.
            </div>
          )}

          {properties?.connected && !properties.needsReconnect && properties.sites.length === 0 && (
            <div className="bg-[#FAFAF8] border border-[#E0DED8] rounded-xl p-5 text-[14px] text-[#666666]">
              No Search Console properties were found for this Google account.
            </div>
          )}

          {properties?.sites && properties.sites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#444444]">Search Console property</label>
                <Select value={selectedSiteUrl} onValueChange={selectProperty} disabled={isSelecting}>
                  <SelectTrigger className="bg-white border-[#E0DED8]">
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.sites.map((site) => (
                      <SelectItem key={site.siteUrl} value={site.siteUrl}>
                        {site.siteUrl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[#444444]">Date range</label>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger className="w-36 bg-white border-[#E0DED8]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="28">28 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedSiteUrl && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
              <div className="flex items-center gap-2 text-[#666666] text-[13px] mb-2">
                <MousePointerClick className="h-4 w-4" />
                Clicks
              </div>
              <div className="text-[28px] font-semibold text-[#111111]">{formatNumber(totals.clicks)}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
              <div className="flex items-center gap-2 text-[#666666] text-[13px] mb-2">
                <BarChart3 className="h-4 w-4" />
                Impressions
              </div>
              <div className="text-[28px] font-semibold text-[#111111]">{formatNumber(totals.impressions)}</div>
            </div>
            <div className="bg-white rounded-xl border border-[#E0DED8] p-5">
              <div className="flex items-center gap-2 text-[#666666] text-[13px] mb-2">
                <TrendingUp className="h-4 w-4" />
                Top pages
              </div>
              <div className="text-[28px] font-semibold text-[#111111]">{pages.length}</div>
            </div>
          </div>

          <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EEE8] flex items-center justify-between">
              <h3 className="font-medium text-[#111111]">Top URLs</h3>
              {isLoadingPerformance && <Loader2 className="h-4 w-4 animate-spin text-[#888888]" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF8] text-[#666666]">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">URL</th>
                    <th className="text-right font-medium px-4 py-3">Clicks</th>
                    <th className="text-right font-medium px-4 py-3">Impressions</th>
                    <th className="text-right font-medium px-4 py-3">CTR</th>
                    <th className="text-right font-medium px-4 py-3">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.length === 0 && !isLoadingPerformance ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-[#666666]">
                        No performance rows found for this date range.
                      </td>
                    </tr>
                  ) : (
                    pages.map((page) => (
                      <tr key={page.page} className="border-t border-[#F0EEE8]">
                        <td className="px-6 py-3 max-w-[520px]">
                          <a href={page.page} target="_blank" rel="noreferrer" className="text-[#111111] hover:underline inline-flex items-center gap-2 truncate max-w-full">
                            <span className="truncate">{page.page}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-[#888888]" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right text-[#111111]">{formatNumber(page.clicks)}</td>
                        <td className="px-4 py-3 text-right text-[#111111]">{formatNumber(page.impressions)}</td>
                        <td className="px-4 py-3 text-right text-[#111111]">{formatPercent(page.ctr)}</td>
                        <td className="px-4 py-3 text-right text-[#111111]">{page.position.toFixed(1)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
