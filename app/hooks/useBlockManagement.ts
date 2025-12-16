import { useState, useCallback } from 'react';
import { Block, Task } from '@/app/utils/scheduleUtils';
import { DragEndEvent } from '@dnd-kit/core';

export function useBlockManagement(initialBlocks: Block[] = [], dayId?: string | null, onTaskToggled?: () => void) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(-1);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [onBlockMoveRequest, setOnBlockMoveRequest] = useState<((oldIndex: number, newIndex: number) => void) | null>(null);

  // Handle drag and drop for blocks
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // If we have a callback for move requests, use it (for time popup)
        if (onBlockMoveRequest) {
          console.log('🎯 Drag move request:', { oldIndex, newIndex });
          onBlockMoveRequest(oldIndex, newIndex);
        } else {
          // Otherwise do the default auto-flow behavior
          const newBlocks = [...blocks];
          const [movedBlock] = newBlocks.splice(oldIndex, 1);
          newBlocks.splice(newIndex, 0, movedBlock);
          
          // Don't auto-adjust times after reordering - keep original times
          setBlocks(newBlocks);
        }
      }
    }
  }, [blocks, onBlockMoveRequest]);

  // Add a new block
  const addBlock = useCallback(async (blockData: Partial<Block>, insertAfterIndex?: number) => {
    // Use provided index or default to after selected block
    const afterIndex = insertAfterIndex !== undefined ? insertAfterIndex : selectedBlockIndex;
    
    // Use the provided time or a default
    const suggestedTime = blockData.time || '09:00';
    
    const insertPosition = afterIndex + 1; // Insert after the specified index
    
    // Create the block optimistically with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const newBlock: Block = {
      id: tempId,
      time: suggestedTime,
      title: blockData.title || 'New Block',
      type: blockData.type || 'deep-work',
      duration: blockData.duration || 60,
      tasks: blockData.tasks || [],
      energy: blockData.energy,
      metadata: blockData.metadata, // Include metadata for routines
    };
    
    // Update UI immediately (optimistic update)
    const newBlocks = [...blocks];
    newBlocks.splice(insertPosition, 0, newBlock);
    // Don't auto-update times - keep the times as provided
    setBlocks(newBlocks);
    
    // Select the newly added block immediately
    setSelectedBlockIndex(insertPosition);
    setSelectedTaskIndex(newBlock.tasks.length > 0 ? 0 : null);
    
    // Persist to database in the background if we have a dayId
    if (dayId) {
      fetch('/api/blocks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          title: newBlock.title,
          time: newBlock.time,
          duration: newBlock.duration,
          type: newBlock.type,
          tasks: newBlock.tasks, // Include tasks array
          metadata: blockData.metadata, // Include metadata (for routine info)
          index: insertPosition,
        }),
      })
      .then(response => response.json())
      .then(createdBlock => {
        // Update the temporary block with the real ID from the server
        setBlocks(prevBlocks => 
          prevBlocks.map(block => 
            block.id === tempId 
              ? { ...block, id: createdBlock.id || createdBlock._id }
              : block
          )
        );
      })
      .catch(error => {
        console.error('Error persisting block:', error);
        // Could show a toast notification here that save failed
        // but keep the block in the UI
      });
    }
    
    return insertPosition;
  }, [blocks, selectedBlockIndex, dayId]);

  // Add a new task to the current block
  const addTask = useCallback((taskData: { title: string; duration: number; projectId?: string; taskId?: string }, insertPosition?: number) => {
    const currentBlock = blocks[selectedBlockIndex];
    
    if (!currentBlock) return;
    
    // Create task optimistically with temporary ID
    const tempId = `temp-task-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title: taskData.title,
      duration: taskData.duration,
      completed: false,
      projectId: taskData.projectId,
    };
    
    // Update UI immediately (optimistic update)
    const newBlocks = [...blocks];
    const updatedBlock = newBlocks[selectedBlockIndex];
    
    if (!updatedBlock.tasks) {
      updatedBlock.tasks = [];
    }
    
    // Use provided position or default to end
    const position = insertPosition !== undefined ? insertPosition : updatedBlock.tasks.length;
    updatedBlock.tasks.splice(position, 0, newTask);
    
    // Update block duration based on total task duration
    const totalDuration = updatedBlock.tasks.reduce((sum, task) => sum + task.duration, 0);
    updatedBlock.duration = totalDuration;
    
    setBlocks(newBlocks);
    setSelectedTaskIndex(null); // Stay at block level
    
    // Persist to database in the background if block has a real ID
    const blockId = currentBlock.id;
    if (dayId && blockId && !blockId.startsWith('temp-')) {
      fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId,
          title: taskData.title,
          duration: taskData.duration,
          insertPosition: position,
          projectId: taskData.projectId,
          taskId: taskData.taskId, // Pass the taskId if we're referencing an existing task
        }),
      })
      .then(response => response.json())
      .then(createdTask => {
        // Update the temporary task with the real ID from the server
        setBlocks(prevBlocks => 
          prevBlocks.map((block, idx) => {
            if (idx === selectedBlockIndex && block.tasks) {
              return {
                ...block,
                tasks: block.tasks.map(task => 
                  task.id === tempId 
                    ? { ...task, id: createdTask.id || createdTask._id }
                    : task
                ),
              };
            }
            return block;
          })
        );
      })
      .catch(error => {
        console.error('Error persisting task:', error);
        // Task stays in UI even if save fails
      });
    }
  }, [blocks, selectedBlockIndex, dayId]);

  // Add multiple tasks to the current block at once (for multi-selection)
  const addMultipleTasks = useCallback((tasksData: Array<{ title: string; duration: number; projectId?: string; taskId?: string }>, insertPosition?: number) => {
    const currentBlock = blocks[selectedBlockIndex];

    if (!currentBlock || tasksData.length === 0) return;

    // Create all tasks optimistically with temporary IDs
    const now = Date.now();
    const newTasks: Task[] = tasksData.map((taskData, index) => ({
      id: `temp-task-${now}-${index}`,
      title: taskData.title,
      duration: taskData.duration,
      completed: false,
      projectId: taskData.projectId,
    }));

    // Update UI immediately (optimistic update) - single state update for all tasks
    const newBlocks = [...blocks];
    const updatedBlock = newBlocks[selectedBlockIndex];

    if (!updatedBlock.tasks) {
      updatedBlock.tasks = [];
    }

    // Use provided position or default to end
    const position = insertPosition !== undefined ? insertPosition : updatedBlock.tasks.length;
    updatedBlock.tasks.splice(position, 0, ...newTasks);

    // Update block duration based on total task duration
    const totalDuration = updatedBlock.tasks.reduce((sum, task) => sum + task.duration, 0);
    updatedBlock.duration = totalDuration;

    setBlocks(newBlocks);
    setSelectedTaskIndex(null); // Stay at block level

    // Persist all tasks to database in a single batch request
    const blockId = currentBlock.id;
    if (dayId && blockId && !blockId.startsWith('temp-')) {
      fetch('/api/tasks/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId,
          tasksData,
          insertPosition: position,
        }),
      })
      .then(response => response.json())
      .then(result => {
        if (result.tasks && Array.isArray(result.tasks)) {
          // Update all temporary tasks with real IDs from the server
          setBlocks(prevBlocks =>
            prevBlocks.map((block, idx) => {
              if (idx === selectedBlockIndex && block.tasks) {
                return {
                  ...block,
                  tasks: block.tasks.map((task, taskIdx) => {
                    // Match temporary task by its index relative to insertion position
                    const relativeIndex = taskIdx - position;
                    if (
                      relativeIndex >= 0 &&
                      relativeIndex < result.tasks.length &&
                      task.id === `temp-task-${now}-${relativeIndex}`
                    ) {
                      const createdTask = result.tasks[relativeIndex];
                      return { ...task, id: createdTask.id || createdTask._id };
                    }
                    return task;
                  }),
                };
              }
              return block;
            })
          );
          console.log('[addMultipleTasks] Successfully persisted', result.tasks.length, 'tasks');
        }
      })
      .catch(error => {
        console.error('[addMultipleTasks] Error persisting tasks:', error);
        // Tasks stay in UI even if save fails
      });
    }

    return position + tasksData.length - 1; // Return position of last added task
  }, [blocks, selectedBlockIndex, dayId]);

  // Add an event to the schedule
  const addEvent = useCallback((event: any) => {
    // Use the event's own time - don't auto-calculate
    const eventTime = event.time || '09:00';
    
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      time: eventTime,
      title: event.title,
      type: 'meeting',
      duration: event.duration,
      tasks: [],
    };
    
    // Insert after the currently selected block
    const newBlocks = [...blocks];
    const insertPosition = selectedBlockIndex + 1;
    
    newBlocks.splice(insertPosition, 0, newBlock);
    
    // Don't auto-adjust times - keep the provided times
    setBlocks(newBlocks);
    
    // Select the newly added block
    setSelectedBlockIndex(insertPosition);
  }, [blocks, selectedBlockIndex]);

  // Add a routine to the schedule
  const addRoutine = useCallback((routine: any) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      time: routine.time,
      title: routine.title,
      type: 'deep-work',
      duration: routine.duration,
      tasks: routine.tasks?.map((task: string, index: number) => ({
        id: `task-${Date.now()}-${index}`,
        title: task,
        duration: Math.floor(routine.duration / (routine.tasks?.length || 1)),
        completed: false,
      })) || [],
    };
    
    // Insert after the currently selected block
    const newBlocks = [...blocks];
    const insertPosition = selectedBlockIndex + 1;
    
    newBlocks.splice(insertPosition, 0, newBlock);
    
    // Don't auto-adjust times - keep the provided times
    setBlocks(newBlocks);
    
    // Select the newly added block
    setSelectedBlockIndex(insertPosition);
  }, [blocks, selectedBlockIndex]);

  // Toggle task completion
  const toggleTask = useCallback(async (blockIndex: number, taskIndex: number) => {
    const block = blocks[blockIndex];
    if (!block || !block.tasks || !block.tasks[taskIndex]) return;
    
    const task = block.tasks[taskIndex];
    const newCompletedState = !task.completed;
    
    // Update UI immediately (optimistic update)
    const newBlocks = [...blocks];
    newBlocks[blockIndex].tasks![taskIndex].completed = newCompletedState;
    setBlocks(newBlocks);
    
    // Persist to database if task has a real ID
    const taskId = task.id;
    if (taskId && !taskId.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            completed: newCompletedState,
            dayId
          })
        });
        
        if (!response.ok) {
          // Revert on failure
          console.error('Failed to update task completion status');
          const revertBlocks = [...blocks];
          revertBlocks[blockIndex].tasks![taskIndex].completed = !newCompletedState;
          setBlocks(revertBlocks);
        } else {
          // Notify parent that a task was toggled
          if (onTaskToggled) {
            onTaskToggled();
          }
        }
      } catch (error) {
        console.error('Error updating task:', error);
        // Revert on error
        const revertBlocks = [...blocks];
        revertBlocks[blockIndex].tasks![taskIndex].completed = !newCompletedState;
        setBlocks(revertBlocks);
      }
    }
  }, [blocks, dayId, onTaskToggled]);

  // Delete a block
  const deleteBlock = useCallback(async (blockIndex: number) => {
    const blockToDelete = blocks[blockIndex];
    if (!blockToDelete) return;

    console.log('[useBlockManagement] Deleting block:', blockToDelete.id);

    // Remove from UI immediately (optimistic update)
    const newBlocks = blocks.filter((_, index) => index !== blockIndex);
    setBlocks(newBlocks);

    // Update selection
    if (selectedBlockIndex === blockIndex) {
      setSelectedBlockIndex(null);
      setSelectedTaskIndex(null);
    } else if (selectedBlockIndex > blockIndex) {
      setSelectedBlockIndex(selectedBlockIndex - 1);
    }

    // Delete from database if it has a real ID
    const blockId = blockToDelete.id;
    if (dayId && blockId && !blockId.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${blockId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayId })
        });

        if (!response.ok) {
          console.error('Failed to delete block from database');
          // Could restore the block in UI here if delete failed
        }
      } catch (error) {
        console.error('Error deleting block:', error);
      }
    }
  }, [blocks, dayId, selectedBlockIndex, setBlocks]);

  // Delete or unassign a task (ALWAYS unassign in timeline view - tasks should only be deleted from inventory)
  const deleteTask = useCallback(async (blockIndex: number, taskIndex: number, isMetaKey?: boolean) => {
    const block = blocks[blockIndex];
    if (!block || !block.tasks || !block.tasks[taskIndex]) return;

    const taskToDelete = block.tasks[taskIndex];

    // In timeline view, ALWAYS unassign tasks rather than deleting them
    // Tasks should only be truly deleted from the inventory view
    const shouldUnassign = true; // Always unassign in timeline

    console.log('[useBlockManagement] Unassigning task from timeline:', taskToDelete.id);

    // Remove from UI immediately (optimistic update)
    const newBlocks = [...blocks];
    newBlocks[blockIndex].tasks.splice(taskIndex, 1);
    
    // Update block duration
    const totalDuration = newBlocks[blockIndex].tasks.reduce((sum, task) => sum + task.duration, 0);
    newBlocks[blockIndex].duration = totalDuration || 30; // Default to 30 min if no tasks

    setBlocks(newBlocks);

    // Update task selection - keep user in block, don't exit to view level
    // If the deleted task was selected, stay at block level but clear task selection
    // If a task after the deleted one was selected, adjust the index
    if (selectedTaskIndex === taskIndex) {
      // Keep selectedTaskIndex as null to stay at block level (not exiting the block)
      setSelectedTaskIndex(null);
    } else if (selectedTaskIndex !== null && selectedTaskIndex > taskIndex) {
      setSelectedTaskIndex(selectedTaskIndex - 1);
    }
    // Note: selectedBlockIndex is NOT changed - user stays in the same block

    // Delete or unassign from database if it has a real ID
    const taskId = taskToDelete.id;
    const blockId = block.id;
    if (blockId && !blockId.startsWith('temp-') && taskId && !taskId.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            blockId,
            unassignOnly: shouldUnassign // Use the shouldUnassign flag we calculated above
          })
        });

        if (!response.ok) {
          console.error('Failed to delete task from database');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }, [blocks, selectedTaskIndex, setBlocks]);

  // Toggle block completion
  const toggleBlockCompletion = useCallback(async (blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block) return;

    const newCompletedState = !block.completed;

    // Update UI immediately (optimistic update)
    const newBlocks = [...blocks];
    newBlocks[blockIndex].completed = newCompletedState;
    setBlocks(newBlocks);

    // Persist to database if block has a real ID
    const blockId = block.id;
    if (dayId && blockId && !blockId.startsWith('temp-')) {
      try {
        const response = await fetch(`/api/blocks/${blockId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completed: newCompletedState,
            dayId
          })
        });

        if (!response.ok) {
          // Revert on failure
          console.error('Failed to update block completion status');
          const revertBlocks = [...blocks];
          revertBlocks[blockIndex].completed = !newCompletedState;
          setBlocks(revertBlocks);
        }
      } catch (error) {
        console.error('Error updating block:', error);
        // Revert on error
        const revertBlocks = [...blocks];
        revertBlocks[blockIndex].completed = !newCompletedState;
        setBlocks(revertBlocks);
      }
    }
  }, [blocks, dayId, setBlocks]);

  return {
    blocks,
    selectedBlockIndex,
    selectedTaskIndex,
    setBlocks,
    setSelectedBlockIndex,
    setSelectedTaskIndex,
    handleDragEnd,
    addBlock,
    addTask,
    addMultipleTasks,
    addEvent,
    addRoutine,
    toggleTask,
    deleteBlock,
    deleteTask,
    toggleBlockCompletion,
    setOnBlockMoveRequest,
  };
}