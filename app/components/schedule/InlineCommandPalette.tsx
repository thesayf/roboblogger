import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Layers, 
  Calendar, 
  RefreshCw, 
  Clock, 
  MessageSquare,
  Coffee,
  FileText,
  Dumbbell,
  User,
  Brain
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  action: string;
  category: 'block' | 'event' | 'routine' | 'quick' | 'ai';
  shortcuts?: string[];
  customData?: any;
}

interface InlineCommandPaletteProps {
  searchQuery: string;
  onSelectCommand: (command: Command) => void;
  onCancel: () => void;
  position?: { x: number; y: number };
}

export default function InlineCommandPalette({ 
  searchQuery, 
  onSelectCommand, 
  onCancel,
  position 
}: InlineCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Parse time from query like "block 9 to 10" or "block 9-10"
  const parseTimeFromQuery = (query: string) => {
    const timePattern = /(\d{1,2})\s*(to|-)\s*(\d{1,2})/i;
    const match = query.match(timePattern);
    if (match) {
      const startHour = parseInt(match[1]);
      const endHour = parseInt(match[3]);
      const duration = (endHour - startHour) * 60;
      return {
        time: `${startHour.toString().padStart(2, '0')}:00`,
        duration,
        endTime: `${endHour.toString().padStart(2, '0')}:00`
      };
    }
    return null;
  };

  // All available commands
  const allCommands: Command[] = [
    // Block commands
    {
      id: 'block-deepwork',
      title: 'Deep Work Block',
      description: 'Add a focused work session',
      icon: Brain,
      action: 'block:deep-work',
      category: 'block',
      shortcuts: ['block', 'deep', 'focus']
    },
    {
      id: 'block-admin',
      title: 'Admin Block',
      description: 'Administrative tasks',
      icon: FileText,
      action: 'block:admin',
      category: 'block',
      shortcuts: ['block', 'admin']
    },
    {
      id: 'block-break',
      title: 'Break',
      description: 'Take a short break',
      icon: Coffee,
      action: 'block:break',
      category: 'block',
      shortcuts: ['break', 'coffee']
    },
    {
      id: 'block-personal',
      title: 'Personal Block',
      description: 'Personal time',
      icon: User,
      action: 'block:personal',
      category: 'block',
      shortcuts: ['block', 'personal']
    },
    {
      id: 'block-exercise',
      title: 'Exercise',
      description: 'Physical activity',
      icon: Dumbbell,
      action: 'block:exercise',
      category: 'block',
      shortcuts: ['exercise', 'workout', 'gym']
    },
    
    // Event commands
    {
      id: 'event-meeting',
      title: 'Meeting',
      description: 'Schedule a meeting',
      icon: Calendar,
      action: 'event:meeting',
      category: 'event',
      shortcuts: ['event', 'meeting', 'call']
    },
    {
      id: 'event-standup',
      title: 'Standup',
      description: 'Daily standup',
      icon: Calendar,
      action: 'event:standup',
      category: 'event',
      shortcuts: ['standup', 'daily']
    },
    
    // Routine commands
    {
      id: 'routine-morning',
      title: 'Morning Routine',
      description: 'Start your day',
      icon: RefreshCw,
      action: 'routine:morning',
      category: 'routine',
      shortcuts: ['routine', 'morning']
    },
    {
      id: 'routine-evening',
      title: 'Evening Routine',
      description: 'Wind down',
      icon: RefreshCw,
      action: 'routine:evening',
      category: 'routine',
      shortcuts: ['routine', 'evening']
    },
    
    // Quick commands
    {
      id: 'quick-now',
      title: 'Block starting now',
      description: 'Create a block at current time',
      icon: Clock,
      action: 'quick:now',
      category: 'quick',
      shortcuts: ['now']
    },
    
    // AI command
    {
      id: 'ai-chat',
      title: 'AI Schedule Assistant',
      description: 'Generate schedule with AI',
      icon: MessageSquare,
      action: 'ai:chat',
      category: 'ai',
      shortcuts: ['/', 'ai', 'chat', 'gpt']
    }
  ];

  // Check for time-based input
  const timeData = parseTimeFromQuery(searchQuery);
  
  // Filter commands based on search
  const filteredCommands = searchQuery.length > 0
    ? allCommands.filter(cmd => {
        const query = searchQuery.toLowerCase();
        
        // Check if any shortcut matches
        const shortcutMatch = cmd.shortcuts?.some(s => s.startsWith(query));
        
        // Check title match
        const titleMatch = cmd.title.toLowerCase().includes(query);
        
        // Check description match
        const descMatch = cmd.description?.toLowerCase().includes(query);
        
        return shortcutMatch || titleMatch || descMatch;
      })
    : allCommands.slice(0, 8); // Show top 8 when no query

  // Add time-based command if detected
  if (timeData && searchQuery.includes('block')) {
    filteredCommands.unshift({
      id: 'custom-time-block',
      title: `Block from ${timeData.time} to ${timeData.endTime}`,
      description: `${timeData.duration} minutes`,
      icon: Clock,
      action: 'block:custom',
      category: 'quick',
      customData: timeData
    });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelectCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onSelectCommand, onCancel]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (filteredCommands.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 font-mono text-xs text-gray-400">
        No matching commands
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg font-mono text-sm w-80 max-h-64 overflow-hidden">
      <div className="text-[10px] text-gray-400 px-3 py-1 border-b border-gray-100">
        {searchQuery ? 'Filtered results' : 'Commands'}
      </div>
      <div className="overflow-y-auto">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon;
          const isSelected = index === selectedIndex;
          
          return (
            <div
              key={command.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer",
                isSelected ? "bg-blue-50" : "hover:bg-gray-50"
              )}
              onClick={() => onSelectCommand(command)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0",
                command.category === 'block' && "text-purple-400",
                command.category === 'event' && "text-blue-400",
                command.category === 'routine' && "text-green-400",
                command.category === 'quick' && "text-orange-400",
                command.category === 'ai' && "text-pink-400"
              )} />
              <div className="flex-1">
                <div className="font-medium">{command.title}</div>
                {command.description && (
                  <div className="text-xs text-gray-500">{command.description}</div>
                )}
              </div>
              {command.shortcuts && command.shortcuts[0] && (
                <div className="text-xs text-gray-400">
                  {command.shortcuts[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 px-3 py-1 text-[10px] text-gray-400">
        ↑↓ Navigate • Enter Select • Esc Cancel
      </div>
    </div>
  );
}