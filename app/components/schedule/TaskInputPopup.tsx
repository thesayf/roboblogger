import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TaskInputPopupProps {
  onConfirm: (taskName: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export default function TaskInputPopup({ onConfirm, onCancel, placeholder = "Task name..." }: TaskInputPopupProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        onConfirm(input.trim());
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, onConfirm, onCancel]);

  return (
    <div className="bg-white border-2 border-gray-300 p-4 w-80 z-[100]">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full px-0 py-1 text-base border-0 outline-none focus:ring-0 text-gray-900"
        style={{ fontFamily: 'Lora, Georgia, serif' }}
      />
      <div className="mt-3 text-xs font-mono text-gray-400">
        Enter to confirm • ESC to cancel
      </div>
    </div>
  );
}