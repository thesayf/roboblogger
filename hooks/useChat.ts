"use client";

import { useState, useCallback, useRef } from 'react';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{
    name: string;
    input: Record<string, any>;
    status: 'running' | 'complete' | 'error';
  }>;
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
  error: string | null;
  conversationId: string | null;
  conversations: ConversationInfo[];
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadTodayConversation: () => Promise<void>;
  dataChanged: string[];
  clearDataChanged: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
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
          toolCalls: m.toolCalls?.map((tc: any) => ({
            ...tc,
            status: 'complete' as const,
          })),
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

  const sendMessage = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      setError(null);
      setIsStreaming(true);

      // Add user message immediately
      const userMsg: ChatMessageUI = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
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
        abortRef.current = new AbortController();

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, conversationId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

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
                handleSSEEvent(currentEvent, data, assistantId);
              } catch {
                // Skip malformed events
              }
              currentEvent = '';
            }
          }
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
        abortRef.current = null;
      }
    },
    [isStreaming, conversationId]
  );

  function handleSSEEvent(event: string, data: any, assistantId: string) {
    switch (event) {
      case 'text_delta':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + data.text }
              : m
          )
        );
        break;

      case 'tool_start':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  toolCalls: [
                    ...(m.toolCalls || []),
                    {
                      name: data.toolName,
                      input: data.toolInput,
                      status: 'running' as const,
                    },
                  ],
                }
              : m
          )
        );
        break;

      case 'tool_end':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  toolCalls: m.toolCalls?.map((tc) =>
                    tc.name === data.toolName && tc.status === 'running'
                      ? { ...tc, status: data.success ? 'complete' as const : 'error' as const }
                      : tc
                  ),
                }
              : m
          )
        );
        break;

      case 'done':
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        if (data.dataChanged?.length > 0) {
          setDataChanged((prev) => Array.from(new Set([...prev, ...data.dataChanged])));
        }
        break;

      case 'error':
        setError(data.message);
        break;
    }
  }

  const clearDataChanged = useCallback(() => {
    setDataChanged([]);
  }, []);

  return {
    messages,
    isStreaming,
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
