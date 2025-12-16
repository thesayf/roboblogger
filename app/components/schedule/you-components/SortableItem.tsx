"use client";

import React, { useState } from "react";
import {
  Plus,
  X,
  Check,
  Edit2,
  GripVertical,
  Folder,
  Target,
  Clock,
  Calendar,
  Repeat,
  Video,
  Link2,
  RefreshCw,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ContextItem } from "./GoalCard";

interface SortableItemProps {
  item: ContextItem;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onAssignGoal?: (itemId: string, goalId: string | null) => void;
  onOpenProject?: (projectId: string) => void;
  onOpenRoutine?: (routineId: string) => void;
  onSetDuration?: (id: string, duration: string) => void;
  onSetDueDate?: (id: string, dueDate: string) => void;
  onToggleScheduled?: (id: string, isScheduled: boolean) => void;
  onSetEventTime?: (id: string, startTime: string, endTime: string) => void;
  onSetRecurring?: (id: string, isRecurring: boolean, days: string[]) => void;
  onSetZoomLink?: (id: string, zoomLink: string) => void;
  onSetRoutineDates?: (id: string, startDate: string, endDate: string | undefined) => void;
  onSetRoutineTime?: (id: string, startTime: string, duration: number) => void;
  goals?: ContextItem[];
  prefix?: string;
  index?: number;
  isDraggable?: boolean;
}

export function SortableItem({
  item,
  onEdit,
  onDelete,
  onToggleComplete,
  onAssignGoal,
  onOpenProject,
  onOpenRoutine,
  onSetDuration,
  onSetDueDate,
  onToggleScheduled,
  onSetEventTime,
  onSetRecurring,
  onSetZoomLink,
  onSetRoutineDates,
  onSetRoutineTime,
  goals,
  prefix = "",
  index,
  isDraggable = true,
}: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showGoalSelect, setShowGoalSelect] = useState(false);
  const [showDurationSelect, setShowDurationSelect] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurringPicker, setShowRecurringPicker] = useState(false);
  const [showZoomLinkInput, setShowZoomLinkInput] = useState(false);
  const [showRoutineDatePicker, setShowRoutineDatePicker] = useState(false);
  const [showRoutineTimePicker, setShowRoutineTimePicker] = useState(false);
  const [showRoutineDaysPicker, setShowRoutineDaysPicker] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(item.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== item.content) {
      onEdit(item.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(item.content);
    setIsEditing(false);
  };

  const assignedGoal = goals?.find((g) => g.id === item.metadata?.goalId);

  // Helper function to format due dates
  const formatDueDate = (dateString: string | undefined, isScheduled: boolean | undefined) => {
    if (!dateString) return "Set date";
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const prefix = isScheduled ? "On " : "Due ";
    
    if (!isScheduled && diffDays < 0) return `Overdue`;
    if (diffDays === 0) return isScheduled ? "On Today" : "Today";
    if (diffDays === 1) return isScheduled ? "On Tomorrow" : "Tomorrow";
    if (diffDays <= 7) return `${prefix}${diffDays} days`;
    
    return `${prefix}${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };
  
  const getDueDateColor = (dateString: string | undefined, isScheduled: boolean | undefined) => {
    if (!dateString) return "text-gray-400";
    
    // Scheduled tasks get purple color scheme
    if (isScheduled) {
      return "bg-purple-50 text-purple-600 hover:bg-purple-100";
    }
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "bg-red-50 text-red-600 hover:bg-red-100";
    if (diffDays === 0) return "bg-orange-50 text-orange-600 hover:bg-orange-100";
    if (diffDays === 1) return "bg-yellow-50 text-yellow-600 hover:bg-yellow-100";
    if (diffDays <= 3) return "bg-blue-50 text-blue-600 hover:bg-blue-100";
    
    return "bg-gray-50 text-gray-600 hover:bg-gray-100";
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-center gap-3 py-2 hover:bg-gray-50 px-3 -mx-3 rounded-lg transition-colors">
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

      {prefix && (
        <span className="text-gray-400 font-mono text-sm">{prefix}</span>
      )}

      {/* Index number for projects and backlog tasks */}
      {index !== undefined && (item.type === "task" || item.type === "project") && (
        <span className="text-xs font-mono text-gray-400 w-6">
          {index + 1}.
        </span>
      )}

      {item.type === "task" && onToggleComplete && (
        <button
          onClick={() => onToggleComplete(item.id)}
          className={cn(
            "w-4 h-4 rounded border transition-all",
            item.metadata?.completed
              ? "bg-blue-500 border-blue-500"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          {item.metadata?.completed && (
            <Check className="h-3 w-3 text-white" />
          )}
        </button>
      )}

      <div className="flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              className="flex-1 h-8 border-0 border-b border-blue-500 outline-none px-0 text-sm font-mono bg-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="text-green-600 hover:text-green-700 p-1"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Folder icon for Projects */}
                {item.type === "project" && onOpenProject && (
                  <button
                    onClick={() => onOpenProject(item.id)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Folder className="h-4 w-4" />
                  </button>
                )}
                
                {/* Repeat icon for Routines */}
                {item.type === "routine" && onOpenRoutine && (
                  <button
                    onClick={() => onOpenRoutine(item.id)}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}

                {item.type === "project" && onOpenProject ? (
                  <>
                    <span
                      className={cn(
                        "text-sm font-mono cursor-pointer hover:text-blue-600 transition-colors",
                        item.metadata?.completed
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                      )}
                      onClick={() => onOpenProject(item.id)}
                    >
                      {item.content}
                    </span>
                    
                    {/* Minimal Progress Indicator */}
                    {item.tasks && item.tasks.length > 0 && (
                      <span className="text-[10px] font-mono text-gray-400">
                        [{item.tasks.filter(t => t.metadata?.completed).length}/{item.tasks.length}]
                      </span>
                    )}
                  </>
                ) : item.type === "routine" && onOpenRoutine ? (
                  <span
                    className={cn(
                      "text-sm font-mono cursor-pointer hover:text-purple-600 transition-colors",
                      item.metadata?.completed
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    )}
                    onClick={() => onOpenRoutine(item.id)}
                  >
                    {item.content}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "text-sm font-mono",
                      item.metadata?.completed
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    )}
                  >
                    {item.content}
                  </span>
                )}

                {/* Goal Assignment for Projects, Backlog Tasks, Routines, and Events */}
                {(item.type === "project" || item.type === "task" || item.type === "routine" || item.type === "event") && onAssignGoal && goals && (
                  <div className="relative">
                    {showGoalSelect ? (
                      <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]">
                        <button
                          className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-500 hover:bg-gray-50"
                          onClick={() => {
                            onAssignGoal(item.id, null);
                            setShowGoalSelect(false);
                          }}
                        >
                          No goal
                        </button>
                        {goals.map((goal) => {
                          return (
                            <button
                              key={goal.id}
                              className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => {
                                onAssignGoal(item.id, goal.id);
                                setShowGoalSelect(false);
                              }}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-gradient-to-br ${goal.color || "from-gray-100 to-gray-200"} inline-block`}
                              />
                              <span className="truncate">{goal.content}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowGoalSelect(true)}
                        className={cn(
                          "text-xs font-mono px-2 py-0.5 rounded-full transition-all flex items-center gap-1",
                          assignedGoal
                            ? ""
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {assignedGoal ? (
                          <>
                            <span
                              className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                                assignedGoal.color || "from-gray-100 to-gray-200"
                              }`}
                            />
                            <span className="text-gray-700 truncate max-w-[120px]">
                              {assignedGoal.content}
                            </span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Assign goal
                          </>
                        )}
                      </button>
                    )}

                    {/* Click outside to close */}
                    {showGoalSelect && (
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowGoalSelect(false)}
                      />
                    )}
                  </div>
                )}

                {/* Project Due Date Selector */}
                {item.type === "project" && onSetDueDate && (
                  <div className="relative">
                    {showDatePicker ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-mono text-gray-600 block mb-1">Project due date</label>
                            <input
                              type="date"
                              value={item.metadata?.dueDate || ''}
                              onChange={(e) => {
                                onSetDueDate(item.id, e.target.value);
                                setShowDatePicker(false);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDatePicker(true)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                          item.metadata?.dueDate
                            ? getDueDateColor(item.metadata?.dueDate, false)
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(item.metadata?.dueDate, false)}
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

                {/* Routine Date Range Selector */}
                {item.type === "routine" && onSetRoutineDates && (
                  <div className="relative">
                    {showRoutineDatePicker ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[280px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-mono text-gray-600 block mb-1">Start date</label>
                            <input
                              type="date"
                              value={item.metadata?.routineStartDate || ''}
                              onChange={(e) => {
                                onSetRoutineDates(item.id, e.target.value, item.metadata?.routineEndDate);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-mono text-gray-600 block mb-1">End date <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={item.metadata?.routineEndDate || ''}
                              onChange={(e) => {
                                onSetRoutineDates(item.id, item.metadata?.routineStartDate || '', e.target.value || undefined);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                              min={item.metadata?.routineStartDate}
                              required
                            />
                          </div>
                          <button
                            className="w-full text-xs font-mono px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded"
                            onClick={() => setShowRoutineDatePicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRoutineDatePicker(true)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                          item.metadata?.routineStartDate
                            ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {item.metadata?.routineStartDate 
                          ? item.metadata?.routineEndDate
                            ? `${new Date(item.metadata.routineStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(item.metadata.routineEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : `From ${new Date(item.metadata.routineStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (needs end date)`
                          : "Set dates"}
                      </button>
                    )}
                    
                    {/* Click outside to close */}
                    {showRoutineDatePicker && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowRoutineDatePicker(false)}
                      />
                    )}
                  </div>
                )}

                {/* Routine Days Selector */}
                {item.type === "routine" && (
                  <div className="relative">
                    {showRoutineDaysPicker ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[280px]">
                        <div className="space-y-2">
                          <label className="text-xs font-mono text-gray-600">Select days</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  const currentDays = item.metadata?.days || item.days || [];
                                  const newDays = currentDays.includes(day)
                                    ? currentDays.filter(d => d !== day)
                                    : [...currentDays, day];
                                  
                                  // For now, just update the local state
                                  // You mentioned not to worry about persistence yet
                                  console.log('Updated days for routine:', newDays);
                                  
                                  // Update the item metadata locally
                                  item.metadata = {
                                    ...item.metadata,
                                    days: newDays
                                  };
                                  
                                  // Force re-render
                                  setShowRoutineDaysPicker(true);
                                }}
                                className={cn(
                                  "px-2 py-1.5 text-xs font-mono rounded transition-all",
                                  (item.metadata?.days || item.days || []).includes(day)
                                    ? "bg-purple-500 text-white hover:bg-purple-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                              >
                                {day.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                          <button
                            className="w-full text-xs font-mono px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded"
                            onClick={() => setShowRoutineDaysPicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRoutineDaysPicker(true)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                          (item.metadata?.days || item.days || []).length > 0
                            ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Repeat className="h-3 w-3" />
                        {(item.metadata?.days || item.days || []).length > 0
                          ? (item.metadata?.days || item.days || []).map(d => d.slice(0, 3)).join(", ")
                          : "Set days"}
                      </button>
                    )}
                    
                    {/* Click outside to close */}
                    {showRoutineDaysPicker && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowRoutineDaysPicker(false)}
                      />
                    )}
                  </div>
                )}

                {/* Routine Time Selector */}
                {item.type === "routine" && onSetRoutineTime && (
                  <div className="relative">
                    {showRoutineTimePicker ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[280px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-mono text-gray-600 block mb-1">Start time</label>
                            <input
                              type="time"
                              value={item.metadata?.startTime || item.metadata?.earliestStartTime || '07:00'}
                              onChange={(e) => {
                                onSetRoutineTime(item.id, e.target.value, item.metadata?.duration || 60);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-mono text-gray-600 block mb-1">Duration (minutes)</label>
                            <input
                              type="number"
                              min="15"
                              step="15"
                              value={item.metadata?.duration || 60}
                              onChange={(e) => {
                                onSetRoutineTime(item.id, item.metadata?.startTime || item.metadata?.earliestStartTime || '07:00', parseInt(e.target.value) || 60);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-400"
                            />
                          </div>
                          <button
                            className="w-full text-xs font-mono px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded"
                            onClick={() => setShowRoutineTimePicker(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRoutineTimePicker(true)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                          item.metadata?.startTime || item.metadata?.earliestStartTime
                            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {item.metadata?.startTime || item.metadata?.earliestStartTime
                          ? `${item.metadata?.startTime || item.metadata?.earliestStartTime} • ${item.metadata?.duration || 60}min`
                          : "Set time"}
                      </button>
                    )}
                    
                    {/* Click outside to close */}
                    {showRoutineTimePicker && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowRoutineTimePicker(false)}
                      />
                    )}
                  </div>
                )}

                {/* Duration Selector for Backlog Tasks */}
                {item.type === "task" && onSetDuration && (
                  <div className="relative">
                    {showDurationSelect ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                        <button
                          className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-500 hover:bg-gray-50"
                          onClick={() => {
                            onSetDuration(item.id, "");
                            setShowDurationSelect(false);
                          }}
                        >
                          No duration
                        </button>
                        {[
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
                        ].map((duration) => (
                          <button
                            key={duration.value}
                            className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50"
                            onClick={() => {
                              onSetDuration(item.id, duration.value);
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
                          item.metadata?.duration
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {item.metadata?.duration 
                          ? [
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
                            ].find(d => d.value === item.metadata?.duration)?.label || item.metadata?.duration
                          : "Set duration"}
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
                )}

                {/* Deadline Selector for Backlog Tasks */}
                {item.type === "task" && onSetDueDate && (
                  <div className="relative">
                    {showDatePicker ? (
                      <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={item.metadata?.dueDate || ''}
                            onChange={(e) => {
                              onSetDueDate(item.id, e.target.value);
                              setShowDatePicker(false);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <label className="flex items-center gap-2 text-xs font-mono text-gray-600 cursor-pointer hover:text-gray-800">
                            <input
                              type="checkbox"
                              checked={item.metadata?.isScheduled || false}
                              onChange={(e) => {
                                onToggleScheduled?.(item.id, e.target.checked);
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            Must do on this date
                          </label>
                          <div className="flex gap-2">
                            <button
                              className="flex-1 text-xs font-mono px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                              onClick={() => {
                                const today = new Date();
                                onSetDueDate(item.id, today.toISOString().split('T')[0]);
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
                                onSetDueDate(item.id, tomorrow.toISOString().split('T')[0]);
                                setShowDatePicker(false);
                              }}
                            >
                              Tomorrow
                            </button>
                          </div>
                          <button
                            className="w-full text-xs font-mono px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
                            onClick={() => {
                              onSetDueDate(item.id, "");
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
                          item.metadata?.dueDate
                            ? getDueDateColor(item.metadata.dueDate, item.metadata.isScheduled)
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(item.metadata?.dueDate, item.metadata?.isScheduled)}
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

                {/* Event Date and Time Selector */}
                {item.type === "event" && onSetDueDate && (
                  <>
                    {/* Recurring Selector for Events */}
                    {onSetRecurring && (
                      <div className="relative">
                        {showRecurringPicker ? (
                          <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[250px]">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-mono text-gray-700 font-medium">Recurring Event</label>
                                <button
                                  onClick={() => {
                                    const newIsRecurring = !item.metadata?.isRecurring;
                                    onSetRecurring(item.id, newIsRecurring, item.metadata?.recurringDays || []);
                                  }}
                                  className={cn(
                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                    item.metadata?.isRecurring ? "bg-purple-600" : "bg-gray-200"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                                      item.metadata?.isRecurring ? "translate-x-5" : "translate-x-1"
                                    )}
                                  />
                                </button>
                              </div>
                              
                              {item.metadata?.isRecurring && (
                                <div className="space-y-2">
                                  <label className="text-xs font-mono text-gray-600">Select days</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                      <button
                                        key={day}
                                        onClick={() => {
                                          const currentDays = item.metadata?.recurringDays || [];
                                          const newDays = currentDays.includes(day)
                                            ? currentDays.filter(d => d !== day)
                                            : [...currentDays, day];
                                          onSetRecurring(item.id, true, newDays);
                                        }}
                                        className={cn(
                                          "text-xs font-mono px-2 py-1.5 rounded transition-all",
                                          item.metadata?.recurringDays?.includes(day)
                                            ? "bg-purple-100 text-purple-700 border border-purple-300"
                                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                        )}
                                      >
                                        {day.slice(0, 3)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <button
                                className="w-full text-xs font-mono px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded"
                                onClick={() => setShowRecurringPicker(false)}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowRecurringPicker(true)}
                            className={cn(
                              "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                              item.metadata?.isRecurring
                                ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <Repeat className="h-3 w-3" />
                            {item.metadata?.isRecurring && item.metadata?.recurringDays?.length
                              ? item.metadata.recurringDays.map(d => d.slice(0, 3)).join(", ")
                              : "One-time"}
                          </button>
                        )}
                        
                        {/* Click outside to close */}
                        {showRecurringPicker && (
                          <div 
                            className="fixed inset-0 z-0" 
                            onClick={() => setShowRecurringPicker(false)}
                          />
                        )}
                      </div>
                    )}

                    {/* Date Selector for Events - Only show if not recurring */}
                    {!item.metadata?.isRecurring && (
                      <div className="relative">
                      {showDatePicker ? (
                        <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={item.metadata?.dueDate || ''}
                              onChange={(e) => {
                                onSetDueDate(item.id, e.target.value);
                                setShowDatePicker(false);
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                              min={new Date().toISOString().split('T')[0]}
                            />
                            <div className="flex gap-2">
                              <button
                                className="flex-1 text-xs font-mono px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                                onClick={() => {
                                  const today = new Date();
                                  onSetDueDate(item.id, today.toISOString().split('T')[0]);
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
                                  onSetDueDate(item.id, tomorrow.toISOString().split('T')[0]);
                                  setShowDatePicker(false);
                                }}
                              >
                                Tomorrow
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDatePicker(true)}
                          className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                          <Calendar className="h-3 w-3" />
                          {item.metadata?.isRecurring
                            ? "Recurring"
                            : item.metadata?.dueDate 
                              ? new Date(item.metadata.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : "Set date"}
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

                    {/* Time Selector for Events */}
                    {onSetEventTime && (
                      <div className="relative">
                        {showTimePicker ? (
                          <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[250px]">
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-mono text-gray-600 block mb-1">Start time</label>
                                <input
                                  type="time"
                                  value={item.metadata?.startTime || ''}
                                  onChange={(e) => {
                                    const endTime = item.metadata?.endTime || '';
                                    onSetEventTime(item.id, e.target.value, endTime);
                                  }}
                                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-mono text-gray-600 block mb-1">End time</label>
                                <input
                                  type="time"
                                  value={item.metadata?.endTime || ''}
                                  onChange={(e) => {
                                    const startTime = item.metadata?.startTime || '';
                                    onSetEventTime(item.id, startTime, e.target.value);
                                  }}
                                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                              <button
                                className="w-full text-xs font-mono px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                onClick={() => setShowTimePicker(false)}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowTimePicker(true)}
                            className={cn(
                              "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                              item.metadata?.startTime && item.metadata?.endTime
                                ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {item.metadata?.startTime && item.metadata?.endTime
                              ? `${item.metadata.startTime} - ${item.metadata.endTime}`
                              : "Set time"}
                          </button>
                        )}
                        
                        {/* Click outside to close */}
                        {showTimePicker && (
                          <div 
                            className="fixed inset-0 z-0" 
                            onClick={() => setShowTimePicker(false)}
                          />
                        )}
                      </div>
                    )}

                    {/* Zoom Link for Events */}
                    {onSetZoomLink && (
                      <div className="relative">
                        {showZoomLinkInput ? (
                          <div className="absolute right-0 z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[300px]">
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-mono text-gray-600 block mb-1">Meeting link</label>
                                <input
                                  type="url"
                                  value={item.metadata?.zoomLink || ''}
                                  onChange={(e) => {
                                    onSetZoomLink(item.id, e.target.value);
                                  }}
                                  placeholder="https://zoom.us/j/..."
                                  className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className="flex-1 text-xs font-mono px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                  onClick={() => setShowZoomLinkInput(false)}
                                >
                                  Done
                                </button>
                                {item.metadata?.zoomLink && (
                                  <button
                                    className="text-xs font-mono px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
                                    onClick={() => {
                                      onSetZoomLink(item.id, "");
                                      setShowZoomLinkInput(false);
                                    }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowZoomLinkInput(true)}
                            className={cn(
                              "flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full transition-all",
                              item.metadata?.zoomLink
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <Video className="h-3 w-3" />
                            {item.metadata?.zoomLink ? "Has link" : "Add link"}
                          </button>
                        )}
                        
                        {/* Click outside to close */}
                        {showZoomLinkInput && (
                          <div 
                            className="fixed inset-0 z-0" 
                            onClick={() => setShowZoomLinkInput(false)}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit();
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  onClick={() => onDelete(item.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Display routine tasks in read-only mode */}
      {item.type === "routine" && item.tasks && item.tasks.length > 0 && (
        <div className="ml-10 mt-1 space-y-0.5 mb-2">
          {item.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-xs">
              <span className="text-purple-400">•</span>
              <span className="font-mono text-gray-600">
                {task.content}
              </span>
              {task.metadata?.duration && (
                <span className="font-mono text-gray-400">
                  ({task.metadata.duration})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}