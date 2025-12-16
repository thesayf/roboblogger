'use client';

import React from 'react';

interface InputFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  inputStep?: 'name' | 'deadline' | null;
  tempName?: string;
  className?: string;
}

export default function InputField({
  label,
  value,
  placeholder,
  inputStep,
  tempName,
  className = ''
}: InputFieldProps) {
  return (
    <div className={`font-mono flex items-center gap-4 px-2 py-1 ${className}`}>
      <span className="text-gray-400 text-sm uppercase">
        {label}
      </span>
      <span className="text-sm flex-1">
        {inputStep === 'name' ? (
          <>
            <span className="text-gray-700">{value}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        ) : inputStep === 'deadline' ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempName}</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 text-xs mr-1">deadline:</span>
            <span className="text-gray-700">{value}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            {value.length === 0 && placeholder && (
              <span className="ml-1 text-gray-400 text-xs">{placeholder}</span>
            )}
          </span>
        ) : (
          <>
            <span className="text-gray-700">{value}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        )}
      </span>
    </div>
  );
}