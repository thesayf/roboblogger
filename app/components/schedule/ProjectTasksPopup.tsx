import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckSquare, Square, Clock } from 'lucide-react';

interface ProjectTask {
  _id?: string;
  id?: string;
  title: string;
  content?: string;
  duration?: number;
  completed?: boolean;
}

interface ProjectTasksPopupProps {
  projectName: string;
  tasks: ProjectTask[];
  allBlocks?: any[]; // All blocks to check for task assignments
  onSelect: (task: ProjectTask) => void;
  onSelectMultiple?: (tasks: ProjectTask[]) => void;
  onCancel: () => void;
}

export default function ProjectTasksPopup({ projectName, tasks, allBlocks = [], onSelect, onSelectMultiple, onCancel }: ProjectTasksPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [multiSelectedTasks, setMultiSelectedTasks] = useState<ProjectTask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to check if a task is already assigned to any block
  const isTaskAssigned = (taskId: string) => {
    return allBlocks.some((block: any) =>
      block.tasks?.some((task: any) => {
        const blockTaskId = task.id || task._id;
        // Compare string IDs
        return blockTaskId && blockTaskId.toString() === taskId.toString();
      })
    );
  };

  // Filter out completed tasks and mark assigned tasks
  const availableTasks = tasks.filter(task => !task.completed).map(task => ({
    ...task,
    isAssigned: isTaskAssigned((task._id || task.id) as string),
  }));

  // Scroll the selected item into view
  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    const container = containerRef.current;

    if (selectedElement && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();

      // Check if element is out of view
      if (elementRect.bottom > containerRect.bottom) {
        // Element is below visible area - scroll down
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (elementRect.top < containerRect.top) {
        // Element is above visible area - scroll up
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % availableTasks.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + availableTasks.length) % availableTasks.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) {
          console.log('Already submitting, ignoring Enter press');
          return;
        }

        // Check if Cmd/Ctrl is pressed for multi-selection
        if ((e.metaKey || e.ctrlKey) && availableTasks[selectedIndex]) {
          // Add task to multi-selection (only if not assigned)
          const task = availableTasks[selectedIndex];
          if ((task as any).isAssigned) {
            console.log('Cannot select assigned task:', task);
            return; // Prevent selection of assigned tasks
          }
          const taskId = task._id || task.id;

          // Check if already selected
          const isAlreadySelected = multiSelectedTasks.some(
            t => (t._id || t.id) === taskId
          );

          if (isAlreadySelected) {
            // Unselect the task
            console.log('Removing task from multi-selection:', task);
            setMultiSelectedTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
          } else {
            // Select the task
            console.log('Adding task to multi-selection:', task);
            setMultiSelectedTasks(prev => [...prev, task]);
          }
        } else {
          // Regular Enter - confirm selection
          console.log('Enter pressed, multiSelectedTasks:', multiSelectedTasks);
          if (multiSelectedTasks.length > 0) {
            // If we have multi-selected tasks, add them all
            console.log('Calling onSelectMultiple with:', multiSelectedTasks);
            setIsSubmitting(true); // Prevent double submission
            if (onSelectMultiple) {
              onSelectMultiple(multiSelectedTasks);
            } else {
              console.warn('onSelectMultiple is not defined!');
            }
          } else {
            // Single selection (only if not assigned)
            console.log('Single selection, adding task at index:', selectedIndex);
            if (availableTasks[selectedIndex] && !(availableTasks[selectedIndex] as any).isAssigned) {
              onSelect(availableTasks[selectedIndex]);
            }
          }
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        // If multi-selection is active, clear it first
        if (multiSelectedTasks.length > 0) {
          setMultiSelectedTasks([]);
        } else {
          onCancel();
        }
      } else if (e.key >= '1' && e.key <= '9') {
        // Quick select with number keys
        const index = parseInt(e.key) - 1;
        if (index < availableTasks.length) {
          e.preventDefault();
          onSelect(availableTasks[index]);
        }
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Dismiss on any other typing (except numbers which are used for quick select)
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, availableTasks, multiSelectedTasks, onSelect, onSelectMultiple, onCancel]);

  if (availableTasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-4 w-80 z-[100]">
        <div className="text-xs font-semibold text-gray-600 mb-2">{projectName}</div>
        <div className="text-sm text-gray-500">No incomplete tasks in this project</div>
        <div className="mt-2 text-xs text-gray-400">
          ESC to go back
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg w-96 z-[100]">
      <div className="px-3 py-2 border-b border-gray-100 bg-white">
        <div className="text-xs font-semibold text-gray-600">{projectName}</div>
        <div className="text-xs text-gray-500 mt-0.5">Select a task to add</div>
      </div>

      <div ref={containerRef} className="max-h-64 overflow-y-auto py-1">
        {availableTasks.map((task, index) => {
          const taskId = task._id || task.id;
          const multiSelectIndex = multiSelectedTasks.findIndex(t => (t._id || t.id) === taskId);
          const isMultiSelected = multiSelectIndex !== -1;
          const isAssigned = (task as any).isAssigned;

          return (
            <div
              key={task._id || task.id || index}
              ref={el => itemRefs.current[index] = el}
              className={cn(
                "flex items-center gap-3 px-3 py-2 transition-colors",
                isAssigned ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                // Show navigation highlight even on multi-selected tasks
                isMultiSelected && !isAssigned && selectedIndex === index ? "bg-blue-100 border-l-2 border-l-blue-500" :
                isMultiSelected && !isAssigned ? "bg-blue-50 border-l-2 border-l-blue-500" :
                selectedIndex === index ? "bg-gray-100" :
                !isAssigned && "hover:bg-gray-50"
              )}
              onClick={() => !isAssigned && onSelect(task)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={cn("text-xs font-mono w-4", isAssigned ? "text-gray-300" : "text-gray-400")}>
                {index < 9 ? index + 1 : ''}
              </span>
              {isMultiSelected && !isAssigned ? (
                <div className="h-4 w-4 bg-blue-500 text-white text-xs font-bold rounded flex items-center justify-center">
                  {multiSelectIndex + 1}
                </div>
              ) : (
                <Square className={cn("h-4 w-4", isAssigned ? "text-gray-300" : "text-gray-400")} />
              )}
              <div className="flex-1">
                <div className="text-sm">
                  {task.title || task.content || 'Unnamed Task'}
                  {isAssigned && <span className="ml-2 text-xs">• Assigned</span>}
                </div>
                {task.duration && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {task.duration}m
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400 bg-white">
        {multiSelectedTasks.length > 0 ? (
          <span>
            {multiSelectedTasks.length} task{multiSelectedTasks.length > 1 ? 's' : ''} selected • Enter to add • ESC to clear
          </span>
        ) : (
          <span>↑↓ Navigate • 1-9 Quick • ⌘+Enter Multi • Enter Select • ESC Back</span>
        )}
      </div>
    </div>
  );
}