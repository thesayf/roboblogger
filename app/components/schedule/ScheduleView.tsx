"use client";

import React, { useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TimelineView from './TimelineView';
import Block from './Block';
import BlockTimeMenu from './BlockTimeMenu';
import { Block as BlockType, Task, calculateEndTime } from '@/app/utils/scheduleUtils';

interface ScheduleViewProps {
  blocks: BlockType[];
  selectedBlockIndex: number;
  selectedTaskIndex: number | null;
  cursorPosition: { type: 'block'; index: number } | { type: 'between'; afterIndex: number } | { type: 'none' };
  taskInputPosition: number;
  isTypingTask: boolean;
  taskInput: string;
  commandInput: string;
  isTypingCommand: boolean;
  showSlashMenu: boolean;
  showBlockTypeMenu?: boolean;
  showBlockTimeMenu?: boolean;
  showRoutineSelectionMenu?: boolean;
  selectedBlockType?: any;
  blockCreationSuggestedTime?: string;
  isLoadingDays: boolean;
  currentDay: 'today' | 'tomorrow';
  currentTime: Date;
  user: any;
  events?: any[];
  routines?: any[];
  bestMatch?: { type: 'routine' | 'event'; item: any; preview: string } | null;
  bestTaskMatch?: { type: 'project' | 'admin'; item: any; preview: string } | null;
  bestProjectMatch?: { item: any; preview: string } | null;
  showProjectAutocomplete?: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onSlashMenuSelect: (item: any) => void;
  onSlashMenuCancel: () => void;
  onBlockCreate: (blockType: any, time: string, duration: number) => void;
  onBlockTypeSelect?: (blockType: any) => void;
  onBlockTypeCancel?: () => void;
  onBlockTimeConfirm?: (time: string) => void;
  onBlockTimeCancel?: () => void;
  showEventSelectionMenu?: boolean;
  onEventSelect?: (event: any) => void;
  onEventSelectionCancel?: () => void;
  onRoutineSelect?: (routine: any) => void;
  onRoutineSelectionCancel?: () => void;
  onToggleTask: (blockIndex: number, taskIndex: number) => void;
  onAddTask: (title: string, duration: number, position?: number, projectId?: string, taskId?: string) => void;
  onAddMultipleTasks?: (tasksData: Array<{ title: string; duration: number; projectId?: string; taskId?: string }>, position?: number) => void;
  onTaskMenuSelect: (option: string) => void;
  setSelectedBlockIndex: (index: number) => void;
  setSelectedTaskIndex: (index: number | null) => void;
  setTaskInput: (input: string) => void;
  setIsTypingTask: (typing: boolean) => void;
  isEditingBlock?: boolean;
  editingBlockIndex?: number | null;
  editBlockType?: string;
  editBlockTime?: string;
  editFieldFocus?: 'type' | 'time';
  timeEditPosition?: number;
  isEditingTask?: boolean;
  editingTaskIndex?: number | null;
  editTaskName?: string;
  editTaskDuration?: string;
  taskEditFieldFocus?: 'name' | 'duration';
  isEditingNote?: boolean;
  editingNoteBlockIndex?: number | null;
  editNoteValue?: string;
  grabbedBlockIndex?: number | null;
  grabbedTaskIndex?: number | null;
  grabbedTasks?: Array<{
    blockIndex: number;
    taskIndex: number;
    task: any;
    originalBlockId?: string;
  }>;
  isSelectingTasks?: boolean;
  showMoveTimePopup?: boolean;
  movedBlockIndex?: number;
  moveSuggestedTime?: string;
  onMoveTimeConfirm?: (time: string) => void;
  onMoveTimeCancel?: () => void;
}

export default function ScheduleView({
  blocks,
  selectedBlockIndex,
  selectedTaskIndex,
  cursorPosition,
  taskInputPosition,
  isTypingTask,
  taskInput,
  commandInput,
  isTypingCommand,
  showSlashMenu,
  showBlockTypeMenu,
  showBlockTimeMenu,
  showRoutineSelectionMenu,
  selectedBlockType,
  blockCreationSuggestedTime,
  isLoadingDays,
  currentDay,
  currentTime,
  user,
  events,
  routines,
  bestMatch,
  bestTaskMatch,
  bestProjectMatch,
  showProjectAutocomplete,
  onDragEnd,
  onSlashMenuSelect,
  onSlashMenuCancel,
  onBlockCreate,
  onBlockTypeSelect,
  onBlockTypeCancel,
  onBlockTimeConfirm,
  onBlockTimeCancel,
  onRoutineSelectionCancel,
  showEventSelectionMenu,
  onEventSelect,
  onEventSelectionCancel,
  onRoutineSelect,
  onToggleTask,
  onAddTask,
  onAddMultipleTasks,
  onTaskMenuSelect,
  setSelectedBlockIndex,
  setSelectedTaskIndex,
  setTaskInput,
  setIsTypingTask,
  isEditingBlock,
  editingBlockIndex,
  editBlockType,
  editBlockTime,
  editFieldFocus,
  timeEditPosition,
  isEditingTask,
  editingTaskIndex,
  editTaskName,
  editTaskDuration,
  taskEditFieldFocus,
  isEditingNote,
  editingNoteBlockIndex,
  editNoteValue,
  grabbedBlockIndex,
  grabbedTaskIndex,
  grabbedTasks,
  isSelectingTasks,
  showMoveTimePopup,
  movedBlockIndex,
  moveSuggestedTime,
  onMoveTimeConfirm,
  onMoveTimeCancel
}: ScheduleViewProps) {
  // Create refs for each block to enable scrolling
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Create refs for TimelineView elements (between blocks)
  const timelineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to get smart suggested time
  // If the calculated time (end of previous block) is in the past, return current time rounded to next 15 min
  // Otherwise return the calculated time
  const getSmartSuggestedTime = (calculatedTime: string | undefined): string => {
    if (!calculatedTime) {
      // No calculated time, use current time rounded to next 15 minutes
      const now = currentTime;
      const hours = now.getHours();
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      if (minutes === 60) {
        return `${(hours + 1).toString().padStart(2, '0')}:00`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    // Parse the calculated time
    const [hours, minutes] = calculatedTime.split(':').map(Number);
    const calculatedDate = new Date(currentTime);
    calculatedDate.setHours(hours, minutes, 0, 0);

    // If calculated time is in the past, use current time rounded to next 15 minutes
    if (calculatedDate < currentTime) {
      const now = currentTime;
      const currentHours = now.getHours();
      const currentMinutes = Math.ceil(now.getMinutes() / 15) * 15;
      if (currentMinutes === 60) {
        return `${(currentHours + 1).toString().padStart(2, '0')}:00`;
      } else {
        return `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      }
    }

    // Calculated time is in the future, use it
    return calculatedTime;
  };

  // Scroll to selected block when it changes
  useEffect(() => {
    if (selectedBlockIndex >= 0 && selectedBlockIndex < blockRefs.current.length) {
      const selectedBlock = blockRefs.current[selectedBlockIndex];
      if (selectedBlock) {
        // Use a small delay to ensure DOM has updated
        requestAnimationFrame(() => {
          const blockRect = selectedBlock.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const topPadding = 100; // Desired space from top
          const bottomPadding = 200; // Desired space from bottom

          // Check if the block is already fully visible with adequate padding
          const isTopVisible = blockRect.top >= topPadding;
          const isBottomVisible = blockRect.bottom <= viewportHeight - bottomPadding;

          // Only scroll if not fully visible
          if (!isTopVisible || !isBottomVisible) {
            const blockHeight = blockRect.height;
            const requiredSpace = topPadding + blockHeight + bottomPadding;

            let targetScroll;

            if (requiredSpace > viewportHeight) {
              // Block is too tall to fit with padding
              // Check if we're scrolling down or up based on whether bottom is visible
              if (blockRect.bottom > viewportHeight) {
                // Scrolling down - show as much as possible from the top
                targetScroll = window.scrollY + blockRect.top - topPadding;
              } else {
                // Scrolling up - keep current position
                return;
              }
            } else {
              // Block fits - position with offsets
              // Prioritize showing the bottom if scrolling down
              if (blockRect.bottom > viewportHeight - bottomPadding) {
                // Bottom is cut off - scroll to show bottom with padding
                targetScroll = window.scrollY + blockRect.bottom - viewportHeight + bottomPadding;
              } else {
                // Top is cut off - scroll to show top with padding
                targetScroll = window.scrollY + blockRect.top - topPadding;
              }
            }

            // Smooth scroll to position
            window.scrollTo({
              top: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          }
        });
      }
    }
  }, [selectedBlockIndex]);

  // Scroll to TimelineView (between blocks) when cursor position changes
  useEffect(() => {
    if (cursorPosition.type === 'between') {
      // afterIndex === -1 means before first block
      // afterIndex >= 0 means after that block index
      const timelineIndex = cursorPosition.afterIndex + 1; // Convert to array index (0 for before first block)
      const timelineElement = timelineRefs.current[timelineIndex];

      if (timelineElement) {
        requestAnimationFrame(() => {
          const timelineRect = timelineElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const topPadding = 100;
          const bottomPadding = 200; // Space below the timeline input

          // Check if the timeline is already fully visible with adequate padding
          const isTopVisible = timelineRect.top >= topPadding;
          const isBottomVisible = timelineRect.bottom <= viewportHeight - bottomPadding;

          // Only scroll if not fully visible
          if (!isTopVisible || !isBottomVisible) {
            const timelineHeight = timelineRect.height;
            const requiredSpace = topPadding + timelineHeight + bottomPadding;

            let targetScroll;

            if (requiredSpace > viewportHeight) {
              // Timeline is too tall - position it near the top
              targetScroll = window.scrollY + timelineRect.top - topPadding;
            } else {
              // Timeline fits - prioritize showing the bottom
              if (timelineRect.bottom > viewportHeight - bottomPadding) {
                // Bottom is cut off - scroll to show bottom with padding
                targetScroll = window.scrollY + timelineRect.bottom - viewportHeight + bottomPadding;
              } else {
                // Top is cut off - scroll to show top with padding
                targetScroll = window.scrollY + timelineRect.top - topPadding;
              }
            }

            window.scrollTo({
              top: Math.max(0, targetScroll),
              behavior: 'smooth'
            });
          }
        });
      }
    }
  }, [cursorPosition]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="w-full">
      {/* Schedule content */}
      {isLoadingDays ? (
        <div className="text-center py-8">
          <div className="text-gray-500 font-mono text-sm">Loading schedule...</div>
        </div>
      ) : (
        <>
          {/* Show TimelineView when no blocks or cursor is before first block */}
          {(blocks.length === 0 || (cursorPosition.type === 'between' && cursorPosition.afterIndex === -1)) && (
            <div ref={el => timelineRefs.current[0] = el}>
              <TimelineView
                commandInput={commandInput}
                isTypingCommand={isTypingCommand}
                onCommandSelect={() => {}}
                showSlashMenu={showSlashMenu}
                showBlockTypeMenu={showBlockTypeMenu}
                showBlockTimeMenu={showBlockTimeMenu}
                showRoutineSelectionMenu={showRoutineSelectionMenu}
                selectedBlockType={selectedBlockType}
                onSlashMenuSelect={onSlashMenuSelect}
                onSlashMenuCancel={onSlashMenuCancel}
                onBlockCreate={onBlockCreate}
                onBlockTypeSelect={onBlockTypeSelect}
                onBlockTypeCancel={onBlockTypeCancel}
                onBlockTimeConfirm={onBlockTimeConfirm}
                onBlockTimeCancel={onBlockTimeCancel}
                showEventSelectionMenu={showEventSelectionMenu}
                onEventSelect={onEventSelect}
                onEventSelectionCancel={onEventSelectionCancel}
                onRoutineSelect={onRoutineSelect}
                onRoutineSelectionCancel={onRoutineSelectionCancel}
                events={events}
                routines={routines}
                suggestedTime={blockCreationSuggestedTime || getSmartSuggestedTime(blocks.length > 0 ? calculateEndTime(blocks[blocks.length - 1].time, blocks[blocks.length - 1].duration) : undefined)}
                hasBlocks={blocks.length > 0}
                currentContext={'view'}
                bestMatch={bestMatch}
                currentBlockTitle={undefined}
              />
            </div>
          )}
          
          {blocks.length === 0 ? (
            <div className="py-12" />
          ) : (
            <div className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block, index) => (
                    <div
                      key={block.id}
                      ref={el => blockRefs.current[index] = el}
                    >
                      <Block
                        id={block.id}
                        time={block.time}
                        title={block.title}
                        type={block.type as any}
                        duration={block.duration}
                        tasks={block.tasks || []}
                        metadata={block.metadata}
                        isSelected={selectedBlockIndex === index}
                        hasCursorFocus={cursorPosition.type === 'block' && cursorPosition.index === index}
                        isCollapsed={false}
                        isCurrent={false}
                        completed={block.completed}
                        selectedTaskIndex={selectedBlockIndex === index ? selectedTaskIndex : null}
                        taskInputPosition={selectedBlockIndex === index ? taskInputPosition : -2}
                        isTypingTask={selectedBlockIndex === index && isTypingTask}
                        taskInput={selectedBlockIndex === index ? taskInput : ''}
                        onToggleCollapse={() => {}}
                        onSelectTask={(taskIndex) => {
                          setSelectedBlockIndex(index);
                          setSelectedTaskIndex(taskIndex);
                        }}
                        onToggleTask={(taskIndex) => onToggleTask(index, taskIndex)}
                        onAddTask={onAddTask}
                        onAddMultipleTasks={onAddMultipleTasks}
                        onTaskMenuSelect={onTaskMenuSelect}
                        isEditingBlock={isEditingBlock && editingBlockIndex === index}
                        editBlockType={editingBlockIndex === index ? editBlockType : ''}
                        editBlockTime={editingBlockIndex === index ? editBlockTime : ''}
                        editFieldFocus={editingBlockIndex === index ? editFieldFocus : 'type'}
                        timeEditPosition={editingBlockIndex === index ? timeEditPosition : 0}
                        isEditingTask={isEditingTask && selectedBlockIndex === index}
                        editingTaskIndex={selectedBlockIndex === index ? editingTaskIndex : null}
                        editTaskName={selectedBlockIndex === index ? editTaskName : ''}
                        editTaskDuration={selectedBlockIndex === index ? editTaskDuration : ''}
                        taskEditFieldFocus={selectedBlockIndex === index ? taskEditFieldFocus : 'name'}
                        note={block.note}
                        isEditingNote={isEditingNote && editingNoteBlockIndex === index}
                        editNoteValue={editingNoteBlockIndex === index ? editNoteValue : ''}
                        isGrabbed={grabbedBlockIndex === index}
                        grabbedTaskIndex={selectedBlockIndex === index ? grabbedTaskIndex : null}
                        grabbedTasks={grabbedTasks}
                        isSelectingTasks={isSelectingTasks}
                        blockIndex={index}
                        bestTaskMatch={selectedBlockIndex === index ? bestTaskMatch : null}
                        bestProjectMatch={selectedBlockIndex === index ? bestProjectMatch : null}
                        showProjectAutocomplete={selectedBlockIndex === index ? showProjectAutocomplete : false}
                        allBlocks={blocks}
                      />
                      
                      {/* Show BlockTimeMenu for moved block */}
                      {showMoveTimePopup && movedBlockIndex === index && (
                        <div className="mt-2 mb-4">
                          <BlockTimeMenu
                            suggestedTime={moveSuggestedTime || '09:00'}
                            blockType={block.title}
                            onConfirm={onMoveTimeConfirm || (() => {})}
                            onCancel={onMoveTimeCancel || (() => {})}
                          />
                        </div>
                      )}
                      
                      {/* Show TimelineView at cursor between position */}
                      {cursorPosition.type === 'between' && cursorPosition.afterIndex === index && (
                        <div
                          className="-mt-3 mb-3"
                          ref={el => timelineRefs.current[index + 1] = el}
                        >
                          <TimelineView
                            commandInput={commandInput}
                            isTypingCommand={isTypingCommand}
                            onCommandSelect={() => {}}
                            showSlashMenu={showSlashMenu}
                            showBlockTypeMenu={showBlockTypeMenu}
                            showBlockTimeMenu={showBlockTimeMenu}
                            showRoutineSelectionMenu={showRoutineSelectionMenu}
                            selectedBlockType={selectedBlockType}
                            onSlashMenuSelect={onSlashMenuSelect}
                            onSlashMenuCancel={onSlashMenuCancel}
                            onBlockCreate={onBlockCreate}
                            onBlockTypeSelect={onBlockTypeSelect}
                            onBlockTypeCancel={onBlockTypeCancel}
                            onBlockTimeConfirm={onBlockTimeConfirm}
                            onBlockTimeCancel={onBlockTimeCancel}
                            showEventSelectionMenu={showEventSelectionMenu}
                            onEventSelect={onEventSelect}
                            onEventSelectionCancel={onEventSelectionCancel}
                            onRoutineSelect={onRoutineSelect}
                            onRoutineSelectionCancel={onRoutineSelectionCancel}
                            events={events}
                            routines={routines}
                            suggestedTime={blockCreationSuggestedTime || getSmartSuggestedTime(blocks.length > 0 ? calculateEndTime(blocks[index].time, blocks[index].duration) : undefined)}
                            hasBlocks={true}
                            currentContext={'view'}
                            currentBlockTitle={undefined}
                            bestMatch={bestMatch}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </>
      )}
    </div>
  );
}