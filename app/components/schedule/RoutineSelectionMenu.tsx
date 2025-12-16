import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Repeat } from 'lucide-react';

interface Routine {
  _id: string;
  name: string;
  description?: string;
  days?: string[];
  earliestStartTime?: string;
  latestEndTime?: string;
  startDate?: string;
  endDate?: string;
  tasks?: any[];
}

interface RoutineSelectionMenuProps {
  routines: Routine[];
  onSelect: (routine: Routine) => void;
  onCancel: () => void;
}

export default function RoutineSelectionMenu({ routines, onSelect, onCancel }: RoutineSelectionMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Show all routines (don't filter by day)
  console.log('[RoutineSelectionMenu] All routines:', routines);

  const displayRoutines = routines;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, displayRoutines.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, displayRoutines.length)) % Math.max(1, displayRoutines.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayRoutines.length > 0) {
          onSelect(displayRoutines[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayRoutines, onSelect, onCancel]);

  if (displayRoutines.length === 0) {
    return (
      <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-3 px-4 z-50 w-72" style={{ backgroundColor: 'white' }}>
        <div className="text-sm text-gray-500">No routines available</div>
        <div className="text-xs text-gray-400 mt-1">Press Esc to go back</div>
      </div>
    );
  }

  return (
    <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select Routine</div>
      </div>
      {displayRoutines.map((routine, index) => {
        // Handle both direct properties and metadata nested properties
        const name = routine.name || routine.content || "Unnamed routine";
        const description = routine.description || routine.metadata?.description;
        const earliestStartTime = routine.earliestStartTime || routine.metadata?.earliestStartTime;
        const latestEndTime = routine.latestEndTime || routine.metadata?.latestEndTime;
        const days = routine.days || routine.metadata?.days || [];
        const taskCount = routine.tasks?.length || 0;
        
        return (
          <div
            key={routine._id || routine.id}
            className={cn(
              "flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors",
              selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(displayRoutines[index])}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Repeat className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">{name}</div>
              {description && (
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {earliestStartTime && latestEndTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{earliestStartTime} - {latestEndTime}</span>
                  </div>
                )}
                {taskCount > 0 && (
                  <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                )}
                {days.length > 0 && (
                  <span className="text-blue-600">{days.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}