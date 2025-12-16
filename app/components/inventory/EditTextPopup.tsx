import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditTextPopupProps {
  label: string;
  placeholder?: string;
  initialValue?: string;
  onSelect: (text: string) => void;
  onCancel: () => void;
}

export default function EditTextPopup({
  label,
  placeholder = '',
  initialValue = '',
  onSelect,
  onCancel
}: EditTextPopupProps) {
  const [text, setText] = useState(initialValue);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // Handle Cmd+V (paste)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        navigator.clipboard.readText().then(clipText => {
          setText(prev => prev + clipText);
        }).catch(err => {
          console.error('Failed to read clipboard:', err);
        });
        return;
      }

      // Handle Cmd+Backspace (clear entire input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        setText('');
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(text.trim());
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setText(text.slice(0, -1));
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setText(text + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, onSelect, onCancel]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-80" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      </div>

      <div className="mb-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-3 border-2 rounded-md transition-colors cursor-pointer",
          "border-blue-400 bg-blue-50"
        )}>
          <span className="inline-block w-[2px] h-4 bg-blue-400 animate-[blink_1s_ease-in-out_infinite] mr-1" />
          <div className="flex-1 text-sm font-mono">
            {text || <span className="text-gray-400">{placeholder}</span>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Type text and press Enter to save</div>
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
