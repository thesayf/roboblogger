import { 
  CommandContext, 
  ContextualCommand, 
  CommandState, 
  CommandResult,
  CommandHistoryEntry,
  CommandSuggestion 
} from './types';
import { CommandContextManager } from './CommandContextManager';

/**
 * Central registry for all commands in the application
 * Handles registration, execution, and history tracking
 */
export class CommandRegistry {
  private static instance: CommandRegistry;
  private commands: Map<string, ContextualCommand> = new Map();
  private contextCommands: Map<CommandContext, Set<string>> = new Map();
  private keyBindings: Map<string, Set<string>> = new Map();
  private history: CommandHistoryEntry[] = [];
  private maxHistorySize = 100;
  
  // For tracking key sequences (like 'gg' in Vim)
  private sequenceBuffer: string[] = [];
  private sequenceTimeout?: NodeJS.Timeout;
  private sequenceTimeoutMs = 500;

  private constructor() {
    // Initialize context maps
    Object.values(CommandContext).forEach(context => {
      this.contextCommands.set(context as CommandContext, new Set());
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Register a command
   */
  register(command: ContextualCommand): void {
    // Validate command
    if (!command.id || !command.key || !command.handler) {
      throw new Error('Invalid command: missing required fields');
    }

    // Check for ID conflicts
    if (this.commands.has(command.id)) {
      console.warn(`Command with ID "${command.id}" already exists. Overwriting.`);
    }

    // Store command
    this.commands.set(command.id, command);

    // Index by context
    command.contexts.forEach(context => {
      const contextSet = this.contextCommands.get(context);
      if (contextSet) {
        contextSet.add(command.id);
      }
    });

    // Index by key binding
    const keyStr = this.keyToString(command.key);
    if (!this.keyBindings.has(keyStr)) {
      this.keyBindings.set(keyStr, new Set());
    }
    this.keyBindings.get(keyStr)!.add(command.id);
  }

  /**
   * Register multiple commands at once
   */
  registerBatch(commands: ContextualCommand[]): void {
    commands.forEach(cmd => this.register(cmd));
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): void {
    const command = this.commands.get(commandId);
    if (!command) return;

    // Remove from registry
    this.commands.delete(commandId);

    // Remove from context index
    command.contexts.forEach(context => {
      const contextSet = this.contextCommands.get(context);
      if (contextSet) {
        contextSet.delete(commandId);
      }
    });

    // Remove from key binding index
    const keyStr = this.keyToString(command.key);
    const keySet = this.keyBindings.get(keyStr);
    if (keySet) {
      keySet.delete(commandId);
      if (keySet.size === 0) {
        this.keyBindings.delete(keyStr);
      }
    }
  }

  /**
   * Execute a command by ID
   */
  async executeById(
    commandId: string, 
    state: CommandState
  ): Promise<CommandResult> {
    const command = this.commands.get(commandId);
    if (!command) {
      return { 
        success: false, 
        message: `Command "${commandId}" not found` 
      };
    }

    return this.executeCommand(command, state);
  }

  /**
   * Execute a command by key press
   */
  async executeByKey(
    key: string,
    contextManager: CommandContextManager,
    event?: KeyboardEvent
  ): Promise<CommandResult | null> {
    // Add to sequence buffer
    this.sequenceBuffer.push(key);
    
    // Clear previous timeout
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }

    // Try to find matching command
    const command = this.resolveCommand(
      this.sequenceBuffer, 
      contextManager
    );

    console.log('[CommandRegistry] Looking for command with key:', this.sequenceBuffer, 'Found:', command?.id);

    if (command) {
      // Clear sequence buffer
      this.sequenceBuffer = [];
      
      // Prevent default if specified
      if (event && command.preventDefault !== false) {
        event.preventDefault();
      }
      if (event && command.stopPropagation) {
        event.stopPropagation();
      }

      // Execute command
      const state = contextManager.getCommandState();
      return this.executeCommand(command, state);
    }

    // Set timeout to clear buffer if no more keys
    this.sequenceTimeout = setTimeout(() => {
      this.sequenceBuffer = [];
    }, this.sequenceTimeoutMs);

    return null;
  }

  /**
   * Resolve which command to execute based on key sequence and context
   */
  private resolveCommand(
    keySequence: string[],
    contextManager: CommandContextManager
  ): ContextualCommand | null {
    const keyStr = keySequence.join(',');
    const hierarchy = contextManager.getContextHierarchy();

    // Try each context in the hierarchy
    for (const context of hierarchy) {
      const contextCommandIds = this.contextCommands.get(context);
      if (!contextCommandIds) continue;

      // Check all commands in this context
      for (const commandId of contextCommandIds) {
        const command = this.commands.get(commandId);
        if (!command) continue;

        const cmdKeyStr = this.keyToString(command.key);
        
        // Check for exact match
        if (cmdKeyStr === keyStr) {
          return command;
        }
        
        // Check for partial match (for sequences still being typed)
        if (cmdKeyStr.startsWith(keyStr + ',')) {
          // Don't return yet, sequence not complete
          return null;
        }
      }
    }

    // No match found, clear buffer if it's getting too long
    if (keySequence.length > 3) {
      this.sequenceBuffer = [];
    }

    return null;
  }

  /**
   * Execute a command
   */
  private async executeCommand(
    command: ContextualCommand,
    state: CommandState
  ): Promise<CommandResult> {
    try {
      // Execute handler
      const result = await command.handler(state);
      
      // If handler doesn't return a result, create default success
      const finalResult = result || { 
        success: true,
        message: `Executed: ${command.description}`
      };

      // Add to history
      this.addToHistory({
        command,
        state,
        timestamp: Date.now(),
        result: finalResult
      });

      return finalResult;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
      };

      // Still add to history for debugging
      this.addToHistory({
        command,
        state,
        timestamp: Date.now(),
        result: errorResult
      });

      return errorResult;
    }
  }

  /**
   * Get available commands for current context
   */
  getAvailableCommands(contextManager: CommandContextManager): ContextualCommand[] {
    const hierarchy = contextManager.getContextHierarchy();
    const availableCommands = new Set<ContextualCommand>();

    hierarchy.forEach(context => {
      const contextCommandIds = this.contextCommands.get(context);
      if (contextCommandIds) {
        contextCommandIds.forEach(id => {
          const command = this.commands.get(id);
          if (command) {
            availableCommands.add(command);
          }
        });
      }
    });

    return Array.from(availableCommands);
  }

  /**
   * Get command suggestions for help/documentation
   */
  getCommandSuggestions(contextManager: CommandContextManager): CommandSuggestion[] {
    const currentContext = contextManager.getCurrentContext();
    const hierarchy = contextManager.getContextHierarchy();
    const suggestions: CommandSuggestion[] = [];

    // Get all commands
    this.commands.forEach(command => {
      const available = command.contexts.some(ctx => hierarchy.includes(ctx));
      
      suggestions.push({
        command,
        available,
        reason: available ? undefined : `Not available in ${currentContext}`,
        keybinding: this.keyToString(command.key)
      });
    });

    // Sort by availability and category
    return suggestions.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return (a.command.category || '').localeCompare(b.command.category || '');
    });
  }

  /**
   * Get command history
   */
  getHistory(limit?: number): CommandHistoryEntry[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Check for key binding conflicts
   */
  getKeyConflicts(): Map<string, string[]> {
    const conflicts = new Map<string, string[]>();

    this.keyBindings.forEach((commandIds, key) => {
      if (commandIds.size > 1) {
        // Check if these commands can actually conflict (share contexts)
        const commands = Array.from(commandIds)
          .map(id => this.commands.get(id))
          .filter(Boolean) as ContextualCommand[];
        
        const contextOverlaps = this.findContextOverlaps(commands);
        if (contextOverlaps.length > 0) {
          conflicts.set(key, contextOverlaps);
        }
      }
    });

    return conflicts;
  }

  /**
   * Find commands that share contexts (potential conflicts)
   */
  private findContextOverlaps(commands: ContextualCommand[]): string[] {
    const overlaps: string[] = [];
    
    for (let i = 0; i < commands.length; i++) {
      for (let j = i + 1; j < commands.length; j++) {
        const sharedContexts = commands[i].contexts.filter(
          ctx => commands[j].contexts.includes(ctx)
        );
        
        if (sharedContexts.length > 0) {
          overlaps.push(
            `"${commands[i].id}" and "${commands[j].id}" both use same key in: ${sharedContexts.join(', ')}`
          );
        }
      }
    }
    
    return overlaps;
  }

  /**
   * Convert key definition to string for indexing
   */
  private keyToString(key: string | string[]): string {
    if (Array.isArray(key)) {
      return key.join(',');
    }
    return key;
  }

  /**
   * Add entry to history
   */
  private addToHistory(entry: CommandHistoryEntry): void {
    this.history.push(entry);
    
    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get statistics about registered commands
   */
  getStats(): {
    totalCommands: number;
    commandsByContext: Map<CommandContext, number>;
    commandsByCategory: Map<string, number>;
    totalKeyBindings: number;
  } {
    const commandsByCategory = new Map<string, number>();
    
    this.commands.forEach(cmd => {
      const category = cmd.category || 'uncategorized';
      commandsByCategory.set(
        category, 
        (commandsByCategory.get(category) || 0) + 1
      );
    });

    const commandsByContext = new Map<CommandContext, number>();
    this.contextCommands.forEach((commands, context) => {
      commandsByContext.set(context, commands.size);
    });

    return {
      totalCommands: this.commands.size,
      commandsByContext,
      commandsByCategory,
      totalKeyBindings: this.keyBindings.size
    };
  }
}