"use client";

import React, { useState } from 'react';
import { Calendar, User, MessageCircle } from 'lucide-react';
import MobileScheduleView from '@/app/components/schedule/MobileScheduleView';
import MobileInventoryView from '@/app/components/inventory/MobileInventoryView';
import MobileChatSheet from '@/app/components/mobile/MobileChatSheet';
import { Block as BlockType } from '@/app/utils/scheduleUtils';

interface Goal {
  id: string;
  name: string;
  isExpanded?: boolean;
  deadline?: string;
  order?: number;
}

interface Project {
  id: string;
  name: string;
  content?: string;
  isExpanded?: boolean;
  deadline?: string;
  goalId?: string;
  tasks?: any[];
}

interface MobileAppViewProps {
  // View state
  viewMode: 'schedule' | 'you';
  onViewChange: (view: 'schedule' | 'you') => void;

  // Schedule view props
  blocks: BlockType[];
  currentDay: 'today' | 'tomorrow';
  currentTime: Date;
  user: any;
  onToggleTask: (blockIndex: number, taskIndex: number) => void;
  onDayChange: (day: 'today' | 'tomorrow') => void;
  onAddBlock: (blockData: Partial<BlockType>, insertAfterIndex?: number) => Promise<number>;
  onAddTask: (blockIndex: number, taskData: { title: string; duration: number }) => Promise<void>;
  onUpdateBlock: (blockIndex: number, blockData: { time?: string; title?: string; type?: string; duration?: number; note?: string }) => Promise<void>;
  onDeleteBlock: (blockIndex: number) => Promise<void>;
  onDeleteTask: (blockIndex: number, taskIndex: number) => Promise<void>;
  onToggleBlockCompletion: (blockIndex: number) => Promise<void>;
  dayId: string | null;

  // Inventory view props
  goalsData?: Goal[];
  projectsData?: Project[];
  eventsData?: any[];
  routinesData?: any[];
  adminTasksData?: any[];
  onProjectsUpdate?: () => void;
  onProjectsChange?: (projects: Project[]) => void;
  onGoalsUpdate?: () => void;
  onGoalsChange?: (goals: Goal[]) => void;
}

export default function MobileAppView({
  viewMode,
  onViewChange,
  blocks,
  currentDay,
  currentTime,
  user,
  onToggleTask,
  onDayChange,
  onAddBlock,
  onAddTask,
  onUpdateBlock,
  onDeleteBlock,
  onDeleteTask,
  onToggleBlockCompletion,
  dayId,
  goalsData = [],
  projectsData = [],
  eventsData = [],
  routinesData = [],
  adminTasksData = [],
  onProjectsUpdate,
  onProjectsChange,
  onGoalsUpdate,
  onGoalsChange
}: MobileAppViewProps) {
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Chat handlers
  const handleSendChatMessage = (message: string) => {
    console.log('Sending chat message:', message);
    setChatHistory([...chatHistory, { role: 'user', message }]);
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { role: 'ai', message: 'I received your message. AI integration coming soon!' }
      ]);
    }, 500);
  };

  const handleClearChatHistory = () => {
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content - Switch between views */}
      <div className="flex-1">
        {viewMode === 'schedule' ? (
          <MobileScheduleView
            blocks={blocks}
            currentDay={currentDay}
            currentTime={currentTime}
            user={user}
            onToggleTask={onToggleTask}
            onDayChange={onDayChange}
            onAddBlock={onAddBlock}
            onAddTask={onAddTask}
            onUpdateBlock={onUpdateBlock}
            onDeleteBlock={onDeleteBlock}
            onDeleteTask={onDeleteTask}
            onToggleBlockCompletion={onToggleBlockCompletion}
            dayId={dayId}
            routinesData={routinesData}
            eventsData={eventsData}
            projectsData={projectsData}
            adminTasksData={adminTasksData}
          />
        ) : (
          <MobileInventoryView
            currentTime={currentTime}
            user={user}
            goalsData={goalsData}
            projectsData={projectsData}
            eventsData={eventsData}
            routinesData={routinesData}
            adminTasksData={adminTasksData}
            onProjectsUpdate={onProjectsUpdate}
            onProjectsChange={onProjectsChange}
            onGoalsUpdate={onGoalsUpdate}
            onGoalsChange={onGoalsChange}
          />
        )}
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => onViewChange('schedule')}
            className={`font-mono text-sm touch-manipulation transition-colors ${
              viewMode === 'schedule' ? 'text-gray-900 underline underline-offset-4' : 'text-gray-500'
            }`}
          >
            Schedule
          </button>

          <button
            onClick={() => onViewChange('you')}
            className={`font-mono text-sm touch-manipulation transition-colors ${
              viewMode === 'you' ? 'text-gray-900 underline underline-offset-4' : 'text-gray-500'
            }`}
          >
            Inventory
          </button>

          <button
            onClick={() => setShowChat(true)}
            className="font-mono text-sm touch-manipulation transition-colors text-gray-500 hover:text-gray-900"
          >
            Chat
          </button>
        </div>
      </div>

      {/* Mobile Chat Sheet */}
      <MobileChatSheet
        isOpen={showChat}
        chatHistory={chatHistory}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendChatMessage}
        onClose={() => setShowChat(false)}
        onClearHistory={handleClearChatHistory}
      />
    </div>
  );
}
