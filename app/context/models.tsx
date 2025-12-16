export interface Task {
  _id: string;
  title: string; // Changed from 'name'
  duration: number; // In minutes
  completed: boolean;
  // Optional fields for backward compatibility
  description?: string;
  priority?: string;
  deadline?: string;
  isRoutineTask?: boolean;
  block?: string | null;
  project?: string | null;
  routine?: string | null;
  projectId?: string | null;
  originalRoutineTaskId?: string | null;
  type?: "deep-work" | "planning" | "break" | "admin" | "collaboration";
  isCustomDuration?: boolean;
  routineId?: string;
  eventId?: string;
}

export interface ProjectTask extends Task {
  projectId: string;
}

export interface EventTask extends Task {
  eventId: string;
}

export interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  block: string | null;
  priority: string;
  isRecurring: boolean;
  days: string[];
  meetingLink: string | null;
  tasks: EventTask[];
  eventType: string;
}

export interface Project {
  order: any;
  completed: boolean;
  _id: string;
  name: string;
  description: string;
  deadline: Date;
  time: string;
  priority: string;
  tasks: ProjectTask[];
  goalId?: string;
}

export interface RoutineTask extends Task {
  routineId: string;
}

export interface Routine {
  isAlreadyAdded: any;
  startDate: string | number | Date;
  endDate: any;
  _id: string;
  name: string;
  description: string;
  days: string[];
  tasks: RoutineTask[];
  block: string;
  startTime: string;
  endTime: string;
  blockType: string;
  goalId?: string;
}

// New UserData interface
export interface UserData {
  tasks: Task[];
  projects: Project[];
  events: Event[];
  routines: Routine[];
}

export interface Block {
  _id: string;
  dayId: string;
  title: string; // Changed from 'name'
  time: string; // Changed from 'startTime'
  duration: number; // In minutes
  type: "deep-work" | "admin" | "break" | "meeting" | "personal"; // Changed from 'blockType'
  tasks: Task[];
  completed?: boolean;
  index?: number; // For ordering blocks
  createdAt?: string;
  updatedAt?: string;
}

export interface Day {
  _id: string;
  date: string;
  completed: boolean;
  completedTasksCount: number;
  blocks: Block[]; // Remove the
}

export interface Goal {
  _id: string;
  name: string;
  description: string;
  targetDate: Date;
  priority: "High" | "Medium" | "Low";
  status: "active" | "completed" | "paused";
  progress: number;
  projects: string[];
  routines: string[];
  standaloneTasks?: string[];
  createdAt: Date;
  completedAt?: Date;
  userId: string;
  milestones?: {
    id: string;
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  metrics?: {
    totalProjects: number;
    completedProjects: number;
    totalRoutines: number;
    activeRoutines: number;
    totalTasks?: number;
    completedTasks?: number;
  };
}

export interface User {
  _id: string;
  email: string;
  name: string;
  days: Day[];
}

export interface Schedule {
  currentTime: string;
  scheduleRationale: string;
  userStartTime: string;
  userEndTime: string;
  blocks: {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    type:
      | "deep-work"
      | "break"
      | "meeting"
      | "health"
      | "exercise"
      | "admin"
      | "personal";
    routineId: string | null;
    tasks: {
      id: string | null;
      name: string;
      duration: number;
      projectId: string | null;
      routineId: string | null;
      eventId: string | null;
    }[];
  }[];
}

export interface PreviewTask {
  id: string | null;
  name: string;
  duration: number;
  projectId: string | null;
  routineId: string | null;
  eventId: string | null;
  originalRoutineTaskId?: string | null; // Add this field
  description?: string;
  priority?: "High" | "Medium" | "Low";
  isRoutineTask?: boolean;
}

export interface PreviewBlock {
  event: string;
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  isEvent: boolean;
  isRoutine: boolean;
  isStandaloneBlock: boolean;
  eventId: string | null; // Add this line
  status: string;
  index?: number;
  blockType:
    | "deep-work"
    | "break"
    | "meeting"
    | "health"
    | "exercise"
    | "admin"
    | "personal";
  energyLevel: "high" | "medium" | "low";
  type:
    | "deep-work"
    | "break"
    | "meeting"
    | "health"
    | "exercise"
    | "admin"
    | "personal";
  routineId: string | null;
  tasks: PreviewTask[];
}

export interface PreviewSchedule {
  currentTime: string;
  scheduleRationale: string;
  userStartTime: string;
  userEndTime: string;
  blocks: PreviewBlock[];
}
