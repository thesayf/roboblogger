// Types for the Inventory components

export interface Goal {
  id: string;
  name: string;
  isExpanded: boolean;
  deadline?: string;
}

export interface Project {
  id: string;
  name: string;
  isExpanded: boolean;
  deadline?: string;
  goalId?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  duration?: string;
}

export interface RoutineItem {
  id: string;
  name: string;
  time?: string;
  days?: string[];
}

export interface AdminTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time?: string;
}

export type CursorPosition = 'empty' | 'header' | 'goal' | 'sections' | 'inventory';
export type SectionType = 'projects' | 'routines' | 'admin' | 'events' | 'goals';
export type InputStep = 'name' | 'deadline' | null;

export interface InventoryViewProps {
  currentTime: string;
  user: any;
  commandInput: string;
  isTypingCommand: boolean;
  showSlashMenu: boolean;
  onSlashMenuSelect?: (command: string) => void;
  onSlashMenuCancel?: () => void;
  userData?: any;
}

export interface SectionProps {
  items: any[];
  isActive: boolean;
  isExpanded: boolean;
  onAddItem?: (item: any) => void;
  onEditItem?: (id: string, updates: any) => void;
  onDeleteItem?: (id: string) => void;
  onReorderItems?: (items: any[]) => void;
}