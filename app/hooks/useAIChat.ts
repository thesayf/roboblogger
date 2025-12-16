import { useState, useEffect, useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'ai';
  message: string;
  timestamp?: Date;
}

interface UseAIChatProps {
  getCurrentDayId: () => string | null;
  currentDay: 'today' | 'tomorrow';
  userData: any;
  blocks: any[];
  refreshDayData: () => Promise<void>;
  switchView: (view: string) => void;
  setInventoryRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export function useAIChat({
  getCurrentDayId,
  currentDay,
  userData,
  blocks,
  refreshDayData,
  switchView,
  setInventoryRefreshTrigger
}: UseAIChatProps) {
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [hasLoadedChat, setHasLoadedChat] = useState(false);

  // Save conversation after each message
  const saveConversation = useCallback(async (role: 'user' | 'ai', message: string) => {
    const dayId = getCurrentDayId();
    const userId = userData?._id;
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
  }, [getCurrentDayId, userData, currentDay]);

  // Handle AI chat message
  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', message, timestamp: new Date() }]);
    setChatInput('');
    
    // Save user message
    await saveConversation('user', message);
    
    // Add AI "thinking" message
    setChatHistory(prev => [...prev, { role: 'ai', message: '...', timestamp: new Date() }]);
    
    try {
      console.log('[Client] Sending AI chat request with message:', message);
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...chatHistory.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.message
            })),
            { role: 'user', content: message }
          ],
          context: {
            blocks,
            dayId: getCurrentDayId(),
            userTime: new Date().getHours() // Send user's local hour
          }
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      console.log('[Client] Got response, starting stream processing');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      let chunkCount = 0;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('[Client] Stream done. Total chunks received:', chunkCount);
            console.log('[Client] Final AI response:', aiResponse);
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          
          console.log('[Client] Raw chunk #' + chunkCount + ':', chunk);
          
          // Just append the raw chunk as-is to see what we're getting
          aiResponse += chunk;
          console.log('[Client] Accumulated response so far:', aiResponse);
          
          // Check for view switch commands in the accumulated response
          const viewSwitchMatch = aiResponse.match(/\[SWITCH_VIEW:(schedule|inventory)\]/g);
          if (viewSwitchMatch) {
            const lastMatch = viewSwitchMatch[viewSwitchMatch.length - 1];
            const view = lastMatch.match(/\[SWITCH_VIEW:(schedule|inventory)\]/)?.[1];
            if (view === 'schedule') {
              console.log('[AI Chat] Switching to schedule view');
              switchView('schedule');
              // Refresh schedule data after a delay
              setTimeout(async () => {
                await refreshDayData();
              }, 500);
            } else if (view === 'inventory') {
              console.log('[AI Chat] Switching to inventory view and triggering refresh');
              switchView('you'); // The inventory view is called 'you' in the command system
              // Trigger inventory refresh after a short delay to allow DB operations to complete
              setTimeout(() => {
                setInventoryRefreshTrigger(prev => prev + 1);
              }, 500);
            }
          }
          
          // Remove view switch commands from display
          const displayMessage = aiResponse.replace(/\[SWITCH_VIEW:(schedule|inventory)\]/g, '').trim();
          
          // Update the last AI message with accumulated response (without switch commands)
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { role: 'ai', message: displayMessage };
            return newHistory;
          });
        }
        
        console.log('[Client] Stream processing complete');
        
        // Save AI response to database
        if (aiResponse && aiResponse.trim() !== '') {
          await saveConversation('ai', aiResponse.trim());
        }
      }
      
      // Always refresh data after AI completes its response
      // Wait a bit for the database operations to complete, then refresh
      setTimeout(async () => {
        // Refresh schedule data
        await refreshDayData();
        // Also trigger inventory refresh in case inventory items were modified
        setInventoryRefreshTrigger(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { 
          role: 'ai', 
          message: 'Sorry, I encountered an error. Please try again.' 
        };
        return newHistory;
      });
    }
  }, [chatHistory, blocks, getCurrentDayId, refreshDayData, saveConversation, switchView, setInventoryRefreshTrigger]);
  
  const handleClearChatHistory = useCallback(async () => {
    setChatHistory([]);
    // Also clear from database
    const dayId = getCurrentDayId();
    if (dayId && userData?._id) {
      await fetch(`/api/chat/conversations?dayId=${dayId}&userId=${userData._id}`, {
        method: 'DELETE'
      });
    }
  }, [getCurrentDayId, userData]);

  // Load chat history when chat opens
  useEffect(() => {
    const loadChatHistory = async () => {
      if (showAIChat && !hasLoadedChat) {
        const dayId = getCurrentDayId();
        const userId = userData?._id;
        
        if (dayId && userId) {
          try {
            const response = await fetch(`/api/chat/conversations?dayId=${dayId}&userId=${userId}`);
            if (response.ok) {
              const data = await response.json();
              const formattedChats = data.conversations.map((chat: any) => ({
                role: chat.role,
                message: chat.message,
                timestamp: chat.timestamp
              }));
              setChatHistory(formattedChats);
            }
          } catch (error) {
            console.error('Error loading chat history:', error);
          }
        }
        setHasLoadedChat(true);
      }
    };
    
    loadChatHistory();
  }, [showAIChat, hasLoadedChat, getCurrentDayId, userData]);

  return {
    showAIChat,
    setShowAIChat,
    chatHistory,
    chatInput,
    setChatInput,
    handleSendChatMessage,
    handleClearChatHistory
  };
}