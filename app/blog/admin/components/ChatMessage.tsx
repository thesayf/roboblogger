"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import ToolCallIndicator from './ToolCallIndicator';
import type { ChatMessageUI } from '@/hooks/useChat';

interface ChatMessageProps {
  message: ChatMessageUI;
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? 'bg-[#111111]' : 'bg-[#E8E6E1]'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-[#555555]" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-2">
            {message.toolCalls.map((tc, i) => (
              <ToolCallIndicator key={`${tc.name}-${i}`} name={tc.name} status={tc.status} />
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`inline-block max-w-full rounded-xl px-3.5 py-2.5 ${
            isUser
              ? 'bg-[#111111] text-white rounded-br-md'
              : 'bg-[#F5F4F0] text-[#111111] rounded-bl-md'
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-1 prose-pre:bg-[#E8E6E1] prose-pre:text-[#111111] prose-code:text-[#111111] prose-code:bg-[#E8E6E1] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                <span className="text-[#999999] italic">Thinking...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
