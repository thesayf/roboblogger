import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeRangePopupProps {
  onSelect: (startTime: string, endTime: string) => void;
  onCancel: () => void;
  initialStartTime?: string;
  initialEndTime?: string;
}

export default function TimeRangePopup({ onSelect, onCancel, initialStartTime = '', initialEndTime = '' }: TimeRangePopupProps) {
  // Calculate initial duration from start and end times if provided
  const calculateInitialDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const [startTime, setStartTime] = useState(initialStartTime);
  const [duration, setDuration] = useState(calculateInitialDuration(initialStartTime, initialEndTime)); // in minutes
  const [focusField, setFocusField] = useState<'start' | 'duration'>('start');

  // Calculate end time based on start time and duration
  const calculateEndTime = (start: string, durationMinutes: number): string => {
    if (!start || durationMinutes === 0) return '--:--';
    const [hours, minutes] = start.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + durationMinutes;

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // Start time input
      if (focusField === 'start') {
        if (e.key === 'Tab') {
          e.preventDefault();
          setFocusField('duration');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (startTime && duration > 0) {
            const endTime = calculateEndTime(startTime, duration);
            onSelect(startTime, endTime);
          } else if (startTime) {
            setFocusField('duration');
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setStartTime(startTime.slice(0, -1));
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (/[\d:]/.test(e.key)) {
            let newInput = startTime + e.key;
            // Auto-add colon after HH
            if (startTime.length === 2 && /\d/.test(e.key) && !startTime.includes(':')) {
              newInput = startTime + ':' + e.key;
            }
            // Limit to 5 characters (HH:MM)
            if (newInput.replace(/:/g, '').length <= 4) {
              setStartTime(newInput);
            }
          }
        }
        return;
      }

      // Duration input
      if (focusField === 'duration') {
        if (e.key === 'Tab') {
          e.preventDefault();
          if (e.shiftKey) {
            setFocusField('start');
          } else {
            setFocusField('start');
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (startTime && duration > 0) {
            const endTime = calculateEndTime(startTime, duration);
            onSelect(startTime, endTime);
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setDuration(Math.floor(duration / 10));
        } else if (e.key >= '0' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          const newDuration = duration * 10 + parseInt(e.key);
          if (newDuration <= 1440) { // Max 24 hours
            setDuration(newDuration);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTime, duration, focusField, onSelect, onCancel]);

  // Calculate and display end time
  const endTime = calculateEndTime(startTime, duration);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-80" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Set Event Time</h3>
      </div>

      {/* Start Time Input */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 font-medium mb-2 block">START TIME</label>
        <div className={cn(
          "flex items-center gap-2 px-3 py-3 border-2 rounded-md transition-colors cursor-pointer",
          focusField === 'start' ? "border-blue-400 bg-blue-50" : "border-gray-200"
        )}
        onClick={() => setFocusField('start')}>
          <Clock className="h-4 w-4 text-gray-500" />
          {focusField === 'start' && (
            <span className="inline-block w-[2px] h-4 bg-blue-400 animate-[blink_1s_ease-in-out_infinite] mr-1" />
          )}
          <div className="flex-1 text-sm font-mono">
            {startTime || <span className="text-gray-400">HH:MM</span>}
          </div>
        </div>
      </div>

      {/* Duration Input */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 font-medium mb-2 block">DURATION (minutes)</label>
        <div className={cn(
          "flex items-center gap-2 px-3 py-3 border-2 rounded-md transition-colors cursor-pointer",
          focusField === 'duration' ? "border-blue-400 bg-blue-50" : "border-gray-200"
        )}
        onClick={() => setFocusField('duration')}>
          <Clock className="h-4 w-4 text-gray-500" />
          {focusField === 'duration' && (
            <span className="inline-block w-[2px] h-4 bg-blue-400 animate-[blink_1s_ease-in-out_infinite] mr-1" />
          )}
          <div className="flex-1 text-sm font-mono">
            {duration > 0 ? duration : <span className="text-gray-400">Type minutes</span>}
          </div>
        </div>
      </div>

      {/* Calculated End Time Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">End time:</span>
          <span className="font-mono font-medium text-gray-900">{endTime}</span>
        </div>
      </div>

      {/* Hints */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Tab to switch fields • Enter to confirm</div>
          <div>ESC to cancel</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
