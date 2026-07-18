"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  Square,
} from 'lucide-react';
import type { DeepResearchRunSnapshot } from '@/lib/deep-research/types';

const PHASE_LABELS: Record<string, string> = {
  queued: 'Queued',
  planning: 'Planning',
  researching: 'Collecting evidence',
  evaluating: 'Evaluating evidence',
  revising: 'Strengthening evidence',
  synthesizing: 'Writing report',
  completed: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function StatusIcon({ run }: { run: DeepResearchRunSnapshot }) {
  if (run.status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (run.status === 'partial' || run.status === 'failed') return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  if (run.status === 'cancelled') return <Square className="h-3.5 w-3.5 text-[#888888]" />;
  return <Loader2 className="h-4 w-4 animate-spin text-[#555555]" />;
}

export default function DeepResearchProgress({ run }: { run: DeepResearchRunSnapshot }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const active = run.status === 'queued' || run.status === 'running';
  const planItems = run.plan?.items || [];
  const resolved = planItems.filter((item) => item.status === 'completed' || item.status === 'blocked').length;
  const title = active
    ? 'Researching your question'
    : run.status === 'completed'
      ? 'Research complete'
      : run.status === 'partial'
        ? 'Research completed with limitations'
        : 'Research';

  const cancel = async () => {
    if (!active || isCancelling) return;
    setIsCancelling(true);
    try {
      await fetch(`/api/deep-research/${run.id}`, { method: 'DELETE' });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="w-full max-w-[640px] overflow-hidden rounded-md border border-[#D8D5CE] bg-white text-left">
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#F0EFEA]">
            <Search className="h-4 w-4 text-[#333333]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[#111111]">{title}</p>
              <StatusIcon run={run} />
            </div>
            <p className="truncate text-xs text-[#777777]" title={run.phaseDetail}>
              {run.phaseDetail || PHASE_LABELS[run.phase] || run.phase}
            </p>
          </div>
        </div>

        {active && (
          <button
            type="button"
            onClick={cancel}
            disabled={isCancelling}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#777777] transition-colors hover:bg-[#F0EFEA] hover:text-[#111111] disabled:opacity-40"
            aria-label="Cancel research"
            title="Cancel research"
          >
            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      <div className="h-1 bg-[#EEECE7]">
        <div
          className={`h-full transition-[width] duration-500 ${run.status === 'failed' ? 'bg-red-500' : run.status === 'partial' ? 'bg-amber-500' : 'bg-[#111111]'}`}
          style={{ width: `${Math.max(2, Math.min(100, run.progress))}%` }}
        />
      </div>

      {(active || planItems.length > 0) && (
        <div className="border-t border-[#EEECE7] px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-[#777777]">
            <span>{PHASE_LABELS[run.phase] || run.phase}</span>
            <span>{planItems.length > 0 ? `${resolved}/${planItems.length} workstreams` : `${run.progress}%`}</span>
          </div>
          {planItems.length > 0 && (
            <div className="space-y-1.5">
              {planItems.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-xs">
                  {item.status === 'completed' ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600" />
                  ) : item.status === 'blocked' ? (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600" />
                  ) : item.status === 'in_progress' ? (
                    <Loader2 className="mt-0.5 h-3.5 w-3.5 flex-none animate-spin text-[#555555]" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 flex-none text-[#BBB8B0]" />
                  )}
                  <span className={item.status === 'pending' ? 'text-[#888888]' : 'text-[#444444]'}>{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {run.evaluation && (
        <div className="flex items-center justify-between border-t border-[#EEECE7] px-3.5 py-2.5 text-xs">
          <span className="text-[#777777]">Evidence evaluation</span>
          <span className={run.evaluation.passed ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
            {run.evaluation.score}/100
          </span>
        </div>
      )}

      {run.error && !run.report && (
        <div className="border-t border-red-100 bg-red-50 px-3.5 py-3 text-xs text-red-700">{run.error}</div>
      )}

      {run.report && (
        <div className="border-t border-[#D8D5CE] px-4 py-4 text-sm text-[#111111]">
          <div className="prose prose-sm max-w-none prose-headings:my-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-a:text-[#111111] prose-a:underline prose-pre:bg-[#F0EFEA] prose-pre:text-[#111111] prose-code:text-[#111111]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.report}</ReactMarkdown>
          </div>
          {run.creditsUsed > 0 && (
            <p className="mt-4 border-t border-[#EEECE7] pt-2 text-[11px] text-[#999999]">
              {run.creditsUsed.toFixed(2)} credits used
            </p>
          )}
        </div>
      )}
    </div>
  );
}
