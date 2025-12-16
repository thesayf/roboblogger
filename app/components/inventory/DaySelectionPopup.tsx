import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Check, ChevronRight } from 'lucide-react';

interface DaySelectionPopupProps {
  onSelect: (days: string[]) => void;
  onCancel: () => void;
  initialDays?: string[];
}

const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' }
];

type MenuItem =
  | { type: 'day'; day: typeof DAYS[0] }
  | { type: 'preset'; label: string; action: 'weekdays' | 'weekend' | 'all' | 'clear' }
  | { type: 'divider' }
  | { type: 'continue' };

export default function DaySelectionPopup({ onSelect, onCancel, initialDays = [] }: DaySelectionPopupProps) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(initialDays));
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Build menu items dynamically
  const menuItems: MenuItem[] = [
    // Days
    ...DAYS.map(day => ({ type: 'day', day } as MenuItem)),
    { type: 'divider' },
    // Presets
    { type: 'preset', label: 'Select All Days', action: 'all' as const },
    { type: 'preset', label: 'Weekdays Only', action: 'weekdays' as const },
    { type: 'preset', label: 'Weekend Only', action: 'weekend' as const },
    { type: 'preset', label: 'Clear Selection', action: 'clear' as const },
    ...(selectedDays.size > 0 ? [
      { type: 'divider' } as MenuItem,
      { type: 'continue' } as MenuItem
    ] : [])
  ];

  // Filter out dividers for navigation
  const navigableItems = menuItems.filter(item => item.type !== 'divider');
  const actualFocusedIndex = Math.min(focusedIndex, navigableItems.length - 1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const filtered = menuItems.filter(item => item.type !== 'divider');
          return (prev + 1) % filtered.length;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const filtered = menuItems.filter(item => item.type !== 'divider');
          return (prev - 1 + filtered.length) % filtered.length;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentItem = navigableItems[actualFocusedIndex];

        if (currentItem.type === 'day') {
          // Toggle day selection
          const day = currentItem.day.short;
          setSelectedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) {
              newSet.delete(day);
            } else {
              newSet.add(day);
            }
            return newSet;
          });
        } else if (currentItem.type === 'preset') {
          // Apply preset
          switch (currentItem.action) {
            case 'all':
              setSelectedDays(new Set(DAYS.map(d => d.short)));
              break;
            case 'weekdays':
              setSelectedDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));
              break;
            case 'weekend':
              setSelectedDays(new Set(['Sat', 'Sun']));
              break;
            case 'clear':
              setSelectedDays(new Set());
              break;
          }
        } else if (currentItem.type === 'continue') {
          // Submit selection
          if (selectedDays.size > 0) {
            onSelect(Array.from(selectedDays));
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === ' ') {
        e.preventDefault();
        // Space also toggles for days
        const currentItem = navigableItems[actualFocusedIndex];
        if (currentItem.type === 'day') {
          const day = currentItem.day.short;
          setSelectedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) {
              newSet.delete(day);
            } else {
              newSet.add(day);
            }
            return newSet;
          });
        }
      }
      // Quick shortcuts for presets
      else if (e.key === 'w') {
        e.preventDefault();
        setSelectedDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));
      } else if (e.key === 'e') {
        e.preventDefault();
        setSelectedDays(new Set(['Sat', 'Sun']));
      } else if (e.key === 'a') {
        e.preventDefault();
        setSelectedDays(new Set(DAYS.map(d => d.short)));
      } else if (e.key === 'c') {
        e.preventDefault();
        setSelectedDays(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actualFocusedIndex, navigableItems, selectedDays, onSelect, onCancel]);

  // Calculate which index in the full menu corresponds to the focused navigable item
  const getFocusedMenuIndex = () => {
    let navigableCount = 0;
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].type !== 'divider') {
        if (navigableCount === actualFocusedIndex) return i;
        navigableCount++;
      }
    }
    return -1;
  };

  const focusedMenuIndex = getFocusedMenuIndex();

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Select Days</h3>
          <span className="ml-auto text-xs text-gray-500">
            {selectedDays.size} selected
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <div key={`divider-${index}`} className="border-t border-gray-200 my-1"></div>;
          }

          const isFocused = index === focusedMenuIndex;

          if (item.type === 'day') {
            return (
              <div
                key={item.day.short}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                  isFocused ? "bg-gray-100" : "hover:bg-gray-50",
                  selectedDays.has(item.day.short) && "text-blue-600"
                )}
                onClick={() => {
                  setSelectedDays(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(item.day.short)) {
                      newSet.delete(item.day.short);
                    } else {
                      newSet.add(item.day.short);
                    }
                    return newSet;
                  });
                }}
              >
                <div className={cn(
                  "w-4 h-4 border-2 rounded flex items-center justify-center transition-colors",
                  selectedDays.has(item.day.short)
                    ? "bg-blue-500 border-blue-500"
                    : isFocused
                    ? "border-gray-400"
                    : "border-gray-300"
                )}>
                  {selectedDays.has(item.day.short) && (
                    <Check className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
                <span className={cn(
                  "flex-1 text-sm",
                  selectedDays.has(item.day.short) ? "font-medium" : ""
                )}>
                  {item.day.full}
                </span>
                <span className="text-xs text-gray-400">
                  {item.day.short}
                </span>
              </div>
            );
          }

          if (item.type === 'preset') {
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                  isFocused ? "bg-gray-100" : "hover:bg-gray-50"
                )}
                onClick={() => {
                  switch (item.action) {
                    case 'all':
                      setSelectedDays(new Set(DAYS.map(d => d.short)));
                      break;
                    case 'weekdays':
                      setSelectedDays(new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']));
                      break;
                    case 'weekend':
                      setSelectedDays(new Set(['Sat', 'Sun']));
                      break;
                    case 'clear':
                      setSelectedDays(new Set());
                      break;
                  }
                }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </div>
                <span className="flex-1 text-sm text-gray-600">{item.label}</span>
                <span className="text-xs text-gray-400">
                  {item.action === 'all' && 'a'}
                  {item.action === 'weekdays' && 'w'}
                  {item.action === 'weekend' && 'e'}
                  {item.action === 'clear' && 'c'}
                </span>
              </div>
            );
          }

          if (item.type === 'continue') {
            return (
              <div
                key="continue"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                  isFocused ? "bg-blue-500 text-white" : "hover:bg-blue-50 text-blue-600"
                )}
                onClick={() => {
                  if (selectedDays.size > 0) {
                    onSelect(Array.from(selectedDays));
                  }
                }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <ChevronRight className={cn(
                    "h-3 w-3",
                    isFocused ? "text-white" : "text-blue-500"
                  )} />
                </div>
                <span className="flex-1 text-sm font-medium">
                  Continue with {selectedDays.size} day{selectedDays.size !== 1 ? 's' : ''}
                </span>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Hints */}
      <div className="border-t border-gray-200 px-3 py-2">
        <div className="text-xs text-gray-400 space-y-0.5">
          <div>↑↓ navigate • Enter/Space toggle • ESC cancel</div>
          <div>w weekdays • e weekend • a all • c clear</div>
        </div>
      </div>
    </div>
  );
}