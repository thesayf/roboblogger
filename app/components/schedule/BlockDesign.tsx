import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Clock, Circle, CheckCircle2, MoreVertical } from 'lucide-react';

// This is a design mockup for the Block component
// Following Bloomberg terminal aesthetic: minimal, functional, keyboard-first

interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface BlockProps {
  time: string;
  endTime: string;
  title: string;
  type: 'deep-work' | 'admin' | 'break' | 'meeting';
  duration: number;
  tasks: Task[];
  isSelected?: boolean;
  isCollapsed?: boolean;
  isCurrent?: boolean;
}

const BlockDesign: React.FC<BlockProps> = ({
  time = "09:00",
  endTime = "10:30",
  title = "Deep Work",
  type = "deep-work",
  duration = 90,
  tasks = [
    { id: '1', title: 'Review PR comments', duration: 30, completed: false },
    { id: '2', title: 'Implement auth flow', duration: 45, completed: false },
    { id: '3', title: 'Write tests', duration: 15, completed: true },
  ],
  isSelected = false,
  isCollapsed = false,
  isCurrent = false,
}) => {
  // Type-based accent colors - subtle, not distracting
  const typeColors = {
    'deep-work': 'border-l-purple-500',
    'admin': 'border-l-blue-500',
    'break': 'border-l-green-500',
    'meeting': 'border-l-orange-500',
  };

  const totalTaskTime = tasks.reduce((sum, task) => sum + task.duration, 0);
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      <div className="text-xs text-gray-500 mb-2">Block Design Mockup</div>
      
      {/* Main Block Design */}
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg shadow-sm transition-all",
          "hover:shadow-md cursor-pointer",
          isSelected && "ring-2 ring-blue-500 ring-offset-1",
          isCurrent && "bg-blue-50 border-blue-300"
        )}
      >
        {/* Block Header */}
        <div className={cn(
          "px-4 py-3 border-l-4 rounded-l-lg",
          typeColors[type]
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Time Range */}
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{time} - {endTime}</span>
                <span className="text-gray-400">•</span>
                <span>{duration}m</span>
                {isCurrent && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-blue-600 font-medium">NOW</span>
                  </>
                )}
              </div>
              
              {/* Block Title */}
              <div className="flex items-center gap-2">
                <ChevronRight className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  !isCollapsed && "rotate-90"
                )} />
                <h3 className="font-medium text-gray-900">{title}</h3>
                {tasks.length > 0 && (
                  <span className="text-xs text-gray-500 font-mono">
                    [{completedTasks}/{tasks.length}]
                  </span>
                )}
              </div>
            </div>
            
            {/* Block Actions */}
            <div className="flex items-center gap-2">
              {totalTaskTime > 0 && (
                <div className="text-xs text-gray-400 font-mono">
                  {totalTaskTime}m allocated
                </div>
              )}
              <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>
          </div>
        </div>
        
        {/* Tasks Section - Only show if not collapsed */}
        {!isCollapsed && tasks.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="space-y-1">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 py-1.5 px-2 rounded transition-colors",
                    "hover:bg-gray-50",
                    index === 0 && "bg-gray-50" // Show first task as selected
                  )}
                >
                  {/* Task Checkbox */}
                  {task.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  
                  {/* Task Title */}
                  <span className={cn(
                    "flex-1 text-sm",
                    task.completed && "line-through text-gray-400"
                  )}>
                    {task.title}
                  </span>
                  
                  {/* Task Duration */}
                  <span className="text-xs text-gray-400 font-mono">
                    {task.duration}m
                  </span>
                </div>
              ))}
            </div>
            
            {/* Add Task Hint */}
            <div className="mt-2 py-1.5 px-2 text-xs text-gray-400">
              Press 't' to add task • Enter to edit • Space to toggle
            </div>
          </div>
        )}
      </div>
      
      {/* Collapsed State */}
      <div className="text-xs text-gray-500 mb-2">Collapsed Version</div>
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg shadow-sm transition-all",
          "hover:shadow-md cursor-pointer"
        )}
      >
        <div className={cn(
          "px-4 py-2 border-l-4 rounded-l-lg flex items-center justify-between",
          typeColors[type]
        )}>
          <div className="flex items-center gap-3">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-xs text-gray-500">{time}</span>
            <span className="font-medium text-gray-900">{title}</span>
            <span className="text-xs text-gray-500 font-mono">[{completedTasks}/{tasks.length}]</span>
          </div>
          <span className="text-xs text-gray-400">{duration}m</span>
        </div>
      </div>
      
      {/* Selected State with Active Task */}
      <div className="text-xs text-gray-500 mb-2">Selected with Active Task</div>
      <div className="bg-white border-2 border-blue-500 rounded-lg shadow-md ring-2 ring-blue-500 ring-offset-1">
        <div className="px-4 py-3 border-l-4 border-l-purple-500 rounded-l-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-gray-400" />
              <span className="font-mono text-xs text-gray-500">{time} - {endTime}</span>
              <h3 className="font-medium text-gray-900">{title}</h3>
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="space-y-1">
            {/* Selected task with blue background */}
            <div className="flex items-center gap-3 py-1.5 px-2 rounded bg-blue-50 ring-1 ring-blue-200">
              <Circle className="h-4 w-4 text-blue-500" />
              <span className="flex-1 text-sm font-medium text-blue-900">
                Review PR comments
              </span>
              <span className="text-xs text-blue-600 font-mono">30m</span>
            </div>
            <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50">
              <Circle className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-sm">Implement auth flow</span>
              <span className="text-xs text-gray-400 font-mono">45m</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Empty Block State */}
      <div className="text-xs text-gray-500 mb-2">Empty Block (No Tasks)</div>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md cursor-pointer">
        <div className="px-4 py-3 border-l-4 border-l-green-500 rounded-l-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock className="h-3 w-3" />
                <span className="font-mono">11:00 - 11:15</span>
                <span>• 15m</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <h3 className="font-medium text-gray-900">Break</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-center text-xs text-gray-400 py-2">
            Press 't' to add your first task
          </div>
        </div>
      </div>
      
      {/* Keyboard Hints */}
      <div className="mt-8 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 font-mono">
        <div className="font-semibold mb-2">Keyboard Navigation</div>
        <div className="grid grid-cols-2 gap-2">
          <div>j/k - Navigate blocks</div>
          <div>Enter - Enter block</div>
          <div>Tab - Collapse/expand</div>
          <div>t - Add task</div>
          <div>Space - Toggle task</div>
          <div>d - Delete</div>
          <div>m - Move block</div>
          <div>e - Edit time</div>
        </div>
      </div>
    </div>
  );
};

export default BlockDesign;