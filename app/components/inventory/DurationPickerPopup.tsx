'use client';

import React, { useState, useEffect } from 'react';

interface DurationPickerPopupProps {
  onSelect: (duration: number | null) => void;
  onCancel: () => void;
  initialDuration?: number;
}

export default function DurationPickerPopup({ onSelect, onCancel, initialDuration = 30 }: DurationPickerPopupProps) {
  const [durationInput, setDurationInput] = useState(initialDuration.toString());
  const [selectedOption, setSelectedOption] = useState<number>(initialDuration);

  const commonDurations = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const duration = parseInt(durationInput);
        if (!isNaN(duration) && duration > 0) {
          onSelect(duration);
        } else {
          onSelect(30); // Default to 30 minutes
        }
      } else if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setDurationInput(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setDurationInput(prev => prev.slice(0, -1) || '0');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = commonDurations.findIndex(d => d.value === selectedOption);
        if (e.key === 'ArrowDown' && currentIndex < commonDurations.length - 1) {
          const newDuration = commonDurations[currentIndex + 1];
          setSelectedOption(newDuration.value);
          setDurationInput(newDuration.value.toString());
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          const newDuration = commonDurations[currentIndex - 1];
          setSelectedOption(newDuration.value);
          setDurationInput(newDuration.value.toString());
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab is disabled - duration is required
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [durationInput, selectedOption, onSelect, onCancel]);

  return (
    <div className="absolute z-50 top-full mt-2 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 font-mono">
      <div className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
        Task Duration
      </div>

      <div className="space-y-2">
        {/* Custom input */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
          <span className="text-sm text-gray-700">{durationInput}</span>
          <span className="text-xs text-gray-500">minutes</span>
          <span className="animate-pulse text-gray-400">_</span>
        </div>

        {/* Quick select options */}
        <div className="grid grid-cols-3 gap-1 mt-3">
          {commonDurations.map(duration => (
            <button
              key={duration.value}
              className={`px-2 py-1 text-xs rounded ${
                selectedOption === duration.value
                  ? 'bg-gray-200 text-gray-900 ring-1 ring-gray-400'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onMouseEnter={() => {
                setSelectedOption(duration.value);
                setDurationInput(duration.value.toString());
              }}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <span className="text-gray-600">Enter</span> to confirm •
          <span className="text-gray-600"> Esc</span> to cancel
        </div>
      </div>
    </div>
  );
}