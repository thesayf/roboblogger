"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatImageAttachment } from '@/lib/chat/attachments';
import type { DeepResearchRunSnapshot } from '@/lib/deep-research/types';

export type ChatSendMode = 'chat' | 'deep-research';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatImageAttachment[];
  toolCalls?: Array<{
    name: string;
    input: Record<string, any>;
    status: 'running' | 'complete' | 'error';
  }>;
  deepResearchRun?: DeepResearchRunSnapshot;
  createdAt: string;
}

export interface ConversationInfo {
  id: string;
  date: string;
  title: string;
  creditsUsed: number;
}

interface UseChatReturn {
  messages: ChatMessageUI[];
  isStreaming: boolean;
  streamingStatus: string;
  error: string | null;
  conversationId: string | null;
  conversations: ConversationInfo[];
  sendMessage: (message: string, attachments?: ChatImageAttachment[], mode?: ChatSendMode) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadTodayConversation: () => Promise<void>;
  dataChanged: string[];
  clearDataChanged: () => void;
}

function friendlyToolName(toolName: string): string {
  const map: Record<string, string> = {
    create_topic: 'Creating topic...',
    create_topics_bulk: 'Creating topics...',
    update_topic: 'Updating topic...',
    get_existing_posts: 'Searching posts...',
    get_blog_stats: 'Loading blog stats...',
    get_brand_settings: 'Loading brand settings...',
    get_topics_queue: 'Loading topics queue...',
    get_post: 'Reading post...',
    get_internal_link_map: 'Mapping internal links...',
    get_media_images: 'Loading images...',
    view_image: 'Viewing image...',
    edit_post: 'Editing post...',
    edit_post_component: 'Editing post content...',
    update_post_status: 'Updating post status...',
    update_brand_settings: 'Updating brand settings...',
    search_keyword_data: 'Researching keywords...',
    search_related_keywords: 'Finding related keywords...',
    search_trending_topics: 'Searching trends...',
    search_competitor_content: 'Analysing competitors...',
    search_content_gaps: 'Finding content gaps...',
    search_chat_history: 'Searching chat history...',
    audit_content: 'Auditing content...',
    check_keyword_cannibalization: 'Checking keyword overlap...',
    check_post_rankings: 'Checking rankings...',
    web_search: 'Searching the web...',
    list_documents: 'Loading documents...',
    read_document: 'Reading document...',
    create_document: 'Creating document...',
    write_document: 'Writing document...',
    delete_document: 'Deleting document...',
    list_routines: 'Loading routines...',
    create_routine: 'Creating routine...',
    update_routine: 'Updating routine...',
    update_topics_bulk: 'Updating topics...',
    edit_posts_bulk: 'Editing posts...',
  };
  return map[toolName] || `Running ${toolName}...`;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [dataChanged, setDataChanged] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setConversationId(data.id);
      setMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          attachments: m.attachments || [],
          toolCalls: m.toolCalls?.map((tc: any) => ({
            ...tc,
            status: 'complete' as const,
          })),
          deepResearchRun: m.deepResearchRun,
          createdAt: m.createdAt,
        }))
      );
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  const loadTodayConversation = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Check if today's conversation exists in the list
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations);

      const todayConv = data.conversations.find(
        (c: ConversationInfo) => c.date === today
      );

      if (todayConv) {
        await loadConversation(todayConv.id);
      } else {
        // Start fresh
        setConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load today conversation:', err);
    }
  }, [loadConversation]);

  const handleSSEEvent = useCallback((event: string, data: any, assistantId: string) => {
    switch (event) {
      case 'text_delta':
        setStreamingStatus('Writing response...');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + data.text }
              : message
          )
        );
        break;

      case 'tool_start':
        setStreamingStatus(friendlyToolName(data.toolName));
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  toolCalls: [
                    ...(message.toolCalls || []),
                    {
                      name: data.toolName,
                      input: data.toolInput,
                      status: 'running' as const,
                    },
                  ],
                }
              : message
          )
        );
        break;

      case 'tool_end':
        setStreamingStatus('Thinking...');
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  toolCalls: message.toolCalls?.map((toolCall) =>
                    toolCall.name === data.toolName && toolCall.status === 'running'
                      ? { ...toolCall, status: data.success ? 'complete' as const : 'error' as const }
                      : toolCall
                  ),
                }
              : message
          )
        );
        break;

      case 'done':
        if (data.conversationId) setConversationId(data.conversationId);
        if (data.dataChanged?.length > 0) {
          setDataChanged((prev) => Array.from(new Set([...prev, ...data.dataChanged])));
        }
        break;

      case 'error':
        setError(data.message);
        break;
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string, attachments: ChatImageAttachment[] = [], mode: ChatSendMode = 'chat') => {
      if (isStreaming) return;

      setError(null);
      setIsStreaming(true);
      setStreamingStatus('Thinking...');

      // Add user message immediately
      const userMsg: ChatMessageUI = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        attachments,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder assistant message
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessageUI = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        if (mode === 'deep-research') {
          setStreamingStatus('Starting deep research...');
          const res = await fetch('/api/deep-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ objective: message, conversationId }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (data.code === 'INSUFFICIENT_CREDITS' || res.status === 402) {
              throw new Error(data.error || 'You need more credits to start deep research.');
            }
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          setConversationId(data.conversationId);
          setMessages((prev) => prev.map((item) => {
            if (item.id === assistantId) {
              return {
                ...item,
                id: data.assistantMessageId,
                deepResearchRun: data.run,
              };
            }
            return item;
          }));
          return;
        }

        abortRef.current = new AbortController();

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, attachments, conversationId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.code === 'INSUFFICIENT_CREDITS' || res.status === 402) {
            throw new Error('You\'ve run out of credits. Please top up to continue chatting.');
          }
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let receivedDone = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                if (currentEvent === 'done') receivedDone = true;
                handleSSEEvent(currentEvent, data, assistantId);
              } catch {
                // Skip malformed events
              }
              currentEvent = '';
            }
          }
        }

        // Stream ended without a proper 'done' event — likely a timeout or crash
        if (!receivedDone) {
          setError('Connection lost — the response may be incomplete. Your message has been saved.');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to send message');
          // Remove empty assistant message on error
          setMessages((prev) =>
            prev.filter(
              (m) => m.id !== assistantId || m.content.length > 0
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setStreamingStatus('');
        abortRef.current = null;
      }
    },
    [isStreaming, conversationId, handleSSEEvent]
  );

  const activeResearchRunIds = messages
    .filter((message) => message.deepResearchRun && ['queued', 'running'].includes(message.deepResearchRun.status))
    .map((message) => message.deepResearchRun!.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!activeResearchRunIds) return;
    let cancelled = false;
    const ids = activeResearchRunIds.split(',').filter(Boolean);

    const refresh = async () => {
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const response = await fetch(`/api/deep-research/${id}`, { cache: 'no-store' });
          if (!response.ok) return null;
          const data = await response.json();
          return data.run as DeepResearchRunSnapshot;
        } catch {
          return null;
        }
      }));
      if (cancelled) return;
      const byId = new Map(results.filter(Boolean).map((run) => [run!.id, run!]));
      setMessages((current) => current.map((message) => {
        const runId = message.deepResearchRun?.id;
        if (!runId || !byId.has(runId)) return message;
        const run = byId.get(runId)!;
        return {
          ...message,
          content: run.report || message.content,
          deepResearchRun: run,
        };
      }));
    };

    void refresh();
    const interval = window.setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeResearchRunIds]);

  const clearDataChanged = useCallback(() => {
    setDataChanged([]);
  }, []);

  return {
    messages,
    isStreaming,
    streamingStatus,
    error,
    conversationId,
    conversations,
    sendMessage,
    loadConversation,
    loadConversations,
    loadTodayConversation,
    dataChanged,
    clearDataChanged,
  };
}
