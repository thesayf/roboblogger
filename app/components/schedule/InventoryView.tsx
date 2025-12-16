"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Repeat, Video, X, Menu, Plus } from "lucide-react";

interface ContextItem {
  id: string;
  content: string;
  type: 'goal' | 'project' | 'task' | 'event' | 'routine';
  color?: string;
  metadata?: {
    completed?: boolean;
    goalId?: string;
    dueDate?: string;
    duration?: string;
    priority?: 'high' | 'medium' | 'low';
    isRecurring?: boolean;
    recurringDays?: string[];
    startTime?: string;
    endTime?: string;
    routineStartDate?: string;
    routineEndDate?: string;
    earliestStartTime?: string;
    latestEndTime?: string;
    zoomLink?: string;
  };
  tasks?: ContextItem[];
  isExpanded?: boolean;
}

interface InventoryViewProps {
  goals: ContextItem[];
  sections: { [key: string]: ContextItem[] };
  selectedGoalId: string | null;
  onGoalSelect: (goalId: string | null) => void;
  onAddGoal: (name: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTask: (name: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddEvent: (name: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddRoutine: (name: string) => void;
  onDeleteRoutine: (routineId: string) => void;
  onUpdateItem: (type: string, item: ContextItem) => void;
  onUpdateGoalAssignment: (type: string, itemId: string, goalId: string | null) => void;
  onUpdateTaskProperties: (taskId: string, properties: any) => void;
  onUpdateEventProperties: (eventId: string, properties: any) => void;
  onUpdateRoutineDates: (routineId: string, startDate: string, endDate: string) => void;
  onUpdateRoutineTimeWindow: (routineId: string, earliestStart: string, latestEnd: string) => void;
  onUpdateRoutineTasks: (routineId: string, tasks: any[]) => void;
}

// Helper function to get colors based on goal
const getGoalColors = (goalColor: string | undefined) => {
  const colorMap: { [key: string]: { border: string, text: string, goalText: string } } = {
    'purple': { border: 'border-purple-400', text: 'text-purple-600', goalText: 'text-purple-500' },
    'green': { border: 'border-green-400', text: 'text-green-600', goalText: 'text-green-500' },
    'blue': { border: 'border-blue-400', text: 'text-blue-600', goalText: 'text-blue-500' },
    'yellow': { border: 'border-yellow-400', text: 'text-yellow-600', goalText: 'text-yellow-500' },
    'pink': { border: 'border-pink-400', text: 'text-pink-600', goalText: 'text-pink-500' },
    'orange': { border: 'border-orange-400', text: 'text-orange-600', goalText: 'text-orange-500' },
  };
  
  if (!goalColor) return { border: '', text: 'text-gray-600', goalText: 'text-gray-400' };
  
  for (const [key, values] of Object.entries(colorMap)) {
    if (goalColor.includes(key)) return values;
  }
  
  return { border: '', text: 'text-gray-600', goalText: 'text-gray-400' };
};

export default function InventoryView({
  goals,
  sections,
  selectedGoalId,
  onGoalSelect,
  onAddGoal,
  onDeleteGoal,
  onAddProject,
  onDeleteProject,
  onAddTask,
  onDeleteTask,
  onAddEvent,
  onDeleteEvent,
  onAddRoutine,
  onDeleteRoutine,
  onUpdateItem,
  onUpdateGoalAssignment,
  onUpdateTaskProperties,
  onUpdateEventProperties,
  onUpdateRoutineDates,
  onUpdateRoutineTimeWindow,
  onUpdateRoutineTasks,
}: InventoryViewProps) {
  // Component state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  
  const [projectFilter, setProjectFilter] = useState<'active' | 'done' | 'all'>('active');
  const [taskFilter, setTaskFilter] = useState<'active' | 'done' | 'all'>('active');
  const [eventFilter, setEventFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [routineFilter, setRoutineFilter] = useState<'active' | 'ended' | 'all'>('active');
  
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [isAddingRoutineTask, setIsAddingRoutineTask] = useState(false);
  
  const [newGoalName, setNewGoalName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newEventName, setNewEventName] = useState("");
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineTaskName, setNewRoutineTaskName] = useState("");
  
  // Date picker states
  const [datePickerOpen, setDatePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [durationPickerOpen, setDurationPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [scheduledPickerOpen, setScheduledPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [eventTimePickerOpen, setEventTimePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [recurringPickerOpen, setRecurringPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [zoomLinkPickerOpen, setZoomLinkPickerOpen] = useState<{ [key: string]: boolean }>({});
  const [routineDatePickerOpen, setRoutineDatePickerOpen] = useState<{ [key: string]: boolean }>({});
  const [routineTimePickerOpen, setRoutineTimePickerOpen] = useState<{ [key: string]: boolean }>({});

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

  // Edit handlers
  const handleStartEdit = (item: ContextItem) => {
    setEditingItemId(item.id);
    setEditContent(item.content);
  };

  const handleSaveEdit = (item: ContextItem, section: string) => {
    if (editContent.trim() && editContent !== item.content) {
      onUpdateItem(section, { ...item, content: editContent });
    }
    setEditingItemId(null);
    setEditContent("");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditContent("");
  };

  // Filter sections based on selected goal
  const getFilteredSections = () => {
    if (!selectedGoalId) return sections;
    
    return {
      projects: sections.projects.filter(p => p.metadata?.goalId === selectedGoalId),
      backlog: sections.backlog.filter(t => t.metadata?.goalId === selectedGoalId),
      events: sections.events.filter(e => e.metadata?.goalId === selectedGoalId),
      routines: sections.routines.filter(r => r.metadata?.goalId === selectedGoalId),
    };
  };
  
  const filteredSections = getFilteredSections();

  return (
    <div className="flex-1 px-4 py-4 max-w-2xl mx-auto">
      {/* Rest of the component will go here... */}
      <div className="text-center text-gray-400">
        Inventory View Component (To be completed)
      </div>
    </div>
  );
}