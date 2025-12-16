// Utility functions for schedule management

export interface Block {
  id: string;
  time: string;
  title: string;
  type: 'deep-work' | 'meeting' | 'break' | 'admin' | 'routine' | 'event';
  duration: number;
  tasks?: Task[];
  energy?: 'high' | 'medium' | 'low';
  outOfOrder?: boolean;
  completed?: boolean;
  note?: string;
  metadata?: any; // For routine/event metadata
}

export interface Task {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  projectId?: string; // Optional projectId for tasks from projects
}

// Calculate end time from start time and duration
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Calculate start time from end time and duration (subtract duration)
export const calculateStartTime = (endTime: string, duration: number): string => {
  const [hours, minutes] = endTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes - duration;
  // Handle negative times by wrapping to previous day
  const adjustedMinutes = totalMinutes < 0 ? 0 : totalMinutes;
  const startHours = Math.floor(adjustedMinutes / 60);
  const startMinutes = adjustedMinutes % 60;
  return `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
};

// Check if blocks are in chronological order
export const checkBlockOrder = (blocks: Block[]): Block[] => {
  const updatedBlocks = [...blocks];
  
  for (let i = 0; i < updatedBlocks.length; i++) {
    if (i === 0) {
      // First block can't be out of order
      updatedBlocks[i].outOfOrder = false;
    } else {
      const prevBlock = updatedBlocks[i - 1];
      const prevEndTime = calculateEndTime(prevBlock.time, prevBlock.duration);
      const currentStartTime = updatedBlocks[i].time;
      
      // Only flag if current block starts before previous block ends (overlap)
      updatedBlocks[i].outOfOrder = currentStartTime < prevEndTime;
    }
  }
  
  return updatedBlocks;
};

// Update all block times starting from a given index
export const updateBlockTimes = (blocks: Block[], startIndex: number, initialTime?: string): Block[] => {
  const updatedBlocks = [...blocks];
  
  for (let i = startIndex; i < updatedBlocks.length; i++) {
    if (i === 0) {
      // First block - use initial time or keep existing
      if (initialTime) {
        updatedBlocks[i].time = initialTime;
      }
    } else {
      // Calculate time based on previous block's end
      const prevBlock = updatedBlocks[i - 1];
      updatedBlocks[i].time = calculateEndTime(prevBlock.time, prevBlock.duration);
    }
  }
  
  return updatedBlocks;
};