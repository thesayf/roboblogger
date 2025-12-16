// Command Context Hierarchy
export enum CommandContext {
  GLOBAL = 'global',                    // Always active
  VIEW_SCHEDULE = 'view.schedule',      // Schedule view commands
  VIEW_YOU = 'view.you',                // You view commands  
  BLOCK_LEVEL = 'block',                // Block manipulation
  TASK_LEVEL = 'task',                  // Task manipulation
}

// Focus state for tracking what's selected
export interface CommandFocus {
  type: 'view' | 'block' | 'task';
  id?: string;
  index?: number;
  parentIndex?: number;  // For tasks, which block they belong to
}

// Command definition with context support
export interface ContextualCommand {
  id: string;
  key: string | string[];              // Single key or sequence like ['g', 'g']
  contexts: CommandContext[];          // Where this command is available
  handler: (state: CommandState) => void | Promise<void>;
  description: string;
  category?: 'navigation' | 'manipulation' | 'creation' | 'deletion' | 'mode';
  preventDefault?: boolean;             // Whether to prevent default browser behavior
  stopPropagation?: boolean;           // Whether to stop event propagation
}

// State passed to command handlers
export interface CommandState {
  context: CommandContext;
  focus: CommandFocus;
  selectedDate?: Date;
  viewMode?: 'schedule' | 'you';
  blocks?: any[];
  tasks?: any[];
  metadata?: Record<string, any>;
}

// Command execution result
export interface CommandResult {
  success: boolean;
  message?: string;
  newContext?: CommandContext;
  newFocus?: CommandFocus;
  data?: any;
}

// For tracking command history
export interface CommandHistoryEntry {
  command: ContextualCommand;
  state: CommandState;
  timestamp: number;
  result: CommandResult;
}

// For command suggestions/help
export interface CommandSuggestion {
  command: ContextualCommand;
  available: boolean;
  reason?: string;  // Why it's not available
  keybinding: string;
}