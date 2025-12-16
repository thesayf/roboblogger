"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Target, Folder, CheckSquare, RefreshCw, Calendar, Plus, Circle } from 'lucide-react';

interface InventoryItem {
  id: string;
  type: 'goal' | 'project' | 'task' | 'routine' | 'event';
  content: string;
  metadata?: any;
  children?: InventoryItem[];
  goalId?: string;
  completed?: boolean;
}

export default function InventoryTestPage() {
  const { userId } = useAuth();
  
  // Navigation state
  const [mode, setMode] = useState<'NORMAL' | 'INSERT' | 'COMMAND'>('NORMAL');
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all', 'unassigned', or goal id
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Command state
  const [commandBuffer, setCommandBuffer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // Edit state
  const [editBuffer, setEditBuffer] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock data
  const [goals, setGoals] = useState([
    { 
      id: 'g1', 
      type: 'goal' as const, 
      content: 'Ship product by Q2',
      metadata: { 
        deadline: '2024-06-30',
        progress: 35,
      }
    },
    { 
      id: 'g2', 
      type: 'goal' as const, 
      content: 'Learn Rust',
      metadata: { 
        deadline: '2024-12-31',
        progress: 10,
      }
    },
    { 
      id: 'g3', 
      type: 'goal' as const, 
      content: 'Improve fitness',
      metadata: { 
        deadline: '2024-12-31',
        progress: 45,
      }
    },
  ]);
  
  const [items, setItems] = useState({
    projects: [
      { 
        id: 'p1', 
        type: 'project' as const, 
        content: 'Website Redesign',
        goalId: 'g1',
        children: [
          { id: 'p1a', type: 'task' as const, content: 'Design mockups', metadata: { duration: '2h' }, completed: true },
          { id: 'p1b', type: 'task' as const, content: 'Implement homepage', metadata: { duration: '4h' }, completed: false },
          { id: 'p1c', type: 'task' as const, content: 'Test responsive layout', metadata: { duration: '1h' }, completed: false },
        ]
      },
      { 
        id: 'p2', 
        type: 'project' as const, 
        content: 'API Development',
        goalId: 'g1',
        children: [
          { id: 'p2a', type: 'task' as const, content: 'Setup authentication', metadata: { duration: '3h' }, completed: false },
          { id: 'p2b', type: 'task' as const, content: 'Create endpoints', metadata: { duration: '6h' }, completed: false },
        ]
      },
      { 
        id: 'p3', 
        type: 'project' as const, 
        content: 'Rust Tutorial Series',
        goalId: 'g2',
        children: [
          { id: 'p3a', type: 'task' as const, content: 'Complete chapter 1', metadata: { duration: '2h' }, completed: false },
        ]
      },
      { 
        id: 'p4', 
        type: 'project' as const, 
        content: 'Blog Redesign',
        goalId: null,
        children: [
          { id: 'p4a', type: 'task' as const, content: 'Choose theme', metadata: { duration: '1h' }, completed: false },
        ]
      },
    ],
    routines: [
      { 
        id: 'r1', 
        type: 'routine' as const, 
        content: 'Morning Workout',
        goalId: 'g3',
        metadata: { time: '06:30', days: ['Mon', 'Wed', 'Fri'] },
      },
      { 
        id: 'r2', 
        type: 'routine' as const, 
        content: 'Code Review',
        goalId: 'g1',
        metadata: { time: '14:00', days: ['Tue', 'Thu'] },
      },
      { 
        id: 'r3', 
        type: 'routine' as const, 
        content: 'Weekly Planning',
        goalId: null,
        metadata: { time: '09:00', days: ['Mon'] },
      },
    ],
    events: [
      { id: 'e1', type: 'event' as const, content: 'Product Demo', goalId: 'g1', metadata: { date: '2024-03-22', time: '14:00' } },
      { id: 'e2', type: 'event' as const, content: 'Fitness Check-in', goalId: 'g3', metadata: { date: '2024-03-25', time: '09:00' } },
      { id: 'e3', type: 'event' as const, content: 'Team Standup', goalId: null, metadata: { date: '2024-03-21', time: '10:00' } },
    ],
    tasks: [
      { id: 't1', type: 'task' as const, content: 'Review PRs', goalId: null, metadata: { duration: '1h' }, completed: false },
      { id: 't2', type: 'task' as const, content: 'Update documentation', goalId: 'g1', metadata: { duration: '2h' }, completed: false },
      { id: 't3', type: 'task' as const, content: 'Email responses', goalId: null, metadata: { duration: '30m' }, completed: false },
    ],
  });
  
  // Get items for current view
  const getCurrentItems = useCallback(() => {
    if (activeTab === 'all') {
      return [
        ...items.projects,
        ...items.routines,
        ...items.events,
        ...items.tasks,
      ];
    } else if (activeTab === 'unassigned') {
      return [
        ...items.projects.filter(p => !p.goalId),
        ...items.routines.filter(r => !r.goalId),
        ...items.events.filter(e => !e.goalId),
        ...items.tasks.filter(t => !t.goalId),
      ];
    } else {
      // Specific goal
      return [
        ...items.projects.filter(p => p.goalId === activeTab),
        ...items.routines.filter(r => r.goalId === activeTab),
        ...items.events.filter(e => e.goalId === activeTab),
        ...items.tasks.filter(t => t.goalId === activeTab),
      ];
    }
  }, [items, activeTab]);
  
  // Get tab list
  const getTabs = useCallback(() => {
    return [
      { id: 'all', label: 'All Items', count: getCurrentItems().length },
      ...goals.map(g => ({ 
        id: g.id, 
        label: g.content, 
        count: [
          ...items.projects.filter(p => p.goalId === g.id),
          ...items.routines.filter(r => r.goalId === g.id),
          ...items.events.filter(e => e.goalId === g.id),
          ...items.tasks.filter(t => t.goalId === g.id),
        ].length,
        progress: g.metadata.progress
      })),
      { 
        id: 'unassigned', 
        label: 'Unassigned', 
        count: [
          ...items.projects.filter(p => !p.goalId),
          ...items.routines.filter(r => !r.goalId),
          ...items.events.filter(e => !e.goalId),
          ...items.tasks.filter(t => !t.goalId),
        ].length 
      },
    ];
  }, [goals, items, getCurrentItems]);
  
  // Get selected item
  const getSelectedItem = useCallback(() => {
    const currentItems = getCurrentItems();
    if (selectedChildIndex !== null) {
      const parent = currentItems[selectedItemIndex];
      return parent?.children?.[selectedChildIndex];
    }
    return currentItems[selectedItemIndex];
  }, [getCurrentItems, selectedItemIndex, selectedChildIndex]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for our keys
      if (['j', 'k', 'h', 'l', 'i', 'a', 'x', 'd', '/', ':', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
        if (mode !== 'INSERT' || e.key === 'Escape') {
          e.preventDefault();
        }
      }
      
      if (mode === 'NORMAL') {
        switch(e.key) {
          // Navigation
          case 'j': // Down
            const items = getCurrentItems();
            if (selectedChildIndex !== null) {
              const parent = items[selectedItemIndex];
              if (parent?.children && selectedChildIndex < parent.children.length - 1) {
                setSelectedChildIndex(selectedChildIndex + 1);
              } else {
                setSelectedChildIndex(null);
                if (selectedItemIndex < items.length - 1) {
                  setSelectedItemIndex(selectedItemIndex + 1);
                }
              }
            } else if (selectedItemIndex < items.length - 1) {
              setSelectedItemIndex(selectedItemIndex + 1);
            }
            break;
            
          case 'k': // Up
            if (selectedChildIndex !== null) {
              if (selectedChildIndex > 0) {
                setSelectedChildIndex(selectedChildIndex - 1);
              } else {
                setSelectedChildIndex(null);
              }
            } else if (selectedItemIndex > 0) {
              const prevItem = getCurrentItems()[selectedItemIndex - 1];
              if (prevItem?.children && expandedItems.has(prevItem.id)) {
                setSelectedItemIndex(selectedItemIndex - 1);
                setSelectedChildIndex(prevItem.children.length - 1);
              } else {
                setSelectedItemIndex(selectedItemIndex - 1);
              }
            }
            break;
            
          case 'Tab': // Next tab
            const tabs = getTabs();
            const currentIndex = tabs.findIndex(t => t.id === activeTab);
            const nextIndex = e.shiftKey 
              ? (currentIndex - 1 + tabs.length) % tabs.length
              : (currentIndex + 1) % tabs.length;
            setActiveTab(tabs[nextIndex].id);
            setSelectedItemIndex(0);
            setSelectedChildIndex(null);
            break;
            
          case 'h': // Previous tab (alternative)
            const tabsH = getTabs();
            const currentH = tabsH.findIndex(t => t.id === activeTab);
            if (currentH > 0) {
              setActiveTab(tabsH[currentH - 1].id);
              setSelectedItemIndex(0);
              setSelectedChildIndex(null);
            }
            break;
            
          case 'l': // Next tab (alternative)
            const tabsL = getTabs();
            const currentL = tabsL.findIndex(t => t.id === activeTab);
            if (currentL < tabsL.length - 1) {
              setActiveTab(tabsL[currentL + 1].id);
              setSelectedItemIndex(0);
              setSelectedChildIndex(null);
            }
            break;
            
          case 'Enter': // Expand/collapse
          case ' ':
            const enterItems = getCurrentItems();
            const enterItem = enterItems[selectedItemIndex];
            if (enterItem?.children) {
              setExpandedItems(prev => {
                const next = new Set(prev);
                if (next.has(enterItem.id)) {
                  next.delete(enterItem.id);
                  if (selectedChildIndex !== null) {
                    setSelectedChildIndex(null);
                  }
                } else {
                  next.add(enterItem.id);
                }
                return next;
              });
            }
            break;
            
          case 'x': // Toggle completion
            const toggleItem = getSelectedItem();
            if (toggleItem) {
              // Toggle completion logic
              setStatusMessage(`Toggled: ${toggleItem.content}`);
              setTimeout(() => setStatusMessage(''), 2000);
            }
            break;
            
          case 'i': // Edit mode
            const editItem = getSelectedItem();
            if (editItem) {
              setEditBuffer(editItem.content);
              setIsEditing(true);
              setMode('INSERT');
            }
            break;
            
          case 'a': // Add new
            setMode('COMMAND');
            if (activeTab !== 'all' && activeTab !== 'unassigned') {
              setCommandBuffer(`add to ${activeTab} `);
              setStatusMessage('Add: [p]roject [r]outine [e]vent [t]ask');
            } else {
              setCommandBuffer('add ');
              setStatusMessage('Add: [g]oal [p]roject [r]outine [e]vent [t]ask');
            }
            break;
            
          case 'd': // Delete
            setMode('COMMAND');
            setCommandBuffer('delete');
            setStatusMessage('Delete? (y/n)');
            break;
            
          case '/': // Search
            setMode('COMMAND');
            setCommandBuffer('/');
            setStatusMessage('/');
            break;
            
          case ':': // Command mode
            setMode('COMMAND');
            setCommandBuffer('');
            setStatusMessage(':');
            break;
            
          // Quick number jumps to tabs
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            const tabIndex = parseInt(e.key) - 1;
            const tabList = getTabs();
            if (tabIndex < tabList.length) {
              setActiveTab(tabList[tabIndex].id);
              setSelectedItemIndex(0);
              setSelectedChildIndex(null);
            }
            break;
        }
      } else if (mode === 'INSERT') {
        if (e.key === 'Escape') {
          setMode('NORMAL');
          setIsEditing(false);
          setEditBuffer('');
          setStatusMessage('');
        }
      } else if (mode === 'COMMAND') {
        if (e.key === 'Escape') {
          setMode('NORMAL');
          setCommandBuffer('');
          setStatusMessage('');
        } else if (e.key === 'Enter') {
          executeCommand(commandBuffer);
          setMode('NORMAL');
          setCommandBuffer('');
          setStatusMessage('');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, activeTab, selectedItemIndex, selectedChildIndex, expandedItems, commandBuffer, editBuffer, getCurrentItems, getTabs, getSelectedItem]);
  
  const executeCommand = (cmd: string) => {
    if (cmd.startsWith('add ')) {
      const content = cmd.substring(4);
      setStatusMessage(`Added: ${content}`);
    } else if (cmd === 'delete') {
      setStatusMessage('Deleted item');
    }
    setTimeout(() => setStatusMessage(''), 2000);
  };
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'goal': return <Target className="h-3 w-3" />;
      case 'project': return <Folder className="h-3 w-3" />;
      case 'task': return <CheckSquare className="h-3 w-3" />;
      case 'routine': return <RefreshCw className="h-3 w-3" />;
      case 'event': return <Calendar className="h-3 w-3" />;
      default: return null;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'goal': return 'text-yellow-500';
      case 'project': return 'text-blue-500';
      case 'task': return 'text-green-500';
      case 'routine': return 'text-purple-500';
      case 'event': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };
  
  const renderItem = (item: any, index: number, isChild = false, parentIndex?: number) => {
    const isSelected = isChild 
      ? (parentIndex === selectedItemIndex && selectedChildIndex === index)
      : (selectedItemIndex === index && selectedChildIndex === null);
    
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <div key={item.id}>
        <div className={`flex items-center gap-2 px-3 py-1.5 ${
          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}>
          {/* Completion checkbox for tasks */}
          {(item.type === 'task' || (item.children && item.type === 'project')) && (
            <button className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
              {item.completed && <div className="w-2 h-2 bg-blue-500 rounded-sm" />}
            </button>
          )}
          
          {/* Type icon */}
          <span className={getTypeColor(item.type)}>
            {getTypeIcon(item.type)}
          </span>
          
          {/* Content */}
          {isEditing && isSelected ? (
            <input
              type="text"
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              className="flex-1 px-1 py-0.5 bg-white border border-blue-500 rounded outline-none text-sm"
              autoFocus
            />
          ) : (
            <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-400' : ''}`}>
              {item.content}
            </span>
          )}
          
          {/* Metadata */}
          <span className="text-xs text-gray-400">
            {item.metadata?.duration && `${item.metadata.duration}`}
            {item.metadata?.time && `${item.metadata.time}`}
            {item.metadata?.days && `${item.metadata.days.join(',')}`}
            {item.metadata?.date && `${item.metadata.date}`}
            {item.children && `(${item.children.length})`}
          </span>
        </div>
        
        {/* Children */}
        {item.children && isExpanded && (
          <div className="ml-8">
            {item.children.map((child: any, idx: number) => renderItem(child, idx, true, index))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-white text-gray-700 font-mono flex">
      {/* Left sidebar tabs */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="text-sm font-semibold text-gray-600">Inventory</div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 py-2">
          {getTabs().map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isGoal = !['all', 'unassigned'].includes(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedItemIndex(0);
                  setSelectedChildIndex(null);
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                  isActive 
                    ? 'bg-white border-r-2 border-blue-500 text-gray-900' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {/* Tab number */}
                <span className="text-[10px] text-gray-400 w-3">{index + 1}</span>
                
                {/* Icon */}
                {tab.id === 'all' && <Circle className="h-3 w-3 text-gray-400" />}
                {tab.id === 'unassigned' && <Plus className="h-3 w-3 text-gray-400" />}
                {isGoal && <Target className="h-3 w-3 text-yellow-500" />}
                
                {/* Label */}
                <span className="flex-1 text-sm truncate">{tab.label}</span>
                
                {/* Count/Progress */}
                {tab.progress !== undefined ? (
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${tab.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{tab.count}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Tab shortcuts hint */}
        <div className="px-4 py-2 border-t text-xs text-gray-400">
          Tab/h/l navigate • 1-9 jump
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Content header */}
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-600">
              {activeTab === 'all' ? 'All Items' : 
               activeTab === 'unassigned' ? 'Unassigned Items' :
               goals.find(g => g.id === activeTab)?.content || 'Items'}
            </h2>
            {activeTab !== 'all' && activeTab !== 'unassigned' && (
              <span className="text-xs text-gray-400">
                Goal deadline: {goals.find(g => g.id === activeTab)?.metadata.deadline}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {getCurrentItems().length} items
          </span>
        </div>
        
        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {getCurrentItems().length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No items. Press 'a' to add.
            </div>
          ) : (
            getCurrentItems().map((item, index) => renderItem(item, index))
          )}
        </div>
        
        {/* Command line */}
        <div className="border-t bg-white">
          <div className="flex items-center px-4 py-2">
            {mode === 'COMMAND' ? (
              <div className="flex items-center w-full">
                <span className="text-gray-800 text-sm font-mono">{commandBuffer}</span>
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
              </div>
            ) : mode === 'INSERT' ? (
              <div className="flex items-center w-full text-sm font-mono text-gray-600">
                <span className="mr-2">-- INSERT --</span>
                <span className="text-gray-400">ESC to exit</span>
              </div>
            ) : (
              <div className="flex items-center w-full">
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                <span className="ml-2 text-gray-400 text-xs font-mono">
                  j/k navigate • Enter expand • x toggle • i edit • a add • d delete • / search
                </span>
                {statusMessage && (
                  <span className="ml-4 text-gray-600 text-xs">{statusMessage}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}