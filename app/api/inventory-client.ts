// Client-side API functions for inventory operations

import { Goal, Project } from '@/app/types/inventory';

// Goal API functions
export const goalAPI = {
  // Create a new goal
  create: async (goal: { name: string; deadline?: Date; order: number }) => {
    const response = await fetch('/api/you/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });

    if (!response.ok) {
      throw new Error('Failed to create goal');
    }

    return response.json();
  },

  // Update an existing goal
  update: async (id: string, updates: { content?: string; deadline?: Date; order?: number }) => {
    const response = await fetch('/api/you/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });

    if (!response.ok) {
      throw new Error('Failed to update goal');
    }

    return response.json();
  },

  // Delete a goal
  delete: async (id: string) => {
    const response = await fetch(`/api/you/goals?id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete goal');
    }

    return response.json();
  },

  // Reorder goals
  reorder: async (goals: { id: string; order: number }[]) => {
    const response = await fetch('/api/you/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals })
    });

    if (!response.ok) {
      throw new Error('Failed to reorder goals');
    }

    return response.json();
  }
};

// Project API functions (placeholder for now)
export const projectAPI = {
  create: async (project: { name: string; deadline?: Date; goalId?: string }) => {
    const response = await fetch('/api/you/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  },

  update: async (id: string, updates: Partial<Project>) => {
    const response = await fetch('/api/you/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/you/projects?id=${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    return response.json();
  }
};

// Load all inventory data
export const loadInventoryData = async () => {
  const response = await fetch('/api/you');

  if (!response.ok) {
    throw new Error('Failed to load inventory data');
  }

  const data = await response.json();

  return {
    goals: data.goals || [],
    projects: data.sections?.projects || [],
    routines: data.sections?.routines || [],
    adminTasks: data.sections?.backlog || [],
    events: data.sections?.events || []
  };
};