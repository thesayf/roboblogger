'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TextEditPopupProps {
  label: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export default function TextEditPopup({
  label,
  initialValue,
  onSubmit,
  onCancel,
  placeholder = "Enter value..."
}: TextEditPopupProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select the input when popup opens
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="absolute z-50 mt-1 p-4 bg-white border-2 border-gray-300"
      style={{ minWidth: '320px' }}
    >
      <div className="text-xs font-mono text-gray-500 mb-2">{label}</div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-0 py-1 border-0 text-base text-gray-900 focus:outline-none focus:ring-0"
        style={{ fontFamily: 'Lora, Georgia, serif' }}
        placeholder={placeholder}
      />
      <div className="mt-3 text-xs font-mono text-gray-400">
        Enter to submit • ESC to cancel
      </div>
    </div>
  );
}