"use client";

import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, MessageSquareText, Paperclip, Search, Send, X } from 'lucide-react';
import {
  CHAT_IMAGE_MAX_COUNT,
  type ChatImageAttachment,
  validateChatImageFile,
} from '@/lib/chat/attachments';
import type { ChatSendMode } from '@/hooks/useChat';

interface ChatInputProps {
  onSend: (message: string, attachments: ChatImageAttachment[], mode: ChatSendMode) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<ChatSendMode>('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const dragDepthRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const addFiles = (files: File[]) => {
    if (disabled || isUploading || mode === 'deep-research' || files.length === 0) return;

    const existingKeys = new Set(
      pendingImages.map(({ file }) => `${file.name}:${file.size}:${file.lastModified}`)
    );
    const accepted: PendingImage[] = [];
    let nextError: string | null = null;

    for (const file of files) {
      if (pendingImages.length + accepted.length >= CHAT_IMAGE_MAX_COUNT) {
        nextError = `You can attach up to ${CHAT_IMAGE_MAX_COUNT} images.`;
        break;
      }

      const validationError = validateChatImageFile(file);
      if (validationError) {
        nextError = validationError;
        continue;
      }

      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (existingKeys.has(key)) continue;

      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      existingKeys.add(key);
      accepted.push({ id: crypto.randomUUID(), file, previewUrl });
    }

    if (accepted.length > 0) {
      setPendingImages((current) => [...current, ...accepted]);
    }
    setUploadError(nextError);
  };

  const removeImage = (id: string) => {
    setPendingImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrlsRef.current.delete(image.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
    setUploadError(null);
  };

  const clearImages = () => {
    pendingImages.forEach((image) => {
      URL.revokeObjectURL(image.previewUrl);
      previewUrlsRef.current.delete(image.previewUrl);
    });
    setPendingImages([]);
  };

  const uploadImages = async (): Promise<ChatImageAttachment[]> => {
    if (pendingImages.length === 0) return [];

    const body = new FormData();
    pendingImages.forEach(({ file }) => body.append('files', file));

    const response = await fetch('/api/chat/attachments', { method: 'POST', body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Image upload failed.');
    }

    return data.attachments;
  };

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if ((!trimmed && pendingImages.length === 0) || disabled || isUploading) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const attachments = mode === 'chat' ? await uploadImages() : [];
      await onSend(trimmed, attachments, mode);
      setValue('');
      clearImages();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to send message.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const inputDisabled = disabled || isUploading;
  const canSend = mode === 'deep-research' ? Boolean(value.trim()) : Boolean(value.trim() || pendingImages.length > 0);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className={`relative border-t bg-white p-3 transition-colors ${
        isDragging ? 'border-[#111111] bg-[#F5F4F0] ring-2 ring-inset ring-[#111111]' : 'border-[#E0DED8]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />

      {pendingImages.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {pendingImages.map((image) => (
            <div key={image.id} className="relative h-16 w-16 flex-none overflow-hidden rounded-md border border-[#E0DED8] bg-[#F5F4F0]">
              <Image
                src={image.previewUrl}
                alt={image.file.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                disabled={inputDisabled}
                aria-label={`Remove ${image.file.name}`}
                title="Remove image"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="mb-2 text-xs text-red-600">{uploadError}</p>}

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-[#D8D5CE] bg-[#F5F4F0] p-0.5" role="group" aria-label="Assistant mode">
          <button
            type="button"
            onClick={() => setMode('chat')}
            disabled={inputDisabled}
            aria-pressed={mode === 'chat'}
            className={`flex h-7 items-center gap-1.5 rounded px-2 text-xs transition-colors ${
              mode === 'chat' ? 'bg-white font-medium text-[#111111] shadow-sm' : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            <MessageSquareText className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('deep-research');
              clearImages();
            }}
            disabled={inputDisabled}
            aria-pressed={mode === 'deep-research'}
            className={`flex h-7 items-center gap-1.5 rounded px-2 text-xs transition-colors ${
              mode === 'deep-research' ? 'bg-white font-medium text-[#111111] shadow-sm' : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Deep research
          </button>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={inputDisabled || mode === 'deep-research' || pendingImages.length >= CHAT_IMAGE_MAX_COUNT}
          aria-label="Attach images"
          title="Attach images"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#666666] transition-colors hover:bg-[#F5F4F0] hover:text-[#111111] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (mode === 'deep-research'
            ? 'Describe the market, competitors, or strategy to research...'
            : 'Ask about blog strategy, keywords, content ideas...')}
          disabled={inputDisabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-[#E0DED8] bg-[#FAFAF8] px-3 py-2 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={inputDisabled || !canSend}
          aria-label="Send message"
          title="Send message"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#111111] text-white transition-colors hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isDragging && <div className="pointer-events-none absolute inset-0 bg-white/35" aria-hidden="true" />}
    </div>
  );
}
