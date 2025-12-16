'use client';

import React from 'react';
import { Goal } from '@/app/types/inventory';

interface GoalItemProps {
  goal: Goal;
  index: number;
  displayNumber: number;
  isSelected: boolean;
  isGrabbed: boolean;
  isEditing: boolean;
  editName?: string;
  editDeadline?: string;
  editFieldFocus?: 'name' | 'deadline';
  onEdit?: (name: string, deadline: string) => void;
}

export default function GoalItem({
  goal,
  index,
  displayNumber,
  isSelected,
  isGrabbed,
  isEditing,
  editName = '',
  editDeadline = '',
  editFieldFocus = 'name',
  onEdit
}: GoalItemProps) {
  return (
    <div className={`font-mono flex items-center gap-4 transition-all px-2 ${
      isGrabbed
        ? 'text-gray-900 pl-6 opacity-75 bg-gray-100 py-1'
        : isEditing
        ? 'text-gray-900 pl-4 py-2'
        : isSelected
        ? 'text-gray-900 pl-4 py-1'
        : 'text-gray-600 py-1'
    }`}>
      <span className={`text-sm uppercase transition-all ${
        isGrabbed
          ? 'text-gray-700'
          : isSelected
          ? 'text-gray-600'
          : 'text-gray-400'
      }`}>
        {isGrabbed && '⇅ '}GOAL {String(displayNumber).padStart(2, '0')}
      </span>

      {isEditing ? (
        <div className="flex-1 flex flex-col gap-2.5">
          {/* Name field */}
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
            <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
              {editName}
              {editFieldFocus === 'name' && (
                <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
              )}
            </span>
          </div>

          {/* Deadline field */}
          <div className="flex items-baseline gap-3">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>deadline</span>
            <span className={`flex-1 text-sm ${editFieldFocus === 'deadline' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
              {editDeadline || '—'}
              {editFieldFocus === 'deadline' && (
                <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
              )}
            </span>
          </div>
        </div>
      ) : (
        <>
          <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
            {goal.name}
          </span>
          {goal.deadline && (
            <span className="text-gray-400 ml-2 text-sm">
              {goal.deadline}
            </span>
          )}
        </>
      )}
    </div>
  );
}