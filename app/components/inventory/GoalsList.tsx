'use client';

import React from 'react';
import { Goal } from '@/app/types/inventory';

interface GoalsListProps {
  goals: Goal[];
  isAtGoalLevel: boolean;
  goalLevelPosition: number;
  grabbedGoalIndex: number | null;
  isEditingGoal: boolean;
  editingGoalIndex: number | null;
  editGoalName: string;
  editGoalDeadline: string;
  editFieldFocus: 'name' | 'deadline';
  isEditingNameInline?: boolean;
  isTypingGoal: boolean;
  goalInput: string;
  inputStep: 'name' | 'deadline' | null;
  tempGoalName: string;
  isLoadingGoals: boolean;
}

export default function GoalsList({
  goals,
  isAtGoalLevel,
  goalLevelPosition,
  grabbedGoalIndex,
  isEditingGoal,
  editingGoalIndex,
  editGoalName,
  editGoalDeadline,
  editFieldFocus,
  isEditingNameInline = false,
  isTypingGoal,
  goalInput,
  inputStep,
  tempGoalName,
  isLoadingGoals
}: GoalsListProps) {

  // Helper function to render input field
  const renderInputField = (label: string, className: string = '') => (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      {/* Goal Icon */}
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
      <span className="text-sm flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
        {inputStep === 'name' ? (
          <>
            <span className="text-gray-700">{goalInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        ) : inputStep === 'deadline' ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempGoalName}</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 text-xs mr-1">deadline:</span>
            <span className="text-gray-700">{goalInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            {goalInput.length === 0 && (
              <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
            )}
          </span>
        ) : (
          <>
            <span className="text-gray-700">{goalInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        )}
      </span>
    </div>
  );

  if (isLoadingGoals) {
    return <div className="py-2 text-gray-400 text-sm font-mono">Loading goals...</div>;
  }

  if (goals.length === 0) {
    return (
      <div className="py-2">
        {isAtGoalLevel ? (
          renderInputField('GOAL 01')
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No goals yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers
  let displayOffset = 0;
  if (isAtGoalLevel && goalLevelPosition === -2) {
    displayOffset = 1;
  }

  return (
    <div className="space-y-2">
      {/* Top input for new goal */}
      {isAtGoalLevel && goalLevelPosition === -2 && renderInputField('GOAL 01')}

      {/* Render existing goals */}
      {goals.map((goal, index) => {
        const hasInsertAfter = isAtGoalLevel && goalLevelPosition === -(index + 3);
        let displayNumber = index + 1;

        if (isAtGoalLevel && goalLevelPosition === -2) {
          displayNumber = index + 2;
        } else if (isAtGoalLevel && goalLevelPosition < -2) {
          const insertPosition = Math.abs(goalLevelPosition) - 3;
          if (insertPosition < index) {
            displayNumber = index + 2;
          }
        }

        return (
          <div key={goal.id}>
            <div className={`flex gap-3 transition-all ${
              grabbedGoalIndex === index
                ? 'opacity-75 bg-gray-100 py-2'
                : isEditingGoal && editingGoalIndex === index
                ? 'py-3'
                : isAtGoalLevel && goalLevelPosition === index
                ? 'bg-gray-50 py-2'
                : 'py-2'
            }`}>
              {/* Goal Icon */}
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>

              {isEditingGoal && editingGoalIndex === index ? (
                <div className="flex-1 flex flex-col gap-2.5">
                  {/* Name field */}
                  <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'name' ? 'bg-gray-50' : ''}`}>
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                    <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {editGoalName}
                      {editFieldFocus === 'name' && isEditingNameInline && (
                        <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                      )}
                    </span>
                  </div>

                  {/* Deadline field */}
                  <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'deadline' ? 'bg-gray-50' : ''}`}>
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>deadline</span>
                    <span className={`flex-1 text-sm ${editFieldFocus === 'deadline' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {editGoalDeadline || '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-baseline justify-between">
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                    {grabbedGoalIndex === index && '⇅ '}
                    {goal.name}
                  </span>
                  {goal.deadline && (
                    <span className="text-xs font-mono text-gray-500">
                      {goal.deadline}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content when expanded */}
            {goal.isExpanded && (
              <div className="ml-20 mt-3 space-y-1 font-mono">
                <div className="text-gray-400 text-sm italic">
                  Goal expanded - content area (empty)
                </div>
              </div>
            )}

            {/* Insert input after this goal */}
            {hasInsertAfter &&
              renderInputField(
                `GOAL ${String(displayNumber + 1).padStart(2, '0')}`,
                'mt-2 pl-4'
              )
            }
          </div>
        );
      })}

      {/* Bottom input for new goal */}
      {isAtGoalLevel && goalLevelPosition === -1 &&
        renderInputField(`GOAL ${String(goals.length + 1).padStart(2, '0')}`)
      }
    </div>
  );
}