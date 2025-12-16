import React from 'react';

interface Task {
  id: string;
  title: string;
  duration: number;
}

interface Block {
  id: string;
  startTime: string;
  endTime: string;
  type: 'deep-work' | 'admin' | 'meeting' | 'break' | 'routine';
  title: string;
  tasks: Task[];
}

interface ScheduleData {
  blocks: Block[];
  summary: string | {
    totalBlocks?: number;
    totalTasks?: number;
    totalDuration?: number;
    startTime?: string;
    endTime?: string;
    [key: string]: any;
  };
}

interface ScheduleChatDisplayProps {
  data: ScheduleData;
  message?: string;
}

export default function ScheduleChatDisplay({ data, message }: ScheduleChatDisplayProps) {
  // The full data including IDs is available in the 'data' prop
  // This can be accessed by the execute layer when needed
  console.log('Schedule data with IDs:', data);
  const getBlockColor = (type: string) => {
    switch (type) {
      case 'deep-work': return 'bg-blue-50 border-blue-200';
      case 'admin': return 'bg-gray-50 border-gray-200';
      case 'meeting': return 'bg-purple-50 border-purple-200';
      case 'break': return 'bg-green-50 border-green-200';
      case 'routine': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'deep-work': return '🎯';
      case 'admin': return '📋';
      case 'meeting': return '👥';
      case 'break': return '☕';
      case 'routine': return '🔄';
      default: return '📌';
    }
  };

  const calculateTotalHours = () => {
    const workBlocks = data.blocks.filter(b => b.type !== 'break');
    let totalMinutes = 0;
    
    workBlocks.forEach(block => {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      totalMinutes += duration;
    });
    
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Summary Card */}
      {data.summary && typeof data.summary === 'string' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{data.summary}</p>
        </div>
      )}

      {/* Schedule Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Total Blocks</div>
          <div className="text-lg font-semibold">
            {typeof data.summary === 'object' && data.summary.totalBlocks !== undefined 
              ? data.summary.totalBlocks 
              : data.blocks.length}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Work Time</div>
          <div className="text-lg font-semibold">
            {typeof data.summary === 'object' && data.summary.totalDuration !== undefined
              ? `${Math.floor(data.summary.totalDuration / 60)}h ${data.summary.totalDuration % 60}m`
              : calculateTotalHours()}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">Breaks</div>
          <div className="text-lg font-semibold">
            {data.blocks.filter(b => b.type === 'break').length}
          </div>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-2">
        {data.blocks.map((block, index) => (
          <div
            key={block.id}
            className={`border rounded-lg p-3 ${getBlockColor(block.type)} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getBlockIcon(block.type)}</span>
                  <span className="font-semibold text-sm">
                    {block.startTime} - {block.endTime}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                    {block.type.replace('-', ' ')}
                  </span>
                </div>
                
                <div className="font-medium text-gray-800 mb-1">
                  {block.title}
                </div>
                
                {block.tasks.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {block.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-xs">•</span>
                        <span className="flex-1">{task.title}</span>
                        <span className="text-xs text-gray-400">{task.duration}m</span>
                        {/* Task ID is in the data but not shown in UI */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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