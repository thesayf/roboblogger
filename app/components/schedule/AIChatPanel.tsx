import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';
import ScheduleChatDisplay from './ScheduleChatDisplay';
import CudChatDisplay from './CudChatDisplay';
import GoalPlanDisplay from './GoalPlanDisplay';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  type?: 'schedule' | 'cud' | 'goal_plan' | 'text';
  data?: any;
}

interface AIChatPanelProps {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onClearHistory: () => void;
  onSwitchView?: (view: 'schedule' | 'inventory') => void;
}

export default function AIChatPanel({
  isOpen,
  chatHistory,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onClose,
  onClearHistory,
  onSwitchView,
}: AIChatPanelProps) {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = Math.min(chatInputRef.current.scrollHeight, 120) + 'px';
    }
  }, [chatInput]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (!isOpen) {
    return null; // Don't show floating button
    /*
      <button
        onClick={() => onChatInputChange('')}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
    */
  }

  return (
    <div className="fixed bottom-4 right-4 w-[480px] bg-white border border-gray-200 shadow-sm flex flex-col max-h-[80vh] font-mono">
      <div className="px-4 py-2 border-b flex items-center justify-between flex-shrink-0">
        <span className="text-sm text-gray-600">AI Assistant</span>
        <div className="flex items-center gap-3">
          {chatHistory.length > 0 && (
            <button 
              onClick={onClearHistory} 
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ×
          </button>
        </div>
      </div>
      
      {/* Chat history */}
      <div ref={chatHistoryRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-[400px]">
        {chatHistory.length === 0 ? (
          <div className="text-sm text-gray-400 space-y-2">
            <p>Try:</p>
            <ul className="ml-4 space-y-1">
              <li>• &quot;Add deep work block at 2pm&quot;</li>
              <li>• &quot;Add task &apos;Review PRs&apos; to current block&quot;</li>
              <li>• &quot;Move meeting to 3pm&quot;</li>
              <li>• &quot;Add 30min break&quot;</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? (
                  <div className="inline-block max-w-[80%] text-left">
                    <div className="bg-blue-50 text-gray-700 px-3 py-2 rounded-lg">
                      {msg.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">You</div>
                  </div>
                ) : (
                  <div className="inline-block max-w-[100%]">
                    {/* Check if this is a schedule response */}
                    {msg.type === 'schedule' && msg.data ? (
                      <div className="w-full">
                        <div className="text-xs text-gray-400 mb-2">AI Assistant</div>
                        <ScheduleChatDisplay 
                          data={msg.data} 
                          message={msg.message}
                        />
                      </div>
                    ) : msg.type === 'cud' && msg.data ? (
                      <div className="w-full">
                        <div className="text-xs text-gray-400 mb-2">AI Assistant</div>
                        <CudChatDisplay 
                          data={msg.data} 
                          message={msg.message}
                        />
                      </div>
                    ) : msg.type === 'goal_plan' && msg.data ? (
                      <div className="w-full">
                        <div className="text-xs text-gray-400 mb-2">AI Assistant</div>
                        <GoalPlanDisplay 
                          data={msg.data} 
                          message={msg.message}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg" style={{ whiteSpace: 'pre-wrap' }}>
                          {msg.message === '...' || msg.message.toLowerCase().includes('working on it') ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="animate-pulse text-blue-500">Working on it</span>
                              <span className="flex gap-0.5">
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </span>
                            </span>
                          ) : msg.message.startsWith('✓') ? (
                            <span className="text-green-600">
                              {msg.message}
                            </span>
                          ) : msg.message.startsWith('✓ Updating') ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <span className="animate-pulse">{msg.message}</span>
                            </span>
                          ) : (
                            typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message)
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">AI Assistant</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="px-4 py-3 border-t flex-shrink-0">
        <textarea
          ref={chatInputRef}
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(chatInput);
            }
            if (e.key === 'Escape') onClose();
          }}
          className="w-full px-3 py-2 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 transition-colors resize-none overflow-hidden"
          placeholder="Type a command... (Shift+Enter for new line)"
          rows={1}
          style={{ minHeight: '36px', maxHeight: '120px' }}
        />
      </div>
    </div>
  );
}