'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  type: 'deep-work' | 'meeting' | 'break' | 'admin' | 'personal' | 'event';
  duration: number;
  tasks?: Task[];
}

export default function CalendarDemoPage() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(0);

  // Sample blocks
  const blocks: Block[] = [
    {
      id: '1',
      time: '07:00',
      title: 'Morning Exercise',
      type: 'break',
      duration: 60,
      tasks: [
        { id: 't1', title: 'neeed to be able t', duration: 20, completed: true },
        { id: 't2', title: 'i am ront', duration: 20, completed: false },
        { id: 't3', title: 'lets try this new task feature', duration: 20, completed: false },
      ],
    },
    {
      id: '2',
      time: '09:00',
      title: 'Deep Work',
      type: 'deep-work',
      duration: 120,
      tasks: [
        { id: 't4', title: 'This is the first task', duration: 60, completed: false },
      ],
    },
    {
      id: '3',
      time: '11:00',
      title: 'Team Standup',
      type: 'meeting',
      duration: 30,
      tasks: [],
    },
    {
      id: '4',
      time: '11:30',
      title: 'New block',
      type: 'admin',
      duration: 30,
      tasks: [
        { id: 't6', title: '30 minute cardi', duration: 30, completed: false },
      ],
    },
    {
      id: '5',
      time: '13:00',
      title: 'Client Meeting',
      type: 'meeting',
      duration: 90,
      tasks: [],
    },
    {
      id: '6',
      time: '15:00',
      title: 'Code Review Session',
      type: 'deep-work',
      duration: 90,
      tasks: [],
    },
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedBlockIndex(prev => Math.min(prev + 1, blocks.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedBlockIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks.length]);

  // Build timeline with hour markers and blocks
  const renderTimeline = () => {
    const items: JSX.Element[] = [];
    let currentTimeInMinutes = 6 * 60; // Start at 6 AM
    const endTimeInMinutes = 20 * 60; // End at 8 PM

    blocks.forEach((block, blockIndex) => {
      const [blockHour, blockMin] = block.time.split(':').map(Number);
      const blockStartInMinutes = blockHour * 60 + blockMin;

      // Add hour markers before this block
      while (currentTimeInMinutes < blockStartInMinutes) {
        const hour = Math.floor(currentTimeInMinutes / 60);
        const hourLabel = hour === 12 ? '12 PM' :
                         hour < 12 ? `${hour} AM` :
                         hour > 12 ? `${hour - 12} PM` : '12 PM';

        items.push(
          <div key={`hour-${hour}`} className="border-l-2 border-gray-100 pl-6 py-1" style={{ minHeight: '30px' }}>
            <div className="text-xs text-gray-300 font-mono">{hourLabel}</div>
          </div>
        );

        currentTimeInMinutes += 60; // Move to next hour
      }

      // Add the block
      const isSelected = blockIndex === selectedBlockIndex;
      const blockHeightPx = (block.duration / 60) * 60; // 60px per hour

      items.push(
        <div
          key={block.id}
          className={cn(
            "border-l-2 pl-6 pb-6 cursor-pointer transition-colors",
            isSelected ? "border-gray-900" : "border-gray-200"
          )}
          style={{ minHeight: `${blockHeightPx}px` }}
          onClick={() => setSelectedBlockIndex(blockIndex)}
        >
          {/* Time and duration line */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-mono">
            <span className="text-gray-900 font-medium">
              {block.time}
            </span>
            <span>·</span>
            <span>
              {block.duration}m
            </span>
          </div>

          {/* Block title */}
          <h2 className="text-2xl font-normal text-gray-900 mb-4 font-lora">
            {block.title}
          </h2>

          {/* Tasks collapsed - just show count */}
          {block.tasks && block.tasks.length > 0 && (
            <div className="text-xs text-gray-400 font-mono">
              {block.tasks.filter(t => t.completed).length}/{block.tasks.length} tasks
            </div>
          )}
        </div>
      );

      // Move current time forward by block duration
      currentTimeInMinutes = blockStartInMinutes + block.duration;
    });

    // Add remaining hour markers after last block
    while (currentTimeInMinutes < endTimeInMinutes) {
      const hour = Math.floor(currentTimeInMinutes / 60);
      const hourLabel = hour === 12 ? '12 PM' :
                       hour < 12 ? `${hour} AM` :
                       hour > 12 ? `${hour - 12} PM` : '12 PM';

      items.push(
        <div key={`hour-${hour}`} className="border-l-2 border-gray-100 pl-6 py-1" style={{ minHeight: '30px' }}>
          <div className="text-xs text-gray-300 font-mono">{hourLabel}</div>
        </div>
      );

      currentTimeInMinutes += 60;
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-normal text-gray-900 mb-1 font-lora">
            Sat, Oct 18
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            use ↑↓ to navigate
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {renderTimeline()}
        </div>
      </div>
    </div>
  );
}
