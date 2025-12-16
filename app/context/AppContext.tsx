"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  Event,
  Project,
  ProjectTask,
  Task,
  Routine,
  RoutineTask,
  UserData,
  Day,
  Block,
  PreviewSchedule,
  Goal,
} from "./models";
import { useAuth } from "@clerk/nextjs";

type SelectedDay = "today" | "tomorrow";
export interface QuestionnaireData {
  wakeTime: string;
  sleepTime: string; // Add thi
  focusDuration: string;
  peakEnergyTimes: string[]; // Add this new field
  workSituation: string; // Add this new field
  timeAbsorption: string; // Add this new field
  interruptionRecovery: string; // Add this new field
  workIntensity: string; // Add this new field
  personalStandards: string; // Add this new field
  scheduleAdherence: string; // Add this new field
  procrastinationTendency: string; // Add this new field
  breakDuration: string; // Add this if it's not already present
  flowCapacity: Number;
}

type AppContextType = {
  events: Event[];
  day: Day;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, block: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  setDay: React.Dispatch<React.SetStateAction<Day>>;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTaskToProject: (projectId: string, task: ProjectTask) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  addTaskToRoutine: (
    routineId: string,
    task: Omit<RoutineTask, "id" | "routineId">
  ) => void;
  updateRoutineTask: (
    routineId: string,
    taskId: string,
    task: Partial<RoutineTask>
  ) => void;
  deleteRoutineTask: (routineId: string, taskId: string) => void;
  routines: Routine[];
  userData: UserData;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  selectedDay: SelectedDay;
  setSelectedDay: React.Dispatch<React.SetStateAction<SelectedDay>>;
  fetchDayData: (date: SelectedDay) => Promise<void>;
  questionnaireData: QuestionnaireData;
  updateQuestionnaireData: (
    field: keyof QuestionnaireData,
    value: string | string[]
  ) => void;
  currentQuestionStep: number;
  setCurrentQuestionStep: (step: number) => void;
  promptText: string;
  setPromptText: React.Dispatch<React.SetStateAction<string>>;
  previewSchedule: PreviewSchedule | null;
  setPreviewSchedule: React.Dispatch<
    React.SetStateAction<PreviewSchedule | null>
  >;
  isPreviewMode: boolean;
  setIsPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  isGeneratingSchedule: boolean;
  setIsGeneratingSchedule: React.Dispatch<React.SetStateAction<boolean>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [day, setDay] = useState<Day>({
    _id: "",
    date: "",
    completed: false,
    blocks: [],
    completedTasksCount: 0,
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userData, setUserData] = useState<UserData>({
    tasks: [],
    projects: [],
    events: [],
    routines: [],
  });
  const [selectedDay, setSelectedDay] = useState<SelectedDay>("today");
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>(
    {
      wakeTime: "",
      sleepTime: "", //
      focusDuration: "",
      peakEnergyTimes: [], // Initialize as empty array,
      workSituation: "", // Initialize as empty string,
      timeAbsorption: "", // Initialize as empty string
      interruptionRecovery: "", // Initialize as empty string
      workIntensity: "", // Initialize as empty string
      personalStandards: "", // Initialize as empty string
      scheduleAdherence: "", // Initialize as empty string
      procrastinationTendency: "", // Initialize as empty string
      breakDuration: "", // Initialize as empty string
      flowCapacity: 0,
    }
  );
  const [currentQuestionStep, setCurrentQuestionStep] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [promptText, setPromptText] = useState("");
  // Inside AppProvider function
  // Initialize previewSchedule from localStorage
  const [previewSchedule, setPreviewSchedule] =
    useState<PreviewSchedule | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  useEffect(() => {
    // Only run after auth is loaded
    if (!isLoaded) return;

    // If we detect a user change (not just initial load)
    if (previousUserId && previousUserId !== userId) {
      console.log("User changed - clearing state");

      // Clear all app state
      setEvents([]);
      setProjects([]);
      setTasks([]);
      setRoutines([]);
      setBlocks([]);
      setPreviewSchedule(null);
      setIsPreviewMode(false);

      // Clear localStorage
      localStorage.removeItem("schedule");
      localStorage.removeItem("isPreviewMode");
      localStorage.removeItem("scheduleDayType");
      localStorage.removeItem("scheduleDayId");
    }

    // Update previous user reference
    setPreviousUserId(userId);
  }, [userId, isLoaded]);

  useEffect(() => {
    setMounted(true);

    // Only try to access localStorage after component is mounted
    if (typeof window !== "undefined") {
      const storedSchedule = localStorage.getItem("schedule");
      const storedPreviewMode = localStorage.getItem("isPreviewMode");

      if (storedSchedule) {
        setPreviewSchedule(JSON.parse(storedSchedule));
      }
      if (storedPreviewMode) {
        setIsPreviewMode(JSON.parse(storedPreviewMode));
      }
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (mounted) {
      if (previewSchedule) {
        localStorage.setItem("schedule", JSON.stringify(previewSchedule));
      } else {
        localStorage.removeItem("schedule");
      }
    }
  }, [previewSchedule, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("isPreviewMode", JSON.stringify(isPreviewMode));
    }
  }, [isPreviewMode, mounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }
  const addEvent = (event: Event) => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (id: string, updatedEvent: Partial<Event>) => {
    setEvents((prev) =>
      prev.map((event) =>
        event._id === id ? { ...event, ...updatedEvent } : event
      )
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event._id !== id));
  };
  // Add new questionnaire function
  const updateQuestionnaireData = (
    field: keyof QuestionnaireData,
    value: string | string[]
  ) => {
    setQuestionnaireData((prev) => ({ ...prev, [field]: value }));
  };

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
  };

  const updateProject = (id: string, updatedProject: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project._id === id ? { ...project, ...updatedProject } : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project._id !== id));
  };

  const addTaskToProject = (projectId: string, task: ProjectTask) => {
    setProjects((prev) =>
      prev.map((project) =>
        project._id === projectId
          ? { ...project, tasks: [...project.tasks, task] }
          : project
      )
    );
  };

  // Task functions
  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const updateTask = (id: string, updatedTask: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === id ? { ...task, ...updatedTask } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task._id !== id));
  };

  const addRoutine = (routine: Routine) => {
    setRoutines((prev) => [...prev, routine]);
  };

  const updateRoutine = (id: string, updatedRoutine: Partial<Routine>) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine._id === id ? { ...routine, ...updatedRoutine } : routine
      )
    );
  };

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((routine) => routine._id !== id));
  };

  const addTaskToRoutine = (
    routineId: string,
    task: Omit<RoutineTask, "id" | "routineId">
  ) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine._id === routineId) {
          const newTask: RoutineTask = {
            // _id: Date.now().toString(),
            routineId,
            ...task,
          };
          return { ...routine, tasks: [...routine.tasks, newTask] };
        }
        return routine;
      })
    );
  };

  const updateRoutineTask = (
    routineId: string,
    taskId: string,
    updatedTask: Partial<RoutineTask>
  ) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine._id === routineId) {
          const updatedTasks = routine.tasks.map((task) =>
            task._id === taskId ? { ...task, ...updatedTask } : task
          );
          return { ...routine, tasks: updatedTasks };
        }
        return routine;
      })
    );
  };

  const deleteRoutineTask = (routineId: string, taskId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine._id === routineId) {
          const updatedTasks = routine.tasks.filter(
            (task) => task._id !== taskId
          );
          return { ...routine, tasks: updatedTasks };
        }
        return routine;
      })
    );
  };

  const addBlock = (block: Block) => {
    setBlocks((prev) => [...prev, block]);
    setDay((prevDay) => ({
      ...prevDay,
      blocks: [...prevDay.blocks, block],
    }));
  };

  const updateBlock = (id: string, updatedBlock: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block._id === id ? { ...block, ...updatedBlock } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block._id !== id));
    setDay((prevDay) => ({
      ...prevDay,
      blocks: prevDay.blocks.filter((block) => block._id !== id),
    }));
  };

  // Goal functions
  const addGoal = (goal: Goal) => {
    setGoals((prev) => [...prev, goal]);
  };

  const updateGoal = (id: string, updatedGoal: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal._id === id ? { ...goal, ...updatedGoal } : goal
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal._id !== id));
  };

  const fetchDayData = async (date: SelectedDay) => {
    try {
      const userId = "user-id-here"; // Replace with actual user ID from your auth system
      const response = await fetch(
        `/api/get-day?date=${date}&userId=${userId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch day");
      }
      const data = await response.json();
      setDay(data);
      setSelectedDay(date);
    } catch (error) {
      console.error("Error fetching day:", error);
      // Optionally, set a fallback date or show an error message
    }
  };

  return (
    <AppContext.Provider
      value={{
        day,
        setDay,
        userData,
        routines,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        projects,
        addProject,
        updateProject,
        deleteProject,
        addTaskToProject,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        addTaskToRoutine,
        updateRoutineTask,
        deleteRoutineTask,
        setProjects,
        setEvents,
        setTasks,
        setRoutines,
        blocks,
        setBlocks,
        addBlock,
        updateBlock,
        deleteBlock,
        selectedDay,
        setSelectedDay,
        fetchDayData,
        questionnaireData,
        updateQuestionnaireData,
        currentQuestionStep,
        setCurrentQuestionStep,
        promptText,
        setPromptText,
        previewSchedule,
        setPreviewSchedule,
        isPreviewMode,
        setIsPreviewMode,
        isGeneratingSchedule,
        setIsGeneratingSchedule,
        goals,
        setGoals,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
