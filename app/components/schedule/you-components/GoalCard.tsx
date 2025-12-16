"use client";

import React, { useState } from "react";
import { X, GripVertical, Folder, CheckSquare, RefreshCw, Calendar } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ContextItem {
  id: string;
  content: string;
  type: "goal" | "project" | "task" | "routine" | "event" | "note";
  color?: string; // Color gradient for goals
  deadline?: string; // Goal deadline (moved from metadata for goals)
  metadata?: {
    deadline?: string;
    priority?: string;
    energy?: string;
    completed?: boolean;
    goalId?: string;
    projectId?: string;
    routineId?: string; // ID of parent routine for tasks
    duration?: string;
    dueDate?: string; // For projects, backlog tasks, and events
    projectDueDate?: string; // Specific due date for projects
    isScheduled?: boolean; // true = "do on this date", false/undefined = "due by this date"
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    recurringDays?: string[]; // ["Monday", "Wednesday", "Friday"]
    zoomLink?: string; // Zoom or other meeting link for events
    // Routine-specific fields
    routineStartDate?: string; // When routine becomes active
    routineEndDate?: string; // Optional: when routine ends
    startTime?: string; // Fixed start time for routine
    duration?: number; // Duration in minutes
    // Legacy fields for backwards compatibility
    earliestStartTime?: string; 
    latestEndTime?: string;
  };
  tasks?: ContextItem[];
  isEditing?: boolean;
  isExpanded?: boolean;
}

interface GoalCardProps {
  item: ContextItem;
  index: number;
  onEdit: (id: string, content: string, deadline?: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  counts?: {
    projects: number;
    tasks: number;
    routines: number;
    events: number;
  };
}

export function GoalCard({ item, index, onEdit, onDelete, onSelect, isSelected, counts }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [editDeadline, setEditDeadline] = useState(item.deadline || "");
  
  console.log('🕰️ GoalCard render:', { id: item.id, deadline: item.deadline, editDeadline });

  const formatDeadline = (deadline: string | undefined) => {
    if (!deadline) return "Set deadline";
    const date = new Date(deadline);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays}d left`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w left`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const gradient = item.color || "from-gray-100 to-gray-200";

  const handleSave = () => {
    onEdit(item.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setIsEditing(false);
  };

  const handleSaveDeadline = () => {
    console.log('🕰️ GoalCard handleSaveDeadline:', { id: item.id, editDeadline });
    onEdit(item.id, item.content, editDeadline);
    setIsEditingDeadline(false);
  };

  const handleCancelDeadline = () => {
    setEditDeadline(item.deadline || "");
    setIsEditingDeadline(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className={`aspect-square rounded-full bg-gradient-to-br ${gradient} p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-md relative ${
          isSelected ? 'ring-4 ring-blue-500 ring-offset-2 scale-105' : ''
        }`}
        onClick={(e) => {
          // Only trigger select if not clicking on editable content
          if (!isEditing && onSelect) {
            // Check if click is on the background (not on text/content)
            const target = e.target as HTMLElement;
            if (!target.closest('.goal-content')) {
              onSelect(item.id);
            }
          }
        }}
      >
        {/* Drag handle */}
        <div
          className="absolute top-2 left-2 cursor-grab opacity-50 hover:opacity-100 transition-opacity z-10 bg-white/50 rounded p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>

        {isEditing ? (
          <div className="w-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full bg-white/80 backdrop-blur text-xs rounded-lg p-2 resize-none border-0 focus:ring-1 focus:ring-orange-400"
              placeholder="Goal description"
              rows={3}
              autoFocus
              onBlur={handleSave}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <>
            <span className="text-2xl font-bold text-gray-600 mb-2">
              {index + 1}
            </span>
            <div 
              className="goal-content cursor-text hover:bg-white/20 rounded px-2 py-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                {item.content}
              </p>
            </div>
            
            {/* Deadline */}
            <div className="mt-2">
              {isEditingDeadline ? (
                <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="date"
                    value={editDeadline ? editDeadline.split('T')[0] : ''}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-[10px] px-2 py-1 rounded bg-white/80 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={handleSaveDeadline}
                      className="text-[9px] px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelDeadline}
                      className="text-[9px] px-2 py-0.5 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingDeadline(true);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                    item.deadline
                      ? (() => {
                          const date = new Date(item.deadline);
                          const today = new Date();
                          const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) return 'bg-red-100 text-red-700 hover:bg-red-200';
                          if (diffDays <= 7) return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
                          return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
                        })()
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}
                >
                  📅 {formatDeadline(item.deadline)}
                </button>
              )}
            </div>
            
            {/* Item counts */}
            {counts && (counts.projects > 0 || counts.tasks > 0 || counts.routines > 0 || counts.events > 0) && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {counts.projects > 0 && (
                  <div className="flex items-center gap-0.5 bg-blue-100 rounded-full px-1.5 py-0.5">
                    <Folder className="h-2.5 w-2.5 text-blue-600" />
                    <span className="text-[9px] font-bold text-blue-600">{counts.projects}</span>
                  </div>
                )}
                {counts.tasks > 0 && (
                  <div className="flex items-center gap-0.5 bg-green-100 rounded-full px-1.5 py-0.5">
                    <CheckSquare className="h-2.5 w-2.5 text-green-600" />
                    <span className="text-[9px] font-bold text-green-600">{counts.tasks}</span>
                  </div>
                )}
                {counts.routines > 0 && (
                  <div className="flex items-center gap-0.5 bg-purple-100 rounded-full px-1.5 py-0.5">
                    <RefreshCw className="h-2.5 w-2.5 text-purple-600" />
                    <span className="text-[9px] font-bold text-purple-600">{counts.routines}</span>
                  </div>
                )}
                {counts.events > 0 && (
                  <div className="flex items-center gap-0.5 bg-orange-100 rounded-full px-1.5 py-0.5">
                    <Calendar className="h-2.5 w-2.5 text-orange-600" />
                    <span className="text-[9px] font-bold text-orange-600">{counts.events}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}