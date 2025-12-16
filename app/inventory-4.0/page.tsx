"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Inventory40Page() {
  const [commandInput, setCommandInput] = useState('');
  const [isTypingCommand, setIsTypingCommand] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showBlockTypeMenu, setShowBlockTypeMenu] = useState(false);
  const [showBlockTimeMenu, setShowBlockTimeMenu] = useState(false);
  const [showEventSelectionMenu, setShowEventSelectionMenu] = useState(false);
  const [showRoutineSelectionMenu, setShowRoutineSelectionMenu] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<any>(null);
  const [currentContext, setCurrentContext] = useState<'view' | 'block' | 'task'>('view');
  const [currentBlockTitle, setCurrentBlockTitle] = useState('');

  // Placeholder data
  const hasBlocks = false;
  const events = [
    { id: '1', name: 'Team Standup', time: '09:00' },
    { id: '2', name: 'Client Meeting', time: '14:00' },
    { id: '3', name: 'Code Review', time: '16:00' },
  ];
  const routines = [
    { id: '1', name: 'Morning Routine', duration: '30min' },
    { id: '2', name: 'Evening Review', duration: '15min' },
  ];

  // Slash command menu items
  const slashMenuItems = [
    { id: 'block', label: 'Add Block', shortcut: 'b' },
    { id: 'event', label: 'Add Event', shortcut: 'e' },
    { id: 'routine', label: 'Add Routine', shortcut: 'r' },
    { id: 'task', label: 'Add Task', shortcut: 't' },
  ];

  // Block types
  const blockTypes = [
    { id: 'deep', label: 'Deep Work', icon: '🧠', color: 'purple' },
    { id: 'shallow', label: 'Shallow Work', icon: '📋', color: 'blue' },
    { id: 'meeting', label: 'Meeting', icon: '👥', color: 'green' },
    { id: 'break', label: 'Break', icon: '☕', color: 'yellow' },
    { id: 'exercise', label: 'Exercise', icon: '💪', color: 'orange' },
    { id: 'personal', label: 'Personal', icon: '🏠', color: 'pink' },
  ];

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && !isTypingCommand) {
      e.preventDefault();
      setShowSlashMenu(true);
      setIsTypingCommand(true);
      setCommandInput('/');
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowBlockTypeMenu(false);
      setShowBlockTimeMenu(false);
      setShowEventSelectionMenu(false);
      setShowRoutineSelectionMenu(false);
      setIsTypingCommand(false);
      setCommandInput('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory 4.0</h1>
          <p className="text-sm text-gray-500 font-mono">Timeline-inspired interface</p>
        </div>

        {/* Timeline View Component */}
        <div className={hasBlocks ? "py-3" : "py-4"}>
          <div className="py-1">
            <div className="relative">
              <div className="flex items-center" onKeyDown={handleKeyDown} tabIndex={0}>
                {isTypingCommand && commandInput ? (
                  <>
                    <span className="text-gray-800 text-sm font-mono">{commandInput}</span>
                    <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
                    {/* Show quick command preview */}
                    {commandInput.startsWith('/') && (
                      <span className="ml-3 text-gray-400 text-xs">
                        → Type command...
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                    <span className="ml-2 text-gray-400 text-xs font-mono">
                      {currentContext === 'task' ? (
                        <>In {currentBlockTitle} • t add task • ESC exit</>
                      ) : currentContext === 'block' ? (
                        <>In {currentBlockTitle} • t add task • Enter select • ESC exit</>
                      ) : (
                        <>/ for menu • d930 deep • w630 workout • e events • m14 meeting</>
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* Slash Command Menu */}
              {showSlashMenu && !showBlockTypeMenu && !showBlockTimeMenu && !showEventSelectionMenu && !showRoutineSelectionMenu && (
                <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[200px]">
                  {slashMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'block') {
                          setShowBlockTypeMenu(true);
                          setShowSlashMenu(false);
                        } else if (item.id === 'event') {
                          setShowEventSelectionMenu(true);
                          setShowSlashMenu(false);
                        } else if (item.id === 'routine') {
                          setShowRoutineSelectionMenu(true);
                          setShowSlashMenu(false);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-mono">{item.label}</span>
                      <span className="text-xs text-gray-400 font-mono">{item.shortcut}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Block Type Menu */}
              {showBlockTypeMenu && !showBlockTimeMenu && (
                <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[240px]">
                  <div className="px-3 py-1 border-b border-gray-100">
                    <p className="text-xs font-mono text-gray-500">Select block type</p>
                  </div>
                  {blockTypes.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => {
                        setSelectedBlockType(block);
                        setShowBlockTypeMenu(false);
                        setShowBlockTimeMenu(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg">{block.icon}</span>
                      <span className="flex-1 text-left text-sm font-mono">{block.label}</span>
                      <span className={`w-2 h-2 rounded-full bg-${block.color}-400`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Block Time Menu */}
              {showBlockTimeMenu && selectedBlockType && (
                <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 min-w-[300px]">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-mono text-gray-500 mb-1">
                        Adding {selectedBlockType.label} block
                      </p>
                      <p className="text-sm font-mono">Start time:</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue="09:00"
                        className="px-3 py-1.5 border border-gray-200 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="HH:MM"
                      />
                      <span className="text-gray-400 text-xs font-mono">Suggested: 09:00</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowBlockTimeMenu(false);
                          setSelectedBlockType(null);
                          setIsTypingCommand(false);
                          setCommandInput('');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm font-mono bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowBlockTimeMenu(false);
                          setSelectedBlockType(null);
                          setIsTypingCommand(false);
                          setCommandInput('');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm font-mono bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                      >
                        Add Block
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Selection Menu */}
              {showEventSelectionMenu && (
                <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[280px]">
                  <div className="px-3 py-1 border-b border-gray-100">
                    <p className="text-xs font-mono text-gray-500">Select an event</p>
                  </div>
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setShowEventSelectionMenu(false);
                        setIsTypingCommand(false);
                        setCommandInput('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-mono">{event.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{event.time}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowEventSelectionMenu(false);
                        setIsTypingCommand(false);
                        setCommandInput('');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-mono text-gray-500 hover:bg-gray-50"
                    >
                      + Create new event
                    </button>
                  </div>
                </div>
              )}

              {/* Routine Selection Menu */}
              {showRoutineSelectionMenu && (
                <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[280px]">
                  <div className="px-3 py-1 border-b border-gray-100">
                    <p className="text-xs font-mono text-gray-500">Select a routine</p>
                  </div>
                  {routines.map((routine) => (
                    <button
                      key={routine.id}
                      onClick={() => {
                        setShowRoutineSelectionMenu(false);
                        setIsTypingCommand(false);
                        setCommandInput('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-mono">{routine.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{routine.duration}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowRoutineSelectionMenu(false);
                        setIsTypingCommand(false);
                        setCommandInput('');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-mono text-gray-500 hover:bg-gray-50"
                    >
                      + Create new routine
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sample content below to show the interface */}
        <div className="mt-8 space-y-4">
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-xs font-mono text-gray-500 uppercase mb-3">Sample Blocks</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xs font-mono text-gray-500">09:00</span>
                <span className="text-lg">🧠</span>
                <span className="text-sm font-mono">Deep Work Session</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 ml-auto" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xs font-mono text-gray-500">11:00</span>
                <span className="text-lg">👥</span>
                <span className="text-sm font-mono">Team Meeting</span>
                <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-xs font-mono text-gray-500">12:00</span>
                <span className="text-lg">☕</span>
                <span className="text-sm font-mono">Lunch Break</span>
                <span className="w-2 h-2 rounded-full bg-yellow-400 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}