import React, { useState, useEffect, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { Circle, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUser } from '@clerk/nextjs';
import TaskCommandMenu from './TaskCommandMenu';
import TaskInputPopup from './TaskInputPopup';
import TaskDurationPopup from './TaskDurationPopup';
import ProjectSelectionPopup from './ProjectSelectionPopup';
import ProjectTasksPopup from './ProjectTasksPopup';
import BacklogTasksPopup from './BacklogTasksPopup';

interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  projectId?: string;
}

interface BlockProps {
  id: string;
  time: string;
  title: string;
  type: 'deep-work' | 'admin' | 'break' | 'meeting' | 'personal' | 'event' | 'routine';
  duration: number;
  tasks?: Task[];
  metadata?: {
    zoomLink?: string;
    location?: string;
    isRecurring?: boolean;
    endTime?: string;
    routineId?: string;
    eventId?: string;
  };
  isSelected?: boolean;
  hasCursorFocus?: boolean;
  isCollapsed?: boolean;
  isCurrent?: boolean;
  completed?: boolean;
  note?: string;
  isEditingNote?: boolean;
  editNoteValue?: string;
  selectedTaskIndex?: number | null;
  taskInputPosition?: number; // -2 = not in block, -1 = before first task, 0+ = after task at index
  onToggleCollapse?: () => void;
  onSelectTask?: (index: number) => void;
  onToggleTask?: (index: number) => void;
  onAddTask?: (title: string, duration: number, position?: number, projectId?: string, taskId?: string) => void;
  onAddMultipleTasks?: (tasksData: Array<{ title: string; duration: number; projectId?: string; taskId?: string }>, position?: number) => void;
  isTypingTask?: boolean;
  taskInput?: string;
  onTaskMenuSelect?: (option: string) => void;
  isEditingBlock?: boolean;
  editBlockType?: string;
  editBlockTime?: string;
  editFieldFocus?: 'type' | 'time';
  timeEditPosition?: number;
  isEditingTask?: boolean;
  editingTaskIndex?: number | null;
  editTaskName?: string;
  editTaskDuration?: string;
  taskEditFieldFocus?: 'name' | 'duration';
  isGrabbed?: boolean;
  grabbedTaskIndex?: number | null;
  grabbedTasks?: Array<{
    blockIndex: number;
    taskIndex: number;
    task: any;
    originalBlockId?: string;
  }>;
  isSelectingTasks?: boolean;
  blockIndex?: number;
  bestTaskMatch?: { type: 'project' | 'admin'; item: any; preview: string } | null;
  bestProjectMatch?: { item: any; preview: string } | null;
  showProjectAutocomplete?: boolean;
  allBlocks?: any[]; // All blocks for checking task assignments
}

const Block: React.FC<BlockProps> = ({
  id,
  time,
  title,
  type,
  duration,
  tasks = [],
  metadata,
  isSelected = false,
  hasCursorFocus = false,
  isCollapsed = false,
  isCurrent = false,
  completed = false,
  note = '',
  isEditingNote = false,
  editNoteValue = '',
  selectedTaskIndex = null,
  taskInputPosition = -2,
  onToggleCollapse,
  onSelectTask,
  onToggleTask,
  onAddTask,
  onAddMultipleTasks,
  isTypingTask = false,
  taskInput = '',
  onTaskMenuSelect,
  isEditingBlock = false,
  editBlockType = '',
  editBlockTime = '',
  editFieldFocus = 'type',
  timeEditPosition = 0,
  isEditingTask = false,
  editingTaskIndex = null,
  editTaskName = '',
  editTaskDuration = '',
  taskEditFieldFocus = 'name',
  isGrabbed = false,
  grabbedTaskIndex = null,
  grabbedTasks = [],
  isSelectingTasks = false,
  blockIndex,
  bestTaskMatch = null,
  bestProjectMatch = null,
  showProjectAutocomplete = false,
  allBlocks = [],
}) => {
  // Debug log
  if (isSelected) {
    console.log('Block render:', {
      taskInputPosition,
      tasksLength: tasks.length,
      tasks: tasks.map(t => t.title),
      isTypingTask,
      taskInput
    });
  }
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Temporarily disable drag style and listeners
  const style = {
    // transform: CSS.Transform.toString(transform),
    // transition,
    // opacity: isDragging ? 0.3 : 1,
  };

  // Calculate end time
  const calculateEndTime = (startTime: string, dur: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + dur;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Calculate duration from tasks
  const calculatedDuration = tasks.reduce((sum, task) => sum + task.duration, 0) || duration;
  const endTime = calculateEndTime(time, calculatedDuration);

  // Subtle type indicators
  const typeIndicators = {
    'deep-work': '◆',
    'admin': '○',
    'break': '◇',
    'meeting': '□',
    'personal': '△',
    'event': '■', // Calendar event indicator
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  
  // Track if task command menu is open
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  // Track task creation flow
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showTaskDuration, setShowTaskDuration] = useState(false);
  const [pendingTaskName, setPendingTaskName] = useState('');
  
  // Project task selection flow
  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [showProjectTasks, setShowProjectTasks] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);

  // Backlog task selection flow
  const [showBacklogTasks, setShowBacklogTasks] = useState(false);
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  
  // Fetch projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...');
        const response = await fetch('/api/inventory/projects');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched projects:', data);
          setProjects(data.projects || []);
        } else {
          console.error('Failed to fetch projects:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Get user from Clerk
  const { user } = useUser();

  // Helper function to parse duration strings like "30m", "1h", "1.5h" to minutes
  const parseDurationString = (duration: string): number => {
    if (!duration) return 30;

    const match = duration.match(/^(\d+(?:\.\d+)?)(m|h)$/);
    if (!match) return 30;

    const [_, value, unit] = match;
    const numValue = parseFloat(value);

    if (unit === 'm') {
      return numValue;
    } else if (unit === 'h') {
      return numValue * 60;
    }

    return 30;
  };

  // Fetch backlog tasks when component mounts and user is available
  useEffect(() => {
    const fetchBacklogTasks = async () => {
      if (!user?.id) {
        console.log('No user ID available yet');
        return;
      }

      try {
        console.log('Fetching backlog tasks from /api/you');
        // Use the /api/you endpoint which returns properly formatted backlog tasks
        const response = await fetch('/api/you');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data from /api/you:', data);

          // Extract and format backlog tasks from the response
          if (data.sections?.backlog) {
            const backlogTasks = data.sections.backlog.map((task: any) => ({
              _id: task.id,
              id: task.id,
              title: task.content, // The API returns content field with the task name
              content: task.content,
              duration: task.metadata?.duration ? parseDurationString(task.metadata.duration) : 30,
              completed: task.metadata?.completed || false
            }));
            console.log('Formatted backlog tasks:', backlogTasks);
            setBacklogTasks(backlogTasks);
          } else {
            setBacklogTasks([]);
          }
        } else {
          console.error('Failed to fetch from /api/you:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching backlog tasks:', error);
      }
    };
    fetchBacklogTasks();
  }, [user?.id]);

  // Check if we're typing "/" for task menu
  useEffect(() => {
    // Don't show menu if popups are open
    if (showTaskInput || showTaskDuration) return;
    
    if (isTypingTask && taskInput === '/') {
      console.log('Setting showTaskMenu to true - taskInput is /', { taskInputPosition });
      setShowTaskMenu(true);
    } else {
      setShowTaskMenu(false);
    }
  }, [isTypingTask, taskInput, showTaskInput, showTaskDuration, taskInputPosition]);
  
  // Handle task menu selection
  const handleTaskMenuSelect = (optionId: string) => {
    console.log('Task menu selection:', optionId);
    setShowTaskMenu(false);
    
    if (optionId === 'new-task') {
      // Show task input popup
      setShowTaskInput(true);
    } else if (optionId === 'project-task') {
      // Show project selection popup
      console.log('Showing project selection, projects:', projects);
      setShowProjectSelection(true);
    } else if (optionId === 'backlog') {
      // Show backlog tasks popup
      console.log('Showing backlog tasks, tasks:', backlogTasks);
      setShowBacklogTasks(true);
    } else {
      // Pass other options up to parent
      onTaskMenuSelect?.(optionId);
    }
  };
  
  // Handle task name input
  const handleTaskNameConfirm = (taskName: string) => {
    setPendingTaskName(taskName);
    setShowTaskInput(false);
    setShowTaskDuration(true);
  };
  
  // Handle project selection
  const handleProjectSelect = async (project: any) => {
    console.log('Project selected:', project);
    setSelectedProject(project);
    setShowProjectSelection(false);
    
    // Fetch tasks for the selected project
    try {
      console.log('Fetching tasks for project:', project._id);
      const response = await fetch(`/api/inventory/projects/${project._id}/tasks`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tasks:', data);
        setProjectTasks(data.tasks || project.tasks || []);
        setShowProjectTasks(true);
      } else {
        console.error('Failed to fetch tasks:', response.status);
        // Fallback to project.tasks if API fails
        setProjectTasks(project.tasks || []);
        setShowProjectTasks(true);
      }
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      // Fallback to project.tasks if API fails
      setProjectTasks(project.tasks || []);
      setShowProjectTasks(true);
    }
  };
  
  // Handle project task selection
  const handleProjectTaskSelect = (task: any) => {
    setShowProjectTasks(false);
    const projectId = selectedProject?._id || selectedProject?.id;
    const taskId = task._id || task.id; // Get the task's ID
    setSelectedProject(null);
    setProjectTasks([]);

    // Add the task with the project task's info, projectId, and taskId
    // Pass the taskId so we reference the existing task instead of creating a new one
    const duration = task.duration || 30; // Default to 30 minutes
    onAddTask?.(task.title || task.content, duration, taskInputPosition + 1, projectId, taskId);

    // Notify parent that task was added
    onTaskMenuSelect?.('task-added');
  };

  // Handle backlog task selection
  const handleBacklogTaskSelect = (task: any) => {
    setShowBacklogTasks(false);
    const taskId = task._id || task.id; // Get the task's ID

    // Add the task with the backlog task's info and taskId
    // Pass the taskId so we reference the existing task instead of creating a new one
    const duration = task.duration || 30; // Default to 30 minutes
    onAddTask?.(task.content || task.title || task.description, duration, taskInputPosition + 1, undefined, taskId);

    // Notify parent that task was added
    onTaskMenuSelect?.('task-added');
  };

  // Handle multiple project task selection
  const handleProjectTasksMultiSelect = (tasks: any[]) => {
    console.log('handleProjectTasksMultiSelect called with tasks:', tasks);
    setShowProjectTasks(false);
    const projectId = selectedProject?._id || selectedProject?.id;
    setSelectedProject(null);
    setProjectTasks([]);

    if (onAddMultipleTasks) {
      // Use batched function for better performance and no duplicates
      const tasksData = tasks.map(task => ({
        title: task.title || task.content,
        duration: task.duration || 30,
        projectId,
        taskId: task._id || task.id
      }));
      const startPosition = taskInputPosition + 1;
      console.log('Calling onAddMultipleTasks with', tasksData.length, 'tasks at position', startPosition);
      onAddMultipleTasks(tasksData, startPosition);
      // Note: onAddMultipleTasks handler already handles exiting typing mode
    } else {
      // Fallback to individual additions (legacy)
      const startPosition = taskInputPosition + 1;
      tasks.forEach((task, index) => {
        const taskId = task._id || task.id;
        const duration = task.duration || 30;
        const position = startPosition + index;
        console.log(`Adding task ${index + 1}/${tasks.length}:`, task.title || task.content, 'at position', position);
        onAddTask?.(task.title || task.content, duration, position, projectId, taskId);
      });
      // Exit typing mode after adding multiple tasks
      onTaskMenuSelect?.('cancel');
    }
  };

  // Handle multiple backlog task selection
  const handleBacklogTasksMultiSelect = (tasks: any[]) => {
    console.log('handleBacklogTasksMultiSelect called with tasks:', tasks);
    setShowBacklogTasks(false);

    if (onAddMultipleTasks) {
      // Use batched function for better performance and no duplicates
      const tasksData = tasks.map(task => ({
        title: task.content || task.title || task.description,
        duration: task.duration || 30,
        taskId: task._id || task.id
      }));
      const startPosition = taskInputPosition + 1;
      console.log('Calling onAddMultipleTasks with', tasksData.length, 'tasks at position', startPosition);
      onAddMultipleTasks(tasksData, startPosition);
      // Note: onAddMultipleTasks handler already handles exiting typing mode
    } else {
      // Fallback to individual additions (legacy)
      const startPosition = taskInputPosition + 1;
      tasks.forEach((task, index) => {
        const taskId = task._id || task.id;
        const duration = task.duration || 30;
        const position = startPosition + index;
        console.log(`Adding task ${index + 1}/${tasks.length}:`, task.content || task.title, 'at position', position);
        onAddTask?.(task.content || task.title || task.description, duration, position, undefined, taskId);
      });
      // Exit typing mode after adding multiple tasks
      onTaskMenuSelect?.('cancel');
    }
  };

  // Handle task duration input
  const handleTaskDurationConfirm = (duration: number) => {
    setShowTaskDuration(false);
    
    // Add the task at the current input position
    // taskInputPosition + 1 converts from "after index" to "insert position"
    onAddTask?.(pendingTaskName, duration, taskInputPosition + 1);
    
    // Reset state
    setPendingTaskName('');
    
    // Clear the command input and keep typing mode active for next task
    onTaskMenuSelect?.('task-added');
    
    // Keep typing mode active so user can add another task immediately
    // This will be handled by parent component
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Temporarily disabled drag handlers
      // {...attributes}
      // {...listeners}
      className={cn(
        "border-l-2 pl-6 pb-8 cursor-pointer transition-colors",
        isSelected ? "border-gray-900" : "border-gray-200",
        isGrabbed && "opacity-50",
        // Add higher z-index when any dropdown is open
        (showTaskMenu || showTaskInput || showTaskDuration || showProjectSelection || showProjectTasks) && "relative z-50",
        // isDragging && "cursor-grabbing"
      )}
    >

      {/* Time and Title Line - Show edit mode OR normal view */}
      {isEditingBlock ? (
        <div className="flex items-baseline gap-4 mb-2">
          <span className={cn(
            "text-sm tabular-nums font-mono",
            editFieldFocus === 'time' ? "text-gray-900" : "text-gray-500"
          )}>
            {editFieldFocus === 'time' ? (
              // Show time with cursor at specific position
              <>
                {editBlockTime.split('').map((char, idx) => (
                  <React.Fragment key={idx}>
                    {idx === timeEditPosition && (
                      <span className="inline-block w-[1px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                    )}
                    {char}
                  </React.Fragment>
                ))}
                {timeEditPosition === 4 && (
                  <span className="inline-block w-[1px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                )}
              </>
            ) : (
              editBlockTime
            )}
          </span>
          
          <div className="flex items-baseline gap-2 flex-1">
            <span className="text-gray-300 text-xs">
              {typeIndicators[editBlockType as keyof typeof typeIndicators] || '○'}
            </span>
            <span className={cn(
              "font-mono flex items-baseline gap-1",
              editFieldFocus === 'type' ? "text-gray-900" : "text-gray-500"
            )}>
              {editFieldFocus === 'type' && (
                <span className="text-xs text-gray-400">↑</span>
              )}
              {editBlockType.toUpperCase().replace('-', ' ')}
              {editFieldFocus === 'type' && (
                <>
                  <span className="inline-block w-[1px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                  <span className="text-xs text-gray-400">↓</span>
                </>
              )}
            </span>
            <span className="text-xs text-gray-400 ml-2">[editing]</span>
          </div>
        </div>
      ) : (
        <>
          {/* Time and duration line */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-mono">
            <span className={cn(
              "text-gray-900 font-medium",
              completed && "line-through text-gray-400"
            )}>
              {time}
            </span>
            <span>·</span>
            <span className={completed && "line-through text-gray-400"}>
              {calculatedDuration}m
            </span>
            {/* Routine indicator */}
            {(type === 'routine' || metadata?.routineId) && (
              <>
                <span>·</span>
                <span className="text-gray-400 text-sm" title="Routine">⟲</span>
              </>
            )}
            {/* Meeting link for event blocks */}
            {type === 'event' && metadata?.zoomLink && (
              <>
                <span>·</span>
                <a
                  href={metadata.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  title="Join Zoom meeting"
                >
                  [join]
                </a>
              </>
            )}
            {isGrabbed && (
              <>
                <span>·</span>
                <span className="text-gray-400">[moving]</span>
              </>
            )}
            {/* Show delete hint when block is selected */}
            {hasCursorFocus && !isGrabbed && (
              <>
                <span>·</span>
                <span className="text-gray-400">
                  {tasks.length > 0 ? '⌘+⌫ to delete' : '⌘+⌫'}
                </span>
              </>
            )}
          </div>

          {/* Block title */}
          <div className="flex items-center gap-3 mb-4">
            {/* Task-less routine checkbox - only show for routine blocks with no tasks, and not when inside the block */}
            {(type === 'routine' || metadata?.routineId) && tasks.length === 0 && taskInputPosition === -2 && (
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask?.(0);
                }}
              >
                {completed ? (
                  <Check className="h-5 w-5 text-gray-400" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            )}
            <h2
              className={cn(
                "text-2xl font-normal text-gray-900 font-lora",
                completed && "line-through text-gray-400"
              )}
              onClick={onToggleCollapse}
            >
              {title}
            </h2>
          </div>
        </>
      )}

      {/* Block Note */}
      {isEditingNote ? (
        <div className="ml-16 mb-2">
          <div className={cn(
            "text-xs italic font-mono",
            completed ? "text-gray-400" : "text-gray-700"
          )}>
            {editNoteValue}
            <span className="inline-block w-[2px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
            {!editNoteValue && (
              <span className="text-gray-400 ml-2">Add note... (e.g., Started task, blocked on X, moving to Y)</span>
            )}
          </div>
        </div>
      ) : note ? (
        <div className="ml-16 mb-2">
          <div className={cn(
            "text-xs italic font-mono",
            completed ? "text-gray-400" : "text-gray-600"
          )}>
            {note}
          </div>
        </div>
      ) : null}

      {/* Tasks - Minimal indented list */}
      {!isCollapsed && tasks.length > 0 && (
        <div className="space-y-3">
          {/* Input before first task */}
          {taskInputPosition === -1 && (
            <div className="relative">
              <div className="flex items-start gap-3 py-0.5">
                {/* Empty checkbox indicator */}
                <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-1"></div>

                {isTypingTask && taskInput ? (
                  <span className="text-sm text-gray-700 font-mono flex-1 whitespace-pre">
                    {taskInput}
                    <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                    {showProjectAutocomplete && bestProjectMatch ? (
                      <span className="ml-3 text-gray-400 text-xs">
                        → Project: {bestProjectMatch.preview}
                      </span>
                    ) : bestTaskMatch ? (
                      <span className="ml-3 text-gray-400 text-xs">
                        → {bestTaskMatch.preview}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <div className="flex items-center flex-1">
                    <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                    <span className="ml-2 text-xs text-gray-400">type task name or / for options</span>
                  </div>
                )}
              </div>
              
              {/* Task command menu when typing "/" */}
              {showTaskMenu && !showTaskInput && !showTaskDuration && !showProjectSelection && !showProjectTasks && (
                <div className="absolute top-6 left-0 z-[100]">
                  <TaskCommandMenu
                    onSelect={(option) => {
                      handleTaskMenuSelect(option.id);
                    }}
                    onCancel={() => {
                      setShowTaskMenu(false);
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}
              
              {/* Task input popup */}
              {showTaskInput && (
                <div className="absolute top-6 left-0 z-[100]">
                  <TaskInputPopup
                    onConfirm={handleTaskNameConfirm}
                    onCancel={() => {
                      setShowTaskInput(false);
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}
              
              {/* Task duration popup */}
              {showTaskDuration && (
                <div className="absolute top-6 left-0 z-[100]">
                  <TaskDurationPopup
                    taskName={pendingTaskName}
                    onConfirm={handleTaskDurationConfirm}
                    onCancel={() => {
                      setShowTaskDuration(false);
                      setPendingTaskName('');
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}
              
              {/* Project selection popup */}
              {showProjectSelection && (
                <div className="absolute top-6 left-0 z-[100]">
                  <ProjectSelectionPopup
                    projects={projects}
                    onSelect={handleProjectSelect}
                    onCancel={() => {
                      setShowProjectSelection(false);
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}
              
              {/* Project tasks popup */}
              {showProjectTasks && selectedProject && (
                <div className="absolute top-6 left-0 z-[100]">
                  <ProjectTasksPopup
                    projectName={selectedProject.name || selectedProject.content || 'Project'}
                    tasks={projectTasks}
                    allBlocks={allBlocks}
                    onSelect={handleProjectTaskSelect}
                    onSelectMultiple={handleProjectTasksMultiSelect}
                    onCancel={() => {
                      setShowProjectTasks(false);
                      setSelectedProject(null);
                      setProjectTasks([]);
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}

              {/* Backlog tasks popup */}
              {showBacklogTasks && (
                <div className="absolute top-6 left-0 z-[100]">
                  <BacklogTasksPopup
                    tasks={backlogTasks}
                    allBlocks={allBlocks}
                    onSelect={handleBacklogTaskSelect}
                    onSelectMultiple={handleBacklogTasksMultiSelect}
                    onCancel={() => {
                      setShowBacklogTasks(false);
                      onTaskMenuSelect?.('cancel');
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {tasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {isEditingTask && editingTaskIndex === index ? (
                // Task edit mode display
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <Check className="h-3 w-3 text-gray-400" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-300" />
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-sm font-mono flex-1",
                    taskEditFieldFocus === 'name' ? "text-gray-900" : "text-gray-500"
                  )}>
                    {editTaskName}
                    {taskEditFieldFocus === 'name' && (
                      <span className="inline-block w-[1px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                    )}
                  </span>
                  
                  <span className="mx-1 text-gray-300">•</span>
                  
                  <span className={cn(
                    "text-sm font-mono tabular-nums",
                    taskEditFieldFocus === 'duration' ? "text-gray-900" : "text-gray-500"
                  )}>
                    {taskEditFieldFocus === 'duration' && (
                      <span className="text-xs text-gray-400 mr-1">↑</span>
                    )}
                    {editTaskDuration}m
                    {taskEditFieldFocus === 'duration' && (
                      <>
                        <span className="inline-block w-[1px] h-3 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                        <span className="text-xs text-gray-400 ml-1">↓</span>
                      </>
                    )}
                  </span>
                  
                  <span className="text-xs text-gray-400 ml-2">[editing]</span>
                </div>
              ) : (
                // Normal task display
                (() => {
                  // Check if this task is in the multi-grabbed tasks list
                  const isMultiGrabbed = grabbedTasks?.some(
                    gt => gt.blockIndex === blockIndex && gt.taskIndex === index
                  );

                  // Check if this task is in the moving group
                  const isMoving = grabbedTaskIndex !== null &&
                    index >= grabbedTaskIndex &&
                    index < grabbedTaskIndex + (grabbedTasks?.length || 1);

                  return (
                    <div
                      className={cn(
                        "flex items-start gap-3 group/task cursor-pointer",
                        selectedTaskIndex === index && "bg-gray-50 -mx-2 px-2 rounded",
                        isMoving && "opacity-50",
                        isMultiGrabbed && !isMoving && "opacity-50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask?.(index);
                      }}
                    >

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask?.(index);
                    }}
                    className="flex-shrink-0 mt-1"
                  >
                    <div className={cn(
                      "w-4 h-4 border rounded transition-colors cursor-pointer",
                      task.completed && completed
                        ? "bg-gray-400 border-gray-400"
                        : task.completed
                        ? "bg-gray-900 border-gray-900"
                        : completed
                        ? "border-gray-200 hover:border-gray-300 bg-gray-50"
                        : "border-gray-300 hover:border-gray-400"
                    )}>
                      {task.completed && (
                        <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  <p className={cn(
                    "text-gray-700 leading-relaxed font-lora flex-1",
                    task.completed && "line-through text-gray-400",
                    !task.completed && completed && "text-gray-400"
                  )}>
                    {task.title}
                  </p>

                  {task.duration > 0 && (
                    <span className={cn(
                      "ml-auto text-xs text-gray-400 font-mono flex-shrink-0",
                      task.completed && "line-through"
                    )}>
                      {task.duration}m
                    </span>
                  )}

                  {grabbedTaskIndex !== null && index >= grabbedTaskIndex && index < grabbedTaskIndex + (grabbedTasks?.length || 1) && (
                    <span className="text-xs text-gray-400 ml-2 font-mono">[moving]</span>
                  )}

                  {isMultiGrabbed && grabbedTaskIndex === null && (
                    <span className="text-xs text-gray-400 ml-2 font-mono">[grabbed]</span>
                  )}

                  {/* Show shortcuts hint when task is selected */}
                  {selectedTaskIndex === index && grabbedTaskIndex === null && !isMultiGrabbed && (
                    <span className="text-xs text-gray-400 ml-2 font-mono">
                      ⌘+↵ {task.completed ? 'uncheck' : 'check'} • ⌘+⌫ {task.projectId ? 'unassign' : 'delete'}
                    </span>
                  )}
                </div>
                  );
                })()
              )}
              
              {/* Input after this task */}
              {taskInputPosition === index && (
                <div className="relative">
                  <div className="flex items-start gap-3 py-0.5">
                    {/* Empty checkbox indicator */}
                    <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-1"></div>

                    {isTypingTask && taskInput ? (
                      <span className="text-sm text-gray-700 font-mono flex-1 whitespace-pre">
                        {taskInput}
                        <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                        {showProjectAutocomplete && bestProjectMatch ? (
                          <span className="ml-3 text-gray-400 text-xs">
                            → Project: {bestProjectMatch.preview}
                          </span>
                        ) : bestTaskMatch ? (
                          <span className="ml-3 text-gray-400 text-xs">
                            → {bestTaskMatch.preview}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <div className="flex items-center flex-1">
                        <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                        <span className="ml-2 text-xs text-gray-400">type task name or / for options</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Task command menu when typing "/" */}
                  {showTaskMenu && !showTaskInput && !showTaskDuration && !showProjectSelection && !showProjectTasks && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <TaskCommandMenu
                        onSelect={(option) => {
                          handleTaskMenuSelect(option.id);
                        }}
                        onCancel={() => {
                          setShowTaskMenu(false);
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Task input popup */}
                  {showTaskInput && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <TaskInputPopup
                        onConfirm={handleTaskNameConfirm}
                        onCancel={() => {
                          setShowTaskInput(false);
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Task duration popup */}
                  {showTaskDuration && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <TaskDurationPopup
                        taskName={pendingTaskName}
                        onConfirm={handleTaskDurationConfirm}
                        onCancel={() => {
                          setShowTaskDuration(false);
                          setPendingTaskName('');
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Project selection popup */}
                  {showProjectSelection && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <ProjectSelectionPopup
                        projects={projects}
                        onSelect={handleProjectSelect}
                        onCancel={() => {
                          setShowProjectSelection(false);
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Project tasks popup */}
                  {showProjectTasks && selectedProject && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <ProjectTasksPopup
                        projectName={selectedProject.name || selectedProject.content || 'Project'}
                        tasks={projectTasks}
                        onSelect={handleProjectTaskSelect}
                        onSelectMultiple={handleProjectTasksMultiSelect}
                        onCancel={() => {
                          setShowProjectTasks(false);
                          setSelectedProject(null);
                          setProjectTasks([]);
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}

                  {/* Backlog tasks popup */}
                  {showBacklogTasks && (
                    <div className="absolute top-6 left-0 z-[100]">
                      <BacklogTasksPopup
                        tasks={backlogTasks}
                        onSelect={handleBacklogTaskSelect}
                        onSelectMultiple={handleBacklogTasksMultiSelect}
                        onCancel={() => {
                          setShowBacklogTasks(false);
                          onTaskMenuSelect?.('cancel');
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
          
          
          
          {/* Show hint when selected but not typing */}
          {isSelected && !isTypingTask && selectedTaskIndex !== null && (
            <div className="text-xs text-gray-300 mt-1">
              t new task • d delete • e edit • Space toggle
            </div>
          )}
        </div>
      )}
      
      {/* Empty state / Input */}
      {!isCollapsed && tasks.length === 0 && taskInputPosition === -1 && (
        <div className="py-1 relative">
          <div className="flex items-start gap-3 py-0.5">
            {/* Empty checkbox indicator */}
            <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 mt-1"></div>

            {isTypingTask ? (
              <span className="text-sm text-gray-700 font-mono flex-1 whitespace-pre">
                {taskInput}
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                {showProjectAutocomplete && bestProjectMatch ? (
                  <span className="ml-3 text-gray-400 text-xs">
                    → Project: {bestProjectMatch.preview}
                  </span>
                ) : bestTaskMatch ? (
                  <span className="ml-3 text-gray-400 text-xs">
                    → {bestTaskMatch.preview}
                  </span>
                ) : null}
              </span>
            ) : (
              <div className="flex items-center flex-1">
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                <span className="ml-2 text-xs text-gray-400">type task name or / for options</span>
              </div>
            )}
          </div>
          
          {/* Task command menu - only show if no popups are open */}
          {showTaskMenu && !showTaskInput && !showTaskDuration && !showProjectSelection && !showProjectTasks && (
            <div className="absolute top-6 left-0 z-[100]">
              <TaskCommandMenu
                onSelect={(option) => {
                  handleTaskMenuSelect(option.id);
                }}
                onCancel={() => {
                  setShowTaskMenu(false);
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}
          
          {/* Task input popup */}
          {showTaskInput && (
            <div className="absolute top-6 left-0 z-[100]">
              <TaskInputPopup
                onConfirm={handleTaskNameConfirm}
                onCancel={() => {
                  setShowTaskInput(false);
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}
          
          {/* Task duration popup */}
          {showTaskDuration && (
            <div className="absolute top-6 left-0 z-[100]">
              <TaskDurationPopup
                taskName={pendingTaskName}
                onConfirm={handleTaskDurationConfirm}
                onCancel={() => {
                  setShowTaskDuration(false);
                  setPendingTaskName('');
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}
          
          {/* Project selection popup */}
          {showProjectSelection && (
            <div className="absolute top-6 left-0 z-[100]">
              <ProjectSelectionPopup
                projects={projects}
                onSelect={handleProjectSelect}
                onCancel={() => {
                  setShowProjectSelection(false);
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}
          
          {/* Project tasks popup */}
          {showProjectTasks && selectedProject && (
            <div className="absolute top-6 left-0 z-[100]">
              <ProjectTasksPopup
                projectName={selectedProject.name || selectedProject.content || 'Project'}
                tasks={projectTasks}
                onSelect={handleProjectTaskSelect}
                onSelectMultiple={handleProjectTasksMultiSelect}
                onCancel={() => {
                  setShowProjectTasks(false);
                  setSelectedProject(null);
                  setProjectTasks([]);
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}

          {/* Backlog tasks popup */}
          {showBacklogTasks && (
            <div className="absolute top-6 left-0 z-[100]">
              <BacklogTasksPopup
                tasks={backlogTasks}
                onSelect={handleBacklogTaskSelect}
                onSelectMultiple={handleBacklogTasksMultiSelect}
                onCancel={() => {
                  setShowBacklogTasks(false);
                  onTaskMenuSelect?.('cancel');
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Not selected empty state - don't show for task-less routines */}
      {!isCollapsed && tasks.length === 0 && !isSelected && !(type === 'routine' || metadata?.routineId) && (
        <p className="text-gray-400 italic font-lora">
          No tasks scheduled
        </p>
      )}
    </div>
  );
};

export default Block;