"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCommandSystem } from "@/app/hooks/useCommandSystem";
import { useBlockManagement } from "@/app/hooks/useBlockManagement";
import { useDayDataLoader } from "@/app/hooks/useDayDataLoader";
import ScheduleView from "@/app/components/schedule/ScheduleView";
import InventoryView from "@/app/components/inventory/InventoryView";
import InventoryViewComplete from "@/app/components/schedule/InventoryViewComplete";
import AIChatPanel from "@/app/components/schedule/AIChatPanel";
import BlockTimeMenu from "@/app/components/schedule/BlockTimeMenu";
import { TextCommandParser } from '@/app/core/commands/textCommandParser';
import { CommandContext } from '@/app/core/commands/types';
import { useAuth, useUser } from "@clerk/nextjs";
import { calculateEndTime } from '@/app/utils/scheduleUtils';
import { parseQuickCommand, isQuickCommand } from '@/app/utils/quickCommandParser';


export default function ScheduleStrategyPage() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

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



  // Events state
  const [events, setEvents] = useState<any[]>([]);

  // Routines state
  const [routines, setRoutines] = useState<any[]>([]);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);

  // Admin tasks (backlog) state
  const [adminTasks, setAdminTasks] = useState<any[]>([]);

  // Fetch events and routines on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      if (!userId) return;

      try {
        console.log('[Page] Fetching events for user:', userId);
        const response = await fetch('/api/you');

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        console.log('[Page] Fetched data:', data);

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
          console.log('[Page] Projects structure:', JSON.stringify(data.sections.projects, null, 2));
          // Check if projects have order values
          data.sections.projects.forEach((p, i) => {
            console.log(`[Page] Project ${i}: ID=${p.id}, order=${p.order}, metadata=${JSON.stringify(p.metadata)}`);
          });
          setProjects(data.sections.projects);
        }

        // Set admin tasks (backlog) from the sections data
        if (data.sections?.backlog) {
          console.log('[Page] Setting admin tasks (backlog):', data.sections.backlog);
          setAdminTasks(data.sections.backlog);
        }
      } catch (error) {
        console.error('[Page] Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [userId]);

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
  const [showRoutineSelectionMenu, setShowRoutineSelectionMenu] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<any>(null);

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

  // Handle block type selection
  const handleBlockTypeSelection = useCallback((blockType: any) => {
    setShowBlockTypeMenu(false);
    setSelectedBlockType(blockType);
    setShowBlockTimeMenu(true);
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
    addEvent,
    addRoutine,
    toggleTask,
    deleteBlock,
    deleteTask,
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
    // Don't auto-select blocks - let navigation handle it
  }, [currentDay, todayData, tomorrowData, isLoadingDays]);

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

  // Grab mode state for moving blocks
  const [grabbedBlockIndex, setGrabbedBlockIndex] = useState<number | null>(null);
  const [grabbedBlockOriginalIndex, setGrabbedBlockOriginalIndex] = useState<number | null>(null);

  // Grab mode state for moving tasks
  const [grabbedTaskIndex, setGrabbedTaskIndex] = useState<number | null>(null);

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

  // Inventory refresh trigger
  const [inventoryRefreshTrigger, setInventoryRefreshTrigger] = useState(0);

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
      console.log('[Client] Sending message to MULTI-AGENT:', message);

      // Send to MULTI-AGENT system
      // const response = await fetch('/api/ai/interpreter', {
      // Testing Claude Agent SDK POC
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
      console.log('[Client] Response from MULTI-AGENT:', result);

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
  }, [user, getCurrentDayId, refreshDayData, saveConversation, setInventoryRefreshTrigger, chatHistory, conversationId, agentTodos, pendingPlan]);

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

    // Add the block with the selected type and time (no duration, will be calculated from tasks)
    addBlock({
      type: blockType.type,
      title: blockType.label,
      time: time,
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

  // Determine current keyboard context
  const keyboardContext = useMemo(() => {
    // if (chatOpen) return 'chat' as const;
    if (selectedTaskIndex !== null) return 'task' as const;
    return 'block' as const;
  }, [selectedTaskIndex]); // removed chatOpen


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

      // Handle view switching with Cmd/Ctrl + Arrow keys
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        // Switch to schedule (timeline) view
        switchView('schedule');
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown') {
        e.preventDefault();
        // Switch to inventory (you) view
        switchView('you');
        return;
      }

      // Handle AI Chat with Cmd/Ctrl + G
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setShowAIChat(!showAIChat);
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

      // Handle Command+Enter for task completion
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        if (selectedTaskIndex !== null && selectedBlockIndex !== null) {
          // Toggle the completion status of the selected task
          console.log('[Task Complete] Toggling task at index:', selectedTaskIndex);
          toggleTask(selectedBlockIndex, selectedTaskIndex);
        }
        return;
      }

      // Handle Enter key
      if (e.key === 'Enter') {
        // Don't handle Enter if task command menu is open - let it handle selection
        if (showTaskCommandMenu && taskInput === '/') {
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
                { type: quickCommand.type, label: quickCommand.label },
                quickCommand.time
              );
              setCommandInput('');
              setIsTypingCommand(false);
              setShowSlashMenu(false);
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
            console.log('BEFORE adding task:', {
              taskInputPosition,
              insertAt: taskInputPosition + 1,
              taskTitle: taskInput.trim()
            });

            // Add the task at the current position
            // taskInputPosition -1 means before first, 0 means after first, etc.
            // So we insert at position taskInputPosition + 1
            addTask({ title: taskInput.trim(), duration: 30 }, taskInputPosition + 1);
            setTaskInput('');

            // After adding, move cursor to after the new task
            const newPosition = taskInputPosition + 1;
            console.log('AFTER adding task, setting position to:', newPosition);
            setTaskInputPosition(newPosition);

            // Stop typing so navigation works
            setIsTypingTask(false);
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

        if (isTypingCommand && cursorPosition.type === 'between') {
          e.preventDefault();
          // For now, just clear the command input
          // Later we can handle creating blocks from typed commands
          setCommandInput('');
          setIsTypingCommand(false);
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
          return;
        }

        // Close task command menu if open
        if (showTaskCommandMenu) {
          setShowTaskCommandMenu(false);
          setTaskInput('');
          setIsTypingTask(false);
          return;
        }

        // Close event selection menu if open
        if (showEventSelectionMenu) {
          setShowEventSelectionMenu(false);
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
          setTaskInput('');
          setCommandInput('');
          setIsTypingTask(false);
          setIsTypingCommand(false);
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
      if (e.key === 'g' && !isTypingTask && !isTypingCommand && !isEditingBlock && !isEditingTask) {
        e.preventDefault();

        if (selectedTaskIndex !== null && selectedBlockIndex >= 0) {
          // Toggle grab mode for task
          if (grabbedTaskIndex === null) {
            setGrabbedTaskIndex(selectedTaskIndex);
          } else {
            setGrabbedTaskIndex(null);
          }
          return;
        } else if (selectedBlockIndex >= 0 && selectedTaskIndex === null && taskInputPosition === -2) {
          // Toggle grab mode for block
          if (grabbedBlockIndex === null) {
            console.log('🎯 Entering grab mode for block at index:', selectedBlockIndex);
            setGrabbedBlockIndex(selectedBlockIndex);
            setGrabbedBlockOriginalIndex(selectedBlockIndex); // Save original position
          } else {
            // This case is now handled in the grab mode section above
            setGrabbedBlockIndex(null);
            setGrabbedBlockOriginalIndex(null);
          }
          return;
        }
      }

      // Handle 'e' key to enter edit mode
      if (e.key === 'e' && !isTypingTask && !isTypingCommand && !isEditingBlock && !isEditingTask && grabbedBlockIndex === null) {
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

      // Handle arrow keys in grab mode for tasks
      if (grabbedTaskIndex !== null && selectedBlockIndex >= 0) {
        const block = blocks[selectedBlockIndex];
        const tasks = block.tasks || [];

        if (e.key === 'Enter') {
          e.preventDefault();
          // Release the task in its current position and persist the new order
          setGrabbedTaskIndex(null);

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

          if (grabbedTaskIndex > 0) {
            // Move task up within block
            const newBlocks = [...blocks];
            const newTasks = [...tasks];
            const newIndex = grabbedTaskIndex - 1;
            [newTasks[grabbedTaskIndex], newTasks[newIndex]] = [newTasks[newIndex], newTasks[grabbedTaskIndex]];
            newBlocks[selectedBlockIndex].tasks = newTasks;
            setBlocks(newBlocks);

            // Update indices
            setGrabbedTaskIndex(newIndex);
            setSelectedTaskIndex(newIndex);
          } else if (grabbedTaskIndex === 0 && selectedBlockIndex > 0) {
            // Move task to end of previous block
            const newBlocks = [...blocks];
            const task = newBlocks[selectedBlockIndex].tasks.splice(grabbedTaskIndex, 1)[0];
            const prevBlockIndex = selectedBlockIndex - 1;
            newBlocks[prevBlockIndex].tasks = newBlocks[prevBlockIndex].tasks || [];
            newBlocks[prevBlockIndex].tasks.push(task);
            setBlocks(newBlocks);

            // Persist the move between blocks
            const fromBlock = blocks[selectedBlockIndex];
            const toBlock = blocks[prevBlockIndex];
            if (task.id && !task.id.startsWith('temp-') &&
                fromBlock.id && !fromBlock.id.startsWith('temp-') &&
                toBlock.id && !toBlock.id.startsWith('temp-')) {
              fetch(`/api/tasks/${task.id}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fromBlockId: fromBlock.id,
                  toBlockId: toBlock.id,
                  position: newBlocks[prevBlockIndex].tasks.length - 1
                })
              }).catch(error => {
                console.error('Error moving task between blocks:', error);
              });
            }

            // Update indices to follow the task
            const newTaskIndex = newBlocks[prevBlockIndex].tasks.length - 1;
            setSelectedBlockIndex(prevBlockIndex);
            setGrabbedTaskIndex(newTaskIndex);
            setSelectedTaskIndex(newTaskIndex);
            setCursorPosition({ type: 'block', index: prevBlockIndex });
          }
          return;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();

          if (grabbedTaskIndex < tasks.length - 1) {
            // Move task down within block
            const newBlocks = [...blocks];
            const newTasks = [...tasks];
            const newIndex = grabbedTaskIndex + 1;
            [newTasks[grabbedTaskIndex], newTasks[newIndex]] = [newTasks[newIndex], newTasks[grabbedTaskIndex]];
            newBlocks[selectedBlockIndex].tasks = newTasks;
            setBlocks(newBlocks);

            // Update indices
            setGrabbedTaskIndex(newIndex);
            setSelectedTaskIndex(newIndex);
          } else if (grabbedTaskIndex === tasks.length - 1 && selectedBlockIndex < blocks.length - 1) {
            // Move task to beginning of next block
            const newBlocks = [...blocks];
            const task = newBlocks[selectedBlockIndex].tasks.splice(grabbedTaskIndex, 1)[0];
            const nextBlockIndex = selectedBlockIndex + 1;
            newBlocks[nextBlockIndex].tasks = newBlocks[nextBlockIndex].tasks || [];
            newBlocks[nextBlockIndex].tasks.unshift(task);
            setBlocks(newBlocks);

            // Persist the move between blocks
            const fromBlock = blocks[selectedBlockIndex];
            const toBlock = blocks[nextBlockIndex];
            if (task.id && !task.id.startsWith('temp-') &&
                fromBlock.id && !fromBlock.id.startsWith('temp-') &&
                toBlock.id && !toBlock.id.startsWith('temp-')) {
              fetch(`/api/tasks/${task.id}/move`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fromBlockId: fromBlock.id,
                  toBlockId: toBlock.id,
                  position: 0 // Insert at beginning
                })
              }).catch(error => {
                console.error('Error moving task between blocks:', error);
              });
            }

            // Update indices to follow the task
            setSelectedBlockIndex(nextBlockIndex);
            setGrabbedTaskIndex(0);
            setSelectedTaskIndex(0);
            setCursorPosition({ type: 'block', index: nextBlockIndex });
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

      // Handle Backspace (with modifier for deletion) - but NOT when InventoryView is shown
      // The InventoryView has its own Cmd+D handler for deleting goals
      if (e.key === 'Backspace') {
        // Skip Backspace handling entirely when showing InventoryView
        // to prevent conflicts with goal deletion
        // (InventoryView is shown when cmdViewMode === 'schedule' on this page)

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
              }
            } else {
              // If input is empty, exit typing mode
              setIsTypingTask(false);
              setShowTaskCommandMenu(false);
            }
          } else if (isTypingCommand) {
            if (commandInput.length > 0) {
              const newInput = commandInput.slice(0, -1);
              setCommandInput(newInput);
              // If we delete the slash, also hide the menu
              if (newInput === '') {
                setShowSlashMenu(false);
              }
            } else {
              setIsTypingCommand(false);
              setShowSlashMenu(false);
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
            console.log('[Delete] Deleting/unassigning task at index:', selectedTaskIndex);
            deleteTask(selectedBlockIndex, selectedTaskIndex, true); // Pass true since meta key is pressed
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

      // Handle arrow key navigation (only in timeline view, not inventory)
      if (e.key === 'ArrowDown' && !isTypingTask && !isTypingCommand && grabbedBlockIndex === null && grabbedTaskIndex === null && cmdViewMode !== 'schedule') {
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
            }
            // If no next task, stay at current position
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

      if (e.key === 'ArrowUp' && !isTypingTask && !isTypingCommand && grabbedBlockIndex === null && grabbedTaskIndex === null && cmdViewMode !== 'schedule') {
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
            // At input before first, can't go up further in block
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
          // Check if typing 'e' alone for event selection
          if (commandInput === '' && e.key === 'e') {
            setShowEventSelectionMenu(true);
            return;
          }

          setIsTypingCommand(true);
          const newInput = commandInput + e.key;
          setCommandInput(newInput);

          // Check if "/" was typed to show menu
          if (newInput === '/') {
            setShowSlashMenu(true);
          } else if (commandInput === '/' && newInput.length > 1) {
            // User continued typing after slash, dismiss all menus
            setShowSlashMenu(false);
            setShowBlockTypeMenu(false);
            setShowBlockTimeMenu(false);
            setShowRoutineSelectionMenu(false);
            setSelectedBlockType(null);
          } else if (showBlockTypeMenu || showBlockTimeMenu || showRoutineSelectionMenu) {
            // If any sub-menu is open and user types, close all menus
            setShowSlashMenu(false);
            setShowBlockTypeMenu(false);
            setShowBlockTimeMenu(false);
            setShowRoutineSelectionMenu(false);
            setSelectedBlockType(null);
          } else {
            // Check for quick command without slash (e.g., d930, m14, w630)
            const quickCommand = parseQuickCommand(newInput);
            if (quickCommand) {
              // Valid quick command, hide menu if it was shown
              setShowSlashMenu(false);
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
          } else if (taskInput === '/' && newInput.length > 1) {
            // User continued typing after slash, dismiss the task menu
            setShowTaskCommandMenu(false);
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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cmdViewMode, commandInput, isTypingCommand, showSlashMenu, currentContext, taskInput, isTypingTask, selectedBlockIndex, selectedTaskIndex, blocks, addTask, cursorPosition, taskInputPosition, setSelectedTaskIndex, isEditingBlock, editingBlockIndex, editBlockType, editBlockTime, editFieldFocus, timeEditPosition, isEditingTask, editingTaskIndex, editTaskName, editTaskDuration, taskEditFieldFocus, grabbedBlockIndex, grabbedTaskIndex, setCursorPosition, setBlocks, showAIChat, deleteBlock, deleteTask, toggleTask, switchView, showTaskCommandMenu, showBlockTypeMenu, showBlockTimeMenu, showRoutineSelectionMenu, showEventSelectionMenu, handleBlockCreate]);




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

  return (
    <div className="min-h-screen bg-white flex flex-col font-mono">
      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        {/* Inventory view (replacing schedule view) */}
        {cmdViewMode === 'schedule' && (
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
          />
        )}


        {/* You view - self-contained inventory component */}
        {cmdViewMode === 'you' && (
          <InventoryViewComplete
            userId={userId}
            refreshTrigger={inventoryRefreshTrigger}
            onDataUpdate={(data) => {
              // Update events when inventory loads them
              if (data?.events) {
                setEvents(data.events);
              }
              // Update routines when inventory loads them
              if (data?.routines) {
                console.log('[Page] Updating routines from inventory:', data.routines);
                setRoutines(data.routines);
              } else if (data?.sections?.routines) {
                console.log('[Page] Updating routines from inventory sections:', data.sections.routines);
                setRoutines(data.sections.routines);
              }
            }}
          />
        )}


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