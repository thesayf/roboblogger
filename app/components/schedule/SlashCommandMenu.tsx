import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

interface SlashCommandMenuProps {
  onSelect: (item: MenuItem) => void;
  onCancel: () => void;
}

const menuItems: MenuItem[] = [
  {
    id: 'block',
    label: 'Block',
    description: 'Add a time block (or use /d930, /m14)',
    icon: <Layers className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
  },
  {
    id: 'event',
    label: 'Event',
    description: 'Add an event from inventory',
    icon: (
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 'routine',
    label: 'Routine',
    description: 'Add a routine from inventory',
    icon: (
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  }
];

export default function SlashCommandMenu({ onSelect, onCancel }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(menuItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel]);

  return (
    <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 z-50 w-80">
      {menuItems.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 flex items-start gap-3",
            selectedIndex === index ? "bg-gray-200" : "hover:bg-gray-100"
          )}
          onClick={() => onSelect(item)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {item.icon}
          <div className="flex-1">
            <div className="text-base text-gray-900" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {item.label}
            </div>
            <div className="text-xs font-mono text-gray-500 mt-0.5">
              {item.description}
            </div>
          </div>
        </div>
      ))}

      {/* Quick commands guide */}
      <div className="border-t-2 border-gray-200 px-4 py-3">
        <div className="text-xs font-mono text-gray-400 mb-2">Quick Commands (ESC to close)</div>
        <div className="space-y-1">
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">d930</span> → Deep work at 9:30
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">m14</span> → Meeting at 14:00
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">w630</span> → Workout at 6:30
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">e</span> → Select event from inventory
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">a</span> → Admin block now
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">b1130</span> → Break at 11:30
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono text-gray-600">p17</span> → Personal at 17:00
          </div>
        </div>
      </div>
    </div>
  );
}