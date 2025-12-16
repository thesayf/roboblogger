'use client';

import React from 'react';
import RoutineTaskDurationPopup from './RoutineTaskDurationPopup';
import GoalSelectionPopup from './GoalSelectionPopup';
import DateRangePickerPopup from './DateRangePickerPopup';
import DaySelectionPopup from './DaySelectionPopup';
import TimeAndDurationPopup from './TimeAndDurationPopup';

interface Task {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  content?: string;
  duration: number;
  completed?: boolean;
  order?: number;
}

interface Routine {
  id: string;
  name?: string;
  content?: string; // API returns content, not name
  time?: string;
  frequency?: string;
  tasks?: Task[]; // Routine tasks
  metadata?: {
    startTime?: string;
    duration?: number;
    days?: string[];
    [key: string]: any;
  };
}

interface Goal {
  id: string;
  name: string;
}

interface RoutinesListProps {
  routines: Routine[];
  isAtRoutineLevel: boolean;
  routineLevelPosition: number;
  grabbedRoutineIndex: number | null;
  isEditingRoutine: boolean;
  editingRoutineIndex: number | null;
  editingRoutineId?: string | null;
  editRoutineName: string;
  editRoutineTime: string;
  editFieldFocus: 'name' | 'goal' | 'dates' | 'days' | 'time' | 'duration';
  // New props for all edit fields
  editRoutineGoalId?: string | null;
  editRoutineStartDate?: string;
  editRoutineEndDate?: string;
  editRoutineDays?: string[];
  editRoutineDuration?: number;
  goals?: Goal[];
  isTypingRoutine: boolean;
  routineInput: string;
  inputStep: 'name' | 'time' | null;
  tempRoutineName: string;
  routineViewMode?: 'active' | 'completed';
  isAtRoutineTaskLevel?: boolean;
  selectedTaskIndex?: number;
  isTypingTask?: boolean;
  taskInput?: string;
  taskInputPosition?: number;
  grabbedTaskIndex?: number | null;
  showDurationPopup?: boolean;
  selectedTaskForDuration?: { index: number; name: string } | null;
  onDurationSelect?: (duration: number) => void;
  onDurationCancel?: () => void;
  editingTaskIndex?: number | null;
  editTaskName?: string;
  editTaskDuration?: number;
  editTaskFieldFocus?: 'name' | 'duration';
  onTaskNameChange?: (value: string) => void;
  onTaskEditSave?: () => void;
  onTaskEditCancel?: () => void;
  isEditingNameInline?: boolean;
  // Edit routine popup props
  showEditGoalPopup?: boolean;
  showEditDateRangePopup?: boolean;
  showEditDaysPopup?: boolean;
  showEditTimePopup?: boolean;
  showEditDurationPopup?: boolean;
  onEditGoalSelect?: (goalId: string | null) => void;
  onEditGoalCancel?: () => void;
  onEditDateRangeSelect?: (startDate: string, endDate: string) => void;
  onEditDateRangeCancel?: () => void;
  onEditDaysSelect?: (days: string[]) => void;
  onEditDaysCancel?: () => void;
  onEditTimeSelect?: (time: string, duration: number) => void;
  onEditTimeCancel?: () => void;
  onEditDurationSelect?: (duration: number) => void;
  onEditDurationCancel?: () => void;
}

export default function RoutinesList({
  routines,
  isAtRoutineLevel,
  routineLevelPosition,
  grabbedRoutineIndex,
  isEditingRoutine,
  editingRoutineIndex,
  editingRoutineId,
  editRoutineName,
  editRoutineTime,
  editFieldFocus,
  editRoutineGoalId = null,
  editRoutineStartDate = '',
  editRoutineEndDate = '',
  editRoutineDays = [],
  editRoutineDuration = 30,
  goals = [],
  isTypingRoutine,
  routineInput,
  inputStep,
  tempRoutineName,
  routineViewMode = 'active',
  isAtRoutineTaskLevel = false,
  selectedTaskIndex = 0,
  isTypingTask = false,
  taskInput = '',
  taskInputPosition = -1,
  grabbedTaskIndex = null,
  showDurationPopup = false,
  selectedTaskForDuration = null,
  onDurationSelect,
  onDurationCancel,
  editingTaskIndex = null,
  editTaskName = '',
  editTaskDuration = 30,
  editTaskFieldFocus = 'name',
  onTaskNameChange,
  onTaskEditSave,
  onTaskEditCancel,
  isEditingNameInline = false,
  showEditGoalPopup = false,
  showEditDateRangePopup = false,
  showEditDaysPopup = false,
  showEditTimePopup = false,
  showEditDurationPopup = false,
  onEditGoalSelect,
  onEditGoalCancel,
  onEditDateRangeSelect,
  onEditDateRangeCancel,
  onEditDaysSelect,
  onEditDaysCancel,
  onEditTimeSelect,
  onEditTimeCancel,
  onEditDurationSelect,
  onEditDurationCancel,
}: RoutinesListProps) {
  // Helper function to render input field
  const renderInputField = (label: string, className: string = '') => (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      {/* Routine Icon */}
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span className="flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
        {inputStep === 'name' ? (
          <>
            <span className="text-gray-700">{routineInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        ) : inputStep === 'time' ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempRoutineName}</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 text-xs mr-1">time:</span>
            <span className="text-gray-700">{routineInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            {routineInput.length === 0 && (
              <span className="ml-1 text-gray-400 text-xs">HH:MM</span>
            )}
          </span>
        ) : (
          <>
            <span className="text-gray-700">{routineInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        )}
      </span>
    </div>
  );

  if (routines.length === 0) {
    return (
      <div className="py-2">
        {routineViewMode === 'completed' ? (
          <div className="text-gray-400 text-sm font-mono">
            No completed routines yet
          </div>
        ) : isAtRoutineLevel ? (
          renderInputField('ROUTINE 01')
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No routines yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers
  let displayOffset = 0;
  if (isAtRoutineLevel && routineLevelPosition === -2) {
    displayOffset = 1;
  }

  return (
    <div className="space-y-2">
      {/* Top input for new routine (not in completed view) */}
      {isAtRoutineLevel && routineLevelPosition === -2 && routineViewMode !== 'completed' && renderInputField('ROUTINE 01')}

      {/* Render existing routines */}
      {routines.map((routine, index) => {
        const hasInsertAfter = isAtRoutineLevel && routineLevelPosition === -(index + 3) && routineViewMode !== 'completed';
        let displayNumber = index + 1;

        if (routineViewMode !== 'completed') {
          if (isAtRoutineLevel && routineLevelPosition === -2) {
            displayNumber = index + 2;
          } else if (isAtRoutineLevel && routineLevelPosition < -2) {
            const insertPosition = Math.abs(routineLevelPosition) - 3;
            if (insertPosition < index) {
              displayNumber = index + 2;
            }
          }
        }

        return (
          <React.Fragment key={routine.id}>
          <div data-routine-index={index}>
            <div className={`flex gap-3 transition-all ${
              grabbedRoutineIndex === index
                ? 'opacity-75 bg-gray-100 py-2'
                : isEditingRoutine && editingRoutineId && routine.id === editingRoutineId
                ? 'py-3'
                : isAtRoutineLevel && routineLevelPosition === index
                ? 'bg-gray-50 py-2'
                : 'py-2'
            }`}>
              {/* Routine Icon or Checkmark */}
              {routineViewMode === 'completed' ? (
                <span className="w-4 h-4 text-gray-400 flex-shrink-0 text-center text-sm font-medium mt-0.5" style={{ fontFamily: "monospace" }}>
                  ✓
                </span>
              ) : (
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}

              <div className="flex-1">
                {isEditingRoutine && editingRoutineId && routine.id === editingRoutineId ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Name field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'name' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                        <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineName || '—'}
                          {isEditingNameInline && (
                            <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Goal field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'goal' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>goal</span>
                        <span className={`flex-1 ${editFieldFocus === 'goal' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineGoalId ? (goals.find(g => g.id === editRoutineGoalId)?.name || 'None') : 'None'}
                        </span>
                      </div>
                      {showEditGoalPopup && onEditGoalSelect && onEditGoalCancel && (
                        <GoalSelectionPopup
                          goals={goals}
                          onSelect={onEditGoalSelect}
                          onCancel={onEditGoalCancel}
                          initialGoalId={editRoutineGoalId}
                        />
                      )}
                    </div>

                    {/* Dates field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'dates' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>dates</span>
                        <span className={`flex-1 text-sm ${editFieldFocus === 'dates' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineStartDate && editRoutineEndDate
                            ? `${new Date(editRoutineStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(editRoutineEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : '—'}
                        </span>
                      </div>
                      {showEditDateRangePopup && onEditDateRangeSelect && onEditDateRangeCancel && (
                        <DateRangePickerPopup
                          onSelect={onEditDateRangeSelect}
                          onCancel={onEditDateRangeCancel}
                          initialStartDate={editRoutineStartDate}
                          initialEndDate={editRoutineEndDate}
                        />
                      )}
                    </div>

                    {/* Days field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'days' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>days</span>
                        <span className={`flex-1 text-sm ${editFieldFocus === 'days' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineDays && editRoutineDays.length > 0 ? editRoutineDays.join(', ') : '—'}
                        </span>
                      </div>
                      {showEditDaysPopup && onEditDaysSelect && onEditDaysCancel && (
                        <DaySelectionPopup
                          onSelect={onEditDaysSelect}
                          onCancel={onEditDaysCancel}
                          initialDays={editRoutineDays}
                        />
                      )}
                    </div>

                    {/* Time field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'time' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>time</span>
                        <span className={`flex-1 text-sm ${editFieldFocus === 'time' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineTime || '—'}
                        </span>
                      </div>
                      {showEditTimePopup && onEditTimeSelect && onEditTimeCancel && (
                        <TimeAndDurationPopup
                          onSelect={onEditTimeSelect}
                          onCancel={onEditTimeCancel}
                          initialTime={editRoutineTime}
                          initialDuration={editRoutineDuration}
                        />
                      )}
                    </div>

                    {/* Duration field */}
                    <div className="relative">
                      <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'duration' ? 'bg-gray-50' : ''}`}>
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>duration</span>
                        <span className={`flex-1 text-sm ${editFieldFocus === 'duration' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {editRoutineDuration ? `${editRoutineDuration}m` : '—'}
                        </span>
                      </div>
                      {/* Duration popup positioned inline */}
                      {showEditDurationPopup && onEditDurationSelect && onEditDurationCancel && (
                        <RoutineTaskDurationPopup
                          onSelect={onEditDurationSelect}
                          onCancel={onEditDurationCancel}
                          initialDuration={editRoutineDuration}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {/* ROUTINE GRAB MODE DISABLED: {grabbedRoutineIndex === index && '⇅ '} */}
                        {routine.name || routine.content || ''}
                      </span>
                      {(routine.time || routine.metadata?.startTime) && (
                        <span className="text-xs font-mono text-gray-500">
                          {routine.time || routine.metadata?.startTime}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {routine.metadata?.days && routine.metadata.days.length > 0 && (
                        <span className="text-xs font-mono text-gray-400">
                          {routine.metadata.days.join(', ')}
                        </span>
                      )}

                      {/* Start and end dates */}
                      {(routine.startDate || routine.metadata?.startDate) && (routine.endDate || routine.metadata?.endDate) && (() => {
                        const startDate = routine.startDate || routine.metadata?.startDate;
                        const endDate = routine.endDate || routine.metadata?.endDate;

                        // Format dates to "MMM DD" format
                        const formatDate = (dateStr: string) => {
                          const date = new Date(dateStr);
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          });
                        };

                        return (
                          <span className="text-xs font-mono text-gray-400">
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </span>
                        );
                      })()}

                      {/* Goal badge */}
                      {(routine.goalId || routine.metadata?.goalId) && (() => {
                        const goalId = routine.goalId || routine.metadata?.goalId;
                        const goal = goals?.find(g => g.id === goalId);
                        if (goal) {
                          const goalName = goal.title || goal.name || goal.content || '';
                          return (
                            <span className="text-xs text-gray-400" style={{ fontFamily: "Lora, Georgia, serif" }}>
                              → {goalName}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Show tasks when user navigates to this routine */}
            {isAtRoutineLevel && routineLevelPosition === index && (
              <div className="mt-3 space-y-1 pl-4">
                {routine.tasks && routine.tasks.length > 0 && isAtRoutineTaskLevel && (
                  <div className="text-gray-500 text-xs font-mono uppercase mb-2">
                    Tasks ({routine.tasks.length})
                    <span className="ml-2 text-gray-400 normal-case">
                      {grabbedTaskIndex !== null
                        ? '• ↑↓ to move • Enter/g to release'
                        : '• Enter to add • g to grab • ↑↓ to navigate • Shift+Tab to exit'
                      }
                    </span>
                  </div>
                )}

                {/* Top input position */}
                {isAtRoutineTaskLevel && (isTypingTask) && taskInputPosition === -2 && (
                  <div className="relative" data-task-input-top>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span className="flex-1 text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {taskInput}
                        <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                      </span>
                    </div>
                  </div>
                )}

                {routine.tasks && routine.tasks.map((task, taskIdx) => {
                  const isSelected = isAtRoutineTaskLevel && taskIdx === selectedTaskIndex;
                  const isGrabbed = isAtRoutineTaskLevel && taskIdx === grabbedTaskIndex;
                  const isEditing = editingTaskIndex === taskIdx;

                  // Log task details for debugging
                  if (task.title === "will this edit persist yo" || task.name === "will this edit persist yo") {
                    console.log('[RoutinesList] Rendering task "will this edit persist yo":', {
                      task,
                      duration: task.duration,
                      typeOfDuration: typeof task.duration
                    });
                  }

                  return (
                    <>
                      <div
                        key={task._id || task.id || taskIdx}
                        className={`flex items-start gap-2 transition-all ${
                          isGrabbed ? 'bg-gray-100 opacity-75 py-1' :
                          isEditing ? 'py-2' :
                          isSelected ? 'bg-gray-50 py-1' : 'py-1'
                        }`}
                        data-task-index={taskIdx}
                      >
                        <span className="text-gray-400">•</span>
                        {isEditing ? (
                          <div className="flex-1 flex flex-col gap-1.5 text-xs">
                            {editTaskFieldFocus === 'name' && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-gray-400 w-14 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                                <span className="flex-1 text-sm text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                                  {editTaskName || '—'}
                                  <span className="inline-block w-[1px] h-3 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                                </span>
                              </div>
                            )}

                            {editTaskFieldFocus === 'duration' && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-gray-400 w-14 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>duration</span>
                                <span className="flex-1 text-sm text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                                  {editTaskDuration}m
                                  <span className="inline-block w-[1px] h-3 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`text-sm text-gray-500 ${
                            task.completed ? 'line-through text-gray-400' : ''
                          }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                            {task.title || task.name || task.content || 'Untitled'}
                          </span>
                        )}
                      </div>

                      {/* Duration Popup for edited task - only show if not typing a new task */}
                      {!isTypingTask && showDurationPopup && selectedTaskForDuration &&
                       selectedTaskForDuration.index === taskIdx && onDurationSelect && onDurationCancel && (
                          <div className="relative">
                            <RoutineTaskDurationPopup
                              taskName={selectedTaskForDuration.name}
                              onSelect={onDurationSelect}
                              onCancel={onDurationCancel}
                              initialDuration={isEditing ? editTaskDuration : undefined}
                            />
                          </div>
                      )}

                      {/* Inline input after this task */}
                      {isAtRoutineTaskLevel && (isTypingTask) && taskInputPosition === taskIdx && (
                        <div className="relative">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span className="flex-1 text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                              {taskInput}
                              <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                            </span>
                          </div>

                          {/* Duration Popup for inline input - only show if selectedTaskForDuration.index matches this position */}
                          {showDurationPopup && selectedTaskForDuration &&
                           selectedTaskForDuration.index === taskIdx &&
                           onDurationSelect && onDurationCancel && (
                            <RoutineTaskDurationPopup
                              taskName={selectedTaskForDuration.name}
                              onSelect={onDurationSelect}
                              onCancel={onDurationCancel}
                            />
                          )}
                        </div>
                      )}
                    </>
                  );
                })}

                {/* Bottom input position */}
                {isAtRoutineTaskLevel && (isTypingTask) && taskInputPosition === -1 && (
                  <div className="relative" data-task-input-bottom>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span className="flex-1 text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {taskInput}
                        <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                      </span>
                    </div>

                    {/* Duration Popup - only show if selectedTaskForDuration.index is -1 */}
                    {showDurationPopup && selectedTaskForDuration &&
                     selectedTaskForDuration.index === -1 &&
                     onDurationSelect && onDurationCancel && (
                      <RoutineTaskDurationPopup
                        taskName={selectedTaskForDuration.name}
                        onSelect={onDurationSelect}
                        onCancel={onDurationCancel}
                      />
                    )}
                  </div>
                )}

                {/* Empty state with input - only show if not already showing bottom/top input */}
                {(!routine.tasks || routine.tasks.length === 0) && isAtRoutineTaskLevel && isTypingTask &&
                 taskInputPosition !== -1 && taskInputPosition !== -2 && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span className="flex-1 text-sm text-gray-700" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {taskInput}
                      <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                    </span>
                  </div>
                )}

                {/* Empty message */}
                {(!routine.tasks || routine.tasks.length === 0) && !isTypingTask && isAtRoutineTaskLevel && (
                  <div className="text-gray-400 text-sm italic">
                    No tasks - press Enter to add
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Insert input after this routine */}
          {hasInsertAfter && renderInputField(`ROUTINE ${String(displayNumber + 1).padStart(2, '0')}`)}
          </React.Fragment>
        );
      })}

      {/* Bottom input for new routine (not in completed view) */}
      {isAtRoutineLevel && routineLevelPosition === -1 && routineViewMode !== 'completed' &&
        renderInputField(`ROUTINE ${String(routines.length + 1).padStart(2, '0')}`)
      }
    </div>
  );
}