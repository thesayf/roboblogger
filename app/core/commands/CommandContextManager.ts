import { CommandContext, CommandFocus, CommandState } from './types';

/**
 * Manages the hierarchical command context state
 * Tracks which level of the app the user is currently interacting with
 */
export class CommandContextManager {
  private contextStack: CommandContext[] = [CommandContext.GLOBAL];
  private currentFocus: CommandFocus = { type: 'view' };
  private viewMode: 'schedule' | 'you' = 'schedule';
  private selectedDate: Date = new Date();
  private metadata: Record<string, any> = {};
  
  // Optional callback for when context changes
  private onContextChange?: (context: CommandContext, focus: CommandFocus) => void;

  constructor(initialViewMode: 'schedule' | 'you' = 'schedule') {
    this.viewMode = initialViewMode;
    // Set initial view context based on mode
    this.contextStack.push(
      initialViewMode === 'schedule' 
        ? CommandContext.VIEW_SCHEDULE 
        : CommandContext.VIEW_YOU
    );
  }

  /**
   * Get the current active context (top of stack)
   */
  getCurrentContext(): CommandContext {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Get all active contexts (for cascading command resolution)
   */
  getActiveContexts(): CommandContext[] {
    return [...this.contextStack];
  }

  /**
   * Get the current focus state
   */
  getFocus(): CommandFocus {
    return { ...this.currentFocus };
  }

  /**
   * Get the complete command state for handlers
   */
  getCommandState(): CommandState {
    return {
      context: this.getCurrentContext(),
      focus: this.getFocus(),
      selectedDate: this.selectedDate,
      viewMode: this.viewMode,
      metadata: { ...this.metadata }
    };
  }

  /**
   * Switch between schedule and you views
   */
  switchView(mode: 'schedule' | 'you') {
    this.viewMode = mode;
    
    // Reset context stack to global + new view
    this.contextStack = [CommandContext.GLOBAL];
    this.contextStack.push(
      mode === 'schedule' 
        ? CommandContext.VIEW_SCHEDULE 
        : CommandContext.VIEW_YOU
    );
    
    // Reset focus to view level
    this.currentFocus = { type: 'view' };
    
    this.notifyChange();
  }

  /**
   * Enter block level context
   */
  enterBlockLevel(blockIndex: number, blockId?: string) {
    // Remove any task level if present
    this.exitToBlockLevel();
    
    // Add block context if not already there
    if (this.getCurrentContext() !== CommandContext.BLOCK_LEVEL) {
      this.contextStack.push(CommandContext.BLOCK_LEVEL);
    }
    
    this.currentFocus = { 
      type: 'block', 
      index: blockIndex, 
      id: blockId 
    };
    
    this.notifyChange();
  }

  /**
   * Enter task level context within a block
   */
  enterTaskLevel(taskIndex: number, blockIndex: number, taskId?: string) {
    // Ensure we're at block level first
    this.enterBlockLevel(blockIndex);
    
    // Add task context
    this.contextStack.push(CommandContext.TASK_LEVEL);
    
    this.currentFocus = { 
      type: 'task', 
      index: taskIndex,
      parentIndex: blockIndex,
      id: taskId 
    };
    
    this.notifyChange();
  }

  /**
   * Exit from task level back to block level
   */
  exitToBlockLevel() {
    if (this.getCurrentContext() === CommandContext.TASK_LEVEL) {
      this.contextStack.pop();
      
      // Restore block focus
      if (this.currentFocus.parentIndex !== undefined) {
        this.currentFocus = { 
          type: 'block', 
          index: this.currentFocus.parentIndex 
        };
      }
      
      this.notifyChange();
    }
  }

  /**
   * Exit from block level back to view level
   */
  exitToViewLevel() {
    // Remove task and block contexts
    while (this.contextStack.length > 2) { // Keep global and view
      this.contextStack.pop();
    }
    
    this.currentFocus = { type: 'view' };
    this.notifyChange();
  }

  /**
   * Navigate to a different block (staying at block level)
   */
  navigateToBlock(blockIndex: number, blockId?: string) {
    if (this.getCurrentContext() === CommandContext.BLOCK_LEVEL) {
      this.currentFocus = { 
        type: 'block', 
        index: blockIndex, 
        id: blockId 
      };
      this.notifyChange();
    }
  }

  /**
   * Navigate to a different task (staying at task level)
   */
  navigateToTask(taskIndex: number, taskId?: string) {
    if (this.getCurrentContext() === CommandContext.TASK_LEVEL) {
      const parentIndex = this.currentFocus.parentIndex;
      this.currentFocus = { 
        type: 'task', 
        index: taskIndex,
        parentIndex,
        id: taskId 
      };
      this.notifyChange();
    }
  }

  /**
   * Update selected date (for schedule view)
   */
  setSelectedDate(date: Date) {
    this.selectedDate = date;
    this.notifyChange();
  }

  /**
   * Set metadata for command handlers
   */
  setMetadata(key: string, value: any) {
    this.metadata[key] = value;
  }

  /**
   * Clear specific metadata
   */
  clearMetadata(key: string) {
    delete this.metadata[key];
  }

  /**
   * Set callback for context changes
   */
  onContextChanged(callback: (context: CommandContext, focus: CommandFocus) => void) {
    this.onContextChange = callback;
  }

  /**
   * Check if a specific context is active
   */
  isContextActive(context: CommandContext): boolean {
    return this.contextStack.includes(context);
  }

  /**
   * Get the context hierarchy for command resolution
   * Returns contexts from most specific to least specific
   */
  getContextHierarchy(): CommandContext[] {
    const hierarchy: CommandContext[] = [];
    const current = this.getCurrentContext();
    
    // Build hierarchy based on current context
    switch (current) {
      case CommandContext.TASK_LEVEL:
        hierarchy.push(
          CommandContext.TASK_LEVEL,
          CommandContext.BLOCK_LEVEL,
          this.viewMode === 'schedule' 
            ? CommandContext.VIEW_SCHEDULE 
            : CommandContext.VIEW_YOU
        );
        break;
        
      case CommandContext.BLOCK_LEVEL:
        hierarchy.push(
          CommandContext.BLOCK_LEVEL,
          this.viewMode === 'schedule' 
            ? CommandContext.VIEW_SCHEDULE 
            : CommandContext.VIEW_YOU
        );
        break;
        
      case CommandContext.VIEW_SCHEDULE:
      case CommandContext.VIEW_YOU:
        hierarchy.push(current);
        break;
    }
    
    // Global is always available
    hierarchy.push(CommandContext.GLOBAL);
    
    return hierarchy;
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.contextStack = [CommandContext.GLOBAL];
    this.contextStack.push(
      this.viewMode === 'schedule' 
        ? CommandContext.VIEW_SCHEDULE 
        : CommandContext.VIEW_YOU
    );
    this.currentFocus = { type: 'view' };
    this.metadata = {};
    this.notifyChange();
  }

  /**
   * Notify listeners of context change
   */
  private notifyChange() {
    if (this.onContextChange) {
      this.onContextChange(this.getCurrentContext(), this.getFocus());
    }
  }

  /**
   * Debug helper to get current state as string
   */
  toString(): string {
    return `Context: ${this.getCurrentContext()}, Focus: ${this.currentFocus.type}[${this.currentFocus.index ?? 'none'}]`;
  }
}