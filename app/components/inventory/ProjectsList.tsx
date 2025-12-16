'use client';

import React from 'react';
import DurationPickerPopup from './DurationPickerPopup';
import SimpleDateInput from './SimpleDateInput';
import GoalSelectionPopup from './GoalSelectionPopup';
import ProjectSelectionPopup from './ProjectSelectionPopup';
import TextEditPopup from './TextEditPopup';

interface Task {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  content?: string;
  duration: number;
  dueDate?: string;
  completed?: boolean;
  order?: number;
}

interface Project {
  id: string;
  name?: string;
  content?: string; // API returns content, not name
  isExpanded?: boolean;
  deadline?: string;
  goalId?: string; // Reference to Goal
  tasks?: Task[]; // Project tasks
  metadata?: {
    dueDate?: string;
    completed?: boolean;
    goalId?: string;
    [key: string]: any;
  };
}

interface Goal {
  id: string;
  name?: string;
  content?: string;
}

interface ProjectsListProps {
  projects: Project[];
  goals?: Goal[];
  isAtProjectLevel: boolean;
  projectLevelPosition: number;
  grabbedProjectIndex: number | null;
  isEditingProject: boolean;
  editingProjectIndex: number | null;
  editingProjectId?: string | null;
  editProjectName: string;
  editProjectDeadline: string;
  editProjectGoalId?: string | null;
  editFieldFocus: 'name' | 'deadline' | 'goal';
  isEditingNameInline?: boolean;
  isTypingProject: boolean;
  projectInput: string;
  inputStep: 'name' | 'deadline' | null;
  tempProjectName: string;
  tempProjectGoalId?: string | null;
  projectViewMode?: 'active' | 'completed';
  showGoalSelectionPopup?: boolean;
  showDeadlinePickerPopup?: boolean;
  onProjectGoalSelect?: (goalId: string | null) => void;
  onProjectGoalCancel?: () => void;
  onProjectDeadlineSelect?: (deadline: string | null) => void;
  onProjectDeadlineCancel?: () => void;
  isAtProjectTaskLevel?: boolean;
  selectedTaskIndex?: number;
  isTypingTask?: boolean;
  taskInput?: string;
  taskInputPosition?: number;
  grabbedTaskIndex?: number | null;
  isEditingTask?: boolean;
  editingTaskIndex?: number | null;
  editTaskName?: string;
  editTaskDuration?: string;
  editTaskDeadline?: string;
  editTaskFieldFocus?: 'name' | 'duration' | 'deadline';
  showDurationPickerPopup?: boolean;
  showTaskSimpleDateInput?: boolean;
  tempTaskTitle?: string;
  tempTaskDeadline?: string;
  onTaskDurationSelect?: (duration: number | null) => void;
  onTaskDurationCancel?: () => void;
  onTaskDeadlineSelect?: (deadline: string | null) => void;
  onTaskDeadlineCancel?: () => void;
  showEditGoalSelectionPopup?: boolean;
  showEditDeadlinePickerPopup?: boolean;
  onEditGoalSelect?: (goalId: string | null) => void;
  onEditGoalCancel?: () => void;
  onEditDeadlineSelect?: (deadline: string | null) => void;
  onEditDeadlineCancel?: () => void;
  // Task edit popups
  showEditTaskNamePopup?: boolean;
  showEditTaskDurationPopup?: boolean;
  showEditTaskDeadlinePopup?: boolean;
  editTaskNameValue?: string;
  editTaskDurationValue?: number;
  editTaskDeadlineValue?: string;
  onEditTaskNameSubmit?: (name: string) => void;
  onEditTaskNameCancel?: () => void;
  onEditTaskDurationSubmit?: (duration: number) => void;
  onEditTaskDurationCancel?: () => void;
  onEditTaskDeadlineSubmit?: (deadline: string | null) => void;
  onEditTaskDeadlineCancel?: () => void;
  showCompletedTasks?: boolean;
  selectedTaskIds?: Set<string>;
  showProjectSelectionPopup?: boolean;
  onProjectMoveSelect?: (projectId: string | null) => void;
  onProjectMoveCancel?: () => void;
  availableProjects?: any[];
}

export default function ProjectsList({
  projects,
  goals = [],
  isAtProjectLevel,
  projectLevelPosition,
  grabbedProjectIndex,
  isEditingProject,
  editingProjectIndex,
  editingProjectId,
  editProjectName,
  editProjectDeadline,
  editProjectGoalId,
  editFieldFocus,
  isEditingNameInline = false,
  isTypingProject,
  projectInput,
  inputStep,
  tempProjectName,
  tempProjectGoalId,
  projectViewMode = 'active',
  showGoalSelectionPopup = false,
  showDeadlinePickerPopup = false,
  onProjectGoalSelect,
  onProjectGoalCancel,
  onProjectDeadlineSelect,
  onProjectDeadlineCancel,
  isAtProjectTaskLevel = false,
  selectedTaskIndex = 0,
  isTypingTask = false,
  taskInput = '',
  taskInputPosition = -1,
  grabbedTaskIndex = null,
  isEditingTask = false,
  editingTaskIndex = null,
  editTaskName = '',
  editTaskDuration = '',
  editTaskDeadline = '',
  editTaskFieldFocus = 'name',
  showDurationPickerPopup = false,
  showTaskSimpleDateInput = false,
  tempTaskTitle = '',
  tempTaskDeadline = '',
  onTaskDurationSelect,
  onTaskDurationCancel,
  onTaskDeadlineSelect,
  onTaskDeadlineCancel,
  showEditGoalSelectionPopup,
  showEditDeadlinePickerPopup,
  onEditGoalSelect,
  onEditGoalCancel,
  onEditDeadlineSelect,
  onEditDeadlineCancel,
  // Task edit popups
  showEditTaskNamePopup = false,
  showEditTaskDurationPopup = false,
  showEditTaskDeadlinePopup = false,
  editTaskNameValue = '',
  editTaskDurationValue = 30,
  editTaskDeadlineValue = '',
  onEditTaskNameSubmit,
  onEditTaskNameCancel,
  onEditTaskDurationSubmit,
  onEditTaskDurationCancel,
  onEditTaskDeadlineSubmit,
  onEditTaskDeadlineCancel,
  showCompletedTasks = false,
  selectedTaskIds = new Set(),
  showProjectSelectionPopup = false,
  onProjectMoveSelect,
  onProjectMoveCancel,
  availableProjects = [],
}: ProjectsListProps) {

  // Log tempTaskDeadline to debug
  if (showTaskSimpleDateInput) {
    console.log('[ProjectsList] Rendering with tempTaskDeadline:', tempTaskDeadline, 'type:', typeof tempTaskDeadline);
  }

  // Helper function to render input field
  const renderInputField = (label: string, className: string = '') => (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      {/* Project Icon */}
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <span className="flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
        {showGoalSelectionPopup ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempProjectName || projectInput}</span>
            <span className="text-gray-400 ml-2 text-xs italic">← selecting goal...</span>
          </span>
        ) : showDeadlinePickerPopup ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempProjectName || projectInput}</span>
            {tempProjectGoalId && (
              <span className="text-gray-500 ml-2 text-xs">
                → {(() => {
                  const goal = goals.find(g => g.id === tempProjectGoalId);
                  return goal ? (goal.name || goal.content || 'Unnamed Goal') : 'Unknown Goal';
                })()}
              </span>
            )}
            <span className="text-gray-400 ml-2 text-xs italic">← selecting deadline...</span>
          </span>
        ) : inputStep === 'name' ? (
          <>
            <span className="text-gray-700">{projectInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        ) : inputStep === 'deadline' ? (
          <span className="flex items-center">
            <span className="text-gray-600">{tempProjectName}</span>
            {tempProjectGoalId && (
              <>
                <span className="text-gray-500 ml-2 text-xs">
                  → {(() => {
                    const goal = goals.find(g => g.id === tempProjectGoalId);
                    return goal ? (goal.name || goal.content || 'Unnamed Goal') : 'Unknown Goal';
                  })()}
                </span>
              </>
            )}
            <span className="text-gray-400 mx-2">•</span>
            <span className="text-gray-500 text-xs mr-1">deadline:</span>
            <span className="text-gray-700">{projectInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            {projectInput.length === 0 && (
              <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
            )}
          </span>
        ) : (
          <>
            <span className="text-gray-700">{projectInput}</span>
            <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
          </>
        )}
      </span>
    </div>
  );

  if (projects.length === 0) {
    return (
      <div className="py-2">
        {projectViewMode === 'completed' ? (
          <div className="text-gray-400 text-sm font-mono">
            No completed projects yet
          </div>
        ) : isAtProjectLevel ? (
          renderInputField('PROJECT 01')
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No projects yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers
  let displayOffset = 0;
  if (isAtProjectLevel && projectLevelPosition === -2) {
    displayOffset = 1;
  }

  return (
    <div className="space-y-2">
      {/* Top input for new project (not in completed view) */}
      {isAtProjectLevel && projectLevelPosition === -2 && projectViewMode !== 'completed' && renderInputField('PROJECT 01')}

      {/* Render existing projects */}
      {projects.map((project, index) => {
        const hasInsertAfter = isAtProjectLevel && projectLevelPosition === -(index + 3) && projectViewMode !== 'completed';
        let displayNumber = index + 1;

        if (projectViewMode !== 'completed') {
          if (isAtProjectLevel && projectLevelPosition === -2) {
            displayNumber = index + 2;
          } else if (isAtProjectLevel && projectLevelPosition < -2) {
            const insertPosition = Math.abs(projectLevelPosition) - 3;
            if (insertPosition < index) {
              displayNumber = index + 2;
            }
          }
        }

        return (
          <React.Fragment key={project.id}>
          <div data-project-index={index}>
            <div className={`flex gap-3 transition-all ${
              grabbedProjectIndex === index
                ? 'opacity-75 bg-gray-100 py-2'
                : isEditingProject && editingProjectId && project.id === editingProjectId
                ? 'py-3'
                : isAtProjectLevel && projectLevelPosition === index
                ? 'bg-gray-50 py-2'
                : 'py-2'
            }`}>
              {/* Project Icon or Checkmark */}
              {projectViewMode === 'completed' ? (
                <span className="w-4 h-4 text-gray-400 flex-shrink-0 text-center text-sm font-medium mt-0.5" style={{ fontFamily: "monospace" }}>
                  ✓
                </span>
              ) : (
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              )}

              {isEditingProject && editingProjectId && project.id === editingProjectId ? (
                <div className="flex-1 flex flex-col gap-2.5">
                  {/* Name field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'name' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                      <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editProjectName || '—'}
                        {editFieldFocus === 'name' && isEditingNameInline && (
                          <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Goal field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'goal' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>goal</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'goal' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editProjectGoalId ? (() => {
                          const goal = goals.find(g => g.id === editProjectGoalId);
                          return goal ? (goal.name || goal.content || 'Unnamed') : 'Unknown';
                        })() : 'None'}
                      </span>
                    </div>
                    {/* Goal popup positioned inline */}
                    {showEditGoalSelectionPopup && onEditGoalSelect && onEditGoalCancel && (
                      <GoalSelectionPopup
                        goals={goals}
                        onSelect={onEditGoalSelect}
                        onCancel={onEditGoalCancel}
                        initialGoalId={editProjectGoalId}
                      />
                    )}
                  </div>

                  {/* Deadline field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'deadline' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>deadline</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'deadline' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editProjectDeadline || '—'}
                      </span>
                    </div>
                    {/* Deadline popup positioned inline */}
                    {showEditDeadlinePickerPopup && onEditDeadlineSelect && onEditDeadlineCancel && (
                      <SimpleDateInput
                        onSelect={onEditDeadlineSelect}
                        onCancel={onEditDeadlineCancel}
                        initialValue={editProjectDeadline}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-gray-700 leading-relaxed ${
                      project.completed || project.metadata?.completed ? 'line-through text-gray-400' : ''
                    }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {/* PROJECT GRAB MODE DISABLED: {grabbedProjectIndex === index && '⇅ '} */}
                      {project.name || project.content || ''}
                    </span>
                    {(project.deadline || project.metadata?.dueDate) && (
                      <span className="text-xs font-mono text-gray-500">
                        {(() => {
                          const dateStr = project.deadline || project.metadata?.dueDate;
                          if (!dateStr) return '';
                          try {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric'
                            });
                          } catch {
                            return dateStr;
                          }
                        })()}
                      </span>
                    )}
                  </div>
                  {(project.goalId || project.metadata?.goalId) && (
                    <span className={`text-xs ${
                      project.completed || project.metadata?.completed ? 'text-gray-400' : 'text-gray-400'
                    }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                      → {(() => {
                        const goalId = project.goalId || project.metadata?.goalId;
                        const goal = goals.find(g => g.id === goalId);
                        return goal ? (goal.name || goal.content || 'Unnamed Goal') : 'Unknown Goal';
                      })()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Show tasks only when user tabs into the project */}
            {isAtProjectLevel && projectLevelPosition === index && isAtProjectTaskLevel && (
              <div className="mt-3 space-y-2 pl-4 border-l border-gray-200">
                {project.tasks && project.tasks.length > 0 && (() => {
                  const activeTasks = project.tasks.filter(t => !t.completed);
                  const completedTasks = project.tasks.filter(t => t.completed);
                  return (
                    <div className="text-gray-500 text-xs font-mono uppercase mb-2">
                      Tasks ({activeTasks.length} remaining{completedTasks.length > 0 ? `, ${completedTasks.length} completed` : ''})
                      <span className="ml-2 text-gray-400 normal-case">
                        {grabbedTaskIndex !== null
                          ? '• ↑↓ to move • Enter/g to release'
                          : '• Enter to add • g to grab • m to move • ↑↓ to navigate • ←→ to toggle completed • Shift+Tab to exit'
                        }
                      </span>
                    </div>
                  );
                })()}

                {/* Top input position - but not when editing */}
                {isAtProjectTaskLevel && !isEditingTask && (isTypingTask || showDurationPickerPopup || showTaskSimpleDateInput) && taskInputPosition === -2 && (
                  <div className="relative" data-task-input-top>
                    <div className="flex items-start gap-2 py-1">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-3 h-3 border border-gray-300 rounded"></div>
                      </div>
                      <span className="flex-1 text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {showDurationPickerPopup || showTaskSimpleDateInput ? tempTaskTitle : taskInput}
                        {!showDurationPickerPopup && !showTaskSimpleDateInput && <span className="animate-pulse">_</span>}
                      </span>
                      <span className="text-gray-400 text-xs italic">
                        {showDurationPickerPopup ? 'Selecting duration...' :
                         showTaskSimpleDateInput ? 'Selecting deadline...' :
                         'Enter to add • Esc to cancel'}
                      </span>
                    </div>

                    {/* Task popups */}
                    {showDurationPickerPopup && onTaskDurationSelect && onTaskDurationCancel && (
                      <DurationPickerPopup
                        onSelect={onTaskDurationSelect}
                        onCancel={onTaskDurationCancel}
                      />
                    )}

                    {showTaskSimpleDateInput && onTaskDeadlineSelect && onTaskDeadlineCancel && (
                      <SimpleDateInput
                        onSelect={onTaskDeadlineSelect}
                        onCancel={onTaskDeadlineCancel}
                        initialValue={tempTaskDeadline}
                      />
                    )}
                  </div>
                )}

                {project.tasks && project.tasks
                  .map((task, originalIdx) => ({ task, originalIdx }))
                  .filter(({ task }) => showCompletedTasks ? task.completed : !task.completed)
                  .map(({ task, originalIdx }, displayIdx) => {
                  const isSelected = isAtProjectTaskLevel && originalIdx === selectedTaskIndex;
                  const isGrabbed = isAtProjectTaskLevel && originalIdx === grabbedTaskIndex;

                  // Debug: Log task data to see what's being displayed
                  if (displayIdx === 0 || displayIdx === 1) {
                    console.log(`[ProjectsList] Task ${displayIdx} (original: ${originalIdx}) data:`, {
                      title: task.title || task.name || task.content,
                      duration: task.duration,
                      dueDate: task.dueDate,
                      fullTask: task
                    });
                  }
                  return (
                    <>
                      <div
                        key={task._id || task.id || originalIdx}
                        className={`flex items-start gap-2 transition-all ${
                          isGrabbed ? 'bg-gray-100 opacity-75' :
                          isSelected ? 'bg-gray-50' :
                          selectedTaskIds.has(task._id || task.id || '') ? 'bg-blue-50 border-l-2 border-blue-400 pl-2' : ''
                        }`}
                        data-task-index={originalIdx}
                      >
                        {/* Check if this task is being edited */}
                        {isEditingTask && editingTaskIndex === originalIdx ? (
                          <>
                            <span className="text-xs text-gray-400">
                              {String(originalIdx + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 flex items-center gap-2 text-sm">
                              {/* Name field */}
                              <span className={`flex-1 font-mono px-1 rounded ${
                                editTaskFieldFocus === 'name' ? 'bg-gray-100' : 'bg-gray-50'
                              }`}>
                                {editTaskName}
                                {editTaskFieldFocus === 'name' && <span className="animate-pulse">_</span>}
                              </span>

                              {/* Duration field */}
                              <span className={`w-16 font-mono px-1 rounded text-center ${
                                editTaskFieldFocus === 'duration' ? 'bg-gray-100' : 'bg-gray-50'
                              }`}>
                                {editTaskDuration}m
                                {editTaskFieldFocus === 'duration' && <span className="animate-pulse">_</span>}
                              </span>

                              {/* Deadline field */}
                              <span className={`w-28 font-mono px-1 rounded text-center ${
                                editTaskFieldFocus === 'deadline' ? 'bg-gray-100' : 'bg-gray-50'
                              }`}>
                                {editTaskDeadline || 'DD/MM/YYYY'}
                                {editTaskFieldFocus === 'deadline' && <span className="animate-pulse">_</span>}
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs italic">
                              Tab to navigate • Enter for popup • ⌘Enter to save
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="mt-1 flex-shrink-0">
                              <div className="w-3 h-3 border border-gray-300 rounded"></div>
                            </div>
                            <span className={`text-sm text-gray-600 ${
                              task.completed ? 'line-through text-gray-400' : ''
                            }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                              {task.title || task.name || task.content || 'Untitled'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Inline input after this task - but not when editing */}
                      {isAtProjectTaskLevel && !isEditingTask && (isTypingTask || showDurationPickerPopup || showTaskSimpleDateInput) && taskInputPosition === originalIdx && (
                        <div className="relative">
                          <div className="flex items-start gap-2 py-1">
                            <div className="mt-1 flex-shrink-0">
                              <div className="w-3 h-3 border border-gray-300 rounded"></div>
                            </div>
                            <span className="flex-1 text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                              {showDurationPickerPopup || showTaskSimpleDateInput ? tempTaskTitle : taskInput}
                              {!showDurationPickerPopup && !showTaskSimpleDateInput && <span className="animate-pulse">_</span>}
                            </span>
                            <span className="text-gray-400 text-xs italic">
                              {showDurationPickerPopup ? 'Selecting duration...' :
                               showTaskSimpleDateInput ? 'Selecting deadline...' :
                               'Enter to add'}
                            </span>
                          </div>

                          {/* Task popups */}
                          {showDurationPickerPopup && onTaskDurationSelect && onTaskDurationCancel && (
                            <DurationPickerPopup
                              onSelect={onTaskDurationSelect}
                              onCancel={onTaskDurationCancel}
                            />
                          )}

                          {showTaskSimpleDateInput && onTaskDeadlineSelect && onTaskDeadlineCancel && (
                            <SimpleDateInput
                              onSelect={onTaskDeadlineSelect}
                              onCancel={onTaskDeadlineCancel}
                            />
                          )}
                        </div>
                      )}

                      {/* Project selection popup - show right after selected task */}
                      {showProjectSelectionPopup && isAtProjectTaskLevel && selectedTaskIndex === originalIdx && onProjectMoveSelect && onProjectMoveCancel && (
                        <div className="relative">
                          <ProjectSelectionPopup
                            projects={availableProjects}
                            onSelect={onProjectMoveSelect}
                            onCancel={onProjectMoveCancel}
                            selectedTaskCount={selectedTaskIds.size}
                          />
                        </div>
                      )}
                    </>
                  );
                })}

                {/* Bottom input position - only show when actively typing/selecting at bottom position, not when editing */}
                {isAtProjectTaskLevel && !isEditingTask && project.tasks && project.tasks.length > 0 &&
                 (isTypingTask || showDurationPickerPopup || showTaskSimpleDateInput) && taskInputPosition === -1 && (
                  <div className="relative" data-task-input-bottom>
                    <div className="flex items-start gap-2 py-1">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-3 h-3 border border-gray-300 rounded"></div>
                      </div>
                      <span className="flex-1 text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {showDurationPickerPopup || showTaskSimpleDateInput ? tempTaskTitle :
                         isTypingTask ? taskInput : ''}
                        <span className="animate-pulse">_</span>
                      </span>
                      <span className="text-gray-400 text-xs italic">
                        {showDurationPickerPopup ? 'Selecting duration...' :
                         showTaskSimpleDateInput ? 'Selecting deadline...' :
                         isTypingTask ? 'Enter to add • Esc to cancel' :
                         'Start typing to add task'}
                      </span>
                    </div>

                    {/* Task popups positioned relative to input */}
                    {showDurationPickerPopup && onTaskDurationSelect && onTaskDurationCancel && (
                      <DurationPickerPopup
                        onSelect={onTaskDurationSelect}
                        onCancel={onTaskDurationCancel}
                      />
                    )}

                    {showTaskSimpleDateInput && onTaskDeadlineSelect && onTaskDeadlineCancel && (
                      <SimpleDateInput
                        onSelect={onTaskDeadlineSelect}
                        onCancel={onTaskDeadlineCancel}
                        initialValue={tempTaskDeadline}
                      />
                    )}
                  </div>
                )}

                {/* Empty state - always show input when in task level and no tasks */}
                {(!project.tasks || project.tasks.length === 0) && isAtProjectTaskLevel && (
                  <div className="relative">
                    <div className="flex items-start gap-2 py-1">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-3 h-3 border border-gray-300 rounded"></div>
                      </div>
                      <span className="flex-1 text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {showDurationPickerPopup || showTaskSimpleDateInput ? tempTaskTitle : isTypingTask ? taskInput : ''}
                        <span className="animate-pulse">_</span>
                      </span>
                      <span className="text-gray-400 text-xs italic">
                        {showDurationPickerPopup ? 'Selecting duration...' :
                         showTaskSimpleDateInput ? 'Selecting deadline...' :
                         isTypingTask ? 'Enter to add first task' :
                         'Start typing to add task'}
                      </span>
                    </div>

                    {/* Task popups for empty projects */}
                    {showDurationPickerPopup && onTaskDurationSelect && onTaskDurationCancel && (
                      <DurationPickerPopup
                        onSelect={onTaskDurationSelect}
                        onCancel={onTaskDurationCancel}
                      />
                    )}

                    {showTaskSimpleDateInput && onTaskDeadlineSelect && onTaskDeadlineCancel && (
                      <SimpleDateInput
                        onSelect={onTaskDeadlineSelect}
                        onCancel={onTaskDeadlineCancel}
                        initialValue={tempTaskDeadline}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Insert input after this project */}
          {hasInsertAfter && renderInputField(`PROJECT ${String(displayNumber + 1).padStart(2, '0')}`)}
          </React.Fragment>
        );
      })}

      {/* Bottom input for new project (not in completed view) */}
      {isAtProjectLevel && projectLevelPosition === -1 && projectViewMode !== 'completed' && (
        <div data-project-bottom-input>
          {renderInputField(`PROJECT ${String(projects.length + 1).padStart(2, '0')}`)}
        </div>
      )}

      {/* Task Edit Popups */}
      {showEditTaskNamePopup && onEditTaskNameSubmit && onEditTaskNameCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-25" onClick={onEditTaskNameCancel}></div>
          <div className="relative">
            <TextEditPopup
              label="Edit task name"
              initialValue={editTaskNameValue}
              onSubmit={onEditTaskNameSubmit}
              onCancel={onEditTaskNameCancel}
              placeholder="Enter task name..."
            />
          </div>
        </div>
      )}

      {showEditTaskDurationPopup && onEditTaskDurationSubmit && onEditTaskDurationCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-25" onClick={onEditTaskDurationCancel}></div>
          <div className="relative">
            <DurationPickerPopup
              onSelect={(duration) => onEditTaskDurationSubmit(duration || 30)}
              onCancel={onEditTaskDurationCancel}
              initialDuration={editTaskDurationValue}
            />
          </div>
        </div>
      )}

      {showEditTaskDeadlinePopup && onEditTaskDeadlineSubmit && onEditTaskDeadlineCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-25" onClick={onEditTaskDeadlineCancel}></div>
          <div className="relative">
            <SimpleDateInput
              onSelect={onEditTaskDeadlineSubmit}
              onCancel={onEditTaskDeadlineCancel}
              initialValue={editTaskDeadlineValue}
            />
          </div>
        </div>
      )}
    </div>
  );
}