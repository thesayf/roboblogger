import { ContextualCommand, CommandContext, CommandResult } from './types';

/**
 * Default command definitions for the application
 */

// Global Commands (always available)
export const globalCommands: ContextualCommand[] = [
  {
    id: 'toggle-view',
    key: 'f1',  // F1 - toggle view
    contexts: [CommandContext.GLOBAL],
    handler: async (state): Promise<CommandResult> => {
      // Toggle between schedule and you views
      const newView = state.viewMode === 'schedule' ? 'you' : 'schedule';
      const newContext = newView === 'schedule' 
        ? CommandContext.VIEW_SCHEDULE 
        : CommandContext.VIEW_YOU;
      
      return {
        success: true,
        message: `Switched to ${newView} view`,
        newContext,
        data: { viewMode: newView }
      };
    },
    description: 'Toggle between Timeline and Inventory views',
    category: 'navigation',
    preventDefault: true,
    stopPropagation: true
  }
];

// Schedule View Commands (only in timeline view)
export const scheduleViewCommands: ContextualCommand[] = [
  {
    id: 'toggle-day',
    key: 'f2',  // F2 - toggle day
    contexts: [CommandContext.VIEW_SCHEDULE],
    handler: async (state): Promise<CommandResult> => {
      return {
        success: true,
        message: 'Toggle day',
        data: { action: 'toggleDay' }
      };
    },
    description: 'Toggle between today and tomorrow',
    category: 'navigation',
    preventDefault: true,
    stopPropagation: true
  }
];

/**
 * Get all default commands
 */
export function getAllDefaultCommands(): ContextualCommand[] {
  return [
    ...globalCommands,
    ...scheduleViewCommands
  ];
}