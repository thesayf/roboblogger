import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Hourglass, ClipboardList, Coffee, Home, Dumbbell } from 'lucide-react';

interface BlockType {
  id: string;
  label: string;
  icon: React.ElementType;
  duration: number; // in minutes
  type: 'deep-work' | 'admin' | 'break' | 'personal' | 'meeting';
}

interface BlockTypeMenuProps {
  onSelect: (blockType: BlockType) => void;
  onCancel: () => void;
}

const blockTypes: BlockType[] = [
  {
    id: 'deep',
    label: 'Deep Work',
    icon: Hourglass,
    duration: 90,
    type: 'deep-work'
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ClipboardList,
    duration: 45,
    type: 'admin'
  },
  {
    id: 'break',
    label: 'Break',
    icon: Coffee,
    duration: 15,
    type: 'break'
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: Home,
    duration: 60,
    type: 'meeting' // Using meeting type for personal blocks
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell,
    duration: 45,
    type: 'personal' // Using personal type for workout
  }
];

export default function BlockTypeMenu({ onSelect, onCancel }: BlockTypeMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % blockTypes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + blockTypes.length) % blockTypes.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(blockTypes[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key >= '1' && e.key <= '5') {
        // Quick select with number keys
        const index = parseInt(e.key) - 1;
        if (index < blockTypes.length) {
          e.preventDefault();
          onSelect(blockTypes[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel]);

  return (
    <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 z-50 w-80">
      {blockTypes.map((blockType, index) => {
        const Icon = blockType.icon;
        return (
          <div
            key={blockType.id}
            className={cn(
              "px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100",
              selectedIndex === index ? "bg-gray-200" : "hover:bg-gray-100"
            )}
            onClick={() => onSelect(blockType)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-base text-gray-900 flex-1" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {blockType.label}
            </span>
            <span className="text-xs font-mono text-gray-500">
              {blockType.duration}m
            </span>
          </div>
        );
      })}
      <div className="border-t-2 border-gray-200 px-4 py-2">
        <span className="text-xs font-mono text-gray-400">
          ↑↓ Navigate • 1-5 Quick • Enter Select • ESC Cancel
        </span>
      </div>
    </div>
  );
}