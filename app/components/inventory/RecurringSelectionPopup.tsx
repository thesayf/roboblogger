import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface RecurringSelectionPopupProps {
  onSelect: (isRecurring: boolean) => void;
  onCancel: () => void;
  initialIsRecurring?: boolean;
}

export default function RecurringSelectionPopup({ onSelect, onCancel, initialIsRecurring = false }: RecurringSelectionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIsRecurring ? 1 : 0); // 0 = No, 1 = Yes

  const options = [
    { label: 'No', value: false, key: 'n' },
    { label: 'Yes', value: true, key: 'y' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(options[selectedIndex].value);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setSelectedIndex(0);
        onSelect(false);
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        setSelectedIndex(1);
        onSelect(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-64" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Recurring Event?</h3>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2">Will this event repeat?</div>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option, index) => (
            <button
              key={option.key}
              onClick={() => {
                setSelectedIndex(index);
                onSelect(option.value);
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium rounded-md transition-colors border-2",
                selectedIndex === index
                  ? "bg-blue-100 border-blue-400 text-blue-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="flex justify-between items-center">
                <span>{option.label}</span>
                <span className="text-xs text-gray-400 ml-2">({option.key})</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs text-gray-400 space-y-1">
          <div>← → or N/Y to select</div>
          <div>Enter to confirm • ESC to cancel</div>
        </div>
      </div>
    </div>
  );
}