'use client';

import React from 'react';
import GoalSelectionPopup from './GoalSelectionPopup';
import DurationPickerPopup from './DurationPickerPopup';
import SimpleDateInput from './SimpleDateInput';

interface AdminTask {
  id: string;
  name?: string;
  content?: string; // API returns content, not name
  priority?: string;
  dueDate?: string;
  metadata?: {
    duration?: string;
    dueDate?: string;
    completed?: boolean;
    [key: string]: any;
  };
}

interface Goal {
  id: string;
  title: string;
  deadline?: string;
  completed?: boolean;
  isExpanded?: boolean;
}

interface AdminTasksListProps {
  adminTasks: AdminTask[];
  isAtAdminLevel: boolean;
  adminLevelPosition: number;
  grabbedAdminIndex: number | null;
  isEditingAdmin: boolean;
  editingAdminIndex: number | null;
  editAdminName: string;
  editAdminPriority: string;
  editAdminGoalId?: string | null;
  editAdminDuration?: number;
  editAdminDeadline?: string | null;
  editFieldFocus: 'name' | 'goal' | 'duration' | 'deadline';
  isEditingNameInline?: boolean;
  isTypingAdmin: boolean;
  adminInput: string;
  inputStep: 'name' | 'priority' | null;
  tempAdminName: string;
  tempAdminGoalId?: string | null;
  adminTaskViewMode?: 'active' | 'completed';
  // Popup related props
  showGoalPopup?: boolean;
  showDurationPopup?: boolean;
  showDeadlinePopup?: boolean;
  // Edit popup related props
  showEditGoalPopup?: boolean;
  showEditDurationPopup?: boolean;
  showEditDeadlinePopup?: boolean;
  goals?: Goal[];
  onGoalSelect?: (goalId: string | null) => void;
  onGoalCancel?: () => void;
  onDurationSelect?: (duration: number) => void;
  onDurationCancel?: () => void;
  onDeadlineSelect?: (deadline: string | null) => void;
  onDeadlineCancel?: () => void;
  // Edit popup handlers
  onEditGoalSelect?: (goalId: string | null) => void;
  onEditGoalCancel?: () => void;
  onEditDurationSelect?: (duration: number) => void;
  onEditDurationCancel?: () => void;
  onEditDeadlineSelect?: (deadline: string | null) => void;
  onEditDeadlineCancel?: () => void;
}

export default function AdminTasksList({
  adminTasks,
  isAtAdminLevel,
  adminLevelPosition,
  grabbedAdminIndex,
  isEditingAdmin,
  editingAdminIndex,
  editAdminName,
  editAdminPriority,
  editAdminGoalId,
  editAdminDuration,
  editAdminDeadline,
  editFieldFocus,
  isEditingNameInline = false,
  isTypingAdmin,
  adminInput,
  inputStep,
  tempAdminName,
  tempAdminGoalId = null,
  adminTaskViewMode = 'active',
  showGoalPopup = false,
  showDurationPopup = false,
  showDeadlinePopup = false,
  showEditGoalPopup = false,
  showEditDurationPopup = false,
  showEditDeadlinePopup = false,
  goals = [],
  onGoalSelect,
  onGoalCancel,
  onDurationSelect,
  onDurationCancel,
  onDeadlineSelect,
  onDeadlineCancel,
  onEditGoalSelect,
  onEditGoalCancel,
  onEditDurationSelect,
  onEditDurationCancel,
  onEditDeadlineSelect,
  onEditDeadlineCancel,
}: AdminTasksListProps) {
  console.log('[AdminTasksList] Render state:', {
    adminTasksLength: adminTasks.length,
    isAtAdminLevel,
    adminLevelPosition,
    isTypingAdmin,
    inputStep,
    adminInput
  });

  // Helper function to render input field
  const renderInputField = (label: string, className: string = '') => (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      {/* Checkbox (unchecked for new task) */}
      <div className="w-4 h-4 flex-shrink-0 mt-1">
        <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </div>
      <span className="flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
        {inputStep === 'name' ? (
          <>
            <span className="text-gray-700">{adminInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        ) : inputStep === 'priority' ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempAdminName}</span>
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 text-xs mr-1">priority:</span>
            <span className="text-gray-700">{adminInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            {adminInput.length === 0 && (
              <span className="ml-1 text-gray-400 text-xs">low/medium/high</span>
            )}
          </span>
        ) : (
          <>
            <span className="text-gray-700">{adminInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        )}
      </span>
    </div>
  );

  if (adminTasks.length === 0) {
    return (
      <div className="py-2">
        {adminTaskViewMode === 'completed' ? (
          <div className="text-gray-400 text-sm font-mono">
            No completed tasks yet
          </div>
        ) : isAtAdminLevel ? (
          <div className="relative">
            {renderInputField('ADMIN 01')}
            {/* Popups positioned relative to input */}
            {showGoalPopup && onGoalSelect && onGoalCancel && (
              <GoalSelectionPopup
                goals={goals}
                onSelect={onGoalSelect}
                onCancel={onGoalCancel}
                initialGoalId={tempAdminGoalId}
              />
            )}
            {showDurationPopup && onDurationSelect && onDurationCancel && (
              <DurationPickerPopup
                onSelect={onDurationSelect}
                onCancel={onDurationCancel}
              />
            )}
            {showDeadlinePopup && onDeadlineSelect && onDeadlineCancel && (
              <SimpleDateInput
                onSelect={onDeadlineSelect}
                onCancel={onDeadlineCancel}
              />
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No admin tasks yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers
  let displayOffset = 0;
  if (isAtAdminLevel && adminLevelPosition === -2) {
    displayOffset = 1;
  }

  return (
    <div className="space-y-2">
      {/* Top input for new admin task (not in completed view) */}
      {isAtAdminLevel && adminLevelPosition === -2 && adminTaskViewMode !== 'completed' && (
        <div className="relative">
          {renderInputField('ADMIN 01')}
          {/* Popups positioned relative to top input */}
          {showGoalPopup && onGoalSelect && onGoalCancel && (
            <GoalSelectionPopup
              goals={goals}
              onSelect={onGoalSelect}
              onCancel={onGoalCancel}
            />
          )}
          {showDurationPopup && onDurationSelect && onDurationCancel && (
            <DurationPickerPopup
              onSelect={onDurationSelect}
              onCancel={onDurationCancel}
            />
          )}
          {showDeadlinePopup && onDeadlineSelect && onDeadlineCancel && (
            <SimpleDateInput
              onSelect={onDeadlineSelect}
              onCancel={onDeadlineCancel}
            />
          )}
        </div>
      )}

      {/* Render existing admin tasks */}
      {adminTasks.map((task, index) => {
        const hasInsertAfter = isAtAdminLevel && adminLevelPosition === -(index + 3) && adminTaskViewMode !== 'completed';
        if (hasInsertAfter) {
          console.log('[AdminTasksList] hasInsertAfter TRUE for index:', index, 'adminLevelPosition:', adminLevelPosition);
        }
        let displayNumber = index + 1;

        if (adminTaskViewMode !== 'completed') {
          if (isAtAdminLevel && adminLevelPosition === -2) {
            displayNumber = index + 2;
          } else if (isAtAdminLevel && adminLevelPosition < -2) {
            const insertPosition = Math.abs(adminLevelPosition) - 3;
            if (insertPosition < index) {
              displayNumber = index + 2;
            }
          }
        }

        return (
          <React.Fragment key={task.id}>
          <div data-admin-index={index}>
            <div className={`flex items-start gap-3 transition-all ${
              grabbedAdminIndex === index
                ? 'opacity-75 bg-gray-100 py-2'
                : isEditingAdmin && editingAdminIndex === index
                ? 'py-3'
                : isAtAdminLevel && adminLevelPosition === index
                ? 'bg-gray-50 py-2'
                : 'py-2'
            }`}>
              {/* Checkbox or Checkmark */}
              <div className="w-4 h-4 flex-shrink-0 mt-1">
                {adminTaskViewMode === 'completed' ? (
                  // Simple checkmark in completed view
                  <span className="w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium" style={{ fontFamily: "monospace" }}>
                    ✓
                  </span>
                ) : task.completed || task.metadata?.completed ? (
                  // Checked checkbox
                  <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" stroke="white" strokeWidth="3" d="M6 12l4 4l8-8" />
                  </svg>
                ) : (
                  // Unchecked checkbox
                  <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                {isEditingAdmin && editingAdminIndex === index ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Name field */}
                    <div className={`relative flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'name' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                      <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editAdminName}
                        {editFieldFocus === 'name' && isEditingNameInline && (
                          <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                        )}
                      </span>
                    </div>

                    {/* Goal field */}
                    <div className={`relative flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'goal' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>goal</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'goal' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {(() => {
                          if (editAdminGoalId) {
                            const goal = goals?.find(g => g.id === editAdminGoalId);
                            return goal?.title || goal?.name || goal?.content || '—';
                          }
                          return '—';
                        })()}
                      </span>
                      {/* Goal popup positioned inline */}
                      {showEditGoalPopup && onEditGoalSelect && onEditGoalCancel && (
                        <GoalSelectionPopup
                          goals={goals}
                          onSelect={onEditGoalSelect}
                          onCancel={onEditGoalCancel}
                        />
                      )}
                    </div>

                    {/* Duration field */}
                    <div className={`relative flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'duration' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>duration</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'duration' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editAdminDuration}m
                      </span>
                      {/* Duration popup positioned inline */}
                      {showEditDurationPopup && onEditDurationSelect && onEditDurationCancel && (
                        <DurationPickerPopup
                          onSelect={onEditDurationSelect}
                          onCancel={onEditDurationCancel}
                          initialDuration={editAdminDuration}
                        />
                      )}
                    </div>

                    {/* Deadline field */}
                    <div className={`relative flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'deadline' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>deadline</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'deadline' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editAdminDeadline || '—'}
                      </span>
                      {/* Deadline popup positioned inline */}
                      {showEditDeadlinePopup && onEditDeadlineSelect && onEditDeadlineCancel && (
                        <SimpleDateInput
                          onSelect={onEditDeadlineSelect}
                          onCancel={onEditDeadlineCancel}
                          initialValue={editAdminDeadline}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={`text-gray-700 leading-relaxed ${
                      task.completed || task.metadata?.completed ? 'line-through text-gray-400' : ''
                    }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {/* ADMIN TASK GRAB MODE DISABLED: {grabbedAdminIndex === index && '⇅ '} */}
                      {task.name || task.content || ''}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Duration badge - check both root and metadata */}
                      {(task.duration || task.metadata?.duration) && (
                        (() => {
                          const duration = task.duration || task.metadata?.duration;
                          // Handle both number and string formats
                          const displayDuration = typeof duration === 'number'
                            ? duration >= 60
                              ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
                              : `${duration}m`
                            : duration;
                          return (
                            <span className="text-xs font-mono text-gray-500">
                              {displayDuration}
                            </span>
                          );
                        })()
                      )}

                      {/* Deadline badge - check multiple fields */}
                      {(task.dueDate || task.metadata?.dueDate || task.metadata?.deadline) && (
                        (() => {
                          const deadline = task.dueDate || task.metadata?.dueDate || task.metadata?.deadline;
                          const date = new Date(deadline);
                          const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          });
                          return (
                            <span className="text-xs font-mono text-gray-500">
                              {formattedDate}
                            </span>
                          );
                        })()
                      )}
                    </div>

                    {/* Goal badge */}
                    {(task.goalId || task.metadata?.goalId) && (() => {
                      const goalId = task.goalId || task.metadata?.goalId;
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
                  </>
                )}
              </div>
            </div>

            {/* Show popups for current task position during edit flow */}
            {!hasInsertAfter && !isEditingAdmin && adminLevelPosition === index && (showGoalPopup || showDurationPopup || showDeadlinePopup) && (
              <div className="relative">
                {showGoalPopup && onGoalSelect && onGoalCancel && (
                  <GoalSelectionPopup
                    goals={goals}
                    onSelect={onGoalSelect}
                    onCancel={onGoalCancel}
                  />
                )}
                {showDurationPopup && onDurationSelect && onDurationCancel && (
                  <DurationPickerPopup
                    onSelect={onDurationSelect}
                    onCancel={onDurationCancel}
                  />
                )}
                {showDeadlinePopup && onDeadlineSelect && onDeadlineCancel && (
                  <SimpleDateInput
                    onSelect={onDeadlineSelect}
                    onCancel={onDeadlineCancel}
                  />
                )}
              </div>
            )}

          </div>

          {/* Insert input after this task */}
          {hasInsertAfter && (
            <div className="relative">
              {renderInputField(`ADMIN ${String(displayNumber + 1).padStart(2, '0')}`)}
              {/* Popups positioned relative to inline input */}
              {showGoalPopup && onGoalSelect && onGoalCancel && (
                <GoalSelectionPopup
                  goals={goals}
                  onSelect={onGoalSelect}
                  onCancel={onGoalCancel}
                />
              )}
              {showDurationPopup && onDurationSelect && onDurationCancel && (
                <DurationPickerPopup
                  onSelect={onDurationSelect}
                  onCancel={onDurationCancel}
                />
              )}
              {showDeadlinePopup && onDeadlineSelect && onDeadlineCancel && (
                <SimpleDateInput
                  onSelect={onDeadlineSelect}
                  onCancel={onDeadlineCancel}
                />
              )}
            </div>
          )}
          </React.Fragment>
        );
      })}

      {/* Bottom input for new admin task (not in completed view) */}
      {(() => {
        const shouldShowBottomInput = isAtAdminLevel && adminLevelPosition === -1 && adminTaskViewMode !== 'completed';
        console.log('[AdminTasksList] Bottom input check:', {
          isAtAdminLevel,
          adminLevelPosition,
          shouldShowBottomInput
        });
        return shouldShowBottomInput;
      })() && (
        <div className="relative">
          {renderInputField(`ADMIN ${String(adminTasks.length + 1).padStart(2, '0')}`)
}
          {/* Popups positioned relative to bottom input */}
          {showGoalPopup && onGoalSelect && onGoalCancel && (
            <GoalSelectionPopup
              goals={goals}
              onSelect={onGoalSelect}
              onCancel={onGoalCancel}
            />
          )}
          {showDurationPopup && onDurationSelect && onDurationCancel && (
            <DurationPickerPopup
              onSelect={onDurationSelect}
              onCancel={onDurationCancel}
            />
          )}
          {showDeadlinePopup && onDeadlineSelect && onDeadlineCancel && (
            <SimpleDateInput
              onSelect={onDeadlineSelect}
              onCancel={onDeadlineCancel}
            />
          )}
        </div>
      )}
    </div>
  );
}