import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Folder, Archive } from 'lucide-react';

interface TaskOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

interface TaskCommandMenuProps {
  onSelect: (option: TaskOption) => void;
  onCancel: () => void;
}

const taskOptions: TaskOption[] = [
  {
    id: 'new-task',
    label: 'New Task',
    icon: Plus,
    description: 'Add a task to this block'
  },
  {
    id: 'project-task',
    label: 'Project Task',
    icon: Folder,
    description: 'Add from project backlog'
  },
  {
    id: 'backlog',
    label: 'Backlog Task',
    icon: Archive,
    description: 'Add from general backlog'
  }
];

export default function TaskCommandMenu({ onSelect, onCancel }: TaskCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % taskOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + taskOptions.length) % taskOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(taskOptions[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key >= '1' && e.key <= '3') {
        // Quick select with number keys
        const index = parseInt(e.key) - 1;
        if (index < taskOptions.length) {
          e.preventDefault();
          onSelect(taskOptions[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel]);

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg py-1 w-64 z-[100]">
      {taskOptions.map((option, index) => {
        const Icon = option.icon;
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
              selectedIndex === index ? "bg-gray-50" : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(option)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="text-gray-400 text-xs font-mono w-4">
              {index + 1}
            </span>
            <Icon className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="text-sm">{option.label}</div>
              {option.description && (
                <div className="text-xs text-gray-400">{option.description}</div>
              )}
            </div>
          </div>
        );
      })}
      <div className="border-t border-gray-100 px-3 py-1 text-xs text-gray-400 mt-1">
        ↑↓ Navigate • Enter Select • 1-3 Quick • ESC Cancel
      </div>
    </div>
  );
}