interface ParsedTask {
  name: string;
  duration: number;
  order?: number;
}

interface ParsedCommand {
  type: 'block' | 'event' | 'routine' | 'task' | 'batch' | 'template' | 'ai' | 'quick';
  subtype?: string;
  timeStart?: string;
  timeEnd?: string;
  duration?: number;
  tasks?: ParsedTask[];
  attendees?: string[];
  metadata?: Record<string, any>;
  isValid: boolean;
  suggestion?: string;
  preview?: string;
}

interface CommandSuggestion {
  text: string;
  description: string;
  example?: string;
  confidence: number;
}

export class CommandParser {
  // Parse time expressions like "9-10", "930-1030", "9:30-11", "2pm-3pm", "now+1h", "30m", "2h"
  private parseTimeExpression(expr: string): { start?: string; end?: string; duration?: number } {
    // Handle relative times
    if (expr.startsWith('now')) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (expr === 'now') {
        return { start: currentTime };
      }
      
      const match = expr.match(/now\+(\d+)(h|m)/);
      if (match) {
        const amount = parseInt(match[1]);
        const unit = match[2];
        const duration = unit === 'h' ? amount * 60 : amount;
        return { start: currentTime, duration };
      }
    }
    
    // Handle duration only (e.g., "30m", "2h")
    const durationMatch = expr.match(/^(\d+)(h|m)$/);
    if (durationMatch) {
      const amount = parseInt(durationMatch[1]);
      const unit = durationMatch[2];
      const duration = unit === 'h' ? amount * 60 : amount;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return { start: currentTime, duration };
    }
    
    // Handle compact time ranges first (e.g., "930-1030", "1400-1530")
    const compactMatch = expr.match(/^(\d{3,4})-(\d{3,4})$/);
    if (compactMatch) {
      const start = compactMatch[1].padStart(4, '0');
      const end = compactMatch[2].padStart(4, '0');
      
      const startHour = parseInt(start.substring(0, 2));
      const startMin = parseInt(start.substring(2));
      const endHour = parseInt(end.substring(0, 2));
      const endMin = parseInt(end.substring(2));
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      return { start: startTime, end: endTime, duration };
    }
    
    // Handle time ranges (e.g., "9-10", "9:30-11", "2pm-3pm")
    const rangeMatch = expr.match(/(\d{1,2}:?\d{0,2})(am|pm)?[\s-]+(\d{1,2}:?\d{0,2})(am|pm)?/i);
    if (rangeMatch) {
      let startTime = this.normalizeTime(rangeMatch[1], rangeMatch[2]);
      let endTime = this.normalizeTime(rangeMatch[3], rangeMatch[4]);
      
      // Calculate duration
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      return { start: startTime, end: endTime, duration };
    }
    
    // Handle time with duration (e.g., "10:30-45m")
    const timeDurationMatch = expr.match(/(\d{1,2}:?\d{0,2})(am|pm)?-(\d+)m/i);
    if (timeDurationMatch) {
      const startTime = this.normalizeTime(timeDurationMatch[1], timeDurationMatch[2]);
      const duration = parseInt(timeDurationMatch[3]);
      return { start: startTime, duration };
    }
    
    return {};
  }
  
  private normalizeTime(time: string, period?: string): string {
    let hour: number, minute: number = 0;
    
    if (time.includes(':')) {
      [hour, minute] = time.split(':').map(Number);
    } else {
      hour = parseInt(time);
    }
    
    // Handle AM/PM
    if (period) {
      if (period.toLowerCase() === 'pm' && hour < 12) {
        hour += 12;
      } else if (period.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  // Parse task format: "1-taskname-30" or "taskname-30"
  private parseTask(taskStr: string): ParsedTask | null {
    // With order: "1-taskname-30"
    const withOrderMatch = taskStr.match(/^(\d+)-(.+)-(\d+)$/);
    if (withOrderMatch) {
      return {
        order: parseInt(withOrderMatch[1]),
        name: withOrderMatch[2].replace(/-/g, ' '),
        duration: parseInt(withOrderMatch[3])
      };
    }
    
    // Without order: "taskname-30"
    const withoutOrderMatch = taskStr.match(/^(.+)-(\d+)$/);
    if (withoutOrderMatch) {
      return {
        name: withoutOrderMatch[1].replace(/-/g, ' '),
        duration: parseInt(withoutOrderMatch[2])
      };
    }
    
    return null;
  }
  
  // Parse the full command
  public parse(input: string): ParsedCommand {
    const trimmed = input.trim();
    if (!trimmed) {
      return { type: 'block', isValid: false };
    }
    
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    
    // Handle shortcuts and full commands
    switch (command) {
      case 'blk':
      case 'block':
      case 'deep':
      case 'admin':
      case 'break':
      case 'exercise':
      case 'personal':
        return this.parseBlockCommand(parts);
        
      case 'evt':
      case 'event':
      case 'meeting':
      case 'standup':
      case 'call':
      case 'review':
        return this.parseEventCommand(parts);
        
      case 'rtn':
      case 'routine':
        return this.parseRoutineCommand(parts);
        
      case 'tsk':
      case 'task':
        return this.parseTaskCommand(parts);
        
      case 'batch':
        return this.parseBatchCommand(input);
        
      case 'tmpl':
      case 'template':
        return this.parseTemplateCommand(parts);
        
      case '/':
      case 'ai':
        return this.parseAICommand(parts);
        
      case 'now':
      case 'next':
      case 'clear':
      case 'undo':
        return this.parseQuickCommand(parts);
        
      default:
        // If it doesn't match any command pattern, treat it as a simple task
        // Check if it looks like a task with duration (e.g., "review code-30")
        const taskMatch = trimmed.match(/^(.+)-(\d+)$/);
        if (taskMatch) {
          return {
            type: 'task',
            tasks: [{
              name: taskMatch[1].replace(/-/g, ' '),
              duration: parseInt(taskMatch[2])
            }],
            isValid: true,
            preview: `Add task: ${taskMatch[1].replace(/-/g, ' ')} for ${taskMatch[2]} minutes`
          };
        }
        
        // Otherwise treat as a simple task with default 30 min duration
        if (trimmed.length > 0) {
          return {
            type: 'task',
            tasks: [{
              name: trimmed,
              duration: 30
            }],
            isValid: true,
            preview: `Add task: ${trimmed} (30 min default)`
          };
        }
        
        // Try to interpret as a block command as fallback
        return this.parseBlockCommand(['block', ...parts]);
    }
  }
  
  private parseBlockCommand(parts: string[]): ParsedCommand {
    let type: string | undefined;
    let startIndex = 1;
    
    // For now, let's make "blk" alone create a deep work block with default time
    if (parts.length === 1 && (parts[0] === 'blk' || parts[0] === 'block')) {
      const now = new Date();
      const minutes = Math.floor(now.getMinutes() / 30) * 30;
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      return {
        type: 'block',
        subtype: 'deep-work',
        timeStart: currentTime,
        duration: 60,
        isValid: true,
        preview: `Deep work block at ${currentTime} for 60 minutes`
      };
    }
    
    // Determine block type
    const firstPart = parts[0].toLowerCase();
    if (['deep', 'admin', 'break', 'exercise', 'personal'].includes(firstPart)) {
      type = firstPart === 'deep' ? 'deep-work' : firstPart;
      startIndex = 1;
    } else if (parts.length > 1) {
      const secondPart = parts[1].toLowerCase();
      if (['deep', 'admin', 'break', 'exercise', 'personal'].includes(secondPart)) {
        type = secondPart === 'deep' ? 'deep-work' : secondPart;
        startIndex = 2;
      }
    }
    
    // If we have type but no time, needs time input
    if (type && !parts[startIndex]) {
      return {
        type: 'block',
        subtype: type,
        isValid: false,
        metadata: { needsTime: true },
        suggestion: 'Enter time (e.g., 930-1030, 9-11, 2pm-3pm)',
        preview: `${type.replace('-', ' ')} block - enter time...`
      };
    }
    
    // Parse time
    let timeInfo: any = {};
    if (parts[startIndex]) {
      timeInfo = this.parseTimeExpression(parts[startIndex]);
      
      // If we have valid time info, we can create the block
      if (timeInfo.start && (timeInfo.end || timeInfo.duration)) {
        startIndex++;
      } else {
        // Time format is invalid
        return {
          type: 'block',
          subtype: type || 'deep-work',
          isValid: false,
          metadata: { invalidTime: true },
          suggestion: 'Invalid time format. Use: 930-1030, 9-11, or 2pm-3pm',
          preview: 'Invalid time format'
        };
      }
    }
    
    // Parse tasks
    const tasks: ParsedTask[] = [];
    for (let i = startIndex; i < parts.length; i++) {
      const task = this.parseTask(parts[i]);
      if (task) {
        tasks.push(task);
      }
    }
    
    // Generate preview
    let preview = `${(type || 'deep-work').replace('-', ' ')} block`;
    if (timeInfo.start) {
      preview += ` from ${timeInfo.start}`;
      if (timeInfo.end) {
        preview += ` to ${timeInfo.end}`;
      } else if (timeInfo.duration) {
        preview += ` for ${timeInfo.duration} minutes`;
      }
    }
    if (tasks.length > 0) {
      preview += ` with ${tasks.length} task${tasks.length > 1 ? 's' : ''}`;
    }
    
    return {
      type: 'block',
      subtype: type || 'deep-work',
      timeStart: timeInfo.start,
      timeEnd: timeInfo.end,
      duration: timeInfo.duration,
      tasks,
      isValid: !!(timeInfo.start && (timeInfo.end || timeInfo.duration)),
      preview
    };
  }
  
  private parseEventCommand(parts: string[]): ParsedCommand {
    let type = 'meeting';
    let startIndex = 1;
    
    // Determine event type
    const firstPart = parts[0].toLowerCase();
    if (['meeting', 'standup', 'call', 'review'].includes(firstPart)) {
      type = firstPart;
      startIndex = 1;
    } else if (parts.length > 1) {
      const secondPart = parts[1].toLowerCase();
      if (['meeting', 'standup', 'call', 'review'].includes(secondPart)) {
        type = secondPart;
        startIndex = 2;
      }
    }
    
    // Parse time
    let timeInfo: any = {};
    if (parts[startIndex]) {
      timeInfo = this.parseTimeExpression(parts[startIndex]);
      startIndex++;
    }
    
    // Parse attendees (anything starting with @)
    const attendees: string[] = [];
    for (let i = startIndex; i < parts.length; i++) {
      if (parts[i].startsWith('@')) {
        attendees.push(parts[i].substring(1));
      }
    }
    
    // Generate preview
    let preview = `${type}`;
    if (timeInfo.start) {
      preview += ` at ${timeInfo.start}`;
      if (timeInfo.duration) {
        preview += ` for ${timeInfo.duration} minutes`;
      }
    }
    if (attendees.length > 0) {
      preview += ` with ${attendees.join(', ')}`;
    }
    
    return {
      type: 'event',
      subtype: type,
      timeStart: timeInfo.start,
      duration: timeInfo.duration,
      attendees,
      isValid: true,
      preview
    };
  }
  
  private parseRoutineCommand(parts: string[]): ParsedCommand {
    // Routines come from backlog, so we just need the name
    const routineName = parts.slice(1).join(' ');
    
    return {
      type: 'routine',
      subtype: routineName,
      isValid: true,
      preview: routineName ? `Load routine: ${routineName}` : 'Select a routine',
      suggestion: 'Type routine name or select from list'
    };
  }
  
  private parseTaskCommand(parts: string[]): ParsedCommand {
    const taskStr = parts.slice(1).join('-');
    const task = this.parseTask(taskStr);
    
    if (task) {
      return {
        type: 'task',
        tasks: [task],
        isValid: true,
        preview: `Add task: ${task.name} for ${task.duration} minutes`
      };
    }
    
    return {
      type: 'task',
      isValid: false,
      suggestion: 'Format: tsk taskname-duration (e.g., tsk review-30)'
    };
  }
  
  private parseBatchCommand(input: string): ParsedCommand {
    // Split by / to get individual commands
    const commands = input.replace(/^batch\s+/, '').split('/').map(c => c.trim());
    
    return {
      type: 'batch',
      metadata: { commands },
      isValid: commands.length > 0,
      preview: `Execute ${commands.length} commands`
    };
  }
  
  private parseTemplateCommand(parts: string[]): ParsedCommand {
    const templateName = parts.slice(1).join(' ');
    
    return {
      type: 'template',
      subtype: templateName,
      isValid: true,
      preview: templateName ? `Load template: ${templateName}` : 'Select a template'
    };
  }
  
  private parseAICommand(parts: string[]): ParsedCommand {
    const query = parts.slice(1).join(' ');
    
    return {
      type: 'ai',
      metadata: { query },
      isValid: true,
      preview: query ? `AI: ${query}` : 'Open AI assistant'
    };
  }
  
  private parseQuickCommand(parts: string[]): ParsedCommand {
    const action = parts[0].toLowerCase();
    
    return {
      type: 'quick',
      subtype: action,
      isValid: true,
      preview: `Quick action: ${action}`
    };
  }
  
  // Get live suggestions as user types
  public getSuggestions(input: string): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    const lowerInput = input.toLowerCase();
    const parts = input.trim().split(/\s+/);
    
    // Empty input - show common starter commands
    if (!input || input.length < 2) {
      suggestions.push(
        {
          text: 'blk deep 9-11',
          description: 'Create deep work block',
          example: 'Add a deep work block from 9am to 11am',
          confidence: 1.0
        },
        {
          text: 'evt meeting 2pm-1h',
          description: 'Schedule an event',
          example: 'Create a 1-hour meeting at 2pm',
          confidence: 1.0
        },
        {
          text: 'rtn',
          description: 'Load a routine from backlog',
          example: 'Select from your saved routines',
          confidence: 1.0
        }
      );
      return suggestions;
    }
    
    // Block suggestions
    if (lowerInput === 'blk' || lowerInput === 'block') {
      // Just "blk" - suggest block types
      suggestions.push(
        {
          text: 'blk deep',
          description: 'Deep focused work',
          example: 'Press Enter to select type or continue typing',
          confidence: 1.0
        },
        {
          text: 'blk admin',
          description: 'Administrative tasks',
          example: 'Email, planning, organizing',
          confidence: 0.95
        },
        {
          text: 'blk break',
          description: 'Take a break',
          example: 'Rest and recharge',
          confidence: 0.9
        }
      );
    } else if (lowerInput.startsWith('blk ') || lowerInput.startsWith('block ')) {
      const hasType = ['deep', 'admin', 'break', 'exercise', 'personal'].some(t => 
        lowerInput.includes(t)
      );
      
      if (hasType && parts.length === 2) {
        // Has type but no time - suggest time formats
        suggestions.push(
          {
            text: `${input} 930-1030`,
            description: 'Compact time format',
            example: 'From 9:30am to 10:30am',
            confidence: 1.0
          },
          {
            text: `${input} 14-16`,
            description: 'Simple hour range',
            example: 'From 2pm to 4pm',
            confidence: 0.95
          },
          {
            text: `${input} 9:30-11`,
            description: 'Mixed format',
            example: 'From 9:30am to 11:00am',
            confidence: 0.9
          }
        );
      } else if (hasType && parts.length >= 3) {
        // Has type and time - suggest tasks
        suggestions.push({
          text: `${input} 1-read-30 2-write-60`,
          description: 'Add numbered tasks',
          example: 'Format: order-taskname-duration',
          confidence: 0.9
        });
      }
    }
    
    // Event suggestions
    if (lowerInput.startsWith('ev') || lowerInput.startsWith('meet') || lowerInput.startsWith('call')) {
      if (parts.length === 1 || (parts.length === 2 && !['meeting', 'standup', 'call', 'review'].includes(parts[1]))) {
        suggestions.push({
          text: `${input} meeting 2-3`,
          description: 'Meeting type and time',
          example: 'Creates a meeting from 2pm to 3pm',
          confidence: 0.95
        });
      }
      
      if (parts.length >= 2) {
        suggestions.push({
          text: `${input} @john @sarah`,
          description: 'Add attendees',
          example: 'Use @ to mention attendees',
          confidence: 0.85
        });
      }
    }
    
    // Time format suggestions when number detected
    if (input.match(/\d/) && !input.match(/\d{1,2}[-:]\d/)) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.match(/^\d{1,2}$/)) {
        suggestions.push(
          {
            text: `${input}-${parseInt(lastPart) + 1}`,
            description: 'Complete time range',
            example: `Block from ${lastPart}:00 to ${parseInt(lastPart) + 1}:00`,
            confidence: 0.9
          },
          {
            text: `${input}:30-${parseInt(lastPart) + 1}:30`,
            description: 'Half-hour precision',
            example: 'Add minutes for precise timing',
            confidence: 0.85
          }
        );
      }
    }
    
    // Task format help
    if (input.includes('-') && !input.match(/\d{1,2}-\d{1,2}/)) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.match(/^\d-\w+$/)) {
        suggestions.push({
          text: `${input}-30`,
          description: 'Add task duration',
          example: 'Complete with duration in minutes',
          confidence: 0.95
        });
      }
    }
    
    // Routine suggestions
    if (lowerInput.startsWith('rtn') || lowerInput.startsWith('routine')) {
      suggestions.push(
        {
          text: 'rtn',
          description: 'Select from your saved routines',
          example: 'Opens routine selector from backlog',
          confidence: 1.0
        },
        {
          text: 'rtn morning',
          description: 'Filter routines by name',
          example: 'Search for "morning" in routine names',
          confidence: 0.9
        }
      );
    }
    
    // Quick commands
    if (lowerInput === 'now' || lowerInput.startsWith('now')) {
      suggestions.push(
        {
          text: 'now+1h',
          description: 'Block starting now for 1 hour',
          example: 'Creates block at current time',
          confidence: 0.95
        },
        {
          text: 'now+30m',
          description: 'Quick 30-minute block',
          example: 'Short focus session',
          confidence: 0.9
        }
      );
    }
    
    // AI/Chat
    if (lowerInput === '/' || lowerInput.startsWith('ai')) {
      suggestions.push({
        text: '/ plan my afternoon',
        description: 'AI schedule assistant',
        example: 'Generate schedule with AI',
        confidence: 0.95
      });
    }
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }
}

export const commandParser = new CommandParser();