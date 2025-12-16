import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Target, X } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  content?: string;
}

interface GoalSelectionPopupProps {
  goals: Goal[];
  onSelect: (goalId: string | null) => void;
  onCancel: () => void;
  initialGoalId?: string | null;
}

export default function GoalSelectionPopup({ goals, onSelect, onCancel, initialGoalId = null }: GoalSelectionPopupProps) {
  // Add "None" option at the beginning
  const options = [
    { id: null, name: 'None', content: 'No goal assignment' },
    ...goals
  ];

  // Find the index of the initial goal
  const initialIndex = initialGoalId ? options.findIndex(opt => opt.id === initialGoalId) : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(options[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab can also move through options
        setSelectedIndex(prev => (prev + 1) % options.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel, options]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      {options.map((option, index) => (
        <div
          key={option.id || 'none'}
          className={cn(
            "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
            selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
          )}
          onClick={() => onSelect(option.id)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {option.id === null ? (
            <X className="h-4 w-4 text-gray-500" />
          ) : (
            <Target className="h-4 w-4 text-gray-500" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium">
              {option.name || option.content || 'Unnamed Goal'}
            </div>
            {option.id === null && (
              <div className="text-xs text-gray-500">No goal assignment</div>
            )}
          </div>
        </div>
      ))}

      {/* Bottom hint */}
      <div className="border-t border-gray-200 mt-1 px-3 py-2">
        <div className="text-xs text-gray-400 font-semibold">ESC to cancel</div>
      </div>
    </div>
  );
}