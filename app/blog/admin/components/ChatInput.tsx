"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[#E0DED8] bg-white">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Ask about blog strategy, keywords, content ideas...'}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-[#E0DED8] bg-[#FAFAF8] px-3 py-2 text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-1 focus:ring-[#111111] focus:border-[#111111] disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center hover:bg-[#333333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
