import { useEffect, useCallback } from 'react';

type CommandContext = 'global' | 'block' | 'task' | 'command' | 'chat';

interface Command {
  key: string;
  modifiers?: {
    meta?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  contexts: CommandContext[];
  action: () => void;
  description?: string;
  preventDefault?: boolean;
}

interface UseKeyboardCommandsProps {
  commands: Command[];
  context: CommandContext;
  enabled?: boolean;
}

export function useKeyboardCommands({
  commands,
  context,
  enabled = true
}: UseKeyboardCommandsProps) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't process shortcuts if user is typing in an input, textarea, or contenteditable
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return;
    }

    // Find matching command
    const matchingCommand = commands.find(cmd => {
      // Check if context matches
      if (!cmd.contexts.includes(context) && !cmd.contexts.includes('global')) {
        return false;
      }

      // Check key
      if (e.key.toLowerCase() !== cmd.key.toLowerCase()) {
        return false;
      }

      // Check modifiers
      if (cmd.modifiers) {
        const metaOrCtrl = e.metaKey || e.ctrlKey;
        
        // Only check modifiers that are explicitly defined
        if (cmd.modifiers.meta !== undefined) {
          if (cmd.modifiers.meta !== metaOrCtrl) return false;
        }
        if (cmd.modifiers.shift !== undefined) {
          if (cmd.modifiers.shift !== e.shiftKey) return false;
        }
        if (cmd.modifiers.alt !== undefined) {
          if (cmd.modifiers.alt !== e.altKey) return false;
        }
      } else {
        // If no modifiers specified, ensure no modifiers are pressed
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return false;
        }
      }

      return true;
    });

    if (matchingCommand) {
      if (matchingCommand.preventDefault !== false) {
        e.preventDefault();
      }
      matchingCommand.action();
    }
  }, [commands, context, enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Helper to create a command
export function createCommand(
  key: string,
  action: () => void,
  options: {
    contexts?: CommandContext[];
    modifiers?: Command['modifiers'];
    description?: string;
    preventDefault?: boolean;
  } = {}
): Command {
  return {
    key,
    action,
    contexts: options.contexts || ['global'],
    modifiers: options.modifiers,
    description: options.description,
    preventDefault: options.preventDefault
  };
}

// Common command creators for consistency
export const CommandCreators = {
  // Navigation
  moveUp: (action: () => void, contexts: CommandContext[] = ['block']) => 
    createCommand('ArrowUp', action, { contexts }),
  
  moveDown: (action: () => void, contexts: CommandContext[] = ['block']) => 
    createCommand('ArrowDown', action, { contexts }),
  
  enterBlock: (action: () => void) => 
    createCommand('Tab', action, { contexts: ['block'] }),
  
  exitBlock: (action: () => void) => 
    createCommand('Tab', action, { contexts: ['task'], modifiers: { shift: true } }),
  
  // Grab & Move
  grab: (action: () => void, contexts: CommandContext[] = ['block', 'task']) => 
    createCommand('g', action, { contexts }),
  
  // Completion
  complete: (action: () => void, contexts: CommandContext[] = ['task']) => 
    createCommand(' ', action, { contexts }),
  
  completeBlock: (action: () => void) => 
    createCommand(' ', action, { contexts: ['block'], modifiers: { meta: true } }),
  
  // Creation
  add: (action: () => void, contexts: CommandContext[] = ['block', 'task']) => 
    createCommand('a', action, { contexts }),
  
  addRoutine: (action: () => void) => 
    createCommand('r', action, { contexts: ['block'] }),
  
  addEvent: (action: () => void) => 
    createCommand('v', action, { contexts: ['block'] }),
  
  // Editing
  edit: (action: () => void, contexts: CommandContext[] = ['block', 'task']) => 
    createCommand('e', action, { contexts }),
  
  delete: (action: () => void, contexts: CommandContext[] = ['block', 'task']) => 
    createCommand('d', action, { contexts }),
  
  // System
  commandPalette: (action: () => void) => 
    createCommand('k', action, { modifiers: { meta: true } }),
  
  aiChat: (action: () => void) => 
    createCommand('/', action, { modifiers: { meta: true } }),
  
  help: (action: () => void) => 
    createCommand('?', action),
  
  escape: (action: () => void) => 
    createCommand('Escape', action),
  
  undo: (action: () => void) => 
    createCommand('z', action, { modifiers: { meta: true } }),
  
  redo: (action: () => void) => 
    createCommand('z', action, { modifiers: { meta: true, shift: true } }),
};