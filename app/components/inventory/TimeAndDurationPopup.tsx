import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Timer } from 'lucide-react';

interface TimeAndDurationPopupProps {
  onSelect: (time: string, duration: number) => void;
  onCancel: () => void;
  initialTime?: string;
  initialDuration?: number;
}

export default function TimeAndDurationPopup({ onSelect, onCancel, initialTime = '', initialDuration = 0 }: TimeAndDurationPopupProps) {
  const [timeInput, setTimeInput] = useState(initialTime);
  const [durationInput, setDurationInput] = useState(initialDuration > 0 ? initialDuration.toString() : '');
  const [currentField, setCurrentField] = useState<'time' | 'duration'>('time');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);
  const [isInPresetMode, setIsInPresetMode] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const durationInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { label: 'Morning routine', time: '07:00', duration: 60, shortcut: '1' },
    { label: 'Quick task', time: '09:00', duration: 30, shortcut: '2' },
    { label: 'Lunch break', time: '12:00', duration: 45, shortcut: '3' },
    { label: 'Afternoon focus', time: '14:00', duration: 90, shortcut: '4' },
    { label: 'Evening session', time: '17:00', duration: 60, shortcut: '5' },
    { label: 'Night routine', time: '20:00', duration: 30, shortcut: '6' },
  ];

  useEffect(() => {
    // Focus the time input immediately when component mounts
    if (timeInputRef.current) {
      timeInputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (timeInput && durationInput) {
      const durationValue = parseInt(durationInput) || 30;
      onSelect(timeInput, durationValue);
    }
  };

  const formatTimeInput = (value: string): string => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');

    // Auto-format as HH:MM
    if (digits.length <= 2) {
      return digits;
    } else {
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTimeInput(e.target.value);
    setTimeInput(formatted);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setDurationInput(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'time' | 'duration') => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'time' && timeInput) {
        // Move to duration field
        setCurrentField('duration');
        durationInputRef.current?.focus();
      } else if (field === 'duration' && timeInput && durationInput) {
        handleSubmit();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (field === 'time') {
        setCurrentField('duration');
        durationInputRef.current?.focus();
      } else {
        setCurrentField('time');
        timeInputRef.current?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsInPresetMode(true);
      setSelectedPresetIndex(0);
      // Blur the current input
      if (field === 'time') {
        timeInputRef.current?.blur();
      } else {
        durationInputRef.current?.blur();
      }
    }
    // Removed number key shortcuts from input fields to prevent conflicts when typing numbers
  };

  // Global keyboard handler for preset navigation
  useEffect(() => {
    if (!isInPresetMode) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedPresetIndex(prev => (prev + 1) % presets.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedPresetIndex === 0) {
          // Go back to input fields
          setIsInPresetMode(false);
          setSelectedPresetIndex(-1);
          if (currentField === 'time') {
            timeInputRef.current?.focus();
          } else {
            durationInputRef.current?.focus();
          }
        } else {
          setSelectedPresetIndex(prev => prev - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedPresetIndex >= 0) {
          const preset = presets[selectedPresetIndex];
          onSelect(preset.time, preset.duration);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key >= '1' && e.key <= '6') {
        // Quick preset selection
        const index = parseInt(e.key) - 1;
        if (index < presets.length) {
          e.preventDefault();
          onSelect(presets[index].time, presets[index].duration);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInPresetMode, selectedPresetIndex, currentField, presets, onSelect, onCancel]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50" style={{ backgroundColor: 'white', width: '320px' }}>
      {/* Time and Duration inputs section */}
      <div className="p-4 pb-2">
        <div className="text-xs text-gray-500 mb-3">Enter time and duration for routine</div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start Time</label>
            <input
              ref={timeInputRef}
              type="text"
              value={timeInput}
              onChange={handleTimeChange}
              onKeyDown={(e) => handleKeyDown(e, 'time')}
              placeholder="HH:MM"
              className="text-lg font-mono outline-none bg-transparent w-full border-b border-gray-300 focus:border-blue-500 pb-1"
              autoFocus
              maxLength={5}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Duration (minutes)</label>
            <input
              ref={durationInputRef}
              type="text"
              value={durationInput}
              onChange={handleDurationChange}
              onKeyDown={(e) => handleKeyDown(e, 'duration')}
              placeholder="30"
              className="text-lg font-mono outline-none bg-transparent w-full border-b border-gray-300 focus:border-blue-500 pb-1"
              maxLength={3}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Presets section */}
      <div className="py-1">
        <div className="px-4 py-1">
          <div className="text-xs text-gray-400 font-medium">QUICK PRESETS</div>
        </div>

        {presets.map((preset, index) => (
          <div
            key={preset.label}
            className={cn(
              "px-4 py-2 cursor-pointer transition-colors flex items-center justify-between",
              selectedPresetIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(preset.time, preset.duration)}
            onMouseEnter={() => {
              setIsInPresetMode(true);
              setSelectedPresetIndex(index);
            }}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">{preset.label}</div>
                <div className="text-xs text-gray-500">
                  {preset.time} • {preset.duration}m
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
              {preset.shortcut}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hints */}
      <div className="border-t border-gray-200 px-4 py-2">
        <div className="text-xs text-gray-400">
          Tab between fields • ↓ for presets • 1-6 quick select • Enter to confirm
        </div>
      </div>
    </div>
  );
}