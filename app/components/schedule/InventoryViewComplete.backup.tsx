"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { debounce } from "lodash";
import SharedNavbar from './SharedNavbar';
import {
  Plus,
  ChevronRight,
  Check,
  X,
  Clock,
  GripVertical,
  Folder,
  CheckSquare,
  RefreshCw,
  Calendar,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { GoalCard, ContextItem } from "./you-components/GoalCard";
import { SortableItem } from "./you-components/SortableItem";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAutoSave } from "@/app/hooks/useAutoSave";

// Task Item Component with Duration Selector
function TaskItem({ 
  task, 
  projectId, 
  onToggle, 
  onEdit, 
  onDelete, 
  onSetDuration,
  onSetDueDate,
  isRoutineTask = false,
  index,
  isDraggable = true
}: {
  task: ContextItem;
  projectId: string;
  onToggle: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onSetDuration: (duration: string) => void;
  onSetDueDate?: (dueDate: string) => void;
  isRoutineTask?: boolean;
  index?: number;
  isDraggable?: boolean;
}) {
  const [showDurationSelect, setShowDurationSelect] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const durations = [
    { value: "15m", label: "15 min" },
    { value: "30m", label: "30 min" },
    { value: "45m", label: "45 min" },
    { value: "1h", label: "1 hour" },
    { value: "1.5h", label: "1.5 hours" },
    { value: "2h", label: "2 hours" },
    { value: "3h", label: "3 hours" },
    { value: "4h", label: "4 hours" },
    { value: "6h", label: "6 hours" },
    { value: "8h", label: "Full day" },
  ];

  const getDurationDisplay = (duration: string | undefined) => {
    const found = durations.find(d => d.value === duration);
    return found ? found.label : "Set duration";
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 py-2 hover:bg-gray-50 px-3 -mx-3 rounded-lg transition-colors group">
      {/* Drag handle */}
      {isDraggable ? (
        <div
          className="cursor-grab opacity-50 hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      ) : (
        <div className="w-4" /> // Spacer to maintain alignment
      )}
      
      {/* Index number */}
      {index !== undefined && (
        <span className="text-[10px] font-mono text-gray-400 w-4">
          {index + 1}.
        </span>
      )}
      
      {!isRoutineTask ? (
        <button
          onClick={onToggle}
          className={cn(
            "w-4 h-4 rounded border transition-all",
            task.metadata?.completed
        ? "bg-blue-500 border-blue-500"
        : "border-gray-300 hover:border-gray-400"
          )}
        >
          {task.metadata?.completed && (
            <Check className="h-3 w-3 text-white" />
          )}
        </button>
      ) : (
        <span className="text-purple-400 text-sm">•</span>
      )}
      
      <input
        type="text"
        value={task.content}
        onChange={(e) => onEdit(e.target.value)}
        className={cn(
          "flex-1 text-sm font-mono bg-transparent border-0 focus:outline-none focus:border-b focus:border-blue-500",
          task.metadata?.completed ? "line-through text-gray-400" : "text-gray-700"
        )}
      />

      {/* Due Date Selector for Project Tasks */}
      {onSetDueDate && !isRoutineTask && (
        <div className="relative">
          {showDatePicker ? (
            <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-600 block mb-1">Task due date</label>
                <input
                  type="date"
                  value={task.metadata?.dueDate ? task.metadata.dueDate.split('T')[0] : ''}
                  onChange={(e) => {
                    onSetDueDate(e.target.value);
                    setShowDatePicker(false);
                  }}
                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    className="flex-1 text-xs font-mono px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    onClick={() => {
                      const today = new Date();
                      onSetDueDate(today.toISOString().split('T')[0]);
                      setShowDatePicker(false);
                    }}
                  >
                    Today
                  </button>
                  <button
                    className="flex-1 text-xs font-mono px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      onSetDueDate(tomorrow.toISOString().split('T')[0]);
                      setShowDatePicker(false);
                    }}
                  >
                    Tomorrow
                  </button>
                </div>
                <button
                  className="w-full text-xs font-mono px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
                  onClick={() => {
                    onSetDueDate("");
                    setShowDatePicker(false);
                  }}
                >
                  Clear date
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDatePicker(true)}
              className={cn(
                "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                task.metadata?.dueDate
                  ? (() => {
                      const date = new Date(task.metadata.dueDate);
                      const today = new Date();
                      const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) return 'bg-red-50 text-red-600 hover:bg-red-100';
                      if (diffDays === 0) return 'bg-orange-50 text-orange-600 hover:bg-orange-100';
                      if (diffDays <= 3) return 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100';
                      return 'bg-gray-50 text-gray-600 hover:bg-gray-100';
                    })()
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <Calendar className="h-3 w-3" />
              {task.metadata?.dueDate 
                ? (() => {
                    const date = new Date(task.metadata.dueDate);
                    const today = new Date();
                    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) return 'Overdue';
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return 'Tomorrow';
                    if (diffDays <= 7) return `${diffDays}d`;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })()
                : "Due date"}
            </button>
          )}
          
          {/* Click outside to close */}
          {showDatePicker && (
            <div 
              className="fixed inset-0 z-0" 
              onClick={() => setShowDatePicker(false)}
            />
          )}
        </div>
      )}

      {/* Duration Selector */}
      <div className="relative">
          {showDurationSelect ? (
          <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
            <button
        className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-500 hover:bg-gray-50"
        onClick={() => {
          onSetDuration("");
          setShowDurationSelect(false);
        }}
            >
        No duration
            </button>
            {durations.map((duration) => (
        <button
          key={duration.value}
          className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50"
          onClick={() => {
            onSetDuration(duration.value);
            setShowDurationSelect(false);
          }}
        >
          {duration.label}
        </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowDurationSelect(true)}
            className={cn(
        "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
        task.metadata?.duration
          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
          >
            <Clock className="h-3 w-3" />
            {getDurationDisplay(task.metadata?.duration)}
          </button>
        )}
        
        {/* Click outside to close */}
        {showDurationSelect && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowDurationSelect(false)}
          />
        )}
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

interface InventoryViewCompleteProps {
  userId: string | null;
  onDataUpdate?: (data: any) => void;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export default function InventoryViewComplete({ userId, onDataUpdate, refreshTrigger }: InventoryViewCompleteProps) {
  
  // Profile fields
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    occupation: "",
    location: "",
    bio: "",
  });
  const [isEditingField, setIsEditingField] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [projectTasksView, setProjectTasksView] = useState<'active' | 'completed'>('active');
  
  // View filters for each section
  const [projectsView, setProjectsView] = useState<'active' | 'completed'>('active');
  const [eventsView, setEventsView] = useState<'upcoming' | 'past'>('upcoming');
  const [backlogView, setBacklogView] = useState<'active' | 'completed'>('active');
  const [routinesView, setRoutinesView] = useState<'active' | 'past'>('active');
  
  const [goals, setGoals] = useState<ContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>('saved');

  const [sections, setSections] = useState<{ [key: string]: ContextItem[] }>({
    projects: [],
    backlog: [],
    events: [],
    routines: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter functions for different views
  const getFilteredProjects = () => {
    if (projectsView === 'completed') {
      return sections.projects.filter(p => p.metadata?.completed === true);
    }
    return sections.projects.filter(p => p.metadata?.completed !== true);
  };

  const getFilteredEvents = () => {
    const now = new Date();
    if (eventsView === 'past') {
      return sections.events.filter(e => {
        if (!e.metadata?.dueDate) return false;
        return new Date(e.metadata.dueDate) < now;
      });
    }
    return sections.events.filter(e => {
      if (!e.metadata?.dueDate) return true; // Events without dates are considered upcoming
      return new Date(e.metadata.dueDate) >= now;
    });
  };

  const getFilteredBacklog = () => {
    if (backlogView === 'completed') {
      return sections.backlog.filter(t => t.metadata?.completed === true);
    }
    return sections.backlog.filter(t => t.metadata?.completed !== true);
  };

  const getFilteredRoutines = () => {
    const now = new Date();
    if (routinesView === 'past') {
      return sections.routines.filter(r => {
        if (!r.metadata?.routineEndDate) return false;
        return new Date(r.metadata.routineEndDate) < now;
      });
    }
    return sections.routines.filter(r => {
      if (!r.metadata?.routineEndDate) return true; // Routines without end dates are considered active
      return new Date(r.metadata.routineEndDate) >= now;
    });
  };

  // Debounced save function for profile data
  const saveProfileToDb = useCallback(async (data: typeof profileData) => {
    if (!userId) return;
    
    console.log('Saving profile data:', data);
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/you/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('Profile save response:', result);
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        console.error('Profile save failed:', result);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
    }
  }, [userId]);

  const debouncedSaveProfile = useMemo(
    () => debounce(saveProfileToDb, 500),
    [saveProfileToDb]
  );

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/you');
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        console.log('Fetched data from /api/you:', data);
        
        // Set profile data if available
        if (data.profileData) {
          console.log('Setting profile data:', data.profileData);
          setProfileData(prev => ({
            ...prev,
            ...data.profileData
          }));
        }
        
        // Set goals
        if (data.goals) {
          setGoals(data.goals);
        }
        
        // Set sections
        if (data.sections) {
          console.log('Setting sections, routines data:', data.sections.routines);
          setSections(data.sections);
        }
        
        // Mark as saved since we just loaded from DB
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // You might want to show a toast or error message here
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);
  
  // Re-fetch data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('[InventoryView] Refresh triggered:', refreshTrigger);
      const fetchData = async () => {
        if (!userId) return;
        
        try {
          const response = await fetch('/api/you');
          
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          
          const data = await response.json();
          console.log('[InventoryView] Refreshed data from /api/you:', data);
          
          // Set profile data if available
          if (data.profileData) {
            setProfileData(prev => ({
              ...prev,
              ...data.profileData
            }));
          }
          
          // Set goals
          if (data.goals) {
            setGoals(data.goals);
          }
          
          // Set sections
          if (data.sections) {
            setSections(data.sections);
          }
          
          // Mark as saved since we just loaded from DB
          setSaveStatus('saved');
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('[InventoryView] Error refreshing data:', error);
        }
      };
      
      fetchData();
    }
  }, [refreshTrigger, userId]);

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({ sections, goals, events: sections.events || [], routines: sections.routines || [] });
    }
  }, [sections, goals]); // Remove onDataUpdate from dependencies to prevent infinite loop

  const handleAddGoal = async () => {
    const gradients = [
      "from-pink-100 to-rose-100",
      "from-orange-100 to-amber-100",
      "from-yellow-100 to-lime-100",
      "from-purple-100 to-indigo-100",
      "from-blue-100 to-cyan-100",
      "from-green-100 to-emerald-100",
    ];
    
    // Assign the next available gradient or cycle through
    const nextColorIndex = goals.length % gradients.length;
    
    // Set default deadline to 30 days from now
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);
    
    const tempId = `temp_${Date.now()}`; // Make temp IDs clearly identifiable
    const newGoal: ContextItem = {
      id: tempId,
      deadline: defaultDeadline.toISOString(),
      content: "New goal",
      type: "goal",
      color: gradients[nextColorIndex],
    };
    
    // Optimistic update
    setGoals(prev => [...prev, newGoal]);
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/you/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tempId,
          content: "New goal",
          color: gradients[nextColorIndex],
          order: goals.length
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update with real ID from database
        if (data.goal?._id) {
          setGoals(prev => prev.map(g => 
            g.id === tempId ? { ...g, id: data.goal._id } : g
          ));
        }
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      setSaveStatus('error');
    }
  };

  const handleEditGoal = async (itemId: string, newContent: string, deadline?: string) => {
    console.log('🎯 handleEditGoal called:', { itemId, newContent, deadline, hasDeadline: deadline !== undefined });
    
    // Optimistic update
    setGoals(prev => prev.map(item =>
      item.id === itemId ? { ...item, content: newContent, ...(deadline !== undefined && { deadline }) } : item
    ));
    setSaveStatus('saving');
    
    try {
      const goal = goals.find(g => g.id === itemId);
      const requestBody = {
        id: itemId,
        content: newContent,
        color: goal?.color,
        deadline: deadline !== undefined ? deadline : goal?.deadline,
        order: goals.findIndex(g => g.id === itemId)
      };
      console.log('🎯 Sending to API:', requestBody);
      
      const response = await fetch('/api/you/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Response from API:', data);
        
        // Update the goal with the data from the server (including deadline)
        if (data.goal) {
          setGoals(prev => prev.map(item =>
            item.id === itemId ? { 
              ...item, 
              id: data.goal._id || itemId,
              deadline: data.goal.deadline,
              content: data.goal.content,
              color: data.goal.color
            } : item
          ));
          console.log('🎯 Updated goal with server data, deadline:', data.goal.deadline);
        }
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Error editing goal:', error);
      setSaveStatus('error');
    }
  };

  const handleDeleteGoal = async (itemId: string) => {
    // Optimistic update
    setGoals(prev => prev.filter(item => item.id !== itemId));
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/you/goals?id=${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      setSaveStatus('error');
    }
  };

  const handleAddItem = (sectionKey: string) => {
    const tempId = Date.now().toString();
    
    // Different default content for events
    const defaultContent = sectionKey === "events" ? "New event" : "New item";
    
    const newItem: ContextItem = {
      id: tempId,
      content: defaultContent,
      type: sectionKey === "projects" ? "project" : 
            sectionKey === "routines" ? "routine" :
            sectionKey === "events" ? "event" : "task",
      metadata: sectionKey === "backlog" ? { completed: false } : 
                sectionKey === "events" ? { 
                  startTime: "09:00", 
                  endTime: "10:00",
                  dueDate: new Date().toISOString()
                } : 
                sectionKey === "routines" ? {
                  startTime: "07:00",
                  duration: 60,
                  days: [],
                  routineName: defaultContent,
                  routineStartDate: new Date().toISOString().split('T')[0],
                  routineEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                } : undefined,
      tasks: (sectionKey === "projects" || sectionKey === "routines") ? [] : undefined,
      isExpanded: false,
    };
    
    // Optimistic update
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: [...prev[sectionKey], newItem],
      }));
    };
    
    // Determine type for API
    const type = sectionKey === "projects" ? "project" : 
           sectionKey === "routines" ? "routine" :
           sectionKey === "events" ? "event" : "task";
    
    // Build appropriate data for each type
    let itemData: any = { name: defaultContent };
    
    if (type === "event") {
      // Events require startTime and endTime
      itemData = {
        name: "New event",
        startTime: "09:00",
        endTime: "10:00",
        dueDate: new Date().toISOString() // Default to today
      };
    } else if (type === "routine") {
      // Routines need specific properties including required dates
      const today = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Default to 3 months from now
      
      itemData = {
        name: "New routine",
        startTime: "07:00",
        duration: 60,
        days: [],
        tasks: [],
        startDate: today.toISOString().split('T')[0], // Required field
        endDate: endDate.toISOString().split('T')[0]  // Required field
      };
    }
    
    // Save to database
    updateSingleItem(type, tempId, itemData, optimisticUpdate, sectionKey);
  };

  const handleEditItem = (sectionKey: string, itemId: string, newContent: string) => {
    console.log('handleEditItem called:', { sectionKey, itemId, newContent });
    
    // Determine item type
    const type = sectionKey === 'projects' ? 'project' : 
           sectionKey === 'routines' ? 'routine' :
           sectionKey === 'events' ? 'event' : 'task';
    
    // Optimistic update
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId ? { ...item, content: newContent } : item
        ),
      }));
    };
    
    // Send update to server with optimistic update
    updateSingleItem(type, itemId, { name: newContent }, optimisticUpdate, sectionKey);
  };

  const handleDeleteItem = async (sectionKey: string, itemId: string) => {
    // Determine item type
    const type = sectionKey === 'projects' ? 'project' : 
           sectionKey === 'routines' ? 'routine' :
           sectionKey === 'events' ? 'event' : 'task';
    
    // Optimistic update - remove from UI immediately
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter(item => item.id !== itemId),
    }));
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/you/items?type=${type}&id=${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        // Revert if failed
        console.error('Failed to delete item');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setSaveStatus('error');
    }
  };

  const handleToggleComplete = (sectionKey: string, itemId: string) => {
    const item = sections[sectionKey].find(i => i.id === itemId);
    if (!item) return;
    
    const newCompleted = !item.metadata?.completed;
    
    // Optimistic update
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, completed: newCompleted } }
            : item
        ),
      }));
    };
    
    // Send update to server
    updateSingleItem('task', itemId, { completed: newCompleted }, optimisticUpdate);
  };
  
  const handleAssignGoal = (sectionKey: string, itemId: string, goalId: string | null) => {
    // Determine item type
    const type = sectionKey === 'projects' ? 'project' : 
           sectionKey === 'routines' ? 'routine' :
           sectionKey === 'events' ? 'event' : 'task';
    
    // Optimistic update
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, goalId: goalId || undefined } }
            : item
        ),
      }));
    };
    
    // Send update to server
    updateSingleItem(type, itemId, { goalId: goalId || null }, optimisticUpdate);
  };
  
  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
  };
  
  const handleOpenRoutine = (routineId: string) => {
    setCurrentRoutineId(routineId);
  };
  
  const handleAddTask = async (sectionKey: string, parentId: string, taskContent: string) => {
    console.log('handleAddTask called:', { sectionKey, parentId, taskContent });
    
    const tempId = Date.now().toString();
    const newTask = {
      id: tempId,
      content: taskContent,
      type: "task" as const,
      metadata: { 
        completed: false, 
        ...(sectionKey === "projects" ? { projectId: parentId } : { routineId: parentId })
      }
    };
    
    console.log('New task object:', newTask);
    
    // Optimistic update
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: [...(item.tasks || []), newTask]
            }
          : item
      ),
    }));
    setSaveStatus('saving');
    
    const requestBody = {
      type: 'task',
      data: {
        title: taskContent,  // Changed from 'name' to 'title'
        duration: 30,  // Default 30 minutes
        completed: false,
        ...(sectionKey === "projects" ? { projectId: parentId } : { routineId: parentId })
      }
    };
    
    console.log('Sending POST request with body:', requestBody);
    
    try {
      const response = await fetch('/api/you/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        // Update with real ID from database
        if (data.item?._id) {
          console.log('Updating task with real ID:', data.item._id);
          setSections(prev => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
              ...item, 
              tasks: item.tasks?.map(task => 
                task.id === tempId ? { ...task, id: data.item._id } : task
              )
            }
          : item
            ),
          }));
        } else {
          console.error('No item._id in response:', data);
        }
        setSaveStatus('saved');
        setHasUnsavedChanges(true);
      } else {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setSaveStatus('error');
    }
  };
  
  // Create a debounced version of the save function
  const debouncedTaskSave = useRef(
    debounce(async (sectionKey: string, parentId: string, taskId: string, content: string) => {
      // Don't save if it's still a temporary ID (not yet created on server)
      const isTemporaryId = taskId && !taskId.match(/^[0-9a-fA-F]{24}$/);
      if (isTemporaryId) {
        console.log('Skipping save for temporary task ID:', taskId);
        return;
      }
      
      setSaveStatus('saving');
      
      try {
        const response = await fetch('/api/you/items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'task',
            id: taskId,
            updates: { title: content }  // Changed from 'name' to 'title' to match Task model
          }),
        });
        
        if (response.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Error editing task:', error);
        setSaveStatus('error');
      }
    }, 500) // Debounce for 500ms
  ).current;

  const handleEditTask = (sectionKey: string, parentId: string, taskId: string, content: string) => {
    // Immediate optimistic update for smooth typing
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: item.tasks?.map(task => 
          task.id === taskId ? { ...task, content } : task
        )
            }
          : item
      ),
    }));
    
    // Debounced save to database
    debouncedTaskSave(sectionKey, parentId, taskId, content);
  };
  
  const handleDeleteTask = async (sectionKey: string, parentId: string, taskId: string) => {
    // Optimistic update - remove from UI immediately
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: item.tasks?.filter(task => task.id !== taskId)
            }
          : item
      ),
    }));
    setSaveStatus('saving');
    
    try {
      const response = await fetch(`/api/you/items?type=task&id=${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        console.error('Failed to delete task');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setSaveStatus('error');
    }
  };
  
  const handleToggleTask = async (sectionKey: string, parentId: string, taskId: string) => {
    // Find the current task state
    const parent = sections[sectionKey].find(item => item.id === parentId);
    const task = parent?.tasks?.find(t => t.id === taskId);
    const newCompleted = !task?.metadata?.completed;
    
    // Optimistic update
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: item.tasks?.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                metadata: { 
                  ...task.metadata, 
                  completed: newCompleted,
                  completedAt: newCompleted ? new Date().toISOString() : undefined
                } 
              }
            : task
        )
            }
          : item
      ),
    }));
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/you/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          id: taskId,
          updates: { completed: newCompleted }
        }),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      setSaveStatus('error');
    }
  };

  const handleSetTaskDuration = async (sectionKey: string, parentId: string, taskId: string, duration: string) => {
    // Convert duration string to minutes for the database
    const parseDurationToMinutes = (dur: string): number => {
      if (!dur) return 30; // Default
      const match = dur.match(/^(\d+(?:\.\d+)?)(m|h)$/);
      if (!match) return 30;
      const value = parseFloat(match[1]);
      const unit = match[2];
      return unit === 'h' ? value * 60 : value;
    };
    
    const durationInMinutes = parseDurationToMinutes(duration);
    
    // Optimistic update
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: item.tasks?.map(task => 
          task.id === taskId 
            ? { ...task, metadata: { ...task.metadata, duration } }
            : task
        )
            }
          : item
      ),
    }));
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/you/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          id: taskId,
          updates: { duration: durationInMinutes } // Send as number in minutes
        }),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error setting task duration:', error);
      setSaveStatus('error');
    }
  };

  const handleSetTaskDueDate = async (sectionKey: string, parentId: string, taskId: string, dueDate: string) => {
    // Optimistic update
    setSections(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === parentId 
          ? { 
        ...item, 
        tasks: item.tasks?.map(task => 
          task.id === taskId 
            ? { ...task, metadata: { ...task.metadata, dueDate: dueDate || undefined } }
            : task
        )
            }
          : item
      ),
    }));
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/you/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          id: taskId,
          updates: { dueDate: dueDate || null }
        }),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error setting task due date:', error);
      setSaveStatus('error');
    }
  };

  const handleSetBacklogDuration = (sectionKey: string, itemId: string, duration: string) => {
    // Convert duration string to minutes for the database
    const parseDurationToMinutes = (dur: string): number => {
      if (!dur) return 30; // Default
      const match = dur.match(/^(\d+(?:\.\d+)?)(m|h)$/);
      if (!match) return 30;
      const value = parseFloat(match[1]);
      const unit = match[2];
      return unit === 'h' ? value * 60 : value;
    };
    
    const durationInMinutes = parseDurationToMinutes(duration);
    
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, duration } }
            : item
        ),
      }));
    };
    
    updateSingleItem('task', itemId, { duration: durationInMinutes }, optimisticUpdate);
  };

  const handleSetBacklogDueDate = (sectionKey: string, itemId: string, dueDate: string) => {
    const type = sectionKey === 'projects' ? 'project' : 
           sectionKey === 'events' ? 'event' : 'task';
    
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, dueDate } }
            : item
        ),
      }));
    };
    
    updateSingleItem(type, itemId, { dueDate: dueDate || null }, optimisticUpdate);
  };

  const handleToggleScheduled = (sectionKey: string, itemId: string, isScheduled: boolean) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, isScheduled } }
            : item
        ),
      }));
    };
    
    updateSingleItem('task', itemId, { isScheduled }, optimisticUpdate);
  };

  const handleSetEventTime = (sectionKey: string, itemId: string, startTime: string, endTime: string) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, startTime, endTime } }
            : item
        ),
      }));
    };
    
    updateSingleItem('event', itemId, { startTime, endTime }, optimisticUpdate);
  };

  const handleSetRecurring = (sectionKey: string, itemId: string, isRecurring: boolean, days: string[]) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { 
          ...item, 
          metadata: { 
            ...item.metadata, 
            isRecurring, 
            recurringDays: days,
            // Clear date if switching to recurring
            dueDate: isRecurring ? undefined : item.metadata?.dueDate
          } 
        }
            : item
        ),
      }));
    };
    
    updateSingleItem('event', itemId, { isRecurring, recurringDays: days }, optimisticUpdate);
  };

  const handleSetZoomLink = (sectionKey: string, itemId: string, zoomLink: string) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, zoomLink } }
            : item
        ),
      }));
    };
    
    updateSingleItem('event', itemId, { zoomLink: zoomLink || null }, optimisticUpdate);
  };

  const handleSetRoutineDates = (sectionKey: string, itemId: string, startDate: string, endDate: string | undefined) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, routineStartDate: startDate, routineEndDate: endDate } }
            : item
        ),
      }));
    };
    
    updateSingleItem('routine', itemId, { startDate, endDate }, optimisticUpdate);
  };

  const handleSetRoutineTime = (sectionKey: string, itemId: string, startTime: string, duration: number) => {
    const optimisticUpdate = () => {
      setSections(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].map(item =>
          item.id === itemId 
            ? { ...item, metadata: { ...item.metadata, startTime, duration } }
            : item
        ),
      }));
    };
    
    updateSingleItem('routine', itemId, { startTime, duration }, optimisticUpdate);
  };

  const handleDragEnd = async (event: DragEndEvent, items: ContextItem[], setItems: any, type: string) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      // Calculate new order
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);
      
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      
      // Update state optimistically
      setItems(newItems);
      
      // Fast reorder API call
      if (userId) {
        console.log('Reordering', type, ':', newItems.map(item => ({ id: item.id, content: item.content })));
        setSaveStatus('saving');
        try {
          const response = await fetch('/api/you/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, items: newItems })
          });
          
          const result = await response.json();
          console.log('Reorder response:', result);
          
          if (response.ok) {
            setSaveStatus('saved');
            setLastSaveTime(new Date());
          } else {
            console.error('Reorder failed:', result);
            setSaveStatus('error');
            // Revert on failure
            setItems(items);
          }
        } catch (error) {
          console.error('Reorder error:', error);
          setSaveStatus('error');
          // Revert on failure
          setItems(items);
        }
      }
    }
  };
  
  // Calculate counts for each goal
  const getGoalCounts = (goalId: string) => {
    const projectCount = sections.projects.filter(p => p.metadata?.goalId === goalId).length;
    const taskCount = sections.backlog.filter(t => t.metadata?.goalId === goalId).length;
    const routineCount = sections.routines.filter(r => r.metadata?.goalId === goalId).length;
    const eventCount = sections.events.filter(e => e.metadata?.goalId === goalId).length;
    
    return {
      projects: projectCount,
      tasks: taskCount,
      routines: routineCount,
      events: eventCount
    };
  };

  // Get filtered sections based on selected goal and view filters
  const getFilteredSections = () => {
    let filteredProjects = getFilteredProjects();
    let filteredEvents = getFilteredEvents();
    let filteredBacklog = getFilteredBacklog();
    let filteredRoutines = getFilteredRoutines();
    
    // Apply goal filter if a goal is selected
    if (selectedGoalId) {
      filteredProjects = filteredProjects.filter(p => p.metadata?.goalId === selectedGoalId);
      filteredBacklog = filteredBacklog.filter(t => t.metadata?.goalId === selectedGoalId);
      filteredRoutines = filteredRoutines.filter(r => r.metadata?.goalId === selectedGoalId);
      filteredEvents = filteredEvents.filter(e => e.metadata?.goalId === selectedGoalId);
    }
    
    return {
      projects: filteredProjects,
      backlog: filteredBacklog,
      routines: filteredRoutines,
      events: filteredEvents,
    };
  };
  
  const filteredSections = getFilteredSections();

  // Optimistic update for single item changes
  const updateSingleItem = useCallback(async (
    type: string,
    id: string,
    updates: any,
    optimisticUpdate: () => void,
    sectionKey?: string
  ) => {
    console.log('updateSingleItem called:', { type, id, updates, userId });
    if (!userId) {
      console.log('No userId, skipping save');
      return;
    }
    
    // Apply optimistic update immediately
    optimisticUpdate();
    setSaveStatus('saving');
    console.log('Save status set to saving');
    
    try {
      const response = await fetch('/api/you/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id, updates }),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      // If this was a new item, update its ID in our state
      if (data.isNew && data.id && sectionKey) {
        setSections(prev => ({
          ...prev,
          [sectionKey]: prev[sectionKey].map(item =>
            item.id === id ? { ...item, id: data.id } : item
          ),
        }));
      }
      
      // Log success for routine updates
      if (type === 'routine' && (updates.startTime || updates.duration)) {
        console.log('✅ Routine time saved successfully:', updates);
      }
      
      setSaveStatus('saved');
      setLastSaveTime(new Date());
      console.log('Save completed successfully');
    } catch (error) {
      console.error('Update error:', error);
      setSaveStatus('error');
      // TODO: Revert optimistic update on error
    }
  }, [userId]);

  // Auto-save function for bulk changes
  const handleAutoSave = useCallback(async (data: any) => {
    if (!userId) return;
    
    try {
      setSaveStatus('saving');
      
      const response = await fetch('/api/you', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      
      setLastSaveTime(new Date());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      // Keep unsaved changes flag true on error
    }
  }, [userId]);

  // Disable bulk auto-save - we'll use granular updates instead
  const { saveNow } = useAutoSave({
    data: { profileData, goals, sections },
    onSave: handleAutoSave,
    delay: 500, // Save after 500ms of inactivity
    enabled: false // Disabled - using granular updates instead
  });

  const handleSave = async () => {
    await saveNow();
  };

  // Get current project if selected
  const currentProject = currentProjectId 
    ? sections.projects.find(p => p.id === currentProjectId)
    : null;
    
  // Get current routine if selected
  const currentRoutine = currentRoutineId
    ? sections.routines.find(r => r.id === currentRoutineId)
    : null;

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-mono">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <SharedNavbar viewMode="you" />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-8 relative">
        {/* Profile Section - Full Width */}
        <div className="space-y-6">
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider">Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-mono text-gray-500">name</label>
                {isEditingField === "name" ? (
                  <Input
                    value={profileData.name}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, name: e.target.value }));
                      debouncedSaveProfile({ ...profileData, name: e.target.value });
                    }}
                    onBlur={() => setIsEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingField(null)}
                    className="mt-1 font-mono text-sm border-0 border-b rounded-none focus:ring-0 focus:border-blue-500"
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-sm font-mono mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingField("name")}
                  >
                    {profileData.name || "—"}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-mono text-gray-500">email</label>
                {isEditingField === "email" ? (
                  <Input
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, email: e.target.value }));
                      debouncedSaveProfile({ ...profileData, email: e.target.value });
                    }}
                    onBlur={() => setIsEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingField(null)}
                    className="mt-1 font-mono text-sm border-0 border-b rounded-none focus:ring-0 focus:border-blue-500"
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-sm font-mono mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingField("email")}
                  >
                    {profileData.email || "—"}
                  </p>
                )}
            </div>
            
            <div>
              <label className="text-xs font-mono text-gray-500">occupation</label>
                {isEditingField === "occupation" ? (
                  <Input
                    value={profileData.occupation}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, occupation: e.target.value }));
                      debouncedSaveProfile({ ...profileData, occupation: e.target.value });
                    }}
                    onBlur={() => setIsEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingField(null)}
                    className="mt-1 font-mono text-sm border-0 border-b rounded-none focus:ring-0 focus:border-blue-500"
                    placeholder="e.g., Software Engineer"
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-sm font-mono mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingField("occupation")}
                  >
                    {profileData.occupation || "—"}
                  </p>
                )}
            </div>
            
            <div>
              <label className="text-xs font-mono text-gray-500">location</label>
                {isEditingField === "location" ? (
                  <Input
                    value={profileData.location}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, location: e.target.value }));
                      debouncedSaveProfile({ ...profileData, location: e.target.value });
                    }}
                    onBlur={() => setIsEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingField(null)}
                    className="mt-1 font-mono text-sm border-0 border-b rounded-none focus:ring-0 focus:border-blue-500"
                    placeholder="e.g., San Francisco, CA"
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-sm font-mono mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingField("location")}
                  >
                    {profileData.location || "—"}
                  </p>
                )}
            </div>
          </div>
          
          <div>
              <label className="text-xs font-mono text-gray-500">bio</label>
            {isEditingField === "bio" ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => {
                  setProfileData(prev => ({ ...prev, bio: e.target.value }));
                  debouncedSaveProfile({ ...profileData, bio: e.target.value });
                }}
                onBlur={() => setIsEditingField(null)}
                className="mt-1 font-mono text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] w-full px-3 py-2"
                placeholder="Tell the AI about your work style, energy patterns, and preferences..."
                autoFocus
              />
            ) : (
              <p 
                className="text-sm font-mono mt-1 cursor-pointer hover:text-blue-600 transition-colors whitespace-pre-wrap"
                onClick={() => setIsEditingField("bio")}
              >
                {profileData.bio || "Click to add bio..."}
              </p>
              )}
            </div>
        </div>

        {/* Goals Section - Full Width Below */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider">
              Goals <span className="text-gray-400 ml-2">{goals.length}</span>
            </h2>
            <button
              onClick={handleAddGoal}
              className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => {
                console.log('Drag started for goal:', event.active.id);
                setActiveId(event.active.id as string);
              }}
              onDragEnd={(event) => {
                console.log('Drag ended for goal:', event.active.id, '→', event.over?.id);
                setActiveId(null);
                handleDragEnd(event, goals, setGoals, 'goals');
              }}
            >
              <SortableContext
                items={goals.map(g => g.id)}
                strategy={rectSortingStrategy}
              >
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(${
                      goals.length <= 3 ? '200px' :
                      goals.length <= 6 ? '160px' :
                      goals.length <= 9 ? '130px' :
                      '110px'
                    }, 1fr))`,
                    maxWidth: goals.length <= 3 ? '700px' : '100%'
                  }}
                >
                  {goals.length === 0 ? (
                    <p className="text-gray-400 text-sm font-mono col-span-full">No goals yet</p>
                  ) : (
                    goals.map((item, index) => (
                      <div 
                        key={item.id}
                        style={{
                          maxWidth: goals.length <= 3 ? '200px' :
                                   goals.length <= 6 ? '160px' :
                                   goals.length <= 9 ? '130px' :
                                   '110px'
                        }}
                      >
                        <GoalCard
                          item={item}
                          index={index}
                          onEdit={handleEditGoal}
                          onDelete={handleDeleteGoal}
                          onSelect={(goalId) => {
                            setSelectedGoalId(selectedGoalId === goalId ? null : goalId);
                            setCurrentProjectId(null);
                            setCurrentRoutineId(null);
                          }}
                          isSelected={selectedGoalId === item.id}
                          counts={getGoalCounts(item.id)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="opacity-50">
                    <GoalCard
                      item={goals.find(g => g.id === activeId)!}
                      index={goals.findIndex(g => g.id === activeId)}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onSelect={() => {}}
                      isSelected={selectedGoalId === activeId}
                      counts={getGoalCounts(activeId)}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
        </div>

        {/* Full Width Tabs Section */}
        <div className="space-y-4">
          {/* Tabs always visible */}
          <div className="flex border-b">
            {Object.keys(sections).map((key) => {
              // Get the appropriate icon for each tab
              const getTabIcon = (tabKey: string) => {
                switch(tabKey) {
                  case 'projects':
                    return <Folder className="h-3.5 w-3.5" />;
                  case 'backlog':
                    return <CheckSquare className="h-3.5 w-3.5" />;
                  case 'routines':
                    return <RefreshCw className="h-3.5 w-3.5" />;
                  case 'events':
                    return <Calendar className="h-3.5 w-3.5" />;
                  default:
                    return null;
                }
              };
              
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setCurrentProjectId(null); // Reset project view when switching tabs
                    setCurrentRoutineId(null); // Reset routine view when switching tabs
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-mono transition-colors relative",
                    activeTab === key
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {getTabIcon(key)}
                  <span>{key}</span>
                  <span className="ml-1 text-gray-400">{filteredSections[key].length}</span>
                  {activeTab === key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Breadcrumb when inside a project */}
          {currentProject && activeTab === "projects" && (
            <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
              <button
                onClick={() => setCurrentProjectId(null)}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Home className="h-3 w-3" />
                All Projects
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-700">{currentProject.content}</span>
            </div>
          )}
          
          {/* Breadcrumb when inside a routine */}
          {currentRoutine && activeTab === "routines" && (
            <div className="flex items-center gap-2 text-sm font-mono text-gray-500">
              <button
                onClick={() => setCurrentRoutineId(null)}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Home className="h-3 w-3" />
                All Routines
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-700">{currentRoutine.content}</span>
            </div>
          )}
          
          {/* Show project tasks when inside a project */}
          {currentProject && activeTab === "projects" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                    Tasks in {currentProject.content}
                  </span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setProjectTasksView('active')}
                      className={cn(
                        "px-2 py-0.5 text-xs font-mono rounded transition-all",
                        projectTasksView === 'active' 
                          ? "bg-white text-gray-700 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setProjectTasksView('completed')}
                      className={cn(
                        "px-2 py-0.5 text-xs font-mono rounded transition-all",
                        projectTasksView === 'completed' 
                          ? "bg-white text-gray-700 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Completed
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleAddTask("projects", currentProject.id, "New task")}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {(() => {
                // Filter tasks based on view
                const filteredTasks = currentProject.tasks?.filter(task => 
                  projectTasksView === 'active' 
                    ? !task.metadata?.completed 
                    : task.metadata?.completed
                ).sort((a, b) => {
                  // Sort completed tasks by completion date (newest first)
                  if (projectTasksView === 'completed' && a.metadata?.completedAt && b.metadata?.completedAt) {
                    return new Date(b.metadata.completedAt).getTime() - new Date(a.metadata.completedAt).getTime();
                  }
                  return 0;
                }) || [];
                
                if (filteredTasks.length === 0) {
                  return (
                    <p className="text-gray-400 text-sm font-mono">
                      No {projectTasksView} tasks
                    </p>
                  );
                }
                
                // Only wrap in DndContext if viewing active tasks
                if (projectTasksView === 'active') {
                  return (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        const { active, over } = e;
                        if (active.id !== over?.id && currentProject.tasks) {
                          const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
                          const newIndex = filteredTasks.findIndex((task) => task.id === over?.id);
                          
                          if (oldIndex !== -1 && newIndex !== -1) {
                            setSections(prev => ({
                              ...prev,
                              projects: prev.projects.map(project => 
                                project.id === currentProject.id
                                  ? {
                                      ...project,
                                      tasks: (() => {
                                        const newTasks = [...(project.tasks || [])];
                                        const [removed] = newTasks.splice(oldIndex, 1);
                                        newTasks.splice(newIndex, 0, removed);
                                        return newTasks;
                                      })()
                                    }
                                  : project
                              )
                            }));
                            setHasUnsavedChanges(true);
                          }
                        }
                      }}
                    >
                      <SortableContext
                        items={filteredTasks}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {filteredTasks.map((task, idx) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              projectId={currentProject.id}
                              index={idx}
                              onToggle={() => handleToggleTask("projects", currentProject.id, task.id)}
                              onEdit={(content) => handleEditTask("projects", currentProject.id, task.id, content)}
                              onDelete={() => handleDeleteTask("projects", currentProject.id, task.id)}
                              onSetDuration={(duration) => handleSetTaskDuration("projects", currentProject.id, task.id, duration)}
                              onSetDueDate={(dueDate) => handleSetTaskDueDate("projects", currentProject.id, task.id, dueDate)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  );
                } else {
                  // Non-draggable version for completed tasks or when not filtered
                  return (
                    <div className="space-y-2">
                      {filteredTasks.map((task, idx) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          projectId={currentProject.id}
                          index={projectTasksView === 'completed' ? undefined : idx}
                          isDraggable={false}
                          onToggle={() => handleToggleTask("projects", currentProject.id, task.id)}
                          onEdit={(content) => handleEditTask("projects", currentProject.id, task.id, content)}
                          onDelete={() => handleDeleteTask("projects", currentProject.id, task.id)}
                          onSetDuration={(duration) => handleSetTaskDuration("projects", currentProject.id, task.id, duration)}
                          onSetDueDate={(dueDate) => handleSetTaskDueDate("projects", currentProject.id, task.id, dueDate)}
                        />
                      ))}
                    </div>
                  );
                }
              })()}
            </div>
          ) : currentRoutine && activeTab === "routines" ? (
            /* Show routine tasks when inside a routine */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  Tasks in {currentRoutine.content}
                </span>
                <button
                  onClick={() => handleAddTask("routines", currentRoutine.id, "New task")}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {(!currentRoutine.tasks || currentRoutine.tasks.length === 0) ? (
                <p className="text-gray-400 text-sm font-mono">No tasks yet</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => {
                    const { active, over } = e;
                    if (active.id !== over?.id && currentRoutine.tasks) {
                      const oldIndex = currentRoutine.tasks.findIndex((task) => task.id === active.id);
                      const newIndex = currentRoutine.tasks.findIndex((task) => task.id === over?.id);
                      
                      if (oldIndex !== -1 && newIndex !== -1) {
                        setSections(prev => ({
                          ...prev,
                          routines: prev.routines.map(routine => 
                            routine.id === currentRoutine.id
                              ? {
                                  ...routine,
                                  tasks: (() => {
                                    const newTasks = [...(routine.tasks || [])];
                                    const [removed] = newTasks.splice(oldIndex, 1);
                                    newTasks.splice(newIndex, 0, removed);
                                    return newTasks;
                                  })()
                                }
                              : routine
                          )
                        }));
                        setHasUnsavedChanges(true);
                      }
                    }
                  }}
                >
                  <SortableContext
                    items={currentRoutine.tasks || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {currentRoutine.tasks.map((task, idx) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          projectId={currentRoutine.id}
                          index={idx}
                          onToggle={() => handleToggleTask("routines", currentRoutine.id, task.id)}
                          onEdit={(content) => handleEditTask("routines", currentRoutine.id, task.id, content)}
                          onDelete={() => handleDeleteTask("routines", currentRoutine.id, task.id)}
                          onSetDuration={(duration) => handleSetTaskDuration("routines", currentRoutine.id, task.id, duration)}
                          isRoutineTask={true}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : (
            /* Show regular list when not inside a project */
            Object.entries(filteredSections).map(([key, items]) => (
              <div
                key={key}
                className={cn(
                  "space-y-2",
                  activeTab === key ? "block" : "hidden"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      {key}
                    </span>
                    {/* View toggle buttons */}
                    {key === "projects" && (
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setProjectsView('active')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            projectsView === 'active' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setProjectsView('completed')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            projectsView === 'completed' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Completed
                        </button>
                      </div>
                    )}
                    {key === "events" && (
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setEventsView('upcoming')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            eventsView === 'upcoming' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Upcoming
                        </button>
                        <button
                          onClick={() => setEventsView('past')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            eventsView === 'past' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Past
                        </button>
                      </div>
                    )}
                    {key === "backlog" && (
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setBacklogView('active')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            backlogView === 'active' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setBacklogView('completed')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            backlogView === 'completed' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Completed
                        </button>
                      </div>
                    )}
                    {key === "routines" && (
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setRoutinesView('active')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            routinesView === 'active' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setRoutinesView('past')}
                          className={cn(
                            "px-2 py-0.5 text-xs font-mono rounded transition-all",
                            routinesView === 'past' 
                              ? "bg-white text-gray-700 shadow-sm" 
                              : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Past
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddItem(key)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Only enable drag-and-drop for projects and backlog when filtered by goal */}
                {selectedGoalId && (key === 'projects' || key === 'backlog') ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => {
                      const { active, over } = e;
                      if (active.id !== over?.id) {
                        setSections(prev => {
                          const oldIndex = prev[key].findIndex((item) => item.id === active.id);
                          const newIndex = prev[key].findIndex((item) => item.id === over?.id);
                          
                          const newItems = [...prev[key]];
                          const [removed] = newItems.splice(oldIndex, 1);
                          newItems.splice(newIndex, 0, removed);
                          
                          return { ...prev, [key]: newItems };
                        });
                        setHasUnsavedChanges(true);
                        handleDragEnd(e, items, (newItems) => {
                          setSections(prev => ({ ...prev, [key]: newItems }));
                        }, key);
                      }
                    }}
                  >
                    <SortableContext
                      items={items}
                      strategy={verticalListSortingStrategy}
                    >
                      {items.length === 0 ? (
                      <p className="text-gray-400 text-sm font-mono">
                        {selectedGoalId 
                          ? `No ${key} assigned to this goal` 
                          : `No ${key} yet`}
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          index={selectedGoalId && (key === "backlog" || key === "projects") ? idx : undefined}
                          onEdit={(id, content) => handleEditItem(key, id, content)}
                          onDelete={(id) => handleDeleteItem(key, id)}
                          onToggleComplete={
                            key === "backlog" 
                              ? (id) => handleToggleComplete(key, id)
                              : undefined
                          }
                          onAssignGoal={
                            (key === "projects" || key === "backlog" || key === "routines" || key === "events")
                              ? (id, goalId) => handleAssignGoal(key, id, goalId)
                              : undefined
                          }
                          onOpenProject={
                            key === "projects"
                              ? handleOpenProject
                              : undefined
                          }
                          onOpenRoutine={
                            key === "routines"
                              ? handleOpenRoutine
                              : undefined
                          }
                          onSetDuration={
                            key === "backlog"
                              ? (id, duration) => handleSetBacklogDuration(key, id, duration)
                              : undefined
                          }
                          onSetDueDate={
                            key === "backlog" || key === "events" || key === "projects"
                              ? (id, dueDate) => handleSetBacklogDueDate(key, id, dueDate)
                              : undefined
                          }
                          onToggleScheduled={
                            key === "backlog"
                              ? (id, isScheduled) => handleToggleScheduled(key, id, isScheduled)
                              : undefined
                          }
                          onSetEventTime={
                            key === "events"
                              ? (id, startTime, endTime) => handleSetEventTime(key, id, startTime, endTime)
                              : undefined
                          }
                          onSetRecurring={
                            key === "events"
                              ? (id, isRecurring, days) => handleSetRecurring(key, id, isRecurring, days)
                              : undefined
                          }
                          onSetZoomLink={
                            key === "events"
                              ? (id, zoomLink) => handleSetZoomLink(key, id, zoomLink)
                              : undefined
                          }
                          onSetRoutineDates={
                            key === "routines"
                              ? (id, startDate, endDate) => handleSetRoutineDates(key, id, startDate, endDate)
                              : undefined
                          }
                          onSetRoutineTime={
                            key === "routines"
                              ? (id, startTime, duration) => handleSetRoutineTime(key, id, startTime, duration)
                              : undefined
                          }
                          goals={(key === "projects" || key === "backlog" || key === "routines" || key === "events") ? goals : undefined}
                        />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              ) : (
                /* Non-draggable version when not filtered or for other sections */
                <div>
                  {items.length === 0 ? (
                    <p className="text-gray-400 text-sm font-mono">
                      {selectedGoalId 
                        ? `No ${key} assigned to this goal` 
                        : `No ${key} yet`}
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id} className="mb-2">
                        <SortableItem
                          item={item}
                          isDraggable={false}
                          index={undefined}
                          onEdit={(id, content) => handleEditItem(key, id, content)}
                          onDelete={(id) => handleDeleteItem(key, id)}
                          onToggleComplete={
                            key === "backlog" 
                              ? (id) => handleToggleComplete(key, id)
                              : undefined
                          }
                          onAssignGoal={
                            (key === "projects" || key === "backlog" || key === "routines" || key === "events")
                              ? (id, goalId) => handleAssignGoal(key, id, goalId)
                              : undefined
                          }
                          onOpenProject={
                            key === "projects"
                              ? handleOpenProject
                              : undefined
                          }
                          onOpenRoutine={
                            key === "routines"
                              ? handleOpenRoutine
                              : undefined
                          }
                          onSetDuration={
                            key === "backlog"
                              ? (id, duration) => handleSetBacklogDuration(key, id, duration)
                              : undefined
                          }
                          onSetDueDate={
                            key === "backlog" || key === "events" || key === "projects"
                              ? (id, dueDate) => handleSetBacklogDueDate(key, id, dueDate)
                              : undefined
                          }
                          onToggleScheduled={
                            key === "backlog"
                              ? (id, isScheduled) => handleToggleScheduled(key, id, isScheduled)
                              : undefined
                          }
                          onSetEventTime={
                            key === "events"
                              ? (id, startTime, endTime) => handleSetEventTime(key, id, startTime, endTime)
                              : undefined
                          }
                          onSetRecurring={
                            key === "events"
                              ? (id, isRecurring, days) => handleSetRecurring(key, id, isRecurring, days)
                              : undefined
                          }
                          onSetZoomLink={
                            key === "events"
                              ? (id, zoomLink) => handleSetZoomLink(key, id, zoomLink)
                              : undefined
                          }
                          onSetRoutineDates={
                            key === "routines"
                              ? (id, startDate, endDate) => handleSetRoutineDates(key, id, startDate, endDate)
                              : undefined
                          }
                          onSetRoutineTime={
                            key === "routines"
                              ? (id, startTime, duration) => handleSetRoutineTime(key, id, startTime, duration)
                              : undefined
                          }
                          goals={(key === "projects" || key === "backlog" || key === "routines" || key === "events") ? goals : undefined}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </div>
  );
}