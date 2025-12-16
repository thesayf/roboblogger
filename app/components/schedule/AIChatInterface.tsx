import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface AIChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: any[];
  dayId: string | null;
  onUpdateBlocks?: (blocks: any[]) => void;
  onSwitchView?: (view: 'schedule' | 'inventory') => void;
}

export default function AIChatInterface({ 
  isOpen, 
  onClose, 
  blocks, 
  dayId,
  onUpdateBlocks,
  onSwitchView 
}: AIChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          context: {
            blocks,
            dayId,
          }
        }),
      });

      // Check if response is JSON (error) or stream
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Handle error response
        const errorData = await response.json();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: errorData.message || 'Sorry, something went wrong. Please try again.'
        }]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to get AI response');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        assistantMessage += text;
        
        // Check for view switch commands in the message
        const viewSwitchMatch = assistantMessage.match(/\[SWITCH_VIEW:(schedule|inventory)\]/g);
        if (viewSwitchMatch && onSwitchView) {
          const lastMatch = viewSwitchMatch[viewSwitchMatch.length - 1];
          const view = lastMatch.match(/\[SWITCH_VIEW:(schedule|inventory)\]/)?.[1];
          if (view === 'schedule' || view === 'inventory') {
            console.log('[AI Chat] Switching view to:', view);
            onSwitchView(view);
          }
        }
        
        // Update the last message with accumulated text (remove switch commands for display)
        const displayMessage = assistantMessage.replace(/\[SWITCH_VIEW:(schedule|inventory)\]/g, '');
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: displayMessage
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-mono text-[#808080]">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#808080] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-[#808080] font-mono text-sm">
              <p>Ask me to help with your schedule. I can:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Add blocks to your timeline</li>
                <li>• Add tasks to blocks</li>
                <li>• Rearrange your schedule</li>
                <li>• Suggest optimal time allocations</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`font-mono text-sm ${
                  msg.role === 'user' 
                    ? 'text-white ml-8' 
                    : 'text-[#808080] mr-8'
                }`}
              >
                <span className="text-[#404040]">
                  {msg.role === 'user' ? '>' : '$'}
                </span>{' '}
                {msg.content}
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-[#808080] font-mono text-sm mr-8">
              <span className="text-[#404040]">$</span> thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[#1a1a1a]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your schedule..."
              className="flex-1 bg-transparent border border-[#1a1a1a] rounded px-3 py-2 text-sm font-mono text-white placeholder-[#404040] focus:outline-none focus:border-[#333]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="px-4 py-2 bg-[#1a1a1a] text-[#808080] rounded font-mono text-sm hover:bg-[#222] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}