import React from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';

interface CudData {
  changes: {
    create: {
      goals: any[];
      projects: any[];
      tasks: any[];
      events: any[];
      routines: any[];
      blocks: any[];
    };
    update: {
      goals: any[];
      projects: any[];
      tasks: any[];
      events: any[];
      routines: any[];
      blocks: any[];
    };
    delete: {
      goals: any[];
      projects: any[];
      tasks: any[];
      events: any[];
      routines: any[];
      blocks: any[];
    };
  };
  summary: string;
  stats: {
    totalChanges: number;
    creating: number;
    updating: number;
    deleting: number;
  };
}

interface CudChatDisplayProps {
  data: CudData;
  message?: string;
}

export default function CudChatDisplay({ data, message }: CudChatDisplayProps) {
  // Helper to render items for a specific operation
  const renderItems = (items: any[], type: string, operation: 'create' | 'update' | 'delete') => {
    if (!items || items.length === 0) return null;

    const getIcon = () => {
      switch (operation) {
        case 'create': return <Plus className="h-4 w-4 text-green-600" />;
        case 'update': return <Edit2 className="h-4 w-4 text-blue-600" />;
        case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      }
    };

    const getBgColor = () => {
      switch (operation) {
        case 'create': return 'bg-green-50 border-green-200';
        case 'update': return 'bg-blue-50 border-blue-200';
        case 'delete': return 'bg-red-50 border-red-200';
      }
    };

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${type}-${operation}-${index}`} className={`border rounded-lg p-3 ${getBgColor()}`}>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{getIcon()}</div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">
                  {item.name || item.title || item.content || 'Unnamed item'}
                  {/* Hidden ID in data attribute for execute layer */}
                  <span data-id={item.id} className="hidden">{item.id}</span>
                </div>
                
                {/* Show changes for update operation */}
                {operation === 'update' && item.changes && (
                  <div className="mt-1 text-xs text-gray-600">
                    {Object.entries(item.changes).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <span className="capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show tasks for projects and routines */}
                {item.tasks && item.tasks.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1">
                    <div className="text-xs text-gray-500">Tasks:</div>
                    {item.tasks.map((task: any, taskIdx: number) => (
                      <div key={taskIdx} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{task.title || task.name}</span>
                        {task.duration && (
                          <span className="text-gray-400">({task.duration}m)</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show additional details */}
                {item.goalId && (
                  <div className="text-xs text-gray-500 mt-1">
                    Linked to goal
                  </div>
                )}
                {item.date && (
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {new Date(item.date).toLocaleDateString()}
                  </div>
                )}
                {item.time && (
                  <div className="text-xs text-gray-500 mt-1">
                    Time: {item.time}
                  </div>
                )}
                {item.days && item.days.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Days: {item.days.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper to render a section
  const renderSection = (operation: 'create' | 'update' | 'delete') => {
    const changes = data.changes[operation];
    const hasChanges = Object.values(changes).some((arr: any) => arr.length > 0);
    
    if (!hasChanges) return null;

    const getTitle = () => {
      switch (operation) {
        case 'create': return 'Creating';
        case 'update': return 'Updating';
        case 'delete': return 'Deleting';
      }
    };

    const getColor = () => {
      switch (operation) {
        case 'create': return 'text-green-700';
        case 'update': return 'text-blue-700';
        case 'delete': return 'text-red-700';
      }
    };

    return (
      <div className="space-y-3">
        <h3 className={`font-semibold text-sm ${getColor()}`}>{getTitle()}</h3>
        {changes.goals.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Goals</div>
            {renderItems(changes.goals, 'goal', operation)}
          </div>
        )}
        {changes.projects.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Projects</div>
            {renderItems(changes.projects, 'project', operation)}
          </div>
        )}
        {changes.tasks.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Tasks</div>
            {renderItems(changes.tasks, 'task', operation)}
          </div>
        )}
        {changes.events.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Events</div>
            {renderItems(changes.events, 'event', operation)}
          </div>
        )}
        {changes.routines.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Routines</div>
            {renderItems(changes.routines, 'routine', operation)}
          </div>
        )}
        {changes.blocks && changes.blocks.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Schedule Blocks</div>
            {renderItems(changes.blocks, 'block', operation)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Summary */}
      {data.summary && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
      )}

      {/* Stats */}
      {data.stats.totalChanges > 0 && (
        <div className="flex gap-4 mb-4 text-xs">
          {data.stats.creating > 0 && (
            <div className="flex items-center gap-1">
              <Plus className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">{data.stats.creating} new</span>
            </div>
          )}
          {data.stats.updating > 0 && (
            <div className="flex items-center gap-1">
              <Edit2 className="h-3 w-3 text-blue-600" />
              <span className="text-gray-600">{data.stats.updating} updates</span>
            </div>
          )}
          {data.stats.deleting > 0 && (
            <div className="flex items-center gap-1">
              <Trash2 className="h-3 w-3 text-red-600" />
              <span className="text-gray-600">{data.stats.deleting} deletions</span>
            </div>
          )}
        </div>
      )}

      {/* Changes */}
      <div className="space-y-4">
        {renderSection('create')}
        {renderSection('update')}
        {renderSection('delete')}
      </div>

      {/* Confirmation Message */}
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      )}
    </div>
  );
}