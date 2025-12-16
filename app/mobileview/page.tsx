"use client";

import React, { useState } from 'react';
import { Check, Circle, Plus, Menu, Calendar, User, Edit2, Trash2, GripVertical, StickyNote } from 'lucide-react';

export default function MobileViewMockup() {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [showActionBar, setShowActionBar] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState<'none' | 'edit-block' | 'edit-task' | 'add-note' | 'add-block'>('none');
  const [currentDay, setCurrentDay] = useState<'today' | 'tomorrow'>('today');

  const mockBlocks = [
    {
      id: '1',
      time: '06:00',
      title: 'Morning routine',
      type: 'routine',
      duration: 90,
      completed: false,
      tasks: [
        { id: 't1', title: 'Omega-3 2-2 soft gels', completed: true, duration: 5 },
        { id: 't2', title: 'Vitamin D 1 tab', completed: true, duration: 5 },
        { id: 't3', title: 'Breakfast', completed: false, duration: 30 },
      ]
    },
    {
      id: '2',
      time: '09:00',
      title: 'Deep Work',
      type: 'deep-work',
      duration: 30,
      completed: false,
      note: 'Started homepage design, blocked on API - moving to afternoon',
      tasks: [
        { id: 't4', title: 'Send arcads video to agency', completed: false, duration: 30 },
      ]
    },
    {
      id: '3',
      time: '13:45',
      title: 'Deep Work',
      type: 'deep-work',
      duration: 0,
      completed: false,
      tasks: []
    },
  ];

  const handleBlockTap = (index: number) => {
    if (selectedBlock === index) {
      setShowActionBar(true);
    } else {
      setSelectedBlock(index);
      setSelectedTask(null);
      setShowActionBar(true);
    }
  };

  const handleTaskTap = (blockIndex: number, taskIndex: number) => {
    setSelectedBlock(blockIndex);
    setSelectedTask(taskIndex);
    setShowActionBar(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-[430px] mx-auto border-x border-gray-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold">Daybook</h1>
          </div>

          {/* Day Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentDay('today')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentDay === 'today'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDay('tomorrow')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentDay === 'tomorrow'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Tomorrow
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Wed, Oct 1 • 07:46 PM
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 space-y-4">
          {mockBlocks.map((block, blockIndex) => (
            <div
              key={block.id}
              onClick={() => handleBlockTap(blockIndex)}
              className={`rounded-lg border transition-all ${
                selectedBlock === blockIndex && selectedTask === null
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Block Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-mono">{block.time}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-sm font-medium ${block.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {block.title}
                      </span>
                    </div>
                    {block.note && (
                      <div className={`text-xs italic mt-2 ${block.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {block.note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {block.duration > 0 && (
                      <span className={`text-xs tabular-nums ${block.completed ? 'line-through text-gray-400' : 'text-gray-400'}`}>
                        {block.duration}m
                      </span>
                    )}
                    <button
                      className="p-1 touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockTap(blockIndex);
                      }}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                {block.tasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {block.tasks.map((task, taskIndex) => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskTap(blockIndex, taskIndex);
                        }}
                        className={`flex items-center gap-3 p-2 -mx-2 rounded transition-colors touch-manipulation ${
                          selectedBlock === blockIndex && selectedTask === taskIndex
                            ? 'bg-blue-100'
                            : 'active:bg-gray-50'
                        }`}
                      >
                        <button
                          className="flex-shrink-0 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle task
                          }}
                        >
                          {task.completed ? (
                            <Check className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300" />
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${
                          task.completed || block.completed
                            ? 'line-through text-gray-400'
                            : 'text-gray-700'
                        }`}>
                          {task.title}
                        </span>
                        <span className={`text-xs tabular-nums ${
                          task.completed || block.completed ? 'text-gray-400' : 'text-gray-400'
                        }`}>
                          {task.duration}m
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Task Button */}
                {selectedBlock === blockIndex && selectedTask === null && (
                  <button className="mt-3 w-full py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded hover:border-gray-400 hover:text-gray-600 transition-colors touch-manipulation">
                    + Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar (when something is selected) */}
      {showActionBar && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-[430px] px-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
            <div className="grid grid-cols-4 gap-2">
              {selectedTask !== null ? (
                <>
                  <button
                    onClick={() => setShowBottomSheet('edit-task')}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Edit</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation">
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Complete</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation">
                    <GripVertical className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Move</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-red-50 touch-manipulation">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-xs text-red-600">Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowBottomSheet('edit-block')}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Edit</span>
                  </button>
                  <button
                    onClick={() => setShowBottomSheet('add-note')}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
                  >
                    <StickyNote className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Note</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 touch-manipulation">
                    <Check className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">Complete</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 active:bg-red-50 touch-manipulation">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <span className="text-xs text-red-600">Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      {showBottomSheet !== 'none' && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowBottomSheet('none')}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-[430px] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {showBottomSheet === 'edit-block' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Edit Block</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        defaultValue="09:00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base">
                        <option>Deep Work</option>
                        <option>Meeting</option>
                        <option>Break</option>
                        <option>Admin</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setShowBottomSheet('none')}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium touch-manipulation"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}

              {showBottomSheet === 'edit-task' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Edit Task</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                      <input
                        type="text"
                        defaultValue="Send arcads video to agency"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                      />
                    </div>
                    <button
                      onClick={() => setShowBottomSheet('none')}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium touch-manipulation"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}

              {showBottomSheet === 'add-note' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Add Note</h3>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      placeholder="e.g., Started task, blocked on X, moving to Y"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base resize-none"
                    />
                    <button
                      onClick={() => setShowBottomSheet('none')}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium touch-manipulation"
                    >
                      Save Note
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      <button
        onClick={() => setShowBottomSheet('add-block')}
        className="fixed bottom-24 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation hover:bg-blue-700 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] bg-white border-t border-gray-200 px-6 py-3 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 p-2 text-blue-600 touch-manipulation">
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-gray-400 touch-manipulation">
            <User className="w-6 h-6" />
            <span className="text-xs">You</span>
          </button>
        </div>
      </div>

    </div>
  );
}
