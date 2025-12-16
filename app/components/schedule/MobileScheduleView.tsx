"use client";

import React, { useState } from 'react';
import { Check, Circle, Plus, Menu, Edit2, Trash2, GripVertical, StickyNote, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Brain, Users, Coffee, FileText, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Block as BlockType } from '@/app/utils/scheduleUtils';

interface MobileScheduleViewProps {
  blocks: BlockType[];
  currentDay: 'today' | 'tomorrow';
  currentTime: Date;
  user: any;
  onToggleTask: (blockIndex: number, taskIndex: number) => void;
  onDayChange: (day: 'today' | 'tomorrow') => void;
  onAddBlock: (blockData: Partial<BlockType>, insertAfterIndex?: number) => Promise<number>;
  onAddTask: (blockIndex: number, taskData: { title: string; duration: number; projectId?: string; taskId?: string }) => Promise<void>;
  onUpdateBlock: (blockIndex: number, blockData: { time?: string; title?: string; type?: string; duration?: number; note?: string }) => Promise<void>;
  onDeleteBlock: (blockIndex: number) => Promise<void>;
  onDeleteTask: (blockIndex: number, taskIndex: number) => Promise<void>;
  onToggleBlockCompletion: (blockIndex: number) => Promise<void>;
  dayId: string | null;
  routinesData?: any[];
  eventsData?: any[];
  projectsData?: any[];
  adminTasksData?: any[];
}

export default function MobileScheduleView({
  blocks,
  currentDay,
  currentTime,
  user,
  onToggleTask,
  onDayChange,
  onAddBlock,
  onAddTask,
  onUpdateBlock,
  onDeleteBlock,
  onDeleteTask,
  onToggleBlockCompletion,
  dayId,
  routinesData = [],
  eventsData = [],
  projectsData = [],
  adminTasksData = []
}: MobileScheduleViewProps) {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [showActionBar, setShowActionBar] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState<'none' | 'add-block'>('none');
  const [editTaskMode, setEditTaskMode] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDuration, setEditTaskDuration] = useState('30');
  const [editBlockMode, setEditBlockMode] = useState(false);
  const [addNoteMode, setAddNoteMode] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Add block flow state
  const [addBlockStep, setAddBlockStep] = useState<'idle' | 'select-type' | 'select-routine' | 'select-event' | 'set-details'>('idle');
  const [selectedBlockType, setSelectedBlockType] = useState<string>('');
  const [blockTime, setBlockTime] = useState<string>('09:00');
  const [blockDuration, setBlockDuration] = useState<string>('1h');

  // Routine carousel state
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState<number>(0);

  // Event selection state
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

  // Add task flow state
  const [addTaskMode, setAddTaskMode] = useState(false);
  const [addTaskPosition, setAddTaskPosition] = useState<number | null>(null);
  const [addTaskStep, setAddTaskStep] = useState<'select-type' | 'new-task' | 'select-project-task' | 'select-admin-task'>('select-type');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDuration, setTaskDuration] = useState<string>('30');
  const [selectedProjectTaskIndex, setSelectedProjectTaskIndex] = useState<number | null>(null);
  const [selectedAdminTaskIndex, setSelectedAdminTaskIndex] = useState<number | null>(null);

  // Edit block state
  const [editBlockTime, setEditBlockTime] = useState<string>('09:00');
  const [editBlockTitle, setEditBlockTitle] = useState<string>('');
  const [editBlockType, setEditBlockType] = useState<string>('deep-work');
  const [editBlockDuration, setEditBlockDuration] = useState<string>('60');
  const [editBlockNote, setEditBlockNote] = useState<string>('');

  // Move mode state (for blocks)
  const [moveMode, setMoveMode] = useState<'idle' | 'moving' | 'confirm-time'>('idle');
  const [newBlockTime, setNewBlockTime] = useState<string>('09:00');
  const [localBlocks, setLocalBlocks] = useState<BlockType[]>([]);

  // Task move mode state
  const [taskMoveMode, setTaskMoveMode] = useState<'idle' | 'moving-within'>('idle');
  const [localTaskBlocks, setLocalTaskBlocks] = useState<BlockType[]>([]);

  // Gesture state
  const [lastTap, setLastTap] = useState<{ index: number; time: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [addBlockPosition, setAddBlockPosition] = useState<number | null>(null); // Position to insert new block

  // Inline task input state
  const [inlineTaskInputVisible, setInlineTaskInputVisible] = useState(false);
  const [inlineTaskInsertPosition, setInlineTaskInsertPosition] = useState<{ blockIndex: number; taskIndex: number } | null>(null);
  const [inlineTaskInputValue, setInlineTaskInputValue] = useState('');
  const [inlineTaskType, setInlineTaskType] = useState<'new' | 'project' | 'admin'>('new');
  const [showInlineTaskTypeMenu, setShowInlineTaskTypeMenu] = useState(false);
  const [inlineTaskSelectedProjectIndex, setInlineTaskSelectedProjectIndex] = useState<number | null>(null);
  const [inlineTaskSelectedAdminIndex, setInlineTaskSelectedAdminIndex] = useState<number | null>(null);
  const [inlineTaskLongPressTimer, setInlineTaskLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup inline task timer on unmount
  React.useEffect(() => {
    return () => {
      if (inlineTaskLongPressTimer) {
        clearTimeout(inlineTaskLongPressTimer);
      }
    };
  }, [inlineTaskLongPressTimer]);

  // Inline task input handlers
  const handleTaskGapLongPressStart = (blockIndex: number, taskIndex: number) => {
    const timer = setTimeout(() => {
      // Long press detected - show inline input
      setInlineTaskInsertPosition({ blockIndex, taskIndex });
      setInlineTaskInputVisible(true);
      setInlineTaskInputValue('');
      setInlineTaskType('new');
      setShowInlineTaskTypeMenu(false);
      setInlineTaskSelectedProjectIndex(null);
      setInlineTaskSelectedAdminIndex(null);

      // Hide other UI elements
      setShowActionBar(false);
      setSelectedBlock(null);
      setSelectedTask(null);
      setAddTaskMode(false);
    }, 500);
    setInlineTaskLongPressTimer(timer);
  };

  const handleTaskGapLongPressEnd = () => {
    if (inlineTaskLongPressTimer) {
      clearTimeout(inlineTaskLongPressTimer);
      setInlineTaskLongPressTimer(null);
    }
  };

  const handleBlockTap = (index: number) => {
    // Hide inline task input when interacting with other UI
    if (inlineTaskInputVisible) {
      setInlineTaskInputVisible(false);
      setInlineTaskInputValue('');
      setInlineTaskInsertPosition(null);
      setInlineTaskType('new');
      setShowInlineTaskTypeMenu(false);
      setInlineTaskSelectedProjectIndex(null);
      setInlineTaskSelectedAdminIndex(null);
    }

    // Check for double tap
    if (lastTap && lastTap.index === index && Date.now() - lastTap.time < 300) {
      // Double tap - toggle completion
      onToggleBlockCompletion(index);
      setLastTap(null);
    } else {
      // Single tap - show action bar
      setLastTap({ index, time: Date.now() });
      if (selectedBlock === index) {
        setShowActionBar(true);
      } else {
        setSelectedBlock(index);
        setSelectedTask(null);
        setShowActionBar(true);
      }
    }
  };

  const handleBlockMouseDown = (index: number) => {
    // Start long press timer
    const timer = setTimeout(() => {
      // Long press - enter move mode
      setSelectedBlock(index);
      handleStartMove();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleBlockMouseUp = () => {
    // Cancel long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleGapTap = (position: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    // Single tap on gap - start add block flow at position
    setAddBlockPosition(position);
    handleStartAddBlock();
  };

  const handleTaskTap = (blockIndex: number, taskIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // Hide inline task input when interacting with other UI
    if (inlineTaskInputVisible) {
      setInlineTaskInputVisible(false);
      setInlineTaskInputValue('');
      setInlineTaskInsertPosition(null);
      setInlineTaskType('new');
      setShowInlineTaskTypeMenu(false);
      setInlineTaskSelectedProjectIndex(null);
      setInlineTaskSelectedAdminIndex(null);
    }

    setSelectedBlock(blockIndex);
    setSelectedTask(taskIndex);
    setShowActionBar(true);
  };

  const handleTaskToggle = (blockIndex: number, taskIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleTask(blockIndex, taskIndex);
  };

  // Add block flow handlers
  const handleStartAddBlock = () => {
    // Hide inline task input when starting other actions
    if (inlineTaskInputVisible) {
      setInlineTaskInputVisible(false);
      setInlineTaskInputValue('');
      setInlineTaskInsertPosition(null);
      setInlineTaskType('new');
      setShowInlineTaskTypeMenu(false);
      setInlineTaskSelectedProjectIndex(null);
      setInlineTaskSelectedAdminIndex(null);
    }

    setAddBlockStep('select-type');
    setShowActionBar(false);
    setSelectedBlock(null);
    setSelectedTask(null);
  };

  const handleSelectBlockType = (type: string) => {
    setSelectedBlockType(type);

    // If routine is selected and we have routines, show carousel
    if (type === 'routine' && routinesData.length > 0) {
      console.log('[MobileSchedule] Routines available:', routinesData);
      setCurrentRoutineIndex(0);
      setAddBlockStep('select-routine');
    } else if (type === 'event' && eventsData.length > 0) {
      console.log('[MobileSchedule] Events available:', eventsData);
      setSelectedEventIndex(null);
      setAddBlockStep('select-event');
    } else {
      console.log('[MobileSchedule] No special items or different type:', { type, routinesCount: routinesData.length, eventsCount: eventsData.length });
      setAddBlockStep('set-details');
    }
  };

  const handleCancelAddBlock = () => {
    setAddBlockStep('idle');
    setSelectedBlockType('');
    setBlockTime('09:00');
    setBlockDuration('1h');
  };

  const handleConfirmAddBlock = async () => {
    // Convert duration string to minutes
    const durationInMinutes = blockDuration.endsWith('h')
      ? parseInt(blockDuration) * 60
      : parseInt(blockDuration);

    // If this is an event block, use the selected event's data
    if (selectedBlockType === 'event' && selectedEventIndex !== null && eventsData.length > 0) {
      const selectedEvent = eventsData[selectedEventIndex];

      const eventName = selectedEvent.name || selectedEvent.content || 'Unnamed Event';
      const startTime = selectedEvent.startTime || selectedEvent.metadata?.startTime || blockTime;
      const endTime = selectedEvent.endTime || selectedEvent.metadata?.endTime || '10:00';
      const zoomLink = selectedEvent.zoomLink || selectedEvent.metadata?.zoomLink;
      const location = selectedEvent.location || selectedEvent.metadata?.location;
      const isRecurring = selectedEvent.isRecurring || selectedEvent.metadata?.isRecurring;

      // Calculate duration from start and end times
      const calculateDuration = (start: string, end: string) => {
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes - startMinutes;
      };

      await onAddBlock({
        time: startTime,
        title: eventName,
        type: 'event',
        duration: calculateDuration(startTime, endTime),
        tasks: [],
        metadata: {
          eventId: selectedEvent._id || selectedEvent.id,
          zoomLink,
          location,
          isRecurring,
          endTime
        }
      }, blocks.length - 1);
    } else if (selectedBlockType === 'routine' && routinesData.length > 0) {
      // If this is a routine block, use the selected routine's data
      const selectedRoutine = routinesData[currentRoutineIndex];

      // Calculate duration from routine's tasks if not explicitly set
      const routineTasks = selectedRoutine.tasks || [];
      let totalDuration = selectedRoutine.duration || durationInMinutes;
      if (!selectedRoutine.duration && routineTasks.length > 0) {
        totalDuration = routineTasks.reduce((sum: number, task: any) => {
          const taskDuration = typeof task.duration === 'number' ? task.duration :
                             typeof task.metadata?.duration === 'string' ? parseInt(task.metadata.duration) : 30;
          return sum + taskDuration;
        }, 0);
      }

      await onAddBlock({
        time: blockTime,
        title: selectedRoutine.name || 'Routine',
        type: 'routine',
        duration: totalDuration,
        tasks: routineTasks.map((task: any) => ({
          id: task._id || task.id || `temp-task-${Date.now()}-${Math.random()}`,
          title: task.name || task.content || task.title || "Untitled task",
          duration: typeof task.duration === 'number' ? task.duration :
                   typeof task.metadata?.duration === 'string' ? parseInt(task.metadata.duration) : 30,
          completed: false
        })),
        metadata: {
          routineId: selectedRoutine._id || selectedRoutine.id,
          routineName: selectedRoutine.name,
          startTime: blockTime,
          duration: totalDuration,
          days: selectedRoutine.days || selectedRoutine.metadata?.days || []
        }
      }, blocks.length - 1);
    } else {
      // Regular block creation
      await onAddBlock({
        time: blockTime,
        title: blockTypes.find(t => t.id === selectedBlockType)?.label || 'New Block',
        type: selectedBlockType,
        duration: durationInMinutes,
        tasks: [],
      }, blocks.length - 1);
    }

    handleCancelAddBlock();
  };

  // Move mode handlers
  const handleStartMove = () => {
    if (selectedBlock !== null) {
      setLocalBlocks([...blocks]); // Copy current blocks to local state
      setMoveMode('moving');
      setNewBlockTime(blocks[selectedBlock]?.time || '09:00');
    }
  };

  const handleMoveUp = () => {
    if (selectedBlock !== null && selectedBlock > 0) {
      // Swap blocks in local array
      const newBlocks = [...localBlocks];
      [newBlocks[selectedBlock - 1], newBlocks[selectedBlock]] = [newBlocks[selectedBlock], newBlocks[selectedBlock - 1]];
      setLocalBlocks(newBlocks);
      setSelectedBlock(selectedBlock - 1);
    }
  };

  const handleMoveDown = () => {
    if (selectedBlock !== null && selectedBlock < localBlocks.length - 1) {
      // Swap blocks in local array
      const newBlocks = [...localBlocks];
      [newBlocks[selectedBlock], newBlocks[selectedBlock + 1]] = [newBlocks[selectedBlock + 1], newBlocks[selectedBlock]];
      setLocalBlocks(newBlocks);
      setSelectedBlock(selectedBlock + 1);
    }
  };

  const handleDoneMoving = () => {
    setMoveMode('confirm-time');
  };

  const handleConfirmMove = () => {
    // TODO: Call API to update block position and time with:
    // - localBlocks array (new order)
    // - newBlockTime (new start time for the moved block)
    // - selectedBlock (index of the block that was moved)
    console.log('Move confirmed:', {
      newOrder: localBlocks.map(b => b.id || b._id),
      movedBlock: selectedBlock,
      newTime: newBlockTime
    });

    setMoveMode('idle');
    setShowActionBar(false);
    setSelectedBlock(null);
    setLocalBlocks([]);
  };

  const handleCancelMove = () => {
    setMoveMode('idle');
    setShowActionBar(false);
    setSelectedBlock(null);
    setLocalBlocks([]);
  };

  // Add task handlers
  const handleStartAddTask = () => {
    // Hide inline task input when starting other actions
    if (inlineTaskInputVisible) {
      setInlineTaskInputVisible(false);
      setInlineTaskInputValue('');
      setInlineTaskInsertPosition(null);
      setInlineTaskType('new');
      setShowInlineTaskTypeMenu(false);
      setInlineTaskSelectedProjectIndex(null);
      setInlineTaskSelectedAdminIndex(null);
    }

    setAddTaskMode(true);
    setAddTaskStep('select-type');
    setShowActionBar(false);
    setTaskTitle('');
    setTaskDuration('30');
    setSelectedProjectTaskIndex(null);
    setSelectedAdminTaskIndex(null);
  };

  const handleCancelAddTask = () => {
    setAddTaskMode(false);
    setAddTaskStep('select-type');
    setAddTaskPosition(null);
    setTaskTitle('');
    setTaskDuration('30');
    setSelectedProjectTaskIndex(null);
    setSelectedAdminTaskIndex(null);
  };

  const handleSelectTaskType = (type: 'new-task' | 'select-project-task' | 'select-admin-task') => {
    setAddTaskStep(type);
  };

  // Get all tasks from all projects
  const getAllProjectTasks = () => {
    const allTasks: any[] = [];
    projectsData.forEach(project => {
      if (project.tasks && Array.isArray(project.tasks)) {
        project.tasks.forEach((task: any) => {
          allTasks.push({
            ...task,
            projectId: project.id || project._id,
            projectName: project.name || project.content
          });
        });
      }
    });
    return allTasks;
  };

  const handleConfirmAddTask = async () => {
    if (selectedBlock === null) return;

    if (addTaskStep === 'new-task' && taskTitle.trim()) {
      // Add new task
      await onAddTask(selectedBlock, {
        title: taskTitle,
        duration: parseInt(taskDuration) || 30,
      });
    } else if (addTaskStep === 'select-project-task' && selectedProjectTaskIndex !== null) {
      // Add reference to project task
      const allProjectTasks = getAllProjectTasks();
      const selectedTask = allProjectTasks[selectedProjectTaskIndex];
      await onAddTask(selectedBlock, {
        title: selectedTask.name || selectedTask.content || selectedTask.title,
        duration: selectedTask.duration || 30,
        projectId: selectedTask.projectId,
        taskId: selectedTask._id || selectedTask.id
      });
    } else if (addTaskStep === 'select-admin-task' && selectedAdminTaskIndex !== null) {
      // Add reference to admin task
      const selectedTask = adminTasksData[selectedAdminTaskIndex];
      await onAddTask(selectedBlock, {
        title: selectedTask.name || selectedTask.content || selectedTask.title,
        duration: selectedTask.duration || 30,
        taskId: selectedTask._id || selectedTask.id
      });
    }

    // Reset form
    setAddTaskMode(false);
    setAddTaskStep('select-type');
    setAddTaskPosition(null);
    setTaskTitle('');
    setTaskDuration('30');
    setSelectedProjectTaskIndex(null);
    setSelectedAdminTaskIndex(null);
    setShowActionBar(false);
  };

  // Task move handlers
  const handleStartTaskMove = () => {
    if (selectedBlock !== null && selectedTask !== null) {
      setLocalTaskBlocks([...blocks]); // Copy current blocks to local state
      setTaskMoveMode('moving-within');
    }
  };

  const handleTaskMoveUp = () => {
    if (selectedBlock === null || selectedTask === null) return;

    const newBlocks = [...localTaskBlocks];
    const block = newBlocks[selectedBlock];

    if (!block.tasks) return;

    // If at the top of current block, move to previous block
    if (selectedTask === 0) {
      // Check if there's a previous block
      if (selectedBlock > 0) {
        const prevBlock = newBlocks[selectedBlock - 1];
        if (!prevBlock.tasks) prevBlock.tasks = [];

        // Remove task from current block
        const [movedTask] = block.tasks.splice(selectedTask, 1);

        // Add task to end of previous block
        prevBlock.tasks.push(movedTask);

        // Update durations
        block.duration = block.tasks.reduce((sum, t) => sum + t.duration, 0);
        prevBlock.duration = prevBlock.tasks.reduce((sum, t) => sum + t.duration, 0);

        setLocalTaskBlocks(newBlocks);
        setSelectedBlock(selectedBlock - 1);
        setSelectedTask(prevBlock.tasks.length - 1);
      }
    } else {
      // Swap tasks within the block
      [block.tasks[selectedTask - 1], block.tasks[selectedTask]] =
        [block.tasks[selectedTask], block.tasks[selectedTask - 1]];

      setLocalTaskBlocks(newBlocks);
      setSelectedTask(selectedTask - 1);
    }
  };

  const handleTaskMoveDown = () => {
    if (selectedBlock === null || selectedTask === null) return;

    const newBlocks = [...localTaskBlocks];
    const block = newBlocks[selectedBlock];

    if (!block.tasks) return;

    // If at the bottom of current block, move to next block
    if (selectedTask === block.tasks.length - 1) {
      // Check if there's a next block
      if (selectedBlock < newBlocks.length - 1) {
        const nextBlock = newBlocks[selectedBlock + 1];
        if (!nextBlock.tasks) nextBlock.tasks = [];

        // Remove task from current block
        const [movedTask] = block.tasks.splice(selectedTask, 1);

        // Add task to beginning of next block
        nextBlock.tasks.unshift(movedTask);

        // Update durations
        block.duration = block.tasks.reduce((sum, t) => sum + t.duration, 0);
        nextBlock.duration = nextBlock.tasks.reduce((sum, t) => sum + t.duration, 0);

        setLocalTaskBlocks(newBlocks);
        setSelectedBlock(selectedBlock + 1);
        setSelectedTask(0);
      }
    } else {
      // Swap tasks within the block
      [block.tasks[selectedTask], block.tasks[selectedTask + 1]] =
        [block.tasks[selectedTask + 1], block.tasks[selectedTask]];

      setLocalTaskBlocks(newBlocks);
      setSelectedTask(selectedTask + 1);
    }
  };

  const handleConfirmTaskMove = () => {
    // TODO: Call API to update task position
    console.log('Task move confirmed:', {
      newOrder: localTaskBlocks.map(b => ({
        blockId: b.id || b._id,
        tasks: b.tasks?.map(t => t.id || t._id)
      })),
      movedTask: selectedTask,
      fromBlock: blocks.findIndex(b => b.id === localTaskBlocks[selectedBlock!]?.id)
    });

    setTaskMoveMode('idle');
    setShowActionBar(false);
    setSelectedBlock(null);
    setSelectedTask(null);
    setLocalTaskBlocks([]);
  };

  const handleCancelTaskMove = () => {
    setTaskMoveMode('idle');
    setShowActionBar(false);
    setSelectedTask(null);
    setLocalTaskBlocks([]);
  };

  // Edit block handlers
  const handleStartEditBlock = () => {
    if (selectedBlock !== null) {
      const block = blocks[selectedBlock];
      setEditBlockTime(block.time || '09:00');
      setEditBlockTitle(block.title || '');
      setEditBlockType(block.type || 'deep-work');
      setEditBlockDuration(String(block.duration || 60));
      setEditBlockNote(block.note || '');
      setEditBlockMode(true);
      setShowActionBar(false);
    }
  };

  const handleConfirmEditBlock = async () => {
    if (selectedBlock !== null) {
      const blockData = {
        time: editBlockTime,
        title: editBlockTitle,
        type: editBlockType,
        duration: parseInt(editBlockDuration),
        note: editBlockNote
      };

      await onUpdateBlock(selectedBlock, blockData);

      setEditBlockMode(false);
      setShowActionBar(false);
      setSelectedBlock(null);
    }
  };

  // Calculate display date
  const displayDate = currentDay === 'today'
    ? new Date()
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const blockTypes = [
    { id: 'deep-work', label: 'Deep Work', icon: Brain },
    { id: 'meeting', label: 'Meeting', icon: Users },
    { id: 'break', label: 'Break', icon: Coffee },
    { id: 'admin', label: 'Admin', icon: FileText },
    { id: 'event', label: 'Event', icon: CalendarIcon },
    { id: 'routine', label: 'Routine', icon: RefreshCw },
  ];

  const durationOptions = [
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '2h', label: '2h' },
    { value: '3h', label: '3h' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white px-4 py-3">
        <button
          onClick={() => onDayChange(currentDay === 'today' ? 'tomorrow' : 'today')}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 font-mono active:text-gray-900 transition-colors"
        >
          {currentDay === 'tomorrow' && (
            <ChevronLeft className="w-4 h-4" />
          )}
          <span>
            {displayDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })} • {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {currentDay === 'today' && (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 space-y-4">
          {(moveMode === 'moving' || moveMode === 'confirm-time' ? localBlocks : taskMoveMode !== 'idle' ? localTaskBlocks : blocks).map((block, blockIndex) => (
            <div
              key={block.id || block._id}
              className="relative"
            >
              {/* Gap overlay above block - only visible on hover */}
              <div
                className="absolute -top-4 left-0 right-0 h-4 flex items-end justify-center group cursor-pointer z-10"
                onClick={(e) => handleGapTap(blockIndex, e)}
              >
                <div className="hidden group-hover:flex items-center justify-center bg-gray-100 px-2 py-0.5 rounded">
                  <Plus className="w-3 h-3 text-gray-500" />
                </div>
              </div>

              <div
                onClick={() => handleBlockTap(blockIndex)}
                onMouseDown={() => handleBlockMouseDown(blockIndex)}
                onMouseUp={handleBlockMouseUp}
                onMouseLeave={handleBlockMouseUp}
                onTouchStart={() => handleBlockMouseDown(blockIndex)}
                onTouchEnd={handleBlockMouseUp}
                onTouchCancel={handleBlockMouseUp}
                className={`pb-4 transition-all ${
                  selectedBlock === blockIndex && selectedTask === null
                    ? 'bg-gray-50'
                    : ''
                }`}
              >
              {/* Block Header */}
              <div>
                {/* Time and title on same line, duration on right */}
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-500 font-mono">{block.time}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <h3 className={`text-base font-normal font-mono ${block.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {block.title}
                    </h3>
                  </div>
                  {block.duration && block.duration > 0 && (
                    <span className={`text-sm tabular-nums font-mono flex-shrink-0 ${block.completed ? 'line-through text-gray-400' : 'text-gray-400'}`}>
                      {block.duration}m
                    </span>
                  )}
                </div>

                {/* Note */}
                {block.note && (
                  <div className={`text-sm italic mb-2 font-mono ${block.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                    {block.note}
                  </div>
                )}

                {/* Tasks */}
                {block.tasks && block.tasks.length > 0 && (
                  <div className="space-y-1">
                    {block.tasks.map((task, taskIndex) => (
                      <div key={task.id || task._id || taskIndex} className="relative">
                        {/* Gap overlay above task - long press to add inline */}
                        <div
                          className="absolute -top-2 left-0 right-0 h-2 flex items-end justify-center group cursor-pointer z-10"
                          onTouchStart={() => handleTaskGapLongPressStart(blockIndex, taskIndex)}
                          onTouchEnd={handleTaskGapLongPressEnd}
                          onTouchCancel={handleTaskGapLongPressEnd}
                          onMouseDown={() => handleTaskGapLongPressStart(blockIndex, taskIndex)}
                          onMouseUp={handleTaskGapLongPressEnd}
                          onMouseLeave={handleTaskGapLongPressEnd}
                        >
                          <div className="hidden group-hover:flex items-center justify-center bg-gray-100 px-2 py-0.5 rounded">
                            <Plus className="w-3 h-3 text-gray-500" />
                          </div>
                        </div>

                        {/* Inline Task Input - appears ABOVE the task */}
                        {inlineTaskInputVisible &&
                         inlineTaskInsertPosition?.blockIndex === blockIndex &&
                         inlineTaskInsertPosition?.taskIndex === taskIndex && (
                          <div className="mb-2 pl-4 pr-0">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={inlineTaskInputValue}
                                onChange={(e) => setInlineTaskInputValue(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && inlineTaskInputValue.trim()) {
                                    if (inlineTaskType === 'new') {
                                      // Fast path: Create new task with 30min default
                                      await onAddTask(blockIndex, {
                                        title: inlineTaskInputValue.trim(),
                                        duration: 30,
                                      });

                                      // Reset inline input
                                      setInlineTaskInputVisible(false);
                                      setInlineTaskInputValue('');
                                      setInlineTaskInsertPosition(null);
                                      setInlineTaskType('new');
                                      setShowInlineTaskTypeMenu(false);
                                    }
                                    // For project/admin types, Enter key does nothing
                                    // User must select from the list after choosing type
                                  } else if (e.key === 'Escape') {
                                    // Cancel on Escape
                                    setInlineTaskInputVisible(false);
                                    setInlineTaskInputValue('');
                                    setInlineTaskInsertPosition(null);
                                    setInlineTaskType('new');
                                    setShowInlineTaskTypeMenu(false);
                                  }
                                }}
                                placeholder="Type task name..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-gray-500"
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInlineTaskTypeMenu(true);
                                }}
                                className="text-xs text-gray-400 font-mono hover:text-gray-600 cursor-pointer touch-manipulation"
                              >
                                tap for more options
                              </button>
                            </div>
                          </div>
                        )}

                        <div
                          onClick={(e) => handleTaskTap(blockIndex, taskIndex, e)}
                          className={`flex items-center gap-3 py-1 pl-4 transition-colors touch-manipulation ${
                            selectedBlock === blockIndex && selectedTask === taskIndex
                              ? 'bg-gray-100'
                              : ''
                          }`}
                        >
                          <button
                            className="flex-shrink-0 touch-manipulation"
                            onClick={(e) => handleTaskToggle(blockIndex, taskIndex, e)}
                          >
                            {task.completed ? (
                              <Check className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300" />
                            )}
                          </button>
                          <span className={`flex-1 text-base font-mono ${
                            task.completed || block.completed
                              ? 'line-through text-gray-400'
                              : 'text-gray-700'
                          }`}>
                            {task.title}
                          </span>
                          {task.duration && (
                            <span className={`text-sm tabular-nums font-mono ${
                              task.completed || block.completed ? 'text-gray-400' : 'text-gray-400'
                            }`}>
                              {task.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Task Button */}
                {selectedBlock === blockIndex && selectedTask === null && !addTaskMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartAddTask();
                    }}
                    className="mt-3 w-full py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded hover:border-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                  >
                    + Add task
                  </button>
                )}
              </div>
            </div>
            </div>
          ))}

          {/* Add Block Button - Inline */}
          {addBlockStep === 'idle' && (
            <button
              onClick={handleStartAddBlock}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors touch-manipulation flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Block</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Bar (when something is selected) */}
      {showActionBar && (selectedBlock !== null) && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
            <div className={`grid gap-2 ${moveMode === 'moving' ? 'grid-cols-3' : taskMoveMode === 'moving-within' ? 'grid-cols-3' : selectedTask !== null ? 'grid-cols-4' : 'grid-cols-5'}`}>
              {selectedTask !== null && taskMoveMode === 'moving-within' ? (
                <>
                  {/* Task move mode: Up/Down/Done */}
                  <button
                    onClick={handleTaskMoveUp}
                    disabled={selectedBlock === 0 && selectedTask === 0}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-30"
                  >
                    <ArrowUp className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Up</span>
                  </button>
                  <button
                    onClick={handleTaskMoveDown}
                    disabled={
                      selectedBlock === localTaskBlocks.length - 1 &&
                      selectedTask === (localTaskBlocks[selectedBlock]?.tasks?.length || 0) - 1
                    }
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-30"
                  >
                    <ArrowDown className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Down</span>
                  </button>
                  <button
                    onClick={handleConfirmTaskMove}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Done</span>
                  </button>
                </>
              ) : selectedTask !== null ? (
                <>
                  <button
                    onClick={() => {
                      if (selectedBlock !== null && selectedTask !== null) {
                        const task = blocks[selectedBlock]?.tasks?.[selectedTask];
                        setEditTaskTitle(task?.title || '');
                        setEditTaskDuration(String(task?.duration || 30));
                        setEditTaskMode(true);
                        setShowActionBar(false);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Edit</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedBlock !== null && selectedTask !== null) {
                        await onToggleTask(selectedBlock, selectedTask);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Complete</span>
                  </button>
                  <button
                    onClick={handleStartTaskMove}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <GripVertical className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Move</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedBlock !== null && selectedTask !== null) {
                        await onDeleteTask(selectedBlock, selectedTask);
                        setShowActionBar(false);
                        setSelectedBlock(null);
                        setSelectedTask(null);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-red-50 touch-manipulation"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-xs text-red-600 font-mono">Delete</span>
                  </button>
                </>
              ) : moveMode === 'moving' ? (
                <>
                  {/* Move mode: Up/Down/Done */}
                  <button
                    onClick={handleMoveUp}
                    disabled={selectedBlock === 0}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-30"
                  >
                    <ArrowUp className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Up</span>
                  </button>
                  <button
                    onClick={handleMoveDown}
                    disabled={selectedBlock === localBlocks.length - 1}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation disabled:opacity-30"
                  >
                    <ArrowDown className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Down</span>
                  </button>
                  <button
                    onClick={handleDoneMoving}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Done</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Normal block actions */}
                  <button
                    onClick={handleStartEditBlock}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBlock !== null) {
                        const block = blocks[selectedBlock];
                        setNoteText(block.note || '');
                        setAddNoteMode(true);
                        setShowActionBar(false);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <StickyNote className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Note</span>
                  </button>
                  <button
                    onClick={handleStartMove}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <GripVertical className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Move</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedBlock !== null) {
                        await onToggleBlockCompletion(selectedBlock);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 font-mono">Complete</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedBlock !== null) {
                        await onDeleteBlock(selectedBlock);
                        setShowActionBar(false);
                        setSelectedBlock(null);
                        setSelectedTask(null);
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 active:bg-red-50 touch-manipulation"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-xs text-red-600 font-mono">Delete</span>
                  </button>
                </>
              )}
            </div>
        </div>
      )}

      {/* Time Confirmation Bar (after moving) */}
      {moveMode === 'confirm-time' && selectedBlock !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-700">Set new start time:</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Time picker */}
              <input
                type="time"
                value={newBlockTime}
                onChange={(e) => setNewBlockTime(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />

              {/* Confirm button */}
              <button
                onClick={handleConfirmMove}
                className="p-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 active:bg-gray-700 touch-manipulation transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Cancel button */}
              <button
                onClick={handleCancelMove}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Action Bar */}
      {editTaskMode && selectedBlock !== null && selectedTask !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Edit Task</span>
              <button
                onClick={() => {
                  setEditTaskMode(false);
                  setShowActionBar(true);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Task Title Input */}
              <input
                type="text"
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="Task name"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                autoFocus
              />

              {/* Duration Input */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-mono whitespace-nowrap">Duration:</label>
                <input
                  type="number"
                  value={editTaskDuration}
                  onChange={(e) => setEditTaskDuration(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                  min="1"
                />
                <span className="text-xs text-gray-600 font-mono">min</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={async () => {
                if (selectedBlock !== null && selectedTask !== null && editTaskTitle.trim()) {
                  await onUpdateTask(selectedBlock, selectedTask, {
                    title: editTaskTitle,
                    duration: parseInt(editTaskDuration)
                  });
                  setEditTaskMode(false);
                  setSelectedBlock(null);
                  setSelectedTask(null);
                }
              }}
              disabled={!editTaskTitle.trim()}
              className="w-full py-2 bg-gray-900 text-white font-mono text-sm rounded touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Edit Block Action Bar */}
      {editBlockMode && selectedBlock !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50 max-h-[80vh] overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Edit Block</span>
              <button
                onClick={() => {
                  setEditBlockMode(false);
                  setShowActionBar(true);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-1">Title</label>
                <input
                  type="text"
                  value={editBlockTitle}
                  onChange={(e) => setEditBlockTitle(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-1">Type</label>
                <select
                  value={editBlockType}
                  onChange={(e) => setEditBlockType(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                >
                  <option value="deep-work">Deep Work</option>
                  <option value="meeting">Meeting</option>
                  <option value="break">Break</option>
                  <option value="admin">Admin</option>
                  <option value="event">Event</option>
                  <option value="routine">Routine</option>
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-1">Start Time</label>
                <input
                  type="time"
                  value={editBlockTime}
                  onChange={(e) => setEditBlockTime(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={editBlockDuration}
                  onChange={(e) => setEditBlockDuration(e.target.value)}
                  min="1"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-1">Note (optional)</label>
                <textarea
                  value={editBlockNote}
                  onChange={(e) => setEditBlockNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this block..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono resize-none focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditBlockMode(false);
                  setShowActionBar(true);
                }}
                className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEditBlock}
                className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Action Bar */}
      {addNoteMode && selectedBlock !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Add Note</span>
              <button
                onClick={() => {
                  setAddNoteMode(false);
                  setShowActionBar(true);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="e.g., Started task, blocked on X, moving to Y"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono resize-none focus:outline-none focus:border-gray-500"
              autoFocus
            />

            {/* Save Button */}
            <button
              onClick={async () => {
                if (selectedBlock !== null) {
                  await onUpdateBlock(selectedBlock, { note: noteText });
                  setAddNoteMode(false);
                  setSelectedBlock(null);
                  setShowActionBar(false);
                }
              }}
              className="w-full py-2 bg-gray-900 text-white font-mono text-sm rounded touch-manipulation hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Add Task Action Bar - Step 1: Select Type */}
      {addTaskMode && selectedBlock !== null && addTaskStep === 'select-type' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Task Type</span>
            <button
              onClick={handleCancelAddTask}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSelectTaskType('new-task')}
              className="flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">New Task</span>
            </button>
            <button
              onClick={() => handleSelectTaskType('select-project-task')}
              className="flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
            >
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">Project Task</span>
            </button>
            <button
              onClick={() => handleSelectTaskType('select-admin-task')}
              className="flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
            >
              <StickyNote className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">Admin Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Task Action Bar - Step 2: New Task Form */}
      {addTaskMode && selectedBlock !== null && addTaskStep === 'new-task' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">New Task</span>
              <button
                onClick={handleCancelAddTask}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Task Title Input */}
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task name"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                autoFocus
              />

              {/* Duration Input */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-mono whitespace-nowrap">Duration:</label>
                <input
                  type="number"
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:border-gray-500"
                  min="1"
                />
                <span className="text-xs text-gray-600 font-mono">min</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmAddTask}
              disabled={!taskTitle.trim()}
              className="w-full py-2 bg-gray-900 text-white font-mono text-sm rounded touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Add Task Action Bar - Step 2: Select Project Task */}
      {addTaskMode && selectedBlock !== null && addTaskStep === 'select-project-task' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Project Task</span>
            <button
              onClick={handleCancelAddTask}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Project Tasks List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
            {getAllProjectTasks().map((task, index) => {
              const taskName = task.name || task.content || task.title || 'Unnamed Task';
              const duration = task.duration || 30;
              const isSelected = selectedProjectTaskIndex === index;

              return (
                <button
                  key={task._id || task.id || index}
                  onClick={() => setSelectedProjectTaskIndex(index)}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-900 mb-1">{taskName}</div>
                  <div className="text-xs text-gray-600 font-mono flex items-center justify-between">
                    <span>{task.projectName}</span>
                    <span>{duration} min</span>
                  </div>
                </button>
              );
            })}
            {getAllProjectTasks().length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No project tasks available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelAddTask}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddTask}
              disabled={selectedProjectTaskIndex === null}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Task Action Bar - Step 2: Select Admin Task */}
      {addTaskMode && selectedBlock !== null && addTaskStep === 'select-admin-task' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Admin Task</span>
            <button
              onClick={handleCancelAddTask}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Admin Tasks List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
            {adminTasksData.map((task, index) => {
              const taskName = task.name || task.content || task.title || 'Unnamed Task';
              const duration = task.duration || 30;
              const isSelected = selectedAdminTaskIndex === index;

              return (
                <button
                  key={task._id || task.id || index}
                  onClick={() => setSelectedAdminTaskIndex(index)}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-900 mb-1">{taskName}</div>
                  <div className="text-xs text-gray-600 font-mono">
                    {duration} min
                  </div>
                </button>
              );
            })}
            {adminTasksData.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No admin tasks available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelAddTask}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddTask}
              disabled={selectedAdminTaskIndex === null}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Task Type Menu */}
      {showInlineTaskTypeMenu && inlineTaskInputVisible && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Task Type</span>
            <button
              onClick={() => {
                setShowInlineTaskTypeMenu(false);
                setInlineTaskInputVisible(false);
                setInlineTaskInputValue('');
                setInlineTaskInsertPosition(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                setInlineTaskType('new');
                setShowInlineTaskTypeMenu(false);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                inlineTaskType === 'new' ? 'bg-gray-100' : ''
              }`}
            >
              <Plus className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">New Task</span>
            </button>
            <button
              onClick={() => {
                setInlineTaskType('project');
                setShowInlineTaskTypeMenu(false);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                inlineTaskType === 'project' ? 'bg-gray-100' : ''
              }`}
            >
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">Project Task</span>
            </button>
            <button
              onClick={() => {
                setInlineTaskType('admin');
                setShowInlineTaskTypeMenu(false);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                inlineTaskType === 'admin' ? 'bg-gray-100' : ''
              }`}
            >
              <StickyNote className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-700 font-mono text-center">Admin Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Task - Select Project Task */}
      {!showInlineTaskTypeMenu && inlineTaskInputVisible && inlineTaskType === 'project' && inlineTaskInsertPosition && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Project Task</span>
            <button
              onClick={() => {
                setInlineTaskInputVisible(false);
                setInlineTaskInputValue('');
                setInlineTaskInsertPosition(null);
                setInlineTaskType('new');
                setInlineTaskSelectedProjectIndex(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Project Tasks List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
            {getAllProjectTasks().map((task, index) => {
              const taskName = task.name || task.content || task.title || 'Unnamed Task';
              const duration = task.duration || 30;
              const isSelected = inlineTaskSelectedProjectIndex === index;

              return (
                <button
                  key={task._id || task.id || index}
                  onClick={() => setInlineTaskSelectedProjectIndex(index)}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-900 mb-1">{taskName}</div>
                  <div className="text-xs text-gray-600 font-mono flex items-center justify-between">
                    <span>{task.projectName}</span>
                    <span>{duration} min</span>
                  </div>
                </button>
              );
            })}
            {getAllProjectTasks().length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No project tasks available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInlineTaskType('new');
                setShowInlineTaskTypeMenu(true);
              }}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={async () => {
                if (inlineTaskInsertPosition && inlineTaskSelectedProjectIndex !== null) {
                  const allProjectTasks = getAllProjectTasks();
                  const selectedTask = allProjectTasks[inlineTaskSelectedProjectIndex];
                  await onAddTask(inlineTaskInsertPosition.blockIndex, {
                    title: selectedTask.name || selectedTask.content || selectedTask.title,
                    duration: selectedTask.duration || 30,
                    projectId: selectedTask.projectId,
                    taskId: selectedTask._id || selectedTask.id
                  });

                  // Reset inline input
                  setInlineTaskInputVisible(false);
                  setInlineTaskInputValue('');
                  setInlineTaskInsertPosition(null);
                  setInlineTaskType('new');
                  setInlineTaskSelectedProjectIndex(null);
                }
              }}
              disabled={inlineTaskSelectedProjectIndex === null}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Task - Select Admin Task */}
      {!showInlineTaskTypeMenu && inlineTaskInputVisible && inlineTaskType === 'admin' && inlineTaskInsertPosition && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Admin Task</span>
            <button
              onClick={() => {
                setInlineTaskInputVisible(false);
                setInlineTaskInputValue('');
                setInlineTaskInsertPosition(null);
                setInlineTaskType('new');
                setInlineTaskSelectedAdminIndex(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Admin Tasks List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
            {adminTasksData.map((task, index) => {
              const taskName = task.name || task.content || task.title || 'Unnamed Task';
              const duration = task.duration || 30;
              const isSelected = inlineTaskSelectedAdminIndex === index;

              return (
                <button
                  key={task._id || task.id || index}
                  onClick={() => setInlineTaskSelectedAdminIndex(index)}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-900 mb-1">{taskName}</div>
                  <div className="text-xs text-gray-600 font-mono">
                    {duration} min
                  </div>
                </button>
              );
            })}
            {adminTasksData.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">
                No admin tasks available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInlineTaskType('new');
                setShowInlineTaskTypeMenu(true);
              }}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={async () => {
                if (inlineTaskInsertPosition && inlineTaskSelectedAdminIndex !== null) {
                  const selectedTask = adminTasksData[inlineTaskSelectedAdminIndex];
                  await onAddTask(inlineTaskInsertPosition.blockIndex, {
                    title: selectedTask.name || selectedTask.content || selectedTask.title,
                    duration: selectedTask.duration || 30,
                    taskId: selectedTask._id || selectedTask.id
                  });

                  // Reset inline input
                  setInlineTaskInputVisible(false);
                  setInlineTaskInputValue('');
                  setInlineTaskInsertPosition(null);
                  setInlineTaskType('new');
                  setInlineTaskSelectedAdminIndex(null);
                }
              }}
              disabled={inlineTaskSelectedAdminIndex === null}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      {showBottomSheet !== 'none' && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowBottomSheet('none')}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
            </div>
          </div>
        </div>
      )}

      {/* Add Block Action Bar - Step 1: Select Type */}
      {addBlockStep === 'select-type' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">Select Block Type</span>
              <button
                onClick={handleCancelAddBlock}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {blockTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleSelectBlockType(type.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-700 font-mono">{type.label}</span>
                  </button>
                );
              })}
            </div>
        </div>
      )}

      {/* Add Block Action Bar - Step 1.5: Select Event (Scrollable List) */}
      {addBlockStep === 'select-event' && eventsData.length > 0 && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Select Event</span>
            <button
              onClick={handleCancelAddBlock}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Event List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
            {eventsData.map((event, index) => {
              const eventName = event.name || event.content || 'Unnamed Event';
              const startTime = event.startTime || event.metadata?.startTime || '09:00';
              const endTime = event.endTime || event.metadata?.endTime || '10:00';
              const location = event.location || event.metadata?.location;
              const isSelected = selectedEventIndex === index;

              return (
                <button
                  key={event._id || event.id || index}
                  onClick={() => setSelectedEventIndex(index)}
                  className={`w-full text-left p-3 rounded hover:bg-gray-50 active:bg-gray-100 touch-manipulation transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-900 mb-1">{eventName}</div>
                  <div className="text-xs text-gray-600 font-mono">
                    {startTime} - {endTime}
                  </div>
                  {location && (
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelAddBlock}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedEventIndex !== null && setAddBlockStep('set-details')}
              disabled={selectedEventIndex === null}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Select</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Block Action Bar - Step 1.5: Select Routine (Carousel) */}
      {addBlockStep === 'select-routine' && routinesData.length > 0 && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          {/* Routine Info with Navigation */}
          <div className="flex items-center gap-3 mb-4">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentRoutineIndex(Math.max(0, currentRoutineIndex - 1))}
              disabled={currentRoutineIndex === 0}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Current Routine Display */}
            <div className="flex-1 text-center">
              <div className="text-sm font-mono text-gray-900 mb-1">
                {routinesData[currentRoutineIndex]?.name || routinesData[currentRoutineIndex]?.content || 'Routine'}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                <span>{currentRoutineIndex + 1} of {routinesData.length}</span>
                {routinesData[currentRoutineIndex]?.tasks && (
                  <>
                    <span>•</span>
                    <span>{routinesData[currentRoutineIndex].tasks.length} tasks</span>
                  </>
                )}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentRoutineIndex(Math.min(routinesData.length - 1, currentRoutineIndex + 1))}
              disabled={currentRoutineIndex === routinesData.length - 1}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelAddBlock}
              className="flex-1 py-2 text-gray-600 font-mono text-sm touch-manipulation hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setAddBlockStep('set-details')}
              className="flex-1 py-2 bg-gray-900 text-white font-mono text-sm touch-manipulation hover:bg-gray-800 active:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Select</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Block Action Bar - Step 2: Set Details */}
      {addBlockStep === 'set-details' && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(() => {
                const selectedType = blockTypes.find(t => t.id === selectedBlockType);
                if (selectedType) {
                  const Icon = selectedType.icon;
                  return (
                    <span className="text-xs font-mono text-gray-700 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {selectedType.label}
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center gap-2">
              {/* Time picker */}
              <input
                type="time"
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              />

              {/* Duration picker */}
              <select
                value={blockDuration}
                onChange={(e) => setBlockDuration(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-mono"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Confirm button */}
              <button
                onClick={handleConfirmAddBlock}
                className="p-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 active:bg-gray-700 touch-manipulation transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Cancel button */}
              <button
                onClick={handleCancelAddBlock}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
