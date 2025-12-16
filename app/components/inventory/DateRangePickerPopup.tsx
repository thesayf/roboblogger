import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DateRangePickerPopupProps {
  onSelect: (startDate: string, endDate: string) => void;
  onCancel: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function DateRangePickerPopup({ onSelect, onCancel, initialStartDate = '', initialEndDate = '' }: DateRangePickerPopupProps) {
  const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(initialEndDate ? new Date(initialEndDate).toISOString().split('T')[0] : '');
  const [currentField, setCurrentField] = useState<'start' | 'end'>('start');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(-1);
  const [isInPresetMode, setIsInPresetMode] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const presets = [
    {
      label: 'Next 7 days',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shortcut: '1'
    },
    {
      label: 'Next 2 weeks',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      shortcut: '2'
    },
    {
      label: 'Next month',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      shortcut: '3'
    },
    {
      label: '3 months',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      shortcut: '4'
    },
    {
      label: '6 months',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      shortcut: '5'
    },
    {
      label: '1 year',
      startDate: today.toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      shortcut: '6'
    },
  ];

  useEffect(() => {
    // Focus the start input immediately when component mounts
    if (startInputRef.current) {
      startInputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (startDate && endDate) {
      // Parse dates and send them
      const start = parseDate(startDate);
      const end = parseDate(endDate);

      if (start && end) {
        onSelect(start, end);
      }
    }
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Try to parse DD/MM/YYYY or D/M/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      // Validate month, day, and year are numbers and in valid ranges
      if (!isNaN(month) && !isNaN(day) && !isNaN(year) &&
          month >= 1 && month <= 12 &&
          day >= 1 && day <= 31 &&
          year >= 1900 && year <= 2100) {
        // Additional validation: check if date actually exists
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year &&
            testDate.getMonth() === month - 1 &&
            testDate.getDate() === day) {
          // Return in ISO format YYYY-MM-DD
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // Also try to parse if it looks like a complete date even without slashes
    // e.g., "25122024" -> "25/12/2024"
    if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
      const day = parseInt(dateStr.substring(0, 2));
      const month = parseInt(dateStr.substring(2, 4));
      const year = parseInt(dateStr.substring(4, 8));

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year &&
            testDate.getMonth() === month - 1 &&
            testDate.getDate() === day) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    return null;
  };

  const formatDateInput = (value: string): string => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');

    // Auto-format as DD/MM/YYYY
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setStartDate(formatted);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setEndDate(formatted);
  };

  const formatDisplayDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'start' | 'end') => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'start' && startDate) {
        // Move to end date field
        setCurrentField('end');
        endInputRef.current?.focus();
      } else if (field === 'end') {
        // Try to submit if both dates are filled (even if not perfectly formatted)
        if (startDate.length >= 8 && endDate.length >= 8) {
          handleSubmit();
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (field === 'start') {
        setCurrentField('end');
        endInputRef.current?.focus();
      } else {
        setCurrentField('start');
        startInputRef.current?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsInPresetMode(true);
      setSelectedPresetIndex(0);
      // Blur the current input
      if (field === 'start') {
        startInputRef.current?.blur();
      } else {
        endInputRef.current?.blur();
      }
    }
    // Removed number key shortcuts from input fields to prevent conflicts
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
          if (currentField === 'start') {
            startInputRef.current?.focus();
          } else {
            endInputRef.current?.focus();
          }
        } else {
          setSelectedPresetIndex(prev => prev - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedPresetIndex >= 0) {
          const preset = presets[selectedPresetIndex];
          onSelect(preset.startDate, preset.endDate);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key >= '1' && e.key <= '6') {
        // Quick preset selection
        const index = parseInt(e.key) - 1;
        if (index < presets.length) {
          e.preventDefault();
          onSelect(presets[index].startDate, presets[index].endDate);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isInPresetMode, selectedPresetIndex, currentField, presets, onSelect, onCancel]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50" style={{ backgroundColor: 'white', width: '320px' }}>
      {/* Date inputs section */}
      <div className="p-4 pb-2">
        <div className="text-xs text-gray-500 mb-3">Enter date range for routine</div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Start Date</label>
            <input
              ref={startInputRef}
              type="text"
              value={startDate}
              onChange={handleStartDateChange}
              onKeyDown={(e) => handleKeyDown(e, 'start')}
              placeholder="DD/MM/YYYY"
              className="text-lg font-mono outline-none bg-transparent w-full border-b border-gray-300 focus:border-blue-500 pb-1"
              autoFocus
              maxLength={10}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">End Date</label>
            <input
              ref={endInputRef}
              type="text"
              value={endDate}
              onChange={handleEndDateChange}
              onKeyDown={(e) => handleKeyDown(e, 'end')}
              placeholder="DD/MM/YYYY"
              className="text-lg font-mono outline-none bg-transparent w-full border-b border-gray-300 focus:border-blue-500 pb-1"
              maxLength={10}
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
            onClick={() => {
              // Only select on deliberate click, not accidental
              if (preset.startDate && preset.endDate) {
                onSelect(preset.startDate, preset.endDate);
              }
            }}
            onMouseEnter={() => {
              setIsInPresetMode(true);
              setSelectedPresetIndex(index);
            }}
          >
            <div className="flex-1">
              <div className="text-sm font-medium">{preset.label}</div>
              <div className="text-xs text-gray-500">
                {formatDisplayDate(preset.startDate)} - {formatDisplayDate(preset.endDate)}
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
          {startDate && endDate && startDate.length >= 8 && endDate.length >= 8 ? (
            <span className="text-green-600 font-medium">Press Enter to continue →</span>
          ) : (
            <span>↓ for presets • 1-6 quick select • Enter when complete</span>
          )}
        </div>
      </div>
    </div>
  );
}