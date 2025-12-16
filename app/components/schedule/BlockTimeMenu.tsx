import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface BlockTimeMenuProps {
  suggestedTime: string;
  blockType: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

export default function BlockTimeMenu({ 
  suggestedTime, 
  blockType,
  onConfirm, 
  onCancel 
}: BlockTimeMenuProps) {
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Parse time input and confirm
        const parsed = parseTimeInput(tempValue);
        if (parsed) {
          onConfirm(parsed);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTempValue(prev => prev.slice(0, -1));
      } else if (/^[0-9apmh:\s]$/i.test(e.key)) {
        e.preventDefault();
        setTempValue(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tempValue, onConfirm, onCancel]);

  // Format the initial time value when component mounts
  useEffect(() => {
    setTempValue(formatTime(suggestedTime));
  }, [suggestedTime]);

  const parseTimeInput = (input: string): string | null => {
    const trimmed = input.trim().toLowerCase();
    
    // Handle "2pm", "2:30pm", etc.
    const timeMatch = trimmed.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3];
      
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
      
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Handle "1430" format
    const fourDigitMatch = trimmed.match(/^(\d{2})(\d{2})$/);
    if (fourDigitMatch) {
      return `${fourDigitMatch[1]}:${fourDigitMatch[2]}`;
    }
    
    return null;
  };

  const formatTime = (timeStr: string): string => {
    const [hour, minute] = timeStr.split(':').map(Number);
    const hourNum = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${hourNum}:${minute.toString().padStart(2, '0')}${ampm}`;
  };

  return (
    <div className="relative bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-80 mx-4">
      <div className="text-sm font-medium text-gray-700 mb-3">
        Configure {blockType} Block
      </div>
      
      {/* Time Field */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-600">Start Time</span>
        </div>
        <div className="px-3 py-2 border border-blue-500 bg-blue-50 rounded font-mono text-sm">
          {tempValue}
          <span className="inline-block w-[2px] h-4 bg-blue-500 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 text-xs text-gray-500">
        Enter Confirm • ESC Cancel
      </div>
    </div>
  );
}