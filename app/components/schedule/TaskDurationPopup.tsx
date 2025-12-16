import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TaskDurationPopupProps {
  taskName: string;
  onConfirm: (duration: number) => void;
  onCancel: () => void;
}

const quickOptions = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '1h', value: 60 },
  { label: '90m', value: 90 },
];

export default function TaskDurationPopup({ taskName, onConfirm, onCancel }: TaskDurationPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to 30m

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm(quickOptions[selectedIndex].value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(quickOptions.length - 1, prev + 1));
      } else if (e.key >= '1' && e.key <= '5') {
        // Quick select with number keys
        const index = parseInt(e.key) - 1;
        if (index < quickOptions.length) {
          e.preventDefault();
          onConfirm(quickOptions[index].value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onConfirm, onCancel]);

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 w-72 z-[100]">
      <div className="text-xs text-gray-500 mb-3 truncate">
        Duration for: {taskName}
      </div>
      
      <div className="flex gap-2">
        {quickOptions.map((option, index) => (
          <button
            key={option.label}
            onClick={() => onConfirm(option.value)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              "flex-1 py-2 px-2 text-sm border rounded transition-colors",
              selectedIndex === index 
                ? "bg-gray-100 border-gray-300 font-medium" 
                : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <div className="text-xs text-gray-400 mb-0.5">{index + 1}</div>
            <div>{option.label}</div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        1-5 Quick select • ← → Navigate • Enter Select • ESC Cancel
      </div>
    </div>
  );
}