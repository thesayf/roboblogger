import { CommandContext } from './types';

export interface ParsedTextCommand {
  type: 'menu' | 'block' | 'task' | 'event' | 'routine' | 'action';
  subtype?: string; // e.g., 'deep' for block-deep
  startTime?: string; // e.g., '13:30'
  endTime?: string; // e.g., '14:00'
  duration?: number; // in minutes
  title?: string; // For blocks/tasks with titles
  raw: string; // Original input
  display?: string; // What to show in UI
  description?: string; // Help text
  executable?: boolean; // Can this be executed?
  action?: () => void; // Action to execute
}

export interface TextCommandPattern {
  pattern: RegExp;
  parse: (match: RegExpMatchArray) => ParsedTextCommand | null;
}

/**
 * Parse text commands based on current context
 * Bloomberg terminal-style: fast, abbreviated commands
 */
export class TextCommandParser {
  private patterns: TextCommandPattern[] = [
    // Just "/" - show menu
    {
      pattern: /^\/$/,
      parse: () => ({
        type: 'menu',
        raw: '/',
        display: 'Show command menu',
        description: 'View available commands',
        executable: true
      })
    },
    
    // Time blocks with natural language
    // "b 2pm" = block at 2pm
    // "b 14:30" = block at 14:30
    // "b 2-3pm" = block from 2pm to 3pm
    // "b 90m" = 90 minute block at next available time
    {
      pattern: /^b(?:lk)?\s+(\d{1,2}):?(\d{2})?\s*([ap]m)?$/i,
      parse: (match) => {
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3]?.toLowerCase();
        
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        return {
          type: 'block',
          startTime: time,
          raw: match[0],
          display: `Add block at ${time}`,
          description: 'Create a deep work block',
          executable: true
        };
      }
    },
    
    // Block with duration: "b 90m", "b 2h"
    {
      pattern: /^b(?:lk)?\s+(\d+)([mh])$/i,
      parse: (match) => {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const duration = unit === 'h' ? value * 60 : value;
        
        return {
          type: 'block',
          duration,
          raw: match[0],
          display: `Add ${duration}min block`,
          description: 'Create block with duration',
          executable: true
        };
      }
    },
    
    // Block with type: "b deep", "b admin", "b break"
    {
      pattern: /^b(?:lk)?\s+(deep|admin|break|meeting)$/i,
      parse: (match) => {
        const subtype = match[1].toLowerCase();
        const typeMap: Record<string, string> = {
          'deep': 'deep-work',
          'admin': 'admin',
          'break': 'break',
          'meeting': 'meeting'
        };
        
        return {
          type: 'block',
          subtype: typeMap[subtype],
          raw: match[0],
          display: `Add ${subtype} block`,
          description: `Create a ${subtype} work block`,
          executable: true
        };
      }
    },
    
    // Complex block: "b deep 2pm 90m"
    {
      pattern: /^b(?:lk)?\s+(deep|admin|break|meeting)\s+(\d{1,2}):?(\d{2})?\s*([ap]m)?\s+(\d+)([mh])?$/i,
      parse: (match) => {
        const subtype = match[1].toLowerCase();
        let hour = parseInt(match[2]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        const meridiem = match[4]?.toLowerCase();
        const durationValue = parseInt(match[5]);
        const durationUnit = match[6]?.toLowerCase() || 'm';
        
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const duration = durationUnit === 'h' ? durationValue * 60 : durationValue;
        
        const typeMap: Record<string, string> = {
          'deep': 'deep-work',
          'admin': 'admin',
          'break': 'break',
          'meeting': 'meeting'
        };
        
        return {
          type: 'block',
          subtype: typeMap[subtype],
          startTime: time,
          duration,
          raw: match[0],
          display: `Add ${subtype} block at ${time} for ${duration}min`,
          description: `Create a ${duration} minute ${subtype} block`,
          executable: true
        };
      }
    },
    
    // Task shortcuts: "t finish report", "t 30m review docs"
    {
      pattern: /^t(?:sk)?\s+(\d+)([mh])\s+(.+)$/i,
      parse: (match) => {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const duration = unit === 'h' ? value * 60 : value;
        const title = match[3];
        
        return {
          type: 'task',
          duration,
          title,
          raw: match[0],
          display: `Add task: ${title} (${duration}min)`,
          description: 'Add task to current block',
          executable: true
        };
      }
    },
    
    // Task without duration
    {
      pattern: /^t(?:sk)?\s+(.+)$/i,
      parse: (match) => {
        const title = match[1];
        
        return {
          type: 'task',
          title,
          duration: 30, // Default 30 minutes
          raw: match[0],
          display: `Add task: ${title}`,
          description: 'Add task to current block (30min)',
          executable: true
        };
      }
    },
    
    // Event: "e team standup 3pm"
    {
      pattern: /^e(?:vt)?\s+(.+?)\s+(\d{1,2}):?(\d{2})?\s*([ap]m)?$/i,
      parse: (match) => {
        const title = match[1];
        let hour = parseInt(match[2]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        const meridiem = match[4]?.toLowerCase();
        
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        return {
          type: 'event',
          title,
          startTime: time,
          raw: match[0],
          display: `Add event: ${title} at ${time}`,
          description: 'Schedule an event',
          executable: true
        };
      }
    },
    
    // Simple commands without parameters
    {
      pattern: /^(blk|block|evt|event|rtn|routine|tsk|task)$/i,
      parse: (match) => {
        const cmd = match[1].toLowerCase();
        const typeMap: Record<string, string> = {
          'blk': 'block',
          'block': 'block',
          'evt': 'event',
          'event': 'event',
          'rtn': 'routine',
          'routine': 'routine',
          'tsk': 'task',
          'task': 'task'
        };
        
        return {
          type: typeMap[cmd] as any,
          raw: match[0],
          display: `Add ${typeMap[cmd]}`,
          description: `Create a new ${typeMap[cmd]}`,
          executable: true
        };
      }
    }
  ];
  
  /**
   * Parse input text into a command
   */
  parse(input: string, context: CommandContext): ParsedTextCommand | null {
    const trimmed = input.trim();
    
    for (const { pattern, parse } of this.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const parsed = parse(match);
        if (parsed) {
          // Filter based on context
          if (context === CommandContext.TASK_LEVEL) {
            // In task context, only allow task-related commands
            if (parsed.type === 'task' || parsed.type === 'menu') {
              return parsed;
            }
          } else if (context === CommandContext.BLOCK_LEVEL || 
                     context === CommandContext.VIEW_SCHEDULE) {
            // In block/schedule context, allow block-level commands
            if (parsed.type !== 'task') {
              return parsed;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get suggestions as user types (for autocomplete/preview)
   */
  getSuggestions(input: string, context: CommandContext): ParsedTextCommand[] {
    const trimmed = input.trim();
    if (!trimmed) return [];
    
    const suggestions: ParsedTextCommand[] = [];
    
    // Check for exact matches first
    const exactMatch = this.parse(input, context);
    if (exactMatch && exactMatch.executable) {
      suggestions.push(exactMatch);
    }
    
    // Add contextual suggestions based on partial input
    const lower = trimmed.toLowerCase();
    
    // Block suggestions
    if (lower.startsWith('b')) {
      if (!exactMatch || exactMatch.type !== 'block') {
        suggestions.push({
          type: 'block',
          raw: input,
          display: 'b 2pm - Add block at 2pm',
          description: 'Example: b 2pm, b 90m, b deep',
          executable: false
        });
      }
    }
    
    // Task suggestions
    if (lower.startsWith('t') && context === CommandContext.TASK_LEVEL) {
      if (!exactMatch || exactMatch.type !== 'task') {
        suggestions.push({
          type: 'task',
          raw: input,
          display: 't finish report - Add task',
          description: 'Example: t 30m review docs',
          executable: false
        });
      }
    }
    
    // Event suggestions
    if (lower.startsWith('e')) {
      if (!exactMatch || exactMatch.type !== 'event') {
        suggestions.push({
          type: 'event',
          raw: input,
          display: 'e team meeting 3pm',
          description: 'Schedule an event',
          executable: false
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Get available command types for current context
   */
  getAvailableCommands(context: CommandContext): string[] {
    if (context === CommandContext.TASK_LEVEL) {
      return ['task']; // Only task commands in task context
    } else if (context === CommandContext.BLOCK_LEVEL || 
               context === CommandContext.VIEW_SCHEDULE) {
      return ['block', 'event', 'routine']; // Block-level commands
    }
    return [];
  }
  
  /**
   * Get help text for available commands
   */
  getCommandHelp(): string[] {
    return [
      'b 2pm - Add block at 2pm',
      'b 90m - Add 90 minute block',
      'b deep - Add deep work block',
      'b deep 2pm 90m - Deep block at 2pm for 90min',
      't finish report - Add task',
      't 30m review docs - Add 30min task',
      'e team meeting 3pm - Add event',
      '/ - Show command menu'
    ];
  }
}