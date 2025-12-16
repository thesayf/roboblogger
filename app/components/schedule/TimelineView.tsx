import React, { useState } from 'react';
import SlashCommandMenu from './SlashCommandMenu';
import BlockTypeMenu from './BlockTypeMenu';
import BlockTimeMenu from './BlockTimeMenu';
import EventSelectionMenu from './EventSelectionMenu';
import RoutineSelectionMenu from './RoutineSelectionMenu';
import { parseQuickCommand, parseEnhancedCommand, getQuickCommandHints } from '@/app/utils/quickCommandParser';

interface TimelineViewProps {
  commandInput?: string;
  isTypingCommand?: boolean;
  onCommandSelect?: (command: any) => void;
  showSlashMenu?: boolean;
  showBlockTypeMenu?: boolean;
  showBlockTimeMenu?: boolean;
  showRoutineSelectionMenu?: boolean;
  selectedBlockType?: any;
  onSlashMenuSelect?: (item: any) => void;
  onSlashMenuCancel?: () => void;
  onBlockCreate?: (blockType: any, time: string) => void;
  onBlockTypeSelect?: (blockType: any) => void;
  onBlockTypeCancel?: () => void;
  onBlockTimeConfirm?: (time: string) => void;
  onBlockTimeCancel?: () => void;
  showEventSelectionMenu?: boolean;
  onEventSelect?: (event: any) => void;
  onEventSelectionCancel?: () => void;
  onRoutineSelect?: (routine: any) => void;
  onRoutineSelectionCancel?: () => void;
  events?: any[];
  routines?: any[];
  suggestedTime?: string;
  hasBlocks?: boolean;
  currentContext?: 'view' | 'block' | 'task';
  currentBlockTitle?: string;
  bestMatch?: { type: 'routine' | 'event'; item: any; preview: string } | null;
}

export default function TimelineView({
  commandInput = '',
  isTypingCommand = false,
  onCommandSelect,
  showSlashMenu = false,
  showBlockTypeMenu: propShowBlockTypeMenu = false,
  showBlockTimeMenu: propShowBlockTimeMenu = false,
  showRoutineSelectionMenu: propShowRoutineSelectionMenu = false,
  selectedBlockType: propSelectedBlockType = null,
  onSlashMenuSelect,
  onSlashMenuCancel,
  onBlockCreate,
  onBlockTypeSelect,
  onBlockTypeCancel,
  onBlockTimeConfirm,
  onBlockTimeCancel,
  showEventSelectionMenu: propShowEventSelectionMenu = false,
  onEventSelect,
  onEventSelectionCancel,
  onRoutineSelect,
  onRoutineSelectionCancel,
  events = [],
  routines = [],
  suggestedTime = '09:00',
  hasBlocks = false,
  currentContext = 'view',
  currentBlockTitle,
  bestMatch = null,
}: TimelineViewProps) {
  // Use local state only as fallback if props are not provided
  const [localShowBlockTypeMenu, setLocalShowBlockTypeMenu] = useState(false);
  const [localShowBlockTimeMenu, setLocalShowBlockTimeMenu] = useState(false);
  const [localShowEventSelectionMenu, setLocalShowEventSelectionMenu] = useState(false);
  const [localShowRoutineSelectionMenu, setLocalShowRoutineSelectionMenu] = useState(false);
  const [localSelectedBlockType, setLocalSelectedBlockType] = useState<any>(null);
  
  // Use prop values if provided, otherwise use local state
  const showBlockTypeMenu = propShowBlockTypeMenu || localShowBlockTypeMenu;
  const showBlockTimeMenu = propShowBlockTimeMenu || localShowBlockTimeMenu;
  const showRoutineSelectionMenu = propShowRoutineSelectionMenu || localShowRoutineSelectionMenu;
  const selectedBlockType = propSelectedBlockType || localSelectedBlockType;
  const showEventSelectionMenu = propShowEventSelectionMenu || localShowEventSelectionMenu;

  const handleSlashMenuSelection = (item: any) => {
    // Always delegate to parent if available
    if (onSlashMenuSelect) {
      onSlashMenuSelect(item);
    } else {
      // Fallback to local state management
      if (item.id === 'block') {
        setLocalShowBlockTypeMenu(true);
      } else if (item.id === 'event') {
        setLocalShowEventSelectionMenu(true);
      } else if (item.id === 'routine') {
        setLocalShowRoutineSelectionMenu(true);
      }
    }
  };

  const handleBlockTypeSelection = (blockType: any) => {
    if (onBlockTypeSelect) {
      onBlockTypeSelect(blockType);
    } else {
      setLocalShowBlockTypeMenu(false);
      setLocalSelectedBlockType(blockType);
      setLocalShowBlockTimeMenu(true);
    }
  };

  const handleBlockTypeCancel = () => {
    if (onBlockTypeCancel) {
      onBlockTypeCancel();
    } else {
      setLocalShowBlockTypeMenu(false);
    }
  };

  const handleBlockTimeConfirm = (time: string) => {
    if (onBlockTimeConfirm) {
      onBlockTimeConfirm(time);
    } else {
      setLocalShowBlockTimeMenu(false);
      if (onBlockCreate && selectedBlockType) {
        onBlockCreate(selectedBlockType, time);
      }
      setLocalSelectedBlockType(null);
    }
  };

  const handleBlockTimeCancel = () => {
    if (onBlockTimeCancel) {
      onBlockTimeCancel();
    } else {
      setLocalShowBlockTimeMenu(false);
      setLocalSelectedBlockType(null);
    }
  };

  const handleEventSelection = (event: any) => {
    setLocalShowEventSelectionMenu(false);
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  const handleEventSelectionCancel = () => {
    setLocalShowEventSelectionMenu(false);
    if (onEventSelectionCancel) {
      onEventSelectionCancel();
    }
  };

  const handleRoutineSelection = (routine: any) => {
    if (onRoutineSelectionCancel) {
      onRoutineSelectionCancel();
    } else {
      setLocalShowRoutineSelectionMenu(false);
    }
    if (onRoutineSelect) {
      onRoutineSelect(routine);
    }
  };

  const handleRoutineSelectionCancel = () => {
    if (onRoutineSelectionCancel) {
      onRoutineSelectionCancel();
    } else {
      setLocalShowRoutineSelectionMenu(false);
    }
  };

  // Calculate suggested time based on current time if no blocks
  const getSuggestedTime = () => {
    if (!hasBlocks) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = Math.ceil(now.getMinutes() / 15) * 15; // Round to next 15 min
      if (minutes === 60) {
        return `${(hours + 1).toString().padStart(2, '0')}:00`;
      }
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return suggestedTime;
  };

  // Check if typing a quick command
  const quickCommand = commandInput ? parseQuickCommand(commandInput) : null;
  const enhancedCommand = !quickCommand && commandInput ? parseEnhancedCommand(commandInput, suggestedTime) : null;
  const isQuickCmd = !!quickCommand;

  return (
    <div className={hasBlocks ? "py-3" : "py-4"}>
      <div className="py-1">
        <div className="relative">
          <div className="flex items-center">
            {isTypingCommand && commandInput ? (
              <>
                <span className="text-2xl text-gray-900 font-lora whitespace-pre">{commandInput}</span>
                <span className="inline-block w-[2px] h-6 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                {/* Show quick command preview */}
                {quickCommand && (
                  <span className="ml-3 text-gray-400 text-sm">
                    → {quickCommand.label} at {quickCommand.time}
                  </span>
                )}
                {/* Show enhanced command preview */}
                {!quickCommand && enhancedCommand && (
                  <span className="ml-3 text-gray-400 text-sm">
                    → {enhancedCommand.label} ({enhancedCommand.type}) at {enhancedCommand.time}
                  </span>
                )}
                {/* Show best match preview */}
                {!quickCommand && !enhancedCommand && bestMatch && (
                  <span className="ml-3 text-gray-400 text-sm">
                    → {bestMatch.preview}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="inline-block w-[2px] h-6 bg-gray-900 animate-[blink_1s_ease-in-out_infinite]" />
                <span className="ml-2 text-gray-400 text-sm font-mono">
                  {currentContext === 'task' ? (
                    <>In {currentBlockTitle} • t add task • ESC exit</>
                  ) : currentContext === 'block' ? (
                    <>In {currentBlockTitle} • t add task • Enter select • ESC exit</>
                  ) : (
                    <>/ for menu • d930 deep • w630 workout • e events • ⌘← / ⌘→ switch days</>
                  )}
                </span>
              </>
            )}
          </div>
          {showSlashMenu && !isQuickCmd && onSlashMenuCancel && !showBlockTypeMenu && !showBlockTimeMenu && !showEventSelectionMenu && !showRoutineSelectionMenu && (
            <SlashCommandMenu 
              onSelect={handleSlashMenuSelection}
              onCancel={onSlashMenuCancel}
            />
          )}
          {showBlockTypeMenu && !showBlockTimeMenu && (
            <BlockTypeMenu
              onSelect={handleBlockTypeSelection}
              onCancel={handleBlockTypeCancel}
            />
          )}
          {showBlockTimeMenu && selectedBlockType && (
            <BlockTimeMenu
              suggestedTime={getSuggestedTime()}
              blockType={selectedBlockType.label}
              onConfirm={handleBlockTimeConfirm}
              onCancel={handleBlockTimeCancel}
            />
          )}
          {showEventSelectionMenu && (
            <EventSelectionMenu
              events={events}
              onSelect={handleEventSelection}
              onCancel={handleEventSelectionCancel}
            />
          )}
          {showRoutineSelectionMenu && (
            <RoutineSelectionMenu
              routines={routines}
              onSelect={handleRoutineSelection}
              onCancel={handleRoutineSelectionCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
}