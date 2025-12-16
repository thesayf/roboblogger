import { useState, useEffect, useCallback, useRef } from 'react';
import { CommandContext, CommandFocus, CommandState, CommandResult } from '@/app/core/commands/types';
import { CommandContextManager } from '@/app/core/commands/CommandContextManager';
import { CommandRegistry } from '@/app/core/commands/CommandRegistry';
import { getAllDefaultCommands } from '@/app/core/commands/defaultCommands';

interface UseCommandSystemOptions {
  initialView?: 'schedule' | 'you';
  onCommandExecuted?: (result: CommandResult) => void;
  onContextChanged?: (context: CommandContext, focus: CommandFocus) => void;
  debug?: boolean;
}

interface UseCommandSystemReturn {
  // Context management
  currentContext: CommandContext;
  currentFocus: CommandFocus;
  commandState: CommandState;
  
  // View management
  viewMode: 'schedule' | 'you';
  switchView: (mode: 'schedule' | 'you') => void;
  
  // Navigation
  exitToViewLevel: () => void;
  
  // Date management
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  
  // Command execution
  executeCommand: (commandId: string) => Promise<CommandResult>;
  executeByKey: (key: string, event?: KeyboardEvent) => Promise<CommandResult | null>;
  
  // Help and discovery
  availableCommands: any[];
  commandSuggestions: any[];
  showHelp: boolean;
  toggleHelp: () => void;
  
  // Debug
  contextManager: CommandContextManager;
  registry: CommandRegistry;
}

/**
 * React hook for the command system
 * Provides complete command context management and execution
 */
export function useCommandSystem(
  options: UseCommandSystemOptions = {}
): UseCommandSystemReturn {
  const {
    initialView = 'schedule',
    onCommandExecuted,
    onContextChanged,
    debug = false
  } = options;

  // Initialize core systems (using refs to prevent recreation)
  const contextManagerRef = useRef<CommandContextManager>();
  const registryRef = useRef<CommandRegistry>();
  
  if (!contextManagerRef.current) {
    contextManagerRef.current = new CommandContextManager(initialView);
  }
  
  if (!registryRef.current) {
    registryRef.current = CommandRegistry.getInstance();
    // Register default commands
    const defaultCommands = getAllDefaultCommands();
    registryRef.current.registerBatch(defaultCommands);
  }

  const contextManager = contextManagerRef.current;
  const registry = registryRef.current;

  // State
  const [currentContext, setCurrentContext] = useState<CommandContext>(
    contextManager.getCurrentContext()
  );
  const [currentFocus, setCurrentFocus] = useState<CommandFocus>(
    contextManager.getFocus()
  );
  const [commandState, setCommandState] = useState<CommandState>(
    contextManager.getCommandState()
  );
  const [viewMode, setViewMode] = useState<'schedule' | 'you'>(initialView);
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());
  const [showHelp, setShowHelp] = useState(false);
  const [availableCommands, setAvailableCommands] = useState<any[]>([]);
  const [commandSuggestions, setCommandSuggestions] = useState<any[]>([]);

  // Setup context change listener
  useEffect(() => {
    const handleContextChange = (context: CommandContext, focus: CommandFocus) => {
      setCurrentContext(context);
      setCurrentFocus(focus);
      setCommandState(contextManager.getCommandState());
      
      // Update available commands
      setAvailableCommands(registry.getAvailableCommands(contextManager));
      setCommandSuggestions(registry.getCommandSuggestions(contextManager));
      
      if (onContextChanged) {
        onContextChanged(context, focus);
      }
      
      if (debug) {
        console.log('[CommandSystem] Context changed:', contextManager.toString());
      }
    };

    contextManager.onContextChanged(handleContextChange);
    
    // Initial update
    handleContextChange(
      contextManager.getCurrentContext(),
      contextManager.getFocus()
    );
  }, [contextManager, registry, onContextChanged, debug]);

  // View management
  const switchView = useCallback((mode: 'schedule' | 'you') => {
    contextManager.switchView(mode);
    setViewMode(mode);
  }, [contextManager]);

  // Navigation methods
  const exitToViewLevel = useCallback(() => {
    contextManager.exitToViewLevel();
  }, [contextManager]);

  // Date management
  const setSelectedDate = useCallback((date: Date) => {
    contextManager.setSelectedDate(date);
    setSelectedDateState(date);
  }, [contextManager]);

  // Command execution
  const executeCommand = useCallback(async (commandId: string): Promise<CommandResult> => {
    const state = contextManager.getCommandState();
    const result = await registry.executeById(commandId, state);
    
    // Handle context changes from command
    if (result.newContext) {
      if (result.newContext === CommandContext.VIEW_SCHEDULE) {
        switchView('schedule');
      } else if (result.newContext === CommandContext.VIEW_YOU) {
        switchView('you');
      }
    }
    
    if (onCommandExecuted) {
      onCommandExecuted(result);
    }
    
    if (debug) {
      console.log('[CommandSystem] Executed command:', commandId, result);
    }
    
    return result;
  }, [
    contextManager, 
    registry, 
    currentContext, 
    currentFocus,
    switchView,
    onCommandExecuted,
    debug
  ]);

  const executeByKey = useCallback(async (
    key: string, 
    event?: KeyboardEvent
  ): Promise<CommandResult | null> => {
    const result = await registry.executeByKey(key, contextManager, event);
    
    if (result) {
      // Handle context changes same as executeCommand
      if (result.newContext) {
        if (result.newContext === CommandContext.VIEW_SCHEDULE) {
          switchView('schedule');
        } else if (result.newContext === CommandContext.VIEW_YOU) {
          switchView('you');
        }
      }
      
      if (result.newFocus) {
        if (result.newFocus.type === 'block') {
          navigateToBlock(result.newFocus.index || 0, result.newFocus.id);
        } else if (result.newFocus.type === 'task') {
          navigateToTask(result.newFocus.index || 0, result.newFocus.id);
        }
      }
      
      if (onCommandExecuted) {
        onCommandExecuted(result);
      }
      
      if (debug) {
        console.log('[CommandSystem] Executed by key:', key, result);
      }
    }
    
    return result;
  }, [
    registry, 
    contextManager,
    currentContext,
    currentFocus,
    switchView,
    onCommandExecuted,
    debug
  ]);

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't capture keys when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Don't capture single character keys without modifiers (let typing handler deal with them)
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        return;
      }

      // Build key string with modifiers (using standard naming)
      let key = '';
      if (event.ctrlKey) key += 'ctrl+';
      if (event.altKey) key += 'alt+';
      if (event.shiftKey) key += 'shift+';
      if (event.metaKey) key += 'meta+';  // Use 'meta' for Cmd key
      key += event.key.toLowerCase();  // Normalize to lowercase

      console.log('[CommandSystem] Key pressed:', key, 'Original key:', event.key);
      
      // Execute command by key
      executeByKey(key, event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeByKey]);

  // Help toggle
  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  // Check for conflicts on mount (in debug mode)
  useEffect(() => {
    if (debug) {
      const conflicts = registry.getKeyConflicts();
      if (conflicts.size > 0) {
        console.warn('[CommandSystem] Key binding conflicts detected:');
        conflicts.forEach((messages, key) => {
          messages.forEach(msg => console.warn(`  ${key}: ${msg}`));
        });
      }
      
      const stats = registry.getStats();
      console.log('[CommandSystem] Registry stats:', stats);
    }
  }, [registry, debug]);

  return {
    // Context management
    currentContext,
    currentFocus,
    commandState,
    
    // View management
    viewMode,
    switchView,
    
    // Navigation
    exitToViewLevel,
    
    // Date management
    selectedDate,
    setSelectedDate,
    
    // Command execution
    executeCommand,
    executeByKey,
    
    // Help and discovery
    availableCommands,
    commandSuggestions,
    showHelp,
    toggleHelp,
    
    // Debug
    contextManager,
    registry
  };
}