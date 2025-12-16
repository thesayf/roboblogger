import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BacklogTask {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  description?: string;
  duration?: number;
  completed?: boolean;
  [key: string]: any; // Allow other fields
}

interface BacklogTasksPopupProps {
  tasks: BacklogTask[];
  allBlocks?: any[]; // All blocks to check for task assignments
  onSelect: (task: BacklogTask) => void;
  onSelectMultiple?: (tasks: BacklogTask[]) => void;
  onCancel: () => void;
}

export default function BacklogTasksPopup({ tasks, allBlocks = [], onSelect, onSelectMultiple, onCancel }: BacklogTasksPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [multiSelectedTasks, setMultiSelectedTasks] = useState<BacklogTask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug log to see what tasks we're receiving
  console.log('BacklogTasksPopup received tasks:', tasks);

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
  console.log('Available (incomplete) tasks:', availableTasks);

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

          if (!isAlreadySelected) {
            setMultiSelectedTasks(prev => [...prev, task]);
          }
        } else {
          // Regular Enter - confirm selection
          if (multiSelectedTasks.length > 0) {
            // If we have multi-selected tasks, add them all
            setIsSubmitting(true); // Prevent double submission
            if (onSelectMultiple) {
              onSelectMultiple(multiSelectedTasks);
            }
          } else {
            // Single selection (only if not assigned)
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
      <div className="bg-white border-2 border-gray-300 p-4 w-96 z-[100]">
        <div className="text-xs font-mono text-gray-500 mb-2">Backlog Tasks</div>
        <div className="text-base text-gray-700" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          No incomplete tasks in your backlog
        </div>
        <div className="mt-3 text-xs font-mono text-gray-400">
          ESC to go back
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 w-96 z-[100]">
      <div className="px-4 py-3 border-b-2 border-gray-200 bg-white">
        <div className="text-xs font-mono text-gray-500">Select a task to add</div>
      </div>

      <div ref={containerRef} className="max-h-64 overflow-y-auto">
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
                "px-4 py-3 transition-colors border-b border-gray-100 flex items-start gap-3",
                isAssigned ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                selectedIndex === index ? "bg-gray-200" : !isAssigned && "hover:bg-gray-100",
                isMultiSelected && !isAssigned && "bg-blue-50 border-l-4 border-l-blue-500"
              )}
              onClick={() => !isAssigned && onSelect(task)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {isMultiSelected && !isAssigned && (
                <div className="h-5 w-5 bg-blue-500 text-white text-xs font-bold rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  {multiSelectIndex + 1}
                </div>
              )}
              <div className="flex-1">
                <div className="text-base text-gray-900" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                  {task.content || task.title || task.description || 'Unnamed Task'}
                  {isAssigned && <span className="ml-2 text-xs">• Assigned</span>}
                </div>
                {task.duration && (
                  <div className="text-xs font-mono text-gray-500 mt-1">
                    {task.duration}m
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-gray-200 px-4 py-2 bg-white">
        <span className="text-xs font-mono text-gray-400">
          {multiSelectedTasks.length > 0 ? (
            <span>
              {multiSelectedTasks.length} task{multiSelectedTasks.length > 1 ? 's' : ''} selected • Enter to add • ESC to clear
            </span>
          ) : (
            <span>↑↓ Navigate • 1-9 Quick • ⌘+Enter Multi • Enter Select • ESC Back</span>
          )}
        </span>
      </div>
    </div>
  );
}