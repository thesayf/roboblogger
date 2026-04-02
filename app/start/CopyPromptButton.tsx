"use client";

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { SETUP_PROMPT } from '@/lib/setup-prompt';

// Parse the prompt into structured sections for the modal display
function parsePromptSections(prompt: string) {
  const sections: { title: string; content: string; isCode: boolean }[] = [];
  const lines = prompt.split('\n');
  let currentTitle = 'Overview';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentLines.length > 0) {
        const content = currentLines.join('\n').trim();
        if (content) {
          sections.push({ title: currentTitle, content, isCode: currentTitle === 'Response Shape' });
        }
      }
      currentTitle = line.replace('## ', '');
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) {
    const content = currentLines.join('\n').trim();
    if (content) {
      sections.push({ title: currentTitle, content, isCode: false });
    }
  }
  return sections;
}

export default function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SETUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full text-[13px] font-semibold text-white bg-[#333333] px-6 py-3 rounded-full hover:bg-[#444444] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          Copied to clipboard
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy setup prompt
        </>
      )}
    </button>
  );
}

export function ViewPromptButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SETUP_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = parsePromptSections(SETUP_PROMPT);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[13px] font-medium text-[#888888] hover:text-[#111111] transition-colors whitespace-nowrap cursor-pointer"
      >
        View full prompt &rarr;
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#111111] rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                  <div className="w-3 h-3 rounded-full bg-[#333333]" />
                </div>
                <span className="text-[13px] text-[#666666] font-mono">setup-prompt.md</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[12px] font-medium text-white bg-[#2A2A2A] px-4 py-1.5 rounded-full hover:bg-[#3A3A3A] transition-colors inline-flex items-center gap-1.5 cursor-pointer border border-[#3A3A3A]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy all
                    </>
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#666666] hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-[11px] font-semibold text-[#88CCFF] uppercase tracking-[0.15em] mb-3">
                    {section.title}
                  </h3>
                  {section.isCode ? (
                    <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-4">
                      <pre className="text-[12px] text-[#CCCCCC] font-mono leading-relaxed whitespace-pre-wrap">
                        {section.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#AAAAAA] font-mono leading-[1.8] whitespace-pre-wrap">
                      {section.content.split('\n').map((line, j) => {
                        if (line.startsWith('- ')) {
                          return (
                            <div key={j} className="flex gap-2 pl-2">
                              <span className="text-[#555555] shrink-0">&bull;</span>
                              <span>{line.slice(2)}</span>
                            </div>
                          );
                        }
                        if (/^\d+\.\s/.test(line)) {
                          const num = line.match(/^(\d+)\.\s/)?.[1];
                          const text = line.replace(/^\d+\.\s/, '');
                          return (
                            <div key={j} className="flex gap-2 pl-2">
                              <span className="text-[#88CCFF] shrink-0 w-4 text-right">{num}.</span>
                              <span>{text}</span>
                            </div>
                          );
                        }
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={j} className="flex gap-2 pl-6">
                              <span className="text-[#444444] shrink-0">-</span>
                              <span className="text-[#888888]">{line.trim().slice(2)}</span>
                            </div>
                          );
                        }
                        return <div key={j}>{line}</div>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
