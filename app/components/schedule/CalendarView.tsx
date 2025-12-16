import React from 'react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface Block {
  id: string;
  time: string;
  title: string;
  type: 'deep-work' | 'meeting' | 'break' | 'admin';
  duration: number;
  tasks?: Task[];
  energy?: 'high' | 'medium' | 'low';
  outOfOrder?: boolean;
}

interface CalendarViewProps {
  blocks: Block[];
  grabbedBlockId: string | null;
  expandedBlockId: string | null;
  currentTime: Date;
  onBlockClick: (block: Block, index: number) => void;
  onEmptySlotClick: (hour: string) => void;
  onToggleExpand: (blockId: string) => void;
}

export default function CalendarView({
  blocks,
  grabbedBlockId,
  expandedBlockId,
  currentTime,
  onBlockClick,
  onEmptySlotClick,
  onToggleExpand,
}: CalendarViewProps) {
  
  // Check if block is currently active based on time
  const isBlockActive = (block: Block) => {
    const now = currentTime;
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const [startHour, startMin] = block.time.split(':').map(Number);
    const blockStart = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    
    const endMinutes = startHour * 60 + startMin + block.duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const blockEnd = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    
    return currentTimeStr >= blockStart && currentTimeStr < blockEnd;
  };

  // Generate hour slots from 6 AM to 11 PM
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  
  // Calculate position for each block based on its time
  const getBlockPosition = (block: Block) => {
    const [hour, minute] = block.time.split(':').map(Number);
    const hourIndex = hour - 6; // 6 AM is index 0
    const minuteOffset = (minute / 60) * 60; // Convert minutes to pixels (60px per hour)
    return hourIndex * 60 + minuteOffset;
  };

  // Calculate height based on duration
  const getBlockHeight = (duration: number) => {
    return (duration / 60) * 60; // 60px per hour
  };

  // Calculate vertical stack positions for overlapping blocks
  const calculateBlockPositions = () => {
    const positions: { [key: string]: { top: number; left: number; actualTime: string } } = {};
    const columns: { endTime: number; blocks: string[] }[] = [];
    
    // Process blocks in Timeline order (the order they appear in the array)
    blocks.forEach((block, index) => {
      const [hour, minute] = block.time.split(':').map(Number);
      const startMinutes = hour * 60 + minute;
      const endMinutes = startMinutes + block.duration;
      
      // Find the first available column
      let columnIndex = columns.findIndex(col => col.endTime <= startMinutes);
      
      if (columnIndex === -1) {
        // Need a new column
        columnIndex = columns.length;
        columns.push({ endTime: endMinutes, blocks: [block.id] });
      } else {
        // Update existing column
        columns[columnIndex].endTime = endMinutes;
        columns[columnIndex].blocks.push(block.id);
      }
      
      // Position based on Timeline order, not actual time
      // For blocks that are out of order, stack them vertically after their Timeline predecessor
      let topPosition = getBlockPosition(block);
      
      if (index > 0 && block.outOfOrder) {
        // Find the previous block in Timeline order
        const prevBlock = blocks[index - 1];
        const prevPos = getBlockPosition(prevBlock);
        const prevHeight = getBlockHeight(prevBlock.duration);
        
        // Stack this block right after the previous one visually
        topPosition = prevPos + prevHeight + 2; // 2px gap
      }
      
      positions[block.id] = {
        top: topPosition,
        left: 20 + columnIndex * 280,
        actualTime: block.time
      };
    });
    
    return positions;
  };
  
  const blockPositions = calculateBlockPositions();

  return (
    <div className="py-4">
      <div className="relative pl-20 pr-4">
        <div className="text-xs text-gray-500 mb-4 font-mono">CALENDAR VIEW</div>
        
        {/* Time grid background */}
        <div className="relative">
          {hours.map(hour => {
            const hourString = hour === 12 ? '12 PM' : 
                              hour < 12 ? `${hour} AM` : 
                              hour > 12 ? `${hour - 12} PM` : '12 PM';
            
            return (
              <div key={hour} className="relative h-[60px] border-t border-gray-200">
                {/* Time label */}
                <div className="absolute -left-16 top-0 w-14 text-right text-xs text-gray-500 font-mono">
                  {hourString}
                </div>
              </div>
            );
          })}
          
          {/* Blocks positioned based on Timeline order */}
          <div className="absolute inset-0">
            {blocks.map((block, index) => {
              const blockIsActive = isBlockActive(block);
              const height = getBlockHeight(block.duration);
              const position = blockPositions[block.id];
              
              return (
                <div
                  key={block.id}
                  className={cn(
                    "absolute p-2 rounded border text-xs font-mono cursor-pointer transition-all hover:shadow-lg hover:z-10",
                    block.type === 'deep-work' && "bg-purple-50 border-purple-200 text-purple-700",
                    block.type === 'meeting' && "bg-blue-50 border-blue-200 text-blue-700",
                    block.type === 'break' && "bg-green-50 border-green-200 text-green-700",
                    block.type === 'admin' && "bg-gray-50 border-gray-200 text-gray-700",
                    grabbedBlockId === block.id && "opacity-50 scale-95",
                    blockIsActive && "ring-2 ring-green-500 z-20"
                  )}
                  style={{
                    top: `${position.top}px`,
                    height: `${height}px`,
                    left: `${position.left}px`,
                    width: '250px',
                    zIndex: blockIsActive ? 20 : index + 1 // Stack in Timeline order
                  }}
                  onClick={() => {
                    onBlockClick(block, index);
                    onToggleExpand(block.id);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-1">
                        {block.title}
                        {block.outOfOrder && (
                          <span className="text-orange-500" title="Overlaps with previous block">
                            ⚠
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                        <span className={cn(
                          block.outOfOrder && "text-orange-500"
                        )}>
                          {block.time}
                        </span>
                        <span>•</span>
                        <span>{block.duration}m</span>
                        {block.energy && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              block.energy === 'high' && "text-red-500",
                              block.energy === 'medium' && "text-yellow-500",
                              block.energy === 'low' && "text-green-500"
                            )}>
                              {block.energy}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {blockIsActive && (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Tasks summary */}
                  {block.tasks && block.tasks.length > 0 && (
                    <div className="mt-1">
                      {expandedBlockId === block.id ? (
                        // Expanded: show tasks
                        <div className="space-y-0.5 mt-2">
                          {block.tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="flex items-center gap-1 text-[10px]">
                              <span className={cn(
                                "w-2 h-2 border rounded-sm",
                                task.completed ? "bg-blue-500 border-blue-500" : "border-gray-300"
                              )}></span>
                              <span className={cn(
                                "truncate",
                                task.completed && "line-through text-gray-400"
                              )}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {block.tasks.length > 3 && (
                            <div className="text-[10px] text-gray-400">
                              +{block.tasks.length - 3} more
                            </div>
                          )}
                        </div>
                      ) : (
                        // Collapsed: show count
                        <div className="text-[10px] text-gray-500">
                          {block.tasks.filter(t => t.completed).length}/{block.tasks.length} tasks
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}