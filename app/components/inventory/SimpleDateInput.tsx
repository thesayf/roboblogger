import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleDateInputProps {
  onSelect: (date: string | null) => void;
  onCancel: () => void;
  initialValue?: string;
}

export default function SimpleDateInput({ onSelect, onCancel, initialValue }: SimpleDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 means input is focused
  const [isInPresetMode, setIsInPresetMode] = useState(false);

  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const nextMonth = new Date(Date.now() + 30 * 86400000);

  const presets = [
    { label: 'No deadline', value: null },
    { label: 'Today', value: today.toISOString().split('T')[0] },
    { label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0] },
    { label: 'Next week', value: nextWeek.toISOString().split('T')[0] },
    { label: 'Next month', value: nextMonth.toISOString().split('T')[0] },
  ];

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      if (initialValue) {
        // Convert initialValue to YYYY-MM-DD format for HTML5 date input
        try {
          const date = new Date(initialValue);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            inputRef.current.value = `${year}-${month}-${day}`;
            console.log('[SimpleDateInput] Set initial value:', `${year}-${month}-${day}`, 'from:', initialValue);
          }
        } catch (e) {
          console.error('[SimpleDateInput] Error parsing initial value:', initialValue, e);
        }
      }
      inputRef.current.focus();
    }
  }, [initialValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'ArrowDown') {
        if (!isInPresetMode) {
          // Move from input to first preset
          e.preventDefault();
          setIsInPresetMode(true);
          setSelectedIndex(0);
          inputRef.current?.blur();
        } else if (selectedIndex < presets.length - 1) {
          // Navigate down through presets
          e.preventDefault();
          setSelectedIndex(prev => prev + 1);
        } else {
          // At the bottom of presets, wrap to input
          e.preventDefault();
          setIsInPresetMode(false);
          setSelectedIndex(-1);
          inputRef.current?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        if (isInPresetMode) {
          if (selectedIndex === 0) {
            // Go back to input
            e.preventDefault();
            setIsInPresetMode(false);
            setSelectedIndex(-1);
            inputRef.current?.focus();
          } else {
            // Navigate up through presets
            e.preventDefault();
            setSelectedIndex(prev => prev - 1);
          }
        } else {
          // At the top (input field), wrap to bottom preset
          e.preventDefault();
          setIsInPresetMode(true);
          setSelectedIndex(presets.length - 1);
          inputRef.current?.blur();
        }
      } else if (e.key === 'Enter' && isInPresetMode) {
        e.preventDefault();
        const selected = presets[selectedIndex];
        onSelect(selected.value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInPresetMode, selectedIndex, presets, onSelect, onCancel]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isInPresetMode) {
      e.preventDefault();
      const value = inputRef.current?.value || '';
      if (value) {
        onSelect(value);
      } else {
        onSelect(null);
      }
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50 w-80">
      <div className="p-3">
        <div className="text-xs text-gray-500 mb-2">Type date • ↓ for presets • Enter to confirm • ESC to cancel</div>
        <input
          ref={inputRef}
          type="date"
          className={cn(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            !isInPresetMode ? "border-blue-500" : "border-gray-300"
          )}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            setIsInPresetMode(false);
            setSelectedIndex(-1);
          }}
        />
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Preset options */}
      <div className="py-1">
        {presets.map((preset, index) => (
          <div
            key={preset.label}
            className={cn(
              "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
              isInPresetMode && selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(preset.value)}
          >
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">{preset.label}</div>
              {preset.value && (
                <div className="text-xs text-gray-500">
                  {new Date(preset.value).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}