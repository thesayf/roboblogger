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
    earliestStartTime?: string; // Earliest time routine can start
    latestEndTime?: string; // Latest time routine must end by
  };
  tasks?: ContextItem[];
  isEditing?: boolean;
  isExpanded?: boolean;
}

interface GoalCardProps {
  item: ContextItem;
  index: number;
  onEdit: (id: string, content: string) => void;
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
          className="absolute top-2 left-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
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