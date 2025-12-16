import React from 'react';

interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface Block {
  id: string;
  time: string;
  title: string;
  type: 'deep-work' | 'meeting' | 'break' | 'admin';
  duration: number;
  tasks?: Task[];
  energy?: 'high' | 'medium' | 'low';
}

interface FocusViewProps {
  currentBlock?: Block;
  nextBlock?: Block;
  currentTaskIndex?: number;
  onStartTimer: () => void;
  onSkip: () => void;
}

export default function FocusView({
  currentBlock,
  nextBlock,
  currentTaskIndex = 0,
  onStartTimer,
  onSkip,
}: FocusViewProps) {
  const currentTask = currentBlock?.tasks?.[currentTaskIndex];
  
  return (
    <div className="flex items-center justify-center h-full py-32">
      <div className="text-center">
        <div className="text-6xl font-bold mb-4">
          {currentTask?.title || currentBlock?.title || 'No active block'}
        </div>
        <div className="text-2xl text-gray-500 mb-8">
          {currentTask?.duration || currentBlock?.duration || 0} minutes
        </div>
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={onStartTimer}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Start Timer
          </button>
          <button 
            onClick={onSkip}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Skip
          </button>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          Next: {nextBlock?.title || 'Nothing'}
        </div>
      </div>
    </div>
  );
}