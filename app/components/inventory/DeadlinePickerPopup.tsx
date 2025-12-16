import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface DeadlinePickerPopupProps {
  onSelect: (date: string | null) => void;
  onCancel: () => void;
  initialDate?: string;
}

export default function DeadlinePickerPopup({ onSelect, onCancel, initialDate }: DeadlinePickerPopupProps) {
  console.log('[DeadlinePopup] Component rendering');
  const [dateInput, setDateInput] = useState(initialDate || '');
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const nextMonth = new Date(Date.now() + 30 * 86400000);

  const [quickOptions] = useState([
    { label: 'No deadline', value: null, shortcut: '0' },
    { label: 'Today', value: today.toISOString().split('T')[0], shortcut: 't' },
    { label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0], shortcut: 'm' },
    { label: 'Next week', value: nextWeek.toISOString().split('T')[0], shortcut: 'w' },
    { label: 'Next month', value: nextMonth.toISOString().split('T')[0], shortcut: 'n' },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(-1); // Start with no selection
  const [isTypingDate, setIsTypingDate] = useState(true); // Start in typing mode

  useEffect(() => {
    console.log('[DeadlinePopup] useEffect running, attaching event listener. isTypingDate:', isTypingDate, 'dateInput:', dateInput);

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[DeadlinePopup] Key pressed:', e.key, 'isTypingDate:', isTypingDate, 'dateInput:', dateInput);

      // If typing a custom date
      if (isTypingDate) {
        console.log('[DeadlinePopup] In typing mode, handling key:', e.key);
        if (e.key === 'Enter') {
          e.preventDefault();
          // Validate and format date
          const formattedDate = formatDateInput(dateInput);
          onSelect(formattedDate);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsTypingDate(false);
          setDateInput('');
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setDateInput(prev => prev.slice(0, -1));
        } else if (e.key === 'Tab') {
          e.preventDefault();
          setIsTypingDate(false);
          setSelectedIndex(0);
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          // Accept ANY single character when typing
          e.preventDefault();
          if (/^[0-9/\-]$/.test(e.key)) {
            setDateInput(prev => {
              // Auto-format as user types
              let newInput = prev + e.key;

              // Auto-insert slashes for MM/DD/YYYY format
              if (prev.length === 2 && !prev.includes('/')) {
                newInput = prev + '/' + e.key;
              } else if (prev.length === 5 && prev.split('/').length === 2) {
                newInput = prev + '/' + e.key;
              }

              return newInput;
            });
          } else {
            // For non-numeric characters, just append
            setDateInput(prev => prev + e.key);
          }
        }
        return;
      }

      // Handle shortcuts for quick options when not typing
      if (!isTypingDate) {
        const shortcutOption = quickOptions.find(opt => opt.shortcut === e.key.toLowerCase());
        if (shortcutOption) {
          e.preventDefault();
          onSelect(shortcutOption.value);
          return;
        }

        // Otherwise, start typing mode with any character
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setIsTypingDate(true);
          setDateInput(e.key);
          setSelectedIndex(-1);
          return;
        }
      }

      // Navigation for quick options
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isTypingDate) {
          // Leave typing mode and select first option
          setIsTypingDate(false);
          setSelectedIndex(0);
        } else {
          setSelectedIndex(prev => (prev + 1) % quickOptions.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex === 0) {
          // Go back to typing mode
          setIsTypingDate(true);
          setSelectedIndex(-1);
        } else {
          setSelectedIndex(prev => (prev - 1 + quickOptions.length) % quickOptions.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isTypingDate) {
          // Already handled in typing mode above
          return;
        }
        const selectedOption = quickOptions[selectedIndex];
        onSelect(selectedOption.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (!isTypingDate) {
          setIsTypingDate(true);
          setSelectedIndex(-1);
        } else {
          setIsTypingDate(false);
          setSelectedIndex(0);
        }
      }
    };

    console.log('[DeadlinePopup] Adding event listener');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('[DeadlinePopup] Removing event listener');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSelect, onCancel, quickOptions, isTypingDate, dateInput, selectedIndex]);

  const formatDateInput = (input: string): string | null => {
    if (!input) return null;

    // Try to parse different date formats
    const patterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        let year, month, day;

        if (pattern === patterns[2]) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // MM/DD/YYYY or MM-DD-YYYY format
          [, month, day, year] = match;
        }

        // Validate date
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (date.getDate() === parseInt(day) &&
            date.getMonth() === parseInt(month) - 1 &&
            date.getFullYear() === parseInt(year)) {
          return date.toISOString().split('T')[0];
        }
      }
    }

    return null;
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      {/* Custom date input section - moved to top */}
      <div className={cn(
        "px-3 py-2 mb-1",
        isTypingDate ? "bg-gray-50" : ""
      )}>
        <div className="text-xs text-gray-400 font-semibold mb-1">
          Type date (MM/DD/YYYY) • ↓ for options • ESC to cancel
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              <span className={dateInput ? '' : 'text-gray-400'}>
                {dateInput || 'MM/DD/YYYY'}
              </span>
              <span className="inline-block w-[2px] h-4 bg-blue-500 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
            </div>
            <div className="text-xs text-gray-500">Press Enter to confirm • ESC to cancel</div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {quickOptions.map((option, index) => (
        <div
          key={option.label}
          className={cn(
            "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
            selectedIndex === index && !isTypingDate ? "bg-gray-100" : "hover:bg-gray-50"
          )}
          onClick={() => onSelect(option.value)}
          onMouseEnter={() => {
            setSelectedIndex(index);
            setIsTypingDate(false);
            setDateInput('');
          }}
        >
          <Calendar className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="text-sm font-medium">{option.label}</div>
            {option.value && (
              <div className="text-xs text-gray-500">
                {new Date(option.value).toLocaleDateString('en-US', {
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
  );
}