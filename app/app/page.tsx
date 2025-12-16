"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCommandSystem } from "@/app/hooks/useCommandSystem";
import { useBlockManagement } from "@/app/hooks/useBlockManagement";
import { useDayDataLoader } from "@/app/hooks/useDayDataLoader";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import ScheduleView from "@/app/components/schedule/ScheduleView";
import MobileAppView from "@/app/components/mobile/MobileAppView";
import InventoryView from "@/app/components/inventory/InventoryView";
import AIChatPanel from "@/app/components/schedule/AIChatPanel";
import SharedNavbar from "@/app/components/schedule/SharedNavbar";
import BlockTimeMenu from "@/app/components/schedule/BlockTimeMenu";
import { TextCommandParser } from '@/app/core/commands/textCommandParser';
import { CommandContext } from '@/app/core/commands/types';
import { useAuth, useUser } from "@clerk/nextjs";
import { calculateEndTime, calculateStartTime } from '@/app/utils/scheduleUtils';
import { parseQuickCommand, parseEnhancedCommand, isQuickCommand } from '@/app/utils/quickCommandParser';
import Fuse from 'fuse.js';
import CommandPaletteModal from '@/app/components/CommandPaletteModal/CommandPaletteModal';


export default function ScheduleStrategyPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  // Detect mobile viewport
  const isMobile = useIsMobile();

  // Use day data loader hook
  const {
    currentDay,
    setCurrentDay,
    userData,
    todayData,
    tomorrowData,
    isLoadingDays,
    getCurrentBlocks,
    getCurrentDayId,
    refreshDayData
  } = useDayDataLoader(userId, isLoaded);
  
  
  
  // Goals state
  const [goals, setGoals] = useState<any[]>([]);

  // Events state
  const [events, setEvents] = useState<any[]>([]);

  // Routines state
  const [routines, setRoutines] = useState<any[]>([]);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);

  // Admin tasks (backlog) state
  const [adminTasks, setAdminTasks] = useState<any[]>([]);

  // Inventory refresh trigger
  const [inventoryRefreshTrigger, setInventoryRefreshTrigger] = useState(0);

  // Prevent concurrent inventory fetches
  const isFetchingInventory = useRef(false);

  // Fetch events and routines on component mount
  // Fetch inventory data (events, routines, projects, admin tasks)
  const fetchInventoryData = useCallback(async () => {
    if (!userId || isFetchingInventory.current) return;

    isFetchingInventory.current = true;

    try {
      console.log('[Page] Fetching inventory data for user:', userId);
      const response = await fetch('/api/you');

      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const data = await response.json();
      console.log('[Page] Fetched data:', data);
      console.log('[Page] Sections available:', Object.keys(data.sections || {}));

      // Set goals from the data
      if (data.goals) {
        console.log('[Page] Setting goals:', data.goals);
        setGoals(data.goals);
      }

      // Set events from the sections data
      if (data.sections?.events) {
        console.log('[Page] Setting events:', data.sections.events);
        setEvents(data.sections.events);
      }

      // Set routines from the sections data
      if (data.sections?.routines) {
        console.log('[Page] Setting routines:', data.sections.routines);
        setRoutines(data.sections.routines);
      }

      // Set projects from the sections data
      if (data.sections?.projects) {
        console.log('[Page] Setting projects:', data.sections.projects);
        setProjects(data.sections.projects);
      } else {
        console.log('[Page] No projects found in sections');
      }

      // Set admin tasks (backlog) from the sections data
      if (data.sections?.backlog) {
        console.log('[Page] Setting admin tasks (backlog):', data.sections.backlog);
        setAdminTasks(data.sections.backlog);
      } else {
        console.log('[Page] No backlog found in sections');
      }
    } catch (error) {
      console.error('[Page] Error fetching inventory data:', error);
    } finally {
      isFetchingInventory.current = false;
    }
  }, [userId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Refetch inventory data when timeline updates a task
  useEffect(() => {
    if (inventoryRefreshTrigger > 0) {
      console.log('[Page] Refreshing inventory data due to timeline task update');
      fetchInventoryData();
    }
  }, [inventoryRefreshTrigger, fetchInventoryData]);
  
  // Profile editing state
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  
  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Slash command menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showEventSelectionMenu, setShowEventSelectionMenu] = useState(false);
  const [showBlockTypeMenu, setShowBlockTypeMenu] = useState(false);
  const [showBlockTimeMenu, setShowBlockTimeMenu] = useState(false);

  // Command Palette Modal state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRoutineSelectionMenu, setShowRoutineSelectionMenu] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<any>(null);
  const [blockCreationSuggestedTime, setBlockCreationSuggestedTime] = useState<string>('09:00');

  // Handle slash menu selection
  const handleSlashMenuSelect = useCallback((item: any) => {
    // Hide the initial slash menu
    setShowSlashMenu(false);
    
    // Handle different menu items
    if (item.id === 'block') {
      // Show block type selection menu
      setShowBlockTypeMenu(true);
    } else if (item.id === 'event') {
      // Show event selection menu
      setShowEventSelectionMenu(true);
    } else if (item.id === 'routine') {
      // Show routine selection menu
      setShowRoutineSelectionMenu(true);
    } else {
      // For other items, clear everything
      setCommandInput('');
      setIsTypingCommand(false);
    }
  }, []);
  
  const handleSlashMenuCancel = useCallback(() => {
    setShowSlashMenu(false);
    setCommandInput('');
    setIsTypingCommand(false);
  }, []);

  // Handle block time confirmation (defined later after handleBlockCreate)
  
  // IMPORTANT: Initialize command system early to get cmdViewMode
  const {
    currentContext,
    currentFocus,
    commandState,
    viewMode: cmdViewMode,
    switchView,
    enterBlockLevel,
    enterTaskLevel,
    exitToBlockLevel,
    exitToViewLevel,
    navigateToBlock,
    navigateToTask,
    selectedDate,
    setSelectedDate,
    executeCommand: executeCommandById,
    executeByKey,
    availableCommands,
    commandSuggestions,
    showHelp: showCommandHelp,
    toggleHelp: toggleCommandHelp,
    contextManager,
    registry
  } = useCommandSystem({
    initialView: 'schedule',
    onCommandExecuted: (result) => {
      // Handle command results
      if (result.data?.action === 'toggleDay') {
        if (!isLoadingDays) {
          const newDay = currentDay === 'today' ? 'tomorrow' : 'today';
          setCurrentDay(newDay);
          // Note: blocks will be updated by the useEffect that watches currentDay
        }
      }
    }
  });
  
  // Old task editing state (kept for compatibility, may need cleanup later)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskContent, setEditTaskContent] = useState("");
  const [editingTaskDurationId, setEditingTaskDurationId] = useState<string | null>(null);
  const [showDurationDropdown, setShowDurationDropdown] = useState<string | null>(null);
  const taskEditInputRef = useRef<HTMLInputElement>(null);
  
  // Duration options for dropdown
  const durationOptions = [
    { value: "15m", label: "15 min" },
    { value: "30m", label: "30 min" },
    { value: "45m", label: "45 min" },
    { value: "1h", label: "1 hour" },
    { value: "90m", label: "1.5 hours" },
    { value: "2h", label: "2 hours" },
    { value: "3h", label: "3 hours" },
    { value: "4h", label: "4 hours" },
  ];
  
  
  // State for hover on section titles
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<string | null>(null);
  
  // Click outside handler for filter dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setFilterDropdownOpen(null);
      }
    };
    
    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterDropdownOpen]);
  
  // Date picker state
  const [datePickerOpen, setDatePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Additional property picker states for tasks
  const [durationPickerOpen, setDurationPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [scheduledPickerOpen, setScheduledPickerOpen] = useState<{ [key: string]: boolean }>({});
  
  // Event property picker states
  const [eventTimePickerOpen, setEventTimePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [recurringPickerOpen, setRecurringPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [zoomLinkPickerOpen, setZoomLinkPickerOpen] = useState<{ [key: string]: boolean }>({});
  
  // Routine property picker states
  const [routineDatePickerOpen, setRoutineDatePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [routineTimePickerOpen, setRoutineTimePickerOpen] = useState<{ [key: string]: boolean }>({});
  
  // Confirmation state for old-chat-decide
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<any>(null);
  
  
  
  
  // Initialize block management with empty blocks (will be updated from day data)
  const {
    blocks,
    selectedBlockIndex,
    selectedTaskIndex,
    setBlocks,
    setSelectedBlockIndex,
    setSelectedTaskIndex,
    handleDragEnd,
    addBlock,
    addTask,
    addMultipleTasks,
    addEvent,
    addRoutine,
    toggleTask,
    deleteBlock,
    deleteTask,
    toggleBlockCompletion,
    setOnBlockMoveRequest
  } = useBlockManagement([], getCurrentDayId(), () => {
    // Refresh inventory when a task is toggled in timeline
    setInventoryRefreshTrigger(prev => prev + 1);
  });
  
  // Update blocks when day data changes
  useEffect(() => {
    const newBlocks = getCurrentBlocks();
    console.log('[Page] 📊 Updating blocks from day data:', {
      blocksCount: newBlocks.length,
      blocks: newBlocks.map(b => ({
        id: b.id || b._id,
        type: b.type,
        title: b.title,
        hasMetadata: !!b.metadata,
        metadata: b.metadata
      }))
    });
    setBlocks(newBlocks);
  }, [currentDay, todayData, tomorrowData, isLoadingDays]);

  // Auto-select first block when blocks are loaded
  useEffect(() => {
    if (blocks.length > 0 && cursorPosition.type === 'between' && cursorPosition.afterIndex === -1) {
      // Only auto-select on initial load (when cursor is at default position)
      setCursorPosition({ type: 'block', index: 0 });
      setSelectedBlockIndex(0);
      console.log('[Page] 🎯 Auto-selected first block on load');
    }
  }, [blocks.length]);
  
  // Handle block move request (shows time popup) - must be after useBlockManagement
  const handleBlockMoveRequest = useCallback((oldIndex: number, newIndex: number) => {
    console.log('📍 Block drag move requested:', { oldIndex, newIndex });
    
    // Move the block immediately (visually)
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, movedBlock);
    setBlocks(newBlocks);
    
    // Update selection to follow the moved block
    setSelectedBlockIndex(newIndex);
    setCursorPosition({ type: 'block', index: newIndex });
    
    // Calculate suggested time based on new position
    let suggestedTime = '09:00';
    if (newIndex === 0) {
      suggestedTime = '08:00';
    } else if (newBlocks[newIndex - 1]) {
      const prevBlock = newBlocks[newIndex - 1];
      suggestedTime = calculateEndTime(prevBlock.time, prevBlock.duration);
    }
    
    // Set up pending move and show popup
    setPendingMove({ oldIndex, newIndex });
    setMoveSuggestedTime(suggestedTime);
    setShowMoveTimePopup(true);
  }, [blocks]);
  
  // Set the block move request handler
  useEffect(() => {
    setOnBlockMoveRequest(() => handleBlockMoveRequest);
  }, [handleBlockMoveRequest, setOnBlockMoveRequest]);
  
  // Cursor-based navigation system
  type CursorPosition = 
    | { type: 'block'; index: number }
    | { type: 'between'; afterIndex: number }  // -1 means before first block
    | { type: 'none' };  // No position selected
    
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ type: 'between', afterIndex: -1 });
  const [commandInput, setCommandInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [isTypingTask, setIsTypingTask] = useState(false);
  const [taskInputPosition, setTaskInputPosition] = useState<number>(-2); // -2 = not in block, -1 = before first task, 0+ = after task at that index
  const [showTaskCommandMenu, setShowTaskCommandMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isTypingCommand, setIsTypingCommand] = useState(false);

  // Predictive search state for blocks (routines/events)
  const [matchOptions, setMatchOptions] = useState<Array<{ type: 'routine' | 'event'; item: any; preview: string }>>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  // Predictive search state for tasks
  const [taskMatchOptions, setTaskMatchOptions] = useState<Array<{ type: 'project' | 'admin'; item: any; preview: string }>>([]);
  const [selectedTaskMatchIndex, setSelectedTaskMatchIndex] = useState(0);

  // Project tagging state (for # autocomplete)
  const [projectMatchOptions, setProjectMatchOptions] = useState<Array<{ item: any; preview: string }>>([]);
  const [selectedProjectMatchIndex, setSelectedProjectMatchIndex] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectAutocomplete, setShowProjectAutocomplete] = useState(false);

  // Backwards compatibility - bestMatch is the currently selected match
  const bestMatch = matchOptions.length > 0 ? matchOptions[selectedMatchIndex] : null;
  const bestTaskMatch = taskMatchOptions.length > 0 ? taskMatchOptions[selectedTaskMatchIndex] : null;
  const bestProjectMatch = projectMatchOptions.length > 0 ? projectMatchOptions[selectedProjectMatchIndex] : null;

  // Block edit mode state
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editBlockType, setEditBlockType] = useState<string>('');
  const [editBlockTime, setEditBlockTime] = useState<string>('');
  const [editFieldFocus, setEditFieldFocus] = useState<'type' | 'time'>('type');
  const [timeEditPosition, setTimeEditPosition] = useState<number>(0); // 0-5 for each digit position
  
  // Task edit mode state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState<string>('');
  const [editTaskDuration, setEditTaskDuration] = useState<string>('');
  const [taskEditFieldFocus, setTaskEditFieldFocus] = useState<'name' | 'duration'>('name');

  // Note edit mode state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteBlockIndex, setEditingNoteBlockIndex] = useState<number | null>(null);
  const [editNoteValue, setEditNoteValue] = useState<string>('');

  // Grab mode state for moving blocks
  const [grabbedBlockIndex, setGrabbedBlockIndex] = useState<number | null>(null);
  const [grabbedBlockOriginalIndex, setGrabbedBlockOriginalIndex] = useState<number | null>(null);
  
  // Grab mode state for moving tasks
  const [grabbedTaskIndex, setGrabbedTaskIndex] = useState<number | null>(null);

  // Multi-task grab state
  const [grabbedTasks, setGrabbedTasks] = useState<Array<{
    blockIndex: number;
    taskIndex: number;
    task: any;
    originalBlockId?: string;
  }>>([]);
  const [isSelectingTasks, setIsSelectingTasks] = useState(false); // True when Cmd is held during multi-grab

  // Block move time popup state
  const [showMoveTimePopup, setShowMoveTimePopup] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ oldIndex: number; newIndex: number } | null>(null);
  const [moveSuggestedTime, setMoveSuggestedTime] = useState<string>('09:00');
  
  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ 
    role: 'user' | 'ai' | 'assistant'; 
    message: string; 
    timestamp?: Date;
    type?: 'schedule' | 'cud' | 'goal_plan' | 'text';
    data?: any;
    scheduleData?: any;
    cudData?: any;
    goalPlanData?: any;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [hasLoadedChat, setHasLoadedChat] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai-conversation-id');
      if (stored) return stored;
    }
    return '';
  }); // Unique ID for this conversation session
  
  // Multi-agent state management
  const [agentTodos, setAgentTodos] = useState<any[]>([]);
  const [pendingPlan, setPendingPlan] = useState<any>(null);

  // Callback for inventory to trigger timeline refresh
  const handleInventoryTaskUpdate = useCallback(() => {
    refreshDayData();
  }, [refreshDayData]);

  // Handle block type selection
  const handleBlockTypeSelection = useCallback((blockType: any) => {
    setShowBlockTypeMenu(false);
    setSelectedBlockType(blockType);

    // Calculate suggested time based on cursor position and block type duration
    let suggestedTime = '09:00';

    // Determine insert position
    let insertAfterIndex = -1;
    if (cursorPosition.type === 'between') {
      insertAfterIndex = cursorPosition.afterIndex;
    } else if (cursorPosition.type === 'block') {
      insertAfterIndex = cursorPosition.index;
    }

    if (insertAfterIndex >= 0 && blocks[insertAfterIndex]) {
      // Inserting AFTER a block - calculate end time of previous block
      const prevBlock = blocks[insertAfterIndex];
      suggestedTime = calculateEndTime(prevBlock.time, prevBlock.duration);
    } else if (insertAfterIndex === -1 && blocks.length > 0) {
      // Inserting BEFORE first block - calculate start time by subtracting duration
      const nextBlock = blocks[0];
      suggestedTime = calculateStartTime(nextBlock.time, blockType.duration || 60);
    } else {
      // No blocks - use current time rounded to next 15 min
      const now = new Date();
      const hours = now.getHours();
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      if (minutes === 60) {
        suggestedTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
      } else {
        suggestedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    // Check if suggested time is in the past, if so use current time rounded to next 15 min
    const [suggestedHours, suggestedMinutes] = suggestedTime.split(':').map(Number);
    const suggestedDate = new Date();
    suggestedDate.setHours(suggestedHours, suggestedMinutes, 0, 0);

    if (suggestedDate < currentTime) {
      // Suggested time is in the past, use current time rounded to next 15 minutes
      const hours = currentTime.getHours();
      const minutes = Math.ceil(currentTime.getMinutes() / 15) * 15;
      if (minutes === 60) {
        suggestedTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
      } else {
        suggestedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    setBlockCreationSuggestedTime(suggestedTime);
    setShowBlockTimeMenu(true);
  }, [cursorPosition, blocks, currentTime]);

  // Helper function to parse time string to minutes
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  
  // Helper function to parse duration string to minutes
  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 30;
    const match = durationStr.match(/(\d+(?:\.\d+)?)(h|m)/);
    if (!match) return 30;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return unit === 'h' ? value * 60 : value;
  };
  
  // Handle routine selection from the routine menu
  const handleRoutineSelect = useCallback(async (routine: any) => {
    console.log('[Routine Selection] Selected routine:', routine);
    
    // Clear command input
    setCommandInput('');
    setIsTypingCommand(false);
    setShowSlashMenu(false);
    
    // Handle both direct properties and metadata nested properties
    const name = routine.name || routine.content || "Unnamed routine";
    // Use new startTime field, fall back to old earliestStartTime for backwards compatibility
    const startTime = routine.startTime || routine.earliestStartTime || routine.metadata?.startTime || routine.metadata?.earliestStartTime || '07:00';
    const routineDuration = routine.duration || routine.metadata?.duration || 60;
    const routineTasks = routine.tasks || [];
    
    // Calculate duration - prefer the routine's set duration, otherwise calculate from tasks
    let totalDuration = routineDuration;
    if (!routine.duration && routineTasks.length > 0) {
      // Only calculate from tasks if no duration is explicitly set
      totalDuration = routineTasks.reduce((sum: number, task: any) => {
        const taskDuration = typeof task.duration === 'number' ? task.duration :
                           typeof task.metadata?.duration === 'string' ? parseDuration(task.metadata.duration) : 30;
        return sum + taskDuration;
      }, 0);
    }
    
    // Create a routine block with tasks
    const newBlock: any = {
      id: `temp-${Date.now()}`,
      title: name,
      time: startTime,
      duration: totalDuration,
      type: 'routine',
      tasks: routineTasks.map((task: any) => ({
        id: task._id || task.id || `temp-task-${Date.now()}-${Math.random()}`,
        title: task.name || task.content || task.title || "Untitled task",
        duration: typeof task.duration === 'number' ? task.duration :
                 typeof task.metadata?.duration === 'string' ? parseDuration(task.metadata.duration) : 30,
        completed: false
      })),
      metadata: {
        routineId: routine._id || routine.id,
        routineName: name,
        startTime,
        duration: totalDuration,
        days: routine.days || routine.metadata?.days || []
      }
    };
    
    // Add the block
    const index = await addBlock(newBlock);
    
    if (index !== undefined && index >= 0) {
      setCursorPosition({ type: 'block', index });
      setSelectedBlockIndex(index);
    }
  }, [addBlock, setCursorPosition]);

  // Handle event selection from the event menu
  const handleEventSelect = useCallback(async (event: any) => {
    console.log('[Event Selection] Selected event:', event);
    
    // Clear command input
    setCommandInput('');
    setIsTypingCommand(false);
    setShowSlashMenu(false);
    setShowEventSelectionMenu(false);
    
    // Handle both direct properties and metadata nested properties
    const name = event.name || event.content || "Unnamed event";
    const startTime = event.startTime || event.metadata?.startTime || '09:00';
    const endTime = event.endTime || event.metadata?.endTime || '10:00';
    const zoomLink = event.zoomLink || event.metadata?.zoomLink;
    const location = event.location || event.metadata?.location;
    const isRecurring = event.isRecurring || event.metadata?.isRecurring;
    
    console.log('[Event Selection] Times from event:', {
      startTime,
      endTime,
      eventStartTime: event.startTime,
      metadataStartTime: event.metadata?.startTime,
      eventEndTime: event.endTime,
      metadataEndTime: event.metadata?.endTime,
      fullEvent: event
    });
    
    // Calculate duration from start and end times
    const calculateDuration = (start: string, end: string) => {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes - startMinutes;
    };
    
    // Create an event block
    const newBlock = {
      _id: `temp-${Date.now()}`,
      type: 'event',
      eventId: event._id || event.id,
      title: name,
      time: startTime,
      duration: calculateDuration(startTime, endTime),
      tasks: [], // Events don't have tasks
      completed: false,
      metadata: {
        zoomLink,
        location,
        isRecurring,
        endTime
      }
    };
    
    // Determine where to insert based on cursor position
    let insertAfterIndex = -1;
    if (cursorPosition.type === 'between') {
      insertAfterIndex = cursorPosition.afterIndex;
    } else if (cursorPosition.type === 'block') {
      insertAfterIndex = cursorPosition.index;
    }
    
    // Insert the block at the appropriate position
    const newBlocks = [...blocks];
    newBlocks.splice(insertAfterIndex + 1, 0, newBlock);
    setBlocks(newBlocks);
    
    // Save to database
    const dayId = getCurrentDayId();
    if (dayId) {
      try {
        const requestBody = {
          dayId,
          title: name,
          time: startTime,
          duration: calculateDuration(startTime, endTime),
          type: 'event',
          index: insertAfterIndex + 1,
          metadata: {
            zoomLink,
            location,
            isRecurring,
            eventId: event._id || event.id
          }
        };
        
        console.log('[Event Selection] 📤 Sending to API:', requestBody);
        
        const response = await fetch('/api/blocks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const savedBlock = await response.json();
          console.log('[Event Selection] ✅ Saved event block to database:', {
            id: savedBlock._id || savedBlock.id,
            type: savedBlock.type,
            metadata: savedBlock.metadata,
            title: savedBlock.title,
            time: savedBlock.time
          });
          
          // Refresh the day data to get the updated blocks with proper references
          console.log('[Event Selection] 🔄 Refreshing day data...');
          await refreshDayData();
          console.log('[Event Selection] ✅ Day data refreshed');
        } else {
          const errorText = await response.text();
          console.error('[Event Selection] ❌ Failed to save block to database:', errorText);
        }
      } catch (error) {
        console.error('[Event Selection] Error saving block:', error);
      }
    }
    
    console.log('[Event Selection] Created event block at position:', insertAfterIndex + 1);
  }, [blocks, setBlocks, cursorPosition, setCommandInput, setIsTypingCommand, setShowSlashMenu, getCurrentDayId, refreshDayData]);
  
  // Save conversation after each message - defined before handleSendChatMessage
  const saveConversation = useCallback(async (role: 'user' | 'ai', message: string) => {
    const dayId = getCurrentDayId();
    const userId = userData?._id;
    const date = currentDay === 'today' 
      ? new Date().toISOString().split('T')[0]
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dayId && userId && message !== '...') { // Don't save loading messages
      try {
        await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            dayId,
            date,
            conversations: [{
              role,
              message,
              timestamp: new Date()
            }]
          })
        });
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    }
  }, [getCurrentDayId, userData, currentDay]);
  
  // Handle AI chat message
  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', message, timestamp: new Date() }]);
    setChatInput('');
    
    // Save user message
    await saveConversation('user', message);
    
    // Add AI "thinking" message
    setChatHistory(prev => [...prev, { role: 'ai', message: 'Working on it...', timestamp: new Date() }]);
    
    try {
      console.log('[Client] Sending message to AGENT POC:', message);

      // Send to AGENT POC system (testing Claude Agent SDK)
      // OLD: const response = await fetch('/api/ai/multi-agent', {
      const response = await fetch('/api/ai/agent-poc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          messages: chatHistory, // Include full conversation history
          context: {
            userName: user?.firstName || 'User',
            dayId: getCurrentDayId(),
            conversationId: conversationId, // Pass conversation ID for session management
            todos: agentTodos,        // Pass current todos for state management
            pendingPlan: pendingPlan  // Pass any pending plan
          }
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const result = await response.json();
      console.log('[Client] Response from AGENT POC:', result);
      
      // Update todos if returned
      if (result.todos) {
        setAgentTodos(result.todos);
        console.log('[Client] Updated todos:', result.todos);
      }
      
      // Store pending plan if waiting for confirmation
      if (result.pendingPlan && result.awaitingConfirmation) {
        setPendingPlan(result.pendingPlan);
        console.log('[Client] Stored pending plan for confirmation');
      } else if (!result.awaitingConfirmation) {
        setPendingPlan(null);
      }
      
      // Check for multi-agent pending plan first
      if (result.pendingPlan && result.awaitingConfirmation) {
        const plan = result.pendingPlan;
        let aiMessage = result.response || 'Here is the plan:';
        console.log('[Debug] Plan aiMessage before conversion:', aiMessage, typeof aiMessage);
        // Ensure it's a string
        if (typeof aiMessage !== 'string') {
          console.log('[Debug] Converting non-string aiMessage to string');
          aiMessage = String(aiMessage);
        }
        
        // Handle different plan types
        if (plan.type === 'cud') {
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { 
              role: 'ai', 
              message: aiMessage,
              timestamp: new Date(),
              type: 'cud',
              data: plan.data,
              cudData: plan.data
            };
            return newHistory;
          });
        } else if (plan.type === 'schedule') {
          console.log('[Debug] Schedule plan data:', plan.data);
          console.log('[Debug] Schedule aiMessage:', aiMessage, typeof aiMessage);
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { 
              role: 'ai', 
              message: aiMessage,
              timestamp: new Date(),
              type: 'schedule',
              data: plan.data,
              scheduleData: plan.data
            };
            return newHistory;
          });
        } else {
          // Regular response with pending plan
          setChatHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { 
              role: 'ai', 
              message: aiMessage,
              timestamp: new Date()
            };
            return newHistory;
          });
        }
        
        await saveConversation('ai', aiMessage);
      }
      // Check if it's a schedule response (old format)
      else if (result.type === 'schedule' && result.data) {
        console.log('[Debug] Old format schedule data:', result.data);
        console.log('[Debug] Old format message:', result.message);
        // Store the schedule data with the message
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { 
            role: 'ai', 
            message: result.message || "Here's your optimized schedule:",
            timestamp: new Date(),
            type: 'schedule',
            data: result.data,
            // Store the full schedule data including all IDs for execute layer
            scheduleData: result.data
          };
          return newHistory;
        });
        
        // Save a simplified version to database
        await saveConversation('ai', result.message || 'Generated schedule proposal');
      } else if (result.type === 'cud' && result.data) {
        // Store the CUD data with the message
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { 
            role: 'ai', 
            message: result.message || "Here's what I'll do:",
            timestamp: new Date(),
            type: 'cud',
            data: result.data,
            // Store the full CUD data including all IDs for execute layer
            cudData: result.data
          };
          return newHistory;
        });
        
        // Save a simplified version to database
        await saveConversation('ai', result.message || 'Generated CUD proposal');
      } else if (result.type === 'goal_plan' && result.data) {
        // Store the goal plan data with the message
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { 
            role: 'ai', 
            message: result.message || "Here's your strategic plan:",
            timestamp: new Date(),
            type: 'goal_plan',
            data: result.data,
            // Store the full goal plan data for execute layer
            goalPlanData: result.data
          };
          return newHistory;
        });
        
        // Save a simplified version to database
        await saveConversation('ai', result.message || 'Generated strategic plan');
      } else {
        // Regular text response
        // Ensure message is a string, not an object
        let aiMessage = result.response || result.message || 'I can help you with that!';
        console.log('[Debug] Regular aiMessage before conversion:', aiMessage, typeof aiMessage);
        if (typeof aiMessage === 'object') {
          console.log('[Debug] aiMessage is object, extracting string:', aiMessage);
          // If it's an object, try to extract a string message or stringify it
          aiMessage = (aiMessage as any).message || (aiMessage as any).text || JSON.stringify(aiMessage);
        }
        // Final safety check - ensure it's definitely a string
        if (typeof aiMessage !== 'string') {
          console.log('[Debug] Final conversion to string for aiMessage');
          aiMessage = String(aiMessage);
        }
        
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { 
            role: 'ai', 
            message: aiMessage,
            timestamp: new Date()
          };
          return newHistory;
        });
        
        await saveConversation('ai', aiMessage);
      }
      
      // Clear pending operation if needed
      setAwaitingConfirmation(null);
      
      // If data was fetched, refresh the UI
      if (result.hasData) {
        setTimeout(async () => {
          await refreshDayData();
          setInventoryRefreshTrigger(prev => prev + 1);
        }, 500);
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { 
          role: 'ai', 
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        return newHistory;
      });
    }
  }, [user, getCurrentDayId, refreshDayData, saveConversation, setInventoryRefreshTrigger, chatHistory]);
  
  const handleClearChatHistory = useCallback(async () => {
    setChatHistory([]);
    // Reset conversation state with new ID
    const newConvId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConvId);
    setAgentTodos([]);
    setPendingPlan(null);
    // Clear old conversation from localStorage (new one will be saved by useEffect)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai-conversation-id');
    }
    // Also clear from database
    const dayId = getCurrentDayId();
    if (dayId && userData?._id) {
      await fetch(`/api/chat/conversations?dayId=${dayId}&userId=${userData._id}`, {
        method: 'DELETE'
      });
    }
  }, [getCurrentDayId, userData]);

  // Load chat history when chat opens
  // Save conversationId to localStorage whenever it changes
  useEffect(() => {
    if (conversationId && typeof window !== 'undefined') {
      localStorage.setItem('ai-conversation-id', conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (showAIChat && !hasLoadedChat) {
        // Generate conversation ID if not set
        if (!conversationId) {
          const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          setConversationId(newId);
        }
        const dayId = getCurrentDayId();
        const userId = userData?._id;
        
        if (dayId && userId) {
          try {
            const response = await fetch(`/api/chat/conversations?dayId=${dayId}&userId=${userId}`);
            if (response.ok) {
              const data = await response.json();
              const formattedChats = data.conversations.map((chat: any) => ({
                role: chat.role,
                message: chat.message,
                timestamp: chat.timestamp
              }));
              setChatHistory(formattedChats);
            }
          } catch (error) {
            console.error('Error loading chat history:', error);
          }
        }
        setHasLoadedChat(true);
      }
    };
    
    loadChatHistory();
  }, [showAIChat, hasLoadedChat, getCurrentDayId, userData, conversationId]);
  
  // Handle block move with time selection
  const handleBlockMoveConfirm = useCallback((time: string) => {
    if (!pendingMove) return;
    
    console.log('📍 Confirming block time:', { 
      position: pendingMove.newIndex, 
      time 
    });
    
    // Block is already moved, just update the time
    const newBlocks = [...blocks];
    newBlocks[pendingMove.newIndex].time = time;
    setBlocks(newBlocks);
    
    // Clear popup state
    setShowMoveTimePopup(false);
    setPendingMove(null);
    setGrabbedBlockOriginalIndex(null); // Clear original index since move is confirmed
  }, [blocks, pendingMove]);
  
  const handleBlockMoveCancel = useCallback(() => {
    console.log('📍 Cancelling time change - reverting move');
    
    if (pendingMove && grabbedBlockOriginalIndex !== null) {
      // Need to move block back to its original position
      const currentIndex = pendingMove.newIndex;
      const originalIndex = grabbedBlockOriginalIndex;
      
      if (currentIndex !== originalIndex) {
        const newBlocks = [...blocks];
        const [movedBlock] = newBlocks.splice(currentIndex, 1);
        newBlocks.splice(originalIndex, 0, movedBlock);
        setBlocks(newBlocks);
        
        // Reset selection to original position
        setSelectedBlockIndex(originalIndex);
        setCursorPosition({ type: 'block', index: originalIndex });
      }
    }
    
    setShowMoveTimePopup(false);
    setPendingMove(null);
    setGrabbedBlockIndex(null);
    setGrabbedBlockOriginalIndex(null);
  }, [blocks, pendingMove, grabbedBlockOriginalIndex]);

  // Sort blocks by start time automatically
  useEffect(() => {
    // Don't sort if we're in the middle of moving a block or showing the popup
    if (grabbedBlockIndex !== null || showMoveTimePopup || pendingMove) {
      console.log('⏸️ Skipping sort - block move in progress');
      return;
    }
    
    // Don't sort if blocks are empty
    if (blocks.length === 0) {
      return;
    }
    
    // Create a sorted copy to check if we need to update
    const sortedBlocks = [...blocks].sort((a, b) => {
      const aMinutes = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
      const bMinutes = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
      return aMinutes - bMinutes;
    });
    
    // Check if the order actually changed
    const orderChanged = blocks.some((block, index) => block.id !== sortedBlocks[index]?.id);
    
    if (orderChanged) {
      console.log('🔄 Sorting blocks by time');
      
      // If we have a selected block, track it through the sort
      let newSelectedIndex = selectedBlockIndex;
      if (selectedBlockIndex >= 0 && selectedBlockIndex < blocks.length) {
        const selectedBlockId = blocks[selectedBlockIndex].id;
        newSelectedIndex = sortedBlocks.findIndex(b => b.id === selectedBlockId);
      }
      
      setBlocks(sortedBlocks);
      
      // Update selection if it moved
      if (newSelectedIndex !== selectedBlockIndex && newSelectedIndex !== -1) {
        setSelectedBlockIndex(newSelectedIndex);
        setCursorPosition({ type: 'block', index: newSelectedIndex });
      }
    }
  }, [blocks, grabbedBlockIndex, showMoveTimePopup, pendingMove, selectedBlockIndex]);
  
  







  // Handle block creation with time configuration
  const handleBlockCreate = useCallback((blockType: any, time: string) => {
    // Clear command input
    setCommandInput('');
    setIsTypingCommand(false);
    setShowSlashMenu(false);

    // Determine where to insert based on cursor position
    let insertAfterIndex = -1; // Default to before first block
    if (cursorPosition.type === 'between') {
      insertAfterIndex = cursorPosition.afterIndex;
    } else if (cursorPosition.type === 'block') {
      insertAfterIndex = cursorPosition.index;
    }

    // Add the block with the selected type, time, and duration from blockType
    addBlock({
      type: blockType.type,
      title: blockType.label,
      time: time,
      duration: blockType.duration || 60, // Use the duration from blockType
      tasks: [], // Start with empty tasks
    }, insertAfterIndex);
    
    // The new block is inserted at insertAfterIndex + 1
    const newIndex = insertAfterIndex + 1;
    
    // Update cursor position to the newly created block
    setCursorPosition({ type: 'block', index: newIndex });
    setSelectedBlockIndex(newIndex);
    setSelectedTaskIndex(null);
    
    // Automatically enter the block and show first input
    setTaskInputPosition(-1); // Position before first task
    
  }, [cursorPosition, addBlock]);

  // Handle block time confirmation
  const handleBlockTimeConfirm = useCallback((time: string) => {
    if (selectedBlockType) {
      handleBlockCreate(selectedBlockType, time);
      setShowBlockTimeMenu(false);
      setSelectedBlockType(null);
    }
  }, [selectedBlockType, handleBlockCreate]);

  // Handle add menu selection


  

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Debug: Log navigation state changes
  useEffect(() => {
    console.log('[Navigation State]', {
      selectedBlockIndex,
      selectedTaskIndex,
      taskInputPosition,
      cursorPosition,
    });
  }, [selectedBlockIndex, selectedTaskIndex, taskInputPosition, cursorPosition]);

  // Determine current keyboard context
  const keyboardContext = useMemo(() => {
    // if (chatOpen) return 'chat' as const;
    if (selectedTaskIndex !== null) return 'task' as const;
    return 'block' as const;
  }, [selectedTaskIndex]); // removed chatOpen


  // Memoize Fuse instances to avoid recreating on every keystroke
  const routineFuse = useMemo(() => {
    return new Fuse(routines, {
      keys: ['name', 'content'],
      threshold: 0.4,
      includeScore: true
    });
  }, [routines]);

  const eventFuse = useMemo(() => {
    return new Fuse(events, {
      keys: ['name', 'content'],
      threshold: 0.4,
      includeScore: true
    });
  }, [events]);

  // Fuzzy search for best matching routine or event
  const findBestMatch = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setMatchOptions([]);
      setSelectedMatchIndex(0);
      return;
    }

    // Don't search if it's a quick command or slash command
    if (query.startsWith('/') || parseQuickCommand(query)) {
      setMatchOptions([]);
      setSelectedMatchIndex(0);
      return;
    }

    const routineResults = routineFuse.search(query).slice(0, 3); // Top 3 routines
    const eventResults = eventFuse.search(query).slice(0, 3); // Top 3 events

    if (routineResults.length === 0 && eventResults.length === 0) {
      setMatchOptions([]);
      setSelectedMatchIndex(0);
      return;
    }

    // Combine and sort all results by score
    const allMatches: Array<{ type: 'routine' | 'event'; item: any; preview: string; score: number }> = [];

    routineResults.forEach(result => {
      const routine = result.item;
      const name = routine.name || routine.content || "Unnamed routine";
      const startTime = routine.startTime || routine.earliestStartTime || routine.metadata?.startTime || routine.metadata?.earliestStartTime || '07:00';
      allMatches.push({
        type: 'routine',
        item: routine,
        preview: `${name} (routine at ${startTime})`,
        score: result.score ?? 1
      });
    });

    eventResults.forEach(result => {
      const event = result.item;
      const name = event.name || event.content || "Unnamed event";
      const startTime = event.startTime || event.metadata?.startTime || '09:00';
      const endTime = event.endTime || event.metadata?.endTime;
      const timeStr = endTime ? `${startTime}-${endTime}` : startTime;
      allMatches.push({
        type: 'event',
        item: event,
        preview: `${name} (event at ${timeStr})`,
        score: result.score ?? 1
      });
    });

    // Sort by score (lower is better) and take top 5
    allMatches.sort((a, b) => a.score - b.score);
    const topMatches = allMatches.slice(0, 5).map(({ type, item, preview }) => ({ type, item, preview }));

    setMatchOptions(topMatches);
    setSelectedMatchIndex(0); // Reset to first option
  }, [routineFuse, eventFuse]);

  // Memoize all tasks array to avoid recreating on every keystroke
  const allTasks = useMemo(() => {
    const projectTasks = projects.flatMap(project =>
      (project.tasks || []).map((task: any) => ({
        ...task,
        projectId: project._id || project.id,
        projectName: project.name || project.content,
        source: 'project'
      }))
    );

    return [
      ...projectTasks,
      ...adminTasks.map((task: any) => ({
        ...task,
        source: 'admin'
      }))
    ];
  }, [projects, adminTasks]);

  // Memoize task Fuse instance
  const taskFuse = useMemo(() => {
    return new Fuse(allTasks, {
      keys: ['name', 'content', 'title'],
      threshold: 0.4,
      includeScore: true
    });
  }, [allTasks]);

  // Memoize project Fuse instance
  const projectFuse = useMemo(() => {
    return new Fuse(projects, {
      keys: ['name', 'content'],
      threshold: 0.3,
      includeScore: true
    });
  }, [projects]);

  // Fuzzy search for best matching project (for @ tagging)
  const findBestProjectMatch = useCallback((query: string) => {
    // If no query, show ALL active projects
    if (!query || query.trim().length === 0) {
      const allProjectMatches = projects.map(project => {
        const projectName = project.name || project.content || "Unnamed project";
        return {
          item: project,
          preview: projectName
        };
      });
      setProjectMatchOptions(allProjectMatches);
      setSelectedProjectMatchIndex(0);
      return;
    }

    // If there's a query, do fuzzy search
    const projectResults = projectFuse.search(query);

    if (projectResults.length === 0) {
      setProjectMatchOptions([]);
      setSelectedProjectMatchIndex(0);
      return;
    }

    const matches = projectResults.map(result => {
      const project = result.item;
      const projectName = project.name || project.content || "Unnamed project";

      return {
        item: project,
        preview: projectName
      };
    });

    setProjectMatchOptions(matches);
    setSelectedProjectMatchIndex(0);
  }, [projectFuse, projects]);

  // Fuzzy search for best matching task from projects or admin tasks
  const findBestTaskMatch = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setTaskMatchOptions([]);
      setSelectedTaskMatchIndex(0);
      return;
    }

    // Don't search if it starts with slash (menu command)
    if (query.startsWith('/')) {
      setTaskMatchOptions([]);
      setSelectedTaskMatchIndex(0);
      return;
    }

    const taskResults = taskFuse.search(query).slice(0, 5); // Top 5 tasks

    if (taskResults.length === 0) {
      setTaskMatchOptions([]);
      setSelectedTaskMatchIndex(0);
      return;
    }

    const matches = taskResults.map(result => {
      const task = result.item;
      const taskName = task.name || task.content || task.title || "Unnamed task";
      const duration = task.duration || task.metadata?.duration || 30;

      if (task.source === 'project') {
        return {
          type: 'project' as const,
          item: task,
          preview: `${taskName} (${task.projectName}, ${duration}min)`
        };
      } else {
        return {
          type: 'admin' as const,
          item: task,
          preview: `${taskName} (admin task, ${duration}min)`
        };
      }
    });

    setTaskMatchOptions(matches);
    setSelectedTaskMatchIndex(0); // Reset to first option
  }, [taskFuse]);

  // Simple keyboard handler for typing
  useEffect(() => {
    const parser = new TextCommandParser();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Log arrow keys for debugging
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        console.log('Arrow key in handleKeyDown:', e.key, {
          targetTag: (e.target as HTMLElement).tagName,
          isTypingTask,
          isTypingCommand
        });
      }
      
      // Skip if in input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Handle keyboard shortcuts when typing
      if ((e.metaKey || e.ctrlKey) && (isTypingCommand || isTypingTask)) {
        // Cmd+V - Paste
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          navigator.clipboard.readText().then(text => {
            if (isTypingCommand) {
              setCommandInput(commandInput + text);
            } else if (isTypingTask) {
              setTaskInput(taskInput + text);
            }
          });
          return;
        }

        // Cmd+Backspace - Delete to beginning
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (isTypingCommand) {
            setCommandInput('');
            setShowSlashMenu(false);
            setMatchOptions([]);
            setSelectedMatchIndex(0);
          } else if (isTypingTask) {
            setTaskInput('');
            setShowTaskCommandMenu(false);
            setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);
          }
          return;
        }
      }

      // Handle view switching with Cmd/Ctrl + Arrow keys (but not during note edit, task selection, or multi-grab)
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp' && !isEditingNote && !isTypingTask && grabbedTasks.length === 0) {
        e.preventDefault();
        // Switch to schedule (timeline) view
        switchView('schedule');
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown' && !isEditingNote && !isTypingTask) {
        // Don't switch views if we have grabbed tasks (allow navigation for multi-grab)
        if (grabbedTasks.length === 0) {
          e.preventDefault();
          // Switch to inventory (you) view
          switchView('you');
          return;
        }
      }

      // Handle day switching with Cmd/Ctrl + Left/Right arrow keys (but not during note edit)
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowLeft' && !isEditingNote) {
        e.preventDefault();
        if (!isLoadingDays && currentDay === 'tomorrow') {
          setCurrentDay('today');
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight' && !isEditingNote) {
        e.preventDefault();
        if (!isLoadingDays && currentDay === 'today') {
          setCurrentDay('tomorrow');
        }
        return;
      }
      
      // Handle AI Chat with Cmd/Ctrl + J
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setShowAIChat(!showAIChat);
        return;
      }

      // Handle Command Palette with Cmd/Ctrl + K or Cmd/Ctrl + I
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }
      
      // Let F1 and F2 be handled by the command system (keeping for backward compatibility)
      if (e.key === 'F1' || e.key === 'F2' || e.key.toLowerCase() === 'f1' || e.key.toLowerCase() === 'f2') {
        return;
      }
      
      // Only handle keys in schedule view
      if (cmdViewMode !== 'schedule') return;
      
      // If any menu is open, only allow certain keys through
      if (showSlashMenu || showBlockTypeMenu || showBlockTimeMenu || showRoutineSelectionMenu) {
        // Allow typing, backspace, escape, and enter to work
        const allowedKeys = ['Backspace', 'Escape', 'Enter'];
        const isTypingKey = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
        if (!allowedKeys.includes(e.key) && !isTypingKey) {
          return; // Block navigation keys like arrows
        }
      }
      
      // If task command menu is open AND we're actually showing the slash menu (not subsequent popups)
      // Only block navigation when taskInput is exactly "/" 
      if (showTaskCommandMenu && taskInput === '/') {
        // Allow typing, backspace, escape, and enter to work
        const allowedKeys = ['Backspace', 'Escape', 'Enter'];
        const isTypingKey = e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
        if (!allowedKeys.includes(e.key) && !isTypingKey) {
          return; // Block navigation keys like arrows
        }
      }
      
      // Determine actual context based on selection
      const actualContext = selectedTaskIndex !== null ? CommandContext.TASK_LEVEL :
                           selectedBlockIndex >= 0 ? CommandContext.BLOCK_LEVEL :
                           CommandContext.VIEW_SCHEDULE;
      
      // Handle Command+Enter for task/block completion
      // Don't handle if typing task (popups may be open for multi-selection)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isTypingTask) {
        e.preventDefault();

        if (selectedTaskIndex !== null && selectedBlockIndex !== null) {
          // Toggle the completion status of the selected task
          console.log('[Task Complete] Toggling task at index:', selectedTaskIndex);
          toggleTask(selectedBlockIndex, selectedTaskIndex);
        } else if (selectedBlockIndex >= 0 && selectedTaskIndex === null) {
          // Toggle the completion status of the selected block
          console.log('[Block Complete] Toggling block at index:', selectedBlockIndex);
          toggleBlockCompletion(selectedBlockIndex);
        }
        return;
      }
      
      // Handle Enter key
      if (e.key === 'Enter') {
        // Don't handle Enter if task command menu is open - let it handle selection
        if (showTaskCommandMenu && taskInput === '/') {
          return;
        }

        // Don't handle Enter if any block menu is open - let them handle selection
        if (showSlashMenu || showBlockTypeMenu || showBlockTimeMenu || showEventSelectionMenu || showRoutineSelectionMenu) {
          return;
        }

        // Handle Enter to drop multiple grabbed tasks
        if (grabbedTasks.length > 0 && !isSelectingTasks) {
          e.preventDefault();

          // Determine target block and position
          let targetBlockIndex = selectedBlockIndex;
          let insertAtIndex = 0; // Default to beginning of block

          if (selectedTaskIndex !== null && selectedTaskIndex >= 0) {
            // Insert after the selected task
            insertAtIndex = selectedTaskIndex + 1;
          } else if (taskInputPosition >= 0) {
            // Insert at the task input position
            insertAtIndex = taskInputPosition;
          }

          if (targetBlockIndex >= 0 && targetBlockIndex < blocks.length) {
            const newBlocks = [...blocks];

            // Sort grabbed tasks by their grab order (already in the array order)
            // Remove tasks from their original blocks (in reverse order to maintain indices)
            const tasksToRemove: Array<{ blockIndex: number; taskIndex: number }> = [];

            // Build a list of tasks to remove
            grabbedTasks.forEach(gt => {
              tasksToRemove.push({ blockIndex: gt.blockIndex, taskIndex: gt.taskIndex });
            });

            // Sort by block index (descending) then task index (descending) to remove from end first
            tasksToRemove.sort((a, b) => {
              if (a.blockIndex !== b.blockIndex) return b.blockIndex - a.blockIndex;
              return b.taskIndex - a.taskIndex;
            });

            // Remove tasks from their original locations
            const removedTasks: Array<any> = [];
            tasksToRemove.forEach(({ blockIndex, taskIndex }) => {
              // Find the actual current index (since we're modifying the array)
              const gt = grabbedTasks.find(t => t.blockIndex === blockIndex && t.taskIndex === taskIndex);
              if (gt) {
                newBlocks[blockIndex].tasks = newBlocks[blockIndex].tasks || [];
                // Only remove if the task still exists at this position
                if (newBlocks[blockIndex].tasks[taskIndex]) {
                  newBlocks[blockIndex].tasks.splice(taskIndex, 1);
                }
              }
            });

            // Insert all grabbed tasks in order at the target position
            newBlocks[targetBlockIndex].tasks = newBlocks[targetBlockIndex].tasks || [];
            grabbedTasks.forEach((gt, index) => {
              newBlocks[targetBlockIndex].tasks.splice(insertAtIndex + index, 0, gt.task);
            });

            setBlocks(newBlocks);

            // Persist the moves to the server
            const targetBlock = blocks[targetBlockIndex];

            // Move each task to the target block
            grabbedTasks.forEach((gt, index) => {
              const task = gt.task;
              const sourceBlock = blocks[gt.blockIndex];

              if (task.id && !task.id.startsWith('temp-') &&
                  sourceBlock.id && !sourceBlock.id.startsWith('temp-') &&
                  targetBlock.id && !targetBlock.id.startsWith('temp-')) {

                // If moving within the same block, just reorder
                if (gt.blockIndex === targetBlockIndex) {
                  // The reorder will be handled by the final reorder-tasks call below
                } else {
                  // Moving between blocks
                  fetch(`/api/tasks/${task.id}/move`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fromBlockId: sourceBlock.id,
                      toBlockId: targetBlock.id,
                      position: insertAtIndex + index
                    })
                  }).catch(error => {
                    console.error('Error moving task between blocks:', error);
                  });
                }
              }
            });

            // Update the target block's task order
            if (targetBlock.id && !targetBlock.id.startsWith('temp-')) {
              const taskIds = newBlocks[targetBlockIndex].tasks?.map(t => t.id) || [];
              fetch(`/api/blocks/${targetBlock.id}/reorder-tasks`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskIds })
              }).catch(error => {
                console.error('Error persisting task order:', error);
              });
            }

            // Clear the grabbed tasks
            setGrabbedTasks([]);
            setIsSelectingTasks(false);

            // Update selection to the first dropped task
            setSelectedTaskIndex(insertAtIndex);
            setSelectedBlockIndex(targetBlockIndex);
          }

          return;
        }

        // Handle Enter at between position
        if (cursorPosition.type === 'between') {
          e.preventDefault();

          // Check if typing a quick command
          if (isTypingCommand) {
            const quickCommand = parseQuickCommand(commandInput);
            if (quickCommand) {
              // Execute quick command - create block immediately
              handleBlockCreate(
                { type: quickCommand.type, label: quickCommand.label, duration: quickCommand.duration },
                quickCommand.time
              );
              setCommandInput('');
              setIsTypingCommand(false);
              setShowSlashMenu(false);
              setMatchOptions([]);
            setSelectedMatchIndex(0);
              return;
            }

            // Check for enhanced command with custom name
            // Calculate smart time based on cursor position
            let insertAfterIndex = cursorPosition.afterIndex;
            let smartTime = '09:00';
            if (insertAfterIndex >= 0 && blocks[insertAfterIndex]) {
              const prevBlock = blocks[insertAfterIndex];
              smartTime = calculateEndTime(prevBlock.time, prevBlock.duration || 60);
            } else if (insertAfterIndex === -1 && blocks.length > 0) {
              const nextBlock = blocks[0];
              // For enhanced commands, we need to know the duration first
              // Use a reasonable default (45 min for admin)
              smartTime = calculateStartTime(nextBlock.time, 45);
            } else if (blocks.length === 0) {
              const now = new Date();
              const hours = now.getHours();
              const minutes = Math.ceil(now.getMinutes() / 15) * 15;
              if (minutes === 60) {
                smartTime = `${(hours + 1).toString().padStart(2, '0')}:00`;
              } else {
                smartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
            }

            const enhancedCommand = parseEnhancedCommand(commandInput, smartTime);
            if (enhancedCommand) {
              // Execute enhanced command - create block with custom name
              console.log('[Enhanced Create] Creating block:', enhancedCommand);
              handleBlockCreate(
                { type: enhancedCommand.type, label: enhancedCommand.label, duration: enhancedCommand.duration },
                enhancedCommand.time
              );
              setCommandInput('');
              setIsTypingCommand(false);
              setShowSlashMenu(false);
              setMatchOptions([]);
            setSelectedMatchIndex(0);
              return;
            }

            // Check if we have a best match prediction
            if (bestMatch) {
              if (bestMatch.type === 'routine') {
                handleRoutineSelect(bestMatch.item);
              } else {
                handleEventSelect(bestMatch.item);
              }
              setCommandInput('');
              setIsTypingCommand(false);
              setMatchOptions([]);
            setSelectedMatchIndex(0);
              return;
            }

            // If user typed something that's not a quick command, enhanced command, or match, create a default admin block
            if (commandInput.trim()) {
              console.log('[Default Create] Creating block with name:', commandInput.trim());

              // Create admin block with default settings (using already calculated smartTime)
              handleBlockCreate(
                { type: 'admin', label: commandInput.trim(), duration: 45 },
                smartTime
              );
              setCommandInput('');
              setIsTypingCommand(false);
              return;
            }
          }

          // Otherwise, select the next block
          if (!isTypingCommand) {
            const nextBlockIndex = cursorPosition.afterIndex + 1;
            if (nextBlockIndex < blocks.length) {
              setCursorPosition({ type: 'block', index: nextBlockIndex });
              setSelectedBlockIndex(nextBlockIndex);
            }
          }
          return;
        }
        
        // Handle Enter at an input position (whether typing or not)
        if (taskInputPosition >= -1) {
          e.preventDefault();

          // If typing and have input, add the task
          if (isTypingTask && taskInput.trim()) {
            // Check if we're selecting a project from autocomplete
            if (showProjectAutocomplete && bestProjectMatch) {
              // User is selecting a project - remove the @ tag and create task immediately
              const project = bestProjectMatch.item;
              const projectId = project._id || project.id;
              const atIndex = taskInput.lastIndexOf('@');

              if (atIndex !== -1) {
                // Remove the @tag portion from input to get clean task name
                const cleanedInput = taskInput.substring(0, atIndex).trim();

                if (cleanedInput) {
                  // Create the task immediately with the project
                  addTask({ title: cleanedInput, duration: 30, projectId }, taskInputPosition + 1);

                  // Clean up state
                  setTaskInput('');
                  setSelectedProjectId(null);
                  setShowProjectAutocomplete(false);
                  setProjectMatchOptions([]);
                  setSelectedProjectMatchIndex(0);

                  // Move cursor to after the new task
                  setTaskInputPosition(taskInputPosition + 1);
                  setIsTypingTask(false);
                }
              }
              return;
            }

            // Check if we have a best task match prediction
            if (bestTaskMatch) {
              const task = bestTaskMatch.item;
              const taskTitle = task.name || task.content || task.title || taskInput.trim();
              const taskDuration = task.duration || task.metadata?.duration || 30;
              const projectId = task.projectId;
              const taskId = task._id || task.id;

              console.log('BEFORE adding matched task:', {
                taskInputPosition,
                insertAt: taskInputPosition + 1,
                taskTitle,
                taskDuration,
                projectId,
                taskId
              });

              // Add the matched task from inventory
              addTask({ title: taskTitle, duration: taskDuration, projectId, taskId }, taskInputPosition + 1);
              setTaskInput('');
              setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);

              // After adding, move cursor to after the new task
              const newPosition = taskInputPosition + 1;
              console.log('AFTER adding matched task, setting position to:', newPosition);
              setTaskInputPosition(newPosition);

              // Stop typing so navigation works
              setIsTypingTask(false);
            } else {
              console.log('BEFORE adding task:', {
                taskInputPosition,
                insertAt: taskInputPosition + 1,
                taskTitle: taskInput.trim()
              });

              // Add the task at the current position
              // taskInputPosition -1 means before first, 0 means after first, etc.
              // So we insert at position taskInputPosition + 1
              addTask({ title: taskInput.trim(), duration: 30, projectId: selectedProjectId || undefined }, taskInputPosition + 1);
              setTaskInput('');
              setSelectedProjectId(null); // Clear selected project after creating task

              // After adding, move cursor to after the new task
              const newPosition = taskInputPosition + 1;
              console.log('AFTER adding task, setting position to:', newPosition);
              setTaskInputPosition(newPosition);

              // Stop typing so navigation works
              setIsTypingTask(false);
            }
          } else {
            // Either not typing or typing with empty input - exit to view level
            setTaskInput('');
            setIsTypingTask(false);
            setTaskInputPosition(-2);
            
            // Exit to between blocks (view level)
            console.log('Exiting to view level, setting selectedBlockIndex to -1');
            setCursorPosition({ type: 'between', afterIndex: selectedBlockIndex });
            setSelectedBlockIndex(-1);
            setSelectedTaskIndex(null); // Clear task selection too
          }
          return;
        }
      }
      
      // Handle Up/Down arrows to navigate through predictions when typing
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && (isTypingCommand || isTypingTask)) {
        // Check if we're navigating through project autocomplete
        if (isTypingTask && showProjectAutocomplete && projectMatchOptions.length > 0) {
          e.preventDefault();

          if (e.key === 'ArrowDown') {
            // Move down in the project list
            const newIndex = (selectedProjectMatchIndex + 1) % projectMatchOptions.length;
            setSelectedProjectMatchIndex(newIndex);
          } else {
            // Move up in the project list
            const newIndex = (selectedProjectMatchIndex - 1 + projectMatchOptions.length) % projectMatchOptions.length;
            setSelectedProjectMatchIndex(newIndex);
          }
          return;
        }

        // Regular task/command autocomplete navigation
        const options = isTypingCommand ? matchOptions : taskMatchOptions;
        const currentIndex = isTypingCommand ? selectedMatchIndex : selectedTaskMatchIndex;

        if (options.length > 0) {
          e.preventDefault();

          if (e.key === 'ArrowDown') {
            // Move down in the list
            const newIndex = (currentIndex + 1) % options.length;
            if (isTypingCommand) {
              setSelectedMatchIndex(newIndex);
            } else {
              setSelectedTaskMatchIndex(newIndex);
            }
          } else {
            // Move up in the list
            const newIndex = (currentIndex - 1 + options.length) % options.length;
            if (isTypingCommand) {
              setSelectedMatchIndex(newIndex);
            } else {
              setSelectedTaskMatchIndex(newIndex);
            }
          }
          return;
        }
      }

      // Handle Escape key to cancel typing or exit task level
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // Close all menus if any are open
        if (showSlashMenu || showBlockTypeMenu || showBlockTimeMenu || showRoutineSelectionMenu) {
          setShowSlashMenu(false);
          setShowBlockTypeMenu(false);
          setShowBlockTimeMenu(false);
          setShowRoutineSelectionMenu(false);
          setSelectedBlockType(null);
          setCommandInput('');
          setIsTypingCommand(false);
          setMatchOptions([]);
          setSelectedMatchIndex(0);
          return;
        }
        
        // Close task command menu if open
        if (showTaskCommandMenu) {
          setShowTaskCommandMenu(false);
          setTaskInput('');
          setIsTypingTask(false);
          setTaskMatchOptions([]);
          setSelectedTaskMatchIndex(0);
          return;
        }
        
        // Close event selection menu if open
        if (showEventSelectionMenu) {
          setShowEventSelectionMenu(false);
          return;
        }
        
        // Exit multi-task grab mode if active
        if (grabbedTasks.length > 0) {
          setGrabbedTasks([]);
          setIsSelectingTasks(false);
          return;
        }

        // Exit grab mode if active
        if (grabbedBlockIndex !== null) {
          setGrabbedBlockIndex(null);
          return;
        }

        if (grabbedTaskIndex !== null) {
          setGrabbedTaskIndex(null);
          return;
        }
        
        // Exit edit mode if active
        if (isEditingBlock) {
          setIsEditingBlock(false);
          setEditingBlockIndex(null);
          setEditBlockType('');
          setEditBlockTime('');
          return;
        }
        
        if (isEditingTask) {
          setIsEditingTask(false);
          setEditingTaskIndex(null);
          setEditTaskName('');
          setEditTaskDuration('');
          return;
        }
        
        if (isTypingTask || isTypingCommand) {
          // If predictions are showing, dismiss them first (keep typed text)
          if ((isTypingCommand && matchOptions.length > 0) || (isTypingTask && taskMatchOptions.length > 0)) {
            setMatchOptions([]);
            setTaskMatchOptions([]);
            setSelectedMatchIndex(0);
            setSelectedTaskMatchIndex(0);
          } else {
            // No predictions, clear input and exit typing mode
            setTaskInput('');
            setCommandInput('');
            setIsTypingTask(false);
            setIsTypingCommand(false);
          }
        } else if (taskInputPosition >= -1) {
          // Exit from task input position - switch to task selection if there are tasks
          const block = blocks[selectedBlockIndex];
          if (block?.tasks?.length > 0) {
            setTaskInputPosition(-2);
            // Select the first task after the input position, or first task if at -1
            const taskToSelect = taskInputPosition === -1 ? 0 : Math.min(taskInputPosition + 1, block.tasks.length - 1);
            setSelectedTaskIndex(taskToSelect);
          } else {
            // No tasks, just exit to block level
            setTaskInputPosition(-2);
          }
        } else if (selectedTaskIndex !== null) {
          // Exit from task selection to block level
          setSelectedTaskIndex(null);
        }
        return;
      }
      
      // Handle 'g' key to grab/release a block or task
      if (e.key === 'g' && !isTypingTask && !isTypingCommand && !isEditingBlock && !isEditingTask && !isEditingNote) {
        e.preventDefault();

        // Check if Cmd (metaKey) or Ctrl is held for multi-task grabbing
        const isMultiGrabKey = e.metaKey || e.ctrlKey;

        if (selectedTaskIndex !== null && selectedBlockIndex >= 0) {
          if (isMultiGrabKey) {
            // Multi-task grab mode with Cmd+G
            const currentBlock = blocks[selectedBlockIndex];
            const currentTask = currentBlock.tasks?.[selectedTaskIndex];

            if (currentTask) {
              // Check if this task is already grabbed
              const alreadyGrabbed = grabbedTasks.some(
                gt => gt.blockIndex === selectedBlockIndex && gt.taskIndex === selectedTaskIndex
              );

              if (!alreadyGrabbed) {
                // Add this task to the grabbed collection
                setGrabbedTasks(prev => [...prev, {
                  blockIndex: selectedBlockIndex,
                  taskIndex: selectedTaskIndex,
                  task: currentTask,
                  originalBlockId: currentBlock.id
                }]);
                setIsSelectingTasks(true);
              }
            }
          } else {
            // Single task grab mode (no Cmd key)
            // Only allow if not in multi-grab mode
            if (grabbedTasks.length === 0) {
              if (grabbedTaskIndex === null) {
                setGrabbedTaskIndex(selectedTaskIndex);
              } else {
                setGrabbedTaskIndex(null);
              }
            }
          }
          return;
        } else if (selectedBlockIndex >= 0 && selectedTaskIndex === null && taskInputPosition === -2) {
          // Toggle grab mode for block (only if not in multi-task mode)
          if (grabbedTasks.length === 0) {
            if (grabbedBlockIndex === null) {
              console.log('🎯 Entering grab mode for block at index:', selectedBlockIndex);
              setGrabbedBlockIndex(selectedBlockIndex);
              setGrabbedBlockOriginalIndex(selectedBlockIndex); // Save original position
            } else {
              // This case is now handled in the grab mode section above
              setGrabbedBlockIndex(null);
              setGrabbedBlockOriginalIndex(null);
            }
          }
          return;
        }
      }
      
      // Handle 'n' key to enter note edit mode
      if (e.key === 'n' && !isTypingTask && !isTypingCommand && !isEditingBlock && !isEditingTask && !isEditingNote && grabbedBlockIndex === null) {
        if (selectedBlockIndex >= 0 && selectedTaskIndex === null && taskInputPosition === -2) {
          // We're at block level, enter note edit mode
          e.preventDefault();
          const block = blocks[selectedBlockIndex];
          setIsEditingNote(true);
          setEditingNoteBlockIndex(selectedBlockIndex);
          setEditNoteValue(block.note || '');
          return;
        }
      }

      // Handle 'e' key to enter edit mode
      if (e.key === 'e' && !isTypingTask && !isTypingCommand && !isEditingBlock && !isEditingTask && !isEditingNote && grabbedBlockIndex === null) {
        if (selectedTaskIndex !== null && selectedBlockIndex >= 0) {
          // We're at task level, enter task edit mode
          e.preventDefault();
          const task = blocks[selectedBlockIndex].tasks[selectedTaskIndex];
          setIsEditingTask(true);
          setEditingTaskIndex(selectedTaskIndex);
          setEditTaskName(task.title);
          setEditTaskDuration(task.duration.toString());
          setTaskEditFieldFocus('name');
          return;
        } else if (selectedBlockIndex >= 0 && selectedTaskIndex === null && taskInputPosition === -2) {
          // We're at block level, enter block edit mode
          e.preventDefault();
          const block = blocks[selectedBlockIndex];
          setIsEditingBlock(true);
          setEditingBlockIndex(selectedBlockIndex);
          setEditBlockType(block.type);
          setEditBlockTime(block.time);
          setEditFieldFocus('time');
          setTimeEditPosition(0); // Start at beginning of time
          return;
        }
      }
      
      // Handle navigation within edit mode
      if (isEditingBlock) {
        e.preventDefault();
        
        if (e.key === 'Tab') {
          // Toggle between time and type fields
          setEditFieldFocus(editFieldFocus === 'time' ? 'type' : 'time');
        } else if (e.key === 'Enter') {
          // Save changes
          const updatedBlocks = [...blocks];
          updatedBlocks[editingBlockIndex!] = {
            ...updatedBlocks[editingBlockIndex!],
            type: editBlockType as any,
            time: editBlockTime
          };
          setBlocks(updatedBlocks);
          
          // Persist to database
          const blockToUpdate = updatedBlocks[editingBlockIndex!];
          if (blockToUpdate.id && !blockToUpdate.id.startsWith('temp-')) {
            fetch(`/api/blocks/${blockToUpdate.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                time: editBlockTime,
                type: editBlockType
              })
            }).then(response => {
              if (!response.ok) {
                console.error('Failed to update block time/type');
              }
            }).catch(error => {
              console.error('Error updating block:', error);
            });
          }
          
          // Exit edit mode
          setIsEditingBlock(false);
          setEditingBlockIndex(null);
          setEditBlockType('');
          setEditBlockTime('');
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (editFieldFocus === 'type') {
            // Cycle through block types
            const types = ['deep-work', 'admin', 'break', 'meeting', 'personal'];
            const currentIndex = types.indexOf(editBlockType);
            const newIndex = e.key === 'ArrowUp' 
              ? (currentIndex - 1 + types.length) % types.length
              : (currentIndex + 1) % types.length;
            setEditBlockType(types[newIndex]);
          } else if (editFieldFocus === 'time') {
            // Adjust time by 15 minutes
            const [hours, minutes] = editBlockTime.split(':').map(Number);
            let totalMinutes = hours * 60 + minutes;
            
            if (e.key === 'ArrowUp') {
              totalMinutes = (totalMinutes + 15) % (24 * 60);
            } else {
              totalMinutes = (totalMinutes - 15 + 24 * 60) % (24 * 60);
            }
            
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            setEditBlockTime(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
          }
        } else if (editFieldFocus === 'time' && e.key === 'ArrowLeft') {
          // Move cursor left in time field
          if (timeEditPosition > 0) {
            // Skip colon at position 2
            const newPos = timeEditPosition === 3 ? 1 : timeEditPosition - 1;
            setTimeEditPosition(newPos);
          }
        } else if (editFieldFocus === 'time' && e.key === 'ArrowRight') {
          // Move cursor right in time field
          if (timeEditPosition < 4) {
            // Skip colon at position 2
            const newPos = timeEditPosition === 1 ? 3 : timeEditPosition + 1;
            setTimeEditPosition(newPos);
          }
        } else if (editFieldFocus === 'time' && e.key.length === 1 && /[0-9]/.test(e.key)) {
          // Handle number input at cursor position
          const timeArray = editBlockTime.split('');
          const digitPositions = [0, 1, 3, 4]; // Skip position 2 (colon)
          
          if (digitPositions.includes(timeEditPosition)) {
            timeArray[timeEditPosition] = e.key;
            setEditBlockTime(timeArray.join(''));
            
            // Move cursor right after typing
            if (timeEditPosition < 4) {
              const newPos = timeEditPosition === 1 ? 3 : timeEditPosition + 1;
              setTimeEditPosition(newPos);
            }
          }
        } else if (editFieldFocus === 'time' && e.key === 'Backspace') {
          // Handle backspace - only delete digits, not colon
          if (timeEditPosition > 0) {
            const prevPos = timeEditPosition === 3 ? 1 : timeEditPosition - 1;
            if (prevPos !== 2) { // Don't delete the colon
              const timeArray = editBlockTime.split('');
              timeArray[prevPos] = '0';
              setEditBlockTime(timeArray.join(''));
              setTimeEditPosition(prevPos);
            }
          }
        }
        return;
      }
      
      // Handle arrow keys in grab mode for tasks (only when not in selection mode)
      // Support both single task grab (grabbedTaskIndex) and multi-task grab (grabbedTasks)
      if ((grabbedTaskIndex !== null || grabbedTasks.length > 0) && !isSelectingTasks && selectedBlockIndex >= 0) {
        const block = blocks[selectedBlockIndex];
        const tasks = block.tasks || [];

        if (e.key === 'Enter') {
          e.preventDefault();

          // If we have grabbedTasks, use the multi-task handler instead
          if (grabbedTasks.length > 0) {
            // Don't handle here - let the multi-task Enter handler (line 1567) handle it
            return;
          }

          // Single task release
          setGrabbedTaskIndex(null);
          setGrabbedTasks([]); // Clear multi-grab state

          // Persist the new task order to database
          const currentBlock = blocks[selectedBlockIndex];
          if (currentBlock.id && !currentBlock.id.startsWith('temp-')) {
            // Update the block with the new task order
            const taskIds = currentBlock.tasks?.map(t => t.id) || [];
            fetch(`/api/blocks/${currentBlock.id}/reorder-tasks`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ taskIds })
            }).catch(error => {
              console.error('Error persisting task order:', error);
            });
          }
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();

          const taskCount = grabbedTasks.length > 0 ? grabbedTasks.length : 1;
          const currentIndex = grabbedTaskIndex !== null ? grabbedTaskIndex : (grabbedTasks.length > 0 ? grabbedTasks[0].taskIndex : 0);

          if (currentIndex > 0) {
            // Move task(s) up within block
            const newBlocks = [...blocks];
            const newTasks = [...tasks];

            // Extract the grabbed task(s)
            const grabbedGroup = newTasks.splice(currentIndex, taskCount);
            // Insert them one position up
            const newIndex = currentIndex - 1;
            newTasks.splice(newIndex, 0, ...grabbedGroup);

            newBlocks[selectedBlockIndex].tasks = newTasks;
            setBlocks(newBlocks);

            // Update indices
            if (grabbedTaskIndex !== null) {
              setGrabbedTaskIndex(newIndex);
            }
            setSelectedTaskIndex(newIndex);

            // Update grabbedTasks positions
            if (grabbedTasks.length > 0) {
              const updatedGrabbedTasks = grabbedTasks.map((gt, i) => ({
                ...gt,
                taskIndex: newIndex + i
              }));
              setGrabbedTasks(updatedGrabbedTasks);
            }
          } else if (currentIndex === 0 && selectedBlockIndex > 0) {
            // Move task(s) to end of previous block
            const newBlocks = [...blocks];
            const taskCount = grabbedTasks.length > 0 ? grabbedTasks.length : 1;
            const grabbedGroup = newBlocks[selectedBlockIndex].tasks.splice(currentIndex, taskCount);
            const prevBlockIndex = selectedBlockIndex - 1;
            newBlocks[prevBlockIndex].tasks = newBlocks[prevBlockIndex].tasks || [];
            const insertIndex = newBlocks[prevBlockIndex].tasks.length;
            newBlocks[prevBlockIndex].tasks.push(...grabbedGroup);
            setBlocks(newBlocks);

            // Persist the move between blocks (for each task)
            const fromBlock = blocks[selectedBlockIndex];
            const toBlock = blocks[prevBlockIndex];
            grabbedGroup.forEach((task, i) => {
              if (task.id && !task.id.startsWith('temp-') &&
                  fromBlock.id && !fromBlock.id.startsWith('temp-') &&
                  toBlock.id && !toBlock.id.startsWith('temp-')) {
                fetch(`/api/tasks/${task.id}/move`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fromBlockId: fromBlock.id,
                    toBlockId: toBlock.id,
                    position: insertIndex + i
                  })
                }).catch(error => {
                  console.error('Error moving task between blocks:', error);
                });
              }
            });

            // Update indices to follow the task(s)
            const newTaskIndex = insertIndex;
            setSelectedBlockIndex(prevBlockIndex);
            if (grabbedTaskIndex !== null) {
              setGrabbedTaskIndex(newTaskIndex);
            }
            setSelectedTaskIndex(newTaskIndex);
            setCursorPosition({ type: 'block', index: prevBlockIndex });

            // Update grabbedTasks positions
            if (grabbedTasks.length > 0) {
              const updatedGrabbedTasks = grabbedTasks.map((gt, i) => ({
                ...gt,
                blockIndex: prevBlockIndex,
                taskIndex: newTaskIndex + i
              }));
              setGrabbedTasks(updatedGrabbedTasks);
            }
          }
          return;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();

          const taskCount = grabbedTasks.length > 0 ? grabbedTasks.length : 1;
          const currentIndex = grabbedTaskIndex !== null ? grabbedTaskIndex : (grabbedTasks.length > 0 ? grabbedTasks[0].taskIndex : 0);
          const lastGrabbedIndex = currentIndex + taskCount - 1;

          if (lastGrabbedIndex < tasks.length - 1) {
            // Move task(s) down within block
            const newBlocks = [...blocks];
            const newTasks = [...tasks];

            // Extract the grabbed task(s)
            const grabbedGroup = newTasks.splice(currentIndex, taskCount);
            // Insert them one position down
            const newIndex = currentIndex + 1;
            newTasks.splice(newIndex, 0, ...grabbedGroup);

            newBlocks[selectedBlockIndex].tasks = newTasks;
            setBlocks(newBlocks);

            // Update indices
            if (grabbedTaskIndex !== null) {
              setGrabbedTaskIndex(newIndex);
            }
            setSelectedTaskIndex(newIndex);

            // Update grabbedTasks positions
            if (grabbedTasks.length > 0) {
              const updatedGrabbedTasks = grabbedTasks.map((gt, i) => ({
                ...gt,
                taskIndex: newIndex + i
              }));
              setGrabbedTasks(updatedGrabbedTasks);
            }
          } else if (lastGrabbedIndex === tasks.length - 1 && selectedBlockIndex < blocks.length - 1) {
            // Move task(s) to beginning of next block
            const newBlocks = [...blocks];
            const grabbedGroup = newBlocks[selectedBlockIndex].tasks.splice(currentIndex, taskCount);
            const nextBlockIndex = selectedBlockIndex + 1;
            newBlocks[nextBlockIndex].tasks = newBlocks[nextBlockIndex].tasks || [];
            newBlocks[nextBlockIndex].tasks.unshift(...grabbedGroup);
            setBlocks(newBlocks);

            // Persist the move between blocks (for each task)
            const fromBlock = blocks[selectedBlockIndex];
            const toBlock = blocks[nextBlockIndex];
            grabbedGroup.forEach((task, i) => {
              if (task.id && !task.id.startsWith('temp-') &&
                  fromBlock.id && !fromBlock.id.startsWith('temp-') &&
                  toBlock.id && !toBlock.id.startsWith('temp-')) {
                fetch(`/api/tasks/${task.id}/move`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fromBlockId: fromBlock.id,
                    toBlockId: toBlock.id,
                    position: i // Insert at beginning, maintaining order
                  })
                }).catch(error => {
                  console.error('Error moving task between blocks:', error);
                });
              }
            });

            // Update indices to follow the task(s)
            setSelectedBlockIndex(nextBlockIndex);
            if (grabbedTaskIndex !== null) {
              setGrabbedTaskIndex(0);
            }
            setSelectedTaskIndex(0);
            setCursorPosition({ type: 'block', index: nextBlockIndex });

            // Update grabbedTasks positions
            if (grabbedTasks.length > 0) {
              const updatedGrabbedTasks = grabbedTasks.map((gt, i) => ({
                ...gt,
                blockIndex: nextBlockIndex,
                taskIndex: i
              }));
              setGrabbedTasks(updatedGrabbedTasks);
            }
          }
          return;
        }
      }
      
      // Handle arrow keys in grab mode for blocks
      if (grabbedBlockIndex !== null) {
        if (e.key === 'Enter' || e.key === 'g') {
          e.preventDefault();
          console.log('🎯 Releasing grabbed block and showing time popup');
          
          // Calculate suggested time for current position
          let suggestedTime = '09:00';
          if (grabbedBlockIndex === 0) {
            suggestedTime = '08:00';
          } else {
            const prevBlock = blocks[grabbedBlockIndex - 1];
            suggestedTime = calculateEndTime(prevBlock.time, prevBlock.duration);
          }
          
          // Show time popup for the block's current position
          // oldIndex is the original position, newIndex is where it is now
          setPendingMove({ oldIndex: grabbedBlockOriginalIndex || grabbedBlockIndex, newIndex: grabbedBlockIndex });
          setMoveSuggestedTime(suggestedTime);
          setShowMoveTimePopup(true);
          setGrabbedBlockIndex(null);
          return;
        } else if (e.key === 'ArrowUp' && grabbedBlockIndex > 0) {
          e.preventDefault();
          const newIndex = grabbedBlockIndex - 1;
          
          console.log('🎯 Moving block up:', {
            from: grabbedBlockIndex,
            to: newIndex
          });
          
          // Just move the block, don't show popup yet
          const newBlocks = [...blocks];
          [newBlocks[grabbedBlockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[grabbedBlockIndex]];
          setBlocks(newBlocks);
          
          // Update indices to follow the block
          setGrabbedBlockIndex(newIndex);
          setSelectedBlockIndex(newIndex);
          setCursorPosition({ type: 'block', index: newIndex });
          return;
        } else if (e.key === 'ArrowDown' && grabbedBlockIndex < blocks.length - 1) {
          e.preventDefault();
          const newIndex = grabbedBlockIndex + 1;
          
          console.log('🎯 Moving block down:', {
            from: grabbedBlockIndex,
            to: newIndex
          });
          
          // Just move the block, don't show popup yet
          const newBlocks = [...blocks];
          [newBlocks[grabbedBlockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[grabbedBlockIndex]];
          setBlocks(newBlocks);
          
          // Update indices to follow the block
          setGrabbedBlockIndex(newIndex);
          setSelectedBlockIndex(newIndex);
          setCursorPosition({ type: 'block', index: newIndex });
          return;
        }
      }
      
      // Handle navigation within task edit mode
      if (isEditingTask) {
        e.preventDefault();
        
        if (e.key === 'Tab') {
          // Toggle between name and duration fields
          setTaskEditFieldFocus(taskEditFieldFocus === 'name' ? 'duration' : 'name');
        } else if (e.key === 'Enter') {
          // Save changes
          const updatedBlocks = [...blocks];
          const task = updatedBlocks[selectedBlockIndex].tasks[editingTaskIndex!];
          task.title = editTaskName;
          task.duration = parseInt(editTaskDuration) || 30;
          setBlocks(updatedBlocks);
          
          // Exit edit mode
          setIsEditingTask(false);
          setEditingTaskIndex(null);
          setEditTaskName('');
          setEditTaskDuration('');
        } else if (taskEditFieldFocus === 'name') {
          // Handle typing in name field
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            setEditTaskName(editTaskName + e.key);
          } else if (e.key === 'Backspace') {
            setEditTaskName(editTaskName.slice(0, -1));
          }
        } else if (taskEditFieldFocus === 'duration') {
          // Handle duration editing
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentDuration = parseInt(editTaskDuration) || 30;
            const newDuration = e.key === 'ArrowUp' 
              ? currentDuration + 15
              : Math.max(15, currentDuration - 15);
            setEditTaskDuration(newDuration.toString());
          } else if (e.key.length === 1 && /[0-9]/.test(e.key)) {
            // Allow typing numbers
            const newDuration = editTaskDuration + e.key;
            if (parseInt(newDuration) <= 999) { // Max 999 minutes
              setEditTaskDuration(newDuration);
            }
          } else if (e.key === 'Backspace') {
            setEditTaskDuration(editTaskDuration.slice(0, -1));
          }
        }
        return;
      }

      // Handle navigation within note edit mode
      if (isEditingNote) {
        e.preventDefault();

        if (e.key === 'Enter') {
          // Save note
          const updatedBlocks = [...blocks];
          updatedBlocks[editingNoteBlockIndex!].note = editNoteValue.trim();
          setBlocks(updatedBlocks);

          // Persist to database
          const blockToUpdate = updatedBlocks[editingNoteBlockIndex!];
          if (blockToUpdate.id && !blockToUpdate.id.startsWith('temp-')) {
            fetch(`/api/blocks/${blockToUpdate.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                note: editNoteValue.trim()
              })
            }).catch(error => console.error('Error saving note:', error));
          }

          // Exit note edit mode
          setIsEditingNote(false);
          setEditingNoteBlockIndex(null);
          setEditNoteValue('');
        } else if (e.key === 'Escape') {
          // Cancel editing
          setIsEditingNote(false);
          setEditingNoteBlockIndex(null);
          setEditNoteValue('');
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          // Type character
          setEditNoteValue(editNoteValue + e.key);
        } else if (e.key === 'Backspace') {
          setEditNoteValue(editNoteValue.slice(0, -1));
        } else if (e.key === ' ') {
          setEditNoteValue(editNoteValue + ' ');
        }
        return;
      }

      // Handle Backspace (with modifier for deletion)
      if (e.key === 'Backspace') {
        // If any menu is open, close all menus and clear command
        if (showSlashMenu || showBlockTypeMenu || showBlockTimeMenu || showRoutineSelectionMenu) {
          e.preventDefault();
          setShowSlashMenu(false);
          setShowBlockTypeMenu(false);
          setShowBlockTimeMenu(false);
          setShowRoutineSelectionMenu(false);
          setSelectedBlockType(null);
          setCommandInput('');
          setIsTypingCommand(false);
          return;
        }
        
        // If typing, always handle as text deletion
        if (isTypingTask || isTypingCommand) {
          e.preventDefault();
          if (isTypingTask) {
            if (taskInput.length > 0) {
              const newInput = taskInput.slice(0, -1);
              setTaskInput(newInput);
              // If we delete the slash, also hide the task command menu
              if (newInput === '') {
                setShowTaskCommandMenu(false);
                setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);
              } else {
                // Update search with new input
                // Defer search to next tick to avoid blocking render
                setTimeout(() => findBestTaskMatch(newInput), 0);
              }
            } else {
              // If input is empty, exit typing mode
              setIsTypingTask(false);
              setShowTaskCommandMenu(false);
              setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);
            }
          } else if (isTypingCommand) {
            if (commandInput.length > 0) {
              const newInput = commandInput.slice(0, -1);
              setCommandInput(newInput);
              // If we delete the slash, also hide the menu
              if (newInput === '') {
                setShowSlashMenu(false);
                setMatchOptions([]);
            setSelectedMatchIndex(0);
              } else {
                // Update search with new input
                // Defer search to next tick to avoid blocking render
                setTimeout(() => findBestMatch(newInput), 0);
              }
            } else {
              setIsTypingCommand(false);
              setShowSlashMenu(false);
              setMatchOptions([]);
            setSelectedMatchIndex(0);
            }
          }
          return;
        }
        
        // For deletion of blocks/tasks, require Cmd/Ctrl key
        const isDeleteCommand = e.metaKey || e.ctrlKey;
        
        if (isDeleteCommand) {
          e.preventDefault();
          
          if (selectedTaskIndex !== null && selectedBlockIndex !== null) {
            // Delete or unassign selected task
            console.log('[Delete] ===== BEFORE DELETE =====');
            console.log('[Delete] selectedBlockIndex:', selectedBlockIndex);
            console.log('[Delete] selectedTaskIndex:', selectedTaskIndex);
            console.log('[Delete] taskInputPosition:', taskInputPosition);
            console.log('[Delete] cursorPosition:', cursorPosition);

            const blockBeforeDelete = blocks[selectedBlockIndex];
            const taskCountBefore = blockBeforeDelete?.tasks?.length || 0;
            const deletedTaskIndex = selectedTaskIndex;

            deleteTask(selectedBlockIndex, selectedTaskIndex, true); // Pass true since meta key is pressed

            console.log('[Delete] ===== AFTER deleteTask() =====');

            // After deletion, if there are remaining tasks, select one
            // Otherwise, position at task input ready to add a new task
            if (taskCountBefore > 1) {
              // There will be remaining tasks after deletion
              // Select the task at the same index, or the previous one if we deleted the last task
              const newSelectedTaskIndex = deletedTaskIndex >= taskCountBefore - 1
                ? taskCountBefore - 2  // Deleted the last task, select the new last task
                : deletedTaskIndex;     // Select the task that moved into this position

              console.log('[Delete] Remaining tasks, selecting task at index:', newSelectedTaskIndex);
              setSelectedTaskIndex(newSelectedTaskIndex);
              setTaskInputPosition(-2);
            } else {
              // No remaining tasks, position at task input ready to add new task
              console.log('[Delete] No remaining tasks, positioning at task input');
              setTaskInputPosition(-1);  // Position before first task (task input)
              setSelectedTaskIndex(null);
              // Don't set isTypingTask - just position the cursor there
            }
            // selectedBlockIndex stays unchanged - user remains in the block
          } else if (selectedBlockIndex !== null && cursorPosition.type === 'block') {
            // Only delete if block has no tasks, or confirm if it has tasks
            const block = blocks[selectedBlockIndex];
            const taskCount = block?.tasks?.length || 0;
            
            if (taskCount > 0) {
              // For blocks with tasks, require confirmation
              const confirmDelete = confirm(`Delete "${block.title}" with ${taskCount} task${taskCount > 1 ? 's' : ''}?`);
              if (!confirmDelete) {
                return;
              }
            }
            
            console.log('[Delete] Deleting block at index:', selectedBlockIndex);
            deleteBlock(selectedBlockIndex);
            
            // Reset cursor position after deletion
            if (blocks.length <= 1) {
              // If this was the last block, reset to initial state
              setCursorPosition({ type: 'between', afterIndex: -1 });
              setSelectedBlockIndex(null);
            } else if (selectedBlockIndex >= blocks.length - 1) {
              // If we deleted the last block, move to the new last block
              const newIndex = Math.max(0, blocks.length - 2);
              setCursorPosition({ type: 'block', index: newIndex });
              setSelectedBlockIndex(newIndex);
            } else {
              // Stay at the same index (next block will move up)
              setCursorPosition({ type: 'block', index: selectedBlockIndex });
            }
          }
        }
        // If Backspace pressed without modifier, do nothing (prevent accidental deletion)
        return;
      }
      
      // Handle Tab key to enter block and navigate through inputs/tasks
      if (e.key === 'Tab' && !isTypingTask && !isTypingCommand) {
        e.preventDefault();
        
        if (cursorPosition.type === 'block' && taskInputPosition === -2 && selectedTaskIndex === null) {
          // Enter the block and position at first input position
          const block = blocks[cursorPosition.index];
          setTaskInputPosition(-1); // Start before first task
          setSelectedTaskIndex(null); // Clear task selection
        } else if (selectedBlockIndex >= 0) {
          // We're inside a block, navigate through inputs and tasks
          const block = blocks[selectedBlockIndex];
          const taskCount = block?.tasks?.length || 0;
          
          if (e.shiftKey) {
            // Shift+Tab goes backwards
            if (selectedTaskIndex !== null) {
              // Currently at a task, go to input before it
              setSelectedTaskIndex(null);
              setTaskInputPosition(selectedTaskIndex - 1);
            } else if (taskInputPosition >= 0) {
              // Currently at input after a task, go to that task
              setTaskInputPosition(-2);
              setSelectedTaskIndex(taskInputPosition);
            } else if (taskInputPosition === -1) {
              // At input before first task, exit block
              setTaskInputPosition(-2);
              setSelectedTaskIndex(null);
            }
          } else {
            // Tab goes forwards
            if (taskInputPosition === -1) {
              // At input before first, go to first task or next input
              setTaskInputPosition(-2);
              if (taskCount > 0) {
                setSelectedTaskIndex(0);
              } else {
                // No tasks, exit
                setTaskInputPosition(-2);
              }
            } else if (selectedTaskIndex !== null) {
              // Currently at a task, go to input after it
              setSelectedTaskIndex(null);
              setTaskInputPosition(selectedTaskIndex);
            } else if (taskInputPosition >= 0) {
              // Currently at input after a task
              if (taskInputPosition < taskCount - 1) {
                // Go to next task
                setTaskInputPosition(-2);
                setSelectedTaskIndex(taskInputPosition + 1);
              } else {
                // No more tasks, exit block
                setTaskInputPosition(-2);
                setSelectedTaskIndex(null);
              }
            }
          }
        }
        return;
      }

      // Handle arrow key navigation
      // Allow navigation when multi-grabbing (either for selecting more or moving to destination)
      if (e.key === 'ArrowDown' && !isTypingTask && !isTypingCommand && grabbedBlockIndex === null && grabbedTaskIndex === null) {
        e.preventDefault();
        e.stopPropagation(); // Stop command system from processing
        console.log('ArrowDown at view level:', {
          cursorPosition,
          selectedBlockIndex,
          blocks: blocks.length
        });

        // Navigate down through inputs and tasks inside a block
        if (selectedBlockIndex >= 0 && (taskInputPosition >= -1 || selectedTaskIndex !== null)) {
          // Only handle task navigation if we're actually inside a block (have task position or selection)
          const block = blocks[selectedBlockIndex];
          const taskCount = block?.tasks?.length || 0;

          if (taskInputPosition === -1) {
            // At input before first, go to first task
            if (taskCount > 0) {
              setTaskInputPosition(-2);
              setSelectedTaskIndex(0);
            }
          } else if (selectedTaskIndex !== null) {
            // At a task, go to input after it
            setSelectedTaskIndex(null);
            setTaskInputPosition(selectedTaskIndex);
          } else if (taskInputPosition >= 0) {
            // At input after a task, go to next task if exists
            if (taskInputPosition < taskCount - 1) {
              setTaskInputPosition(-2);
              setSelectedTaskIndex(taskInputPosition + 1);
            } else if (taskInputPosition === taskCount - 1) {
              // At the last input position, move to next block if exists
              if (selectedBlockIndex < blocks.length - 1) {
                // Move to next block
                const nextBlockIndex = selectedBlockIndex + 1;
                setSelectedBlockIndex(nextBlockIndex);
                setCursorPosition({ type: 'block', index: nextBlockIndex });

                // Enter the next block at the top (before first task)
                setTaskInputPosition(-1);
                setSelectedTaskIndex(null);
              }
            }
          }
          return;
        }
        
        if (cursorPosition.type === 'none' || (cursorPosition.type === 'between' && cursorPosition.afterIndex === -1 && blocks.length === 0)) {
          // Start at first block if exists, or stay at between position
          if (blocks.length > 0) {
            setCursorPosition({ type: 'block', index: 0 });
            setSelectedBlockIndex(0);
          }
        } else if (cursorPosition.type === 'block') {
          // Move from block to between position after it
          setCursorPosition({ type: 'between', afterIndex: cursorPosition.index });
          setSelectedBlockIndex(-1);
        } else if (cursorPosition.type === 'between') {
          // At between position, move to next block
          const nextBlockIndex = cursorPosition.afterIndex + 1;
          if (nextBlockIndex < blocks.length) {
            setCursorPosition({ type: 'block', index: nextBlockIndex });
            setSelectedBlockIndex(nextBlockIndex);
          }
        }
        return;
      }
      
      if (e.key === 'ArrowUp' && !isTypingTask && !isTypingCommand && grabbedBlockIndex === null && grabbedTaskIndex === null) {
        e.preventDefault();
        e.stopPropagation(); // Stop command system from processing

        console.log('ArrowUp at view level:', {
          cursorPosition,
          selectedBlockIndex,
          blocks: blocks.length
        });

        // Navigate up through inputs and tasks
        if (selectedBlockIndex >= 0 && (taskInputPosition >= -1 || selectedTaskIndex !== null)) {
          // Only handle task navigation if we're actually inside a block (have task position or selection)
          const block = blocks[selectedBlockIndex];
          const taskCount = block?.tasks?.length || 0;

          console.log('ArrowUp pressed:', { taskInputPosition, selectedTaskIndex, taskCount });

          if (selectedTaskIndex !== null && selectedTaskIndex > 0) {
            // At a task (not first), go to input before it
            setSelectedTaskIndex(null);
            setTaskInputPosition(selectedTaskIndex - 1);
          } else if (selectedTaskIndex === 0) {
            // At first task, go to input before first
            setSelectedTaskIndex(null);
            setTaskInputPosition(-1);
          } else if (taskInputPosition >= 0) {
            // At input after a task, go to that task
            console.log('Going from input position', taskInputPosition, 'to task', taskInputPosition);
            setTaskInputPosition(-2);
            setSelectedTaskIndex(taskInputPosition);
          } else if (taskInputPosition === -1) {
            // At input before first task, move to previous block if exists
            if (selectedBlockIndex > 0) {
              // Move to previous block
              const prevBlockIndex = selectedBlockIndex - 1;
              const prevBlock = blocks[prevBlockIndex];
              const prevTaskCount = prevBlock?.tasks?.length || 0;

              setSelectedBlockIndex(prevBlockIndex);
              setCursorPosition({ type: 'block', index: prevBlockIndex });

              // Enter the previous block at the bottom (after last task)
              if (prevTaskCount > 0) {
                setTaskInputPosition(prevTaskCount - 1);
                setSelectedTaskIndex(null);
              } else {
                // If no tasks, go to the input before first position
                setTaskInputPosition(-1);
                setSelectedTaskIndex(null);
              }
            }
          }
          return;
        }
        
        if (cursorPosition.type === 'block') {
          // Move from block to between position before it
          setCursorPosition({ type: 'between', afterIndex: cursorPosition.index - 1 });
          setSelectedBlockIndex(-1);
        } else if (cursorPosition.type === 'between') {
          // At between position, move up
          if (cursorPosition.afterIndex >= 0) {
            // Select the block at this index
            setCursorPosition({ type: 'block', index: cursorPosition.afterIndex });
            setSelectedBlockIndex(cursorPosition.afterIndex);
          }
          // If afterIndex is -1, we're before first block - can't go up
        }
        return;
      }
      
      // Simple typing - just capture text
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();

        // If cursor is at between position, start typing command
        if (cursorPosition.type === 'between') {
          setIsTypingCommand(true);
          const newInput = commandInput + e.key;
          setCommandInput(newInput);

          // Check if "/" was typed to show menu
          if (newInput === '/') {
            setShowSlashMenu(true);
            setMatchOptions([]);
            setSelectedMatchIndex(0);
          } else if (commandInput === '/' && newInput.length > 1) {
            // User continued typing after slash, dismiss all menus
            setShowSlashMenu(false);
            setShowBlockTypeMenu(false);
            setShowBlockTimeMenu(false);
            setShowRoutineSelectionMenu(false);
            setSelectedBlockType(null);
            setMatchOptions([]);
            setSelectedMatchIndex(0);
          } else if (showBlockTypeMenu || showBlockTimeMenu || showRoutineSelectionMenu) {
            // If any sub-menu is open and user types, close all menus
            setShowSlashMenu(false);
            setShowBlockTypeMenu(false);
            setShowBlockTimeMenu(false);
            setShowRoutineSelectionMenu(false);
            setSelectedBlockType(null);
            setMatchOptions([]);
            setSelectedMatchIndex(0);
          } else {
            // Check for quick command without slash (e.g., d930, m14, w630)
            const quickCommand = parseQuickCommand(newInput);
            if (quickCommand) {
              // Valid quick command, hide menu if it was shown
              setShowSlashMenu(false);
              setMatchOptions([]);
            setSelectedMatchIndex(0);
            } else {
              // Not a quick command - search for matching routines/events
              // Defer search to next tick to avoid blocking render
              setTimeout(() => findBestMatch(newInput), 0);
            }
          }
          return;
        }
        
        // If we're at a task input position, handle typing
        if (taskInputPosition >= -1) {
          // Start typing or continue typing
          if (!isTypingTask) {
            setIsTypingTask(true);
          }
          const newInput = taskInput + e.key;
          setTaskInput(newInput);

          // Check if "/" was typed to show task menu
          if (newInput === '/') {
            setShowTaskCommandMenu(true);
            setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);
          } else if (taskInput === '/' && newInput.length > 1) {
            // User continued typing after slash, dismiss the task menu
            setShowTaskCommandMenu(false);
            setTaskMatchOptions([]);
            setSelectedTaskMatchIndex(0);
          } else {
            // Check if input contains "@" for project tagging
            const atIndex = newInput.lastIndexOf('@');
            if (atIndex !== -1 && atIndex < newInput.length - 1) {
              // Extract text after the @ for project search
              const projectQuery = newInput.substring(atIndex + 1);
              setShowProjectAutocomplete(true);
              setTimeout(() => findBestProjectMatch(projectQuery), 0);
              // Don't search for tasks when typing project tag
              setTaskMatchOptions([]);
            } else if (atIndex !== -1 && atIndex === newInput.length - 1) {
              // Just typed @, show all projects
              setShowProjectAutocomplete(true);
              setProjectMatchOptions(projects.slice(0, 5).map(p => ({
                item: p,
                preview: p.name || p.content || "Unnamed project"
              })));
              setSelectedProjectMatchIndex(0);
              setTaskMatchOptions([]);
            } else {
              // No @ in input - search for matching tasks
              setShowProjectAutocomplete(false);
              setTimeout(() => findBestTaskMatch(newInput), 0);
            }
          }
          return;
        }
        
        // If cursor is on a block and we're not at a task position, don't handle typing
        if (cursorPosition.type === 'block') {
          // Block level but not at a task position - don't capture typing
          return;
        }
        
        // At view level (shouldn't really get here with new cursor system)
        if (actualContext === CommandContext.VIEW_SCHEDULE) {
          setIsTypingCommand(true);
          const newInput = commandInput + e.key;
          setCommandInput(newInput);
          
          // Check if "/" was typed to show menu
          const parsed = parser.parse(newInput, actualContext);
          if (parsed && parsed.type === 'menu') {
            setShowSlashMenu(true);
          } else if (commandInput === '/' && newInput.length > 1) {
            // User continued typing after slash, dismiss the menu
            setShowSlashMenu(false);
          }
        }
        return;
      }
      


      




    };

    // Handle key up to detect when Cmd is released during multi-task selection
    const handleKeyUp = (e: KeyboardEvent) => {
      // When Cmd/Ctrl is released and we're in selection mode, exit selection mode and collapse tasks
      if ((e.key === 'Meta' || e.key === 'Control') && isSelectingTasks && grabbedTasks.length > 0) {
        setIsSelectingTasks(false);

        // Collapse all grabbed tasks to the position of the first grabbed task
        // Sort grabbed tasks by their original position (block index, then task index)
        const sortedGrabbed = [...grabbedTasks].sort((a, b) => {
          if (a.blockIndex !== b.blockIndex) return a.blockIndex - b.blockIndex;
          return a.taskIndex - b.taskIndex;
        });

        const firstGrabbed = sortedGrabbed[0];
        const newBlocks = [...blocks];

        // Group tasks by block for efficient removal
        const tasksByBlock = new Map<number, number[]>();
        sortedGrabbed.forEach(({ blockIndex, taskIndex }) => {
          if (!tasksByBlock.has(blockIndex)) {
            tasksByBlock.set(blockIndex, []);
          }
          tasksByBlock.get(blockIndex)!.push(taskIndex);
        });

        // Remove tasks from each block (in reverse order within each block)
        tasksByBlock.forEach((indices, blockIndex) => {
          indices.sort((a, b) => b - a); // Sort descending
          indices.forEach(taskIndex => {
            if (newBlocks[blockIndex]?.tasks?.[taskIndex]) {
              newBlocks[blockIndex].tasks.splice(taskIndex, 1);
            }
          });
        });

        // Calculate insert position in target block after removals
        const targetBlockIndex = firstGrabbed.blockIndex;
        let insertIndex = firstGrabbed.taskIndex;

        // Count how many tasks before firstGrabbed were removed from the same block
        const removedBefore = sortedGrabbed.filter(
          gt => gt.blockIndex === targetBlockIndex && gt.taskIndex < firstGrabbed.taskIndex
        ).length;
        insertIndex -= removedBefore;

        // Insert all grabbed tasks at the calculated position (in grab order, not sorted order)
        newBlocks[targetBlockIndex].tasks = newBlocks[targetBlockIndex].tasks || [];
        grabbedTasks.forEach((gt, i) => {
          newBlocks[targetBlockIndex].tasks.splice(insertIndex + i, 0, gt.task);
        });

        setBlocks(newBlocks);

        // Update selection to the first task of the collapsed group
        setSelectedBlockIndex(targetBlockIndex);
        setSelectedTaskIndex(insertIndex);

        // Update grabbedTasks to reflect new collapsed positions
        const updatedGrabbedTasks = grabbedTasks.map((gt, i) => ({
          blockIndex: targetBlockIndex,
          taskIndex: insertIndex + i,
          task: gt.task,
          originalBlockId: gt.originalBlockId
        }));
        setGrabbedTasks(updatedGrabbedTasks);

        // Don't set grabbedTaskIndex - keep using grabbedTasks for multi-task operations
        // This allows the multi-task Enter handler to work correctly
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cmdViewMode, commandInput, isTypingCommand, showSlashMenu, currentContext, taskInput, isTypingTask, selectedBlockIndex, selectedTaskIndex, blocks, addTask, cursorPosition, taskInputPosition, setSelectedTaskIndex, isEditingBlock, editingBlockIndex, editBlockType, editBlockTime, editFieldFocus, timeEditPosition, isEditingTask, editingTaskIndex, editTaskName, editTaskDuration, taskEditFieldFocus, grabbedBlockIndex, grabbedTaskIndex, setCursorPosition, setBlocks, showAIChat, deleteBlock, deleteTask, currentDay, isLoadingDays, setCurrentDay, findBestMatch, bestMatch, handleRoutineSelect, handleEventSelect, findBestTaskMatch, bestTaskMatch, matchOptions, taskMatchOptions, selectedMatchIndex, selectedTaskMatchIndex, grabbedTasks, isSelectingTasks, selectedProjectId, showProjectAutocomplete, projectMatchOptions, selectedProjectMatchIndex, findBestProjectMatch, bestProjectMatch, projects]);




  // Get current stats
  const getCurrentStats = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentBlock = blocks[selectedBlockIndex];
    const nextBlock = blocks[selectedBlockIndex + 1];
    const totalTasks = blocks.reduce((acc, b) => acc + (b.tasks?.length || 0), 0);
    const completedTasks = blocks.reduce((acc, b) => 
      acc + (b.tasks?.filter(t => t.completed).length || 0), 0
    );
    
    return {
      time: currentTime,
      current: currentBlock?.title || 'None',
      next: nextBlock?.title || 'None',
      progress: `${completedTasks}/${totalTasks}`,
      energy: currentBlock?.energy || 'medium'
    };
  };

  const stats = getCurrentStats();

  // Show mobile view on mobile devices
  if (isMobile) {
    // Goals already in correct format - just ensure isExpanded is set
    const mobileGoals = goals.map(goal => ({
      ...goal,
      isExpanded: false
    }));

    // Transform projects data to match mobile view format
    const mobileProjects = projects.map(project => ({
      id: project.id,
      name: project.content,
      content: project.content,
      deadline: project.metadata?.dueDate,
      goalId: project.metadata?.goalId,
      completed: project.completed,
      metadata: project.metadata,
      tasks: project.tasks,
      order: project.order,
      isExpanded: false
    }));

    // Mobile wrapper for addTask that takes blockIndex
    const handleMobileAddTask = async (blockIndex: number, taskData: { title: string; duration: number; projectId?: string; taskId?: string }) => {
      console.log('[Mobile] Adding task to block:', blockIndex, taskData);

      const currentBlock = blocks[blockIndex];
      if (!currentBlock) {
        console.error('[Mobile] Block not found at index:', blockIndex);
        return;
      }

      // Create task with temporary ID
      const tempId = taskData.taskId || `temp-task-${Date.now()}`;
      const newTask = {
        id: tempId,
        title: taskData.title,
        duration: taskData.duration,
        completed: false,
        projectId: taskData.projectId,
      };

      // Update UI immediately (optimistic update)
      const newBlocks = [...blocks];
      const updatedBlock = { ...newBlocks[blockIndex] };

      if (!updatedBlock.tasks) {
        updatedBlock.tasks = [];
      }
      updatedBlock.tasks = [...updatedBlock.tasks, newTask];

      // Update block duration
      const totalDuration = updatedBlock.tasks.reduce((sum: number, task: any) => sum + task.duration, 0);
      updatedBlock.duration = totalDuration;

      newBlocks[blockIndex] = updatedBlock;
      setBlocks(newBlocks);

      console.log('[Mobile] Optimistic update done, calling API...');

      // Persist to database
      const blockId = currentBlock.id || currentBlock._id;
      const dayId = getCurrentDayId();

      if (dayId && blockId && !blockId.startsWith('temp-')) {
        try {
          const response = await fetch('/api/tasks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blockId,
              title: taskData.title,
              duration: taskData.duration,
              insertPosition: updatedBlock.tasks.length - 1,
              projectId: taskData.projectId,
              taskId: taskData.taskId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create task');
          }

          const data = await response.json();
          console.log('[Mobile] Task created successfully:', data);

          // Update with real task ID
          const finalBlocks = [...blocks];
          const finalBlock = { ...finalBlocks[blockIndex] };
          if (finalBlock.tasks) {
            const taskIdx = finalBlock.tasks.findIndex((t: any) => t.id === tempId);
            if (taskIdx !== -1) {
              finalBlock.tasks[taskIdx] = { ...finalBlock.tasks[taskIdx], id: data.task.id };
              finalBlocks[blockIndex] = finalBlock;
              setBlocks(finalBlocks);
            }
          }
        } catch (error) {
          console.error('[Mobile] Failed to create task:', error);
          // Revert optimistic update on error
          setBlocks(blocks);
        }
      }
    };

    // Mobile update block handler
    const handleMobileUpdateBlock = async (blockIndex: number, blockData: { time?: string; title?: string; type?: string; duration?: number; note?: string }) => {
      console.log('[Mobile] Update block requested:', { blockIndex, blockData });

      const currentBlock = blocks[blockIndex];
      if (!currentBlock) {
        console.error('[Mobile] Block not found at index:', blockIndex);
        return;
      }

      // Update UI immediately (optimistic update)
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = {
        ...currentBlock,
        ...blockData,
      };
      setBlocks(newBlocks);

      // Persist to database
      const blockId = currentBlock.id || currentBlock._id;
      if (blockId && !blockId.startsWith('temp-')) {
        try {
          const response = await fetch(`/api/blocks/${blockId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blockData),
          });

          if (!response.ok) {
            throw new Error('Failed to update block');
          }

          const data = await response.json();
          console.log('[Mobile] Block updated successfully:', data);
        } catch (error) {
          console.error('[Mobile] Failed to update block:', error);
          // Revert optimistic update on error
          setBlocks(blocks);
        }
      }
    };

    return (
      <MobileAppView
        viewMode={cmdViewMode}
        onViewChange={switchView}
        blocks={blocks}
        currentDay={currentDay}
        currentTime={currentTime}
        user={user}
        onToggleTask={toggleTask}
        onDayChange={setCurrentDay}
        onAddBlock={addBlock}
        onAddTask={handleMobileAddTask}
        onUpdateBlock={handleMobileUpdateBlock}
        onDeleteBlock={deleteBlock}
        onDeleteTask={deleteTask}
        onToggleBlockCompletion={toggleBlockCompletion}
        dayId={getCurrentDayId()}
        goalsData={mobileGoals}
        projectsData={mobileProjects}
        eventsData={events}
        routinesData={routines}
        adminTasksData={adminTasks}
        onProjectsUpdate={fetchInventoryData}
        onProjectsChange={setProjects}
        onGoalsUpdate={fetchInventoryData}
        onGoalsChange={setGoals}
      />
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-white flex flex-col font-mono">
      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Persistent navbar - full width */}
      <SharedNavbar
        user={user}
        currentDay={currentDay}
        currentTime={currentTime}
        viewMode={cmdViewMode}
      />

      {/* Main content container with max width */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* View content */}
        <div className="flex-1">
          {/* Schedule view */}
          {cmdViewMode === 'schedule' && (
          <ScheduleView
            blocks={blocks}
            selectedBlockIndex={selectedBlockIndex}
            selectedTaskIndex={selectedTaskIndex}
            cursorPosition={cursorPosition}
            taskInputPosition={taskInputPosition}
            isTypingTask={isTypingTask}
            taskInput={taskInput}
            commandInput={commandInput}
            isTypingCommand={isTypingCommand}
            showSlashMenu={showSlashMenu}
            showBlockTypeMenu={showBlockTypeMenu}
            showBlockTimeMenu={showBlockTimeMenu}
            showRoutineSelectionMenu={showRoutineSelectionMenu}
            selectedBlockType={selectedBlockType}
            blockCreationSuggestedTime={blockCreationSuggestedTime}
            isLoadingDays={isLoadingDays}
            currentDay={currentDay}
            currentTime={currentTime}
            user={user}
            events={events}
            routines={routines}
            bestMatch={bestMatch}
            bestTaskMatch={bestTaskMatch}
            bestProjectMatch={bestProjectMatch}
            showProjectAutocomplete={showProjectAutocomplete}
            onDragEnd={handleDragEnd}
            onSlashMenuSelect={handleSlashMenuSelect}
            onSlashMenuCancel={handleSlashMenuCancel}
            onBlockCreate={handleBlockCreate}
            onBlockTypeSelect={handleBlockTypeSelection}
            onBlockTypeCancel={() => setShowBlockTypeMenu(false)}
            onBlockTimeConfirm={handleBlockTimeConfirm}
            onBlockTimeCancel={() => {
              setShowBlockTimeMenu(false);
              setSelectedBlockType(null);
            }}
            showEventSelectionMenu={showEventSelectionMenu}
            onEventSelect={handleEventSelect}
            onEventSelectionCancel={() => setShowEventSelectionMenu(false)}
            onRoutineSelect={handleRoutineSelect}
            onRoutineSelectionCancel={() => setShowRoutineSelectionMenu(false)}
            onToggleTask={toggleTask}
            onAddTask={(title, duration, position, projectId, taskId) => addTask({ title, duration, projectId, taskId }, position)}
            onAddMultipleTasks={(tasksData, position) => {
              const lastTaskPosition = addMultipleTasks(tasksData, position);
              // Position cursor after the last added task
              if (lastTaskPosition !== undefined) {
                setTaskInputPosition(lastTaskPosition);
              }
              setTaskInput('');
              setIsTypingTask(false);
            }}
            onTaskMenuSelect={(option) => {
              if (option === 'task-added') {
                // Task was added via menu, update position to stay after the new task
                // Always increment position when a task is added
                setTaskInputPosition(taskInputPosition + 1);
                setTaskInput('');
                setIsTypingTask(false); // Set to false so navigation works
              } else if (option === 'project-task' || option === 'backlog') {
                setTaskInput('');
                setIsTypingTask(false);
              } else if (option === 'cancel') {
                setTaskInput('');
                setIsTypingTask(false);
              }
            }}
            setSelectedBlockIndex={setSelectedBlockIndex}
            setSelectedTaskIndex={setSelectedTaskIndex}
            setTaskInput={setTaskInput}
            setIsTypingTask={setIsTypingTask}
            isEditingBlock={isEditingBlock}
            editingBlockIndex={editingBlockIndex}
            editBlockType={editBlockType}
            editBlockTime={editBlockTime}
            editFieldFocus={editFieldFocus}
            timeEditPosition={timeEditPosition}
            isEditingTask={isEditingTask}
            editingTaskIndex={editingTaskIndex}
            editTaskName={editTaskName}
            editTaskDuration={editTaskDuration}
            taskEditFieldFocus={taskEditFieldFocus}
            isEditingNote={isEditingNote}
            editingNoteBlockIndex={editingNoteBlockIndex}
            editNoteValue={editNoteValue}
            grabbedBlockIndex={grabbedBlockIndex}
            grabbedTaskIndex={grabbedTaskIndex}
            grabbedTasks={grabbedTasks}
            isSelectingTasks={isSelectingTasks}
            showMoveTimePopup={showMoveTimePopup}
            movedBlockIndex={pendingMove?.newIndex}
            moveSuggestedTime={moveSuggestedTime}
            onMoveTimeConfirm={handleBlockMoveConfirm}
            onMoveTimeCancel={handleBlockMoveCancel}
          />
          )}


          {/* You view - inventory component from inventory-5.0 */}
          {cmdViewMode === 'you' && (
          <InventoryView
            currentTime={currentTime}
            user={user}
            userData={userData}
            commandInput={commandInput}
            isTypingCommand={isTypingCommand}
            showSlashMenu={showSlashMenu}
            onSlashMenuSelect={handleSlashMenuSelect}
            onSlashMenuCancel={handleSlashMenuCancel}
            routinesData={routines}
            eventsData={events}
            projectsData={projects}
            adminTasksData={adminTasks}
            setProjectsData={setProjects}
            onTaskUpdate={handleInventoryTaskUpdate}
          />
          )}

        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIChat}
        chatHistory={chatHistory}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendChatMessage}
        onClose={() => {
          setShowAIChat(false);
          setHasLoadedChat(false);
        }}
        onClearHistory={handleClearChatHistory}
      />

    </div>
  );
}