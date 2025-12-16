import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  getCurrentDayId: () => string | null;
  currentDay: 'today' | 'tomorrow';
  blocks: any[];
  setBlocks: (blocks: any[]) => void;
  onInventoryRefresh: () => void;
}

export default function AIChat({
  isOpen,
  onClose,
  userId,
  getCurrentDayId,
  currentDay,
  blocks,
  setBlocks,
  onInventoryRefresh
}: AIChatProps) {
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp?: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [hasLoadedChat, setHasLoadedChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Save conversation after each message
  const saveConversation = useCallback(async (role: 'user' | 'ai', message: string) => {
    const dayId = getCurrentDayId();
    const date = currentDay === 'today' 
      ? new Date().toISOString().split('T')[0]
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dayId && userId && message !== '...') { // Don't save loading messages
      try {
        await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            dayId,
            date,
            conversations: [{
              role,
              message,
              timestamp: new Date()
            }]
          })
        });
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }
  }, [getCurrentDayId, currentDay, userId]);

  // Handle AI chat message
  const handleSendChatMessage = useCallback(async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage, timestamp: new Date() }]);
    
    // Save user message
    await saveConversation('user', userMessage);
    
    // Add loading indicator
    setChatHistory(prev => [...prev, { role: 'ai', message: '...', timestamp: new Date() }]);
    setIsProcessing(true);
    
    try {
      const dayId = getCurrentDayId();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          userId,
          dayId,
          blocks,
          conversationHistory: chatHistory.filter(m => m.message !== '...')
        })
      });
      
      if (!response.ok) throw new Error('Failed to get AI response');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      let lastUpdate = Date.now();
      const UPDATE_INTERVAL = 100; // Update UI every 100ms
      
      // Remove loading indicator and prepare for streaming
      setChatHistory(prev => prev.filter(m => m.message !== '...'));
      setChatHistory(prev => [...prev, { role: 'ai', message: '', timestamp: new Date() }]);
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle different message types
              if (parsed.type === 'message') {
                aiResponse += parsed.content;
                
                // Batch UI updates for performance
                const now = Date.now();
                if (now - lastUpdate > UPDATE_INTERVAL || parsed.content.includes('\n')) {
                  setChatHistory(prev => {
                    const newHistory = [...prev];
                    if (newHistory[newHistory.length - 1]?.role === 'ai') {
                      newHistory[newHistory.length - 1].message = aiResponse;
                    }
                    return newHistory;
                  });
                  lastUpdate = now;
                }
              } else if (parsed.type === 'tool_use') {
                // Show tool usage feedback
                const toolMessage = parsed.tool === 'schedule_navigation' 
                  ? `Navigating to ${parsed.params?.view || 'schedule'}...`
                  : parsed.tool === 'inventory_navigation'
                  ? `Opening inventory view...`
                  : parsed.tool === 'create_item'
                  ? `Creating ${parsed.params?.type}...`
                  : parsed.tool === 'update_item'
                  ? `Updating ${parsed.params?.type}...`
                  : parsed.tool === 'delete_item'
                  ? `Deleting ${parsed.params?.type}...`
                  : `Using ${parsed.tool}...`;
                
                // Add acknowledgment message before the response
                if (!aiResponse) {
                  setChatHistory(prev => [...prev, { 
                    role: 'ai', 
                    message: toolMessage, 
                    timestamp: new Date() 
                  }]);
                }
              } else if (parsed.type === 'tool_result') {
                // Handle tool results
                if (parsed.success) {
                  // Tool executed successfully
                  if (parsed.tool === 'create_block') {
                    const updatedBlocks = [...blocks];
                    if (parsed.data?.block) {
                      updatedBlocks.push(parsed.data.block);
                      setBlocks(updatedBlocks);
                    }
                  } else if (parsed.tool === 'inventory_navigation' || 
                           parsed.tool === 'schedule_navigation' ||
                           parsed.tool?.includes('_item')) {
                    // Trigger inventory refresh for CRUD operations
                    onInventoryRefresh();
                  }
                }
              } else if (parsed.type === 'error') {
                aiResponse += `\n\nError: ${parsed.message}`;
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  if (newHistory[newHistory.length - 1]?.role === 'ai') {
                    newHistory[newHistory.length - 1].message = aiResponse;
                  }
                  return newHistory;
                });
              }
            } catch (e) {
              // Skip invalid JSON chunks
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
      
      // Final update to ensure complete message is shown
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[newHistory.length - 1]?.role === 'ai') {
          newHistory[newHistory.length - 1].message = aiResponse;
        }
        return newHistory;
      });
      
      // Save AI response
      await saveConversation('ai', aiResponse);
      
    } catch (error) {
      console.error('Error sending chat message:', error);
      setChatHistory(prev => prev.filter(m => m.message !== '...'));
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, chatHistory, getCurrentDayId, userId, blocks, setBlocks, saveConversation, onInventoryRefresh]);

  // Load chat history when chat opens
  useEffect(() => {
    const loadChatHistory = async () => {
      if (isOpen && !hasLoadedChat && userId) {
        const dayId = getCurrentDayId();
        const date = currentDay === 'today' 
          ? new Date().toISOString().split('T')[0]
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        if (dayId) {
          try {
            const response = await fetch(`/api/chat/conversations?userId=${userId}&dayId=${dayId}&date=${date}`);
            if (response.ok) {
              const data = await response.json();
              if (data.conversations && data.conversations.length > 0) {
                setChatHistory(data.conversations.map((conv: any) => ({
                  role: conv.role,
                  message: conv.message,
                  timestamp: new Date(conv.timestamp)
                })));
              }
            }
          } catch (error) {
            console.error('Error loading chat history:', error);
          }
        }
        setHasLoadedChat(true);
      }
    };
    
    loadChatHistory();
  }, [isOpen, hasLoadedChat, userId, getCurrentDayId, currentDay]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white border-2 border-gray-200 rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">AI Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatHistory.length === 0 ? (
            <div className="text-sm text-gray-500">
              Ask me anything about your schedule or tasks...
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.role === 'user' 
                    ? 'text-right' 
                    : 'text-left'
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.message}
                  </div>
                  {msg.timestamp && (
                    <div className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChatMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendChatMessage}
            disabled={!chatInput.trim() || isProcessing}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}