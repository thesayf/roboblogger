"use client";

import React, { useState } from 'react';
import { Check, Circle, Plus, ChevronDown, ChevronRight, ChevronLeft, Target, FolderOpen, Calendar as CalendarIcon, Repeat, ListTodo, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface Goal {
  id: string;
  content: string;
  name?: string; // For backward compatibility
  isExpanded?: boolean;
  deadline?: string;
  order?: number;
  color?: string;
}

interface Task {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  content?: string;
  duration?: number;
  completed?: boolean;
}

interface Project {
  id: string;
  name: string;
  content?: string;
  isExpanded?: boolean;
  deadline?: string;
  goalId?: string;
  tasks?: Task[];
  order?: number;
  completed?: boolean;
}

interface Event {
  id: string;
  name?: string;
  content?: string;
  date?: string;
  time?: string;
  location?: string;
}

interface Routine {
  id: string;
  name?: string;
  content?: string;
  frequency?: string;
  tasks?: Task[];
}

interface AdminTask {
  id: string;
  name?: string;
  content?: string;
  completed?: boolean;
  duration?: number;
}

interface MobileInventoryViewProps {
  currentTime: Date;
  user: any;
  goalsData?: Goal[];
  projectsData?: Project[];
  eventsData?: Event[];
  routinesData?: Routine[];
  adminTasksData?: AdminTask[];
  onProjectsUpdate?: () => void;
  onProjectsChange?: (projects: Project[]) => void;
  onGoalsUpdate?: () => void;
  onGoalsChange?: (goals: Goal[]) => void;
}

export default function MobileInventoryView({
  currentTime,
  user,
  goalsData = [],
  projectsData = [],
  eventsData = [],
  routinesData = [],
  adminTasksData = [],
  onProjectsUpdate,
  onProjectsChange,
  onGoalsUpdate,
  onGoalsChange
}: MobileInventoryViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());
  const [projectsView, setProjectsView] = useState<'active' | 'complete'>('active');
  const [projectTasksView, setProjectTasksView] = useState<Map<string, 'active' | 'complete'>>(new Map());
  const [goalsView, setGoalsView] = useState<'active' | 'complete'>('active');
  const [eventsView, setEventsView] = useState<'upcoming' | 'past'>('upcoming');
  const [routinesView, setRoutinesView] = useState<'active' | 'ended'>('active');
  const [adminTasksView, setAdminTasksView] = useState<'active' | 'complete'>('active');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [selectedTaskProjectId, setSelectedTaskProjectId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [selectedRoutineTask, setSelectedRoutineTask] = useState<string | null>(null);
  const [selectedRoutineTaskRoutineId, setSelectedRoutineTaskRoutineId] = useState<string | null>(null);
  const [selectedAdminTask, setSelectedAdminTask] = useState<string | null>(null);
  const [projectMoveMode, setProjectMoveMode] = useState(false);
  const [goalMoveMode, setGoalMoveMode] = useState(false);
  const [taskMoveMode, setTaskMoveMode] = useState(false);
  const [routineTaskMoveMode, setRoutineTaskMoveMode] = useState(false);

  // Add goal/project flow
  const [addGoalStep, setAddGoalStep] = useState<'idle' | 'name' | 'deadline'>('idle');
  const [addProjectStep, setAddProjectStep] = useState<'idle' | 'name' | 'goal' | 'deadline'>('idle');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGoalId, setNewProjectGoalId] = useState<string>('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  // Add task flow
  const [addTaskStep, setAddTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [addTaskToProjectId, setAddTaskToProjectId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  // Edit project flow
  const [editProjectStep, setEditProjectStep] = useState<'idle' | 'name' | 'deadline'>('idle');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDeadline, setEditProjectDeadline] = useState('');

  // Edit task flow
  const [editTaskStep, setEditTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [editTaskName, setEditTaskName] = useState('');
  const [editTaskDuration, setEditTaskDuration] = useState('');

  // Add event flow
  const [addEventStep, setAddEventStep] = useState<'idle' | 'name' | 'date' | 'time' | 'location'>('idle');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');

  // Edit event flow
  const [editEventStep, setEditEventStep] = useState<'idle' | 'name' | 'date' | 'time' | 'location'>('idle');
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventLocation, setEditEventLocation] = useState('');

  // Add routine flow
  const [addRoutineStep, setAddRoutineStep] = useState<'idle' | 'name' | 'frequency'>('idle');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineFrequency, setNewRoutineFrequency] = useState('');

  // Edit routine flow
  const [editRoutineStep, setEditRoutineStep] = useState<'idle' | 'name' | 'frequency'>('idle');
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editRoutineFrequency, setEditRoutineFrequency] = useState('');

  // Add routine task flow
  const [addRoutineTaskStep, setAddRoutineTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [addRoutineTaskToRoutineId, setAddRoutineTaskToRoutineId] = useState<string | null>(null);
  const [newRoutineTaskName, setNewRoutineTaskName] = useState('');
  const [newRoutineTaskDuration, setNewRoutineTaskDuration] = useState('');

  // Edit routine task flow
  const [editRoutineTaskStep, setEditRoutineTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [editRoutineTaskName, setEditRoutineTaskName] = useState('');
  const [editRoutineTaskDuration, setEditRoutineTaskDuration] = useState('');

  // Add admin task flow
  const [addAdminTaskStep, setAddAdminTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [newAdminTaskName, setNewAdminTaskName] = useState('');
  const [newAdminTaskDuration, setNewAdminTaskDuration] = useState('');

  // Edit admin task flow
  const [editAdminTaskStep, setEditAdminTaskStep] = useState<'idle' | 'name' | 'duration'>('idle');
  const [editAdminTaskName, setEditAdminTaskName] = useState('');
  const [editAdminTaskDuration, setEditAdminTaskDuration] = useState('');

  // Sort goals and projects by order
  const sortedGoals = [...goalsData].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  const sortedProjects = [...projectsData].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routineId)) {
        newSet.delete(routineId);
      } else {
        newSet.add(routineId);
      }
      return newSet;
    });
  };

  const getProjectTasksView = (projectId: string): 'active' | 'complete' => {
    return projectTasksView.get(projectId) || 'active';
  };

  const setProjectTasksViewForProject = (projectId: string, view: 'active' | 'complete') => {
    setProjectTasksView(prev => {
      const newMap = new Map(prev);
      newMap.set(projectId, view);
      return newMap;
    });
  };

  const handleRoutineChevronClick = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    toggleRoutine(routineId);
  };

  const handleProjectClick = (projectId: string) => {
    if (selectedProject === projectId) {
      // Clicking selected project again deselects it
      setSelectedProject(null);
    } else {
      // Select this project
      setSelectedProject(projectId);
    }
  };

  const handleChevronClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent project selection
    toggleProject(projectId);
  };

  const handleMoveProjectUp = async () => {
    if (selectedProject === null || !onProjectsChange) return;
    const currentIndex = sortedProjects.findIndex(p => p.id === selectedProject);
    if (currentIndex > 0) {
      // Optimistic update - swap projects in UI immediately
      const newProjects = [...sortedProjects];
      const temp = newProjects[currentIndex];
      newProjects[currentIndex] = newProjects[currentIndex - 1];
      newProjects[currentIndex - 1] = temp;

      // Update order values
      const updatedProjects = newProjects.map((p, idx) => ({
        ...p,
        order: idx
      }));

      onProjectsChange(updatedProjects);

      // Persist to API in background
      const reorderedProjects = updatedProjects.map((p) => ({
        _id: p.id,
        order: p.order
      }));

      try {
        await fetch('/api/reorder-projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: reorderedProjects }),
        });
      } catch (error) {
        console.error('Failed to reorder projects:', error);
        // Revert on error
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    }
  };

  const handleMoveProjectDown = async () => {
    if (selectedProject === null || !onProjectsChange) return;
    const currentIndex = sortedProjects.findIndex(p => p.id === selectedProject);
    if (currentIndex < sortedProjects.length - 1) {
      // Optimistic update - swap projects in UI immediately
      const newProjects = [...sortedProjects];
      const temp = newProjects[currentIndex];
      newProjects[currentIndex] = newProjects[currentIndex + 1];
      newProjects[currentIndex + 1] = temp;

      // Update order values
      const updatedProjects = newProjects.map((p, idx) => ({
        ...p,
        order: idx
      }));

      onProjectsChange(updatedProjects);

      // Persist to API in background
      const reorderedProjects = updatedProjects.map((p) => ({
        _id: p.id,
        order: p.order
      }));

      try {
        await fetch('/api/reorder-projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: reorderedProjects }),
        });
      } catch (error) {
        console.error('Failed to reorder projects:', error);
        // Revert on error
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    }
  };

  const handleCompleteProject = async () => {
    if (selectedProject === null || !onProjectsChange) return;

    // Optimistic update - toggle completion immediately
    const updatedProjects = sortedProjects.map(p => {
      if (p.id === selectedProject) {
        const currentCompletedState = p.completed || p.metadata?.completed || false;
        const newCompletedState = !currentCompletedState;
        return {
          ...p,
          completed: newCompletedState,
          metadata: {
            ...p.metadata,
            completed: newCompletedState
          }
        };
      }
      return p;
    });

    onProjectsChange(updatedProjects);

    // Persist to API in background
    try {
      await fetch('/api/complete-project', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProject }),
      });
    } catch (error) {
      console.error('Failed to complete project:', error);
      // Revert on error
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    }
  };

  const handleDeselectProject = () => {
    setSelectedProject(null);
    setProjectMoveMode(false);
  };

  const handleDeleteProject = async () => {
    if (selectedProject === null || !onProjectsChange) return;

    // Optimistic update - remove project from UI immediately
    const updatedProjects = sortedProjects.filter(p => p.id !== selectedProject);
    onProjectsChange(updatedProjects);
    setSelectedProject(null);

    // Persist to API in background
    try {
      await fetch(`/api/projects/${selectedProject}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Revert on error
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    }
  };

  // Goal handlers
  const handleGoalClick = (goalId: string) => {
    if (selectedGoal === goalId) {
      setSelectedGoal(null);
    } else {
      setSelectedGoal(goalId);
    }
  };

  const handleMoveGoalUp = async () => {
    if (selectedGoal === null || !onGoalsChange) return;

    const currentIndex = sortedGoals.findIndex(g => g.id === selectedGoal);
    if (currentIndex <= 0) return; // Can't move up if already at top

    // Create a new array and swap the goals
    const newGoals = [...sortedGoals];
    [newGoals[currentIndex - 1], newGoals[currentIndex]] = [newGoals[currentIndex], newGoals[currentIndex - 1]];

    // Reassign order values to all goals
    const updatedGoals = newGoals.map((g, idx) => ({
      ...g,
      order: idx
    }));

    // Update UI immediately
    onGoalsChange(updatedGoals);

    // Persist to backend
    try {
      const reorderedGoals = updatedGoals.map((g) => ({
        _id: g.id,
        order: g.order
      }));

      await fetch('/api/reorder-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: reorderedGoals }),
      });
    } catch (error) {
      console.error('Failed to reorder goals:', error);
      // Revert on error
      if (onGoalsUpdate) {
        onGoalsUpdate();
      }
    }
  };

  const handleMoveGoalDown = async () => {
    if (selectedGoal === null || !onGoalsChange) return;

    const currentIndex = sortedGoals.findIndex(g => g.id === selectedGoal);
    if (currentIndex < 0 || currentIndex >= sortedGoals.length - 1) return; // Can't move down if at bottom

    // Create a new array and swap the goals
    const newGoals = [...sortedGoals];
    [newGoals[currentIndex], newGoals[currentIndex + 1]] = [newGoals[currentIndex + 1], newGoals[currentIndex]];

    // Reassign order values to all goals
    const updatedGoals = newGoals.map((g, idx) => ({
      ...g,
      order: idx
    }));

    // Update UI immediately
    onGoalsChange(updatedGoals);

    // Persist to backend
    try {
      const reorderedGoals = updatedGoals.map((g) => ({
        _id: g.id,
        order: g.order
      }));

      await fetch('/api/reorder-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: reorderedGoals }),
      });
    } catch (error) {
      console.error('Failed to reorder goals:', error);
      // Revert on error
      if (onGoalsUpdate) {
        onGoalsUpdate();
      }
    }
  };

  const handleDeselectGoal = () => {
    setSelectedGoal(null);
    setGoalMoveMode(false);
  };

  const handleStartAddGoal = () => {
    setAddGoalStep('name');
    setSelectedGoal(null);
  };

  const handleStartAddProject = () => {
    setAddProjectStep('name');
    setSelectedProject(null);
  };

  const handleConfirmAddGoal = async () => {
    if (!newGoalName.trim() || !newGoalDeadline) return;

    try {
      const response = await fetch('/api/you/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGoalName, // API expects 'name', it converts to 'content' internally
          deadline: new Date(newGoalDeadline),
        }),
      });

      if (response.ok) {
        setNewGoalName('');
        setNewGoalDeadline('');
        setAddGoalStep('idle');
        if (onGoalsUpdate) {
          onGoalsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleConfirmAddProject = async () => {
    if (!newProjectName.trim() || !user?.id) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newProjectName,
          goalId: newProjectGoalId || undefined,
          deadline: newProjectDeadline ? new Date(newProjectDeadline) : undefined,
        }),
      });

      if (response.ok) {
        setNewProjectName('');
        setNewProjectGoalId('');
        setNewProjectDeadline('');
        setAddProjectStep('idle');
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleCancelAddGoal = () => {
    setAddGoalStep('idle');
    setNewGoalName('');
    setNewGoalDeadline('');
  };

  const handleCancelAddProject = () => {
    setAddProjectStep('idle');
    setNewProjectName('');
    setNewProjectGoalId('');
    setNewProjectDeadline('');
  };

  // Task handlers
  const handleStartAddTask = (projectId: string) => {
    setAddTaskToProjectId(projectId);
    setAddTaskStep('name');
  };

  const handleConfirmAddTask = async () => {
    if (!newTaskName.trim() || !addTaskToProjectId) return;

    try {
      const response = await fetch(`/api/inventory/projects/${addTaskToProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskName,
          duration: newTaskDuration ? parseInt(newTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setNewTaskName('');
        setNewTaskDuration('');
        setAddTaskStep('idle');
        setAddTaskToProjectId(null);
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleCancelAddTask = () => {
    setAddTaskStep('idle');
    setAddTaskToProjectId(null);
    setNewTaskName('');
    setNewTaskDuration('');
  };

  const handleTaskClick = (taskId: string, projectId: string) => {
    if (selectedTask === taskId) {
      setSelectedTask(null);
      setSelectedTaskProjectId(null);
    } else {
      setSelectedTask(taskId);
      setSelectedTaskProjectId(projectId);
      // Deselect project when selecting task
      setSelectedProject(null);
    }
  };

  const handleMoveTaskUp = async () => {
    if (selectedTask === null || selectedTaskProjectId === null || !onProjectsChange) return;

    const project = sortedProjects.find(p => p.id === selectedTaskProjectId);
    if (!project || !project.tasks) return;

    const currentIndex = project.tasks.findIndex(t => (t.id || t._id) === selectedTask);
    if (currentIndex <= 0) return; // Can't move up if already at top

    // Create a new tasks array and swap
    const newTasks = [...project.tasks];
    [newTasks[currentIndex - 1], newTasks[currentIndex]] = [newTasks[currentIndex], newTasks[currentIndex - 1]];

    // Update the project with new tasks order
    const updatedProjects = sortedProjects.map(p =>
      p.id === selectedTaskProjectId
        ? { ...p, tasks: newTasks }
        : p
    );

    // Update UI immediately
    onProjectsChange(updatedProjects);

    // Persist to backend
    try {
      const taskIds = newTasks.map(t => t.id || t._id);
      await fetch(`/api/inventory/projects/${selectedTaskProjectId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      // Revert on error
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    }
  };

  const handleMoveTaskDown = async () => {
    if (selectedTask === null || selectedTaskProjectId === null || !onProjectsChange) return;

    const project = sortedProjects.find(p => p.id === selectedTaskProjectId);
    if (!project || !project.tasks) return;

    const currentIndex = project.tasks.findIndex(t => (t.id || t._id) === selectedTask);
    if (currentIndex < 0 || currentIndex >= project.tasks.length - 1) return; // Can't move down if at bottom

    // Create a new tasks array and swap
    const newTasks = [...project.tasks];
    [newTasks[currentIndex], newTasks[currentIndex + 1]] = [newTasks[currentIndex + 1], newTasks[currentIndex]];

    // Update the project with new tasks order
    const updatedProjects = sortedProjects.map(p =>
      p.id === selectedTaskProjectId
        ? { ...p, tasks: newTasks }
        : p
    );

    // Update UI immediately
    onProjectsChange(updatedProjects);

    // Persist to backend
    try {
      const taskIds = newTasks.map(t => t.id || t._id);
      await fetch(`/api/inventory/projects/${selectedTaskProjectId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      // Revert on error
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    }
  };

  const handleDeselectTask = () => {
    setSelectedTask(null);
    setSelectedTaskProjectId(null);
    setTaskMoveMode(false);
  };

  // Edit project handlers
  const handleStartEditProject = () => {
    if (selectedProject === null) return;
    const project = sortedProjects.find(p => p.id === selectedProject);
    if (!project) return;

    setEditProjectName(project.name || project.content || '');
    setEditProjectDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
    setEditProjectStep('name');
  };

  const handleConfirmEditProject = async () => {
    if (!editProjectName.trim() || selectedProject === null) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProjectName,
          deadline: editProjectDeadline || undefined,
        }),
      });

      if (response.ok) {
        setEditProjectName('');
        setEditProjectDeadline('');
        setEditProjectStep('idle');
        setSelectedProject(null);
        setProjectMoveMode(false);
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to edit project:', error);
    }
  };

  const handleCancelEditProject = () => {
    setEditProjectStep('idle');
    setEditProjectName('');
    setEditProjectDeadline('');
  };

  // Edit task handlers
  const handleStartEditTask = () => {
    if (selectedTask === null || selectedTaskProjectId === null) return;
    const project = sortedProjects.find(p => p.id === selectedTaskProjectId);
    if (!project || !project.tasks) return;

    const task = project.tasks.find(t => (t.id || t._id) === selectedTask);
    if (!task) return;

    setEditTaskName(task.title || task.name || task.content || '');
    setEditTaskDuration(task.duration ? String(task.duration) : '');
    setEditTaskStep('name');
  };

  const handleConfirmEditTask = async () => {
    if (!editTaskName.trim() || selectedTask === null) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTaskName,
          duration: editTaskDuration ? parseInt(editTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setEditTaskName('');
        setEditTaskDuration('');
        setEditTaskStep('idle');
        setSelectedTask(null);
        setSelectedTaskProjectId(null);
        setTaskMoveMode(false);
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to edit task:', error);
    }
  };

  const handleCancelEditTask = () => {
    setEditTaskStep('idle');
    setEditTaskName('');
    setEditTaskDuration('');
  };

  // Event handlers
  const handleEventClick = (eventId: string) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
    }
  };

  const handleStartAddEvent = () => {
    setAddEventStep('name');
    setSelectedEvent(null);
  };

  const handleConfirmAddEvent = async () => {
    if (!newEventName.trim()) return;

    try {
      const response = await fetch('/api/you/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate || undefined,
          time: newEventTime || undefined,
          location: newEventLocation || undefined,
        }),
      });

      if (response.ok) {
        setNewEventName('');
        setNewEventDate('');
        setNewEventTime('');
        setNewEventLocation('');
        setAddEventStep('idle');
        // Refresh events data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const handleCancelAddEvent = () => {
    setAddEventStep('idle');
    setNewEventName('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventLocation('');
  };

  const handleStartEditEvent = () => {
    if (selectedEvent === null) return;
    const event = eventsData.find(e => e.id === selectedEvent);
    if (!event) return;

    setEditEventName(event.name || event.content || '');
    setEditEventDate(event.date || '');
    setEditEventTime(event.time || '');
    setEditEventLocation(event.location || '');
    setEditEventStep('name');
  };

  const handleConfirmEditEvent = async () => {
    if (!editEventName.trim() || selectedEvent === null) return;

    try {
      const response = await fetch(`/api/you/events/${selectedEvent}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEventName,
          date: editEventDate || undefined,
          time: editEventTime || undefined,
          location: editEventLocation || undefined,
        }),
      });

      if (response.ok) {
        setEditEventName('');
        setEditEventDate('');
        setEditEventTime('');
        setEditEventLocation('');
        setEditEventStep('idle');
        setSelectedEvent(null);
        // Refresh events data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to edit event:', error);
    }
  };

  const handleCancelEditEvent = () => {
    setEditEventStep('idle');
    setEditEventName('');
    setEditEventDate('');
    setEditEventTime('');
    setEditEventLocation('');
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent === null) return;

    try {
      const response = await fetch(`/api/you/events/${selectedEvent}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedEvent(null);
        // Refresh events data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleDeselectEvent = () => {
    setSelectedEvent(null);
  };

  // Routine handlers
  const handleRoutineClick = (routineId: string) => {
    if (selectedRoutine === routineId) {
      setSelectedRoutine(null);
    } else {
      setSelectedRoutine(routineId);
    }
  };

  const handleStartAddRoutine = () => {
    setAddRoutineStep('name');
    setSelectedRoutine(null);
  };

  const handleConfirmAddRoutine = async () => {
    if (!newRoutineName.trim()) return;

    try {
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoutineName,
          frequency: newRoutineFrequency || undefined,
        }),
      });

      if (response.ok) {
        setNewRoutineName('');
        setNewRoutineFrequency('');
        setAddRoutineStep('idle');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add routine:', error);
    }
  };

  const handleCancelAddRoutine = () => {
    setAddRoutineStep('idle');
    setNewRoutineName('');
    setNewRoutineFrequency('');
  };

  const handleStartEditRoutine = () => {
    if (selectedRoutine === null) return;
    const routine = routinesData.find(r => r.id === selectedRoutine);
    if (!routine) return;

    setEditRoutineName(routine.name || routine.content || '');
    setEditRoutineFrequency(routine.frequency || '');
    setEditRoutineStep('name');
  };

  const handleConfirmEditRoutine = async () => {
    if (!editRoutineName.trim() || selectedRoutine === null) return;

    try {
      const response = await fetch(`/api/routines/${selectedRoutine}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRoutineName,
          frequency: editRoutineFrequency || undefined,
        }),
      });

      if (response.ok) {
        setEditRoutineName('');
        setEditRoutineFrequency('');
        setEditRoutineStep('idle');
        setSelectedRoutine(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to edit routine:', error);
    }
  };

  const handleCancelEditRoutine = () => {
    setEditRoutineStep('idle');
    setEditRoutineName('');
    setEditRoutineFrequency('');
  };

  const handleDeleteRoutine = async () => {
    if (selectedRoutine === null) return;

    try {
      const response = await fetch(`/api/routines/${selectedRoutine}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedRoutine(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete routine:', error);
    }
  };

  const handleDeselectRoutine = () => {
    setSelectedRoutine(null);
  };

  // Routine task handlers
  const handleRoutineTaskClick = (taskId: string, routineId: string) => {
    if (selectedRoutineTask === taskId) {
      setSelectedRoutineTask(null);
      setSelectedRoutineTaskRoutineId(null);
    } else {
      setSelectedRoutineTask(taskId);
      setSelectedRoutineTaskRoutineId(routineId);
      setSelectedRoutine(null);
    }
  };

  const handleStartAddRoutineTask = (routineId: string) => {
    setAddRoutineTaskToRoutineId(routineId);
    setAddRoutineTaskStep('name');
  };

  const handleConfirmAddRoutineTask = async () => {
    if (!newRoutineTaskName.trim() || !addRoutineTaskToRoutineId) return;

    try {
      const response = await fetch(`/api/routines/${addRoutineTaskToRoutineId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRoutineTaskName,
          duration: newRoutineTaskDuration ? parseInt(newRoutineTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setNewRoutineTaskName('');
        setNewRoutineTaskDuration('');
        setAddRoutineTaskStep('idle');
        setAddRoutineTaskToRoutineId(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add routine task:', error);
    }
  };

  const handleCancelAddRoutineTask = () => {
    setAddRoutineTaskStep('idle');
    setAddRoutineTaskToRoutineId(null);
    setNewRoutineTaskName('');
    setNewRoutineTaskDuration('');
  };

  const handleStartEditRoutineTask = () => {
    if (selectedRoutineTask === null || selectedRoutineTaskRoutineId === null) return;
    const routine = routinesData.find(r => r.id === selectedRoutineTaskRoutineId);
    if (!routine || !routine.tasks) return;

    const task = routine.tasks.find(t => (t.id || t._id) === selectedRoutineTask);
    if (!task) return;

    setEditRoutineTaskName(task.title || task.name || task.content || '');
    setEditRoutineTaskDuration(task.duration ? String(task.duration) : '');
    setEditRoutineTaskStep('name');
  };

  const handleConfirmEditRoutineTask = async () => {
    if (!editRoutineTaskName.trim() || selectedRoutineTask === null) return;

    try {
      const response = await fetch(`/api/tasks/${selectedRoutineTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editRoutineTaskName,
          duration: editRoutineTaskDuration ? parseInt(editRoutineTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setEditRoutineTaskName('');
        setEditRoutineTaskDuration('');
        setEditRoutineTaskStep('idle');
        setSelectedRoutineTask(null);
        setSelectedRoutineTaskRoutineId(null);
        setRoutineTaskMoveMode(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to edit routine task:', error);
    }
  };

  const handleCancelEditRoutineTask = () => {
    setEditRoutineTaskStep('idle');
    setEditRoutineTaskName('');
    setEditRoutineTaskDuration('');
  };

  const handleMoveRoutineTaskUp = async () => {
    if (selectedRoutineTask === null || selectedRoutineTaskRoutineId === null) return;

    const routine = routinesData.find(r => r.id === selectedRoutineTaskRoutineId);
    if (!routine || !routine.tasks) return;

    const currentIndex = routine.tasks.findIndex(t => (t.id || t._id) === selectedRoutineTask);
    if (currentIndex <= 0) return;

    const newTasks = [...routine.tasks];
    [newTasks[currentIndex - 1], newTasks[currentIndex]] = [newTasks[currentIndex], newTasks[currentIndex - 1]];

    try {
      const taskIds = newTasks.map(t => t.id || t._id);
      await fetch(`/api/routines/${selectedRoutineTaskRoutineId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to reorder routine tasks:', error);
    }
  };

  const handleMoveRoutineTaskDown = async () => {
    if (selectedRoutineTask === null || selectedRoutineTaskRoutineId === null) return;

    const routine = routinesData.find(r => r.id === selectedRoutineTaskRoutineId);
    if (!routine || !routine.tasks) return;

    const currentIndex = routine.tasks.findIndex(t => (t.id || t._id) === selectedRoutineTask);
    if (currentIndex < 0 || currentIndex >= routine.tasks.length - 1) return;

    const newTasks = [...routine.tasks];
    [newTasks[currentIndex], newTasks[currentIndex + 1]] = [newTasks[currentIndex + 1], newTasks[currentIndex]];

    try {
      const taskIds = newTasks.map(t => t.id || t._id);
      await fetch(`/api/routines/${selectedRoutineTaskRoutineId}/tasks/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to reorder routine tasks:', error);
    }
  };

  const handleDeselectRoutineTask = () => {
    setSelectedRoutineTask(null);
    setSelectedRoutineTaskRoutineId(null);
    setRoutineTaskMoveMode(false);
  };

  // Admin task handlers
  const handleAdminTaskClick = (taskId: string) => {
    if (selectedAdminTask === taskId) {
      setSelectedAdminTask(null);
    } else {
      setSelectedAdminTask(taskId);
    }
  };

  const handleStartAddAdminTask = () => {
    setAddAdminTaskStep('name');
    setSelectedAdminTask(null);
  };

  const handleConfirmAddAdminTask = async () => {
    if (!newAdminTaskName.trim()) return;

    try {
      const response = await fetch('/api/admin-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAdminTaskName,
          duration: newAdminTaskDuration ? parseInt(newAdminTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setNewAdminTaskName('');
        setNewAdminTaskDuration('');
        setAddAdminTaskStep('idle');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add admin task:', error);
    }
  };

  const handleCancelAddAdminTask = () => {
    setAddAdminTaskStep('idle');
    setNewAdminTaskName('');
    setNewAdminTaskDuration('');
  };

  const handleStartEditAdminTask = () => {
    if (selectedAdminTask === null) return;
    const task = adminTasksData.find(t => (t.id || t._id) === selectedAdminTask);
    if (!task) return;

    setEditAdminTaskName(task.title || task.name || task.content || '');
    setEditAdminTaskDuration(task.duration ? String(task.duration) : '');
    setEditAdminTaskStep('name');
  };

  const handleConfirmEditAdminTask = async () => {
    if (!editAdminTaskName.trim() || selectedAdminTask === null) return;

    try {
      const response = await fetch(`/api/tasks/${selectedAdminTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editAdminTaskName,
          duration: editAdminTaskDuration ? parseInt(editAdminTaskDuration) : undefined,
        }),
      });

      if (response.ok) {
        setEditAdminTaskName('');
        setEditAdminTaskDuration('');
        setEditAdminTaskStep('idle');
        setSelectedAdminTask(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to edit admin task:', error);
    }
  };

  const handleCancelEditAdminTask = () => {
    setEditAdminTaskStep('idle');
    setEditAdminTaskName('');
    setEditAdminTaskDuration('');
  };

  const handleDeleteAdminTask = async () => {
    if (selectedAdminTask === null) return;

    try {
      const response = await fetch(`/api/tasks/${selectedAdminTask}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedAdminTask(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete admin task:', error);
    }
  };

  const handleDeselectAdminTask = () => {
    setSelectedAdminTask(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-mono text-sm text-gray-900">
            {user?.firstName ? `${user.firstName}'s Inventory` : 'Inventory'}
          </h1>
        </div>

        <div className="mt-1 text-xs text-gray-500 font-mono">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })} • {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 space-y-3">

          {/* Goals Section */}
          <div className="">
            <div className="w-full py-3 px-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-gray-600" />
                <span className="font-mono text-sm text-gray-900">Goals</span>
                <span className="text-xs text-gray-400 font-mono">{goalsData.length}</span>
              </div>
            </div>

            <div className="bg-white">
                {/* Goals Filter */}
                <div className="py-2 px-4 flex items-center justify-end">
                  <button
                    onClick={() => setGoalsView(goalsView === 'active' ? 'complete' : 'active')}
                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                  >
                    <span>
                      {goalsView === 'active'
                        ? `Active (${sortedGoals.filter(g => !g.completed).length})`
                        : `Complete (${sortedGoals.filter(g => g.completed).length})`
                      }
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {(() => {
                  const filteredGoals = sortedGoals.filter(goal =>
                    goalsView === 'active' ? !goal.completed : goal.completed
                  );

                  if (filteredGoals.length === 0) {
                    return (
                      <div className="p-4 text-xs text-gray-400 text-center font-mono">
                        {goalsView === 'active' ? 'No active goals' : 'No completed goals'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredGoals.map((goal, idx) => {
                        const isSelected = selectedGoal === goal.id;
                        const formattedDeadline = goal.deadline
                          ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : null;

                        return (
                          <div key={goal.id} className="bg-white">
                            <div
                              onClick={() => handleGoalClick(goal.id)}
                              className={`p-3 flex items-center justify-between touch-manipulation cursor-pointer transition-colors ${
                                isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-xs font-mono font-normal text-gray-400 w-6 flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-sm text-gray-900 font-mono">{goal.content || goal.name}</span>
                              </div>
                              {formattedDeadline && (
                                <span className="text-xs text-gray-400">{formattedDeadline}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Goal Button - Only show in active view */}
                      {addGoalStep === 'idle' && goalsView === 'active' && (
                        <button
                          onClick={handleStartAddGoal}
                          className="w-full p-3 flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-mono">Add Goal</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Projects Section */}
          <div className="">
            <div className="w-full p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <span className="font-mono text-sm text-gray-900">Projects</span>
                <span className="text-xs text-gray-400">{projectsData.length}</span>
              </div>
            </div>

            <div className="bg-white">
                {/* Projects Filter */}
                <div className="py-2 px-4 flex items-center justify-end">
                  <button
                    onClick={() => setProjectsView(projectsView === 'active' ? 'complete' : 'active')}
                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                  >
                    <span>
                      {projectsView === 'active'
                        ? `Active (${sortedProjects.filter(p => !(p.completed || p.metadata?.completed)).length})`
                        : `Complete (${sortedProjects.filter(p => p.completed || p.metadata?.completed).length})`
                      }
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {(() => {
                  const filteredProjects = sortedProjects.filter(project =>
                    projectsView === 'active' ? !(project.completed || project.metadata?.completed) : (project.completed || project.metadata?.completed)
                  );

                  if (filteredProjects.length === 0) {
                    return (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        {projectsView === 'active' ? 'No active projects' : 'No completed projects'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredProjects.map((project, idx) => {
                      const isExpanded = expandedProjects.has(project.id);
                      const isSelected = selectedProject === project.id;
                      const goalName = project.goalId
                        ? goalsData.find(g => g.id === project.goalId)?.name
                        : null;

                      return (
                        <div key={project.id} className={`bg-white ${isSelected ? 'ring-2 ring-gray-500' : ''}`}>
                          <div
                            className={`w-full p-3 flex items-center justify-between touch-manipulation ${
                              isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1" onClick={() => handleProjectClick(project.id)}>
                              <div
                                onClick={(e) => handleChevronClick(e, project.id)}
                                className="p-1 -ml-1 touch-manipulation cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-xs font-mono font-normal text-gray-400 w-6 flex-shrink-0">
                                {idx + 1}
                              </span>
                              <div className="flex flex-col items-start">
                                <span className={`text-sm font-mono ${(project.completed || project.metadata?.completed) ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {project.name || project.content}
                                </span>
                                {goalName && (
                                  <span className={`text-xs flex items-center gap-1 ${(project.completed || project.metadata?.completed) ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <Target className="w-3 h-3" />
                                    {goalName}
                                  </span>
                                )}
                              </div>
                            </div>
                            {project.tasks && project.tasks.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {project.tasks.filter(t => t.completed).length}/{project.tasks.length}
                              </span>
                            )}
                          </div>

                          {isExpanded && (
                            <div>
                              {/* Task Filter */}
                              {project.tasks && project.tasks.length > 0 && (
                                <div className="py-2 px-4 flex items-center justify-end bg-white">
                                  <button
                                    onClick={() => setProjectTasksViewForProject(
                                      project.id,
                                      getProjectTasksView(project.id) === 'active' ? 'complete' : 'active'
                                    )}
                                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                                  >
                                    <span>
                                      {getProjectTasksView(project.id) === 'active'
                                        ? `Active (${project.tasks.filter(t => !t.completed).length})`
                                        : `Complete (${project.tasks.filter(t => t.completed).length})`
                                      }
                                    </span>
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {/* Tasks List */}
                              <div className="pl-6 pb-2 space-y-1 pt-2 border-l-2 border-gray-200 ml-3">
                                {(() => {
                                  if (!project.tasks || project.tasks.length === 0) {
                                    return (
                                      <div className="text-xs text-gray-400 text-center py-2">
                                        No tasks yet
                                      </div>
                                    );
                                  }

                                  const currentTaskView = getProjectTasksView(project.id);
                                  const filteredTasks = project.tasks.filter(task =>
                                    currentTaskView === 'active' ? !task.completed : task.completed
                                  );

                                  if (filteredTasks.length === 0) {
                                    return (
                                      <div className="text-xs text-gray-400 text-center py-2">
                                        {currentTaskView === 'active' ? 'No active tasks' : 'No completed tasks'}
                                      </div>
                                    );
                                  }

                                  return filteredTasks.map((task, idx) => {
                                    const taskId = task.id || task._id;
                                    const isTaskSelected = selectedTask === taskId;

                                    return (
                                      <div
                                        key={taskId || idx}
                                        onClick={() => handleTaskClick(taskId as string, project.id)}
                                        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer touch-manipulation ${
                                          isTaskSelected ? 'bg-blue-100 ring-2 ring-gray-500' : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="text-xs font-mono text-gray-400 w-6 flex-shrink-0">
                                          {idx + 1}
                                        </span>
                                        {task.completed ? (
                                          <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        ) : (
                                          <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                          {task.title || task.name || task.content}
                                        </span>
                                        {task.duration && (
                                          <span className="text-xs text-gray-400 ml-auto">{task.duration}m</span>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}

                                {/* Add Task Button - Only show in incomplete view */}
                                {addTaskToProjectId !== project.id && getProjectTasksView(project.id) === 'incomplete' && (
                                  <button
                                    onClick={() => handleStartAddTask(project.id)}
                                    className="w-full py-1.5 px-2 flex items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation rounded"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-sm">Add Task</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Project Button - Only show in active view */}
                    {addProjectStep === 'idle' && projectsView === 'active' && (
                      <button
                        onClick={handleStartAddProject}
                        className="w-full p-3 flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-mono">Add Project</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Events Section */}
          <div className="">
            <div className="w-full p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-600" />
                <span className="font-mono text-sm text-gray-900">Events</span>
                <span className="text-xs text-gray-400">{eventsData.length}</span>
              </div>
            </div>

            <div className="bg-white">
                {/* Events Filter */}
                <div className="py-2 px-4 flex items-center justify-end">
                  <button
                    onClick={() => setEventsView(eventsView === 'upcoming' ? 'past' : 'upcoming')}
                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                  >
                    <span>
                      {eventsView === 'upcoming'
                        ? `Upcoming (${eventsData.filter(e => {
                            if (!e.date) return true;
                            const eventDate = new Date(e.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return eventDate >= today;
                          }).length})`
                        : `Past (${eventsData.filter(e => {
                            if (!e.date) return false;
                            const eventDate = new Date(e.date);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return eventDate < today;
                          }).length})`
                      }
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const filteredEvents = eventsData.filter(event => {
                    if (!event.date) return eventsView === 'upcoming';
                    const eventDate = new Date(event.date);
                    return eventsView === 'upcoming' ? eventDate >= today : eventDate < today;
                  });

                  if (filteredEvents.length === 0) {
                    return (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        {eventsView === 'upcoming' ? 'No upcoming events' : 'No past events'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredEvents.map((event) => {
                        const isSelected = selectedEvent === event.id;

                        return (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event.id)}
                            className={`bg-white p-3 cursor-pointer touch-manipulation ${
                              isSelected ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-sm text-gray-900">{event.name || event.content}</div>
                            {(event.date || event.time) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {event.date} {event.time && `@ ${event.time}`}
                              </div>
                            )}
                            {event.location && (
                              <div className="text-xs text-gray-400 mt-0.5">{event.location}</div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Event Button - Only show in upcoming view */}
                      {addEventStep === 'idle' && eventsView === 'upcoming' && (
                        <button
                          onClick={handleStartAddEvent}
                          className="w-full p-3 flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-mono">Add Event</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Routines Section */}
          <div className="">
            <div className="w-full p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-gray-600" />
                <span className="font-mono text-sm text-gray-900">Routines</span>
                <span className="text-xs text-gray-400">{routinesData.length}</span>
              </div>
            </div>

            <div className="bg-white">
                {/* Routines Filter */}
                <div className="py-2 px-4 flex items-center justify-end">
                  <button
                    onClick={() => setRoutinesView(routinesView === 'active' ? 'ended' : 'active')}
                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                  >
                    <span>
                      {routinesView === 'active'
                        ? `Active (${routinesData.filter(r => {
                            if (!r.endDate) return true;
                            const endDate = new Date(r.endDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return endDate >= today;
                          }).length})`
                        : `Ended (${routinesData.filter(r => {
                            if (!r.endDate) return false;
                            const endDate = new Date(r.endDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return endDate < today;
                          }).length})`
                      }
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const filteredRoutines = routinesData.filter(routine => {
                    if (!routine.endDate) return routinesView === 'active';
                    const endDate = new Date(routine.endDate);
                    return routinesView === 'active' ? endDate >= today : endDate < today;
                  });

                  if (filteredRoutines.length === 0) {
                    return (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        {routinesView === 'active' ? 'No active routines' : 'No ended routines'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredRoutines.map((routine) => {
                        const isExpanded = expandedRoutines.has(routine.id);
                        const isSelected = selectedRoutine === routine.id;

                        return (
                          <div key={routine.id} className={`bg-white ${isSelected ? 'ring-2 ring-orange-500' : ''}`}>
                            <div
                              className={`w-full p-3 flex items-center justify-between touch-manipulation ${
                                isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1" onClick={() => handleRoutineClick(routine.id)}>
                                <div
                                  onClick={(e) => handleRoutineChevronClick(e, routine.id)}
                                  className="p-1 -ml-1 touch-manipulation cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm text-gray-900 font-mono">{routine.name || routine.content}</span>
                                  {routine.frequency && (
                                    <span className="text-xs text-gray-500">{routine.frequency}</span>
                                  )}
                                </div>
                              </div>
                              {routine.tasks && routine.tasks.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {routine.tasks.length} tasks
                                </span>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="pl-6 pb-2 space-y-1">
                                {routine.tasks && routine.tasks.length > 0 && routine.tasks.map((task, idx) => {
                                  const taskId = task.id || task._id;
                                  const isTaskSelected = selectedRoutineTask === taskId;

                                  return (
                                    <div
                                      key={taskId || idx}
                                      onClick={() => handleRoutineTaskClick(taskId as string, routine.id)}
                                      className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer touch-manipulation ${
                                        isTaskSelected ? 'bg-orange-100 ring-2 ring-orange-500' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <span className="text-xs font-mono font-normal text-gray-400 w-6 flex-shrink-0">
                                        {idx + 1}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        {task.title || task.name || task.content}
                                      </span>
                                      {task.duration && (
                                        <span className="text-xs text-gray-400 ml-auto">{task.duration}m</span>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Add Routine Task Button */}
                                {addRoutineTaskToRoutineId !== routine.id && (
                                  <button
                                    onClick={() => handleStartAddRoutineTask(routine.id)}
                                    className="w-full py-1.5 px-2 flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation rounded"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-sm">Add Task</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Routine Button - Only show in active view */}
                      {addRoutineStep === 'idle' && routinesView === 'active' && (
                        <button
                          onClick={handleStartAddRoutine}
                          className="w-full p-3 flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-mono">Add Routine</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* Admin Tasks Section */}
          <div className="">
            <div className="w-full p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-gray-600" />
                <span className="font-mono text-sm text-gray-900">Backlog</span>
                <span className="text-xs text-gray-400">{adminTasksData.length}</span>
              </div>
            </div>

            <div className="bg-white">
                {/* Admin Tasks Filter */}
                <div className="py-2 px-4 flex items-center justify-end">
                  <button
                    onClick={() => setAdminTasksView(adminTasksView === 'active' ? 'complete' : 'active')}
                    className="flex items-center gap-1 text-xs text-gray-600 font-mono hover:text-gray-900 transition-colors"
                  >
                    <span>
                      {adminTasksView === 'active'
                        ? `Active (${adminTasksData.filter(t => !t.completed).length})`
                        : `Complete (${adminTasksData.filter(t => t.completed).length})`
                      }
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {(() => {
                  const filteredAdminTasks = adminTasksData.filter(task =>
                    adminTasksView === 'active' ? !task.completed : task.completed
                  );

                  if (filteredAdminTasks.length === 0) {
                    return (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        {adminTasksView === 'active' ? 'No active tasks' : 'No completed tasks'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {filteredAdminTasks.map((task) => {
                        const taskId = task.id || task._id;
                        const isSelected = selectedAdminTask === taskId;

                        return (
                          <div
                            key={taskId}
                            onClick={() => handleAdminTaskClick(taskId as string)}
                            className={`bg-white p-3 flex items-center gap-2 cursor-pointer touch-manipulation ${
                              isSelected ? 'ring-2 ring-gray-500 bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            {task.completed ? (
                              <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title || task.name || task.content}
                            </span>
                            {task.duration && (
                              <span className="text-xs text-gray-400">{task.duration}m</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Admin Task Button - Only show in active view */}
                      {addAdminTaskStep === 'idle' && adminTasksView === 'active' && (
                        <button
                          onClick={handleStartAddAdminTask}
                          className="w-full p-3 flex items-center justify-center gap-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-mono">Add Task</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>

        </div>
      </div>

      {/* Admin Task Action Bar */}
      {selectedAdminTask !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="flex items-center justify-around">
            <button
              onClick={handleStartEditAdminTask}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs text-gray-600">Edit</span>
            </button>

            <button
              onClick={handleDeleteAdminTask}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-600"
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-xs">Delete</span>
            </button>

            <button
              onClick={handleDeselectAdminTask}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
            >
              <Circle className="w-6 h-6" />
              <span className="text-xs">Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Goal Action Bar */}
      {selectedGoal !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          {!goalMoveMode ? (
            <div className="flex items-center justify-around">
              <button
                onClick={() => setGoalMoveMode(true)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Move</span>
              </button>

              <button
                onClick={handleDeselectGoal}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={handleMoveGoalUp}
                disabled={sortedGoals.findIndex(g => g.id === selectedGoal) === 0}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Up</span>
              </button>

              <button
                onClick={handleMoveGoalDown}
                disabled={sortedGoals.findIndex(g => g.id === selectedGoal) === sortedGoals.length - 1}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowDown className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Down</span>
              </button>

              <button
                onClick={() => setGoalMoveMode(false)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Routine Task Action Bar */}
      {selectedRoutineTask !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          {!routineTaskMoveMode ? (
            <div className="flex items-center justify-around">
              <button
                onClick={() => setRoutineTaskMoveMode(true)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Move</span>
              </button>

              <button
                onClick={handleStartEditRoutineTask}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs text-gray-600">Edit</span>
              </button>

              <button
                onClick={handleDeselectRoutineTask}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={handleMoveRoutineTaskUp}
                disabled={
                  selectedRoutineTaskRoutineId === null ||
                  routinesData.find(r => r.id === selectedRoutineTaskRoutineId)?.tasks?.findIndex(t => (t.id || t._id) === selectedRoutineTask) === 0
                }
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Up</span>
              </button>

              <button
                onClick={handleMoveRoutineTaskDown}
                disabled={
                  selectedRoutineTaskRoutineId === null ||
                  (() => {
                    const routine = routinesData.find(r => r.id === selectedRoutineTaskRoutineId);
                    if (!routine?.tasks) return true;
                    const currentIndex = routine.tasks.findIndex(t => (t.id || t._id) === selectedRoutineTask);
                    return currentIndex === routine.tasks.length - 1;
                  })()
                }
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowDown className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Down</span>
              </button>

              <button
                onClick={() => setRoutineTaskMoveMode(false)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Routine Action Bar */}
      {selectedRoutine !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="flex items-center justify-around">
            <button
              onClick={handleStartEditRoutine}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs text-gray-600">Edit</span>
            </button>

            <button
              onClick={handleDeleteRoutine}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-600"
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-xs">Delete</span>
            </button>

            <button
              onClick={handleDeselectRoutine}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
            >
              <Circle className="w-6 h-6" />
              <span className="text-xs">Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Event Action Bar */}
      {selectedEvent !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          <div className="flex items-center justify-around">
            <button
              onClick={handleStartEditEvent}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-xs text-gray-600">Edit</span>
            </button>

            <button
              onClick={handleDeleteEvent}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-600"
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-xs">Delete</span>
            </button>

            <button
              onClick={handleDeselectEvent}
              className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
            >
              <Circle className="w-6 h-6" />
              <span className="text-xs">Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Action Bar */}
      {selectedTask !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          {!taskMoveMode ? (
            <div className="flex items-center justify-around">
              <button
                onClick={() => setTaskMoveMode(true)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Move</span>
              </button>

              <button
                onClick={handleStartEditTask}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs text-gray-600">Edit</span>
              </button>

              <button
                onClick={handleDeselectTask}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={handleMoveTaskUp}
                disabled={
                  selectedTaskProjectId === null ||
                  sortedProjects.find(p => p.id === selectedTaskProjectId)?.tasks?.findIndex(t => (t.id || t._id) === selectedTask) === 0
                }
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Up</span>
              </button>

              <button
                onClick={handleMoveTaskDown}
                disabled={
                  selectedTaskProjectId === null ||
                  (() => {
                    const project = sortedProjects.find(p => p.id === selectedTaskProjectId);
                    if (!project?.tasks) return true;
                    const currentIndex = project.tasks.findIndex(t => (t.id || t._id) === selectedTask);
                    return currentIndex === project.tasks.length - 1;
                  })()
                }
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowDown className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Down</span>
              </button>

              <button
                onClick={() => setTaskMoveMode(false)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Project Action Bar */}
      {selectedProject !== null && (
        <div className="fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-50">
          {!projectMoveMode ? (
            <div className="flex items-center justify-around">
              <button
                onClick={() => setProjectMoveMode(true)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Move</span>
              </button>

              <button
                onClick={handleStartEditProject}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs text-gray-600">Edit</span>
              </button>

              <button
                onClick={handleCompleteProject}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors"
              >
                <Check className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Complete</span>
              </button>

              <button
                onClick={handleDeleteProject}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-600"
              >
                <Trash2 className="w-6 h-6" />
                <span className="text-xs">Delete</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                onClick={handleMoveProjectUp}
                disabled={sortedProjects.findIndex(p => p.id === selectedProject) === 0}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowUp className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Up</span>
              </button>

              <button
                onClick={handleMoveProjectDown}
                disabled={sortedProjects.findIndex(p => p.id === selectedProject) === sortedProjects.length - 1}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors disabled:opacity-30"
              >
                <ArrowDown className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Down</span>
              </button>

              <button
                onClick={() => setProjectMoveMode(false)}
                className="flex flex-col items-center gap-1 p-2 touch-manipulation transition-colors text-gray-400"
              >
                <Circle className="w-6 h-6" />
                <span className="text-xs">Done</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Goal Bottom Sheet */}
      {addGoalStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addGoalStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Goal Name</div>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newGoalName.trim()) {
                      setAddGoalStep('deadline');
                    }
                  }}
                  placeholder="Enter goal name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newGoalName.trim()) {
                        setAddGoalStep('deadline');
                      }
                    }}
                    disabled={!newGoalName.trim()}
                    className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddGoal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addGoalStep === 'deadline' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Deadline</div>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddGoalStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddGoal}
                    disabled={!newGoalDeadline}
                    className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Add Goal
                  </button>
                  <button
                    onClick={handleCancelAddGoal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Project Bottom Sheet */}
      {addProjectStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addProjectStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Project Name</div>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      setAddProjectStep('goal');
                    }
                  }}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newProjectName.trim()) {
                        setAddProjectStep('goal');
                      }
                    }}
                    disabled={!newProjectName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddProject}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addProjectStep === 'goal' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Assign to Goal (Optional)</div>
                <select
                  value={newProjectGoalId}
                  onChange={(e) => setNewProjectGoalId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                >
                  <option value="">No Goal</option>
                  {sortedGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.content || goal.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddProjectStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setAddProjectStep('deadline')}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddProject}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addProjectStep === 'deadline' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Deadline (Optional)</div>
                <input
                  type="date"
                  value={newProjectDeadline}
                  onChange={(e) => setNewProjectDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddProjectStep('goal')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddProject}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono"
                  >
                    Add Project
                  </button>
                  <button
                    onClick={handleCancelAddProject}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Task Bottom Sheet */}
      {addTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskName.trim()) {
                      setAddTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newTaskName.trim()) {
                        setAddTaskStep('duration');
                      }
                    }}
                    disabled={!newTaskName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddTask}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={handleCancelAddTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Project Bottom Sheet */}
      {editProjectStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editProjectStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Project Name</div>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editProjectName.trim()) {
                      setEditProjectStep('deadline');
                    }
                  }}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editProjectName.trim()) {
                        setEditProjectStep('deadline');
                      }
                    }}
                    disabled={!editProjectName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditProject}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editProjectStep === 'deadline' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Deadline (Optional)</div>
                <input
                  type="date"
                  value={editProjectDeadline}
                  onChange={(e) => setEditProjectDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditProjectStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditProject}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditProject}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Task Bottom Sheet */}
      {editTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editTaskName.trim()) {
                      setEditTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editTaskName.trim()) {
                        setEditTaskStep('duration');
                      }
                    }}
                    disabled={!editTaskName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={editTaskDuration}
                  onChange={(e) => setEditTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditTask}
                    className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Event Bottom Sheet */}
      {addEventStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addEventStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Event Name</div>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newEventName.trim()) {
                      setAddEventStep('date');
                    }
                  }}
                  placeholder="Enter event name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newEventName.trim()) {
                        setAddEventStep('date');
                      }
                    }}
                    disabled={!newEventName.trim()}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addEventStep === 'date' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Date (Optional)</div>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddEventStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setAddEventStep('time')}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addEventStep === 'time' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Time (Optional)</div>
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddEventStep('date')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setAddEventStep('location')}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addEventStep === 'location' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Location (Optional)</div>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddEventStep('time')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddEvent}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Add Event
                  </button>
                  <button
                    onClick={handleCancelAddEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Event Bottom Sheet */}
      {editEventStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editEventStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Event Name</div>
                <input
                  type="text"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editEventName.trim()) {
                      setEditEventStep('date');
                    }
                  }}
                  placeholder="Enter event name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editEventName.trim()) {
                        setEditEventStep('date');
                      }
                    }}
                    disabled={!editEventName.trim()}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editEventStep === 'date' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Date (Optional)</div>
                <input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditEventStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setEditEventStep('time')}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editEventStep === 'time' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Time (Optional)</div>
                <input
                  type="time"
                  value={editEventTime}
                  onChange={(e) => setEditEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditEventStep('date')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setEditEventStep('location')}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editEventStep === 'location' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Location (Optional)</div>
                <input
                  type="text"
                  value={editEventLocation}
                  onChange={(e) => setEditEventLocation(e.target.value)}
                  placeholder="Enter location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditEventStep('time')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditEvent}
                    className="flex-1 py-2 bg-green-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditEvent}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Routine Bottom Sheet */}
      {addRoutineStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addRoutineStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Routine Name</div>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRoutineName.trim()) {
                      setAddRoutineStep('frequency');
                    }
                  }}
                  placeholder="Enter routine name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newRoutineName.trim()) {
                        setAddRoutineStep('frequency');
                      }
                    }}
                    disabled={!newRoutineName.trim()}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddRoutine}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addRoutineStep === 'frequency' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Frequency (Optional)</div>
                <input
                  type="text"
                  value={newRoutineFrequency}
                  onChange={(e) => setNewRoutineFrequency(e.target.value)}
                  placeholder="e.g., Daily, Weekly..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddRoutineStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddRoutine}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono"
                  >
                    Add Routine
                  </button>
                  <button
                    onClick={handleCancelAddRoutine}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Routine Bottom Sheet */}
      {editRoutineStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editRoutineStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Routine Name</div>
                <input
                  type="text"
                  value={editRoutineName}
                  onChange={(e) => setEditRoutineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editRoutineName.trim()) {
                      setEditRoutineStep('frequency');
                    }
                  }}
                  placeholder="Enter routine name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editRoutineName.trim()) {
                        setEditRoutineStep('frequency');
                      }
                    }}
                    disabled={!editRoutineName.trim()}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditRoutine}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editRoutineStep === 'frequency' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Frequency (Optional)</div>
                <input
                  type="text"
                  value={editRoutineFrequency}
                  onChange={(e) => setEditRoutineFrequency(e.target.value)}
                  placeholder="e.g., Daily, Weekly..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditRoutineStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditRoutine}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditRoutine}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Routine Task Bottom Sheet */}
      {addRoutineTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addRoutineTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={newRoutineTaskName}
                  onChange={(e) => setNewRoutineTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRoutineTaskName.trim()) {
                      setAddRoutineTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newRoutineTaskName.trim()) {
                        setAddRoutineTaskStep('duration');
                      }
                    }}
                    disabled={!newRoutineTaskName.trim()}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddRoutineTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addRoutineTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={newRoutineTaskDuration}
                  onChange={(e) => setNewRoutineTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddRoutineTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddRoutineTask}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={handleCancelAddRoutineTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Routine Task Bottom Sheet */}
      {editRoutineTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editRoutineTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={editRoutineTaskName}
                  onChange={(e) => setEditRoutineTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editRoutineTaskName.trim()) {
                      setEditRoutineTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editRoutineTaskName.trim()) {
                        setEditRoutineTaskStep('duration');
                      }
                    }}
                    disabled={!editRoutineTaskName.trim()}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditRoutineTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editRoutineTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={editRoutineTaskDuration}
                  onChange={(e) => setEditRoutineTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditRoutineTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditRoutineTask}
                    className="flex-1 py-2 bg-orange-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditRoutineTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Admin Task Bottom Sheet */}
      {addAdminTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {addAdminTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={newAdminTaskName}
                  onChange={(e) => setNewAdminTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAdminTaskName.trim()) {
                      setAddAdminTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newAdminTaskName.trim()) {
                        setAddAdminTaskStep('duration');
                      }
                    }}
                    disabled={!newAdminTaskName.trim()}
                    className="flex-1 py-2 bg-gray-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelAddAdminTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {addAdminTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={newAdminTaskDuration}
                  onChange={(e) => setNewAdminTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddAdminTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAddAdminTask}
                    className="flex-1 py-2 bg-gray-600 text-white rounded text-sm font-mono"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={handleCancelAddAdminTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Admin Task Bottom Sheet */}
      {editAdminTaskStep !== 'idle' && (
        <div className="fixed bottom-12 left-0 right-0 px-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-5">
            {editAdminTaskStep === 'name' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Task Name</div>
                <input
                  type="text"
                  value={editAdminTaskName}
                  onChange={(e) => setEditAdminTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editAdminTaskName.trim()) {
                      setEditAdminTaskStep('duration');
                    }
                  }}
                  placeholder="Enter task name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editAdminTaskName.trim()) {
                        setEditAdminTaskStep('duration');
                      }
                    }}
                    disabled={!editAdminTaskName.trim()}
                    className="flex-1 py-2 bg-gray-600 text-white rounded text-sm font-mono disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleCancelEditAdminTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {editAdminTaskStep === 'duration' && (
              <>
                <div className="text-sm font-mono font-normal text-gray-700 mb-3">Duration (Optional)</div>
                <input
                  type="number"
                  value={editAdminTaskDuration}
                  onChange={(e) => setEditAdminTaskDuration(e.target.value)}
                  placeholder="Minutes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditAdminTaskStep('name')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmEditAdminTask}
                    className="flex-1 py-2 bg-gray-600 text-white rounded text-sm font-mono"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditAdminTask}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      <button
        className="fixed bottom-24 right-8 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation hover:bg-gray-800 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
}
