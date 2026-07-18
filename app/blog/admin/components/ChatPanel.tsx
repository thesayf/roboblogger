"use client";

import React, { useEffect, useRef } from 'react';
import { MessageSquare, ChevronLeft, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, type ConversationInfo } from '@/hooks/useChat';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import type { ChatImageAttachment } from '@/lib/chat/attachments';
import type { ChatMode } from '@/lib/chat/chat-mode';

export default function ChatPanel({ onClose }: { onClose?: () => void }) {
  const {
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
  } = useChat();

  const [view, setView] = React.useState<'chat' | 'history'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Load today's conversation on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadTodayConversation();
    }
  }, [loadTodayConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Dispatch custom event when agent mutates data (topics, posts)
  useEffect(() => {
    if (dataChanged.length > 0) {
      window.dispatchEvent(
        new CustomEvent('chat-data-changed', { detail: { collections: dataChanged } })
      );
      clearDataChanged();
    }
  }, [dataChanged, clearDataChanged]);

  const handleSend = async (message: string, attachments: ChatImageAttachment[], mode: ChatMode) => {
    await sendMessage(message, attachments, mode);
  };

  const handleShowHistory = async () => {
    await loadConversations();
    setView('history');
  };

  const handleSelectConversation = async (conv: ConversationInfo) => {
    await loadConversation(conv.id);
    setView('chat');
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    try {
      await fetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
      window.location.reload();
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  const handleBackToChat = () => {
    setView('chat');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E0DED8]">
        {view === 'history' ? (
          <>
            <button
              onClick={handleBackToChat}
              className="flex items-center gap-1 text-sm text-[#666666] hover:text-[#111111]"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-sm font-medium text-[#111111]">Conversations</span>
            <div className="w-16" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#666666]" />
              <span className="text-sm font-medium text-[#111111] select-none" onDoubleClick={handleDeleteConversation}>Blog Strategist</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowHistory}
                className="text-xs text-[#888888] hover:text-[#111111] transition-colors"
              >
                History
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F0] transition-colors text-[#888888] hover:text-[#111111]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {view === 'history' ? (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-[#999999] text-center py-8">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-[#F5F4F0] transition-colors ${
                    conv.id === conversationId ? 'bg-[#F5F4F0]' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[#111111] truncate">{conv.title}</p>
                  <p className="text-xs text-[#999999]">{conv.date}</p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="w-10 h-10 text-[#CCCCCC] mb-3" />
                <p className="text-sm font-medium text-[#666666] mb-1">
                  Blog Strategy Assistant
                </p>
                <p className="text-xs text-[#999999] max-w-[220px]">
                  Ask about keyword research, content gaps, competitor analysis, or add topics to your queue.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))
            )}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-[#999999]">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{streamingStatus || 'Thinking...'}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </>
      )}
    </div>
  );
}
