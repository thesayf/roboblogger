"use client";

import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import TimelineView from '../schedule/TimelineView';
import ProjectsList from './ProjectsList';
import RoutinesList from './RoutinesList';
import AdminTasksList from './AdminTasksList';
import EventsList from './EventsList';
import GoalSelectionPopup from './GoalSelectionPopup';
import SimpleDateInput from './SimpleDateInput';
import DurationPickerPopup from './DurationPickerPopup';
import DateRangePickerPopup from './DateRangePickerPopup';
import DaySelectionPopup from './DaySelectionPopup';
import TimeAndDurationPopup from './TimeAndDurationPopup';

interface Goal {
  id: string;
  name: string;
  isExpanded: boolean;
  deadline?: string;
}

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
  name: string;
  content?: string;
  isExpanded: boolean;
  deadline?: string;
  goalId?: string;
  tasks?: Task[];
  metadata?: {
    goalId?: string;
    dueDate?: string;
    [key: string]: any;
  };
}

interface Item {
  id: string;
  name?: string;
  content?: string; // API returns content, not name
  completed?: boolean;
  time?: string;
  frequency?: string;
  priority?: string;
  dueDate?: string;
  date?: string;
  location?: string;
  tasks?: Task[]; // Routine tasks
  metadata?: {
    startTime?: string;
    duration?: number;
    days?: string[];
    [key: string]: any;
  };
}

interface InventoryViewProps {
  currentTime: Date;
  user: any;
  commandInput: string;
  isTypingCommand: boolean;
  showSlashMenu: boolean;
  onSlashMenuSelect: (item: any) => void;
  onSlashMenuCancel: () => void;
  userData?: any; // Full user data with bio, occupation, etc.
  routinesData?: Item[]; // Routines from parent
  eventsData?: Item[]; // Events from parent
  projectsData?: Item[]; // Projects from parent
  adminTasksData?: Item[]; // Admin tasks (backlog) from parent
  setProjectsData?: (projects: Item[]) => void; // Setter for projects
  onTaskUpdate?: () => void; // Callback when a task is updated in inventory
}

export default function InventoryView({
  currentTime,
  user,
  commandInput,
  isTypingCommand,
  showSlashMenu,
  onSlashMenuSelect,
  onSlashMenuCancel,
  userData,
  routinesData,
  eventsData,
  projectsData,
  adminTasksData,
  setProjectsData,
  onTaskUpdate,
}: InventoryViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState<number>(-1);
  const [isTypingGoal, setIsTypingGoal] = useState(false);

  // Refs for scrolling to sections
  const goalsRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const routinesRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const [goalInput, setGoalInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState<'empty' | 'goals' | 'projects' | 'routines' | 'admin' | 'events'>('empty');
  const inputRef = useRef<HTMLInputElement>(null);

  // New state to track if we're at "goal level" (inside the goals section, similar to being inside a block)
  const [isAtGoalLevel, setIsAtGoalLevel] = useState(false);
  // Position within goal level: -1 = input for new goal, 0+ = existing goal index
  const [goalLevelPosition, setGoalLevelPosition] = useState<number>(-1);
  // Grab mode state for moving goals
  const [grabbedGoalIndex, setGrabbedGoalIndex] = useState<number | null>(null);
  const [grabbedGoalOriginalIndex, setGrabbedGoalOriginalIndex] = useState<number | null>(null);

  // Multi-step input state
  const [inputStep, setInputStep] = useState<'name' | 'deadline' | null>(null);
  const [tempGoalName, setTempGoalName] = useState('');
  const [tempGoalDeadline, setTempGoalDeadline] = useState('');
  // Goal deadline popup state
  const [showGoalDeadlinePopup, setShowGoalDeadlinePopup] = useState(false);

  // Edit mode state for existing goals
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
  const [editFieldFocus, setEditFieldFocus] = useState<'name' | 'deadline'>('name');

  // Project state (similar to goals) - initialized with passed data
  const [projects, setProjects] = useState<Project[]>(projectsData as any || []);
  const [projectViewMode, setProjectViewMode] = useState<'active' | 'completed'>('active');
  const [isAtProjectLevel, setIsAtProjectLevel] = useState(false);
  const [projectLevelPosition, setProjectLevelPosition] = useState<number>(-1);
  const [grabbedProjectIndex, setGrabbedProjectIndex] = useState<number | null>(null);
  const [grabbedProjectOriginalIndex, setGrabbedProjectOriginalIndex] = useState<number | null>(null);
  const [isTypingProject, setIsTypingProject] = useState(false);
  const [projectInput, setProjectInput] = useState('');
  const [projectInputStep, setProjectInputStep] = useState<'name' | 'deadline' | null>(null);
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempProjectGoalId, setTempProjectGoalId] = useState<string | null>(null);
  const [tempProjectDeadline, setTempProjectDeadline] = useState('');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDeadline, setEditProjectDeadline] = useState('');
  const [editProjectGoalId, setEditProjectGoalId] = useState<string | null>(null);
  const [editProjectFieldFocus, setEditProjectFieldFocus] = useState<'name' | 'deadline' | 'goal'>('name');
  const [showEditGoalSelectionPopup, setShowEditGoalSelectionPopup] = useState(false);
  const [showEditDeadlinePickerPopup, setShowEditDeadlinePickerPopup] = useState(false);

  // Project Task level state
  const [isAtProjectTaskLevel, setIsAtProjectTaskLevel] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
  const [currentProjectForTasks, setCurrentProjectForTasks] = useState<number | null>(null);
  const [isTypingTask, setIsTypingTask] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [taskInputPosition, setTaskInputPosition] = useState<number>(-1); // -1 = bottom, -2 = top, >= 0 = after index
  const [grabbedTaskIndex, setGrabbedTaskIndex] = useState<number | null>(null);
  const [grabbedTaskOriginalIndex, setGrabbedTaskOriginalIndex] = useState<number | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDuration, setEditTaskDuration] = useState('');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [editTaskFieldFocus, setEditTaskFieldFocus] = useState<'name' | 'duration' | 'deadline'>('name');

  // Task creation popup states
  const [showDurationPickerPopup, setShowDurationPickerPopup] = useState(false);
  const [showTaskDeadlinePickerPopup, setShowTaskDeadlinePickerPopup] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState<{
    title: string;
    duration?: number;
    deadline?: string;
    position: number;
  } | null>(null);
  const [tempTaskTitle, setTempTaskTitle] = useState('');
  const [tempTaskDuration, setTempTaskDuration] = useState<number | null>(null);
  const [tempTaskDeadline, setTempTaskDeadline] = useState('');

  // Task edit popup states
  const [showEditTaskNamePopup, setShowEditTaskNamePopup] = useState(false);
  const [showEditTaskDurationPopup, setShowEditTaskDurationPopup] = useState(false);
  const [showEditTaskDeadlinePopup, setShowEditTaskDeadlinePopup] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<{
    taskIndex: number;
    projectIndex: number;
    originalTask: any;
  } | null>(null);

  // Routines state - initialized with passed data
  const [routines, setRoutines] = useState<Item[]>(routinesData || []);
  const [isAtRoutineLevel, setIsAtRoutineLevel] = useState(false);
  const [routineLevelPosition, setRoutineLevelPosition] = useState<number>(-1);
  const [grabbedRoutineIndex, setGrabbedRoutineIndex] = useState<number | null>(null);
  const [grabbedRoutineOriginalIndex, setGrabbedRoutineOriginalIndex] = useState<number | null>(null);
  const [isTypingRoutine, setIsTypingRoutine] = useState(false);
  const [routineInput, setRoutineInput] = useState('');
  const [routineInputStep, setRoutineInputStep] = useState<'name' | 'time' | null>(null);
  const [tempRoutineName, setTempRoutineName] = useState('');
  const [tempRoutineTime, setTempRoutineTime] = useState('');
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [editingRoutineIndex, setEditingRoutineIndex] = useState<number | null>(null);
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editRoutineGoalId, setEditRoutineGoalId] = useState<string | null>(null);
  const [editRoutineStartDate, setEditRoutineStartDate] = useState('');
  const [editRoutineEndDate, setEditRoutineEndDate] = useState('');
  const [editRoutineDays, setEditRoutineDays] = useState<string[]>([]);
  const [editRoutineTime, setEditRoutineTime] = useState('');
  const [editRoutineDuration, setEditRoutineDuration] = useState<number>(30);
  const [editRoutineFieldFocus, setEditRoutineFieldFocus] = useState<'name' | 'goal' | 'dates' | 'days' | 'time' | 'duration'>('name');
  const [showEditRoutineGoalPopup, setShowEditRoutineGoalPopup] = useState(false);
  const [showEditRoutineDateRangePopup, setShowEditRoutineDateRangePopup] = useState(false);
  const [showEditRoutineDaysPopup, setShowEditRoutineDaysPopup] = useState(false);
  const [showEditRoutineTimePopup, setShowEditRoutineTimePopup] = useState(false);
  const [showEditRoutineDurationPopup, setShowEditRoutineDurationPopup] = useState(false);

  // Routine Task level state
  const [isAtRoutineTaskLevel, setIsAtRoutineTaskLevel] = useState(false);
  const [selectedRoutineTaskIndex, setSelectedRoutineTaskIndex] = useState<number>(0);
  const [currentRoutineForTasks, setCurrentRoutineForTasks] = useState<number | null>(null);
  const [isTypingRoutineTask, setIsTypingRoutineTask] = useState(false);
  const [routineTaskInput, setRoutineTaskInput] = useState('');
  const [routineTaskInputPosition, setRoutineTaskInputPosition] = useState<number>(-1); // -1 = bottom, -2 = top, >= 0 = after index
  const [grabbedRoutineTaskIndex, setGrabbedRoutineTaskIndex] = useState<number | null>(null);
  const [grabbedRoutineTaskOriginalIndex, setGrabbedRoutineTaskOriginalIndex] = useState<number | null>(null);

  // Simple routine task editing
  const [editingRoutineTaskIndex, setEditingRoutineTaskIndex] = useState<number | null>(null);
  const [editRoutineTaskName, setEditRoutineTaskName] = useState('');
  const [editRoutineTaskDuration, setEditRoutineTaskDuration] = useState<number>(30);
  const [editRoutineTaskFieldFocus, setEditRoutineTaskFieldFocus] = useState<'name' | 'duration'>('name');

  // Use refs to track edit mode synchronously (state updates are async and cause first keypress to leak through)
  const editingRoutineTaskRef = useRef<number | null>(null);
  const editRoutineTaskFieldFocusRef = useRef<'name' | 'duration'>('name');

  // Routine task edit handlers
  const handleRoutineTaskEditSave = async () => {
    console.log('[handleRoutineTaskEditSave] Called. States:', {
      editingRoutineTaskIndex,
      editRoutineTaskName,
      editRoutineTaskDuration,
      currentRoutineForTasks
    });

    if (editingRoutineTaskIndex !== null && currentRoutineForTasks !== null) {
      const currentRoutine = routines[currentRoutineForTasks];
      if (currentRoutine && currentRoutine.tasks && currentRoutine.tasks[editingRoutineTaskIndex]) {
        const updatedRoutines = [...routines];
        const task = updatedRoutines[currentRoutineForTasks].tasks[editingRoutineTaskIndex];
        const taskId = task._id || task.id;

        // Update local state with BOTH name and duration
        task.title = editRoutineTaskName;
        task.name = editRoutineTaskName;
        task.content = editRoutineTaskName;
        task.duration = editRoutineTaskDuration;
        setRoutines(updatedRoutines);
        console.log('[handleRoutineTaskEditSave] Task updated locally:', task);

        // Persist both name and duration to database
        if (taskId && !taskId.startsWith('temp-')) {
          try {
            const response = await fetch(`/api/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: editRoutineTaskName,
                duration: editRoutineTaskDuration
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('[handleRoutineTaskEditSave] Task saved to database:', result.task);
            } else {
              console.error('[handleRoutineTaskEditSave] Failed to save task:', await response.text());
            }
          } catch (error) {
            console.error('[handleRoutineTaskEditSave] Error saving task:', error);
          }
        }

        // Clear ALL editing state (including refs for synchronous checks)
        editingRoutineTaskRef.current = null;
        editRoutineTaskFieldFocusRef.current = 'name';
        setEditingRoutineTaskIndex(null);
        setEditRoutineTaskName('');
        setEditRoutineTaskDuration(30);
        setEditRoutineTaskFieldFocus('name');
        console.log('[handleRoutineTaskEditSave] Edit state cleared');

        // Ensure we stay at routine task level for navigation
        setIsAtRoutineTaskLevel(true);
        console.log('[handleRoutineTaskEditSave] Navigation restored to routine task level');

        // Remove focus from any input elements to ensure keyboard navigation works
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        return;
      }
    }

    // Fallback: clear state
    editingRoutineTaskRef.current = null;
    editRoutineTaskFieldFocusRef.current = 'name';
    setEditingRoutineTaskIndex(null);
    setEditRoutineTaskName('');
    setEditRoutineTaskDuration(30);
    setEditRoutineTaskFieldFocus('name');
    console.log('[handleRoutineTaskEditSave] Edit state cleared - no task to update');
  };

  const handleRoutineTaskEditCancel = () => {
    console.log('[handleRoutineTaskEditCancel] Called. Current states:', {
      editingRoutineTaskIndex,
      selectedRoutineTaskIndex,
      currentRoutineForTasks,
      isAtRoutineTaskLevel
    });

    // Clear ALL edit state (including refs for synchronous checks)
    editingRoutineTaskRef.current = null;
    editRoutineTaskFieldFocusRef.current = 'name';
    setEditingRoutineTaskIndex(null);
    setEditRoutineTaskName('');
    setEditRoutineTaskDuration(30);
    setEditRoutineTaskFieldFocus('name');

    // Ensure we stay at routine task level for navigation
    if (currentRoutineForTasks !== null) {
      setIsAtRoutineTaskLevel(true);
    }

    // Remove focus from any input elements to ensure keyboard navigation works
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    console.log('[handleRoutineTaskEditCancel] Edit cancelled. State after clear:', {
      editingRoutineTaskRefCurrent: editingRoutineTaskRef.current,
      isAtRoutineTaskLevel: true,
      selectedRoutineTaskIndex
    });
  };

  // Admin tasks state - initialized with passed data (comes as backlog from API)
  const [adminTasks, setAdminTasks] = useState<Item[]>(adminTasksData || []);
  const [adminTaskViewMode, setAdminTaskViewMode] = useState<'active' | 'completed'>('active');
  const [isAtAdminLevel, setIsAtAdminLevel] = useState(false);
  const [adminLevelPosition, setAdminLevelPosition] = useState<number>(-1);
  const [grabbedAdminIndex, setGrabbedAdminIndex] = useState<number | null>(null);
  const [grabbedAdminOriginalIndex, setGrabbedAdminOriginalIndex] = useState<number | null>(null);
  const [isTypingAdmin, setIsTypingAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [adminInputStep, setAdminInputStep] = useState<'name' | 'priority' | null>(null);
  const [tempAdminName, setTempAdminName] = useState('');
  const [tempAdminPriority, setTempAdminPriority] = useState('');
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editingAdminIndex, setEditingAdminIndex] = useState<number | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminPriority, setEditAdminPriority] = useState('');
  const [editAdminGoalId, setEditAdminGoalId] = useState<string | null>(null);
  const [editAdminDuration, setEditAdminDuration] = useState<number>(30);
  const [editAdminDeadline, setEditAdminDeadline] = useState<string | null>(null);
  const [editAdminFieldFocus, setEditAdminFieldFocus] = useState<'name' | 'priority' | 'goal' | 'duration' | 'deadline'>('name');
  const [showEditAdminGoalPopup, setShowEditAdminGoalPopup] = useState(false);
  const [showEditAdminDurationPopup, setShowEditAdminDurationPopup] = useState(false);
  const [showEditAdminDeadlinePopup, setShowEditAdminDeadlinePopup] = useState(false);

  // Events state - initialized with passed data
  const [events, setEvents] = useState<Item[]>(eventsData || []);
  const [eventViewMode, setEventViewMode] = useState<'upcoming' | 'passed'>('upcoming');
  const [isAtEventLevel, setIsAtEventLevel] = useState(false);
  const [eventLevelPosition, setEventLevelPosition] = useState<number>(-1);
  const [grabbedEventIndex, setGrabbedEventIndex] = useState<number | null>(null);
  const [grabbedEventOriginalIndex, setGrabbedEventOriginalIndex] = useState<number | null>(null);
  const [isTypingEvent, setIsTypingEvent] = useState(false);
  const [eventInput, setEventInput] = useState('');
  const [eventInputStep, setEventInputStep] = useState<'name' | 'date' | null>(null);
  const [tempEventName, setTempEventName] = useState('');
  const [tempEventDate, setTempEventDate] = useState('');
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventGoalId, setEditEventGoalId] = useState<string | null>(null);
  const [editEventIsRecurring, setEditEventIsRecurring] = useState(false);
  const [editEventRecurringDays, setEditEventRecurringDays] = useState<string[]>([]);
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventStartTime, setEditEventStartTime] = useState('');
  const [editEventEndTime, setEditEventEndTime] = useState('');
  const [editEventLink, setEditEventLink] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventFieldFocus, setEditEventFieldFocus] = useState<'name' | 'goal' | 'recurring' | 'days' | 'date' | 'time' | 'link' | 'location'>('name');
  const [showEditEventGoalPopup, setShowEditEventGoalPopup] = useState(false);
  const [showEditEventRecurringPopup, setShowEditEventRecurringPopup] = useState(false);
  const [showEditEventDaysPopup, setShowEditEventDaysPopup] = useState(false);
  const [showEditEventDatePopup, setShowEditEventDatePopup] = useState(false);
  const [showEditEventTimePopup, setShowEditEventTimePopup] = useState(false);
  const [showEditEventLinkPopup, setShowEditEventLinkPopup] = useState(false);

  // Section input states (deprecated - kept for backward compatibility)
  const [activeSection, setActiveSection] = useState<'routines' | 'admin' | 'events' | null>(null);
  const [sectionInput, setSectionInput] = useState('');
  const [isTypingInSection, setIsTypingInSection] = useState(false);

  // Popup states for project creation
  const [showGoalSelectionPopup, setShowGoalSelectionPopup] = useState(false);
  const [showDeadlinePickerPopup, setShowDeadlinePickerPopup] = useState(false);
  const [pendingProjectData, setPendingProjectData] = useState<{
    name: string;
    goalId?: string | null;
    deadline?: string | null;
    position: number;
  } | null>(null);

  // Popup states for routine creation
  const [showRoutineGoalSelectionPopup, setShowRoutineGoalSelectionPopup] = useState(false);
  const [showRoutineDateRangePopup, setShowRoutineDateRangePopup] = useState(false);
  const [showRoutineDaySelectionPopup, setShowRoutineDaySelectionPopup] = useState(false);
  const [showRoutineTimeAndDurationPopup, setShowRoutineTimeAndDurationPopup] = useState(false);
  const [pendingRoutineData, setPendingRoutineData] = useState<{
    name: string;
    position: number;
    goalId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    days?: string[] | null;
    time?: string | null;
    duration?: number | null;
  } | null>(null);
  const [tempRoutineGoalId, setTempRoutineGoalId] = useState<string | null>(null);
  const [tempRoutineStartDate, setTempRoutineStartDate] = useState<string | null>(null);
  const [tempRoutineEndDate, setTempRoutineEndDate] = useState<string | null>(null);
  const [tempRoutineDays, setTempRoutineDays] = useState<string[] | null>(null);
  const [tempRoutineDuration, setTempRoutineDuration] = useState<number | null>(null);

  // Admin task popup states
  const [showAdminGoalSelectionPopup, setShowAdminGoalSelectionPopup] = useState(false);
  const [showAdminDurationPopup, setShowAdminDurationPopup] = useState(false);
  const [showAdminDeadlinePopup, setShowAdminDeadlinePopup] = useState(false);
  const [pendingAdminData, setPendingAdminData] = useState<{
    name: string;
    position: number;
    goalId?: string | null;
    duration?: number | null;
    deadline?: string | null;
    priority?: string | null;
    isEditing?: boolean;
    editingIndex?: number;
    taskId?: string;
  } | null>(null);
  const [tempAdminGoalId, setTempAdminGoalId] = useState<string | null>(null);
  const [tempAdminDuration, setTempAdminDuration] = useState<number | null>(null);
  const [tempAdminDeadline, setTempAdminDeadline] = useState<string | null>(null);

  // Event popup states
  const [showEventGoalSelectionPopup, setShowEventGoalSelectionPopup] = useState(false);
  const [showEventRecurringPopup, setShowEventRecurringPopup] = useState(false);
  const [showEventDaySelectionPopup, setShowEventDaySelectionPopup] = useState(false);
  const [showEventDatePopup, setShowEventDatePopup] = useState(false);
  const [showEventTimeRangePopup, setShowEventTimeRangePopup] = useState(false);
  const [showEventAddLinkPopup, setShowEventAddLinkPopup] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<{
    name: string;
    position: number;
    goalId?: string | null;
    isRecurring?: boolean;
    recurringDays?: string[] | null;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    link?: string | null;
    isEditing?: boolean;
    editingIndex?: number;
    eventId?: string;
  } | null>(null);
  const [tempEventGoalId, setTempEventGoalId] = useState<string | null>(null);
  const [tempEventIsRecurring, setTempEventIsRecurring] = useState<boolean>(false);
  const [tempEventRecurringDays, setTempEventRecurringDays] = useState<string[] | null>(null);
  const [tempEventStartTime, setTempEventStartTime] = useState<string | null>(null);
  const [tempEventEndTime, setTempEventEndTime] = useState<string | null>(null);
  const [tempEventLink, setTempEventLink] = useState<string | null>(null);

  // Routine task duration popup state
  const [showRoutineTaskDurationPopup, setShowRoutineTaskDurationPopup] = useState(false);
  const [selectedTaskForDuration, setSelectedTaskForDuration] = useState<{ index: number; name: string } | null>(null);

  // Fetch routines from database
  const fetchRoutines = async () => {
    try {
      const response = await fetch('/api/you/routines');
      if (response.ok) {
        const data = await response.json();
        console.log('[InventoryView] Fetched routines from database:', data.routines);

        // Transform database routines to match Item structure
        const transformedRoutines = data.routines.map((routine: any) => ({
          id: routine._id,
          content: routine.name,
          name: routine.name,
          time: routine.startTime,
          metadata: {
            goalId: routine.goalId,
            startDate: routine.startDate,
            endDate: routine.endDate,
            days: routine.days || [],
            startTime: routine.startTime,
            duration: routine.duration
          },
          // Transform tasks to match our format
          tasks: (routine.tasks || []).map((task: any) => {
            console.log('[fetchRoutines] Task from DB:', {
              id: task._id,
              title: task.title,
              duration: task.duration,
              rawTask: task
            });
            return {
              id: task._id,
              _id: task._id,
              name: task.title,
              content: task.title,
              title: task.title,
              duration: task.duration,
              completed: task.completed || false
            };
          })
        }));

        setRoutines(transformedRoutines);
      }
    } catch (error) {
      console.error('[InventoryView] Error fetching routines:', error);
    }
  };

  // Load routines on mount
  useEffect(() => {
    fetchRoutines();
  }, []);

  // Update routines when props change (fallback if parent provides data)
  useEffect(() => {
    if (routinesData && routinesData.length > 0) {
      console.log('[InventoryView] Updating routines from props:', routinesData);
      setRoutines(routinesData);
    }
  }, [routinesData]);

  // Update events when props change
  useEffect(() => {
    if (eventsData) {
      console.log('[InventoryView] Updating events from props:', eventsData);
      setEvents(eventsData);
    }
  }, [eventsData]);

  // Helper function to check if an event has passed
  const hasEventPassed = (event: Item): boolean => {
    const dateStr = event.date || event.metadata?.dueDate;
    if (!dateStr) return false;
    try {
      const eventDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate < today;
    } catch {
      return false;
    }
  };

  // Update projects when props change - NO FETCHING NEEDED
  // Tasks should already be included in projectsData from the parent
  useEffect(() => {
    if (projectsData) {
      console.log('[InventoryView] Updating projects from props (no fetch needed)');
      setProjects(projectsData as Project[]);
    }
  }, [projectsData]);

  // Update admin tasks when props change
  useEffect(() => {
    if (adminTasksData) {
      console.log('[InventoryView] Updating admin tasks from props:', adminTasksData);
      setAdminTasks(adminTasksData);
    }
  }, [adminTasksData]);

  // Smart scroll for task navigation - only scrolls when item is outside viewport
  useEffect(() => {
    if (isAtProjectTaskLevel && currentProjectForTasks !== null) {
      let elementToScroll = null;

      // Handle task selection
      if (selectedTaskIndex >= 0) {
        elementToScroll = document.querySelector(`[data-project-index="${currentProjectForTasks}"] [data-task-index="${selectedTaskIndex}"]`);
      }
      // Handle input positions
      else if (isTypingTask && taskInputPosition !== -1) {
        // For top/bottom inputs, find the input element
        const projectElement = document.querySelector(`[data-project-index="${currentProjectForTasks}"]`);
        if (projectElement) {
          if (taskInputPosition === -2) {
            // Top input
            elementToScroll = projectElement.querySelector('[data-task-input-top]');
          } else if (taskInputPosition === -1) {
            // Bottom input
            elementToScroll = projectElement.querySelector('[data-task-input-bottom]');
          }
        }
      }

      if (elementToScroll) {
        const rect = elementToScroll.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        const buffer = 100; // Buffer space from edges

        // Check if element is outside viewport (with buffer)
        if (rect.bottom > viewHeight - buffer || rect.top < buffer) {
          // Scroll only if needed
          elementToScroll.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          console.log('[Smart Scroll] Element scrolled into view');
        }
      }
    }
  }, [selectedTaskIndex, isAtProjectTaskLevel, currentProjectForTasks, isTypingTask, taskInputPosition]);

  // Auto-scroll when cursor position changes
  useEffect(() => {
    const scrollToSection = () => {
      let targetRef = null;

      switch(cursorPosition) {
        case 'goals':
          targetRef = goalsRef.current;
          break;
        case 'projects':
          targetRef = projectsRef.current;
          break;
        case 'routines':
          targetRef = routinesRef.current;
          break;
        case 'admin':
          targetRef = adminRef.current;
          break;
        case 'events':
          targetRef = eventsRef.current;
          break;
      }

      if (targetRef) {
        targetRef.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };

    scrollToSection();
  }, [cursorPosition]);

  // Auto-scroll when navigating items within sections
  useEffect(() => {
    // Small delay to allow DOM updates
    const timer = setTimeout(() => {
      // Find the active element based on which section we're in
      let activeElement = null;

      if (isAtGoalLevel && goalLevelPosition >= 0) {
        activeElement = document.querySelector(`[data-goal-index="${goalLevelPosition}"]`);
      } else if (isAtProjectLevel && projectLevelPosition >= 0) {
        activeElement = document.querySelector(`[data-project-index="${projectLevelPosition}"]`);
      } else if (isAtRoutineLevel && routineLevelPosition >= 0) {
        activeElement = document.querySelector(`[data-routine-index="${routineLevelPosition}"]`);
      } else if (isAtAdminLevel && adminLevelPosition >= 0) {
        activeElement = document.querySelector(`[data-admin-index="${adminLevelPosition}"]`);
      } else if (isAtEventLevel && eventLevelPosition >= 0) {
        activeElement = document.querySelector(`[data-event-index="${eventLevelPosition}"]`);
      }

      if (activeElement) {
        // Use 'nearest' for projects to minimize scrolling, 'center' for others
        const scrollBlock = isAtProjectLevel ? 'nearest' : 'center';

        // Skip scrolling for projects when moving between input positions (negative values)
        // or when the element is already mostly visible
        if (isAtProjectLevel && projectLevelPosition < 0) {
          return; // Don't scroll for input positions
        }

        const rect = activeElement.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

        // Only scroll if element is not fully visible
        if (!isVisible) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: scrollBlock
          });
        }
      }
    }, 100); // Increased delay for projects to let DOM settle

    return () => clearTimeout(timer);
  }, [
    goalLevelPosition, projectLevelPosition, routineLevelPosition,
    adminLevelPosition, eventLevelPosition,
    isAtGoalLevel, isAtProjectLevel, isAtRoutineLevel,
    isAtAdminLevel, isAtEventLevel
  ]);

  // Handle goal selection from popup
  const handleGoalSelection = (goalId: string | null) => {
    if (pendingProjectData) {
      setPendingProjectData({
        ...pendingProjectData,
        goalId
      });
    }
    setTempProjectGoalId(goalId);
    setShowGoalSelectionPopup(false);
    setShowDeadlinePickerPopup(true);
    console.log('[Popup] Goal selected:', goalId);
  };

  // Handle task duration selection from popup
  const handleTaskDurationSelection = (duration: number | null) => {
    // Duration is required, should never be null
    const finalDuration = duration || 30;
    if (pendingTaskData) {
      setPendingTaskData({
        ...pendingTaskData,
        duration: finalDuration
      });
    }
    setTempTaskDuration(finalDuration);
    setShowDurationPickerPopup(false);
    setShowTaskDeadlinePickerPopup(true);
    console.log('[Task Popup] Duration selected:', finalDuration);
  };

  // Handle task deadline selection from popup
  const handleTaskDeadlineSelection = async (deadline: string | null) => {
    // Use projectLevelPosition as fallback for newly created projects, but convert from filtered index to full array index
    let projectIndex = currentProjectForTasks;
    if (projectIndex === null && projectLevelPosition >= 0) {
      const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
      const currentProject = filteredProjects[projectLevelPosition];
      if (currentProject) {
        projectIndex = projects.findIndex(p => (p.id || p._id) === (currentProject.id || currentProject._id));
      }
    }
    if (projectIndex === null) projectIndex = projectLevelPosition; // Final fallback

    if (pendingTaskData && projectIndex >= 0) {
      const currentProject = projects[projectIndex];
      if (currentProject) {
        // Create optimistic task with temporary ID
        const tempId = `temp-task-${Date.now()}`;
        const optimisticTask = {
          _id: tempId,
          title: pendingTaskData.title,
          duration: pendingTaskData.duration || 30,
          dueDate: deadline || undefined,
          completed: false
        };

        // Update UI immediately (optimistic update)
        const updatedProjects = [...projects];
        if (!updatedProjects[projectIndex].tasks) {
          updatedProjects[projectIndex].tasks = [];
        }

        // Insert task based on position
        let insertedIndex = -1;
        if (pendingTaskData.position === -2) {
          updatedProjects[projectIndex].tasks.unshift(optimisticTask);
          insertedIndex = 0;
        } else if (pendingTaskData.position === -1) {
          updatedProjects[projectIndex].tasks.push(optimisticTask);
          insertedIndex = updatedProjects[projectIndex].tasks.length - 1;
        } else if (pendingTaskData.position >= 0) {
          updatedProjects[projectIndex].tasks.splice(pendingTaskData.position + 1, 0, optimisticTask);
          insertedIndex = pendingTaskData.position + 1;
        }

        // Use flushSync to update all states synchronously for smooth transition
        flushSync(() => {
          // Clear input first
          setTaskInput('');
          setShowTaskDeadlinePickerPopup(false);
          setPendingTaskData(null);
          setTempTaskTitle('');
          setTempTaskDuration(null);
          setTempTaskDeadline('');

          // Update projects
          setProjects(updatedProjects);

          // Position input below the new task and stay in typing mode
          setTaskInputPosition(insertedIndex);
          setSelectedTaskIndex(-1); // Keep selection on input, not the task
          setIsTypingTask(true); // Stay in typing mode for next task
        });

        // Also update parent state if setter is available
        if (setProjectsData) {
          setProjectsData(updatedProjects);
        }

        console.log('[Task] Added optimistic task:', optimisticTask);

        // Make API call in background
        try {
          const response = await fetch(`/api/inventory/projects/${currentProject.id}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: pendingTaskData.title,
              duration: pendingTaskData.duration || 30,
              dueDate: deadline || undefined,
              completed: false,
              order: insertedIndex
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Task] Task persisted to database:', data);

            // Update the temporary task with the real ID from server
            const finalProjects = [...projects];
            const projectTasks = finalProjects[currentProjectForTasks].tasks || [];
            const taskIndex = projectTasks.findIndex((t: any) => t._id === tempId);

            if (taskIndex !== -1) {
              projectTasks[taskIndex] = {
                ...projectTasks[taskIndex],
                _id: data._id || tempId
              };
              setProjects(finalProjects);
              if (setProjectsData) {
                setProjectsData(finalProjects);
              }
            }
          } else {
            // API call failed, remove the optimistic task
            console.error('[Task] Failed to create task, removing optimistic update');
            const revertedProjects = [...projects];
            const projectTasks = revertedProjects[currentProjectForTasks].tasks || [];
            const taskIndex = projectTasks.findIndex((t: any) => t._id === tempId);

            if (taskIndex !== -1) {
              projectTasks.splice(taskIndex, 1);
              setProjects(revertedProjects);
              if (setProjectsData) {
                setProjectsData(revertedProjects);
              }
              // Reset selection if we removed the selected task
              if (selectedTaskIndex === taskIndex) {
                setSelectedTaskIndex(-1);
              }
            }
          }
        } catch (error) {
          console.error('[Task] Error creating task:', error);
          // Remove optimistic task on error
          const revertedProjects = [...projects];
          const projectTasks = revertedProjects[currentProjectForTasks].tasks || [];
          const taskIndex = projectTasks.findIndex((t: any) => t._id === tempId);

          if (taskIndex !== -1) {
            projectTasks.splice(taskIndex, 1);
            setProjects(revertedProjects);
            if (setProjectsData) {
              setProjectsData(revertedProjects);
            }
            // Reset selection if we removed the selected task
            if (selectedTaskIndex === taskIndex) {
              setSelectedTaskIndex(-1);
            }
          }
        }

        // Log task creation
        console.log('[Task] Task created at index:', insertedIndex, 'Input positioned below for next task');

        // Ensure currentProjectForTasks is set for future operations
        if (currentProjectForTasks === null) {
          setCurrentProjectForTasks(projectIndex);
        }
      }
    }
  };

  // Handle task duration popup cancellation
  const handleTaskDurationCancel = () => {
    setShowDurationPickerPopup(false);
    setPendingTaskData(null);
    setTempTaskTitle('');
    setTempTaskDuration(null);
    setIsTypingTask(true);
    // Task input already has the text, just restore typing mode
    if (pendingTaskData) {
      setTaskInputPosition(pendingTaskData.position);
    }
  };

  // Handle task deadline popup cancellation
  const handleTaskDeadlineCancel = () => {
    setShowTaskDeadlinePickerPopup(false);
    setShowDurationPickerPopup(true); // Go back to duration selection
  };

  // Task edit popup handlers
  const handleEditTaskNameSubmit = (name: string) => {
    setEditTaskName(name);
    setShowEditTaskNamePopup(false);
    // Move to duration popup
    setShowEditTaskDurationPopup(true);
  };

  const handleEditTaskNameCancel = () => {
    setShowEditTaskNamePopup(false);
    setEditingTaskData(null);
    // Reset all edit states
    setEditTaskName('');
    setEditTaskDuration('');
    setEditTaskDeadline('');
  };

  const handleEditTaskDurationSubmit = (duration: number) => {
    setEditTaskDuration(String(duration));
    setShowEditTaskDurationPopup(false);
    // Non-chaining - just close and stay in edit mode
  };

  const handleEditTaskDurationCancel = () => {
    setShowEditTaskDurationPopup(false);
    // Non-chaining - just close and stay in edit mode
  };

  const handleEditTaskDeadlineSubmit = async (deadline: string | null) => {
    // Format deadline to DD/MM/YYYY for inline display
    if (deadline) {
      const date = new Date(deadline);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setEditTaskDeadline(`${day}/${month}/${year}`);
    } else {
      setEditTaskDeadline('');
    }
    setShowEditTaskDeadlinePopup(false);
    // Non-chaining - just close and stay in edit mode
  };

  const handleEditTaskDeadlineCancel = () => {
    setShowEditTaskDeadlinePopup(false);
    // Non-chaining - just close and stay in edit mode
  };

  // Handle deadline selection from popup
  const handleDeadlineSelection = async (deadline: string | null) => {
    setShowDeadlinePickerPopup(false);

    if (pendingProjectData) {
      // Create the new project with all collected data matching API structure
      const tempId = `project-${Date.now()}`;
      const newProject: any = {
        id: tempId,
        content: pendingProjectData.name, // API uses 'content' not 'name'
        type: "project",
        metadata: {
          completed: false,
          goalId: pendingProjectData.goalId || undefined,
          dueDate: deadline || undefined
        },
        tasks: []
      };

      // Save to database
      try {
        // Log existing project orders
        console.log('[Project] Existing projects and their orders:');
        projects.forEach((p, i) => {
          console.log(`  Project ${i}: ${p.content || p.name}, order=${p.order}`);
        });

        // Determine the correct order value based on position
        let orderValue = 0;
        if (pendingProjectData.position === -2) {
          // Adding at the top - should be less than smallest order
          const minOrder = Math.min(...projects.map(p => p.order || 999999).concat([0]));
          orderValue = minOrder - 1;
          console.log('[Project] Adding at top, minOrder=', minOrder, 'new orderValue=', orderValue);
        } else if (pendingProjectData.position === -1) {
          // Adding at the bottom - should be greater than largest order
          const maxOrder = Math.max(...projects.map(p => p.order || -1).concat([projects.length - 1]));
          orderValue = maxOrder + 1;
          console.log('[Project] Adding at bottom, maxOrder=', maxOrder, 'new orderValue=', orderValue);
        } else if (pendingProjectData.position < -2) {
          // Inserting after a specific position
          const insertAfterIndex = Math.abs(pendingProjectData.position) - 3;
          // Get the order of the project we're inserting after
          const afterProject = projects[insertAfterIndex];
          const beforeProject = projects[insertAfterIndex + 1];

          if (afterProject && beforeProject) {
            // Insert between two projects
            const afterOrder = afterProject.order || insertAfterIndex;
            const beforeOrder = beforeProject.order || (insertAfterIndex + 1);
            orderValue = (afterOrder + beforeOrder) / 2;
            console.log(`[Project] Inserting between orders ${afterOrder} and ${beforeOrder}, new orderValue=`, orderValue);
          } else if (afterProject) {
            // Inserting after the last project
            orderValue = (afterProject.order || insertAfterIndex) + 1;
            console.log(`[Project] Inserting after last project with order ${afterProject.order}, new orderValue=`, orderValue);
          } else {
            orderValue = insertAfterIndex + 1;
            console.log('[Project] Using index-based order:', orderValue);
          }
        }

        const requestBody = {
          userId: user?.id,
          name: pendingProjectData.name,
          goalId: pendingProjectData.goalId,
          dueDate: deadline,
          completed: false,
          order: orderValue
        };
        console.log('[Project] Sending to API with calculated order:', orderValue, 'for position:', pendingProjectData.position, requestBody);

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        console.log('[Project] Response status:', response.status);
        const responseText = await response.text();
        console.log('[Project] Response text:', responseText);

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log('[Project] Response data:', data);

          // Update the project with the real ID from database
          if (data.project && data.project._id) {
            newProject.id = data.project._id;
            console.log('[Project] Updated project ID to:', newProject.id);

            // If we inserted at the top or middle, update order of other projects
            if (pendingProjectData.position === -2 || pendingProjectData.position < -2) {
              console.log('[Project] Updating order of other projects...');
              // Update order of existing projects that come after this one
              const projectsToUpdate = projects.filter((p, index) => {
                if (pendingProjectData.position === -2) {
                  return true; // Update all when inserting at top
                } else if (pendingProjectData.position < -2) {
                  const insertAfterIndex = Math.abs(pendingProjectData.position) - 3;
                  return index > insertAfterIndex; // Update projects after insertion point
                }
                return false;
              });

              // Send batch update to update order values
              if (projectsToUpdate.length > 0) {
                console.log(`[Project] Updating order for ${projectsToUpdate.length} projects`);
                // We could create a batch update endpoint or update them individually
                // For now, we'll rely on refreshing from the database
              }
            }
          } else {
            console.error('[Project] No _id in response:', data);
          }
        } else {
          console.error('[Project] Failed to save to database, status:', response.status);
          console.error('[Project] Error response:', responseText);
        }
      } catch (error) {
        console.error('[Project] Error saving to database:', error);
      }

      // Insert at the appropriate position and navigate to task level
      let newProjectIndex = -1;
      if (pendingProjectData.position === -2) {
        const updatedProjects = [newProject, ...projects];
        setProjects(updatedProjects);
        // Also update parent state if setter is available
        if (setProjectsData) {
          setProjectsData(updatedProjects);
        }
        newProjectIndex = 0;
        setProjectLevelPosition(newProjectIndex);
        console.log('[Project] Created at top, updated both local and parent state');
      } else if (pendingProjectData.position === -1) {
        const updatedProjects = [...projects, newProject];
        setProjects(updatedProjects);
        // Also update parent state if setter is available
        if (setProjectsData) {
          setProjectsData(updatedProjects);
        }
        newProjectIndex = projects.length;
        setProjectLevelPosition(newProjectIndex);
        console.log('[Project] Created at bottom, updated both local and parent state');
      } else if (pendingProjectData.position < -2) {
        const insertAfterIndex = Math.abs(pendingProjectData.position) - 3;
        const newProjects = [...projects];
        newProjects.splice(insertAfterIndex + 1, 0, newProject);
        setProjects(newProjects);
        // Also update parent state if setter is available
        if (setProjectsData) {
          setProjectsData(newProjects);
        }
        newProjectIndex = insertAfterIndex + 1;
        setProjectLevelPosition(newProjectIndex);
        console.log('[Project] Inserted after index', insertAfterIndex, ', updated both local and parent state');
      }

      // Automatically navigate to task level inside the new project
      if (newProjectIndex !== -1) {
        setIsAtProjectTaskLevel(true);
        setCurrentProjectForTasks(newProjectIndex); // Set the current project for tasks
        setSelectedTaskIndex(-1); // Start at the input position for adding first task
        setIsTypingTask(false);
        setTaskInput('');
        setTaskInputPosition(-1); // Bottom position for empty project
        console.log('[Project] Auto-navigating to task level for new project at index', newProjectIndex);
      }

      // Clean up
      setPendingProjectData(null);
      setProjectInput(''); // Clear input now that project is created
      setTempProjectName('');
      setTempProjectGoalId(null);
      setTempProjectDeadline('');
      setIsTypingProject(false); // Stop typing project since we're moving to tasks

      // Optionally refresh projects from database to ensure consistency
      console.log('[Project] Triggering refresh of projects list');
      // We could trigger a refresh here if needed
    }
  };

  // Handle goal deadline selection from popup
  const handleGoalDeadlineSelection = async (date: string | null) => {
    setShowGoalDeadlinePopup(false);

    // Create goal with the name and deadline
    const tempId = `temp-${Date.now()}`;
    // Format the deadline for display if provided
    const formattedDeadline = date ? new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) : undefined;

    const newGoal: Goal = {
      id: tempId,
      name: tempGoalName,
      isExpanded: false,
      deadline: formattedDeadline
    };

    console.log('[Goal Creation] Creating goal from popup:', {
      name: tempGoalName,
      deadline: date,
      position: goalLevelPosition
    });

    // Determine insert position
    let insertIndex = goals.length;
    if (goalLevelPosition === -2) {
      insertIndex = 0; // Top position
    } else if (goalLevelPosition < -2) {
      // After a specific goal: -3 = after goal 0, -4 = after goal 1, etc.
      insertIndex = Math.abs(goalLevelPosition) - 2;
    }

    // Optimistically update the UI immediately
    const updatedGoals = [...goals];
    updatedGoals.splice(insertIndex, 0, newGoal);
    setGoals(updatedGoals);

    // Reset states and stay at goal level for next input
    setTempGoalName('');
    setTempGoalDeadline('');
    setGoalInput('');
    setInputStep(null);

    // Stay at goal level and move to bottom input position ready for next goal
    setIsAtGoalLevel(true);
    setGoalLevelPosition(-1);
    setIsTypingGoal(true);

    // Save to database in the background
    try {
      const response = await fetch('/api/you/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempGoalName,
          deadline: date ? new Date(date) : undefined,
          order: insertIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Goal Creation] Goal saved to database:', data);

        // Update the goal with the real ID without reloading
        if (data.goal && data.goal._id) {
          setGoals(prevGoals => {
            const newGoals = [...prevGoals];
            const goalIndex = newGoals.findIndex(g => g.id === tempId);
            if (goalIndex !== -1) {
              newGoals[goalIndex].id = data.goal._id;
            }
            return newGoals;
          });
        }
      } else {
        console.error('[Goal Creation] Failed to save goal:', await response.text());
        // On error, remove the optimistically added goal
        setGoals(prevGoals => prevGoals.filter(g => g.id !== tempId));

        // Show error to user (you might want to add a toast notification here)
        console.error('[Goal Creation] Removed failed goal from UI');
      }
    } catch (error) {
      console.error('[Goal Creation] Error saving goal:', error);
      // On error, remove the optimistically added goal
      setGoals(prevGoals => prevGoals.filter(g => g.id !== tempId));
    }

    console.log('[Goal Creation] Goal created successfully');
  };

  const handleGoalDeadlineCancel = () => {
    setShowGoalDeadlinePopup(false);
    // Stay at deadline step but clear the popup
    // This allows user to see their name and decide to re-open popup or press Esc to cancel
    setIsTypingGoal(true);
    setInputStep('deadline');
    setGoalInput(''); // Clear the deadline input
  };

  // Handle popup cancellation
  const handleGoalSelectionCancel = () => {
    setShowGoalSelectionPopup(false);
    setPendingProjectData(null);
    setTempProjectName('');
    setTempProjectGoalId(null);
    setIsTypingProject(true);
    setProjectInputStep('name');
    // Project input already has the text, just restore typing mode
    if (pendingProjectData) {
      setProjectLevelPosition(pendingProjectData.position);
    }
  };

  // Handle routine goal selection from popup
  const handleRoutineGoalSelection = (goalId: string | null) => {
    if (pendingRoutineData) {
      setPendingRoutineData({
        ...pendingRoutineData,
        goalId
      });
    }
    setTempRoutineGoalId(goalId);
    setShowRoutineGoalSelectionPopup(false);
    // Show date range popup next
    setShowRoutineDateRangePopup(true);
    console.log('[Routine Popup] Goal selected:', goalId, 'showing date range popup');
  };

  // Handle routine popup cancellation
  const handleRoutineGoalSelectionCancel = () => {
    setShowRoutineGoalSelectionPopup(false);
    setPendingRoutineData(null);
    setTempRoutineName('');
    setTempRoutineGoalId(null);
    setIsTypingRoutine(true);
    setRoutineInputStep('name');
    // Routine input already has the text, just restore typing mode
    if (pendingRoutineData) {
      setRoutineLevelPosition(pendingRoutineData.position);
    }
  };

  // Handle routine date range selection
  const handleRoutineDateRangeSelection = (startDate: string, endDate: string) => {
    if (pendingRoutineData) {
      setPendingRoutineData({
        ...pendingRoutineData,
        startDate,
        endDate
      });
    }
    setTempRoutineStartDate(startDate);
    setTempRoutineEndDate(endDate);
    setShowRoutineDateRangePopup(false);
    // Show day selection popup next
    setShowRoutineDaySelectionPopup(true);
    console.log('[Routine Popup] Date range selected:', startDate, '-', endDate, 'showing day selection popup');
  };

  // Handle routine date range cancellation
  const handleRoutineDateRangeCancel = () => {
    setShowRoutineDateRangePopup(false);
    // Go back to goal selection
    setShowRoutineGoalSelectionPopup(true);
    console.log('[Routine Popup] Date range cancelled, going back to goal selection');
  };

  // Handle routine day selection
  const handleRoutineDaySelection = (days: string[]) => {
    if (pendingRoutineData) {
      setPendingRoutineData({
        ...pendingRoutineData,
        days
      });
    }
    setTempRoutineDays(days);
    setShowRoutineDaySelectionPopup(false);
    // Show time and duration popup instead of time input
    setShowRoutineTimeAndDurationPopup(true);
    console.log('[Routine Popup] Days selected:', days, 'showing time and duration popup');
  };

  // Handle routine day selection cancellation
  const handleRoutineDaySelectionCancel = () => {
    setShowRoutineDaySelectionPopup(false);
    // Go back to date range selection
    setShowRoutineDateRangePopup(true);
    console.log('[Routine Popup] Day selection cancelled, going back to date range');
  };

  // Handle routine time and duration selection
  const handleRoutineTimeAndDurationSelection = async (time: string, duration: number) => {
    setShowRoutineTimeAndDurationPopup(false);

    if (pendingRoutineData) {
      // Create temporary ID for optimistic update
      const tempId = `routine-${Date.now()}`;

      // Create the complete routine
      const newRoutine: Item = {
        id: tempId,
        content: pendingRoutineData.name,
        name: pendingRoutineData.name,
        time: time,
        metadata: {
          goalId: pendingRoutineData.goalId || undefined,
          startDate: pendingRoutineData.startDate || undefined,
          endDate: pendingRoutineData.endDate || undefined,
          days: pendingRoutineData.days || [],
          startTime: time,
          duration: duration
        }
      };

      // Optimistic update
      const updatedRoutines = [...routines];
      let insertIndex = pendingRoutineData.position === -1 ? updatedRoutines.length : pendingRoutineData.position;
      if (pendingRoutineData.position === -1) {
        updatedRoutines.push(newRoutine);
      } else {
        updatedRoutines.splice(pendingRoutineData.position, 0, newRoutine);
      }
      setRoutines(updatedRoutines);

      // Save to database
      try {
        const response = await fetch('/api/you/routines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: pendingRoutineData.name,
            startDate: pendingRoutineData.startDate,
            endDate: pendingRoutineData.endDate,
            days: pendingRoutineData.days || [],
            startTime: time,
            duration: duration,
            goalId: pendingRoutineData.goalId || null,
            order: insertIndex
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[InventoryView] Routine saved to database:', data);

          // Update with real ID from database
          if (data.routine && data.routine._id) {
            const finalRoutines = [...updatedRoutines];
            const routineIndex = finalRoutines.findIndex(r => r.id === tempId);
            if (routineIndex !== -1) {
              finalRoutines[routineIndex].id = data.routine._id;
              setRoutines(finalRoutines);
            }
          }
        } else {
          console.error('[InventoryView] Failed to save routine:', await response.text());
          // Could show an error to user here
        }
      } catch (error) {
        console.error('[InventoryView] Error saving routine:', error);
        // Could show an error to user here
      }

      // Clear all routine creation state
      setPendingRoutineData(null);
      setTempRoutineName('');
      setTempRoutineGoalId(null);
      setTempRoutineStartDate(null);
      setTempRoutineEndDate(null);
      setTempRoutineDays(null);
      setTempRoutineTime('');
      setTempRoutineDuration(null);
      setRoutineInput('');
      setRoutineInputStep('name');  // Reset to 'name' instead of null
      setIsTypingRoutine(true);  // Keep typing mode active for next routine

      // Position at the bottom input for the next routine
      setRoutineLevelPosition(-1);

      console.log('[Routine Creation] Routine created successfully with time:', time, 'duration:', duration, '- ready for next routine');
    }
  };

  // Handle routine time and duration cancellation
  const handleRoutineTimeAndDurationCancel = () => {
    setShowRoutineTimeAndDurationPopup(false);
    // Go back to day selection
    setShowRoutineDaySelectionPopup(true);
    console.log('[Routine Popup] Time and duration cancelled, going back to day selection');
  };

  // ========== EDIT ROUTINE POPUP HANDLERS ==========

  // Handle edit routine goal selection
  const handleEditRoutineGoalSelection = (goalId: string | null) => {
    setEditRoutineGoalId(goalId);
    setShowEditRoutineGoalPopup(false);
    // Stay on goal field, don't auto-advance
    console.log('[Edit Routine] Goal selected:', goalId);
  };

  const handleEditRoutineGoalCancel = () => {
    setShowEditRoutineGoalPopup(false);
    console.log('[Edit Routine] Goal selection cancelled');
  };

  // Handle edit routine date range selection
  const handleEditRoutineDateRangeSelection = (startDate: string, endDate: string) => {
    setEditRoutineStartDate(startDate);
    setEditRoutineEndDate(endDate);
    setShowEditRoutineDateRangePopup(false);
    console.log('[Edit Routine] Dates selected:', startDate, 'to', endDate);
  };

  const handleEditRoutineDateRangeCancel = () => {
    setShowEditRoutineDateRangePopup(false);
    console.log('[Edit Routine] Date range selection cancelled');
  };

  // Handle edit routine days selection
  const handleEditRoutineDaysSelection = (days: string[]) => {
    setEditRoutineDays(days);
    setShowEditRoutineDaysPopup(false);
    console.log('[Edit Routine] Days selected:', days);
  };

  const handleEditRoutineDaysCancel = () => {
    setShowEditRoutineDaysPopup(false);
    console.log('[Edit Routine] Days selection cancelled');
  };

  // Handle edit routine time and duration selection
  const handleEditRoutineTimeSelection = async (time: string, duration: number) => {
    setEditRoutineTime(time);
    setEditRoutineDuration(duration);
    setShowEditRoutineTimePopup(false);
    console.log('[Edit Routine] Time selected:', time, 'duration:', duration);
  };

  const handleEditRoutineTimeCancel = () => {
    setShowEditRoutineTimePopup(false);
    console.log('[Edit Routine] Time selection cancelled');
  };

  // Handle edit routine duration selection (separate popup if needed)
  const handleEditRoutineDurationSelection = async (duration: number) => {
    setEditRoutineDuration(duration);
    setShowEditRoutineDurationPopup(false);
    console.log('[Edit Routine] Duration selected:', duration);
  };

  const handleEditRoutineDurationCancel = () => {
    setShowEditRoutineDurationPopup(false);
    console.log('[Edit Routine] Duration selection cancelled');
  };

  // ========== EDIT EVENT POPUP HANDLERS ==========

  // Handle edit event goal selection
  const handleEditEventGoalSelection = (goalId: string | null) => {
    setEditEventGoalId(goalId);
    setShowEditEventGoalPopup(false);
    console.log('[Edit Event] Goal selected:', goalId);
  };

  const handleEditEventGoalCancel = () => {
    setShowEditEventGoalPopup(false);
    console.log('[Edit Event] Goal selection cancelled');
  };

  // Handle edit event recurring selection
  const handleEditEventRecurringSelection = (isRecurring: boolean) => {
    setEditEventIsRecurring(isRecurring);
    setShowEditEventRecurringPopup(false);
    console.log('[Edit Event] Recurring set to:', isRecurring);
  };

  const handleEditEventRecurringCancel = () => {
    setShowEditEventRecurringPopup(false);
    console.log('[Edit Event] Recurring selection cancelled');
  };

  // Handle edit event days selection
  const handleEditEventDaysSelection = (days: string[]) => {
    setEditEventRecurringDays(days);
    setShowEditEventDaysPopup(false);
    console.log('[Edit Event] Days selected:', days);
  };

  const handleEditEventDaysCancel = () => {
    setShowEditEventDaysPopup(false);
    console.log('[Edit Event] Days selection cancelled');
  };

  // Handle edit event date selection
  const handleEditEventDateSelection = (date: string | null) => {
    setEditEventDate(date || '');
    setShowEditEventDatePopup(false);
    console.log('[Edit Event] Date selected:', date);
  };

  const handleEditEventDateCancel = () => {
    setShowEditEventDatePopup(false);
    console.log('[Edit Event] Date selection cancelled');
  };

  // Handle edit event time selection
  const handleEditEventTimeSelection = (startTime: string, endTime: string) => {
    setEditEventStartTime(startTime);
    setEditEventEndTime(endTime);
    setShowEditEventTimePopup(false);
    console.log('[Edit Event] Time selected:', startTime, 'to', endTime);
  };

  const handleEditEventTimeCancel = () => {
    setShowEditEventTimePopup(false);
    console.log('[Edit Event] Time selection cancelled');
  };

  // Handle edit event link selection
  const handleEditEventLinkSelection = (link: string | null) => {
    setEditEventLink(link || '');
    setShowEditEventLinkPopup(false);
    console.log('[Edit Event] Link set to:', link);
  };

  const handleEditEventLinkCancel = () => {
    setShowEditEventLinkPopup(false);
    console.log('[Edit Event] Link selection cancelled');
  };

  // ========== EDIT ADMIN TASK POPUP HANDLERS ==========

  // Handle edit admin task goal selection
  const handleEditAdminGoalSelection = (goalId: string | null) => {
    setEditAdminGoalId(goalId);
    setShowEditAdminGoalPopup(false);
    console.log('[Edit Admin] Goal selected:', goalId);
  };

  const handleEditAdminGoalCancel = () => {
    setShowEditAdminGoalPopup(false);
    console.log('[Edit Admin] Goal selection cancelled');
  };

  // Handle edit admin task duration selection
  const handleEditAdminDurationSelection = (duration: number) => {
    setEditAdminDuration(duration);
    setShowEditAdminDurationPopup(false);
    console.log('[Edit Admin] Duration set to:', duration);
  };

  const handleEditAdminDurationCancel = () => {
    setShowEditAdminDurationPopup(false);
    console.log('[Edit Admin] Duration selection cancelled');
  };

  // Handle edit admin task deadline selection
  const handleEditAdminDeadlineSelection = (deadline: string | null) => {
    setEditAdminDeadline(deadline);
    setShowEditAdminDeadlinePopup(false);
    console.log('[Edit Admin] Deadline set to:', deadline);
  };

  const handleEditAdminDeadlineCancel = () => {
    setShowEditAdminDeadlinePopup(false);
    console.log('[Edit Admin] Deadline selection cancelled');
  };

  // Handle routine task duration selection
  const handleRoutineTaskDurationSelection = async (duration: number) => {
    console.log('[handleRoutineTaskDurationSelection] Called with:', {
      duration,
      selectedTaskForDuration,
      currentRoutineForTasks,
      isTypingRoutineTask,
      routineTaskInput
    });

    if (selectedTaskForDuration && currentRoutineForTasks !== null) {
      const currentRoutine = routines[currentRoutineForTasks];

      // SPECIAL CASE: If in edit mode, just update the edit state (don't persist yet)
      if (editingRoutineTaskRef.current !== null) {
        console.log('[handleRoutineTaskDurationSelection] In edit mode, updating edit duration state to:', duration);
        setEditRoutineTaskDuration(duration);
        setShowRoutineTaskDurationPopup(false);
        setSelectedTaskForDuration(null);
        // Keep edit mode active
        return;
      }

      // Check if this is a new task creation (when we're typing)
      // Note: routineTaskInput may be empty as we clear it when showing the popup
      if (isTypingRoutineTask && selectedTaskForDuration.name) {
        // Create temporary ID for optimistic update
        const tempId = `task-${Date.now()}`;

        // Create new task with the selected duration
        const newTask = {
          id: tempId,
          name: selectedTaskForDuration.name,
          content: selectedTaskForDuration.name,
          title: selectedTaskForDuration.name,
          duration: duration,
          completed: false
        };

        if (currentRoutine) {
          const updatedTasks = [...(currentRoutine.tasks || [])];
          let insertPosition = 0;
          let newInputPosition = 0;

          // Insert task at the right position and calculate new input position
          if (routineTaskInputPosition === -2) {
            // Top position - insert at beginning
            updatedTasks.unshift(newTask);
            insertPosition = 0;
            newInputPosition = 0; // Input after first task
          } else if (routineTaskInputPosition === -1) {
            // Bottom position - append to end
            updatedTasks.push(newTask);
            insertPosition = updatedTasks.length - 1;
            newInputPosition = insertPosition; // Input after new last task
          } else if (routineTaskInputPosition >= 0) {
            // Inline position - insert after current task
            updatedTasks.splice(routineTaskInputPosition + 1, 0, newTask);
            insertPosition = routineTaskInputPosition + 1;
            newInputPosition = insertPosition; // Input after new task
          }

          // Prepare the updated routines
          const updatedRoutines = [...routines];
          updatedRoutines[currentRoutineForTasks] = {
            ...currentRoutine,
            tasks: updatedTasks
          };

          // Use flushSync to batch all state updates synchronously
          flushSync(() => {
            // Clear all input-related state and update tasks in one go
            setRoutineTaskInput('');
            setShowRoutineTaskDurationPopup(false);
            setRoutines(updatedRoutines);
            setIsTypingRoutineTask(true);
            setRoutineTaskInputPosition(newInputPosition);
            setSelectedRoutineTaskIndex(-1); // No task selected, focus on input
          });

          // Save task to database
          try {
            const response = await fetch(`/api/routines/${currentRoutine.id}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: selectedTaskForDuration.name,
                duration: duration,
                completed: false,
                order: insertPosition
              })
            });

            if (response.ok) {
              const updatedRoutineData = await response.json();
              console.log('[Routine Task] Task saved to database:', updatedRoutineData);

              // Update routine with the returned data which includes the real task IDs
              const finalRoutines = [...updatedRoutines];
              const routineIndex = finalRoutines.findIndex(r => r.id === currentRoutine.id);
              if (routineIndex !== -1 && updatedRoutineData.tasks) {
                // Transform tasks to match our format
                finalRoutines[routineIndex].tasks = updatedRoutineData.tasks.map((task: any) => ({
                  id: task._id,
                  _id: task._id,
                  name: task.title,
                  content: task.title,
                  title: task.title,
                  duration: task.duration,
                  completed: task.completed || false
                }));
                setRoutines(finalRoutines);
              }
            } else {
              console.error('[Routine Task] Failed to save task:', await response.text());
            }
          } catch (error) {
            console.error('[Routine Task] Error saving task:', error);
          }

          console.log('[Routine Task] Created task:', newTask.name, 'with duration:', duration, 'minutes. Input now at position:', newInputPosition);
        }
      } else if (currentRoutine && currentRoutine.tasks) {
        // Update existing task duration
        console.log('[handleRoutineTaskDurationSelection] Updating existing task duration');
        const updatedTasks = [...(currentRoutine.tasks || [])];
        const taskToUpdate = updatedTasks[selectedTaskForDuration.index];
        console.log('[handleRoutineTaskDurationSelection] Task to update:', taskToUpdate);

        if (taskToUpdate) {
          const taskId = taskToUpdate._id || taskToUpdate.id;
          console.log('[handleRoutineTaskDurationSelection] Task ID:', taskId);
          taskToUpdate.duration = duration;

          // Update the routine with the new tasks
          const updatedRoutines = [...routines];
          updatedRoutines[currentRoutineForTasks] = {
            ...currentRoutine,
            tasks: updatedTasks
          };
          setRoutines(updatedRoutines);

          console.log('[Routine Task] Updated task duration locally:', selectedTaskForDuration.name, 'to', duration, 'minutes');

          // Persist duration change to database
          if (taskId && !taskId.startsWith('temp-')) {
            console.log('[handleRoutineTaskDurationSelection] Persisting to database...');
            try {
              const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: duration })
              });

              if (response.ok) {
                const result = await response.json();
                console.log('[Routine Task] Task duration saved to database:', result.task);

                // Don't refresh immediately - the local state update should be enough
                // The next navigation or page refresh will get the latest data
                // await fetchRoutines();
              } else {
                console.error('[Routine Task] Failed to save task duration:', await response.text());
              }
            } catch (error) {
              console.error('[Routine Task] Error saving task duration:', error);
            }
          } else {
            console.log('[handleRoutineTaskDurationSelection] Task ID is invalid or temp:', taskId);
          }
        }
      } else {
        console.log('[handleRoutineTaskDurationSelection] No matching condition:', {
          hasCurrentRoutine: !!currentRoutine,
          hasTasks: !!(currentRoutine && currentRoutine.tasks)
        });
      }
    } else {
      console.log('[handleRoutineTaskDurationSelection] Missing required data:', {
        selectedTaskForDuration,
        currentRoutineForTasks
      });
    }

    // Clear selection and popup
    setSelectedTaskForDuration(null);
    setShowRoutineTaskDurationPopup(false);

    // Restore navigation state
    setIsAtRoutineTaskLevel(true);

    // Remove focus from any input elements to ensure keyboard navigation works
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    console.log('[handleRoutineTaskDurationSelection] Duration selection complete, navigation restored');
  };

  // Handle routine task duration cancellation
  const handleRoutineTaskDurationCancel = () => {
    setShowRoutineTaskDurationPopup(false);
    setSelectedTaskForDuration(null);

    // If we were creating a new task, clear the input and go back to typing
    if (isTypingRoutineTask) {
      // Keep the typing state so user can continue typing or press ESC to cancel
      console.log('[Routine Task] Duration selection cancelled, returning to task input');
    } else {
      // Restore navigation state for editing existing task
      setIsAtRoutineTaskLevel(true);
    }

    // Remove focus from any input elements to ensure keyboard navigation works
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    console.log('[Routine Task] Duration selection cancelled, navigation restored');
  };

  // Handle routine task reordering persistence
  const handleRoutineTaskReorderPersist = async (routineIndex: number) => {
    if (routineIndex === null || routineIndex < 0 || routineIndex >= routines.length) return;

    const routine = routines[routineIndex];
    if (!routine || !routine.tasks) return;

    const routineId = routine.id || routine._id;

    console.log('[Routine Task] Persisting task order for routine:', routineId);

    try {
      // Update the routine with the new task order
      const response = await fetch(`/api/routines/${routineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: routine.tasks.map(t => t._id || t.id)
        })
      });

      if (response.ok) {
        console.log('[Routine Task] Task order persisted successfully');
      } else {
        console.error('[Routine Task] Failed to persist task order:', await response.text());
      }
    } catch (error) {
      console.error('[Routine Task] Error persisting task order:', error);
    }
  };

  // Handle routine task deletion
  const handleDeleteRoutineTask = async (routineIndex: number, taskIndex: number) => {
    if (routineIndex === null || routineIndex < 0 || routineIndex >= routines.length) return;

    const routine = routines[routineIndex];
    if (!routine || !routine.tasks || taskIndex < 0 || taskIndex >= routine.tasks.length) return;

    const task = routine.tasks[taskIndex];
    const taskId = task._id || task.id;

    console.log('[Routine Task] Deleting task:', {
      routineIndex,
      taskIndex,
      taskId,
      taskName: task.name || task.title
    });

    // Optimistic update - remove task from UI immediately
    const updatedRoutines = [...routines];
    updatedRoutines[routineIndex].tasks.splice(taskIndex, 1);
    setRoutines(updatedRoutines);

    // Update selected task index if needed
    if (selectedRoutineTaskIndex >= taskIndex && selectedRoutineTaskIndex > 0) {
      setSelectedRoutineTaskIndex(selectedRoutineTaskIndex - 1);
    } else if (routine.tasks.length === 1) {
      // Last task deleted, no tasks left
      setSelectedRoutineTaskIndex(-1);
    }

    // Delete from database
    if (taskId && !taskId.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/delete-task-from-routine/${taskId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routineId: routine.id || routine._id
          })
        });

        if (response.ok) {
          console.log('[Routine Task] Task deleted from database');
          const result = await response.json();
          console.log('[Routine Task] Delete result:', result);
        } else {
          console.error('[Routine Task] Failed to delete task from database:', await response.text());
          // Optionally revert the optimistic update
        }
      } catch (error) {
        console.error('[Routine Task] Error deleting task:', error);
      }
    }
  };

  // Admin popup handlers
  const handleAdminGoalSelection = (goalId: string | null) => {
    if (pendingAdminData) {
      setPendingAdminData({
        ...pendingAdminData,
        goalId
      });
    }
    setTempAdminGoalId(goalId);
    setShowAdminGoalSelectionPopup(false);
    // Show duration popup next
    setShowAdminDurationPopup(true);
    console.log('[Admin Popup] Goal selected:', goalId, 'showing duration popup');
  };

  const handleAdminGoalSelectionCancel = () => {
    setShowAdminGoalSelectionPopup(false);
    setPendingAdminData(null);
    setTempAdminName('');
    setTempAdminGoalId(null);
    setIsTypingAdmin(true);
    setAdminInputStep('name');
    // Admin input already has the text, just restore typing mode
    if (pendingAdminData) {
      setAdminLevelPosition(pendingAdminData.position);
    }
  };

  const handleAdminDurationSelection = (duration: number) => {
    if (pendingAdminData) {
      setPendingAdminData({
        ...pendingAdminData,
        duration
      });
    }
    setTempAdminDuration(duration);
    setShowAdminDurationPopup(false);
    // Show deadline popup next
    setShowAdminDeadlinePopup(true);
    console.log('[Admin Popup] Duration selected:', duration, 'showing deadline popup');
  };

  const handleAdminDurationCancel = () => {
    setShowAdminDurationPopup(false);
    // Go back to goal selection
    setShowAdminGoalSelectionPopup(true);
  };

  const handleAdminDeadlineSelection = async (deadline: string | null) => {
    if (pendingAdminData) {
      // Check if we're editing an existing task or creating a new one
      if (pendingAdminData.isEditing && pendingAdminData.editingIndex !== undefined) {
        // Update existing task
        const updatedAdminTasks = [...adminTasks];
        const currentTask = updatedAdminTasks[pendingAdminData.editingIndex];

        updatedAdminTasks[pendingAdminData.editingIndex] = {
          ...currentTask,
          name: pendingAdminData.name,
          content: pendingAdminData.name,
          priority: pendingAdminData.priority || currentTask.priority || 'medium',
          metadata: {
            ...currentTask.metadata,
            goalId: pendingAdminData.goalId,
            duration: pendingAdminData.duration ? `${pendingAdminData.duration}m` : currentTask.metadata?.duration,
            deadline: deadline || undefined,
            dueDate: deadline || undefined
          }
        };
        setAdminTasks(updatedAdminTasks);

        // Persist to database
        if (pendingAdminData.taskId && !pendingAdminData.taskId.startsWith('temp-')) {
          try {
            const response = await fetch(`/api/you/task/${pendingAdminData.taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: pendingAdminData.name,
                duration: pendingAdminData.duration || 30, // Send as number, not string with 'm'
                goalId: pendingAdminData.goalId || null,
                dueDate: deadline ? new Date(deadline) : null,
                // Keep priority in case it's used elsewhere
                priority: pendingAdminData.priority || undefined
              })
            });

            if (response.ok) {
              console.log('[Admin Edit] Task updated in database');
            } else {
              console.error('[Admin Edit] Failed to update task:', await response.text());
            }
          } catch (error) {
            console.error('[Admin Edit] Error updating task:', error);
          }
        }
      } else {
        // Create new task (existing code)
        const tempId = `temp-admin-${Date.now()}`;
        const newAdmin = {
          id: tempId,
          name: pendingAdminData.name,
          content: pendingAdminData.name,
          priority: pendingAdminData.priority || 'medium',
          metadata: {
            goalId: pendingAdminData.goalId,
            duration: pendingAdminData.duration ? `${pendingAdminData.duration}m` : undefined,
            deadline: deadline || undefined
          }
        };

        let insertIndex = adminTasks.length;
        if (pendingAdminData.position === -2) {
          insertIndex = 0;
        } else if (pendingAdminData.position < -2) {
          insertIndex = Math.abs(pendingAdminData.position) - 2;
        }

        const newAdminTasks = [...adminTasks];
        newAdminTasks.splice(insertIndex, 0, newAdmin);
        setAdminTasks(newAdminTasks);

        // Position cursor on new admin task
        if (pendingAdminData.position === -2) {
          setAdminLevelPosition(0);
        } else if (pendingAdminData.position < -2) {
          setAdminLevelPosition(insertIndex);
        } else {
          setAdminLevelPosition(insertIndex);
        }

        console.log('[Admin Popup] Created admin task:', newAdmin);

        // Persist to database
        try {
          const response = await fetch('/api/admin-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: pendingAdminData.name,
              title: pendingAdminData.name,
              duration: pendingAdminData.duration || 30,
              dueDate: deadline || undefined,
              goalId: pendingAdminData.goalId || undefined,
              order: insertIndex,
              completed: false
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Admin Task] Task persisted to database:', data);

            // Update the temporary task with the real ID from server
            const finalAdminTasks = [...adminTasks];
            const taskIndex = finalAdminTasks.findIndex((t: any) => t.id === tempId);

            if (taskIndex !== -1) {
              finalAdminTasks[taskIndex] = {
                ...finalAdminTasks[taskIndex],
                id: data._id || data.id || tempId,
                _id: data._id || data.id
              };
              setAdminTasks(finalAdminTasks);
            }
          } else {
            console.error('[Admin Task] Failed to create task:', await response.text());
            // Optionally remove the optimistic update
            const revertedAdminTasks = adminTasks.filter((t: any) => t.id !== tempId);
            setAdminTasks(revertedAdminTasks);
          }
        } catch (error) {
          console.error('[Admin Task] Error creating task:', error);
          // Remove optimistic update on error
          const revertedAdminTasks = adminTasks.filter((t: any) => t.id !== tempId);
          setAdminTasks(revertedAdminTasks);
        }
      }
    }

    // Reset all admin states
    setShowAdminDeadlinePopup(false);
    setPendingAdminData(null);
    setTempAdminName('');
    setTempAdminGoalId(null);
    setTempAdminDuration(null);
    setTempAdminDeadline(null);
    setAdminInput('');
    setAdminInputStep(null);
    setIsTypingAdmin(false);
  };

  const handleAdminDeadlineCancel = () => {
    setShowAdminDeadlinePopup(false);
    // Go back to duration selection
    setShowAdminDurationPopup(true);
  };

  // Event popup handlers
  const handleEventGoalSelection = (goalId: string | null) => {
    if (pendingEventData) {
      setPendingEventData({
        ...pendingEventData,
        goalId
      });
    }
    setTempEventGoalId(goalId);
    setShowEventGoalSelectionPopup(false);
    // Show recurring popup next
    setShowEventRecurringPopup(true);
    console.log('[Event Popup] Goal selected:', goalId, 'showing recurring popup');
  };

  const handleEventGoalSelectionCancel = () => {
    setShowEventGoalSelectionPopup(false);
    setPendingEventData(null);
    setTempEventName('');
    setTempEventGoalId(null);
    setIsTypingEvent(true);
    setEventInputStep('name');
    // Event input already has the text, just restore typing mode
    if (pendingEventData) {
      setEventLevelPosition(pendingEventData.position);
    }
  };

  const handleEventRecurringSelection = (isRecurring: boolean) => {
    if (pendingEventData) {
      setPendingEventData({
        ...pendingEventData,
        isRecurring
      });
    }
    setTempEventIsRecurring(isRecurring);
    setShowEventRecurringPopup(false);

    if (isRecurring) {
      // Show day selection popup if recurring
      setShowEventDaySelectionPopup(true);
      console.log('[Event Popup] Recurring: yes, showing day selection popup');
    } else {
      // Skip to date selection if not recurring
      setShowEventDatePopup(true);
      console.log('[Event Popup] Recurring: no, showing date popup');
    }
  };

  const handleEventRecurringCancel = () => {
    setShowEventRecurringPopup(false);
    // Go back to goal selection
    setShowEventGoalSelectionPopup(true);
  };

  const handleEventDaySelection = (days: string[]) => {
    if (pendingEventData) {
      setPendingEventData({
        ...pendingEventData,
        recurringDays: days
      });
    }
    setTempEventRecurringDays(days);
    setShowEventDaySelectionPopup(false);
    // Show date popup next
    setShowEventDatePopup(true);
    console.log('[Event Popup] Days selected:', days, 'showing date popup');
  };

  const handleEventDaySelectionCancel = () => {
    setShowEventDaySelectionPopup(false);
    // Go back to recurring selection
    setShowEventRecurringPopup(true);
  };

  const handleEventDateSelection = (date: string | null) => {
    if (pendingEventData) {
      setPendingEventData({
        ...pendingEventData,
        date
      });
    }
    setTempEventDate(date || '');
    setShowEventDatePopup(false);
    // Show time range popup next
    setShowEventTimeRangePopup(true);
    console.log('[Event Popup] Date selected:', date, 'showing time range popup');
  };

  const handleEventDateCancel = () => {
    setShowEventDatePopup(false);
    // Go back to either day selection or recurring selection
    if (tempEventIsRecurring) {
      setShowEventDaySelectionPopup(true);
    } else {
      setShowEventRecurringPopup(true);
    }
  };

  const handleEventTimeRangeSelection = (startTime: string, endTime: string) => {
    if (pendingEventData) {
      setPendingEventData({
        ...pendingEventData,
        startTime,
        endTime
      });
    }
    setTempEventStartTime(startTime);
    setTempEventEndTime(endTime);
    setShowEventTimeRangePopup(false);
    // Show add link popup next
    setShowEventAddLinkPopup(true);
    console.log('[Event Popup] Time range selected:', startTime, '-', endTime, 'showing add link popup');
  };

  const handleEventTimeRangeCancel = () => {
    setShowEventTimeRangePopup(false);
    // Go back to date selection
    setShowEventDatePopup(true);
  };

  const handleEventAddLinkSelection = (link: string | null) => {
    if (pendingEventData) {
      // Check if we're editing or creating
      if (pendingEventData.isEditing && pendingEventData.editingIndex !== undefined) {
        // Update existing event
        const updatedEvents = [...events];
        const currentEvent = updatedEvents[pendingEventData.editingIndex];

        updatedEvents[pendingEventData.editingIndex] = {
          ...currentEvent,
          name: pendingEventData.name,
          content: pendingEventData.name,
          date: pendingEventData.date || currentEvent.date,
          metadata: {
            ...currentEvent.metadata,
            goalId: pendingEventData.goalId,
            isRecurring: pendingEventData.isRecurring,
            recurringDays: pendingEventData.recurringDays,
            startTime: pendingEventData.startTime,
            endTime: pendingEventData.endTime,
            link: link || undefined
          }
        };
        setEvents(updatedEvents);

        // Persist to database
        if (pendingEventData.eventId) {
          const updateEventInDatabase = async () => {
            try {
              const response = await fetch(`/api/you/events/${pendingEventData.eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: pendingEventData.name,
                  date: pendingEventData.date,
                  startTime: pendingEventData.startTime || '09:00',
                  endTime: pendingEventData.endTime || '10:00',
                  metadata: {
                    goalId: pendingEventData.goalId,
                    isRecurring: pendingEventData.isRecurring,
                    recurringDays: pendingEventData.recurringDays,
                    link: link || undefined
                  }
                })
              });

              if (response.ok) {
                console.log('[Event Edit] Event updated in database');
              } else {
                console.error('[Event Edit] Failed to update event:', await response.text());
              }
            } catch (error) {
              console.error('[Event Edit] Error updating event:', error);
            }
          };
          updateEventInDatabase();
        }
      } else {
        // Create new event (existing code)
        const newEvent = {
          id: Date.now().toString(),
          name: pendingEventData.name,
          content: pendingEventData.name,
          date: pendingEventData.date || new Date().toISOString().split('T')[0],
          metadata: {
            goalId: pendingEventData.goalId,
            isRecurring: pendingEventData.isRecurring,
            recurringDays: pendingEventData.recurringDays,
            startTime: pendingEventData.startTime,
            endTime: pendingEventData.endTime,
            link: link || undefined
          }
        };

        let insertIndex = events.length;
        if (pendingEventData.position === -2) {
          insertIndex = 0;
        } else if (pendingEventData.position < -2) {
          insertIndex = Math.abs(pendingEventData.position) - 2;
        }

        const newEvents = [...events];
        newEvents.splice(insertIndex, 0, newEvent);
        setEvents(newEvents);

        // Save to database
        const saveEventToDatabase = async () => {
          try {
            const response = await fetch('/api/you/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: newEvent.name,
                startTime: newEvent.metadata?.startTime || '09:00',
                endTime: newEvent.metadata?.endTime || '10:00',
                order: insertIndex,
                metadata: newEvent.metadata
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('[Event] Event saved to database:', data.event);

              // Update the event with the real ID from database
              const updatedEvents = [...newEvents];
              const eventIndex = updatedEvents.findIndex(e => e.id === newEvent.id);
              if (eventIndex !== -1 && data.event) {
                updatedEvents[eventIndex] = {
                  ...updatedEvents[eventIndex],
                  id: data.event._id || data.event.id
                };
                setEvents(updatedEvents);
              }
            } else {
              console.error('[Event] Failed to save event to database');
            }
          } catch (error) {
            console.error('[Event] Error saving event:', error);
          }
        };
        saveEventToDatabase();

        // Position cursor on new event
        if (pendingEventData.position === -2) {
          setEventLevelPosition(0);
        } else if (pendingEventData.position < -2) {
          setEventLevelPosition(insertIndex);
        } else if (pendingEventData.position === -1) {
          setEventLevelPosition(newEvents.length - 1);
        }

        console.log('[Event Popup] Created event:', newEvent);
      }

      // Reset all states
      setShowEventAddLinkPopup(false);
      setPendingEventData(null);
      setEventInput('');
      setEventInputStep(null);
      setTempEventName('');
      setTempEventDate('');
      setTempEventGoalId(null);
      setTempEventIsRecurring(false);
      setTempEventRecurringDays(null);
      setTempEventStartTime(null);
      setTempEventEndTime(null);
      setTempEventLink(null);
      setIsTypingEvent(false);
    }
  };

  const handleEventAddLinkCancel = () => {
    setShowEventAddLinkPopup(false);
    // Go back to time range selection
    setShowEventTimeRangePopup(true);
  };

  // Handle edit goal selection from popup
  const handleEditGoalSelection = (goalId: string | null) => {
    setEditProjectGoalId(goalId);
    setShowEditGoalSelectionPopup(false);
    console.log('[Edit Project] Goal selected:', goalId);
  };

  // Handle edit goal popup cancellation
  const handleEditGoalSelectionCancel = () => {
    setShowEditGoalSelectionPopup(false);
    console.log('[Edit Project] Goal selection cancelled');
  };

  // Handle edit deadline selection from popup
  const handleEditDeadlineSelection = (deadline: string | null) => {
    setEditProjectDeadline(deadline || '');
    setShowEditDeadlinePickerPopup(false);
    console.log('[Edit Project] Deadline set to:', deadline);
  };

  // Handle edit deadline popup cancellation
  const handleEditDeadlinePickerCancel = () => {
    setShowEditDeadlinePickerPopup(false);
    console.log('[Edit Project] Deadline selection cancelled');
  };

  const handleDeadlinePickerCancel = () => {
    setShowDeadlinePickerPopup(false);
    setShowGoalSelectionPopup(true); // Go back to goal selection
  };

  // Load goals from database
  const loadGoals = async () => {
    if (!user?.id) {
      setIsLoadingGoals(false);
      return;
    }

    try {
      console.log('[InventoryView] Loading goals for user:', user.id);
      const response = await fetch('/api/you');
      if (response.ok) {
        const data = await response.json();
        console.log('[InventoryView] Received data:', data);

        if (data.goals && Array.isArray(data.goals)) {
          // Convert database goals to component format
          const formattedGoals = data.goals.map((goal: any) => ({
            id: goal.id || goal._id,
            name: goal.content || goal.name,
            deadline: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }) : undefined,
            isExpanded: false
          }));
          console.log('[InventoryView] Formatted goals:', formattedGoals);
          setGoals(formattedGoals);

          // Important: Do NOT set goal level position or enter goal level automatically
          // User must press Tab to enter goal level
          setIsAtGoalLevel(false);
          setGoalLevelPosition(-1);
        }
      } else {
        console.error('[InventoryView] Failed to fetch goals:', response.status);
      }
    } catch (error) {
      console.error('[InventoryView] Error loading goals:', error);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // Load goals on mount
  useEffect(() => {
    loadGoals();
  }, [user]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[Navigation Debug] handleKeyDown called with key:', e.key);

      // CRITICAL DEBUG: Check task edit state immediately
      console.log('[CRITICAL DEBUG] Task Edit States:', {
        isEditingTask,
        editingTaskIndex,
        editTaskName,
        editTaskFieldFocus,
        isAtProjectTaskLevel,
        currentProjectForTasks,
        key: e.key,
        keyLength: e.key.length
      });

      // Log routine task edit state for debugging
      if (editingRoutineTaskIndex !== null) {
        console.log('[Routine Task Edit Check] Currently editing. Key:', e.key);
      }

      // Skip if in input field
      const target = e.target as HTMLElement;
      console.log('[Navigation Debug] Event target:', target.tagName, 'className:', target.className);
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        console.log('[Navigation Debug] Skipping - in input field');
        return;
      }

      // Check if any popup is open
      const isAnyPopupOpen = showGoalDeadlinePopup || showGoalSelectionPopup || showDeadlinePickerPopup || showDurationPickerPopup || showTaskDeadlinePickerPopup ||
          showEditTaskNamePopup || showEditTaskDurationPopup || showEditTaskDeadlinePopup ||
          showRoutineGoalSelectionPopup || showRoutineDateRangePopup || showRoutineDaySelectionPopup || showRoutineTimeAndDurationPopup || showRoutineTaskDurationPopup ||
          showAdminGoalSelectionPopup || showAdminDurationPopup || showAdminDeadlinePopup ||
          showEventGoalSelectionPopup || showEventRecurringPopup || showEventDaySelectionPopup || showEventDatePopup || showEventTimeRangePopup || showEventAddLinkPopup ||
          showEditEventGoalPopup || showEditEventRecurringPopup || showEditEventDaysPopup || showEditEventDatePopup || showEditEventTimePopup || showEditEventLinkPopup ||
          showEditAdminGoalPopup || showEditAdminDurationPopup || showEditAdminDeadlinePopup;

      console.log('[Navigation Debug] Key pressed:', e.key, {
        isAtGoalLevel,
        goalLevelPosition,
        isTypingGoal,
        showGoalDeadlinePopup,
        isAnyPopupOpen,
        inputStep,
        goalInput,
        isAtRoutineTaskLevel,
        editingRoutineTaskIndex,
        selectedRoutineTaskIndex
      });

      // ===== ROUTINE TASK EDIT MODE - MUST RUN FIRST TO BLOCK ALL NAVIGATION =====
      // ONLY check ref (synchronous) - state is async and causes navigation freeze after Escape
      if (editingRoutineTaskRef.current !== null && currentRoutineForTasks !== null) {
        console.log('[Task Edit Handler] In edit mode, blocking all other handlers. Key:', e.key, 'Ref:', editingRoutineTaskRef.current, 'State:', editingRoutineTaskIndex, 'fieldFocusRef:', editRoutineTaskFieldFocusRef.current, 'fieldFocusState:', editRoutineTaskFieldFocus);
        e.preventDefault(); // Block everything by default

        // Arrow Up - move to name field
        if (e.key === 'ArrowUp') {
          editRoutineTaskFieldFocusRef.current = 'name';
          setEditRoutineTaskFieldFocus('name');
          console.log('[Task Edit] Moved to name field');
          return;
        }

        // Arrow Down - move to duration field
        if (e.key === 'ArrowDown') {
          editRoutineTaskFieldFocusRef.current = 'duration';
          setEditRoutineTaskFieldFocus('duration');
          console.log('[Task Edit] Moved to duration field');
          return;
        }

        // Cmd/Ctrl + Enter - save changes (MUST be checked BEFORE plain Enter handlers)
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          console.log('[Task Edit] Cmd+Enter pressed, saving changes. Name:', editRoutineTaskName, 'Duration:', editRoutineTaskDuration);
          handleRoutineTaskEditSave();
          return;
        }

        // Enter on name field - move to duration field
        if (e.key === 'Enter' && editRoutineTaskFieldFocusRef.current === 'name') {
          console.log('[Task Edit] Enter on name field, moving to duration field');
          editRoutineTaskFieldFocusRef.current = 'duration';
          setEditRoutineTaskFieldFocus('duration');
          return;
        }

        // Enter on duration field - show duration popup (check ref for synchronous value)
        if (e.key === 'Enter' && editRoutineTaskFieldFocusRef.current === 'duration') {
          console.log('[Task Edit] Opening duration popup for field:', editRoutineTaskFieldFocusRef.current);
          setSelectedTaskForDuration({
            index: editingRoutineTaskRef.current,
            name: editRoutineTaskName
          });
          setShowRoutineTaskDurationPopup(true);
          return;
        }

        // Escape - cancel editing
        if (e.key === 'Escape') {
          console.log('[Task Edit] Cancelling edit');
          handleRoutineTaskEditCancel();
          return;
        }

        // Backspace - delete character from name field (check ref for synchronous value)
        if (e.key === 'Backspace' && editRoutineTaskFieldFocusRef.current === 'name') {
          setEditRoutineTaskName(prev => {
            const newName = prev.slice(0, -1);
            console.log('[Task Edit] Backspace on name. Old:', prev, 'New:', newName);
            return newName;
          });
          return;
        }

        // Single character - add to name field (check ref for synchronous value)
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && editRoutineTaskFieldFocusRef.current === 'name') {
          setEditRoutineTaskName(prev => {
            const newName = prev + e.key;
            console.log('[Task Edit] Added character to name. Key:', e.key, 'Old:', prev, 'New:', newName);
            return newName;
          });
          return;
        }

        // Block ALL other keys - don't let anything through
        console.log('[Task Edit] Blocked key:', e.key);
        return;
      }

      // Handle edit mode first (before popup check, since editing doesn't use popups)
      if (isEditingGoal && editingGoalIndex !== null) {
        if (e.key === 'Tab') {
          e.preventDefault();
          // Toggle between name and deadline fields
          setEditFieldFocus(editFieldFocus === 'name' ? 'deadline' : 'name');
          console.log('[Edit] Switched to field:', editFieldFocus === 'name' ? 'deadline' : 'name');
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (editFieldFocus === 'name' && editGoalName.trim()) {
            // Move to deadline field on Enter from name field
            setEditFieldFocus('deadline');
          } else if (editFieldFocus === 'deadline') {
            // Save changes on Enter from deadline field
            const updatedGoals = [...goals];
            const updatedGoal = {
              ...updatedGoals[editingGoalIndex],
              name: editGoalName.trim() || updatedGoals[editingGoalIndex].name,
              deadline: editGoalDeadline
            };
            updatedGoals[editingGoalIndex] = updatedGoal;
            setGoals(updatedGoals);

            // Save to database
            const saveEditedGoal = async () => {
              try {
                const response = await fetch('/api/you/goals', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: updatedGoal.id,
                    content: updatedGoal.name,
                    deadline: updatedGoal.deadline ? new Date(updatedGoal.deadline) : undefined,
                    order: editingGoalIndex
                  })
                });

                if (response.ok) {
                  console.log('[InventoryView] Goal updated in database');
                } else {
                  console.error('[InventoryView] Failed to update goal:', await response.text());
                }
              } catch (error) {
                console.error('[InventoryView] Error updating goal:', error);
              }
            };
            saveEditedGoal();

            setIsEditingGoal(false);
            setEditingGoalIndex(null);
            setEditGoalName('');
            setEditGoalDeadline('');
            console.log('[Edit] Saved goal changes');
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Cancel editing
          setIsEditingGoal(false);
          setEditingGoalIndex(null);
          setEditGoalName('');
          setEditGoalDeadline('');
          console.log('[Edit] Cancelled editing');
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (editFieldFocus === 'name') {
            setEditGoalName(editGoalName.slice(0, -1));
          } else {
            setEditGoalDeadline(editGoalDeadline.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (editFieldFocus === 'name') {
            setEditGoalName(editGoalName + e.key);
          } else {
            // For deadline, only allow date-related characters
            if (/[\d\/\-\.]/.test(e.key)) {
              let newInput = editGoalDeadline + e.key;

              // Auto-insert slashes for date format
              if (editGoalDeadline.length === 2 && /\d/.test(e.key) && !editGoalDeadline.includes('/')) {
                newInput = editGoalDeadline + '/' + e.key;
              } else if (editGoalDeadline.length === 5 && /\d/.test(e.key) && editGoalDeadline.split('/').length === 2) {
                newInput = editGoalDeadline + '/' + e.key;
              }

              // Limit to 10 characters (MM/DD/YYYY)
              if (newInput.replace(/[\/\-\.]/g, '').length <= 8) {
                setEditGoalDeadline(newInput);
              }
            }
          }
          return;
        }
        return; // Block other keys during edit mode
      }

      // If a popup is open, block ALL navigation in the main view
      if (isAnyPopupOpen) {
        console.log('[Navigation Debug] Popup is open, blocking all main navigation');
        return; // Let the popup handle all keys
      }

      // Handle typing for goals - but not arrow keys!
      if (isTypingGoal && (goalLevelPosition === -1 || goalLevelPosition === -2 || goalLevelPosition < -2) &&
          e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        console.log('[Goal Typing] Key pressed:', e.key, 'inputStep:', inputStep, 'goalInput:', goalInput);
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('[Goal Typing] Enter pressed, inputStep:', inputStep, 'goalInput:', goalInput);

          // If inputStep is null but we have text, initialize it to 'name'
          if (!inputStep && goalInput.trim()) {
            setInputStep('name');
          }

          if (inputStep === 'name' || (!inputStep && goalInput.trim())) {
            // First step: name input
            if (goalInput.trim()) {
              // Store the name and move to deadline step
              setTempGoalName(goalInput.trim());
              setGoalInput('');
              setInputStep('deadline'); // Show the progression
              // Show popup after a brief moment to show the progression
              setTimeout(() => {
                setShowGoalDeadlinePopup(true);
              }, 100);
              console.log('[Input] Moving to deadline step, showing popup');
            } else {
              // Empty name, exit input mode
              setGoalInput('');
              setInputStep(null);
              setTempGoalName('');
              setTempGoalDeadline('');
              setIsTypingGoal(false);
              if (goalLevelPosition === -2) {
                // Was at top, move to first goal or bottom input
                if (goals.length > 0) {
                  setGoalLevelPosition(0);
                } else {
                  setGoalLevelPosition(-1);
                }
              }
              console.log('[Input] Cancelled - empty name');
            }
          } else if (inputStep === 'deadline') {
            // Second step: deadline input - validate date format if provided
            const dateInput = goalInput.trim();
            let formattedDate = undefined;

            if (dateInput) {
              // Try to parse the date
              const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
              const match = dateInput.match(dateRegex);
              if (match) {
                const [_, first, second, year] = match;
                let monthNum = parseInt(first);
                let dayNum = parseInt(second);

                // Validate month and day
                if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
                  const date = new Date(parseInt(year), monthNum - 1, dayNum);
                  formattedDate = date.toISOString();
                }
              }
            }

            // Create goal even if date is invalid (just without deadline)
            const tempId = `temp-${Date.now()}`;
            const newGoal: Goal = {
              id: tempId,
              name: tempGoalName,
              isExpanded: false,
              deadline: formattedDate
            };

            console.log('[DEBUG] Creating goal:', {
              name: tempGoalName,
              deadline: formattedDate,
              position: goalLevelPosition
            });

            // Insert at appropriate position
            let insertIndex = goals.length;
            if (goalLevelPosition === -2) {
              insertIndex = 0; // Top position
            } else if (goalLevelPosition < -2) {
              // After a specific goal: -3 = after goal 0, -4 = after goal 1, etc.
              insertIndex = Math.abs(goalLevelPosition) - 2;
            }

            const updatedGoals = [...goals];
            updatedGoals.splice(insertIndex, 0, newGoal);
            setGoals(updatedGoals);

            // Save to database
            const saveGoal = async () => {
              try {
                const response = await fetch('/api/you/goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: tempGoalName,
                    deadline: formattedDate ? new Date(formattedDate) : undefined,
                    order: insertIndex
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  console.log('[InventoryView] Goal saved to database:', data);

                  // Update the goal with the real ID
                  if (data.goal && data.goal._id) {
                    const finalGoals = [...updatedGoals];
                    const goalIndex = finalGoals.findIndex(g => g.id === tempId);
                    if (goalIndex !== -1) {
                      finalGoals[goalIndex].id = data.goal._id;
                      setGoals(finalGoals);
                    }
                  }
                } else {
                  console.error('[InventoryView] Failed to save goal:', await response.text());
                }
              } catch (error) {
                console.error('[InventoryView] Error saving goal:', error);
              }
            };
            saveGoal();

            // Reset for next goal
            setGoalInput('');
            setInputStep('name');
            setTempGoalName('');
            setTempGoalDeadline('');

            // Update position based on where we were
            if (goalLevelPosition === -1) {
              // At bottom position, stay typing for convenience
              setIsTypingGoal(true);
            } else {
              // Was at top or middle position, stop typing
              setIsTypingGoal(false);
              setGoalLevelPosition(insertIndex);
            }

            console.log('[Input] Goal created successfully');
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setGoalInput('');
          setInputStep(null);
          setTempGoalName('');
          setTempGoalDeadline('');
          setIsTypingGoal(false);
          // Return to appropriate position
          if (goalLevelPosition === -2) {
            if (goals.length > 0) {
              setGoalLevelPosition(0);
            } else {
              setGoalLevelPosition(-1);
            }
          } else if (goalLevelPosition < -2) {
            // Was inserting after a goal, return to that goal
            setGoalLevelPosition(Math.abs(goalLevelPosition) - 3);
          }
          console.log('[Input] Cancelled goal input');
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (goalInput.length > 0) {
            setGoalInput(goalInput.slice(0, -1));
          } else {
            // Exit typing mode if input is empty
            setIsTypingGoal(false);
            setInputStep(null);
            setTempGoalName('');
            setTempGoalDeadline('');
            if (goalLevelPosition === -2) {
              if (goals.length > 0) {
                setGoalLevelPosition(0);
              } else {
                setGoalLevelPosition(-1);
              }
            } else if (goalLevelPosition < -2) {
              setGoalLevelPosition(Math.abs(goalLevelPosition) - 3);
            }
          }
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          // For deadline input, only allow numbers and date separators
          if (inputStep === 'deadline') {
            if (/[\d\/\-\.]/.test(e.key)) {
              let newInput = goalInput + e.key;
              // Auto-add slashes for date format
              if (goalInput.length === 2 && /\d/.test(e.key) && !goalInput.includes('/')) {
                newInput = goalInput + '/' + e.key;
              } else if (goalInput.length === 5 && /\d/.test(e.key) && goalInput.split('/').length === 2) {
                newInput = goalInput + '/' + e.key;
              }
              // Limit to 10 characters (MM/DD/YYYY)
              if (newInput.replace(/[\/\-\.]/g, '').length <= 8) {
                setGoalInput(newInput);
              }
            }
          } else {
            // For name input, accept any character
            setGoalInput(goalInput + e.key);
          }
        }
        return;
      }

      // Handle typing in sections
      if (isTypingInSection && activeSection) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (sectionInput.trim()) {
            const newItem: Item = {
              id: `item-${Date.now()}`,
              name: sectionInput.trim(),
              completed: false
            };

            // Add to appropriate section
            switch (activeSection) {
              case 'routines':
                setRoutines([...routines, newItem]);
                break;
              case 'admin':
                setAdminTasks([...adminTasks, newItem]);
                break;
            }

            setSectionInput('');
            setIsTypingInSection(false);
            setActiveSection(null);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSectionInput('');
          setIsTypingInSection(false);
          setActiveSection(null);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (sectionInput.length > 0) {
            setSectionInput(sectionInput.slice(0, -1));
          } else {
            setIsTypingInSection(false);
            setActiveSection(null);
          }
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setSectionInput(prev => prev + e.key);
        }
        return;
      }


      // Handle Cmd+D, Cmd+Backspace, or Cmd+Delete to delete a goal
      if (((e.key === 'd' || e.key === 'D' || e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) &&
          isAtGoalLevel && goalLevelPosition >= 0 && !isTypingGoal && !isEditingGoal) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling up
        console.log('[Delete] Attempting to delete goal at position:', goalLevelPosition);
        const goalToDelete = goals[goalLevelPosition];
        if (goalToDelete) {
          // Remove the goal from the array
          const updatedGoals = goals.filter((_, index) => index !== goalLevelPosition);
          setGoals(updatedGoals);

          // Delete from database
          const deleteGoalFromDatabase = async () => {
            try {
              const response = await fetch(`/api/you/goals?id=${goalToDelete.id}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                console.log('[InventoryView] Goal deleted from database');
              } else {
                console.error('[InventoryView] Failed to delete goal:', await response.text());
                // Optionally restore the goal if deletion failed
              }
            } catch (error) {
              console.error('[InventoryView] Error deleting goal:', error);
            }
          };
          deleteGoalFromDatabase();

          // Adjust position after deletion
          if (updatedGoals.length === 0) {
            // No goals left, go to input position
            setGoalLevelPosition(-1);
            setIsTypingGoal(true);
            setGoalInput('');
            setInputStep('name');
          } else if (goalLevelPosition >= updatedGoals.length) {
            // Was at the last goal, move to new last goal
            setGoalLevelPosition(updatedGoals.length - 1);
          }
          // Otherwise stay at same index (next goal moves up)

          console.log('[Delete] Deleted goal at position:', goalLevelPosition);
        }
        return;
      }

      // Handle 'e' key to edit an existing goal
      if (e.key === 'e' && isAtGoalLevel && goalLevelPosition >= 0 && !isTypingGoal && !isEditingGoal && grabbedGoalIndex === null) {
        e.preventDefault();
        const goalToEdit = goals[goalLevelPosition];
        if (goalToEdit) {
          setIsEditingGoal(true);
          setEditingGoalIndex(goalLevelPosition);
          setEditGoalName(goalToEdit.name);
          setEditGoalDeadline(goalToEdit.deadline || '');
          setEditFieldFocus('name');
          console.log('[Edit] Entering edit mode for goal:', goalLevelPosition);
        }
        return;
      }

      // Handle navigation and saving in edit mode
      // Handle 'g' key or Enter to grab/release a goal
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedGoalIndex !== null)) && isAtGoalLevel && goalLevelPosition >= 0 && !isTypingGoal && !isEditingGoal) {
        e.preventDefault();

        if (grabbedGoalIndex === null && e.key === 'g') {
          // Enter grab mode
          console.log('[Grab] Entering grab mode for goal at index:', goalLevelPosition);
          setGrabbedGoalIndex(goalLevelPosition);
          setGrabbedGoalOriginalIndex(goalLevelPosition); // Save original position
        } else if (grabbedGoalIndex !== null) {
          // Release grab mode (with 'g' or Enter)
          console.log('[Grab] Releasing grabbed goal at index:', grabbedGoalIndex);

          // Save new order to database if position changed
          if (grabbedGoalOriginalIndex !== null && grabbedGoalOriginalIndex !== grabbedGoalIndex) {
            const reorderGoals = async () => {
              try {
                // Send the updated order to the backend
                const response = await fetch('/api/you/goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    goals: goals.map((goal, index) => ({
                      id: goal.id,
                      order: index
                    }))
                  })
                });

                if (response.ok) {
                  console.log('[InventoryView] Goal order saved to database');
                } else {
                  console.error('[InventoryView] Failed to save goal order:', await response.text());
                  // Optionally revert the order if save failed
                }
              } catch (error) {
                console.error('[InventoryView] Error saving goal order:', error);
              }
            };
            reorderGoals();
          }

          setGrabbedGoalIndex(null);
          setGrabbedGoalOriginalIndex(null);
        }
        return;
      }

      // PROJECT HANDLERS - Similar to goal handlers
      // Handle Cmd+D to delete a project
      if (((e.key === 'd' || e.key === 'D' || e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) &&
          isAtProjectLevel && !isAtProjectTaskLevel && projectLevelPosition >= 0 && !isTypingProject && !isEditingProject) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Delete] Attempting to delete project at position:', projectLevelPosition);
        const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
        const projectToDelete = filteredProjects[projectLevelPosition];
        if (projectToDelete) {
          // Remove the project from the full array by ID
          const projectId = projectToDelete.id || projectToDelete._id;
          const updatedProjects = projects.filter(p => (p.id || p._id) !== projectId);
          setProjects(updatedProjects);

          // Delete from database
          const deleteProjectFromDatabase = async () => {
            try {
              const response = await fetch(`/api/projects/${projectToDelete.id}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                console.log('[Project] Project deleted from database');
              } else {
                console.error('[Project] Failed to delete project:', await response.text());
              }
            } catch (error) {
              console.error('[Project] Error deleting project:', error);
            }
          };
          deleteProjectFromDatabase();

          // Adjust position after deletion
          if (updatedProjects.length === 0) {
            setProjectLevelPosition(-1);
            setIsTypingProject(true);
            setProjectInput('');
            setProjectInputStep('name');
          } else if (projectLevelPosition >= updatedProjects.length) {
            setProjectLevelPosition(updatedProjects.length - 1);
          }
          console.log('[Delete] Deleted project at position:', projectLevelPosition);
        }
        return;
      }

      // Handle Cmd+Enter to toggle project completion
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) &&
          isAtProjectLevel && !isAtProjectTaskLevel && projectLevelPosition >= 0 && !isTypingProject && !isEditingProject) {
        e.preventDefault();
        e.stopPropagation();
        const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
        const projectToToggle = filteredProjects[projectLevelPosition];
        if (projectToToggle) {
          const projectId = projectToToggle.id || projectToToggle._id;
          const currentCompletedState = projectToToggle.completed || projectToToggle.metadata?.completed || false;
          const newCompletedState = !currentCompletedState;

          // Update local state
          const updatedProjects = projects.map(p =>
            (p.id === projectId || p._id === projectId)
              ? { ...p, completed: newCompletedState, metadata: { ...p.metadata, completed: newCompletedState } }
              : p
          );
          setProjects(updatedProjects);

          // Persist to database
          if (projectId && !projectId.startsWith('temp-')) {
            fetch(`/api/you/project/${projectId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: newCompletedState })
            }).catch(error => console.error('[Project] Error toggling completion:', error));
          }

          console.log('[Project] Toggled completion for project:', projectId, 'to:', newCompletedState);
        }
        return;
      }

      // Handle 'e' key to edit an existing project
      if (e.key === 'e' && isAtProjectLevel && !isAtProjectTaskLevel && projectLevelPosition >= 0 && !isTypingProject && !isEditingProject && grabbedProjectIndex === null) {
        e.preventDefault();
        const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
        const projectToEdit = filteredProjects[projectLevelPosition];
        if (projectToEdit) {
          // Find the actual index in the full projects array
          const actualProjectIndex = projects.findIndex(p => (p.id || p._id) === (projectToEdit.id || projectToEdit._id));
          setIsEditingProject(true);
          setEditingProjectIndex(actualProjectIndex); // Store the full array index
          setEditProjectName(projectToEdit.content || projectToEdit.name || '');
          setEditProjectFieldFocus('name'); // Start at name field

          // Format the date for editing if it exists
          const dateStr = projectToEdit.metadata?.dueDate || projectToEdit.deadline || '';
          let formattedDate = '';
          if (dateStr) {
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                formattedDate = `${month}/${day}/${year}`;
              } else {
                formattedDate = dateStr;
              }
            } catch {
              formattedDate = dateStr;
            }
          }
          setEditProjectDeadline(formattedDate);

          setEditProjectGoalId(projectToEdit.metadata?.goalId || projectToEdit.goalId || null);
          setEditProjectFieldFocus('name');
          console.log('[Edit] Entering edit mode for project:', projectLevelPosition);
          console.log('[Edit] Project goalId:', projectToEdit.metadata?.goalId || projectToEdit.goalId);
          console.log('[Edit] Project deadline:', formattedDate);
        }
        return;
      }

      // Handle navigation and saving in project edit mode
      if (isEditingProject && editingProjectIndex !== null) {
        // Cmd/Ctrl+Enter to save changes
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          console.log('[Edit Project] Saving changes');

          // Save the updated project
          const updatedProjects = [...projects];
          const updatedProject = {
            ...updatedProjects[editingProjectIndex],
            name: editProjectName.trim() || updatedProjects[editingProjectIndex].name,
            content: editProjectName.trim() || updatedProjects[editingProjectIndex].content,
            deadline: editProjectDeadline || updatedProjects[editingProjectIndex].deadline,
            goalId: editProjectGoalId,
            metadata: {
              ...updatedProjects[editingProjectIndex].metadata,
              dueDate: editProjectDeadline || updatedProjects[editingProjectIndex].metadata?.dueDate,
              goalId: editProjectGoalId || undefined
            }
          };
          updatedProjects[editingProjectIndex] = updatedProject;
          setProjects(updatedProjects);

          // Also update parent state if setter is available
          if (setProjectsData) {
            setProjectsData(updatedProjects);
          }

          // Save to database
          const saveEditedProject = async () => {
            try {
              const projectId = updatedProject.id || updatedProject._id;
              if (!projectId || projectId.startsWith('temp-')) {
                console.log('[Project] Skipping database save for temp project');
                return;
              }

              const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: updatedProject.name || updatedProject.content,
                  dueDate: editProjectDeadline || null,
                  goalId: editProjectGoalId || null
                })
              });

              if (response.ok) {
                console.log('[InventoryView] Project updated in database');
              } else {
                console.error('[InventoryView] Failed to update project:', await response.text());
              }
            } catch (error) {
              console.error('[InventoryView] Error updating project:', error);
            }
          };
          saveEditedProject();

          // Exit edit mode
          setIsEditingProject(false);
          setEditingProjectIndex(null);
          setEditProjectName('');
          setEditProjectDeadline('');
          setEditProjectGoalId(null);
          setEditProjectFieldFocus('name');
          return;
        }

        // Tab to navigate between fields
        if (e.key === 'Tab') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'deadline'> = ['name', 'goal', 'deadline'];
          const currentIndex = fieldOrder.indexOf(editProjectFieldFocus);
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditProjectFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Project] Tab to field:', fieldOrder[nextIndex]);
          return;
        }

        // Up/Down arrows to navigate between fields
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'deadline'> = ['name', 'goal', 'deadline'];
          const currentIndex = fieldOrder.indexOf(editProjectFieldFocus);
          const nextIndex = e.key === 'ArrowUp'
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditProjectFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Project] Arrow to field:', fieldOrder[nextIndex]);
          return;
        }

        // Enter on a field to open its popup for editing
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editProjectFieldFocus === 'goal') {
            setShowEditGoalSelectionPopup(true);
            console.log('[Edit Project] Opening goal selection popup');
          } else if (editProjectFieldFocus === 'deadline') {
            setShowEditDeadlinePickerPopup(true);
            console.log('[Edit Project] Opening deadline popup');
          }
          return;
        }

        // Escape to cancel editing
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditingProject(false);
          setEditingProjectIndex(null);
          setEditProjectName('');
          setEditProjectDeadline('');
          setEditProjectGoalId(null);
          setEditProjectFieldFocus('name');
          setShowEditGoalSelectionPopup(false);
          setShowEditDeadlinePickerPopup(false);
          console.log('[Edit Project] Cancelled editing');
          return;
        }

        // Handle text input for name field
        if (editProjectFieldFocus === 'name') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditProjectName(editProjectName.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditProjectName(editProjectName + e.key);
            return;
          }
        }

        return;
      }

      // Handle 'e' key to edit a task when at project task level
      if (e.key === 'e' && isAtProjectTaskLevel && selectedTaskIndex >= 0 && !isTypingTask && !isEditingTask && currentProjectForTasks !== null) {
        console.log('[Task Edit] Pressing e to edit task - selectedTaskIndex:', selectedTaskIndex, 'currentProjectForTasks:', currentProjectForTasks);
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];
        if (currentProject && currentProject.tasks && currentProject.tasks[selectedTaskIndex]) {
          const taskToEdit = currentProject.tasks[selectedTaskIndex];
          console.log('[Task Edit Init] Task to edit:', taskToEdit);

          let projectIndex = currentProjectForTasks;
          if (projectIndex === null && projectLevelPosition >= 0) {
            const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
            const currentProj = filteredProjects[projectLevelPosition];
            if (currentProj) {
              projectIndex = projects.findIndex(p => (p.id || p._id) === (currentProj.id || currentProj._id));
            } else {
              projectIndex = projectLevelPosition;
            }
          }
          setEditingTaskData({
            taskIndex: selectedTaskIndex,
            projectIndex: projectIndex!,
            originalTask: taskToEdit
          });

          setIsEditingTask(true);
          setEditingTaskIndex(selectedTaskIndex);
          setEditTaskName(taskToEdit.content || taskToEdit.name || taskToEdit.title || '');
          setEditTaskDuration(String(taskToEdit.duration || 30));

          // Format deadline if exists
          let formattedDeadline = '';
          if (taskToEdit.dueDate || taskToEdit.deadline) {
            try {
              const date = new Date(taskToEdit.dueDate || taskToEdit.deadline);
              if (!isNaN(date.getTime())) {
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const year = date.getFullYear();
                formattedDeadline = `${month}/${day}/${year}`;
              }
            } catch (e) {
              // Keep empty if can't parse
            }
          }
          setEditTaskDeadline(formattedDeadline);
          setEditTaskFieldFocus('name');
          console.log('[Task Edit] Entering inline edit mode for task with all fields:', {
            name: taskToEdit.content || taskToEdit.name,
            duration: taskToEdit.duration,
            deadline: formattedDeadline
          });
        }
        return;
      }

      // Handle 'g' key or Enter to grab/release a project
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedProjectIndex !== null)) && isAtProjectLevel && !isAtProjectTaskLevel && projectLevelPosition >= 0 && !isTypingProject && !isEditingProject) {
        e.preventDefault();

        if (grabbedProjectIndex === null && e.key === 'g') {
          console.log('[Grab] Entering grab mode for project at index:', projectLevelPosition);
          setGrabbedProjectIndex(projectLevelPosition);
          setGrabbedProjectOriginalIndex(projectLevelPosition);
        } else if (grabbedProjectIndex !== null) {
          console.log('[Grab] Releasing grabbed project at index:', grabbedProjectIndex);
          setGrabbedProjectIndex(null);
          setGrabbedProjectOriginalIndex(null);
        }
        return;
      }

      // Handle arrow navigation for project tasks
      if (isAtProjectTaskLevel && currentProjectForTasks !== null && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isTypingTask) {
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];

        // If in grab mode, move the task
        if (grabbedTaskIndex !== null && currentProject && currentProject.tasks) {
          const tasks = currentProject.tasks;

          if (e.key === 'ArrowDown' && grabbedTaskIndex < tasks.length - 1) {
            const newIndex = grabbedTaskIndex + 1;
            console.log('[Task Grab] Moving task down from', grabbedTaskIndex, 'to', newIndex);

            // Swap tasks
            const updatedProjects = [...projects];
            const projectTasks = [...updatedProjects[currentProjectForTasks].tasks];
            [projectTasks[grabbedTaskIndex], projectTasks[newIndex]] = [projectTasks[newIndex], projectTasks[grabbedTaskIndex]];
            updatedProjects[currentProjectForTasks].tasks = projectTasks;
            setProjects(updatedProjects);

            setGrabbedTaskIndex(newIndex);
            setSelectedTaskIndex(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedTaskIndex > 0) {
            const newIndex = grabbedTaskIndex - 1;
            console.log('[Task Grab] Moving task up from', grabbedTaskIndex, 'to', newIndex);

            // Swap tasks
            const updatedProjects = [...projects];
            const projectTasks = [...updatedProjects[currentProjectForTasks].tasks];
            [projectTasks[grabbedTaskIndex], projectTasks[newIndex]] = [projectTasks[newIndex], projectTasks[grabbedTaskIndex]];
            updatedProjects[currentProjectForTasks].tasks = projectTasks;
            setProjects(updatedProjects);

            setGrabbedTaskIndex(newIndex);
            setSelectedTaskIndex(newIndex);
            return;
          }
          return;
        }

        // Normal navigation when not in grab mode
        if (currentProject && currentProject.tasks) {
          const taskCount = currentProject.tasks.length;

          if (e.key === 'ArrowDown') {
            if (selectedTaskIndex < taskCount - 1) {
              // Move to next task
              setSelectedTaskIndex(selectedTaskIndex + 1);
              setTaskInputPosition(-1); // Reset input position
              console.log('[Task Navigation] Moved down to task:', selectedTaskIndex + 1);
            } else if (!grabbedTaskIndex) {
              // At last task, show input at bottom (only if not grabbing)
              setSelectedTaskIndex(-1);
              setTaskInputPosition(-1);
              setIsTypingTask(true);
              setTaskInput('');
              console.log('[Task Navigation] At bottom, showing input');
            }
          } else if (e.key === 'ArrowUp') {
            if (selectedTaskIndex === -1) {
              // From bottom input, go to last task
              setSelectedTaskIndex(taskCount - 1);
              setIsTypingTask(false);
              setTaskInput('');
              setTaskInputPosition(-1);
              console.log('[Task Navigation] From bottom input to last task');
            } else if (selectedTaskIndex > 0) {
              // Move to previous task
              setSelectedTaskIndex(selectedTaskIndex - 1);
              setTaskInputPosition(-1);
              console.log('[Task Navigation] Moved up to task:', selectedTaskIndex - 1);
            } else if (selectedTaskIndex === 0 && !grabbedTaskIndex) {
              // At first task, show input at top (only if not grabbing)
              setSelectedTaskIndex(-2);
              setTaskInputPosition(-2);
              setIsTypingTask(true);
              setTaskInput('');
              console.log('[Task Navigation] At top, showing input');
            } else if (selectedTaskIndex === -2) {
              // From top input, wrap to bottom
              setSelectedTaskIndex(-1);
              setTaskInputPosition(-1);
              setIsTypingTask(true);
              setTaskInput('');
              console.log('[Task Navigation] Wrapped from top to bottom input');
            }
          }
        } else {
          // No tasks, just show input
          if (!isTypingTask) {
            setSelectedTaskIndex(-1);
            setTaskInputPosition(-1);
            setIsTypingTask(true);
            setTaskInput('');
          }
        }
        return;
      }

      // Handle arrow navigation for routine tasks
      if (isAtRoutineTaskLevel && currentRoutineForTasks !== null && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        console.log('[Routine Task Navigation] Arrow key pressed. Checking edit mode...', {
          editingRoutineTaskRefCurrent: editingRoutineTaskRef.current,
          editingRoutineTaskIndex,
          isAtRoutineTaskLevel,
          currentRoutineForTasks,
          selectedRoutineTaskIndex
        });

        // IMPORTANT: Block navigation if in edit mode (ONLY check ref - it's synchronous, state is async)
        if (editingRoutineTaskRef.current !== null) {
          console.log('[Routine Task Navigation] BLOCKED - edit mode active. Ref:', editingRoutineTaskRef.current);
          return;
        }

        console.log('[Routine Task Navigation] Edit mode check passed, proceeding with navigation');
        e.preventDefault();
        const currentRoutine = routines[currentRoutineForTasks];

        // If typing, clear the input when navigating away
        if (isTypingRoutineTask) {
          setIsTypingRoutineTask(false);
          setRoutineTaskInput('');
          console.log('[Routine Task] Cleared input due to navigation');
        }

        // If in grab mode, move the task
        if (grabbedRoutineTaskIndex !== null && currentRoutine && currentRoutine.tasks) {
          const tasks = currentRoutine.tasks;
          if (e.key === 'ArrowDown' && grabbedRoutineTaskIndex < tasks.length - 1) {
            const newIndex = grabbedRoutineTaskIndex + 1;
            console.log('[Routine Task Grab] Moving task down from', grabbedRoutineTaskIndex, 'to', newIndex);
            // Swap tasks
            const updatedRoutines = [...routines];
            const routineTasks = [...(updatedRoutines[currentRoutineForTasks].tasks || [])];
            [routineTasks[grabbedRoutineTaskIndex], routineTasks[newIndex]] = [routineTasks[newIndex], routineTasks[grabbedRoutineTaskIndex]];
            updatedRoutines[currentRoutineForTasks].tasks = routineTasks;
            setRoutines(updatedRoutines);
            setGrabbedRoutineTaskIndex(newIndex);
            setSelectedRoutineTaskIndex(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedRoutineTaskIndex > 0) {
            const newIndex = grabbedRoutineTaskIndex - 1;
            console.log('[Routine Task Grab] Moving task up from', grabbedRoutineTaskIndex, 'to', newIndex);
            // Swap tasks
            const updatedRoutines = [...routines];
            const routineTasks = [...(updatedRoutines[currentRoutineForTasks].tasks || [])];
            [routineTasks[grabbedRoutineTaskIndex], routineTasks[newIndex]] = [routineTasks[newIndex], routineTasks[grabbedRoutineTaskIndex]];
            updatedRoutines[currentRoutineForTasks].tasks = routineTasks;
            setRoutines(updatedRoutines);
            setGrabbedRoutineTaskIndex(newIndex);
            setSelectedRoutineTaskIndex(newIndex);
            return;
          }
          return;
        }

        // Normal navigation when not in grab mode
        if (currentRoutine && currentRoutine.tasks) {
          const taskCount = currentRoutine.tasks.length;

          if (e.key === 'ArrowDown') {
            // If typing and showing input inline, move to the next task
            if (isTypingRoutineTask && routineTaskInputPosition >= 0) {
              // From inline input, go to next task
              if (routineTaskInputPosition < taskCount - 1) {
                setSelectedRoutineTaskIndex(routineTaskInputPosition + 1);
                setIsTypingRoutineTask(false);
                setRoutineTaskInput('');
                setRoutineTaskInputPosition(-1);
                console.log('[Routine Task Navigation] From inline input to next task');
              } else {
                // At last position, go to bottom input
                setSelectedRoutineTaskIndex(-1);
                setRoutineTaskInputPosition(-1);
                setIsTypingRoutineTask(true);
                setRoutineTaskInput('');
                console.log('[Routine Task Navigation] From inline input to bottom');
              }
            } else if (selectedRoutineTaskIndex < taskCount - 1) {
              // Move to next task
              setSelectedRoutineTaskIndex(selectedRoutineTaskIndex + 1);
              setRoutineTaskInputPosition(-1); // Reset input position
              console.log('[Routine Task Navigation] Moved down to task:', selectedRoutineTaskIndex + 1);
            } else if (!grabbedRoutineTaskIndex) {
              // At last task, show input at bottom (only if not grabbing)
              setSelectedRoutineTaskIndex(-1);
              setRoutineTaskInputPosition(-1);
              setIsTypingRoutineTask(true);
              setRoutineTaskInput('');
              console.log('[Routine Task Navigation] At bottom, showing input');
            }
          } else if (e.key === 'ArrowUp') {
            // If typing and showing input inline, move to the current task or previous
            if (isTypingRoutineTask && routineTaskInputPosition >= 0) {
              // From inline input, go to the task at this position
              setSelectedRoutineTaskIndex(routineTaskInputPosition);
              setIsTypingRoutineTask(false);
              setRoutineTaskInput('');
              setRoutineTaskInputPosition(-1);
              console.log('[Routine Task Navigation] From inline input to task at position');
            } else if (selectedRoutineTaskIndex === -1) {
              // From bottom input, go to last task
              setSelectedRoutineTaskIndex(taskCount - 1);
              setIsTypingRoutineTask(false);
              setRoutineTaskInput('');
              setRoutineTaskInputPosition(-1);
              console.log('[Routine Task Navigation] From bottom input to last task index:', taskCount - 1);
            } else if (selectedRoutineTaskIndex > 0) {
              // Move to previous task
              setSelectedRoutineTaskIndex(selectedRoutineTaskIndex - 1);
              setRoutineTaskInputPosition(-1);
              console.log('[Routine Task Navigation] Moved up to task:', selectedRoutineTaskIndex - 1);
            } else if (selectedRoutineTaskIndex === 0 && !grabbedRoutineTaskIndex) {
              // At first task, show input at top (only if not grabbing)
              setSelectedRoutineTaskIndex(-2);
              setRoutineTaskInputPosition(-2);
              setIsTypingRoutineTask(true);
              setRoutineTaskInput('');
              console.log('[Routine Task Navigation] At top, showing input');
            } else if (selectedRoutineTaskIndex === -2) {
              // From top input, wrap to bottom
              setSelectedRoutineTaskIndex(-1);
              setRoutineTaskInputPosition(-1);
              setIsTypingRoutineTask(true);
              setRoutineTaskInput('');
              console.log('[Routine Task Navigation] Wrapped from top to bottom input');
            }
          }
        } else {
          // No tasks, just show input
          if (!isTypingRoutineTask) {
            setSelectedRoutineTaskIndex(-1);
            setRoutineTaskInputPosition(-1);
            setIsTypingRoutineTask(true);
            setRoutineTaskInput('');
          }
        }
        return;
      }

      // Handle left/right arrows to toggle project view (active/completed) when inside projects
      if (isAtProjectLevel && !isAtProjectTaskLevel && !isEditingProject && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const newMode = projectViewMode === 'active' ? 'completed' : 'active';
        setProjectViewMode(newMode);
        // Reset to appropriate position in new view
        const newFilteredProjects = projects.filter(p => newMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
        if (newFilteredProjects.length > 0) {
          setProjectLevelPosition(0);
        } else {
          setProjectLevelPosition(-1);
        }
        // Always exit typing mode when toggling views
        setIsTypingProject(false);
        setProjectInput('');
        setProjectInputStep(null);
        console.log('[View Toggle] Switched to', newMode, 'view with', newFilteredProjects.length, 'projects');
        return;
      }

      // Handle arrow navigation for projects
      if (isAtProjectLevel && !isAtProjectTaskLevel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();

        // Filter projects based on current view mode
        const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));

        // If in grab mode, move the project
        if (grabbedProjectIndex !== null) {
          if (e.key === 'ArrowDown' && grabbedProjectIndex < filteredProjects.length - 1) {
            const newIndex = grabbedProjectIndex + 1;
            console.log('[Grab] Moving project down from', grabbedProjectIndex, 'to', newIndex);

            // Get the two projects we're swapping from the filtered array
            const project1 = filteredProjects[grabbedProjectIndex];
            const project2 = filteredProjects[newIndex];

            // Find their actual indices in the full projects array
            const fullIndex1 = projects.findIndex(p => (p.id || p._id) === (project1.id || project1._id));
            const fullIndex2 = projects.findIndex(p => (p.id || p._id) === (project2.id || project2._id));

            // Swap them in the full array
            const updatedProjects = [...projects];
            [updatedProjects[fullIndex1], updatedProjects[fullIndex2]] = [updatedProjects[fullIndex2], updatedProjects[fullIndex1]];
            setProjects(updatedProjects);
            setGrabbedProjectIndex(newIndex);
            setProjectLevelPosition(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedProjectIndex > 0) {
            const newIndex = grabbedProjectIndex - 1;
            console.log('[Grab] Moving project up from', grabbedProjectIndex, 'to', newIndex);

            // Get the two projects we're swapping from the filtered array
            const project1 = filteredProjects[grabbedProjectIndex];
            const project2 = filteredProjects[newIndex];

            // Find their actual indices in the full projects array
            const fullIndex1 = projects.findIndex(p => (p.id || p._id) === (project1.id || project1._id));
            const fullIndex2 = projects.findIndex(p => (p.id || p._id) === (project2.id || project2._id));

            // Swap them in the full array
            const updatedProjects = [...projects];
            [updatedProjects[fullIndex1], updatedProjects[fullIndex2]] = [updatedProjects[fullIndex2], updatedProjects[fullIndex1]];
            setProjects(updatedProjects);
            setGrabbedProjectIndex(newIndex);
            setProjectLevelPosition(newIndex);
            return;
          }
          return;
        }

        // Normal navigation when not in grab mode
        if (e.key === 'ArrowDown') {
          if (projectLevelPosition === -1 && projectInput.trim() === '') {
            setProjectInput('');
          }

          if (projectLevelPosition === -1) {
            if (filteredProjects.length > 0) {
              setProjectLevelPosition(0);
              setIsTypingProject(false);
              console.log('[Navigation] Moving from bottom input to project 0');
            }
          } else if (projectLevelPosition < filteredProjects.length - 1) {
            setProjectLevelPosition(projectLevelPosition + 1);
            console.log('[Navigation] Moving to project', projectLevelPosition + 1);
          } else {
            setProjectLevelPosition(-1);
            setIsTypingProject(true);
            setProjectInput('');
            setProjectInputStep('name'); // Set the step when entering typing mode
            console.log('[Navigation] Moving to bottom input position');
          }
        } else if (e.key === 'ArrowUp') {
          if (projectLevelPosition === -1 && projectInput.trim() === '') {
            setProjectInput('');
          }

          if (projectLevelPosition === -1) {
            if (filteredProjects.length > 0) {
              setProjectLevelPosition(filteredProjects.length - 1);
              setIsTypingProject(false);
              console.log('[Navigation] Moving from bottom input to last project');
            } else {
              setProjectLevelPosition(-2);
              setIsTypingProject(true);
              setProjectInput('');
              setProjectInputStep('name'); // Set the step when entering typing mode
              console.log('[Navigation] Moving to top input position');
            }
          } else if (projectLevelPosition === 0) {
            setProjectLevelPosition(-2);
            setIsTypingProject(true);
            setProjectInput('');
            setProjectInputStep('name'); // Set the step when entering typing mode
            console.log('[Navigation] Moving to top input position');
          } else if (projectLevelPosition === -2) {
            setProjectLevelPosition(-1);
            setIsTypingProject(true);
            setProjectInput('');
            setProjectInputStep('name'); // Set the step when entering typing mode
            console.log('[Navigation] Wrapping from top to bottom input');
          } else {
            setProjectLevelPosition(projectLevelPosition - 1);
            console.log('[Navigation] Moving to project', projectLevelPosition - 1);
          }
        }
        return;
      }

      // ROUTINE HANDLERS - Similar to project handlers
      // Handle Cmd+D to delete a routine (but not when at task level)
      if (((e.key === 'd' || e.key === 'D' || e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) &&
          isAtRoutineLevel && !isAtRoutineTaskLevel && routineLevelPosition >= 0 && !isTypingRoutine && !isEditingRoutine) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Delete] Attempting to delete routine at position:', routineLevelPosition);
        const routineToDelete = routines[routineLevelPosition];
        if (routineToDelete) {
          const routineId = routineToDelete.id || routineToDelete._id;

          // Optimistic update - remove from UI immediately
          const updatedRoutines = routines.filter((_, index) => index !== routineLevelPosition);
          setRoutines(updatedRoutines);

          if (updatedRoutines.length === 0) {
            setRoutineLevelPosition(-1);
            setIsTypingRoutine(true);
            setRoutineInput('');
            setRoutineInputStep('name');
          } else if (routineLevelPosition >= updatedRoutines.length) {
            setRoutineLevelPosition(updatedRoutines.length - 1);
          }

          // Delete from database
          const deleteRoutine = async () => {
            try {
              const response = await fetch(`/api/routines/${routineId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                const result = await response.json();
                console.log('[Delete] Routine deleted from database:', result);
              } else {
                console.error('[Delete] Failed to delete routine from database:', await response.text());
                // Optionally revert the optimistic update
                setRoutines(routines);
              }
            } catch (error) {
              console.error('[Delete] Error deleting routine:', error);
              // Optionally revert the optimistic update
              setRoutines(routines);
            }
          };

          deleteRoutine();
          console.log('[Delete] Deleted routine at position:', routineLevelPosition);
        }
        return;
      }

      // Handle 'e' key to edit an existing routine (but not when at task level)
      if (e.key === 'e' && isAtRoutineLevel && !isAtRoutineTaskLevel && routineLevelPosition >= 0 && !isTypingRoutine && !isEditingRoutine && grabbedRoutineIndex === null) {
        e.preventDefault();
        const routineToEdit = routines[routineLevelPosition];
        if (routineToEdit) {
          setIsEditingRoutine(true);
          setEditingRoutineIndex(routineLevelPosition);
          setEditRoutineName(routineToEdit.name || (routineToEdit as any).content || '');
          setEditRoutineGoalId(routineToEdit.metadata?.goalId || null);
          setEditRoutineStartDate(routineToEdit.metadata?.startDate || '');
          setEditRoutineEndDate(routineToEdit.metadata?.endDate || '');
          setEditRoutineDays(routineToEdit.metadata?.days || []);
          setEditRoutineTime(routineToEdit.time || routineToEdit.metadata?.startTime || '');
          setEditRoutineDuration(routineToEdit.metadata?.duration || 30);
          setEditRoutineFieldFocus('name');
          console.log('[Edit] Entering edit mode for routine with all fields:', {
            name: routineToEdit.name,
            goalId: routineToEdit.metadata?.goalId,
            dates: `${routineToEdit.metadata?.startDate} to ${routineToEdit.metadata?.endDate}`,
            days: routineToEdit.metadata?.days,
            time: routineToEdit.metadata?.startTime,
            duration: routineToEdit.metadata?.duration
          });
        }
        return;
      }

      // Handle navigation and saving in routine edit mode
      if (isEditingRoutine && editingRoutineIndex !== null) {
        // Cmd/Ctrl+Enter to save changes
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          console.log('[Edit Routine] Saving changes');

          // Save the updated routine
          const updatedRoutines = [...routines];
          const updatedRoutine = {
            ...updatedRoutines[editingRoutineIndex],
            name: editRoutineName.trim() || updatedRoutines[editingRoutineIndex].name,
            time: editRoutineTime || updatedRoutines[editingRoutineIndex].time,
            metadata: {
              ...updatedRoutines[editingRoutineIndex].metadata,
              goalId: editRoutineGoalId,
              startDate: editRoutineStartDate,
              endDate: editRoutineEndDate,
              days: editRoutineDays,
              startTime: editRoutineTime,
              duration: editRoutineDuration
            }
          };
          updatedRoutines[editingRoutineIndex] = updatedRoutine;
          setRoutines(updatedRoutines);

          // Save to database
          const saveEditedRoutine = async () => {
            try {
              const response = await fetch(`/api/you/routines/${updatedRoutine.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: updatedRoutine.name,
                  metadata: updatedRoutine.metadata
                })
              });

              if (response.ok) {
                console.log('[InventoryView] Routine updated in database');
              } else {
                console.error('[InventoryView] Failed to update routine:', await response.text());
              }
            } catch (error) {
              console.error('[InventoryView] Error updating routine:', error);
            }
          };
          saveEditedRoutine();

          // Exit edit mode
          setIsEditingRoutine(false);
          setEditingRoutineIndex(null);
          setEditRoutineName('');
          setEditRoutineGoalId(null);
          setEditRoutineStartDate('');
          setEditRoutineEndDate('');
          setEditRoutineDays([]);
          setEditRoutineTime('');
          setEditRoutineDuration(30);
          setEditRoutineFieldFocus('name');
          return;
        }

        // Tab to navigate between fields
        if (e.key === 'Tab') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'dates' | 'days' | 'time' | 'duration'> =
            ['name', 'goal', 'dates', 'days', 'time', 'duration'];
          const currentIndex = fieldOrder.indexOf(editRoutineFieldFocus);
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditRoutineFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Routine] Tab to field:', fieldOrder[nextIndex]);
          return;
        }

        // Up/Down arrows to navigate between fields
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'dates' | 'days' | 'time' | 'duration'> =
            ['name', 'goal', 'dates', 'days', 'time', 'duration'];
          const currentIndex = fieldOrder.indexOf(editRoutineFieldFocus);
          const nextIndex = e.key === 'ArrowUp'
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditRoutineFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Routine] Arrow to field:', fieldOrder[nextIndex]);
          return;
        }

        // Enter on a field to open its popup for editing
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editRoutineFieldFocus === 'goal') {
            setShowEditRoutineGoalPopup(true);
            console.log('[Edit Routine] Opening goal selection popup');
          } else if (editRoutineFieldFocus === 'dates') {
            setShowEditRoutineDateRangePopup(true);
            console.log('[Edit Routine] Opening date range popup');
          } else if (editRoutineFieldFocus === 'days') {
            setShowEditRoutineDaysPopup(true);
            console.log('[Edit Routine] Opening day selection popup');
          } else if (editRoutineFieldFocus === 'time') {
            setShowEditRoutineTimePopup(true);
            console.log('[Edit Routine] Opening time popup');
          } else if (editRoutineFieldFocus === 'duration') {
            setShowEditRoutineDurationPopup(true);
            console.log('[Edit Routine] Opening duration popup');
          }
          return;
        }

        // Escape to cancel editing
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditingRoutine(false);
          setEditingRoutineIndex(null);
          setEditRoutineName('');
          setEditRoutineGoalId(null);
          setEditRoutineStartDate('');
          setEditRoutineEndDate('');
          setEditRoutineDays([]);
          setEditRoutineTime('');
          setEditRoutineDuration(30);
          setEditRoutineFieldFocus('name');
          setShowEditRoutineGoalPopup(false);
          setShowEditRoutineDateRangePopup(false);
          setShowEditRoutineDaysPopup(false);
          setShowEditRoutineTimePopup(false);
          setShowEditRoutineDurationPopup(false);
          console.log('[Edit Routine] Cancelled editing');
          return;
        }

        // Handle text input for name and time fields
        if (editRoutineFieldFocus === 'name') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditRoutineName(editRoutineName.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditRoutineName(editRoutineName + e.key);
            return;
          }
        } else if (editRoutineFieldFocus === 'time') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditRoutineTime(editRoutineTime.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            // Allow time format (HH:MM)
            if (/[\d:]/.test(e.key)) {
              let newTime = editRoutineTime + e.key;
              // Auto-insert colon after 2 digits
              if (newTime.length === 2 && /^\d{2}$/.test(newTime)) {
                newTime += ':';
              }
              // Limit to HH:MM format
              if (newTime.length <= 5) {
                setEditRoutineTime(newTime);
              }
            }
            return;
          }
        }

        return;
      }

      // Handle 'e' key to edit a routine task name
      if (e.key === 'e') {
        console.log('[Routine Task Edit] "e" key pressed. Conditions:', {
          isAtRoutineTaskLevel,
          isTypingRoutineTask,
          selectedRoutineTaskIndex,
          currentRoutineForTasks,
          grabbedRoutineTaskIndex,
          editingRoutineTaskIndex,
          willEdit: isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex >= 0 && currentRoutineForTasks !== null && grabbedRoutineTaskIndex === null && editingRoutineTaskIndex === null
        });
      }

      if (e.key === 'e' && isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex >= 0 && currentRoutineForTasks !== null && grabbedRoutineTaskIndex === null && editingRoutineTaskIndex === null) {
        console.log('[Routine Task Edit] Starting edit mode');
        e.preventDefault();
        const currentRoutine = routines[currentRoutineForTasks];
        console.log('[Routine Task Edit] Current routine:', currentRoutine);

        if (currentRoutine && currentRoutine.tasks && currentRoutine.tasks[selectedRoutineTaskIndex]) {
          const taskToEdit = currentRoutine.tasks[selectedRoutineTaskIndex];
          console.log('[Routine Task Edit] Task to edit:', taskToEdit);

          // Set refs FIRST for synchronous checks in same event handler
          editingRoutineTaskRef.current = selectedRoutineTaskIndex;
          editRoutineTaskFieldFocusRef.current = 'name';
          setEditingRoutineTaskIndex(selectedRoutineTaskIndex);
          setEditRoutineTaskName(taskToEdit.title || taskToEdit.name || taskToEdit.content || '');
          setEditRoutineTaskDuration(taskToEdit.duration !== null && taskToEdit.duration !== undefined ? taskToEdit.duration : 30);
          setEditRoutineTaskFieldFocus('name');

          console.log('[Routine Task Edit] Edit state set:', {
            editingIndex: selectedRoutineTaskIndex,
            editName: taskToEdit.title || taskToEdit.name || taskToEdit.content || '',
            editDuration: taskToEdit.duration,
            refSet: editingRoutineTaskRef.current,
            fieldFocusRef: editRoutineTaskFieldFocusRef.current
          });
        } else {
          console.log('[Routine Task Edit] ERROR: Task not found at index:', selectedRoutineTaskIndex);
        }
        return;
      }


      // Handle 'g' key or Enter to grab/release a routine task
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedRoutineTaskIndex !== null)) && isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex >= 0 && currentRoutineForTasks !== null && editingRoutineTaskIndex === null) {
        e.preventDefault();
        const currentRoutine = routines[currentRoutineForTasks];
        if (grabbedRoutineTaskIndex === null && e.key === 'g') {
          // Start grabbing
          console.log('[Routine Task Grab] Entering grab mode for task at index:', selectedRoutineTaskIndex);
          setGrabbedRoutineTaskIndex(selectedRoutineTaskIndex);
          setGrabbedRoutineTaskOriginalIndex(selectedRoutineTaskIndex);
        } else if (grabbedRoutineTaskIndex !== null && (e.key === 'g' || e.key === 'Enter')) {
          // Release the task and persist the new order
          console.log('[Routine Task Grab] Releasing task at index:', grabbedRoutineTaskIndex);

          // Persist the new task order to database
          if (currentRoutineForTasks !== null) {
            handleRoutineTaskReorderPersist(currentRoutineForTasks);
          }

          setGrabbedRoutineTaskIndex(null);
          setGrabbedRoutineTaskOriginalIndex(null);
        }
        return;
      }

      // Handle Enter key at routine task level to create inline input
      if (isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex >= 0 && e.key === 'Enter' && currentRoutineForTasks !== null && grabbedRoutineTaskIndex === null && editingRoutineTaskIndex === null) {
        e.preventDefault();
        console.log('[Routine Task] Enter pressed at task level - creating inline input after task:', selectedRoutineTaskIndex);

        // Set input position to be after the current task
        setRoutineTaskInputPosition(selectedRoutineTaskIndex);
        setIsTypingRoutineTask(true);
        setRoutineTaskInput('');

        console.log('[Routine Task] Created inline input at position:', selectedRoutineTaskIndex);
        return;
      }

      // Also handle Enter at the empty task area (when no tasks selected)
      if (isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex === -1 && e.key === 'Enter' && currentRoutineForTasks !== null && editingRoutineTaskRef.current === null && editingRoutineTaskIndex === null) {
        e.preventDefault();
        console.log('[Routine Task] Enter pressed at empty task area - creating bottom input');

        // Set input position at bottom
        setRoutineTaskInputPosition(-1);
        setIsTypingRoutineTask(true);
        setRoutineTaskInput('');

        console.log('[Routine Task] Created bottom input for new task');
        return;
      }

      // Handle Delete/Backspace for routine task deletion (Cmd+Delete or Cmd+Backspace)
      if (isAtRoutineTaskLevel && !isTypingRoutineTask && selectedRoutineTaskIndex >= 0 &&
          currentRoutineForTasks !== null && grabbedRoutineTaskIndex === null &&
          editingRoutineTaskIndex === null &&
          ((e.metaKey || e.ctrlKey) && (e.key === 'Delete' || e.key === 'Backspace'))) {
        e.preventDefault();
        console.log('[Routine Task] Delete key pressed for task:', selectedRoutineTaskIndex);

        // Call the delete handler
        handleDeleteRoutineTask(currentRoutineForTasks, selectedRoutineTaskIndex);
        return;
      }

      // Handle 'g' key or Enter to grab/release a routine (but not when at task level)
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedRoutineIndex !== null)) && isAtRoutineLevel && !isAtRoutineTaskLevel && routineLevelPosition >= 0 && !isTypingRoutine && !isEditingRoutine) {
        e.preventDefault();
        if (grabbedRoutineIndex === null && e.key === 'g') {
          console.log('[Grab] Entering grab mode for routine at index:', routineLevelPosition);
          setGrabbedRoutineIndex(routineLevelPosition);
          setGrabbedRoutineOriginalIndex(routineLevelPosition);
        } else if (grabbedRoutineIndex !== null) {
          console.log('[Grab] Releasing grabbed routine at index:', grabbedRoutineIndex);
          setGrabbedRoutineIndex(null);
          setGrabbedRoutineOriginalIndex(null);
        }
        return;
      }

      // Handle arrow navigation for routines (but not when at task level)
      if (isAtRoutineLevel && !isAtRoutineTaskLevel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();

        if (grabbedRoutineIndex !== null) {
          if (e.key === 'ArrowDown' && grabbedRoutineIndex < routines.length - 1) {
            const newIndex = grabbedRoutineIndex + 1;
            console.log('[Grab] Moving routine down from', grabbedRoutineIndex, 'to', newIndex);
            const newRoutines = [...routines];
            [newRoutines[grabbedRoutineIndex], newRoutines[newIndex]] = [newRoutines[newIndex], newRoutines[grabbedRoutineIndex]];
            setRoutines(newRoutines);
            setGrabbedRoutineIndex(newIndex);
            setRoutineLevelPosition(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedRoutineIndex > 0) {
            const newIndex = grabbedRoutineIndex - 1;
            console.log('[Grab] Moving routine up from', grabbedRoutineIndex, 'to', newIndex);
            const newRoutines = [...routines];
            [newRoutines[grabbedRoutineIndex], newRoutines[newIndex]] = [newRoutines[newIndex], newRoutines[grabbedRoutineIndex]];
            setRoutines(newRoutines);
            setGrabbedRoutineIndex(newIndex);
            setRoutineLevelPosition(newIndex);
            return;
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          if (routineLevelPosition === -1 && routineInput.trim() === '') {
            setRoutineInput('');
          }
          if (routineLevelPosition === -1) {
            if (routines.length > 0) {
              setRoutineLevelPosition(0);
              setIsTypingRoutine(false);
              console.log('[Navigation] Moving from bottom input to routine 0');
            }
          } else if (routineLevelPosition < routines.length - 1) {
            setRoutineLevelPosition(routineLevelPosition + 1);
            console.log('[Navigation] Moving to routine', routineLevelPosition + 1);
          } else {
            setRoutineLevelPosition(-1);
            setIsTypingRoutine(true);
            setRoutineInput('');
            setRoutineInputStep('name');
            setTempRoutineName('');
            setTempRoutineTime('');
            console.log('[Navigation] Moving to bottom input position');
          }
        } else if (e.key === 'ArrowUp') {
          if (routineLevelPosition === -1 && routineInput.trim() === '') {
            setRoutineInput('');
          }
          if (routineLevelPosition === -1) {
            if (routines.length > 0) {
              setRoutineLevelPosition(routines.length - 1);
              setIsTypingRoutine(false);
              console.log('[Navigation] Moving from bottom input to last routine');
            } else {
              setRoutineLevelPosition(-2);
              setIsTypingRoutine(true);
              setRoutineInput('');
              setRoutineInputStep('name');
              setTempRoutineName('');
              setTempRoutineTime('');
              console.log('[Navigation] Moving to top input position');
            }
          } else if (routineLevelPosition === 0) {
            setRoutineLevelPosition(-2);
            setIsTypingRoutine(true);
            setRoutineInput('');
            setRoutineInputStep('name');
            setTempRoutineName('');
            setTempRoutineTime('');
            console.log('[Navigation] Moving to top input position');
          } else if (routineLevelPosition === -2) {
            setRoutineLevelPosition(-1);
            setIsTypingRoutine(true);
            setRoutineInput('');
            setRoutineInputStep('name');
            setTempRoutineName('');
            setTempRoutineTime('');
            console.log('[Navigation] Wrapping from top to bottom input');
          } else {
            setRoutineLevelPosition(routineLevelPosition - 1);
            console.log('[Navigation] Moving to routine', routineLevelPosition - 1);
          }
        }
        return;
      }

      // ADMIN TASK HANDLERS - Similar to routine handlers
      // Handle Cmd+Enter to toggle task completion
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) &&
          isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin && !isEditingAdmin) {
        e.preventDefault();
        e.stopPropagation();
        const filteredTasks = adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed));
        const taskToToggle = filteredTasks[adminLevelPosition];
        if (taskToToggle) {
          const taskId = taskToToggle.id || taskToToggle._id;
          const newCompletedState = !taskToToggle.completed;

          // Update local state
          const updatedTasks = adminTasks.map(t =>
            (t.id === taskId || t._id === taskId)
              ? { ...t, completed: newCompletedState, metadata: { ...t.metadata, completed: newCompletedState } }
              : t
          );
          setAdminTasks(updatedTasks);

          // Persist to database
          if (taskId && !taskId.startsWith('temp-')) {
            fetch(`/api/you/task/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: newCompletedState })
            }).catch(error => console.error('[Admin Task] Error toggling completion:', error));
          }

          console.log('[Admin Task] Toggled completion for task:', taskId, 'to:', newCompletedState);
        }
        return;
      }

      // Handle Cmd+D to delete an admin task
      if (((e.key === 'd' || e.key === 'D' || e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) &&
          isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin && !isEditingAdmin) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Delete] Attempting to delete admin task at position:', adminLevelPosition);
        const filteredTasks = adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed));
        const adminToDelete = filteredTasks[adminLevelPosition];
        if (adminToDelete) {
          // Remove from full array by ID
          const taskId = adminToDelete.id || adminToDelete._id;
          const updatedAdminTasks = adminTasks.filter(t => (t.id || t._id) !== taskId);
          setAdminTasks(updatedAdminTasks);

          // Delete from database
          const deleteAdminTaskFromDatabase = async () => {
            const taskId = adminToDelete.id || adminToDelete._id;
            if (taskId && !taskId.startsWith('temp-')) {
              try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    unassignOnly: false // Actually delete the task, not just unassign
                  })
                });

                if (response.ok) {
                  console.log('[Delete] Admin task deleted from database');
                } else {
                  console.error('[Delete] Failed to delete admin task:', await response.text());
                  // Optionally restore the task if deletion failed
                  setAdminTasks([...adminTasks]);
                }
              } catch (error) {
                console.error('[Delete] Error deleting admin task:', error);
                // Optionally restore the task if deletion failed
                setAdminTasks([...adminTasks]);
              }
            }
          };
          deleteAdminTaskFromDatabase();

          // Adjust position after deletion
          if (updatedAdminTasks.length === 0) {
            setAdminLevelPosition(-1);
            setIsTypingAdmin(true);
            setAdminInput('');
            setAdminInputStep('name');
          } else if (adminLevelPosition >= updatedAdminTasks.length) {
            setAdminLevelPosition(updatedAdminTasks.length - 1);
          }
          console.log('[Delete] Deleted admin task at position:', adminLevelPosition);
        }
        return;
      }

      // Handle Space key to toggle admin task completion
      if (e.key === ' ' && isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin && !isEditingAdmin && grabbedAdminIndex === null) {
        e.preventDefault();
        const adminToToggle = adminTasks[adminLevelPosition];
        if (adminToToggle) {
          // Toggle completion status
          const isCompleted = adminToToggle.completed || adminToToggle.metadata?.completed || false;
          const updatedAdminTasks = [...adminTasks];
          updatedAdminTasks[adminLevelPosition] = {
            ...adminToToggle,
            completed: !isCompleted,
            metadata: {
              ...adminToToggle.metadata,
              completed: !isCompleted
            }
          };
          setAdminTasks(updatedAdminTasks);

          // Update in database
          const taskId = adminToToggle.id || adminToToggle._id;
          if (taskId && !taskId.startsWith('temp-')) {
            fetch(`/api/you/task/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                completed: !isCompleted
              })
            }).then(response => {
              if (response.ok) {
                console.log('[Toggle] Admin task completion toggled in database');
              } else {
                console.error('[Toggle] Failed to toggle admin task completion');
                // Optionally revert the toggle
                setAdminTasks(adminTasks);
              }
            }).catch(error => {
              console.error('[Toggle] Error toggling admin task:', error);
              // Optionally revert the toggle
              setAdminTasks(adminTasks);
            });
          }

          console.log('[Toggle] Toggled admin task completion at position:', adminLevelPosition);
        }
        return;
      }

      // Handle 'e' key to edit an existing admin task
      if (e.key === 'e' && isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin && !isEditingAdmin && grabbedAdminIndex === null) {
        e.preventDefault();
        const filteredTasks = adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed));
        const adminToEdit = filteredTasks[adminLevelPosition];
        if (adminToEdit) {
          // Find the actual index in the full array
          const actualAdminIndex = adminTasks.findIndex(t => (t.id || t._id) === (adminToEdit.id || adminToEdit._id));
          setIsEditingAdmin(true);
          setEditingAdminIndex(actualAdminIndex); // Store full array index
          // Admin tasks use 'content' field for their name
          setEditAdminName(adminToEdit.name || adminToEdit.content || '');
          setEditAdminPriority(adminToEdit.priority || '');
          setEditAdminGoalId(adminToEdit.metadata?.goalId || null);
          // Parse duration - it might be stored as "30m" or as 30
          const durationValue = adminToEdit.metadata?.duration;
          const parsedDuration = typeof durationValue === 'string'
            ? parseInt(durationValue.replace('m', ''))
            : (durationValue || 30);
          setEditAdminDuration(parsedDuration);
          setEditAdminDeadline(adminToEdit.metadata?.deadline || adminToEdit.metadata?.dueDate || null);
          setEditAdminFieldFocus('name');
          console.log('[Edit] Entering edit mode for admin task with all fields:', {
            name: adminToEdit.name || adminToEdit.content,
            priority: adminToEdit.priority,
            goalId: adminToEdit.metadata?.goalId,
            duration: parsedDuration,
            deadline: adminToEdit.metadata?.deadline || adminToEdit.metadata?.dueDate
          });
        }
        return;
      }

      // Handle navigation and saving in admin edit mode
      if (isEditingAdmin && editingAdminIndex !== null) {
        // Cmd/Ctrl+Enter to save changes
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          console.log('[Edit Admin] Saving changes');

          // Save the updated admin task
          const updatedAdminTasks = [...adminTasks];
          const updatedTask = {
            ...updatedAdminTasks[editingAdminIndex],
            name: editAdminName.trim() || updatedAdminTasks[editingAdminIndex].name,
            content: editAdminName.trim() || updatedAdminTasks[editingAdminIndex].content,
            priority: editAdminPriority || updatedAdminTasks[editingAdminIndex].priority,
            metadata: {
              ...updatedAdminTasks[editingAdminIndex].metadata,
              goalId: editAdminGoalId,
              duration: `${editAdminDuration}m`,
              deadline: editAdminDeadline,
              dueDate: editAdminDeadline
            }
          };
          updatedAdminTasks[editingAdminIndex] = updatedTask;
          setAdminTasks(updatedAdminTasks);

          // Save to database
          const saveEditedAdminTask = async () => {
            try {
              const taskId = updatedTask.id || updatedTask._id;
              if (!taskId || taskId.startsWith('temp-')) {
                console.log('[Admin] Skipping database save for temp task');
                return;
              }

              const response = await fetch(`/api/you/task/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: updatedTask.name || updatedTask.content,
                  duration: editAdminDuration,
                  goalId: editAdminGoalId || null,
                  dueDate: editAdminDeadline ? new Date(editAdminDeadline) : null,
                  priority: editAdminPriority || undefined
                })
              });

              if (response.ok) {
                console.log('[InventoryView] Admin task updated in database');
              } else {
                console.error('[InventoryView] Failed to update admin task:', await response.text());
              }
            } catch (error) {
              console.error('[InventoryView] Error updating admin task:', error);
            }
          };
          saveEditedAdminTask();

          // Exit edit mode
          setIsEditingAdmin(false);
          setEditingAdminIndex(null);
          setEditAdminName('');
          setEditAdminPriority('');
          setEditAdminGoalId(null);
          setEditAdminDuration(30);
          setEditAdminDeadline(null);
          setEditAdminFieldFocus('name');
          return;
        }

        // Tab to navigate between fields
        if (e.key === 'Tab') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'priority' | 'goal' | 'duration' | 'deadline'> =
            ['name', 'priority', 'goal', 'duration', 'deadline'];
          const currentIndex = fieldOrder.indexOf(editAdminFieldFocus);
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditAdminFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Admin] Tab to field:', fieldOrder[nextIndex]);
          return;
        }

        // Up/Down arrows to navigate between fields
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'priority' | 'goal' | 'duration' | 'deadline'> =
            ['name', 'priority', 'goal', 'duration', 'deadline'];
          const currentIndex = fieldOrder.indexOf(editAdminFieldFocus);
          const nextIndex = e.key === 'ArrowUp'
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditAdminFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Admin] Arrow to field:', fieldOrder[nextIndex]);
          return;
        }

        // Enter on a field to open its popup for editing
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editAdminFieldFocus === 'goal') {
            setShowEditAdminGoalPopup(true);
            console.log('[Edit Admin] Opening goal selection popup');
          } else if (editAdminFieldFocus === 'duration') {
            setShowEditAdminDurationPopup(true);
            console.log('[Edit Admin] Opening duration popup');
          } else if (editAdminFieldFocus === 'deadline') {
            setShowEditAdminDeadlinePopup(true);
            console.log('[Edit Admin] Opening deadline popup');
          }
          return;
        }

        // Escape to cancel editing
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditingAdmin(false);
          setEditingAdminIndex(null);
          setEditAdminName('');
          setEditAdminPriority('');
          setEditAdminGoalId(null);
          setEditAdminDuration(30);
          setEditAdminDeadline(null);
          setEditAdminFieldFocus('name');
          setShowEditAdminGoalPopup(false);
          setShowEditAdminDurationPopup(false);
          setShowEditAdminDeadlinePopup(false);
          console.log('[Edit Admin] Cancelled editing');
          return;
        }

        // Handle text input for name and priority fields
        if (editAdminFieldFocus === 'name') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditAdminName(editAdminName.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditAdminName(editAdminName + e.key);
            return;
          }
        } else if (editAdminFieldFocus === 'priority') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditAdminPriority(editAdminPriority.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditAdminPriority(editAdminPriority + e.key);
            return;
          }
        }

        return;
      }

      // Handle 'g' key or Enter to grab/release an admin task
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedAdminIndex !== null)) && isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin && !isEditingAdmin) {
        e.preventDefault();
        if (grabbedAdminIndex === null && e.key === 'g') {
          console.log('[Grab] Entering grab mode for admin task at index:', adminLevelPosition);
          setGrabbedAdminIndex(adminLevelPosition);
          setGrabbedAdminOriginalIndex(adminLevelPosition);
        } else if (grabbedAdminIndex !== null) {
          console.log('[Grab] Releasing grabbed admin task at index:', grabbedAdminIndex);

          // Persist the new order to database
          const persistAdminTaskOrder = async () => {
            try {
              // Update each task's order field
              const updatePromises = adminTasks.map((task, index) => {
                const taskId = task.id || task._id;
                if (taskId && !taskId.startsWith('temp-')) {
                  return fetch(`/api/you/task/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      order: index
                    })
                  });
                }
                return Promise.resolve();
              });

              await Promise.all(updatePromises);
              console.log('[Grab] Admin task order persisted to database');
            } catch (error) {
              console.error('[Grab] Error persisting admin task order:', error);
              // Optionally revert to original order
              if (grabbedAdminOriginalIndex !== null && grabbedAdminOriginalIndex !== grabbedAdminIndex) {
                const revertedTasks = [...adminTasks];
                const [movedTask] = revertedTasks.splice(grabbedAdminIndex, 1);
                revertedTasks.splice(grabbedAdminOriginalIndex, 0, movedTask);
                setAdminTasks(revertedTasks);
                setAdminLevelPosition(grabbedAdminOriginalIndex);
              }
            }
          };

          // Only persist if the position actually changed
          if (grabbedAdminOriginalIndex !== null && grabbedAdminOriginalIndex !== grabbedAdminIndex) {
            persistAdminTaskOrder();
          }

          setGrabbedAdminIndex(null);
          setGrabbedAdminOriginalIndex(null);
        }
        return;
      }

      // Handle left/right arrows to toggle admin task view (active/completed) when inside admin
      if (isAtAdminLevel && !isEditingAdmin && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const newMode = adminTaskViewMode === 'active' ? 'completed' : 'active';
        setAdminTaskViewMode(newMode);
        // Reset to appropriate position in new view
        const newFilteredTasks = adminTasks.filter(t => newMode === 'active' ? !t.completed : t.completed);
        if (newFilteredTasks.length > 0) {
          setAdminLevelPosition(0);
        } else {
          setAdminLevelPosition(-1);
        }
        // Always exit typing mode when toggling views
        setIsTypingAdmin(false);
        setAdminInput('');
        setAdminInputStep(null);
        console.log('[View Toggle] Switched to', newMode, 'admin tasks with', newFilteredTasks.length, 'tasks');
        return;
      }

      // Handle arrow navigation for admin tasks
      if (isAtAdminLevel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();

        // Filter admin tasks based on current view mode
        const filteredTasks = adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed));

        if (grabbedAdminIndex !== null) {
          if (e.key === 'ArrowDown' && grabbedAdminIndex < filteredTasks.length - 1) {
            const newIndex = grabbedAdminIndex + 1;
            console.log('[Grab] Moving admin task down from', grabbedAdminIndex, 'to', newIndex);

            // Get the two tasks we're swapping from the filtered array
            const task1 = filteredTasks[grabbedAdminIndex];
            const task2 = filteredTasks[newIndex];

            // Find their actual indices in the full array
            const fullIndex1 = adminTasks.findIndex(t => (t.id || t._id) === (task1.id || task1._id));
            const fullIndex2 = adminTasks.findIndex(t => (t.id || t._id) === (task2.id || task2._id));

            // Swap them in the full array
            const updatedTasks = [...adminTasks];
            [updatedTasks[fullIndex1], updatedTasks[fullIndex2]] = [updatedTasks[fullIndex2], updatedTasks[fullIndex1]];
            setAdminTasks(updatedTasks);
            setGrabbedAdminIndex(newIndex);
            setAdminLevelPosition(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedAdminIndex > 0) {
            const newIndex = grabbedAdminIndex - 1;
            console.log('[Grab] Moving admin task up from', grabbedAdminIndex, 'to', newIndex);

            // Get the two tasks we're swapping from the filtered array
            const task1 = filteredTasks[grabbedAdminIndex];
            const task2 = filteredTasks[newIndex];

            // Find their actual indices in the full array
            const fullIndex1 = adminTasks.findIndex(t => (t.id || t._id) === (task1.id || task1._id));
            const fullIndex2 = adminTasks.findIndex(t => (t.id || t._id) === (task2.id || task2._id));

            // Swap them in the full array
            const updatedTasks = [...adminTasks];
            [updatedTasks[fullIndex1], updatedTasks[fullIndex2]] = [updatedTasks[fullIndex2], updatedTasks[fullIndex1]];
            setAdminTasks(updatedTasks);
            setGrabbedAdminIndex(newIndex);
            setAdminLevelPosition(newIndex);
            return;
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          if (adminLevelPosition === -1 && adminInput.trim() === '') {
            setAdminInput('');
          }
          if (adminLevelPosition === -1) {
            if (filteredTasks.length > 0) {
              setAdminLevelPosition(0);
              setIsTypingAdmin(false);
              console.log('[Navigation] Moving from bottom input to admin task 0');
            }
          } else if (adminLevelPosition < filteredTasks.length - 1) {
            setAdminLevelPosition(adminLevelPosition + 1);
            console.log('[Navigation] Moving to admin task', adminLevelPosition + 1);
          } else {
            setAdminLevelPosition(-1);
            setIsTypingAdmin(true);
            setAdminInput('');
            setAdminInputStep('name');
            console.log('[Navigation] Moving to bottom input position');
          }
        } else if (e.key === 'ArrowUp') {
          if (adminLevelPosition === -1 && adminInput.trim() === '') {
            setAdminInput('');
          }
          if (adminLevelPosition === -1) {
            if (filteredTasks.length > 0) {
              setAdminLevelPosition(filteredTasks.length - 1);
              setIsTypingAdmin(false);
              console.log('[Navigation] Moving from bottom input to last admin task');
            } else {
              setAdminLevelPosition(-2);
              setIsTypingAdmin(true);
              setAdminInput('');
              setAdminInputStep('name');
              console.log('[Navigation] Moving to top input position');
            }
          } else if (adminLevelPosition === 0) {
            setAdminLevelPosition(-2);
            setIsTypingAdmin(true);
            setAdminInput('');
            setAdminInputStep('name');
            console.log('[Navigation] Moving to top input position');
          } else if (adminLevelPosition === -2) {
            setAdminLevelPosition(-1);
            setIsTypingAdmin(true);
            setAdminInput('');
            setAdminInputStep('name');
            console.log('[Navigation] Wrapping from top to bottom input');
          } else {
            setAdminLevelPosition(adminLevelPosition - 1);
            console.log('[Navigation] Moving to admin task', adminLevelPosition - 1);
          }
        }
        return;
      }

      // Handle typing for events with popup flow
      if (isTypingEvent && (eventLevelPosition === -1 || eventLevelPosition === -2 || eventLevelPosition < -2) &&
          e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        console.log('[Event Typing] Key pressed:', e.key, 'inputStep:', eventInputStep, 'eventInput:', eventInput);

        if (e.key === 'Enter') {
          e.preventDefault();
          if (!eventInputStep || eventInputStep === 'name') {
            if (eventInput.trim()) {
              console.log('[Event] Moving to goal selection popup');
              setTempEventName(eventInput.trim());
              // Initialize pending event data with current position and name
              setPendingEventData({
                name: eventInput.trim(),
                position: eventLevelPosition,
                goalId: null,
                isRecurring: false,
                recurringDays: [],
                date: null,
                startTime: '',
                endTime: '',
                link: null
              });
              setEventInput('');
              setEventInputStep(null);
              setShowEventGoalSelectionPopup(true);
              setIsTypingEvent(false);
            }
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEventInput('');
          setEventInputStep(null);
          setTempEventName('');
          setTempEventDate('');
          setTempEventGoalId(null);
          setTempEventIsRecurring(false);
          setTempEventDays([]);
          setTempEventStartTime('');
          setTempEventEndTime('');
          setTempEventLink('');
          setIsTypingEvent(false);
          setPendingEventData(null);

          // Return to appropriate position
          if (eventLevelPosition === -2) {
            if (events.length > 0) {
              setEventLevelPosition(0);
            } else {
              setEventLevelPosition(-1);
            }
          } else if (eventLevelPosition < -2) {
            setEventLevelPosition(Math.abs(eventLevelPosition) - 3);
          }
          console.log('[Event] Cancelled event input');
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (eventInput.length > 0) {
            setEventInput(eventInput.slice(0, -1));
          } else {
            setIsTypingEvent(false);
            setEventInputStep(null);
            setTempEventName('');
            setTempEventDate('');
            setTempEventGoalId(null);
            setTempEventIsRecurring(false);
            setTempEventDays([]);
            setTempEventStartTime('');
            setTempEventEndTime('');
            setTempEventLink('');
            setPendingEventData(null);

            if (eventLevelPosition === -2) {
              if (events.length > 0) {
                setEventLevelPosition(0);
              } else {
                setEventLevelPosition(-1);
              }
            } else if (eventLevelPosition < -2) {
              setEventLevelPosition(Math.abs(eventLevelPosition) - 3);
            }
          }
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setEventInput(eventInput + e.key);
        }
        return;
      }

      // EVENT HANDLERS - Similar to admin task handlers
      // Handle Cmd+D to delete an event
      if (((e.key === 'd' || e.key === 'D' || e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) &&
          isAtEventLevel && eventLevelPosition >= 0 && !isTypingEvent && !isEditingEvent) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Delete] Attempting to delete event at position:', eventLevelPosition);
        const eventToDelete = events[eventLevelPosition];
        if (eventToDelete) {
          const updatedEvents = events.filter((_, index) => index !== eventLevelPosition);
          setEvents(updatedEvents);

          // Delete from database
          const deleteEventFromDatabase = async () => {
            const eventId = eventToDelete.id || eventToDelete._id;
            if (!eventId || eventId.startsWith('temp-')) {
              console.log('[Event] Skipping database delete for temp event');
              return;
            }
            try {
              const response = await fetch(`/api/you/events?id=${eventId}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                console.log('[Event] Event deleted from database');
              } else {
                console.error('[Event] Failed to delete event:', await response.text());
              }
            } catch (error) {
              console.error('[Event] Error deleting event:', error);
            }
          };
          deleteEventFromDatabase();

          if (updatedEvents.length === 0) {
            setEventLevelPosition(-1);
            setIsTypingEvent(true);
            setEventInput('');
            setEventInputStep('name');
          } else if (eventLevelPosition >= updatedEvents.length) {
            setEventLevelPosition(updatedEvents.length - 1);
          }
          console.log('[Delete] Deleted event at position:', eventLevelPosition);
        }
        return;
      }

      // Handle 'e' key to edit an existing event
      if (e.key === 'e' && isAtEventLevel && eventLevelPosition >= 0 && !isTypingEvent && !isEditingEvent && grabbedEventIndex === null) {
        e.preventDefault();
        const eventToEdit = events[eventLevelPosition];
        if (eventToEdit) {
          setIsEditingEvent(true);
          setEditingEventIndex(eventLevelPosition);
          // Events use 'content' field for their name
          setEditEventName(eventToEdit.name || eventToEdit.content || '');
          setEditEventGoalId(eventToEdit.metadata?.goalId || null);
          setEditEventIsRecurring(eventToEdit.metadata?.isRecurring || false);
          setEditEventRecurringDays(eventToEdit.metadata?.recurringDays || []);
          setEditEventDate(eventToEdit.date || eventToEdit.metadata?.dueDate || '');
          setEditEventStartTime(eventToEdit.metadata?.startTime || '');
          setEditEventEndTime(eventToEdit.metadata?.endTime || '');
          setEditEventLink(eventToEdit.metadata?.link || '');
          setEditEventLocation(eventToEdit.location || '');
          setEditEventFieldFocus('name');
          console.log('[Edit] Entering edit mode for event with all fields:', {
            name: eventToEdit.name || eventToEdit.content,
            goalId: eventToEdit.metadata?.goalId,
            isRecurring: eventToEdit.metadata?.isRecurring,
            recurringDays: eventToEdit.metadata?.recurringDays,
            date: eventToEdit.date,
            startTime: eventToEdit.metadata?.startTime,
            endTime: eventToEdit.metadata?.endTime,
            link: eventToEdit.metadata?.link,
            location: eventToEdit.location
          });
        }
        return;
      }

      // Handle navigation and saving in event edit mode
      if (isEditingEvent && editingEventIndex !== null) {
        // Cmd/Ctrl+Enter to save changes
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          console.log('[Edit Event] Saving changes');

          // Save the updated event
          const updatedEvents = [...events];
          const updatedEvent = {
            ...updatedEvents[editingEventIndex],
            name: editEventName.trim() || updatedEvents[editingEventIndex].name,
            content: editEventName.trim() || updatedEvents[editingEventIndex].content,
            date: editEventDate || updatedEvents[editingEventIndex].date,
            location: editEventLocation || updatedEvents[editingEventIndex].location,
            metadata: {
              ...updatedEvents[editingEventIndex].metadata,
              goalId: editEventGoalId,
              isRecurring: editEventIsRecurring,
              recurringDays: editEventRecurringDays,
              dueDate: editEventDate,
              startTime: editEventStartTime,
              endTime: editEventEndTime,
              link: editEventLink
            }
          };
          updatedEvents[editingEventIndex] = updatedEvent;
          setEvents(updatedEvents);

          // Save to database
          const saveEditedEvent = async () => {
            try {
              const response = await fetch(`/api/you/events/${updatedEvent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: updatedEvent.name || updatedEvent.content,
                  dueDate: updatedEvent.date,
                  startTime: updatedEvent.metadata?.startTime || '09:00',
                  endTime: updatedEvent.metadata?.endTime || '10:00',
                  isRecurring: updatedEvent.metadata?.isRecurring || false,
                  recurringDays: updatedEvent.metadata?.recurringDays || [],
                  goalId: updatedEvent.metadata?.goalId || null,
                  zoomLink: updatedEvent.metadata?.link || null
                })
              });

              if (response.ok) {
                console.log('[InventoryView] Event updated in database');
              } else {
                console.error('[InventoryView] Failed to update event:', await response.text());
              }
            } catch (error) {
              console.error('[InventoryView] Error updating event:', error);
            }
          };
          saveEditedEvent();

          // Exit edit mode
          setIsEditingEvent(false);
          setEditingEventIndex(null);
          setEditEventName('');
          setEditEventGoalId(null);
          setEditEventIsRecurring(false);
          setEditEventRecurringDays([]);
          setEditEventDate('');
          setEditEventStartTime('');
          setEditEventEndTime('');
          setEditEventLink('');
          setEditEventLocation('');
          setEditEventFieldFocus('name');
          return;
        }

        // Tab to navigate between fields
        if (e.key === 'Tab') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'recurring' | 'days' | 'date' | 'time' | 'link' | 'location'> =
            ['name', 'goal', 'recurring', 'days', 'date', 'time', 'link', 'location'];
          const currentIndex = fieldOrder.indexOf(editEventFieldFocus);
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditEventFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Event] Tab to field:', fieldOrder[nextIndex]);
          return;
        }

        // Up/Down arrows to navigate between fields
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'goal' | 'recurring' | 'days' | 'date' | 'time' | 'link' | 'location'> =
            ['name', 'goal', 'recurring', 'days', 'date', 'time', 'link', 'location'];
          const currentIndex = fieldOrder.indexOf(editEventFieldFocus);
          const nextIndex = e.key === 'ArrowUp'
            ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
            : (currentIndex + 1) % fieldOrder.length;
          setEditEventFieldFocus(fieldOrder[nextIndex]);
          console.log('[Edit Event] Arrow to field:', fieldOrder[nextIndex]);
          return;
        }

        // Enter on a field to open its popup for editing
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editEventFieldFocus === 'goal') {
            setShowEditEventGoalPopup(true);
            console.log('[Edit Event] Opening goal selection popup');
          } else if (editEventFieldFocus === 'recurring') {
            setShowEditEventRecurringPopup(true);
            console.log('[Edit Event] Opening recurring selection popup');
          } else if (editEventFieldFocus === 'days') {
            setShowEditEventDaysPopup(true);
            console.log('[Edit Event] Opening day selection popup');
          } else if (editEventFieldFocus === 'date') {
            setShowEditEventDatePopup(true);
            console.log('[Edit Event] Opening date popup');
          } else if (editEventFieldFocus === 'time') {
            setShowEditEventTimePopup(true);
            console.log('[Edit Event] Opening time popup');
          } else if (editEventFieldFocus === 'link') {
            setShowEditEventLinkPopup(true);
            console.log('[Edit Event] Opening link popup');
          }
          return;
        }

        // Escape to cancel editing
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsEditingEvent(false);
          setEditingEventIndex(null);
          setEditEventName('');
          setEditEventGoalId(null);
          setEditEventIsRecurring(false);
          setEditEventRecurringDays([]);
          setEditEventDate('');
          setEditEventStartTime('');
          setEditEventEndTime('');
          setEditEventLink('');
          setEditEventLocation('');
          setEditEventFieldFocus('name');
          setShowEditEventGoalPopup(false);
          setShowEditEventRecurringPopup(false);
          setShowEditEventDaysPopup(false);
          setShowEditEventDatePopup(false);
          setShowEditEventTimePopup(false);
          setShowEditEventLinkPopup(false);
          console.log('[Edit Event] Cancelled editing');
          return;
        }

        // Handle text input for name, date, and location fields
        if (editEventFieldFocus === 'name') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditEventName(editEventName.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditEventName(editEventName + e.key);
            return;
          }
        } else if (editEventFieldFocus === 'date') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditEventDate(editEventDate.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditEventDate(editEventDate + e.key);
            return;
          }
        } else if (editEventFieldFocus === 'location') {
          if (e.key === 'Backspace') {
            e.preventDefault();
            setEditEventLocation(editEventLocation.slice(0, -1));
            return;
          } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            setEditEventLocation(editEventLocation + e.key);
            return;
          }
        }

        return;
      }

      // Handle 'g' key or Enter to grab/release an event
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedEventIndex !== null)) && isAtEventLevel && eventLevelPosition >= 0 && !isTypingEvent && !isEditingEvent) {
        e.preventDefault();
        if (grabbedEventIndex === null && e.key === 'g') {
          console.log('[Grab] Entering grab mode for event at index:', eventLevelPosition);
          setGrabbedEventIndex(eventLevelPosition);
          setGrabbedEventOriginalIndex(eventLevelPosition);
        } else if (grabbedEventIndex !== null) {
          console.log('[Grab] Releasing grabbed event at index:', grabbedEventIndex);
          setGrabbedEventIndex(null);
          setGrabbedEventOriginalIndex(null);
        }
        return;
      }

      // Handle left/right arrows to toggle event view (upcoming/passed) when inside events
      if (isAtEventLevel && !isEditingEvent && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const newMode = eventViewMode === 'upcoming' ? 'passed' : 'upcoming';
        setEventViewMode(newMode);
        // Reset to appropriate position in new view
        const newFilteredEvents = events.filter(e => newMode === 'upcoming' ? !hasEventPassed(e) : hasEventPassed(e));
        if (newFilteredEvents.length > 0) {
          setEventLevelPosition(0);
        } else {
          setEventLevelPosition(-1);
        }
        // Always exit typing mode when toggling views
        setIsTypingEvent(false);
        setEventInput('');
        setEventInputStep(null);
        console.log('[View Toggle] Switched to', newMode, 'events with', newFilteredEvents.length, 'events');
        return;
      }

      // Handle arrow navigation for events
      if (isAtEventLevel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();

        // Filter events based on current view mode
        const filteredEvents = events.filter(e => eventViewMode === 'upcoming' ? !hasEventPassed(e) : hasEventPassed(e));

        if (grabbedEventIndex !== null) {
          if (e.key === 'ArrowDown' && grabbedEventIndex < filteredEvents.length - 1) {
            const newIndex = grabbedEventIndex + 1;
            console.log('[Grab] Moving event down from', grabbedEventIndex, 'to', newIndex);
            const newEvents = [...filteredEvents];
            [newEvents[grabbedEventIndex], newEvents[newIndex]] = [newEvents[newIndex], newEvents[grabbedEventIndex]];
            // Update the full events array with the reordered filtered events
            const updatedEvents = events.map(e => {
              const filteredIndex = newEvents.findIndex(fe => (fe.id || fe._id) === (e.id || e._id));
              return filteredIndex >= 0 ? newEvents[filteredIndex] : e;
            });
            setEvents(updatedEvents);
            setGrabbedEventIndex(newIndex);
            setEventLevelPosition(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedEventIndex > 0) {
            const newIndex = grabbedEventIndex - 1;
            console.log('[Grab] Moving event up from', grabbedEventIndex, 'to', newIndex);
            const newEvents = [...filteredEvents];
            [newEvents[grabbedEventIndex], newEvents[newIndex]] = [newEvents[newIndex], newEvents[grabbedEventIndex]];
            // Update the full events array with the reordered filtered events
            const updatedEvents = events.map(e => {
              const filteredIndex = newEvents.findIndex(fe => (fe.id || fe._id) === (e.id || e._id));
              return filteredIndex >= 0 ? newEvents[filteredIndex] : e;
            });
            setEvents(updatedEvents);
            setGrabbedEventIndex(newIndex);
            setEventLevelPosition(newIndex);
            return;
          }
          return;
        }

        if (e.key === 'ArrowDown') {
          if (eventLevelPosition === -1 && eventInput.trim() === '') {
            setEventInput('');
          }
          if (eventLevelPosition === -1) {
            if (filteredEvents.length > 0) {
              setEventLevelPosition(0);
              setIsTypingEvent(false);
              console.log('[Navigation] Moving from bottom input to event 0');
            }
          } else if (eventLevelPosition < filteredEvents.length - 1) {
            setEventLevelPosition(eventLevelPosition + 1);
            console.log('[Navigation] Moving to event', eventLevelPosition + 1);
          } else {
            setEventLevelPosition(-1);
            setIsTypingEvent(true);
            setEventInput('');
            setEventInputStep('name');
            console.log('[Navigation] Moving to bottom input position');
          }
        } else if (e.key === 'ArrowUp') {
          if (eventLevelPosition === -1 && eventInput.trim() === '') {
            setEventInput('');
          }
          if (eventLevelPosition === -1) {
            if (filteredEvents.length > 0) {
              setEventLevelPosition(filteredEvents.length - 1);
              setIsTypingEvent(false);
              console.log('[Navigation] Moving from bottom input to last event');
            } else {
              setEventLevelPosition(-2);
              setIsTypingEvent(true);
              setEventInput('');
              setEventInputStep('name');
              console.log('[Navigation] Moving to top input position');
            }
          } else if (eventLevelPosition === 0) {
            setEventLevelPosition(-2);
            setIsTypingEvent(true);
            setEventInput('');
            setEventInputStep('name');
            console.log('[Navigation] Moving to top input position');
          } else if (eventLevelPosition === -2) {
            setEventLevelPosition(-1);
            setIsTypingEvent(true);
            setEventInput('');
            setEventInputStep('name');
            console.log('[Navigation] Wrapping from top to bottom input');
          } else {
            setEventLevelPosition(eventLevelPosition - 1);
            console.log('[Navigation] Moving to event', eventLevelPosition - 1);
          }
        }
        return;
      }

      console.log('[PRE-TASK-EDIT] About to check task edit mode. States:', {
        isEditingTask,
        editingTaskIndex,
        isAtProjectTaskLevel,
        isTypingTask,
        currentKey: e.key
      });

      // Handle task edit mode navigation and saving
      if (isEditingTask && editingTaskIndex !== null && currentProjectForTasks !== null) {
        console.log('[Task Edit Handler] ENTERING BLOCK - Key pressed:', e.key, 'field:', editTaskFieldFocus, 'name:', editTaskName, 'duration:', editTaskDuration, 'deadline:', editTaskDeadline);
        console.log('[Task Edit Handler] State check:', {
          isEditingTask,
          editingTaskIndex,
          editTaskFieldFocus,
          keyLength: e.key.length,
          isMetaKey: e.metaKey,
          isCtrlKey: e.ctrlKey,
          isAltKey: e.altKey
        });

        // Cmd+Enter or Ctrl+Enter to save
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          // Save the edited task
            let projectIndex = currentProjectForTasks;
            if (projectIndex === null && projectLevelPosition >= 0) {
              const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
              const currentProj = filteredProjects[projectLevelPosition];
              if (currentProj) {
                projectIndex = projects.findIndex(p => (p.id || p._id) === (currentProj.id || currentProj._id));
              } else {
                projectIndex = projectLevelPosition;
              }
            }
            const updatedProjects = [...projects];
            const project = updatedProjects[projectIndex];

            if (project && project.tasks && project.tasks[editingTaskIndex]) {
              const existingTask = project.tasks[editingTaskIndex];

              // Parse duration (remove 'm' suffix if present)
              let parsedDuration = parseInt(editTaskDuration.replace(/[^0-9]/g, ''));
              if (isNaN(parsedDuration) || parsedDuration <= 0) {
                parsedDuration = 30; // Default to 30 minutes
              }

              // Parse deadline from DD/MM/YYYY format
              let parsedDeadline = existingTask.dueDate; // Keep existing by default
              if (editTaskDeadline && editTaskDeadline.length === 10) {
                const parts = editTaskDeadline.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10);
                  const year = parseInt(parts[2], 10);

                  // Validate date components
                  if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                    const date = new Date(year, month - 1, day);
                    parsedDeadline = date.toISOString();
                  }
                }
              } else if (!editTaskDeadline) {
                // Clear deadline if empty
                parsedDeadline = undefined;
              }

              // Update the task
              const updatedTask = {
                ...existingTask,
                content: editTaskName.trim() || existingTask.content,
                name: editTaskName.trim() || existingTask.name,
                title: editTaskName.trim() || existingTask.content,
                duration: parsedDuration,
                dueDate: parsedDeadline
              };

              console.log('[Task Edit] Updating task locally:', {
                original: existingTask,
                updated: updatedTask,
                parsedDuration,
                parsedDeadline,
                editTaskDuration,
                editTaskDeadline,
                taskIndex: editingTaskIndex,
                projectIndex: projectIndex
              });

              project.tasks[editingTaskIndex] = updatedTask;
              console.log('[Task Edit] Task after update:', project.tasks[editingTaskIndex]);
              console.log('[Task Edit] Full project after update:', project);
              setProjects(updatedProjects);

              // Also update parent state if setter is available
              if (setProjectsData) {
                setProjectsData(updatedProjects);
              }

              // Save to database - update only the specific task
              const updateTaskInDatabase = async () => {
                try {
                  const taskId = existingTask._id || existingTask.id;

                  if (!taskId) {
                    console.error('[Task Edit] Task has no ID, cannot update in database');
                    return;
                  }

                  const response = await fetch(`/api/you/task/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: editTaskName.trim() || existingTask.content,
                      content: editTaskName.trim() || existingTask.content,
                      name: editTaskName.trim() || existingTask.content,
                      duration: parsedDuration,
                      dueDate: parsedDeadline || null
                    })
                  });

                  if (response.ok) {
                    const data = await response.json();
                    console.log('[Task Edit] Task updated in database:', data);

                    // Update the task with the response data to ensure consistency
                    if (data.task) {
                      const finalUpdatedProjects = [...projects];
                      const finalProject = finalUpdatedProjects[projectIndex];
                      if (finalProject && finalProject.tasks && finalProject.tasks[editingTaskIndex]) {
                        // Merge the database response with our local task
                        finalProject.tasks[editingTaskIndex] = {
                          ...finalProject.tasks[editingTaskIndex],
                          ...data.task,
                          // Ensure we keep the fields in the format we expect
                          content: data.task.content || data.task.title || data.task.name,
                          name: data.task.name || data.task.title || data.task.content,
                          title: data.task.title || data.task.content || data.task.name
                        };
                        setProjects(finalUpdatedProjects);
                        if (setProjectsData) {
                          setProjectsData(finalUpdatedProjects);
                        }
                      }
                    }
                  } else {
                    const error = await response.text();
                    console.error('[Task Edit] Failed to update task:', error);
                  }
                } catch (error) {
                  console.error('[Task Edit] Error updating task:', error);
                }
              };
              updateTaskInDatabase();
            }

          // Reset edit mode
          setIsEditingTask(false);
          setEditingTaskIndex(null);
          setEditTaskName('');
          setEditTaskDuration('');
          setEditTaskDeadline('');
          setEditTaskFieldFocus('name');
          // Keep selection on the edited task
          setSelectedTaskIndex(editingTaskIndex);
          console.log('[Task Edit] Saved task changes');
          return;
        }

        // Enter to open popup for current field
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editTaskFieldFocus === 'duration') {
            setShowEditTaskDurationPopup(true);
          } else if (editTaskFieldFocus === 'deadline') {
            setShowEditTaskDeadlinePopup(true);
          }
          return;
        }

        // Tab and Arrow navigation
        if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const fieldOrder: Array<'name' | 'duration' | 'deadline'> = ['name', 'duration', 'deadline'];
          const currentIndex = fieldOrder.indexOf(editTaskFieldFocus);

          if (e.key === 'Tab' && !e.shiftKey) {
            // Move forward
            const nextIndex = (currentIndex + 1) % fieldOrder.length;
            setEditTaskFieldFocus(fieldOrder[nextIndex]);
          } else if (e.key === 'ArrowRight') {
            // Move right
            const nextIndex = (currentIndex + 1) % fieldOrder.length;
            setEditTaskFieldFocus(fieldOrder[nextIndex]);
          } else if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            // Move backward
            const prevIndex = (currentIndex - 1 + fieldOrder.length) % fieldOrder.length;
            setEditTaskFieldFocus(fieldOrder[prevIndex]);
          }
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          // Cancel editing
          setIsEditingTask(false);
          setEditingTaskIndex(null);
          setEditTaskName('');
          setEditTaskDuration('');
          setEditTaskDeadline('');
          setEditTaskFieldFocus('name');
          console.log('[Task Edit] Cancelled editing');
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (editTaskFieldFocus === 'name') {
            setEditTaskName(editTaskName.slice(0, -1));
          } else if (editTaskFieldFocus === 'duration') {
            setEditTaskDuration(editTaskDuration.slice(0, -1));
          } else if (editTaskFieldFocus === 'deadline') {
            // Smart backspace for date
            const len = editTaskDeadline.length;
            if (len === 0) return;
            // If we're right after a slash (positions 3, 6), delete the slash too
            if (len === 3 || len === 6) {
              setEditTaskDeadline(editTaskDeadline.slice(0, -2));
            } else {
              setEditTaskDeadline(editTaskDeadline.slice(0, -1));
            }
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          console.log('[Task Edit Handler] CHARACTER INPUT DETECTED - key:', e.key, 'current name:', editTaskName);
          e.preventDefault();
          if (editTaskFieldFocus === 'name') {
            const newName = editTaskName + e.key;
            console.log('[Task Edit Handler] Setting new name:', newName);
            setEditTaskName(newName);
          } else if (editTaskFieldFocus === 'duration') {
            // Only allow digits for duration
            if (/\d/.test(e.key)) {
              // Limit to 3 digits max (999 minutes)
              if (editTaskDuration.length < 3) {
                setEditTaskDuration(editTaskDuration + e.key);
              }
            }
          } else if (editTaskFieldFocus === 'deadline') {
            // Smart date input for DD/MM/YYYY
            if (/\d/.test(e.key)) {
              const len = editTaskDeadline.length;
              // If already have full date, start fresh
              if (len === 10) {
                setEditTaskDeadline(e.key);
                return;
              }

              let newValue = editTaskDeadline;
              // Auto-add slashes at positions 2 and 5
              if (len === 2 || len === 5) {
                newValue += '/';
              }
              newValue += e.key;

              // Validate as we type
              if (len === 0 && parseInt(e.key) > 3) {
                // First digit of day can't be > 3
                return;
              }
              if (len === 1) {
                const day = parseInt(editTaskDeadline + e.key);
                if (day > 31 || day === 0) return;
              }
              if (len === 3 && parseInt(e.key) > 1) {
                // First digit of month can't be > 1
                return;
              }
              if (len === 4) {
                const month = parseInt(editTaskDeadline.substring(3, 5) + e.key);
                if (month > 12 || month === 0) return;
              }

              setEditTaskDeadline(newValue);
            }
          }
          return;
        }
        return;
      }

      // If typing a task at task level (but NOT editing)
      if (isAtProjectTaskLevel && isTypingTask && !isEditingTask) {
        console.log('[Task Typing] Key:', e.key, 'isTypingTask:', isTypingTask, 'taskInput:', taskInput);
        if (e.key === 'Enter') {
          e.preventDefault();
          console.log('[Task Enter] Processing Enter - currentProjectForTasks:', currentProjectForTasks, 'taskInput:', taskInput, 'projectLevelPosition:', projectLevelPosition, 'isEditingTask:', isEditingTask);

          // Use projectLevelPosition if currentProjectForTasks is null (for newly created projects), but convert from filtered index
          let projectIndex = currentProjectForTasks;
          if (projectIndex === null && projectLevelPosition >= 0) {
            const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
            const currentProj = filteredProjects[projectLevelPosition];
            if (currentProj) {
              projectIndex = projects.findIndex(p => (p.id || p._id) === (currentProj.id || currentProj._id));
            } else {
              projectIndex = projectLevelPosition;
            }
          }

          if (taskInput.trim() && projectIndex >= 0) {
            // Check if we're editing an existing task or creating a new one
            if (isEditingTask && editingTaskIndex !== null) {
              // Update existing task
              console.log('[Task Edit] Updating task at index:', editingTaskIndex, 'with:', taskInput.trim());
              const updatedProjects = [...projects];
              const project = updatedProjects[projectIndex];
              if (project && project.tasks && project.tasks[editingTaskIndex]) {
                const existingTask = project.tasks[editingTaskIndex];
                // Keep existing duration and deadline, just update the content
                project.tasks[editingTaskIndex] = {
                  ...existingTask,
                  content: taskInput.trim(),
                  name: taskInput.trim()
                };
                setProjects(updatedProjects);

                // Save to database
                const updateTaskInDatabase = async () => {
                  try {
                    const taskId = existingTask._id || existingTask.id;

                    if (!taskId) {
                      console.error('[Task Edit] Task has no ID, cannot update in database');
                      return;
                    }

                    const response = await fetch(`/api/you/task/${taskId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: taskInput.trim(),
                        content: taskInput.trim(),
                        name: taskInput.trim()
                      })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      console.log('[Task Edit] Task updated in database:', data);
                    } else {
                      const error = await response.text();
                      console.error('[Task Edit] Failed to update task:', error);
                    }
                  } catch (error) {
                    console.error('[Task Edit] Error updating task:', error);
                  }
                };
                updateTaskInDatabase();
              }

              // Reset edit mode
              setIsEditingTask(false);
              setEditingTaskIndex(null);
              setTaskInput('');
              setIsTypingTask(false);
              setTaskInputPosition(-1);
              // Keep selection on the edited task
              setSelectedTaskIndex(editingTaskIndex);
              return;
            } else {
              // Create new task - show duration popup
              console.log('[Task] Storing task name and showing duration popup for project at index:', projectIndex);
              setPendingTaskData({
                title: taskInput.trim(),
                position: taskInputPosition
              });
              setTempTaskTitle(taskInput.trim());
              setIsTypingTask(false); // Stop typing mode but keep text visible
              setShowDurationPickerPopup(true);

              // Ensure currentProjectForTasks is set
              if (currentProjectForTasks === null) {
                setCurrentProjectForTasks(projectIndex);
              }

              console.log('[Task] Opening duration picker popup');
              return;
            }
          } else if (!taskInput.trim()) {
            // Empty enter - exit typing mode
            setIsTypingTask(false);
            setTaskInput('');
            setTaskInputPosition(-1);
            if (taskInputPosition === -2) {
              setSelectedTaskIndex(0);
            } else if (taskInputPosition === -1) {
              const currentProject = projects[currentProjectForTasks];
              if (currentProject?.tasks?.length > 0) {
                setSelectedTaskIndex(currentProject.tasks.length - 1);
              } else {
                setSelectedTaskIndex(0);
              }
            } else {
              setSelectedTaskIndex(taskInputPosition);
            }
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          // Exit typing mode when using arrow keys
          e.preventDefault();
          const currentProject = projects[currentProjectForTasks || 0];
          const taskCount = currentProject?.tasks?.length || 0;

          // Save current input if exists (optional - remove if you want to discard)
          // if (taskInput.trim()) {
          //   // Could save as draft or create task here
          // }

          // Exit typing mode
          setIsTypingTask(false);
          setTaskInput('');

          // Determine where to navigate based on current position and key
          if (e.key === 'ArrowDown') {
            if (taskInputPosition === -2) {
              // From top input, go to first task
              setSelectedTaskIndex(0);
            } else if (taskInputPosition === -1) {
              // From bottom input, wrap to top
              setSelectedTaskIndex(0);
            } else if (taskInputPosition >= 0) {
              // From inline input, go to next task
              if (taskInputPosition < taskCount - 1) {
                setSelectedTaskIndex(taskInputPosition + 1);
              } else {
                // Go to bottom position
                setSelectedTaskIndex(-1);
                setTaskInputPosition(-1);
                setIsTypingTask(true);
                setTaskInput('');
              }
            }
          } else if (e.key === 'ArrowUp') {
            if (taskInputPosition === -2) {
              // From top input, wrap to last task
              setSelectedTaskIndex(Math.max(0, taskCount - 1));
            } else if (taskInputPosition === -1) {
              // From bottom input, go to last task
              setSelectedTaskIndex(Math.max(0, taskCount - 1));
            } else if (taskInputPosition >= 0) {
              // From inline input, go to current/previous task
              setSelectedTaskIndex(taskInputPosition);
            }
          }

          setTaskInputPosition(-1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsTypingTask(false);
          setTaskInput('');
          setTaskInputPosition(-1);
          setSelectedTaskIndex(0);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (taskInput.length > 0) {
            setTaskInput(taskInput.slice(0, -1));
          } else {
            // Exit typing mode if backspace on empty
            setIsTypingTask(false);
            setTaskInputPosition(-1);
            setSelectedTaskIndex(0);
          }
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setTaskInput(prev => prev + e.key);
        }
        return;
      }

      // Handle Enter key at task level when not typing but in empty project (special case for empty projects)
      if (isAtProjectTaskLevel && !isTypingTask && e.key === 'Enter') {
        console.log('[Empty Project Enter Check] isAtProjectTaskLevel:', isAtProjectTaskLevel, 'isTypingTask:', isTypingTask);
        let projectIndex = currentProjectForTasks;
        if (projectIndex === null && projectLevelPosition >= 0) {
          const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
          const currentProj = filteredProjects[projectLevelPosition];
          if (currentProj) {
            projectIndex = projects.findIndex(p => (p.id || p._id) === (currentProj.id || currentProj._id));
          } else {
            projectIndex = projectLevelPosition;
          }
        }
        const currentProject = projects[projectIndex];
        console.log('[Empty Project Enter Check] projectIndex:', projectIndex, 'currentProject:', currentProject);

        // Check if we're in an empty project (no tasks)
        if (currentProject && (!currentProject.tasks || currentProject.tasks.length === 0)) {
          console.log('[Empty Project Enter] In empty project, taskInput:', taskInput);
          e.preventDefault();
          // If there's text in the input (from previous typing), process it
          if (taskInput && taskInput.trim()) {
            console.log('[Empty Project Enter] Processing existing input:', taskInput);
            // Store task data and show duration popup
            setPendingTaskData({
              title: taskInput.trim(),
              position: -1 // Bottom position for empty project
            });
            setTempTaskTitle(taskInput.trim());
            setIsTypingTask(false);
            setShowDurationPickerPopup(true);

            // Ensure currentProjectForTasks is set
            if (currentProjectForTasks === null) {
              setCurrentProjectForTasks(projectIndex);
            }
            return;
          } else {
            console.log('[Empty Project Enter] No text in input, taskInput is empty');
          }
        } else {
          console.log('[Empty Project Enter] Not in empty project or project not found');
        }
      }

      // Handle character input to start typing at task level (when not already typing or editing)
      // Skip 'e' key as it's used for editing, and 'g' key as it's used for grabbing
      if (isAtProjectTaskLevel && !isTypingTask && !isEditingTask && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== 'e' && e.key !== 'g') {
        let projectIdx = currentProjectForTasks;
        if (projectIdx === null && projectLevelPosition >= 0) {
          const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
          const currentProj = filteredProjects[projectLevelPosition];
          if (currentProj) {
            projectIdx = projects.findIndex(p => (p.id || p._id) === (currentProj.id || currentProj._id));
          } else {
            projectIdx = projectLevelPosition;
          }
        }
        const proj = projects[projectIdx!];
        console.log('[Task Start Typing] Starting to type - key:', e.key, 'projectIndex:', projectIdx, 'hasNoTasks:', !proj?.tasks || proj.tasks.length === 0);

        e.preventDefault();

        // Ensure currentProjectForTasks is set (use projectLevelPosition if not)
        if (currentProjectForTasks === null && projectLevelPosition >= 0) {
          // Get the actual index in the full projects array
          const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
          const currentProject = filteredProjects[projectLevelPosition];
          if (currentProject) {
            const actualProjectIndex = projects.findIndex(p => (p.id || p._id) === (currentProject.id || currentProject._id));
            setCurrentProjectForTasks(actualProjectIndex);
            console.log('[Task Start Typing] Setting currentProjectForTasks to:', actualProjectIndex);
          }
        }

        // Start typing mode
        setIsTypingTask(true);
        setTaskInput(e.key);
        // Set input position based on current state
        if (selectedTaskIndex === -1 || (proj?.tasks?.length === 0)) {
          setTaskInputPosition(-1); // Bottom position for empty or at bottom
          console.log('[Task Start Typing] Set position to -1 (bottom) for empty project');
        } else {
          setTaskInputPosition(selectedTaskIndex); // After current task
          console.log('[Task Start Typing] Set position to:', selectedTaskIndex);
        }
        console.log('[Task Start Typing] Now in typing mode with initial char:', e.key);
        return;
      }

      // Handle 'g' key or Enter to grab/release a task - but not when editing
      if ((e.key === 'g' || (e.key === 'Enter' && grabbedTaskIndex !== null)) && isAtProjectTaskLevel && !isTypingTask && !isEditingTask && selectedTaskIndex >= 0 && currentProjectForTasks !== null) {
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];

        if (grabbedTaskIndex === null && e.key === 'g') {
          // Start grabbing
          console.log('[Task Grab] Entering grab mode for task at index:', selectedTaskIndex);
          setGrabbedTaskIndex(selectedTaskIndex);
          setGrabbedTaskOriginalIndex(selectedTaskIndex);
        } else if (grabbedTaskIndex !== null && (e.key === 'g' || e.key === 'Enter')) {
          // Release the task
          console.log('[Task Grab] Releasing task at new position:', selectedTaskIndex);
          setGrabbedTaskIndex(null);
          setGrabbedTaskOriginalIndex(null);

          // Save new order to database
          const projectId = currentProject.id || currentProject._id;
          if (projectId && currentProject.tasks) {
            const taskIds = currentProject.tasks.map((t: any) => t._id || t.id);
            fetch(`/api/projects/${projectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tasks: taskIds
              })
            }).then(response => {
              if (!response.ok) {
                console.error('[Task Grab] Failed to persist task order');
              } else {
                console.log('[Task Grab] Task order persisted successfully');
              }
            }).catch(error => {
              console.error('[Task Grab] Error persisting task order:', error);
            });
          }
        }
        return;
      }

      // Handle Cmd+Enter to complete/uncomplete a task
      if (isAtProjectTaskLevel && !isTypingTask && selectedTaskIndex >= 0 && e.key === 'Enter' && (e.metaKey || e.ctrlKey) && currentProjectForTasks !== null) {
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];
        if (currentProject && currentProject.tasks && currentProject.tasks[selectedTaskIndex]) {
          const task = currentProject.tasks[selectedTaskIndex];
          const updatedTask = {
            ...task,
            completed: !task.completed,
            metadata: {
              ...task.metadata,
              completed: !task.completed
            }
          };

          // Update local state
          const updatedProjects = [...projects];
          updatedProjects[currentProjectForTasks].tasks[selectedTaskIndex] = updatedTask;
          setProjects(updatedProjects);

          // Persist to database
          const taskId = task._id || task.id;
          if (taskId && !taskId.startsWith('temp-')) {
            fetch(`/api/you/task/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: updatedTask.completed })
            }).then(() => {
              // Notify parent to refresh timeline
              if (onTaskUpdate) {
                onTaskUpdate();
              }
            }).catch(error => {
              console.error('[Task] Error updating task completion:', error);
            });
          }

          console.log('[Task] Toggled completion for task:', task.content, 'to:', updatedTask.completed);
        }
        return;
      }

      // Handle Cmd+Backspace or Cmd+Delete to delete a task
      if (isAtProjectTaskLevel && !isTypingTask && selectedTaskIndex >= 0 && (e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey) && currentProjectForTasks !== null) {
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];
        if (currentProject && currentProject.tasks && currentProject.tasks[selectedTaskIndex]) {
          const task = currentProject.tasks[selectedTaskIndex];

          // Update local state - remove the task
          const updatedProjects = [...projects];
          updatedProjects[currentProjectForTasks].tasks = currentProject.tasks.filter((_, index) => index !== selectedTaskIndex);
          setProjects(updatedProjects);

          // Adjust selected task index if needed
          if (selectedTaskIndex >= updatedProjects[currentProjectForTasks].tasks.length) {
            setSelectedTaskIndex(Math.max(0, updatedProjects[currentProjectForTasks].tasks.length - 1));
          }

          // Persist deletion to database
          const taskId = task._id || task.id;
          if (taskId && !taskId.startsWith('temp-')) {
            fetch(`/api/you/task/${taskId}`, {
              method: 'DELETE'
            }).catch(error => {
              console.error('[Task] Error deleting task:', error);
              // Rollback on error
              setProjects(projects);
            });
          }

          console.log('[Task] Deleted task:', task.content);
        }
        return;
      }

      // Handle Enter key at task level to create inline input (only when not grabbed)
      if (isAtProjectTaskLevel && !isTypingTask && selectedTaskIndex >= 0 && e.key === 'Enter' && currentProjectForTasks !== null && grabbedTaskIndex === null) {
        e.preventDefault();
        const currentProject = projects[currentProjectForTasks];
        if (currentProject) {
          // Show input after current task
          setTaskInputPosition(selectedTaskIndex);
          setSelectedTaskIndex(selectedTaskIndex + 0.5); // Use fractional index for inline input
          setIsTypingTask(true);
          setTaskInput('');
          console.log('[Task] Showing inline input after task:', selectedTaskIndex);
        }
        return;
      }

      // If typing a project name at project level
      if (isAtProjectLevel && isTypingProject) {
        if (e.key === 'Enter') {
          e.preventDefault();

          if (projectInputStep === 'name' || !projectInputStep) {
            if (projectInput.trim()) {
              // Store project name and position, then show goal selection popup
              console.log('[Input] Creating project with name:', projectInput.trim());
              setPendingProjectData({
                name: projectInput.trim(),
                position: projectLevelPosition
              });
              // Store the project name for display
              setTempProjectName(projectInput.trim());
              // Keep the project input showing while popup is open
              // setProjectInput(''); // Don't clear this
              setProjectInputStep(null);
              setIsTypingProject(false); // Stop typing mode but keep text visible
              setShowGoalSelectionPopup(true);
              console.log('[Input] Opening goal selection popup');
              return;
            } else {
              setProjectInput('');
              setProjectInputStep(null);
              setTempProjectName('');
              setTempProjectDeadline('');
              if (projectLevelPosition === -2) {
                if (projects.length > 0) {
                  setProjectLevelPosition(0);
                  setIsTypingProject(false);
                } else {
                  setProjectLevelPosition(-1);
                }
              } else if (projectLevelPosition < -2) {
                const originalProjectIndex = Math.abs(projectLevelPosition) - 3;
                setProjectLevelPosition(originalProjectIndex);
                setIsTypingProject(false);
              }
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();

          if (projectLevelPosition < -2) {
            const originalProjectIndex = Math.abs(projectLevelPosition) - 3;
            setProjectLevelPosition(originalProjectIndex);
            setIsTypingProject(false);
            setProjectInput('');
          } else {
            setIsAtProjectLevel(false);
            setIsTypingProject(false);
            setProjectInput('');
            setProjectViewMode('active'); // Reset to active view when exiting
          }
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (projectInput.length > 0) {
            setProjectInput(projectInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();

          if (projectInputStep === 'deadline') {
            if (/[\d\/\-\.]/.test(e.key)) {
              let newInput = projectInput + e.key;

              if (projectInput.length === 2 && /\d/.test(e.key) && !projectInput.includes('/')) {
                newInput = projectInput + '/' + e.key;
              } else if (projectInput.length === 5 && /\d/.test(e.key) && projectInput.split('/').length === 2) {
                newInput = projectInput + '/' + e.key;
              }

              if (newInput.replace(/[\/\-\.]/g, '').length <= 8) {
                setProjectInput(newInput);
              }
            }
          } else {
            setProjectInput(prev => prev + e.key);
          }
          return;
        }
      }

      // If typing a routine name at routine level
      if (isAtRoutineLevel && isTypingRoutine) {
        if (e.key === 'Enter') {
          e.preventDefault();

          if (routineInputStep === 'name') {
            if (routineInput.trim()) {
              // Store routine name and position, then show goal selection popup
              console.log('[Routine Input] Creating routine with name:', routineInput.trim());
              setPendingRoutineData({
                name: routineInput.trim(),
                position: routineLevelPosition
              });
              // Store the routine name for display
              setTempRoutineName(routineInput.trim());
              // Stop typing mode but keep text visible
              setRoutineInputStep(null);
              setIsTypingRoutine(false);
              setShowRoutineGoalSelectionPopup(true);
              console.log('[Routine Input] Opening goal selection popup');
              return;
            } else {
              setRoutineInput('');
              setRoutineInputStep(null);
              setTempRoutineName('');
              setTempRoutineTime('');
              if (routineLevelPosition === -2) {
                if (routines.length > 0) {
                  setRoutineLevelPosition(0);
                  setIsTypingRoutine(false);
                } else {
                  setRoutineLevelPosition(-1);
                }
              } else if (routineLevelPosition < -2) {
                const originalRoutineIndex = Math.abs(routineLevelPosition) - 3;
                setRoutineLevelPosition(originalRoutineIndex);
                setIsTypingRoutine(false);
              }
            }
          } else if (routineInputStep === 'time') {
            const timeInput = routineInput.trim();

            const newRoutine: Item = {
              id: `routine-${Date.now()}`,
              name: tempRoutineName,
              content: tempRoutineName, // Store in both for compatibility
              time: timeInput || '07:00',
              completed: false,
              goalId: tempRoutineGoalId || undefined,
              metadata: {
                startTime: timeInput || '07:00',
                goalId: tempRoutineGoalId || undefined,
                startDate: tempRoutineStartDate || undefined,
                endDate: tempRoutineEndDate || undefined,
                days: tempRoutineDays || undefined
              }
            };

            if (routineLevelPosition === -2) {
              const updatedRoutines = [newRoutine, ...routines];
              setRoutines(updatedRoutines);
              setRoutineLevelPosition(0);
              setIsTypingRoutine(false);
              console.log('[Inventory] Routine created at top');
            } else if (routineLevelPosition === -1) {
              const updatedRoutines = [...routines, newRoutine];
              setRoutines(updatedRoutines);
              console.log('[Inventory] Routine created at bottom');
            } else if (routineLevelPosition < -2) {
              const insertAfterIndex = Math.abs(routineLevelPosition) - 3;
              const newRoutines = [...routines];
              newRoutines.splice(insertAfterIndex + 1, 0, newRoutine);
              setRoutines(newRoutines);
              setRoutineLevelPosition(insertAfterIndex + 1);
              setIsTypingRoutine(false);
              console.log('[Inventory] Routine inserted after index', insertAfterIndex);
            }

            setRoutineInput('');
            setRoutineInputStep('name');
            setTempRoutineName('');
            setTempRoutineTime('');
            setTempRoutineGoalId(null);
            setTempRoutineStartDate(null);
            setTempRoutineEndDate(null);
            setTempRoutineDays(null);
            setPendingRoutineData(null);

            if (routineLevelPosition === -1) {
              setIsTypingRoutine(true);
            } else {
              setIsTypingRoutine(false);
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();

          if (routineLevelPosition < -2) {
            const originalRoutineIndex = Math.abs(routineLevelPosition) - 3;
            setRoutineLevelPosition(originalRoutineIndex);
            setIsTypingRoutine(false);
            setRoutineInput('');
          } else {
            setIsAtRoutineLevel(false);
            setIsTypingRoutine(false);
            setRoutineInput('');
          }
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (routineInput.length > 0) {
            setRoutineInput(routineInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setRoutineInput(prev => prev + e.key);
          return;
        }
      }

      // If typing an admin task at admin level
      if (isAtAdminLevel && isTypingAdmin) {
        console.log('[Admin Debug] isTypingAdmin:', isTypingAdmin, 'adminInputStep:', adminInputStep, 'adminInput:', adminInput);
        if (e.key === 'Enter') {
          e.preventDefault();

          if (adminInputStep === 'name') {
            if (adminInput.trim()) {
              // Store admin task name and position, then show goal selection popup
              console.log('[Admin Input] Creating admin task with name:', adminInput.trim());
              console.log('[Admin Input] Position:', adminLevelPosition);
              setPendingAdminData({
                name: adminInput.trim(),
                position: adminLevelPosition
              });
              // Store the admin task name for display
              setTempAdminName(adminInput.trim());
              // Stop typing mode but keep text visible
              setAdminInputStep(null);
              setIsTypingAdmin(false);
              setShowAdminGoalSelectionPopup(true);
              console.log('[Admin Input] Opening goal selection popup - showAdminGoalSelectionPopup will be true');
              return;
            } else {
              // Empty input - cancel
              setAdminInput('');
              setAdminInputStep(null);
              setTempAdminName('');
              setTempAdminPriority('');
              if (adminLevelPosition === -2) {
                if (adminTasks.length > 0) {
                  setAdminLevelPosition(0);
                  setIsTypingAdmin(false);
                } else {
                  setAdminLevelPosition(-1);
                }
              } else if (adminLevelPosition < -2) {
                const originalAdminIndex = Math.abs(adminLevelPosition) - 3;
                setAdminLevelPosition(originalAdminIndex);
                setIsTypingAdmin(false);
              }
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setAdminInput('');
          setAdminInputStep(null);
          setTempAdminName('');
          setTempAdminPriority('');
          if (adminLevelPosition < -2) {
            const originalAdminIndex = Math.abs(adminLevelPosition) - 3;
            setAdminLevelPosition(originalAdminIndex);
            setIsTypingAdmin(false);
            setAdminInput('');
          } else {
            setIsAtAdminLevel(false);
            setIsTypingAdmin(false);
            setAdminInput('');
            setAdminTaskViewMode('active'); // Reset to active view when exiting
          }
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (adminInput.length > 0) {
            setAdminInput(adminInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setAdminInput(prev => prev + e.key);
          return;
        }
      }

      // If typing an event at event level
      if (isAtEventLevel && isTypingEvent) {
        if (e.key === 'Enter') {
          e.preventDefault();

          if (eventInputStep === 'name') {
            if (eventInput.trim()) {
              // Store event name and position, then show goal selection popup
              console.log('[Event Input] Creating event with name:', eventInput.trim());
              console.log('[Event Input] Position:', eventLevelPosition);
              setPendingEventData({
                name: eventInput.trim(),
                position: eventLevelPosition
              });
              // Store the event name for display
              setTempEventName(eventInput.trim());
              // Stop typing mode but keep text visible
              setEventInputStep(null);
              setIsTypingEvent(false);
              setShowEventGoalSelectionPopup(true);
              console.log('[Event Input] Opening goal selection popup');
              return;
            } else {
              // Empty input - cancel
              setEventInput('');
              setEventInputStep(null);
              setTempEventName('');
              setTempEventDate('');
              if (eventLevelPosition === -2) {
                if (events.length > 0) {
                  setEventLevelPosition(0);
                  setIsTypingEvent(false);
                } else {
                  setEventLevelPosition(-1);
                }
              } else if (eventLevelPosition < -2) {
                const originalEventIndex = Math.abs(eventLevelPosition) - 3;
                setEventLevelPosition(originalEventIndex);
                setIsTypingEvent(false);
              }
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEventInput('');
          setEventInputStep(null);
          setTempEventName('');
          setTempEventDate('');
          if (eventLevelPosition < -2) {
            const originalEventIndex = Math.abs(eventLevelPosition) - 3;
            setEventLevelPosition(originalEventIndex);
            setIsTypingEvent(false);
            setEventInput('');
          } else {
            setIsAtEventLevel(false);
            setIsTypingEvent(false);
            setEventInput('');
            setEventViewMode('upcoming'); // Reset to upcoming view when exiting
          }
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (eventInput.length > 0) {
            setEventInput(eventInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setEventInput(prev => prev + e.key);
          return;
        }
      }

      // If typing a routine task at routine task level
      if (isAtRoutineTaskLevel && isTypingRoutineTask && currentRoutineForTasks !== null) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (routineTaskInput.trim()) {
            // Show duration popup for the task - keep the input text visible
            setSelectedTaskForDuration({
              index: routineTaskInputPosition, // Store position for later
              name: routineTaskInput.trim()
            });
            setShowRoutineTaskDurationPopup(true);
            console.log('[Routine Task] Showing duration popup for new task:', routineTaskInput.trim());
          } else {
            // Empty input - cancel
            setRoutineTaskInput('');
            setIsTypingRoutineTask(false);
            setRoutineTaskInputPosition(-1);

            // Return to navigation
            if (routineTaskInputPosition === -2 || routineTaskInputPosition === -1) {
              const currentRoutine = routines[currentRoutineForTasks];
              if (currentRoutine?.tasks?.length > 0) {
                setSelectedRoutineTaskIndex(0);
              } else {
                setSelectedRoutineTaskIndex(-1);
              }
            } else {
              setSelectedRoutineTaskIndex(Math.floor(selectedRoutineTaskIndex));
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Cancel input
          setRoutineTaskInput('');
          setIsTypingRoutineTask(false);
          setRoutineTaskInputPosition(-1);

          // Return to navigation
          if (routineTaskInputPosition === -2 || routineTaskInputPosition === -1) {
            const currentRoutine = routines[currentRoutineForTasks];
            if (currentRoutine?.tasks?.length > 0) {
              setSelectedRoutineTaskIndex(0);
            } else {
              setSelectedRoutineTaskIndex(-1);
            }
          } else {
            setSelectedRoutineTaskIndex(Math.floor(selectedRoutineTaskIndex));
          }
          console.log('[Routine Task] Cancelled input');
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (routineTaskInput.length > 0) {
            setRoutineTaskInput(routineTaskInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setRoutineTaskInput(prev => prev + e.key);
          return;
        }
      }

      // Handle arrow navigation ONLY when at goal level (user must Tab into goals first)
      if (isAtGoalLevel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        console.log('[Navigation Debug] Arrow key at goal level');
        e.preventDefault();

        // If in grab mode, move the goal
        if (grabbedGoalIndex !== null) {
          if (e.key === 'ArrowDown' && grabbedGoalIndex < goals.length - 1) {
            const newIndex = grabbedGoalIndex + 1;
            console.log('[Grab] Moving goal down from', grabbedGoalIndex, 'to', newIndex);

            // Swap the goals
            const newGoals = [...goals];
            [newGoals[grabbedGoalIndex], newGoals[newIndex]] = [newGoals[newIndex], newGoals[grabbedGoalIndex]];
            setGoals(newGoals);

            // Update indices to follow the goal
            setGrabbedGoalIndex(newIndex);
            setGoalLevelPosition(newIndex);
            return;
          } else if (e.key === 'ArrowUp' && grabbedGoalIndex > 0) {
            const newIndex = grabbedGoalIndex - 1;
            console.log('[Grab] Moving goal up from', grabbedGoalIndex, 'to', newIndex);

            // Swap the goals
            const newGoals = [...goals];
            [newGoals[grabbedGoalIndex], newGoals[newIndex]] = [newGoals[newIndex], newGoals[grabbedGoalIndex]];
            setGoals(newGoals);

            // Update indices to follow the goal
            setGrabbedGoalIndex(newIndex);
            setGoalLevelPosition(newIndex);
            return;
          }
          return; // Don't do normal navigation when in grab mode
        }

        // Normal navigation when not in grab mode
        if (e.key === 'ArrowDown') {
          console.log('[Navigation Debug] ArrowDown - current position:', goalLevelPosition, 'goals.length:', goals.length);
          // Clear empty input when navigating away
          if (goalLevelPosition === -1 && goalInput.trim() === '') {
            setGoalInput('');
          }

          if (goalLevelPosition === -1) {
            // At bottom input position, wrap to top (first goal or top input)
            console.log('[Navigation Debug] At bottom input position, wrapping to top');
            if (goals.length > 0) {
              // Wrap to first goal
              setGoalLevelPosition(0);
              setIsTypingGoal(false);
              setGoalInput('');
              setInputStep(null);
              console.log('[Navigation] Wrapping from bottom to first goal');
            } else {
              // No goals, wrap to top input position
              setGoalLevelPosition(-2);
              setIsTypingGoal(true);
              setGoalInput('');
              setInputStep(null);
              console.log('[Navigation] Wrapping from bottom to top input');
            }
          } else if (goalLevelPosition < goals.length - 1) {
            // Move to next goal
            setGoalLevelPosition(goalLevelPosition + 1);
            console.log('[Navigation] Moving to goal', goalLevelPosition + 1);
          } else {
            // At last goal, move to bottom input position
            setGoalLevelPosition(-1);
            setIsTypingGoal(true);
            setGoalInput('');
            console.log('[Navigation] Moving to bottom input position');
          }
        } else if (e.key === 'ArrowUp') {
          // Clear empty input when navigating away
          if (goalLevelPosition === -1 && goalInput.trim() === '') {
            setGoalInput('');
          }

          if (goalLevelPosition === -1) {
            // At bottom input, move to last goal if exists
            if (goals.length > 0) {
              setGoalLevelPosition(goals.length - 1);
              setIsTypingGoal(false);
              setGoalInput('');
              setInputStep(null);
              console.log('[Navigation] Moving from bottom input to last goal');
            } else {
              // No goals, create position for new top input
              setGoalLevelPosition(-2); // -2 means top input position
              setIsTypingGoal(true);
              setGoalInput('');
              setInputStep(null);
              console.log('[Navigation] Moving to top input position');
            }
          } else if (goalLevelPosition === 0) {
            // At first goal, move to top input position (above all goals)
            setGoalLevelPosition(-2); // -2 for top position
            setIsTypingGoal(true);
            setGoalInput('');
            console.log('[Navigation] Moving to top input position');
          } else if (goalLevelPosition === -2) {
            // At top input, wrap to bottom input
            setGoalLevelPosition(-1);
            setIsTypingGoal(true);
            setGoalInput('');
            console.log('[Navigation] Wrapping from top to bottom input');
          } else {
            // Move to previous goal
            setGoalLevelPosition(goalLevelPosition - 1);
            console.log('[Navigation] Moving to goal', goalLevelPosition - 1);
          }
        }
        return;
      }

      // If typing a goal name at goal level
      if (isAtGoalLevel && isTypingGoal) {
        if (e.key === 'Enter') {
          e.preventDefault();

          if (inputStep === 'name') {
            // First step: name input
            if (goalInput.trim()) {
              // Move to deadline step
              setTempGoalName(goalInput.trim());
              setGoalInput('');
              setInputStep('deadline');
              console.log('[Input] Moving to deadline step');
            } else {
              // Empty name, exit input mode
              setGoalInput('');
              setInputStep(null);
              setTempGoalName('');
              setTempGoalDeadline('');
              if (goalLevelPosition === -2) {
                // If at top empty position, remove it by moving down
                if (goals.length > 0) {
                  setGoalLevelPosition(0);
                  setIsTypingGoal(false);
                } else {
                  setGoalLevelPosition(-1);
                }
              } else if (goalLevelPosition < -2) {
                // Was inserting in middle, go back to the goal
                const originalGoalIndex = Math.abs(goalLevelPosition) - 3;
                setGoalLevelPosition(originalGoalIndex);
                setIsTypingGoal(false);
              }
            }
          } else if (inputStep === 'deadline') {
            // Second step: deadline input - validate date format if provided
            const dateInput = goalInput.trim();
            let formattedDate = undefined;

            if (dateInput) {
              // Try to parse the date - handle both MM/DD/YYYY and DD/MM/YYYY
              const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
              const match = dateInput.match(dateRegex);

              if (match) {
                const [_, first, second, year] = match;
                let monthNum = parseInt(first);
                let dayNum = parseInt(second);
                const yearNum = parseInt(year);

                // If first number > 12, assume DD/MM/YYYY format
                if (monthNum > 12 && dayNum <= 12) {
                  [monthNum, dayNum] = [dayNum, monthNum];
                }

                // Create date object to validate
                const date = new Date(yearNum, monthNum - 1, dayNum);

                // Check if the date components match (validates things like Feb 31)
                if (date.getMonth() === monthNum - 1 &&
                    date.getDate() === dayNum &&
                    date.getFullYear() === yearNum &&
                    yearNum >= 2000 && yearNum <= 2100) {
                  // Valid date - format as MM/DD/YYYY
                  formattedDate = `${monthNum.toString().padStart(2, '0')}/${dayNum.toString().padStart(2, '0')}/${yearNum}`;
                  console.log('[Input] Valid date entered:', formattedDate);
                } else {
                  console.log('[Input] Invalid date:', dateInput, 'parsed as M:', monthNum, 'D:', dayNum, 'Y:', yearNum);
                }
              } else if (dateInput.length > 0) {
                console.log('[Input] Date not in expected format:', dateInput);
              }
            }

            // Create goal even if date is invalid (just without deadline)
            const tempId = `temp-${Date.now()}`;
            const newGoal: Goal = {
              id: tempId,
              name: tempGoalName,
              isExpanded: false,
              deadline: formattedDate
            };

            console.log('[DEBUG] Creating goal:', {
              name: tempGoalName,
              deadline: formattedDate,
              rawInput: dateInput,
              position: goalLevelPosition
            });

            // Function to save the goal to database
            const saveGoalToDatabase = async (goal: Goal, order: number) => {
              try {
                const response = await fetch('/api/you/goals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: goal.name,
                    deadline: goal.deadline ? new Date(goal.deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    order: order
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.goal) {
                    // Update the goal with the real ID from database
                    setGoals(prevGoals =>
                      prevGoals.map(g => g.id === tempId ? { ...g, id: data.goal._id || data.goal.id } : g)
                    );
                    console.log('[InventoryView] Goal saved with ID:', data.goal._id || data.goal.id);
                  }
                } else {
                  console.error('[InventoryView] Failed to save goal:', await response.text());
                }
              } catch (error) {
                console.error('[InventoryView] Error saving goal:', error);
              }
            };

            if (goalLevelPosition === -2) {
              // At top position, insert at beginning
              const updatedGoals = [newGoal, ...goals];
              setGoals(updatedGoals);
              setGoalLevelPosition(0);
              setIsTypingGoal(false);
              console.log('[Inventory] Goal created at top with deadline:', formattedDate);
              console.log('[DEBUG] Updated goals array:', updatedGoals);
              saveGoalToDatabase(newGoal, 0);
            } else if (goalLevelPosition === -1) {
              // At bottom position, append at end
              const updatedGoals = [...goals, newGoal];
              setGoals(updatedGoals);
              console.log('[Inventory] Goal created at bottom with deadline:', formattedDate);
              console.log('[DEBUG] Updated goals array:', updatedGoals);
              saveGoalToDatabase(newGoal, goals.length);
            } else if (goalLevelPosition < -2) {
              // Middle insert position: -3 = after goal 0, -4 = after goal 1, etc.
              const insertAfterIndex = Math.abs(goalLevelPosition) - 3;
              const newGoals = [...goals];
              newGoals.splice(insertAfterIndex + 1, 0, newGoal);
              setGoals(newGoals);
              setGoalLevelPosition(insertAfterIndex + 1);
              setIsTypingGoal(false);
              console.log('[Inventory] Goal inserted after index', insertAfterIndex, 'with deadline:', formattedDate);
              saveGoalToDatabase(newGoal, insertAfterIndex + 1);
            }

            // Reset for next goal
            setGoalInput('');
            setInputStep('name');
            setTempGoalName('');
            setTempGoalDeadline('');

            // Stay typing for next goal if at bottom position, otherwise stop typing
            if (goalLevelPosition === -1) {
              // At bottom position, stay typing for convenience
              setIsTypingGoal(true);
            } else {
              // Was at top or middle position, stop typing
              setIsTypingGoal(false);
            }
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();

          // If in middle insert, cancel and go back to the goal
          if (goalLevelPosition < -2) {
            const originalGoalIndex = Math.abs(goalLevelPosition) - 3;
            setGoalLevelPosition(originalGoalIndex);
            setIsTypingGoal(false);
            setGoalInput('');
          } else {
            // Otherwise exit goal level completely
            setIsAtGoalLevel(false);
            setIsTypingGoal(false);
            setGoalInput('');
          }
          return;
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          if (goalInput.length > 0) {
            setGoalInput(goalInput.slice(0, -1));
          }
          return;
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          // Continue typing
          e.preventDefault();

          if (inputStep === 'deadline') {
            // For deadline input, only allow numbers and date separators
            if (/[\d\/\-\.]/.test(e.key)) {
              // Auto-add slashes for date format
              let newInput = goalInput + e.key;

              // Auto-insert slashes after MM and DD
              if (goalInput.length === 2 && /\d/.test(e.key) && !goalInput.includes('/')) {
                // After 2 digits (MM), add slash before the new digit
                newInput = goalInput + '/' + e.key;
              } else if (goalInput.length === 5 && /\d/.test(e.key) && goalInput.split('/').length === 2) {
                // After MM/DD, add slash before the year digit
                newInput = goalInput + '/' + e.key;
              }

              // Limit to 10 characters (MM/DD/YYYY)
              if (newInput.replace(/[\/\-\.]/g, '').length <= 8) {
                setGoalInput(newInput);
              }
            }
          } else {
            setGoalInput(prev => prev + e.key);
          }
          return;
        }
        // Don't return here - let arrow keys pass through
      }

      // Handle Tab key to enter/exit levels (similar to timeline's block entry)
      if (e.key === 'Tab') {
        e.preventDefault();

        if (cursorPosition === 'goals' && !isAtGoalLevel) {
          // Tab at goal section level - enter "goal level"
          setIsAtGoalLevel(true);

          // If goals exist, start at the first goal; otherwise start at input
          if (goals.length > 0) {
            setGoalLevelPosition(0);  // Start at first existing goal
            setIsTypingGoal(false);   // Not typing
            console.log('[Inventory] Entered goal level - starting at first goal');
          } else {
            // No goals, start at input position
            setGoalLevelPosition(-1); // Start at input position
            setIsTypingGoal(true);
            setGoalInput('');
            setInputStep('name'); // Start with name input
            setTempGoalName('');
            setTempGoalDeadline('');
            console.log('[Inventory] Entered goal level - input ready (no goals)');
          }
        } else if (isAtGoalLevel && e.shiftKey) {
          // Shift+Tab to exit goal level
          setIsAtGoalLevel(false);
          setGoalLevelPosition(-1);
          setIsTypingGoal(false);
          setGoalInput('');
          console.log('[Inventory] Exited goal level');
        } else if (cursorPosition === 'projects' && !isAtProjectLevel) {
          // Tab at projects section - enter "project level"
          setIsAtProjectLevel(true);

          // If projects exist, start at the first project; otherwise start at input
          if (projects.length > 0) {
            setProjectLevelPosition(0);  // Start at first existing project
            setIsTypingProject(false);   // Not typing
            console.log('[Inventory] Entered project level - starting at first project');
          } else {
            // No projects, start at input position
            setProjectLevelPosition(-1); // Start at input position
            setIsTypingProject(true);
            setProjectInput('');
            setProjectInputStep('name'); // Start with name input
            setTempProjectName('');
            setTempProjectDeadline('');
            console.log('[Inventory] Entered project level - input ready (no projects)');
          }
        } else if (isAtProjectLevel && !isAtProjectTaskLevel && projectLevelPosition >= 0) {
          // Tab while at project level on a specific project - enter task level
          // Get the project from the filtered list, then find its actual index in the full array
          const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
          const currentProject = filteredProjects[projectLevelPosition];
          if (currentProject) {
            // Find the actual index in the full projects array
            const actualProjectIndex = projects.findIndex(p => (p.id || p._id) === (currentProject.id || currentProject._id));
            setIsAtProjectTaskLevel(true);
            setCurrentProjectForTasks(actualProjectIndex);
            // Always go to bottom input for quick task creation
            setSelectedTaskIndex(-1);
            setTaskInputPosition(-1);
            setIsTypingTask(true);
            setTaskInput('');
            console.log('[Inventory] Entered project task level at bottom input for quick task creation, actualProjectIndex:', actualProjectIndex);
          }
        } else if (isAtProjectTaskLevel && e.shiftKey) {
          // Shift+Tab to exit task level back to project level
          setIsAtProjectTaskLevel(false);
          setSelectedTaskIndex(0);
          setIsTypingTask(false);
          setTaskInput('');
          setTaskInputPosition(-1);
          console.log('[Inventory] Exited project task level back to project level');
        } else if (isAtProjectLevel && !isAtProjectTaskLevel && e.shiftKey) {
          // Shift+Tab to exit project level
          setIsAtProjectLevel(false);
          setIsAtProjectTaskLevel(false);
          setProjectLevelPosition(-1);
          setIsTypingProject(false);
          setProjectInput('');
          setProjectViewMode('active'); // Reset to active view when exiting
          console.log('[Inventory] Exited project level');
        } else if (cursorPosition === 'routines' && !isAtRoutineLevel) {
          // Tab at routines section - enter "routine level"
          setIsAtRoutineLevel(true);

          if (routines.length > 0) {
            setRoutineLevelPosition(0);
            setIsTypingRoutine(false);
            console.log('[Inventory] Entered routine level - starting at first routine');
          } else {
            setRoutineLevelPosition(-1);
            setIsTypingRoutine(true);
            setRoutineInput('');
            setRoutineInputStep('name');
            setTempRoutineName('');
            setTempRoutineTime('');
            console.log('[Inventory] Entered routine level - input ready (no routines)');
          }
        } else if (isAtRoutineLevel && !isAtRoutineTaskLevel && routineLevelPosition >= 0) {
          // Tab while at routine level on a specific routine - enter task level
          const currentRoutine = routines[routineLevelPosition];
          if (currentRoutine) {
            setIsAtRoutineTaskLevel(true);
            setCurrentRoutineForTasks(routineLevelPosition);
            // Always go to bottom input for quick task creation
            setSelectedRoutineTaskIndex(-1);
            setRoutineTaskInputPosition(-1);
            setIsTypingRoutineTask(true);
            setRoutineTaskInput('');
            console.log('[Inventory] Entered routine task level at bottom input for quick task creation');
          }
        } else if (isAtRoutineTaskLevel && e.shiftKey && editingRoutineTaskRef.current === null && editingRoutineTaskIndex === null) {
          // Shift+Tab to exit routine task level back to routine level (but not when editing)
          setIsAtRoutineTaskLevel(false);
          setCurrentRoutineForTasks(null);
          setSelectedRoutineTaskIndex(-1);
          setRoutineTaskInputPosition(-1);
          setIsTypingRoutineTask(false);
          setRoutineTaskInput('');
          console.log('[Inventory] Exited routine task level');
        } else if (isAtRoutineLevel && e.shiftKey) {
          // Shift+Tab to exit routine level
          setIsAtRoutineLevel(false);
          setRoutineLevelPosition(-1);
          setIsTypingRoutine(false);
          setRoutineInput('');
          console.log('[Inventory] Exited routine level');
        } else if (cursorPosition === 'admin' && !isAtAdminLevel) {
          // Tab at admin section - enter "admin level"
          setIsAtAdminLevel(true);

          if (adminTasks.length > 0) {
            setAdminLevelPosition(0);
            setIsTypingAdmin(false);
            console.log('[Inventory] Entered admin level - starting at first task');
          } else {
            setAdminLevelPosition(-1);
            setIsTypingAdmin(true);
            setAdminInput('');
            setAdminInputStep('name');
            setTempAdminName('');
            setTempAdminPriority('');
            console.log('[Inventory] Entered admin level - input ready (no tasks)');
          }
        } else if (isAtAdminLevel && e.shiftKey) {
          // Shift+Tab to exit admin level
          setIsAtAdminLevel(false);
          setAdminLevelPosition(-1);
          setIsTypingAdmin(false);
          setAdminInput('');
          setAdminTaskViewMode('active'); // Reset to active view when exiting
          console.log('[Inventory] Exited admin level');
        } else if (cursorPosition === 'events' && !isAtEventLevel) {
          // Tab at events section - enter "event level"
          setIsAtEventLevel(true);

          if (events.length > 0) {
            setEventLevelPosition(0);
            setIsTypingEvent(false);
            console.log('[Inventory] Entered event level - starting at first event');
          } else {
            setEventLevelPosition(-1);
            setIsTypingEvent(true);
            setEventInput('');
            setEventInputStep('name');
            setTempEventName('');
            setTempEventDate('');
            console.log('[Inventory] Entered event level - input ready (no events)');
          }
        } else if (isAtEventLevel && e.shiftKey) {
          // Shift+Tab to exit event level
          setIsAtEventLevel(false);
          setEventLevelPosition(-1);
          setIsTypingEvent(false);
          setEventInput('');
          setEventViewMode('upcoming'); // Reset to upcoming view when exiting
          console.log('[Inventory] Exited event level');
        } else if (cursorPosition === 'empty') {
          // Enter goals section
          setCursorPosition('goals');
        }
        return;
      }

      // Simple navigation between sections
      if (e.key === 'ArrowDown' && !isAtGoalLevel && !isAtProjectLevel && !isAtRoutineLevel && !isAtAdminLevel && !isAtEventLevel) {
        e.preventDefault();
        const sections: Array<'empty' | 'goals' | 'projects' | 'routines' | 'admin' | 'events'> = ['empty', 'goals', 'projects', 'routines', 'admin', 'events'];
        const currentIndex = sections.indexOf(cursorPosition);
        if (currentIndex < sections.length - 1) {
          // Skip empty -> goals if no goals
          if (sections[currentIndex + 1] === 'goals' && goals.length === 0 && currentIndex === 0) {
            setCursorPosition('projects');
          } else {
            setCursorPosition(sections[currentIndex + 1]);
          }
          console.log('[Navigation] ArrowDown - moving to:', sections[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowUp' && !isAtGoalLevel && !isAtProjectLevel && !isAtRoutineLevel && !isAtAdminLevel && !isAtEventLevel) {
        e.preventDefault();
        const sections: Array<'empty' | 'goals' | 'projects' | 'routines' | 'admin' | 'events'> = ['empty', 'goals', 'projects', 'routines', 'admin', 'events'];
        const currentIndex = sections.indexOf(cursorPosition);
        if (currentIndex > 0) {
          // Skip goals -> empty if no goals
          if (sections[currentIndex - 1] === 'goals' && goals.length === 0 && currentIndex === 2) {
            setCursorPosition('empty');
          } else {
            setCursorPosition(sections[currentIndex - 1]);
          }
          console.log('[Navigation] ArrowUp - moving to:', sections[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowLeft' && (cursorPosition === 'routines' || cursorPosition === 'admin' || cursorPosition === 'events') && !isAtRoutineLevel && !isAtAdminLevel && !isAtEventLevel) {
        e.preventDefault();
        const horizontalSections: Array<'routines' | 'admin' | 'events'> = ['routines', 'admin', 'events'];
        const currentIndex = horizontalSections.indexOf(cursorPosition as any);
        if (currentIndex > 0) {
          setCursorPosition(horizontalSections[currentIndex - 1]);
          console.log('[Navigation] ArrowLeft - moving to:', horizontalSections[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight' && (cursorPosition === 'routines' || cursorPosition === 'admin' || cursorPosition === 'events') && !isAtRoutineLevel && !isAtAdminLevel && !isAtEventLevel) {
        e.preventDefault();
        const horizontalSections: Array<'routines' | 'admin' | 'events'> = ['routines', 'admin', 'events'];
        const currentIndex = horizontalSections.indexOf(cursorPosition as any);
        if (currentIndex < horizontalSections.length - 1) {
          setCursorPosition(horizontalSections[currentIndex + 1]);
          console.log('[Navigation] ArrowRight - moving to:', horizontalSections[currentIndex + 1]);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();

        // If at project level and on an existing project, create an input position after it
        if (isAtProjectLevel && projectLevelPosition >= 0 && !isTypingProject) {
          setProjectLevelPosition(-(projectLevelPosition + 3));
          setIsTypingProject(true);
          setProjectInput('');
          console.log('[Navigation] Inserting input after project', projectLevelPosition);
          return;
        }

        // If at routine level and on an existing routine, create an input position after it
        if (isAtRoutineLevel && routineLevelPosition >= 0 && !isTypingRoutine) {
          setRoutineLevelPosition(-(routineLevelPosition + 3));
          setIsTypingRoutine(true);
          setRoutineInput('');
          setRoutineInputStep('name');
          setTempRoutineName('');
          setTempRoutineTime('');
          console.log('[Navigation] Inserting input after routine', routineLevelPosition);
          return;
        }

        // If at admin level and on an existing admin task, create an input position after it
        if (isAtAdminLevel && adminLevelPosition >= 0 && !isTypingAdmin) {
          setAdminLevelPosition(-(adminLevelPosition + 3));
          setIsTypingAdmin(true);
          setAdminInput('');
          setAdminInputStep('name');
          setTempAdminName('');
          setTempAdminPriority('');
          console.log('[Navigation] Inserting input after admin task', adminLevelPosition);
          return;
        }

        // If at event level and on an existing event, create an input position after it
        if (isAtEventLevel && eventLevelPosition >= 0 && !isTypingEvent) {
          setEventLevelPosition(-(eventLevelPosition + 3));
          setIsTypingEvent(true);
          setEventInput('');
          setEventInputStep('name');
          setTempEventName('');
          setTempEventDate('');
          console.log('[Navigation] Inserting input after event', eventLevelPosition);
          return;
        }

        // If at goal level and on an existing goal, create an input position after it
        if (isAtGoalLevel && goalLevelPosition >= 0 && !isTypingGoal) {
          // Set position to insert after current goal
          // We'll use negative numbers for insert positions: -3 = after goal 0, -4 = after goal 1, etc.
          setGoalLevelPosition(-(goalLevelPosition + 3));
          setIsTypingGoal(true);
          setGoalInput('');
          console.log('[Navigation] Inserting input after goal', goalLevelPosition);
          return;
        }

        // Enter at goal level (not at goal level) toggles expand/collapse
        if (cursorPosition === 'goal' && selectedGoalIndex >= 0 && !isAtGoalLevel) {
          const updatedGoals = [...goals];
          updatedGoals[selectedGoalIndex].isExpanded = !updatedGoals[selectedGoalIndex].isExpanded;
          setGoals(updatedGoals);
          return;
        }

        // Enter in sections starts typing (but not for projects or events which have their own handlers)
        if (cursorPosition === 'sections' && focusedSection !== 'goals' && focusedSection !== 'projects' && focusedSection !== 'events') {
          setActiveSection(focusedSection as 'routines' | 'admin');
          setIsTypingInSection(true);
          setSectionInput('');
          return;
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Exit goal level if we're at goal level
        if (isAtGoalLevel) {
          setIsAtGoalLevel(false);
          setIsTypingGoal(false);
          setGoalInput('');
        } else if (isTypingGoal) {
          setGoalInput('');
          setIsTypingGoal(false);
        }
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        console.log('[Character Typing] key:', e.key, 'isAtGoalLevel:', isAtGoalLevel, 'goalLevelPosition:', goalLevelPosition, 'isTypingGoal:', isTypingGoal);
        // If at goal level, typing updates the goal input
        if (isAtGoalLevel && (goalLevelPosition === -1 || goalLevelPosition === -2 || goalLevelPosition < -2)) {
          e.preventDefault();
          console.log('[Goal] Starting/continuing to type, isTypingGoal:', isTypingGoal, 'goalLevelPosition:', goalLevelPosition);
          // If not already typing, initialize the typing state
          if (!isTypingGoal) {
            console.log('[Goal] Initializing typing state');
            setIsTypingGoal(true);
            setInputStep('name');
            setTempGoalName('');
            setTempGoalDeadline('');
          }
          setGoalInput(prev => prev + e.key);
        } else if (isAtEventLevel && (eventLevelPosition === -1 || eventLevelPosition === -2 || eventLevelPosition < -2)) {
          // If at event level in an input position, start typing
          e.preventDefault();
          console.log('[Event] Starting/continuing to type at position:', eventLevelPosition);
          if (!isTypingEvent) {
            console.log('[Event] Initializing typing state');
            setIsTypingEvent(true);
            setEventInputStep('name');
            setTempEventName('');
            setTempEventDate('');
          }
          setEventInput(prev => prev + e.key);
        } else if (cursorPosition === 'sections' && focusedSection !== 'goals' && focusedSection !== 'projects' && focusedSection !== 'events') {
          // If in sections (but not events which has full typing), start typing in the focused section (but not for projects)
          e.preventDefault();
          setActiveSection(focusedSection as 'routines' | 'admin');
          setIsTypingInSection(true);
          setSectionInput(e.key);
        }
        // If not in a valid typing context, don't prevent default (let the key pass through)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTypingGoal, goalInput, goals, selectedGoalIndex, cursorPosition, isTypingInSection, activeSection, sectionInput, projects, routines, adminTasks, events, isAtGoalLevel, goalLevelPosition, grabbedGoalIndex, grabbedGoalOriginalIndex, inputStep, tempGoalName, tempGoalDeadline, showGoalDeadlinePopup, isEditingGoal, editingGoalIndex, editGoalName, editGoalDeadline, editFieldFocus, isAtProjectLevel, projectLevelPosition, grabbedProjectIndex, grabbedProjectOriginalIndex, isTypingProject, projectInput, projectInputStep, tempProjectName, tempProjectDeadline, isEditingProject, editingProjectIndex, editProjectName, editProjectDeadline, editProjectFieldFocus, editProjectGoalId, isAtProjectTaskLevel, selectedTaskIndex, currentProjectForTasks, isTypingTask, taskInput, taskInputPosition, grabbedTaskIndex, grabbedTaskOriginalIndex, isEditingTask, editingTaskIndex, editTaskName, editTaskDuration, editTaskDeadline, editTaskFieldFocus, showEditTaskNamePopup, showEditTaskDurationPopup, showEditTaskDeadlinePopup, showDurationPickerPopup, showTaskDeadlinePickerPopup, pendingTaskData, isAtRoutineLevel, routineLevelPosition, grabbedRoutineIndex, grabbedRoutineOriginalIndex, isTypingRoutine, routineInput, routineInputStep, tempRoutineName, tempRoutineTime, tempRoutineGoalId, tempRoutineStartDate, tempRoutineEndDate, tempRoutineDays, isEditingRoutine, editingRoutineIndex, editRoutineName, editRoutineTime, editRoutineFieldFocus, isAtRoutineTaskLevel, selectedRoutineTaskIndex, currentRoutineForTasks, isTypingRoutineTask, routineTaskInput, routineTaskInputPosition, grabbedRoutineTaskIndex, grabbedRoutineTaskOriginalIndex, isAtAdminLevel, adminLevelPosition, grabbedAdminIndex, grabbedAdminOriginalIndex, isTypingAdmin, adminInput, adminInputStep, tempAdminName, tempAdminPriority, isEditingAdmin, editingAdminIndex, editAdminName, editAdminPriority, editAdminGoalId, editAdminDuration, editAdminDeadline, editAdminFieldFocus, isAtEventLevel, eventLevelPosition, grabbedEventIndex, grabbedEventOriginalIndex, isTypingEvent, eventInput, eventInputStep, tempEventName, tempEventDate, isEditingEvent, editingEventIndex, editEventName, editEventGoalId, editEventIsRecurring, editEventRecurringDays, editEventDate, editEventStartTime, editEventEndTime, editEventLink, editEventLocation, editEventFieldFocus, showGoalSelectionPopup, showDeadlinePickerPopup, pendingProjectData, showRoutineGoalSelectionPopup, showRoutineDateRangePopup, showRoutineDaySelectionPopup, showRoutineTimeAndDurationPopup, showRoutineTaskDurationPopup, pendingRoutineData, selectedTaskForDuration, showAdminGoalSelectionPopup, showAdminDurationPopup, showAdminDeadlinePopup, showEditAdminGoalPopup, showEditAdminDurationPopup, showEditAdminDeadlinePopup, pendingAdminData, showEventGoalSelectionPopup, showEventRecurringPopup, showEventDaySelectionPopup, showEventDatePopup, showEventTimeRangePopup, showEventAddLinkPopup, showEditEventGoalPopup, showEditEventRecurringPopup, showEditEventDaysPopup, showEditEventDatePopup, showEditEventTimePopup, showEditEventLinkPopup, pendingEventData]);

  // Auto-focus input when typing
  useEffect(() => {
    if (isTypingGoal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTypingGoal]);

  // Auto-scroll to popup when any popup opens
  useEffect(() => {
    const anyPopupOpen = showGoalSelectionPopup || showDeadlinePickerPopup || showDurationPickerPopup || showTaskDeadlinePickerPopup ||
      showRoutineGoalSelectionPopup || showRoutineDateRangePopup || showRoutineDaySelectionPopup || showRoutineTimeAndDurationPopup || showRoutineTaskDurationPopup ||
      showAdminGoalSelectionPopup || showAdminDurationPopup || showAdminDeadlinePopup ||
      showEventGoalSelectionPopup || showEventRecurringPopup || showEventDaySelectionPopup || showEventDatePopup || showEventTimeRangePopup || showEventAddLinkPopup ||
      showEditGoalSelectionPopup || showEditDeadlinePickerPopup ||
      showEditAdminGoalPopup || showEditAdminDurationPopup || showEditAdminDeadlinePopup ||
      showEditEventGoalPopup || showEditEventRecurringPopup || showEditEventDaysPopup || showEditEventDatePopup || showEditEventTimePopup || showEditEventLinkPopup;

    if (anyPopupOpen) {
      // Small delay to ensure popup is rendered
      setTimeout(() => {
        // Find the popup element (they all have absolute positioning)
        const popup = document.querySelector('.absolute.top-full');
        if (popup) {
          // Scroll the popup into view with some padding
          popup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          // Additional check to ensure full visibility
          const rect = popup.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // If popup bottom is below viewport, scroll down
          if (rect.bottom > windowHeight) {
            window.scrollBy({
              top: rect.bottom - windowHeight + 20, // 20px padding
              behavior: 'smooth'
            });
          }
        }
      }, 50);
    }
  }, [showGoalSelectionPopup, showDeadlinePickerPopup, showDurationPickerPopup, showTaskDeadlinePickerPopup,
      showRoutineGoalSelectionPopup, showRoutineDateRangePopup, showRoutineDaySelectionPopup, showRoutineTimeAndDurationPopup, showRoutineTaskDurationPopup,
      showAdminGoalSelectionPopup, showAdminDurationPopup, showAdminDeadlinePopup,
      showEventGoalSelectionPopup, showEventRecurringPopup, showEventDaySelectionPopup, showEventDatePopup, showEventTimeRangePopup, showEventAddLinkPopup,
      showEditGoalSelectionPopup, showEditDeadlinePickerPopup,
      showEditAdminGoalPopup, showEditAdminDurationPopup, showEditAdminDeadlinePopup,
      showEditEventGoalPopup, showEditEventRecurringPopup, showEditEventDaysPopup, showEditEventDatePopup, showEditEventTimePopup, showEditEventLinkPopup]);

  // Auto-scroll to keep navigation in view
  useEffect(() => {
    // Disabled project scrolling to prevent screen movement
    // if (isAtProjectLevel && projectLevelPosition >= 0) {
    //   setTimeout(() => {
    //     const projectElement = document.querySelector(`[data-project-index="${projectLevelPosition}"]`);
    //     if (projectElement) {
    //       projectElement.scrollIntoView({
    //         behavior: 'smooth',
    //         block: 'nearest' // Minimize scrolling movement
    //       });
    //     }
    //   }, 50);
    // } else if (isAtProjectLevel && projectLevelPosition === -1) {
    //   // Scroll to bottom input
    //   setTimeout(() => {
    //     const bottomInput = document.querySelector('[data-project-bottom-input]');
    //     if (bottomInput) {
    //       bottomInput.scrollIntoView({
    //         behavior: 'smooth',
    //         block: 'center'
    //       });
    //     }
    //   }, 50);
    // }

    // Similar for goals
    if (isAtGoalLevel && goalLevelPosition >= 0) {
      setTimeout(() => {
        const goalElement = document.querySelector(`[data-goal-index="${goalLevelPosition}"]`);
        if (goalElement) {
          goalElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 50);
    }

    // Scroll for events
    if (isAtEventLevel && eventLevelPosition >= 0) {
      setTimeout(() => {
        const eventElement = document.querySelector(`[data-event-index="${eventLevelPosition}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 50);
    }
  }, [isAtProjectLevel, projectLevelPosition, isAtGoalLevel, goalLevelPosition, isAtEventLevel, eventLevelPosition]);

  return (
    <div className="w-full">
      {/* Inventory content */}
      <div className="px-4 py-4">
        {/* User Profile Section - Minimal */}
        <div className="mb-8 font-mono">
          <div className="text-base font-medium text-gray-900 mb-2">
            {user?.firstName || 'User'} {user?.lastName || ''}
          </div>
          {userData?.bio && (
            <div className="text-sm text-gray-600 mb-3 leading-relaxed">
              {userData.bio}
            </div>
          )}
          <div className="flex gap-6 text-sm text-gray-500">
            {userData?.occupation && (
              <span>{userData.occupation}</span>
            )}
            {userData?.location && (
              <span>{userData.location}</span>
            )}
            {userData?.email && (
              <span>{userData.email}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Goals section */}
        <div ref={goalsRef}>
          {/* Goals section header */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-mono uppercase tracking-wide pb-1 transition-all border-b-2 ${
              cursorPosition === 'goals' ? 'text-gray-900 border-gray-400' : 'text-gray-500 border-transparent'
            }`}>
              GOALS {goals.length > 0 && <span className="text-gray-400 ml-2">{goals.length}</span>}
            </span>
          {cursorPosition === 'goals' && (
            <span className="text-xs text-gray-400 font-mono">
              {isAtGoalLevel
                ? 'Type goal • Enter to add & continue • Empty Enter or Esc to exit'
                : 'Tab to enter • ↓ to sections'
              }
            </span>
          )}
        </div>

        {/* Show loading state, goals, or empty state */}
        {isLoadingGoals ? (
          <div className="py-2 text-gray-400 text-sm font-mono">Loading goals...</div>
        ) : goals.length === 0 ? (
          // Empty state - show input when at goal level
          <div className="py-2">
            {isAtGoalLevel ? (
              <div className="flex items-center font-mono gap-4 px-2 py-1">
                <span className="text-gray-400 text-sm uppercase">
                  GOAL 01
                </span>
                <span className="text-sm flex-1">
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
                      {showGoalDeadlinePopup ? (
                        <span className="text-gray-400 text-xs animate-pulse">selecting...</span>
                      ) : (
                        <>
                          <span className="text-gray-700">{goalInput}</span>
                          <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                          {goalInput.length === 0 && (
                            <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
                          )}
                        </>
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
            ) : (
              <div className="text-gray-400 text-sm font-mono">
                {cursorPosition === 'goals' ? 'Press Tab to add goal' : 'No goals yet'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top input for new goal - show when at goal level and position is -2 */}
            {isAtGoalLevel && goalLevelPosition === -2 && (
              <div className="font-mono flex items-center gap-4 px-2 py-1">
                <span className="text-gray-400 text-sm uppercase">
                  GOAL 01
                </span>
                <span className="text-sm flex-1">
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
                      {showGoalDeadlinePopup ? (
                        <span className="text-gray-400 text-xs animate-pulse">selecting...</span>
                      ) : (
                        <>
                          <span className="text-gray-700">{goalInput}</span>
                          <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                          {goalInput.length === 0 && (
                            <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
                          )}
                        </>
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
            )}

            {/* Render existing goals */}
            {goals.map((goal, index) => {
              // Calculate if there's an insert position after this goal
              const hasInsertAfter = isAtGoalLevel && goalLevelPosition === -(index + 3);

              // Calculate display number accounting for any inputs above
              let displayNumber = index + 1;
              if (isAtGoalLevel && goalLevelPosition === -2) {
                displayNumber = index + 2; // Top input exists
              } else if (isAtGoalLevel && goalLevelPosition < -2) {
                // Check if there's an insert above this goal
                const insertPosition = Math.abs(goalLevelPosition) - 3;
                if (insertPosition < index) {
                  displayNumber = index + 2; // There's an insert above
                }
              }

              return (
                <div key={goal.id} data-goal-index={index}>
                  <div className={`font-mono flex items-center gap-4 transition-all px-2 py-1 ${
                    grabbedGoalIndex === index
                      ? 'text-gray-900 pl-6 opacity-75 bg-gray-100'
                      : isEditingGoal && editingGoalIndex === index
                      ? 'text-gray-900 pl-4 bg-yellow-50'
                      : isAtGoalLevel && goalLevelPosition === index
                      ? 'text-gray-900 pl-4'
                      : 'text-gray-600'
                  }`}>
                    <span className={`text-sm uppercase transition-all ${
                      grabbedGoalIndex === index
                        ? 'text-gray-700'
                        : isAtGoalLevel && goalLevelPosition === index
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}>
                      {grabbedGoalIndex === index && '⇅ '}GOAL {String(displayNumber).padStart(2, '0')}
                    </span>
                    {isEditingGoal && editingGoalIndex === index ? (
                      <>
                        <span className={`text-sm flex-1 flex items-center gap-2 ${
                          editFieldFocus === 'name' ? 'font-medium' : ''
                        }`}>
                          <span className={editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-600'}>
                            {editGoalName}
                            {editFieldFocus === 'name' && (
                              <span className="inline-block w-[2px] h-4 bg-yellow-500 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                            )}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className={`flex items-center ${editFieldFocus === 'deadline' ? 'text-gray-900' : 'text-gray-500'}`}>
                            <span className="text-xs mr-1">deadline:</span>
                            {editGoalDeadline || '___'}
                            {editFieldFocus === 'deadline' && (
                              <span className="inline-block w-[2px] h-4 bg-yellow-500 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                            )}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-sm ${
                          isAtGoalLevel && goalLevelPosition === index ? 'font-medium' : ''
                        }`}>
                          {goal.name}
                        </span>
                        {goal.deadline && (
                          <span className="text-gray-400 ml-2 text-sm">
                            {goal.deadline}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Content - shown when expanded */}
                  {goal.isExpanded && (
                    <div className="ml-20 mt-3 space-y-1 font-mono">
                      <div className="text-gray-400 text-sm italic">
                        Goal expanded - content area (empty)
                      </div>
                    </div>
                  )}

                  {/* Insert input after this goal if position matches */}
                  {hasInsertAfter && (
                    <div className="font-mono flex items-center gap-4 px-2 py-1 mt-2 pl-4">
                      <span className="text-gray-400 text-sm uppercase">
                        GOAL {String(displayNumber + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm flex-1">
                        <span className="text-gray-700">{goalInput}</span>
                        <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom input for new goal - show when at goal level and position is -1 */}
            {isAtGoalLevel && goalLevelPosition === -1 && (
              <div className="font-mono flex items-center gap-4 px-2 py-1">
                <span className="text-gray-400 text-sm uppercase">
                  {/* If top input is showing (position -2 exists), this would be goals.length + 2, otherwise goals.length + 1 */}
                  GOAL {String(goals.length + 1).padStart(2, '0')}
                </span>
                <span className="text-sm flex-1">
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
                      {showGoalDeadlinePopup ? (
                        <span className="text-gray-400 text-xs animate-pulse">selecting...</span>
                      ) : (
                        <>
                          <span className="text-gray-700">{goalInput}</span>
                          <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
                          {goalInput.length === 0 && (
                            <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
                          )}
                        </>
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
            )}

          </div>
        )}

        {/* Goal Deadline Popup */}
        {showGoalDeadlinePopup && (
          <div className="relative mt-2">
            <SimpleDateInput
              onSelect={handleGoalDeadlineSelection}
              onCancel={handleGoalDeadlineCancel}
            />
          </div>
        )}
      </div>
      </div>

      {/* Divider between goals and projects */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Projects section - single column like goals */}
      <div className="px-4" ref={projectsRef}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-mono uppercase tracking-wide pb-1 transition-all border-b-2 ${
            cursorPosition === 'projects' ? 'text-gray-900 border-gray-400' : 'text-gray-500 border-transparent'
          }`}>
            {isAtProjectLevel && (
              <span className="text-xs text-gray-500 mr-2">
                {projectViewMode === 'active' ? 'ACTIVE' : 'COMPLETED'}
              </span>
            )}
            PROJECTS {projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed)).length > 0 && <span className="text-gray-400 ml-2">{projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed)).length}</span>}
          </span>
          {cursorPosition === 'projects' && (
            <span className="text-xs text-gray-400 font-mono">
              {isAtProjectLevel
                ? '← → to toggle view • Type project • Cmd+Enter to complete • Esc to exit'
                : 'Tab to enter • ↑ to goals • ↓ to other items'
              }
            </span>
          )}
        </div>

        <ProjectsList
          projects={projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed))}
          goals={goals}
          isAtProjectLevel={isAtProjectLevel}
          projectLevelPosition={projectLevelPosition}
          grabbedProjectIndex={grabbedProjectIndex}
          isEditingProject={isEditingProject}
          editingProjectIndex={editingProjectIndex !== null ? (() => {
            // Convert full array index to filtered array index
            const filteredProjects = projects.filter(p => projectViewMode === 'active' ? !(p.completed || p.metadata?.completed) : (p.completed || p.metadata?.completed));
            const projectBeingEdited = projects[editingProjectIndex];
            if (projectBeingEdited) {
              return filteredProjects.findIndex(p => (p.id || p._id) === (projectBeingEdited.id || projectBeingEdited._id));
            }
            return null;
          })() : null}
          editProjectName={editProjectName}
          editProjectDeadline={editProjectDeadline}
          editProjectGoalId={editProjectGoalId}
          editFieldFocus={editProjectFieldFocus}
          isTypingProject={isTypingProject}
          projectInput={projectInput}
          inputStep={projectInputStep}
          tempProjectName={tempProjectName}
          tempProjectGoalId={tempProjectGoalId}
          showGoalSelectionPopup={showGoalSelectionPopup}
          showDeadlinePickerPopup={showDeadlinePickerPopup}
          showEditGoalSelectionPopup={showEditGoalSelectionPopup}
          showEditDeadlinePickerPopup={showEditDeadlinePickerPopup}
          onProjectGoalSelect={handleGoalSelection}
          onProjectGoalCancel={handleGoalSelectionCancel}
          onProjectDeadlineSelect={handleDeadlineSelection}
          onProjectDeadlineCancel={handleDeadlinePickerCancel}
          onEditGoalSelect={handleEditGoalSelection}
          onEditGoalCancel={handleEditGoalSelectionCancel}
          onEditDeadlineSelect={handleEditDeadlineSelection}
          onEditDeadlineCancel={handleEditDeadlinePickerCancel}
          isAtProjectTaskLevel={isAtProjectTaskLevel}
          selectedTaskIndex={selectedTaskIndex}
          isTypingTask={isTypingTask}
          taskInput={taskInput}
          taskInputPosition={taskInputPosition}
          grabbedTaskIndex={grabbedTaskIndex}
          isEditingTask={isEditingTask}
          editingTaskIndex={editingTaskIndex}
          editTaskName={editTaskName}
          editTaskDuration={editTaskDuration}
          editTaskDeadline={editTaskDeadline}
          editTaskFieldFocus={editTaskFieldFocus}
          showDurationPickerPopup={showDurationPickerPopup}
          showTaskSimpleDateInput={showTaskDeadlinePickerPopup}
          tempTaskTitle={tempTaskTitle}
          onTaskDurationSelect={handleTaskDurationSelection}
          onTaskDurationCancel={handleTaskDurationCancel}
          onTaskDeadlineSelect={handleTaskDeadlineSelection}
          onTaskDeadlineCancel={handleTaskDeadlineCancel}
          // Edit popups
          showEditTaskNamePopup={showEditTaskNamePopup}
          showEditTaskDurationPopup={showEditTaskDurationPopup}
          showEditTaskDeadlinePopup={showEditTaskDeadlinePopup}
          editTaskNameValue={editTaskName}
          editTaskDurationValue={parseInt(editTaskDuration) || 30}
          editTaskDeadlineValue={editTaskDeadline}
          onEditTaskNameSubmit={handleEditTaskNameSubmit}
          onEditTaskNameCancel={handleEditTaskNameCancel}
          onEditTaskDurationSubmit={handleEditTaskDurationSubmit}
          onEditTaskDurationCancel={handleEditTaskDurationCancel}
          onEditTaskDeadlineSubmit={handleEditTaskDeadlineSubmit}
          onEditTaskDeadlineCancel={handleEditTaskDeadlineCancel}
        />

        {/* Popups positioned relative to projects section */}
        {showGoalSelectionPopup && (
          <div className="relative">
            <GoalSelectionPopup
              goals={goals}
              onSelect={handleGoalSelection}
              onCancel={handleGoalSelectionCancel}
            />
          </div>
        )}

        {showDeadlinePickerPopup && (
          <div className="relative">
            <SimpleDateInput
              onSelect={handleDeadlineSelection}
              onCancel={handleDeadlinePickerCancel}
            />
          </div>
        )}
      </div>

      {/* Divider between projects and other sections */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Routines section - single column like goals */}
      <div className="px-4 relative" ref={routinesRef}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-mono uppercase tracking-wide pb-1 transition-all border-b-2 ${
            cursorPosition === 'routines' ? 'text-gray-900 border-gray-400' : 'text-gray-500 border-transparent'
          }`}>
            ROUTINES {routines.length > 0 && <span className="text-gray-400 ml-2">{routines.length}</span>}
          </span>
          {cursorPosition === 'routines' && (
            <span className="text-xs text-gray-400 font-mono">
              {isAtRoutineLevel
                ? 'Type routine • Enter to add & continue • Empty Enter or Esc to exit'
                : 'Tab to enter • ← → to navigate sections'
              }
            </span>
          )}
        </div>
        <RoutinesList
          routines={(() => {
            // Debug the specific routine with the task
            const routineWithTask = routines.find(r =>
              r.tasks?.some(t => t.title === "will this edit persist yo" || t.name === "will this edit persist yo")
            );
            if (routineWithTask) {
              console.log('[InventoryView] Passing routine to RoutinesList:', {
                routine: routineWithTask,
                tasks: routineWithTask.tasks,
                specificTask: routineWithTask.tasks?.find(t =>
                  t.title === "will this edit persist yo" || t.name === "will this edit persist yo"
                )
              });
            }
            return routines;
          })() as any}
          isAtRoutineLevel={isAtRoutineLevel}
          routineLevelPosition={routineLevelPosition}
          grabbedRoutineIndex={grabbedRoutineIndex}
          isEditingRoutine={isEditingRoutine}
          editingRoutineIndex={editingRoutineIndex}
          editRoutineName={editRoutineName}
          editRoutineTime={editRoutineTime}
          editFieldFocus={editRoutineFieldFocus}
          editRoutineGoalId={editRoutineGoalId}
          editRoutineStartDate={editRoutineStartDate}
          editRoutineEndDate={editRoutineEndDate}
          editRoutineDays={editRoutineDays}
          editRoutineDuration={editRoutineDuration}
          goals={goals as any}
          isTypingRoutine={isTypingRoutine}
          routineInput={routineInput}
          inputStep={routineInputStep}
          tempRoutineName={tempRoutineName}
          isAtRoutineTaskLevel={isAtRoutineTaskLevel}
          selectedTaskIndex={selectedRoutineTaskIndex}
          isTypingTask={isTypingRoutineTask}
          taskInput={routineTaskInput}
          taskInputPosition={routineTaskInputPosition}
          grabbedTaskIndex={grabbedRoutineTaskIndex}
          showDurationPopup={showRoutineTaskDurationPopup}
          selectedTaskForDuration={selectedTaskForDuration}
          onDurationSelect={handleRoutineTaskDurationSelection}
          onDurationCancel={handleRoutineTaskDurationCancel}
          editingTaskIndex={editingRoutineTaskIndex}
          editTaskName={editRoutineTaskName}
          editTaskDuration={editRoutineTaskDuration}
          editTaskFieldFocus={editRoutineTaskFieldFocus}
          onTaskNameChange={setEditRoutineTaskName}
          onTaskEditSave={handleRoutineTaskEditSave}
          onTaskEditCancel={handleRoutineTaskEditCancel}
        />

        {/* Routine Goal Selection Popup */}
        {showRoutineGoalSelectionPopup && (
          <GoalSelectionPopup
            goals={goals}
            onSelect={handleRoutineGoalSelection}
            onCancel={handleRoutineGoalSelectionCancel}
          />
        )}

        {/* Routine Date Range Popup */}
        {showRoutineDateRangePopup && (
          <DateRangePickerPopup
            onSelect={handleRoutineDateRangeSelection}
            onCancel={handleRoutineDateRangeCancel}
          />
        )}

        {/* Routine Day Selection Popup */}
        {showRoutineDaySelectionPopup && (
          <DaySelectionPopup
            onSelect={handleRoutineDaySelection}
            onCancel={handleRoutineDaySelectionCancel}
          />
        )}

        {/* Routine Time and Duration Popup */}
        {showRoutineTimeAndDurationPopup && (
          <TimeAndDurationPopup
            onSelect={handleRoutineTimeAndDurationSelection}
            onCancel={handleRoutineTimeAndDurationCancel}
          />
        )}

        {/* ===== EDIT ROUTINE POPUPS ===== */}

        {/* Edit Routine Goal Selection Popup */}
        {showEditRoutineGoalPopup && (
          <GoalSelectionPopup
            goals={goals}
            onSelect={handleEditRoutineGoalSelection}
            onCancel={handleEditRoutineGoalCancel}
            initialGoalId={editRoutineGoalId}
          />
        )}

        {/* Edit Routine Date Range Popup */}
        {showEditRoutineDateRangePopup && (
          <DateRangePickerPopup
            onSelect={handleEditRoutineDateRangeSelection}
            onCancel={handleEditRoutineDateRangeCancel}
            initialStartDate={editRoutineStartDate}
            initialEndDate={editRoutineEndDate}
          />
        )}

        {/* Edit Routine Day Selection Popup */}
        {showEditRoutineDaysPopup && (
          <DaySelectionPopup
            onSelect={handleEditRoutineDaysSelection}
            onCancel={handleEditRoutineDaysCancel}
            initialDays={editRoutineDays}
          />
        )}

        {/* Edit Routine Time and Duration Popup */}
        {showEditRoutineTimePopup && (
          <TimeAndDurationPopup
            onSelect={handleEditRoutineTimeSelection}
            onCancel={handleEditRoutineTimeCancel}
            initialTime={editRoutineTime}
            initialDuration={editRoutineDuration}
          />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Admin tasks section - single column */}
      <div className="px-4" ref={adminRef}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-mono uppercase tracking-wide pb-1 transition-all border-b-2 ${
            cursorPosition === 'admin' ? 'text-gray-900 border-gray-400' : 'text-gray-500 border-transparent'
          }`}>
            {isAtAdminLevel && (
              <span className="text-xs text-gray-500 mr-2">
                {adminTaskViewMode === 'active' ? 'ACTIVE' : 'COMPLETED'}
              </span>
            )}
            ADMIN TASKS {adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed)).length > 0 && <span className="text-gray-400 ml-2">{adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed)).length}</span>}
          </span>
          {cursorPosition === 'admin' && (
            <span className="text-xs text-gray-400 font-mono">
              {isAtAdminLevel
                ? '← → to toggle view • Type task • Cmd+Enter to complete • Esc to exit'
                : 'Tab to enter • ← → to navigate sections'
              }
            </span>
          )}
        </div>
        <AdminTasksList
          adminTasks={adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed)) as any}
          isAtAdminLevel={isAtAdminLevel}
          adminLevelPosition={adminLevelPosition}
          grabbedAdminIndex={grabbedAdminIndex}
          isEditingAdmin={isEditingAdmin}
          editingAdminIndex={editingAdminIndex !== null ? (() => {
            // Convert full array index to filtered array index
            const filteredTasks = adminTasks.filter(t => adminTaskViewMode === 'active' ? !(t.completed || t.metadata?.completed) : (t.completed || t.metadata?.completed));
            const taskBeingEdited = adminTasks[editingAdminIndex];
            if (taskBeingEdited) {
              return filteredTasks.findIndex(t => (t.id || t._id) === (taskBeingEdited.id || taskBeingEdited._id));
            }
            return null;
          })() : null}
          editAdminName={editAdminName}
          editAdminPriority={editAdminPriority}
          editAdminGoalId={editAdminGoalId}
          editAdminDuration={editAdminDuration}
          editAdminDeadline={editAdminDeadline}
          editFieldFocus={editAdminFieldFocus}
          isTypingAdmin={isTypingAdmin}
          adminInput={adminInput}
          inputStep={adminInputStep}
          tempAdminName={tempAdminName}
          // Popup props
          showGoalPopup={showAdminGoalSelectionPopup}
          showDurationPopup={showAdminDurationPopup}
          showDeadlinePopup={showAdminDeadlinePopup}
          showEditGoalPopup={showEditAdminGoalPopup}
          showEditDurationPopup={showEditAdminDurationPopup}
          showEditDeadlinePopup={showEditAdminDeadlinePopup}
          goals={goals}
          onGoalSelect={handleAdminGoalSelection}
          onGoalCancel={handleAdminGoalSelectionCancel}
          onDurationSelect={handleAdminDurationSelection}
          onDurationCancel={handleAdminDurationCancel}
          onDeadlineSelect={handleAdminDeadlineSelection}
          onDeadlineCancel={handleAdminDeadlineCancel}
          onEditGoalSelect={handleEditAdminGoalSelection}
          onEditGoalCancel={handleEditAdminGoalCancel}
          onEditDurationSelect={handleEditAdminDurationSelection}
          onEditDurationCancel={handleEditAdminDurationCancel}
          onEditDeadlineSelect={handleEditAdminDeadlineSelection}
          onEditDeadlineCancel={handleEditAdminDeadlineCancel}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Events section - single column */}
      <div className="px-4 pb-16" ref={eventsRef}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-mono uppercase tracking-wide pb-1 transition-all border-b-2 ${
            cursorPosition === 'events' ? 'text-gray-900 border-gray-400' : 'text-gray-500 border-transparent'
          }`}>
            {isAtEventLevel && (
              <span className="text-xs text-gray-500 mr-2">
                {eventViewMode === 'upcoming' ? 'UPCOMING' : 'PASSED'}
              </span>
            )}
            EVENTS {events.filter(e => eventViewMode === 'upcoming' ? !hasEventPassed(e) : hasEventPassed(e)).length > 0 && <span className="text-gray-400 ml-2">{events.filter(e => eventViewMode === 'upcoming' ? !hasEventPassed(e) : hasEventPassed(e)).length}</span>}
          </span>
          {cursorPosition === 'events' && (
            <span className="text-xs text-gray-400 font-mono">
              {isAtEventLevel
                ? '← → to toggle view • Type event • Enter to add & continue • Esc to exit'
                : 'Tab to enter • ← → to navigate sections'
              }
            </span>
          )}
        </div>
        <EventsList
          events={events.filter(e => eventViewMode === 'upcoming' ? !hasEventPassed(e) : hasEventPassed(e)) as any}
          isAtEventLevel={isAtEventLevel}
          eventLevelPosition={eventLevelPosition}
          grabbedEventIndex={grabbedEventIndex}
          isEditingEvent={isEditingEvent}
          editingEventIndex={editingEventIndex}
          editEventName={editEventName}
          editEventGoalId={editEventGoalId}
          editEventIsRecurring={editEventIsRecurring}
          editEventRecurringDays={editEventRecurringDays}
          editEventDate={editEventDate}
          editEventStartTime={editEventStartTime}
          editEventEndTime={editEventEndTime}
          editEventLink={editEventLink}
          editEventLocation={editEventLocation}
          editFieldFocus={editEventFieldFocus}
          isTypingEvent={isTypingEvent}
          eventInput={eventInput}
          inputStep={eventInputStep}
          tempEventName={tempEventName}
          showGoalPopup={showEventGoalSelectionPopup}
          showRecurringPopup={showEventRecurringPopup}
          showDaySelectionPopup={showEventDaySelectionPopup}
          showDatePopup={showEventDatePopup}
          showTimeRangePopup={showEventTimeRangePopup}
          showAddLinkPopup={showEventAddLinkPopup}
          showEditGoalPopup={showEditEventGoalPopup}
          showEditRecurringPopup={showEditEventRecurringPopup}
          showEditDaysPopup={showEditEventDaysPopup}
          showEditDatePopup={showEditEventDatePopup}
          showEditTimePopup={showEditEventTimePopup}
          showEditLinkPopup={showEditEventLinkPopup}
          goals={goals}
          onGoalSelect={handleEventGoalSelection}
          onGoalCancel={handleEventGoalSelectionCancel}
          onRecurringSelect={handleEventRecurringSelection}
          onRecurringCancel={handleEventRecurringCancel}
          onDaySelect={handleEventDaySelection}
          onDayCancel={handleEventDaySelectionCancel}
          onDateSelect={handleEventDateSelection}
          onDateCancel={handleEventDateCancel}
          onTimeRangeSelect={handleEventTimeRangeSelection}
          onTimeRangeCancel={handleEventTimeRangeCancel}
          onAddLinkSelect={handleEventAddLinkSelection}
          onAddLinkCancel={handleEventAddLinkCancel}
          onEditGoalSelect={handleEditEventGoalSelection}
          onEditGoalCancel={handleEditEventGoalCancel}
          onEditRecurringSelect={handleEditEventRecurringSelection}
          onEditRecurringCancel={handleEditEventRecurringCancel}
          onEditDaysSelect={handleEditEventDaysSelection}
          onEditDaysCancel={handleEditEventDaysCancel}
          onEditDateSelect={handleEditEventDateSelection}
          onEditDateCancel={handleEditEventDateCancel}
          onEditTimeSelect={handleEditEventTimeSelection}
          onEditTimeCancel={handleEditEventTimeCancel}
          onEditLinkSelect={handleEditEventLinkSelection}
          onEditLinkCancel={handleEditEventLinkCancel}
        />
      </div>

      {/* Spacer to ensure popups are always visible at bottom and navigation is never cut off */}
      <div className="h-96"></div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}