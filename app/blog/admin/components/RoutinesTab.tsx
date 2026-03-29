"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Search,
  Wrench,
  Brain,
  CircleDot,
  XCircle,
  TrendingUp,
  Link2,
  BarChart3,
  FileText,
  Shield,
  History,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
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

interface LiveLogEntry {
  timestamp: string;
  type: "phase" | "tool_start" | "tool_end" | "text" | "error";
  message: string;
}

interface LastExecution {
  id: string;
  status: string;
  phase: string;
  phaseDetail?: string;
  response: string;
  toolCalls: number;
  creditsUsed: number;
  completedAt: string;
  startedAt: string;
  error?: string;
  liveLog: LiveLogEntry[];
}

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
  lastExecution?: LastExecution | null;
}

interface RoutineExecution {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  phase: string;
  phaseDetail?: string;
  response: string;
  toolCalls: Array<{ name: string; success: boolean }>;
  dataChanged: string[];
  creditsUsed: number;
  error?: string;
  liveLog: LiveLogEntry[];
}

const TEMPLATES = [
  // === RESEARCH & PLANNING ===
  {
    id: "weekly-research",
    name: "Weekly Topic Research",
    description: "Strategic editorial planner — finds trending topics, content gaps, and keyword opportunities, then queues topics based on your current queue depth.",
    maxCreditsPerRun: 1.0,
    prompt: `You are an editorial strategist for this blog. Research and queue high-quality topic ideas that will grow organic traffic.

PHASE 1 — Understand the blog (do this first every time):
- Call get_brand_settings to understand the niche, audience, and tone
- Call get_blog_stats and get_topics_queue to see what's already published and queued
- Call get_existing_posts with broad niche terms to understand current content coverage

PHASE 2 — Research opportunities:
- search_trending_topics: Find emerging discussions gaining momentum but not yet saturated
- search_content_gaps: Identify questions and subtopics competitors cover that we don't
- search_competitor_content: See what's ranking well for competitors — look for angles we can do better
- web_search: Check for seasonal or timely topics relevant in the next 2-8 weeks

PHASE 3 — Evaluate and filter:
For each candidate topic:
1. search_keyword_data to get volume, difficulty, and CPC
2. search_related_keywords to find long-tail variants
3. check_keyword_cannibalization against existing posts — reject topics that would compete with our own content

Filter criteria (reject topics that fail any):
- Search volume too low (<100/mo) unless it's a high-intent conversion topic
- Keyword difficulty too high for the blog's current authority
- Too similar to an existing published post or queued topic
- No clear unique angle vs what already ranks

PHASE 4 — Select and queue:
Adjust volume to queue depth:
- If queue has <5 pending topics: add 4-5 new topics
- If queue has 5-10 pending: add 2-3 new topics
- If queue has >10 pending: add 0-1 topics, and instead review/reprioritize existing queue items

Balance the mix: at least one cluster-building topic and at least one trend/timely topic per batch.

For each topic, provide: primary keyword, 3-5 secondary keywords (including one long-tail question), search intent, meta title (under 60 chars), meta description (under 155 chars), and a one-sentence strategic rationale.

Use create_topics_bulk to add all selected topics at once.`,
    schedule: { frequency: "weekly" as const, dayOfWeek: 1, hour: 9, minute: 0 },
  },
  {
    id: "content-filler",
    name: "Content Calendar Filler",
    description: "Daily safety net — checks your queue and tops it up if running low, so your blog never stops publishing.",
    maxCreditsPerRun: 0.5,
    prompt: `You are a content queue manager. Ensure the blog never runs out of topics to publish.

STEP 1 — Assess the situation:
Call get_topics_queue with status "pending" and get_blog_stats. Calculate the target queue depth: aim for at least 2 weeks of runway based on the observed publishing rate. Minimum target is always 4.

If the queue is already at or above the target, STOP HERE and report that no action is needed. Do not waste credits on unnecessary research.

STEP 2 — Understand what's covered:
Call get_brand_settings and get_existing_posts with a broad niche query to see recent content themes. Identify which topic categories are underrepresented.

STEP 3 — Research to fill gaps:
Determine how many topics are needed (target minus current pending count). Research using this allocation:
- ~40% high-volume keywords (1000+ monthly searches)
- ~30% long-tail quick wins (difficulty < 40)
- ~30% complementary content that strengthens existing content clusters

Validate each topic with search_keyword_data before adding.

STEP 4 — Queue the topics:
Use create_topics_bulk with full SEO data. Space scheduledAt dates across upcoming days based on publishing frequency.

RULES:
- Never add a topic that duplicates an existing post or queued topic
- Prefer evergreen content (the Weekly Topic Research agent handles trends)
- Always include primaryKeyword — never queue a topic without SEO data`,
    schedule: { frequency: "daily" as const, hour: 6, minute: 0 },
  },
  {
    id: "competitor-watch",
    name: "Competitor Watch",
    description: "Monitors competitor blogs weekly, identifies topics they cover that you don't, and queues opportunities at low priority for your review.",
    maxCreditsPerRun: 1.5,
    prompt: `You are a competitive intelligence analyst for this blog.

STEP 1 — Load context:
Call get_brand_settings for niche, audience, and any defined competitors. Call get_existing_posts to understand current coverage. Call get_topics_queue to see what's planned.

STEP 2 — Identify competitors:
If brand settings include specific competitors, monitor those. If not, use web_search to identify 3-5 active blogs in the niche. List them explicitly in your report.

STEP 3 — Analyze recent competitor content (last 7 days):
For each competitor, use search_competitor_content and web_search. For each piece note: topic, angle, content format (guide, listicle, comparison, tutorial), and target keyword if apparent.

STEP 4 — Find gaps and opportunities:
Use search_content_gaps and search_keyword_data to identify:
a) Topics competitors covered that we have NOT
b) Keywords where competitor content ranks but difficulty is low enough to compete (difficulty < 40)
c) Topics we've covered but competitors published fresher/deeper content on (refresh opportunities)

STEP 5 — Queue actionable topics:
For the top 3-5 opportunities, call create_topics_bulk with:
- Priority: low
- additionalRequirements noting which competitor inspired it and what angle to take that differentiates from theirs

Do NOT queue topics that overlap with existing posts or queued items. Only queue if there's a genuine gap for our audience.

STEP 6 — Report:
Summarize: competitors monitored, their recent content, gaps identified, refresh opportunities, topics queued, and any publishing cadence patterns.`,
    schedule: { frequency: "weekly" as const, dayOfWeek: 1, hour: 8, minute: 0 },
  },

  // === SEO & OPTIMIZATION ===
  {
    id: "daily-seo-check",
    name: "New Post SEO Check",
    description: "Audits every post within 24 hours of publishing — catches missing metadata, weak titles, and image alt text, and auto-fixes them.",
    maxCreditsPerRun: 2.0,
    prompt: `Audit all blog posts published in the last 24 hours for SEO quality.

STEP 1: Use audit_content with limit 10 to scan recent posts.

STEP 2: For each post with issues, call get_post to read its full content, then check:
1. SEO title: exists, 50-60 characters, contains primary keyword near the front
2. Meta description: exists, 150-160 characters, compelling with a call to action
3. Heading structure: clear H2/H3 hierarchy, headings contain relevant keywords
4. Image alt text: every image has descriptive alt text
5. Internal links: at least 2 internal links to related posts
6. Content length: at least 800 words for standard posts

STEP 3: Auto-fix these issues using edit_post and edit_post_component:
- Missing or weak SEO titles → write an optimized one
- Missing or weak meta descriptions → write a compelling one
- Missing image alt text → add descriptive alt text
- Missing tags → add 3-5 relevant tags

For issues you cannot auto-fix (thin content, poor heading structure), report them with specific recommendations.

If no posts were published in the last 24 hours, report that and exit.`,
    schedule: { frequency: "daily" as const, hour: 6, minute: 30 },
  },
  {
    id: "monthly-seo-deep-dive",
    name: "Monthly SEO Deep Dive",
    description: "Comprehensive monthly review — checks rankings, finds keyword cannibalization, scans for systemic issues across your entire blog.",
    maxCreditsPerRun: 5.0,
    prompt: `Perform a comprehensive monthly SEO review of the entire blog.

STEP 1 — Portfolio health check:
Call audit_content with limit 20 to scan the 20 most recent posts. Identify systemic patterns (e.g., "most posts are missing meta descriptions" vs one-off issues).

STEP 2 — Keyword cannibalization:
Call check_keyword_cannibalization. If conflicts are found, recommend which post should be the canonical one for each keyword and suggest how to differentiate the others.

STEP 3 — Rankings check:
Call check_post_rankings for the 5 posts most likely to rank (newest pillar content or posts targeting high-volume keywords). Note any posts ranking on page 2 that could be pushed to page 1 with improvements.

STEP 4 — Internal linking gaps:
Identify the 5 posts with the fewest inbound internal links that deserve more. Do NOT fix these — the Internal Link Builder agent handles that.

STEP 5 — Report:
Produce a structured monthly SEO report with:
- Overall health score (average audit score across scanned posts)
- Top 5 most urgent issues to fix
- Cannibalization risks
- Ranking wins and opportunities (page 2 posts close to breaking through)
- Internal linking recommendations

This is a diagnostic/reporting agent only. Do NOT auto-fix issues — the daily SEO Check handles fixes.`,
    schedule: { frequency: "monthly" as const, dayOfMonth: 1, hour: 10, minute: 0 },
  },
  {
    id: "internal-links",
    name: "Internal Link Builder",
    description: "Strengthens your SEO by finding posts with no inbound links and connecting them to related content with natural, contextual links.",
    maxCreditsPerRun: 1.5,
    prompt: `You are an internal linking specialist. Strengthen the blog's internal link structure.

STEP 1 — Inventory:
Call get_internal_link_map to see every post's title, slug, tags, and existing internal links. Group posts into topic clusters (groups of 3+ posts about related subjects).

STEP 2 — Find orphans:
Prioritize posts with the fewest inbound internal links, especially any published in the last 30 days. These are your primary targets.

STEP 3 — Select 5 posts to update:
Pick the 5 posts that would benefit most from new internal links:
a) Recent posts with zero or one inbound links
b) Posts in topic clusters that aren't well connected
c) Pillar/cornerstone content that should link out to subtopics

STEP 4 — Add links:
For each selected post, use get_post to read the full content, then use edit_post_component to add 1-3 internal links using markdown syntax [anchor text](/blog/slug).

Link placement rules:
- Place links in body paragraphs where the linked topic is naturally discussed
- Use descriptive anchor text (3-7 words describing the destination post), never "click here" or "read more"
- Link to posts within the same topic cluster first, then to related clusters
- Ensure pillar posts link to subtopics and vice versa
- Don't add links in the first or final paragraph — mid-content links perform better
- Don't add a link if one to the same destination already exists

STEP 5 — Verify and report:
Confirm each link is contextually appropriate. Report what was changed.

Keep to exactly 5 posts per run.`,
    schedule: { frequency: "weekly" as const, dayOfWeek: 5, hour: 14, minute: 0 },
  },
  {
    id: "stale-refresh",
    name: "Content Refresher",
    description: "Finds posts with declining rankings or untapped potential and updates them with fresh data, better SEO, and improved content.",
    maxCreditsPerRun: 2.0,
    prompt: `Find and refresh published blog posts with the highest potential for traffic recovery.

STEP 1 — Identify candidates:
Use get_existing_posts to list published posts. Then use check_post_rankings to find posts that meet ANY of these criteria (in priority order):
a) Posts ranking positions 8-20 (page 2 or bottom of page 1 — closest to meaningful traffic)
b) Posts whose rankings have declined
c) Posts older than 6 months that haven't been updated
Do NOT simply pick the oldest posts. Pick the ones where a refresh would most likely improve traffic.

STEP 2 — Select 3-4 posts:
Choose the top candidates from Step 1. If a post's topic is completely obsolete, skip it but note it as "needs full rewrite — not suitable for refresh."

STEP 3 — Refresh each post:
For each selected post, use get_post to read the full content, then:
- web_search to check if key facts, statistics, or claims are still accurate. Update outdated numbers with current data.
- search_keyword_data to check if the target keyword has shifted or if there are new related keywords worth incorporating.
- audit_content to evaluate SEO elements. Improve title tag and meta description if weak.
- check_keyword_cannibalization to see if this post competes with another for the same keyword.
- Add 1-2 internal links to newer content published since this post was last updated.
- Improve the introduction if it's weak — the first 100 words have the highest impact on bounce rate.
- Apply edits using edit_post and edit_post_component.

STEP 4 — Summary:
Report what was changed in each post and why, plus any posts flagged for full rewrites.

Focus on targeted improvements, not complete rewrites. If a post needs more than 40% of its content changed, flag it instead.`,
    schedule: { frequency: "monthly" as const, dayOfMonth: 1, hour: 11, minute: 0 },
  },

  // === GROWTH & DISTRIBUTION ===
  {
    id: "content-repurposer",
    name: "Content Repurposer",
    description: "Takes your latest published posts and generates ready-to-post Twitter threads, standalone tweets, LinkedIn posts, and short-form video scripts.",
    maxCreditsPerRun: 1.0,
    prompt: `You are a content distribution specialist. Turn published blog posts into social media content.

STEP 1 — Find recent posts:
Call get_blog_stats and get_existing_posts to find posts published in the last 24-48 hours that haven't been repurposed yet.

STEP 2 — For each post, call get_post to read the full content, then generate:

a) TWITTER THREAD (5-7 tweets):
- Tweet 1: Strong hook that creates curiosity — a surprising stat, contrarian take, or bold claim from the post
- Tweets 2-6: Key insights, one per tweet. Use short sentences. Include specific numbers/data when available.
- Final tweet: CTA linking to the full post
- Use line breaks for readability. No hashtags in the thread body.

b) STANDALONE TWEETS (3-5):
- Pull the most interesting statistics, quotes, or claims from the post
- Each should work as an independent tweet without context
- Format: insight + data point, or question + answer

c) LINKEDIN POST (1):
- Opening hook (first 2 lines are critical — they show before "see more")
- 3-4 short paragraphs with key insights from the post
- Personal/professional tone, not promotional
- End with a question to drive comments

d) VIDEO SCRIPT (1, 30-60 seconds):
- Hook (first 3 seconds): question or surprising statement
- Problem (3-8 seconds): the pain point the post addresses
- Solution (8-25 seconds): 2-3 key takeaways from the post
- CTA (final 5 seconds): where to read more

STEP 3 — Report:
Present all generated content clearly labeled by platform, ready to copy and paste. Include the source post title for reference.`,
    schedule: { frequency: "daily" as const, hour: 7, minute: 0 },
  },
  {
    id: "performance-reporter",
    name: "Performance Reporter",
    description: "Weekly check on which posts are ranking, what's gaining traction, and where to double down — so you know what's working.",
    maxCreditsPerRun: 2.0,
    prompt: `You are a content performance analyst. Produce a weekly performance report.

STEP 1 — Get the landscape:
Call get_blog_stats for overall numbers. Call get_existing_posts to see all published content.

STEP 2 — Check rankings:
Use check_post_rankings for your 10 most recent posts and any known high-priority posts. Categorize each:
- Ranking page 1 (positions 1-10): These are winning — note the keywords
- Ranking page 2 (positions 11-20): These are close — flag for optimization
- Not ranking yet: Normal for new posts, but flag any older than 30 days

STEP 3 — Identify patterns:
- Which topics/categories are performing best?
- Which content formats rank fastest?
- Are there keyword clusters where you're building authority?
- Any posts that were ranking but have dropped?

STEP 4 — Report:
Structure your report as:

WINS THIS WEEK: Posts that are ranking well or improving
OPPORTUNITIES: Page-2 posts that could break through with updates
NEEDS ATTENTION: Older posts not ranking that may need refreshing
STRATEGIC INSIGHTS: Patterns in what's working, suggestions for future content focus
RECOMMENDED ACTIONS: 3-5 specific next steps based on the data`,
    schedule: { frequency: "weekly" as const, dayOfWeek: 5, hour: 9, minute: 0 },
  },
  {
    id: "content-clusters",
    name: "Content Cluster Builder",
    description: "Maps your posts into topic clusters, identifies missing pillar pages, and suggests content to build topical authority.",
    maxCreditsPerRun: 2.0,
    prompt: `You are a content architecture specialist. Analyze the blog's content structure and build topic clusters for SEO authority.

STEP 1 — Map all content:
Call get_existing_posts to get all published posts. Group them by topic similarity into clusters (groups of 3+ related posts).

STEP 2 — Analyze each cluster:
For each cluster, identify:
- The pillar/cornerstone post (the broadest, most authoritative piece) — or note if one is missing
- Supporting posts (specific subtopics within the cluster)
- Gaps: subtopics that should exist but don't
- Internal linking: are cluster posts well-linked to each other and to the pillar?

STEP 3 — Find orphan content:
Identify posts that don't fit into any cluster. These are either:
- The start of a new cluster (suggest 2-3 related topics to build around them)
- Outliers that may not be worth investing in

STEP 4 — Keyword authority check:
For the top 3 clusters, use search_keyword_data on the cluster's core keyword to assess competition and opportunity.

STEP 5 — Report and recommend:
For each cluster:
- Name the cluster and list its posts
- Identify the pillar post (or recommend creating one)
- List 2-3 missing subtopics that would strengthen the cluster
- Rate the cluster's internal linking strength (weak/moderate/strong)

Queue the 3 highest-priority missing topics using create_topics_bulk with a note in additionalRequirements about which cluster they belong to.`,
    schedule: { frequency: "monthly" as const, dayOfMonth: 15, hour: 10, minute: 0 },
  },
];

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "weekly-research": Search,
  "content-filler": Calendar,
  "competitor-watch": CircleDot,
  "daily-seo-check": Shield,
  "monthly-seo-deep-dive": BarChart3,
  "internal-links": Link2,
  "stale-refresh": RefreshCw,
  "content-repurposer": FileText,
  "performance-reporter": TrendingUp,
  "content-clusters": Brain,
};

function getAgentIcon(routine: Routine): LucideIcon {
  if (routine.templateId && TEMPLATE_ICONS[routine.templateId]) {
    return TEMPLATE_ICONS[routine.templateId];
  }
  // Fallback: guess from name
  const name = routine.name.toLowerCase();
  if (name.includes("seo") || name.includes("audit")) return Shield;
  if (name.includes("research") || name.includes("topic")) return Search;
  if (name.includes("link")) return Link2;
  if (name.includes("refresh") || name.includes("update")) return RefreshCw;
  if (name.includes("report") || name.includes("performance")) return TrendingUp;
  return Zap;
}

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

function PhaseIcon({ phase }: { phase: string }) {
  switch (phase) {
    case "queued":
      return <Clock className="h-3 w-3 text-amber-500" />;
    case "loading_context":
      return <Search className="h-3 w-3 text-blue-500" />;
    case "thinking":
      return <Brain className="h-3 w-3 text-purple-500" />;
    case "calling_tool":
      return <Wrench className="h-3 w-3 text-orange-500" />;
    case "completed":
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-red-500" />;
    default:
      return <CircleDot className="h-3 w-3 text-gray-400" />;
  }
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case "queued": return "Queued";
    case "loading_context": return "Loading context";
    case "thinking": return "Thinking";
    case "calling_tool": return "Running tool";
    case "completed": return "Completed";
    case "failed": return "Failed";
    default: return phase;
  }
}

function LogEntryIcon({ type }: { type: string }) {
  switch (type) {
    case "tool_start":
      return <Wrench className="h-2.5 w-2.5 text-orange-400" />;
    case "tool_end":
      return <CheckCircle className="h-2.5 w-2.5 text-green-400" />;
    case "error":
      return <AlertCircle className="h-2.5 w-2.5 text-red-400" />;
    case "phase":
      return <Brain className="h-2.5 w-2.5 text-purple-400" />;
    case "text":
      return <Brain className="h-2.5 w-2.5 text-purple-300" />;
    default:
      return <CircleDot className="h-2.5 w-2.5 text-gray-300" />;
  }
}

// Live execution monitor for a running routine
function LiveExecutionMonitor({
  executionId,
  routineName,
  onComplete,
}: {
  executionId: string;
  routineName: string;
  onComplete?: () => void;
}) {
  const [execution, setExecution] = useState<{
    status: string;
    phase: string;
    phaseDetail?: string;
    liveLog: LiveLogEntry[];
    error?: string;
  } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const completeFiredRef = useRef(false);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/blog/routines/executions/${executionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active) setExecution(data);

        const isDone =
          data.status === "success" ||
          data.status === "failed" ||
          data.phase === "completed" ||
          data.phase === "failed";

        if (isDone) {
          // Notify parent so it can clear the running state
          if (!completeFiredRef.current && onComplete) {
            completeFiredRef.current = true;
            // Small delay to let the user see the final log entry
            setTimeout(() => onComplete(), 2000);
          }
        } else if (active) {
          setTimeout(poll, 2000);
        }
      } catch {
        if (active) setTimeout(poll, 3000);
      }
    };

    poll();
    return () => { active = false; };
  }, [executionId, onComplete]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [execution?.liveLog?.length]);

  if (!execution) {
    return (
      <div className="flex items-center gap-2 py-3 px-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        <span className="text-[12px] text-[#888888]">Connecting...</span>
      </div>
    );
  }

  return (
    <div className="border-t border-[#F0EEE8] bg-[#FAFAF8]">
      {/* Phase indicator */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#F0EEE8]">
        {execution.phase === "completed" || execution.status === "success" ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : execution.phase === "failed" || execution.status === "failed" ? (
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        )}
        <span className="text-[12px] font-medium text-[#444444]">
          {execution.phase === "completed" || execution.status === "success"
            ? "Completed"
            : execution.phase === "failed" || execution.status === "failed"
              ? "Failed"
              : phaseLabel(execution.phase)}
        </span>
        {execution.phaseDetail && execution.status === "running" && execution.phase !== "completed" && (
          <span className="text-[11px] text-[#888888]">
            — {execution.phaseDetail}
          </span>
        )}
      </div>

      {/* Live log */}
      <div className="px-4 py-2 max-h-[200px] overflow-y-auto">
        {execution.liveLog.length === 0 ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-2.5 w-2.5 animate-spin text-[#AAAAAA]" />
            <span className="text-[11px] text-[#AAAAAA]">Waiting for first update...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {execution.liveLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <div className="mt-0.5 flex-shrink-0">
                  <LogEntryIcon type={entry.type} />
                </div>
                <span className={`text-[11px] leading-tight ${
                  entry.type === "error" ? "text-red-500" : "text-[#666666]"
                }`}>
                  {entry.message}
                </span>
                <span className="text-[10px] text-[#CCCCCC] ml-auto flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Error display */}
      {execution.error && (
        <div className="px-4 py-2 border-t border-red-100 bg-red-50">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
            <span className="text-[11px] text-red-600">{execution.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoutinesTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<Record<string, RoutineExecution[]>>({});
  const [executingRoutines, setExecutingRoutines] = useState<Set<string>>(new Set());
  const [activeExecutionIds, setActiveExecutionIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // History sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<"agents" | "history">("agents");
  const [allExecutions, setAllExecutions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<string>("");
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: "",
    prompt: "",
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 9,
    minute: 0,
    maxCreditsPerRun: 2.0,
  });

  // Determine if any routine needs polling (running or overdue)
  const needsPolling = useCallback(() => {
    if (executingRoutines.size > 0) return true;
    const now = Date.now();
    return routines.some((r) => {
      if (!r.enabled) return false;
      const execDone = r.lastExecution?.phase === "completed" || r.lastExecution?.phase === "failed";
      if (r.lastExecution?.status === "running" && !execDone) return true;
      if (r.nextRunAt && new Date(r.nextRunAt).getTime() <= now) return true;
      return false;
    });
  }, [routines, executingRoutines]);

  const fetchRoutines = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await fetch("/api/blog/routines");
      const data = await response.json();
      if (response.ok) {
        const newRoutines: Routine[] = data.routines || [];
        setRoutines(newRoutines);

        // Track running routines and their execution IDs
        const runningIds = new Set<string>();
        const execIds: Record<string, string> = {};
        for (const r of newRoutines) {
          const exec = r.lastExecution;
          const isDone = exec?.phase === "completed" || exec?.phase === "failed";
          if (exec?.status === "running" && !isDone) {
            runningIds.add(r.id);
            if (exec.id) {
              execIds[r.id] = exec.id;
            }
          }
        }

        if (runningIds.size > 0) {
          setExecutingRoutines(runningIds);
          setActiveExecutionIds((prev) => ({ ...prev, ...execIds }));
          // Auto-expand the first running routine
          const firstRunning = newRoutines.find((r) => r.lastExecution?.status === "running");
          if (firstRunning) {
            setExpandedRoutine((prev) => prev || firstRunning.id);
          }
        } else {
          setExecutingRoutines(new Set());
        }

        // Refresh execution history for expanded routine
        const expanded = expandedRoutine;
        if (expanded) {
          fetchExecutionHistory(expanded);
        }
      }
    } catch (error) {
      console.error("Error fetching routines:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [expandedRoutine]);

  // Initial fetch
  useEffect(() => {
    fetchRoutines();
  }, []);

  // Auto-poll when needed (slower interval — live monitor handles fast updates)
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (needsPolling()) {
      pollRef.current = setInterval(() => {
        fetchRoutines(true);
      }, 5000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [needsPolling, fetchRoutines]);

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

  const fetchAllExecutions = useCallback(async (page = 1, status = "") => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (status) params.set("status", status);
      const response = await fetch(`/api/blog/routines/executions?${params}`);
      const data = await response.json();
      if (response.ok) {
        setAllExecutions(data.executions || []);
        setHistoryTotalPages(data.totalPages || 1);
        setHistoryTotal(data.total || 0);
        setHistoryPage(data.page || 1);
      }
    } catch (error) {
      console.error("Error fetching execution history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
        setSaveMessage({ type: "success", text: "Agent created" });
        setShowCreate(false);
        setShowTemplates(false);
        setForm({ name: "", prompt: "", frequency: "weekly", dayOfWeek: 1, dayOfMonth: 1, hour: 9, minute: 0, maxCreditsPerRun: 2.0 });
        fetchRoutines();
      } else {
        const err = await response.json();
        setSaveMessage({ type: "error", text: err.error || "Failed to create agent" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to create agent" });
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
    setExpandedRoutine(id);
    try {
      const res = await fetch(`/api/blog/routines/${id}/execute`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.executionId) {
          setActiveExecutionIds((prev) => ({ ...prev, [id]: data.executionId }));
        }
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to start agent" }));
        setSaveMessage({ type: "error", text: err.error || "Failed to start agent" });
        setExecutingRoutines((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      // Refresh to pick up new execution
      setTimeout(() => fetchRoutines(true), 1500);
    } catch (error) {
      console.error("Error executing routine:", error);
      setSaveMessage({ type: "error", text: "Failed to start agent" });
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
      maxCreditsPerRun: template.maxCreditsPerRun ?? 2.0,
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
          <h2 className="text-[20px] font-semibold text-[#111111]">Agents</h2>
          <p className="text-[13px] text-[#888888] mt-1">
            Autonomous AI agents that manage your blog on autopilot
          </p>
        </div>
        {activeSubTab === "agents" && (
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
              New Agent
            </Button>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#F5F5F0] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveSubTab("agents")}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
            activeSubTab === "agents"
              ? "bg-white text-[#111111] shadow-sm"
              : "text-[#888888] hover:text-[#444444]"
          }`}
        >
          Agents
        </button>
        <button
          onClick={() => {
            setActiveSubTab("history");
            if (allExecutions.length === 0) fetchAllExecutions(1, historyFilter);
          }}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
            activeSubTab === "history"
              ? "bg-white text-[#111111] shadow-sm"
              : "text-[#888888] hover:text-[#444444]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`px-4 py-2 rounded-lg text-[13px] ${saveMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {saveMessage.text}
        </div>
      )}

      {/* ======================== HISTORY TAB ======================== */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-[#F5F5F0] rounded-lg p-1">
              {[
                { value: "", label: "All" },
                { value: "success", label: "Success" },
                { value: "failed", label: "Failed" },
                { value: "running", label: "Running" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setHistoryFilter(opt.value);
                    fetchAllExecutions(1, opt.value);
                  }}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    historyFilter === opt.value
                      ? "bg-white text-[#111111] shadow-sm"
                      : "text-[#888888] hover:text-[#444444]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-[#AAAAAA] ml-auto">
              {historyTotal} total run{historyTotal !== 1 ? "s" : ""}
            </span>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
            </div>
          ) : allExecutions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#E0DED8]">
              <History className="h-10 w-10 text-[#CCCCCC] mx-auto mb-3" />
              <h3 className="text-[16px] font-medium text-[#444444]">No runs yet</h3>
              <p className="text-[13px] text-[#888888] mt-1">
                Agent execution history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allExecutions.map((exec) => {
                const AgentIcon = getAgentIcon({ templateId: routines.find(r => r.id === exec.routineId)?.templateId, name: exec.routineName } as Routine);
                const duration = exec.completedAt
                  ? Math.round((new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000)
                  : null;
                const isExpanded = expandedExecution === exec.id;

                return (
                  <div
                    key={exec.id}
                    className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden"
                  >
                    <div
                      className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                      onClick={() => setExpandedExecution(isExpanded ? null : exec.id)}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        exec.status === "running" ? "bg-blue-500" :
                        exec.status === "failed" ? "bg-red-100" : "bg-[#111111]"
                      }`}>
                        {exec.status === "running" ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : exec.status === "failed" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <AgentIcon className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Agent name + time */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#111111] truncate">{exec.routineName}</span>
                          {exec.status === "success" && (
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                              Success
                            </span>
                          )}
                          {exec.status === "failed" && (
                            <span className="text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                          {exec.status === "running" && (
                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                              Running
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[#888888]">
                          <span>{new Date(exec.startedAt).toLocaleDateString()} {new Date(exec.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {duration !== null && (
                            <span>{duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`}</span>
                          )}
                          {exec.toolCalls.length > 0 && (
                            <span>{exec.toolCalls.length} tool call{exec.toolCalls.length !== 1 ? "s" : ""}</span>
                          )}
                          {exec.creditsUsed > 0 && (
                            <span>{exec.creditsUsed.toFixed(2)} credits</span>
                          )}
                        </div>
                      </div>

                      {/* Expand arrow */}
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#AAAAAA]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#AAAAAA]" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-[#F0EEE8]">
                        {/* Data changed */}
                        {exec.dataChanged.length > 0 && (
                          <div className="mt-3">
                            <div className="text-[11px] font-medium text-[#AAAAAA] uppercase tracking-wider mb-1.5">Changes made</div>
                            <div className="flex flex-wrap gap-1.5">
                              {exec.dataChanged.map((change: string, i: number) => (
                                <span key={i} className="text-[11px] bg-[#F5F5F0] text-[#666666] px-2 py-0.5 rounded">
                                  {change}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tool calls with details */}
                        {exec.toolCalls.length > 0 && (
                          <div className="mt-3">
                            <div className="text-[11px] font-medium text-[#AAAAAA] uppercase tracking-wider mb-1.5">Tool calls ({exec.toolCalls.length})</div>
                            <div className="space-y-1.5">
                              {exec.toolCalls.map((tc: any, i: number) => (
                                <details key={i} className={`rounded-lg border overflow-hidden ${
                                  tc.success ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"
                                }`}>
                                  <summary className="px-3 py-1.5 cursor-pointer hover:bg-white/50 transition-colors flex items-center gap-1.5">
                                    <Wrench className="h-2.5 w-2.5 shrink-0" />
                                    <span className={`text-[12px] font-medium ${tc.success ? "text-green-700" : "text-red-600"}`}>
                                      {tc.name}
                                    </span>
                                    <span className={`text-[10px] ml-auto ${tc.success ? "text-green-500" : "text-red-400"}`}>
                                      {tc.success ? "success" : "failed"}
                                    </span>
                                  </summary>
                                  <div className="px-3 pb-2 space-y-1.5 border-t border-[#E0DED8]/50">
                                    {tc.input && (
                                      <div className="mt-1.5">
                                        <div className="text-[10px] font-medium text-[#AAAAAA] mb-0.5">Input</div>
                                        <pre className="text-[10px] text-[#666666] bg-white rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                                          {tc.input}
                                        </pre>
                                      </div>
                                    )}
                                    {tc.result && (
                                      <div>
                                        <div className="text-[10px] font-medium text-[#AAAAAA] mb-0.5">Result</div>
                                        <pre className="text-[10px] text-[#666666] bg-white rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                                          {tc.result}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        {exec.response && (
                          <div className="mt-3">
                            <div className="text-[11px] font-medium text-[#AAAAAA] uppercase tracking-wider mb-1.5">Agent response</div>
                            <div className="bg-[#FAFAF8] rounded-lg p-3 text-[12px] text-[#444444] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {exec.response}
                            </div>
                          </div>
                        )}

                        {/* Error */}
                        {exec.error && (
                          <div className="mt-3">
                            <div className="text-[12px] text-red-500 flex items-center gap-1.5 bg-red-50 rounded-lg p-3">
                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                              {exec.error}
                            </div>
                          </div>
                        )}

                        {/* Execution log */}
                        {exec.liveLog && exec.liveLog.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-[11px] text-[#AAAAAA] cursor-pointer hover:text-[#666666]">
                              Show execution log ({exec.liveLog.length} entries)
                            </summary>
                            <div className="mt-1.5 pl-2 border-l-2 border-[#E0DED8] space-y-0.5 max-h-64 overflow-y-auto">
                              {exec.liveLog.map((entry: any, i: number) => (
                                <div key={i} className="flex items-start gap-1.5 py-0.5">
                                  <LogEntryIcon type={entry.type} />
                                  <span className={`text-[10px] ${
                                    entry.type === "error" ? "text-red-500" : "text-[#888888]"
                                  }`}>
                                    {entry.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={historyPage <= 1}
                    onClick={() => fetchAllExecutions(historyPage - 1, historyFilter)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[13px] text-[#888888]">
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    disabled={historyPage >= historyTotalPages}
                    onClick={() => fetchAllExecutions(historyPage + 1, historyFilter)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================== AGENTS TAB ======================== */}
      {activeSubTab === "agents" && <>

      {/* Templates */}
      {showTemplates && (
        <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EEE8]">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#666666]" />
              <h3 className="text-[16px] font-semibold text-[#111111]">Quick Start Templates</h3>
            </div>
            <p className="text-[13px] text-[#888888] mt-1">Pre-configured agents you can add with one click</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="text-left p-4 rounded-lg border border-[#E0DED8] hover:border-[#111111] hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="font-medium text-[14px] text-[#111111]">{template.name}</div>
                <div className="text-[12px] text-[#888888] mt-1 line-clamp-2">{template.description || template.prompt}</div>
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
              <h3 className="text-[16px] font-semibold text-[#111111]">Create Agent</h3>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <Label className="text-[13px] font-medium text-[#444444]">Time (UTC)</Label>
                <Input
                  type="time"
                  value={`${String(form.hour).padStart(2, "0")}:${String(form.minute).padStart(2, "0")}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    setForm((f) => ({ ...f, hour: h, minute: m }));
                  }}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => createRoutine()}
                disabled={saving}
                className="rounded-full text-[13px] bg-[#111111] hover:bg-[#333333] text-white"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                Create Agent
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

      {/* Agents List */}
      {routines.length === 0 && !showCreate && !showTemplates ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E0DED8]">
          <Clock className="h-10 w-10 text-[#CCCCCC] mx-auto mb-3" />
          <h3 className="text-[16px] font-medium text-[#444444]">No agents yet</h3>
          <p className="text-[13px] text-[#888888] mt-1 max-w-md mx-auto">
            Create AI agents to research topics, audit content, and manage your blog on autopilot.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-[13px]"
              onClick={() => setShowTemplates(true)}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Choose Existing Agent
            </Button>
            <Button
              size="sm"
              className="rounded-full text-[13px] bg-[#111111] hover:bg-[#333333] text-white"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Agent
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => {
            const execDone = routine.lastExecution?.phase === "completed" || routine.lastExecution?.phase === "failed";
            const isRunning = !execDone && (executingRoutines.has(routine.id) || routine.lastExecution?.status === "running");
            const isOverdue = routine.enabled && routine.nextRunAt && new Date(routine.nextRunAt).getTime() <= Date.now();
            const executionId = activeExecutionIds[routine.id] || routine.lastExecution?.id;

            return (
              <div
                key={routine.id}
                className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                  isRunning ? "border-blue-200 shadow-sm shadow-blue-50" : "border-[#E0DED8]"
                }`}
              >
                {/* Agent Header */}
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleExpand(routine.id)}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isRunning ? "bg-blue-500" : "bg-[#111111]"
                      }`}>
                        {isRunning ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          (() => { const Icon = getAgentIcon(routine); return <Icon className="w-4 h-4 text-white" />; })()
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#111111]">{routine.name}</div>
                        <div className="text-[12px] text-[#888888]">{formatSchedule(routine.schedule)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isRunning && (
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                          {routine.lastExecution?.phase
                            ? phaseLabel(routine.lastExecution.phase)
                            : "Starting..."}
                        </span>
                      )}
                      {!isRunning && isOverdue && (
                        <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                          Due
                        </span>
                      )}
                      {(() => {
                        // Prefer lastExecution.status over routine.lastRunStatus when they conflict
                        const execStatus = routine.lastExecution?.status;
                        const execPhase = routine.lastExecution?.phase;
                        const actuallyFailed =
                          (execStatus === "failed" || execPhase === "failed") ||
                          (!routine.lastExecution && routine.lastRunStatus === "failed");
                        const actuallySucceeded = execStatus === "completed" || execPhase === "completed";

                        if (!isRunning && !isOverdue && actuallyFailed && !actuallySucceeded) {
                          return (
                            <span className="text-[11px] font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </span>
                          );
                        }
                        if (!isRunning && !isOverdue && routine.enabled) {
                          return (
                            <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                              Active
                            </span>
                          );
                        }
                        if (!isRunning && !routine.enabled) {
                          return (
                            <span className="text-[11px] font-medium text-[#888888] bg-[#F5F5F0] px-2.5 py-1 rounded-full">
                              Paused
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex items-center gap-0.5 ml-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => executeRoutine(routine.id)}
                          disabled={!!isRunning}
                          title="Run now"
                        >
                          {isRunning ? (
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
                  </div>

                  {/* Prompt preview */}
                  <div className="bg-[#FAFAF8] rounded-lg p-3 mt-3 ml-12">
                    <p className="text-[13px] text-[#666666] leading-relaxed italic line-clamp-2">
                      &ldquo;{routine.prompt.length > 120 ? routine.prompt.slice(0, 120).trim() + "..." : routine.prompt}&rdquo;
                    </p>
                  </div>

                  {/* Last run / next run footer */}
                  <div className="flex items-center justify-between text-[12px] text-[#888888] mt-3 ml-12">
                    <div className="flex items-center gap-4">
                      {routine.totalRuns > 0 ? (
                        <span>{routine.successfulRuns}/{routine.totalRuns} runs</span>
                      ) : routine.lastExecution && (routine.lastExecution.phase === "completed" || routine.lastExecution.status === "completed") ? (
                        <span className="text-green-600">Last run succeeded</span>
                      ) : null}
                      {isRunning && routine.lastExecution?.startedAt && (
                        <span className="text-blue-500 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Started {timeAgo(routine.lastExecution.startedAt)}
                        </span>
                      )}
                    </div>
                    <div>
                      {!isRunning && routine.lastRunStatus === "success" && routine.lastRunAt && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          Last run {timeAgo(routine.lastRunAt)}
                        </span>
                      )}
                      {!isRunning && routine.nextRunAt && routine.enabled && !isOverdue && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next: {new Date(routine.nextRunAt).toLocaleDateString()} {new Date(routine.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {!isRunning && isOverdue && (
                        <span className="text-amber-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Waiting for next cron check...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Running progress bar */}
                {isRunning && (
                  <div className="h-1 bg-blue-100 overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/3" style={{
                      animation: "shimmer 2s ease-in-out infinite",
                    }} />
                    <style jsx>{`
                      @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(400%); }
                      }
                    `}</style>
                  </div>
                )}

                {/* Live execution monitor — shown when running and expanded */}
                {isRunning && expandedRoutine === routine.id && executionId && (
                  <LiveExecutionMonitor
                    executionId={executionId}
                    routineName={routine.name}
                    onComplete={() => {
                      setExecutingRoutines((prev) => {
                        const next = new Set(prev);
                        next.delete(routine.id);
                        return next;
                      });
                      fetchRoutines(true);
                    }}
                  />
                )}

                {/* Expanded Detail — shown when NOT running or when running (below monitor) */}
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
                                  {exec.status === "success" || exec.phase === "completed" ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  ) : exec.status === "failed" || exec.phase === "failed" ? (
                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                  ) : (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                                  )}
                                  <span className="text-[12px] font-medium text-[#444444]">
                                    {exec.status === "success" || exec.phase === "completed"
                                      ? "Completed"
                                      : exec.status === "failed" || exec.phase === "failed"
                                        ? "Failed"
                                        : phaseLabel(exec.phase)}
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
                                <div className="mt-2 text-[12px] text-red-500 flex items-center gap-1.5">
                                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                  {exec.error}
                                </div>
                              )}

                              {/* Show log entries for completed/failed executions */}
                              {exec.liveLog && exec.liveLog.length > 0 && exec.status !== "running" && (
                                <details className="mt-2">
                                  <summary className="text-[11px] text-[#AAAAAA] cursor-pointer hover:text-[#666666]">
                                    Show execution log ({exec.liveLog.length} entries)
                                  </summary>
                                  <div className="mt-1.5 pl-2 border-l-2 border-[#E0DED8] space-y-0.5">
                                    {exec.liveLog.map((entry, i) => (
                                      <div key={i} className="flex items-start gap-1.5 py-0.5">
                                        <LogEntryIcon type={entry.type} />
                                        <span className={`text-[10px] ${
                                          entry.type === "error" ? "text-red-500" : "text-[#888888]"
                                        }`}>
                                          {entry.message}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      </>}
    </div>
  );
}
