"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minus } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  type?: 'schedule' | 'cud' | 'goal_plan' | 'text';
  data?: any;
}

interface MobileChatSheetProps {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onClearHistory: () => void;
}

type SheetHeight = 'minimized' | 'half' | 'full';

export default function MobileChatSheet({
  isOpen,
  chatHistory,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onClose,
  onClearHistory,
}: MobileChatSheetProps) {
  const [height, setHeight] = useState<SheetHeight>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Get height percentage based on state
  const getHeightClass = () => {
    switch (height) {
      case 'minimized':
        return 'h-20'; // Just the input bar
      case 'half':
        return 'h-[50vh]';
      case 'full':
        return 'h-[90vh]';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - dragStart;
    const threshold = 50;

    if (deltaY > threshold) {
      // Dragged down
      if (height === 'full') setHeight('half');
      else if (height === 'half') setHeight('minimized');
      else onClose();
    } else if (deltaY < -threshold) {
      // Dragged up
      if (height === 'minimized') setHeight('half');
      else if (height === 'half') setHeight('full');
    }
  };

  const handleSend = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      onChatInputChange('');
      // Expand to half or full when sending
      if (height === 'minimized') {
        setHeight('half');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          height === 'full' ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setHeight('half')}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 z-50 flex flex-col ${getHeightClass()}`}
      >
        {/* Drag Handle */}
        <div
          className="py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            {chatHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Height toggle buttons */}
            <button
              onClick={() => setHeight('minimized')}
              className={`p-2 rounded ${height === 'minimized' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Chat History - Only show when not minimized */}
        {height !== 'minimized' && (
          <div
            ref={chatHistoryRef}
            className="flex-1 overflow-y-auto px-4 py-3"
          >
            {chatHistory.length === 0 ? (
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-medium text-gray-600">Try asking:</p>
                <ul className="space-y-1.5">
                  <li>• "Add deep work block at 2pm"</li>
                  <li>• "Show my schedule for tomorrow"</li>
                  <li>• "What tasks do I have today?"</li>
                  <li>• "Add meeting with team at 3pm"</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AI anything..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:border-blue-500 max-h-32 text-sm"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 touch-manipulation flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
