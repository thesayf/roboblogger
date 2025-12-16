// Proof of Concept: Claude Agent SDK with One Tool
// Testing if agent responds after using tools

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import dbConnect from '@/lib/mongo';
import Day from '@/models/Day';
import User from '@/models/User';
import Session from '@/models/Session';
import {
  manageTodos as manageTodosLogic,
  planCUDMultiAgent,
  planScheduleMultiAgent,
  planGoalMultiAgent,
  executeMultiAgent
} from '@/app/lib/ai/multi-agent-tools';
import Goal from '@/models/Goal';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import Event from '@/models/Event';

// Simple read schedule tool
const readScheduleTool = tool(
  'readSchedule',
  'Read the user\'s schedule for any date - past, present, or future. Returns blocks with tasks. Use this to view yesterday\'s schedule, tomorrow\'s schedule, or any specific date.',
  {
    date: z.string().optional().describe('Date in YYYY-MM-DD format (e.g., "2025-11-16" for tomorrow). Accepts "today", "tomorrow", "yesterday", or any YYYY-MM-DD date. Defaults to today if not provided.')
  },
  async ({ date }, _extra) => {
    console.log('📅 readSchedule tool called with date:', date);

    try {
      await dbConnect();

      // Get user from auth
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not authenticated'
          }]
        };
      }

      // Find user in database
      const user = await User.findOne({ clerkId: userId }).lean() as { _id: any } | null;
      if (!user) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not found in database'
          }]
        };
      }

      // Determine target date
      let targetDate: string;
      const today = new Date();

      if (!date || date === 'today') {
        targetDate = today.toISOString().split('T')[0];
      } else if (date === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
      } else if (date === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        targetDate = yesterday.toISOString().split('T')[0];
      } else {
        targetDate = date; // Assume YYYY-MM-DD format
      }

      console.log('📅 Fetching schedule for date:', targetDate, date ? `(from "${date}")` : '(default: today)');

      // Fetch the day with blocks
      const day = await Day.findOne({
        user: user._id,
        date: targetDate
      })
      .populate({
        path: 'blocks',
        populate: { path: 'tasks' }
      })
      .lean() as { blocks: any[] } | null;

      if (!day || !day.blocks || day.blocks.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No schedule found for ${targetDate}. The user has no blocks scheduled for this day.`
          }]
        };
      }

      // Format blocks for display
      const blocks = (day.blocks as any[]).map((b: any) => ({
        time: b.time,
        duration: b.duration,
        title: b.title,
        type: b.type,
        tasks: (b.tasks || []).map((t: any) => ({
          title: t.title,
          duration: t.duration,
          completed: t.completed
        }))
      }));

      const scheduleText = `Schedule for ${targetDate}:\n\n` +
        blocks.map((b: any) =>
          `${b.time} - ${b.title} (${b.duration}min)\n` +
          (b.tasks.length > 0
            ? b.tasks.map((t: any) => `  • ${t.title} (${t.duration}min)${t.completed ? ' ✓' : ''}`).join('\n') + '\n'
            : '')
        ).join('\n');

      console.log('📅 Schedule found:', blocks.length, 'blocks');

      return {
        content: [{
          type: 'text' as const,
          text: scheduleText
        }]
      };

    } catch (error) {
      console.error('📅 Error in readSchedule tool:', error);
      return {
        content: [{
          type: 'text' as const,
          text: `Error reading schedule: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Shared state for todos (will be passed via context)
let currentTodosState: any[] = [];

// Todo management tool
const manageTodosTool = tool(
  'manageTodos',
  'Create or update a todo list for tracking multi-step operations. Use this when the user asks for multiple things.',
  {
    action: z.enum(['create', 'update', 'clear']).describe('Action to perform: create new todos, update existing, or clear all'),
    todos: z.array(z.object({
      action: z.string().describe('Type of action: read, planCUD, planSchedule, execute'),
      description: z.string().describe('What this todo does in user terms'),
      params: z.any().optional().describe('Parameters for the action')
    })).optional().describe('Array of todos to create'),
    todoId: z.string().optional().describe('ID of todo to update (for update action)'),
    status: z.enum(['pending', 'in_progress', 'completed']).optional().describe('New status for the todo')
  },
  async ({ action, todos, todoId, status }, _extra) => {
    console.log('📝 manageTodos called:', { action, todosCount: todos?.length, todoId, status });

    try {
      const result = await manageTodosLogic({
        action,
        todos,
        currentTodos: currentTodosState,
        todoId,
        status
      } as any);

      // Update shared state
      if (result.todos) {
        currentTodosState = result.todos;
        console.log('📝 Updated todos state:', currentTodosState.length, 'items');
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            todos: result.todos,
            message: `${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Cleared'} todo list`
          })
        }]
      };
    } catch (error) {
      console.error('📝 Error in manageTodos:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);

// Search previous chats tool
const searchPreviousChats = tool(
  'searchPreviousChats',
  'Search through previous chat conversations. Use this when the user asks about past discussions or wants to recall previous conversations.',
  {
    keywords: z.string().describe('Keywords to search for in chat messages'),
    startDate: z.string().optional().describe('Start date in YYYY-MM-DD format (optional, searches all dates if not provided)'),
    endDate: z.string().optional().describe('End date in YYYY-MM-DD format (optional, defaults to today)'),
    limit: z.number().optional().describe('Maximum number of results to return (default: 10, max: 50)')
  },
  async ({ keywords, startDate, endDate, limit = 10 }, _extra) => {
    console.log('🔍 searchPreviousChats called with:', { keywords, startDate, endDate, limit });

    try {
      await dbConnect();

      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not authenticated'
          }]
        };
      }

      const user = await User.findOne({ clerkId: userId }).lean() as { _id: any } | null;
      if (!user) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not found'
          }]
        };
      }

      const Chat = (await import('@/models/Chat')).default;

      // Build query
      const query: any = {
        userId: user._id,
        $text: { $search: keywords }
      };

      // Add date range filters
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      // Search with text score for relevance ranking
      const results = await Chat.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
        .limit(Math.min(limit, 50))
        .lean();

      if (results.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No chat messages found matching "${keywords}"${startDate ? ` from ${startDate}` : ''}${endDate ? ` to ${endDate}` : ''}.`
          }]
        };
      }

      // Format results
      let resultText = `Found ${results.length} chat messages matching "${keywords}":\n\n`;

      results.forEach((chat: any, index: number) => {
        const role = chat.role === 'user' ? 'You' : 'Assistant';
        const date = new Date(chat.date).toLocaleDateString();
        const time = new Date(chat.timestamp).toLocaleTimeString();

        resultText += `${index + 1}. [${date} ${time}] ${role}: ${chat.message}\n\n`;
      });

      console.log(`🔍 Found ${results.length} results for "${keywords}"`);

      return {
        content: [{
          type: 'text' as const,
          text: resultText
        }]
      };

    } catch (error) {
      console.error('Error searching chats:', error);
      return {
        content: [{
          type: 'text' as const,
          text: `Error searching chat history: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// Read inventory tool (goals, projects, tasks, events, routines)
const readInventoryTool = tool(
  'readInventory',
  'Read user\'s goals, projects, tasks, events, and routines. Use this when user asks about their goals, tasks, etc.',
  {
    type: z.enum(['goals', 'projects', 'tasks', 'events', 'routines', 'all']).optional().describe('Type of inventory to read, defaults to all'),
    scope: z.enum(['active', 'all']).optional().describe('Scope of data: "active" for current/upcoming items only (default), "all" to include completed/past items')
  },
  async ({ type = 'all', scope = 'active' }, _extra) => {
    console.log('📦 readInventory tool called with type:', type, 'scope:', scope);

    try {
      await dbConnect();

      // Get user from auth
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not authenticated'
          }]
        };
      }

      // Find user in database (verify they exist)
      const user = await User.findOne({ clerkId: userId }).lean() as { _id: any } | null;
      if (!user) {
        return {
          content: [{
            type: 'text' as const,
            text: 'Error: User not found in database'
          }]
        };
      }

      // Build structured inventory response
      const inventory: any = {};

      // Fetch requested data
      if (type === 'goals' || type === 'all') {
        const goals = await Goal.find({ userId }).sort({ order: 'asc' }).lean();
        inventory.goals = goals.map((g: any) => ({
          id: g._id.toString(),
          content: g.content,
          deadline: g.deadline,
          color: g.color
        }));
      }

      if (type === 'projects' || type === 'all') {
        const projectQuery: any = {
          userId,
          isDeleted: { $ne: true }
        };

        if (scope === 'active') {
          projectQuery.completed = { $ne: true };
        }

        const projects = await Project.find(projectQuery)
          .sort({ order: 'asc' })
          .lean();

        console.log('📦 Found', projects.length, 'projects');

        // Fetch tasks for all projects in one query
        const projectIds = projects.map(p => p._id);
        const taskQuery: any = { projectId: { $in: projectIds } };
        if (scope === 'active') {
          taskQuery.completed = { $ne: true };
        }
        const allTasks = await Task.find(taskQuery).lean();

        // Group tasks by projectId
        const tasksByProject = new Map();
        allTasks.forEach((task: any) => {
          const pid = task.projectId.toString();
          if (!tasksByProject.has(pid)) {
            tasksByProject.set(pid, []);
          }
          tasksByProject.get(pid).push(task);
        });

        inventory.projects = projects.map((p: any) => {
          const projectId = p._id.toString();
          const tasks = tasksByProject.get(projectId) || [];

          console.log(`  Project: ${p.name}, tasks: ${tasks.length}`);

          return {
            id: projectId,
            name: p.name,
            completed: p.completed || false,
            dueDate: p.dueDate,
            goalId: p.goalId,
            tasks: tasks.map((t: any) => ({
              id: t._id.toString(),
              title: t.title || t.name,
              duration: t.duration || 30,
              completed: t.completed || false,
              dueDate: t.dueDate
            }))
          };
        });
      }

      if (type === 'tasks' || type === 'all') {
        const standaloneQuery: any = {
          userId,
          projectId: null
        };

        if (scope === 'active') {
          standaloneQuery.completed = { $ne: true };
        }

        const tasks = await Task.find(standaloneQuery).lean();

        inventory.tasks = tasks.map((t: any) => ({
          id: t._id.toString(),
          title: t.title || t.name,
          duration: t.duration || 30,
          completed: t.completed || false,
          dueDate: t.dueDate,
          isScheduled: t.isScheduled
        }));
      }

      if (type === 'routines' || type === 'all') {
        let routines = await Routine.find({ userId }).lean();

        // Filter active routines based on date range if scope is 'active'
        if (scope === 'active') {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          routines = routines.filter((r: any) => {
            const start = r.startDate || '1900-01-01';
            const end = r.endDate || '2100-12-31';
            return today >= start && today <= end;
          });
        }

        inventory.routines = routines.map((r: any) => ({
          id: r._id.toString(),
          name: r.name,
          days: r.days || [],
          startTime: r.startTime,
          duration: r.duration,
          startDate: r.startDate,
          endDate: r.endDate,
          goalId: r.goalId
        }));
      }

      if (type === 'events' || type === 'all') {
        // Build event query based on scope
        const eventQuery: any = { userId };

        if (scope === 'active') {
          // Show upcoming events and today's events
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventQuery.$or = [
            { date: { $gte: today } },
            { dueDate: { $gte: today } },
            { date: { $exists: false }, dueDate: { $exists: false } } // Events with no date
          ];
        }

        const events = await Event.find(eventQuery)
          .sort({ date: 1, dueDate: 1 })
          .lean();

        console.log('📅 Found', events.length, scope === 'active' ? 'upcoming' : 'total', 'events');

        inventory.events = events.map((e: any) => ({
          id: e._id.toString(),
          name: e.name,
          date: e.date || e.dueDate,
          startTime: e.startTime,
          endTime: e.endTime,
          location: e.location,
          zoomLink: e.zoomLink,
          isRecurring: e.isRecurring,
          recurringDays: e.recurringDays,
          goalId: e.goalId
        }));
      }

      console.log('📦 Inventory retrieved');

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(inventory, null, 2)
        }]
      };

    } catch (error) {
      console.error('📦 Error in readInventory tool:', error);
      return {
        content: [{
          type: 'text' as const,
          text: `Error reading inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
);

// ==================== DELETE TOOL ====================
// Simple delete tool - AI should confirm with user when uncertain before calling
const deleteItemsTool = tool(
  'deleteItems',
  'Delete one or more items by their specific IDs. CRITICAL: You must have the correct, current IDs before calling this tool. If you just asked the user for confirmation, call readInventory again to get fresh IDs - never use IDs from memory or previous messages. Before calling this tool, assess your certainty: if you are 100% certain which items to delete (user was specific, or you just showed them), call this tool. If you have ANY doubt, first show the user what would be deleted and ask for confirmation.',
  {
    type: z.enum(['goal', 'project', 'task', 'event', 'routine', 'block']).describe('Type of item to delete'),
    itemIds: z.array(z.string()).describe('Array of item IDs to delete. MUST be current, valid IDs from a recent readInventory call. For single item, pass array with one ID. For multiple items, pass all IDs from the confirmation.')
  },
  async ({ type, itemIds }, _extra) => {
    console.log('🗑️ deleteItems called:', { type, itemIds });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      await dbConnect();

      // Validate itemIds array
      if (!itemIds || itemIds.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: 'No item IDs provided. Please specify which items to delete.'
            })
          }]
        };
      }

      // Get the appropriate model to validate IDs exist
      let Model;
      switch (type) {
        case 'goal':
          Model = (await import('@/models/Goal')).default;
          break;
        case 'project':
          Model = (await import('@/models/Project')).default;
          break;
        case 'task':
          Model = (await import('@/models/Task')).default;
          break;
        case 'event':
          Model = (await import('@/models/Event')).default;
          break;
        case 'routine':
          Model = (await import('@/models/Routine')).default;
          break;
        case 'block':
          Model = (await import('@/models/Block')).default;
          break;
      }

      // VALIDATION: Check if all IDs exist before attempting deletion
      console.log(`🗑️ Validating ${itemIds.length} ${type} ID(s) exist...`);
      const existingItems = await (Model as any).find({
        _id: { $in: itemIds },
        userId
      }).lean();

      console.log(`🗑️ Found ${existingItems.length} existing items out of ${itemIds.length} requested`);

      // Check if any IDs don't exist
      if (existingItems.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: `None of the ${type} IDs exist. The items may have been deleted already, or the IDs are incorrect. Please call readInventory to get current IDs.`,
              requestedIds: itemIds,
              foundCount: 0
            })
          }]
        };
      }

      if (existingItems.length < itemIds.length) {
        const existingIds = existingItems.map((item: any) => item._id.toString());
        const missingIds = itemIds.filter(id => !existingIds.includes(id));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: `Only found ${existingItems.length} out of ${itemIds.length} ${type}(s). ${missingIds.length} ID(s) don't exist. Please call readInventory to get current IDs.`,
              requestedIds: itemIds,
              foundIds: existingIds,
              missingIds: missingIds,
              foundCount: existingItems.length,
              missingCount: missingIds.length
            })
          }]
        };
      }

      console.log(`🗑️ Validation passed! All ${itemIds.length} items exist. Proceeding with deletion...`);

      // Import the individual delete tools
      const tools = await import('@/app/api/ai/tools/individualTools');

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Delete each item by ID
      for (const itemId of itemIds) {
        try {
          let result;

          switch (type) {
            case 'goal':
              result = await tools.deleteGoal(userId, { goalId: itemId });
              break;
            case 'project':
              result = await tools.deleteProject(userId, { projectId: itemId });
              break;
            case 'task':
              result = await tools.deleteTask(userId, { taskId: itemId });
              break;
            case 'event':
              result = await tools.deleteEvent(userId, { eventId: itemId });
              break;
            case 'routine':
              result = await tools.deleteRoutine(userId, { routineId: itemId });
              break;
            case 'block':
              result = await tools.deleteBlock(userId, { blockId: itemId });
              break;
          }

          if (result?.success !== false) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Failed to delete ${type} ${itemId}`);
          }
        } catch (err) {
          console.error(`Error deleting ${type} ${itemId}:`, err);
          errorCount++;
          errors.push(`Error deleting ${type} ${itemId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      console.log(`🗑️ Delete complete: ${successCount} succeeded, ${errorCount} failed out of ${itemIds.length} total`);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: errorCount === 0,
            message: `Deleted ${successCount} ${type}(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            deleted: successCount,
            errors: errorCount,
            errorDetails: errors.length > 0 ? errors : undefined
          })
        }]
      };

    } catch (error) {
      console.error('🗑️ Error in deleteItems:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);

// ==================== CREATE TOOLS ====================
// Tools for creating new items - no confirmation needed (non-destructive)

const createTaskTool = tool(
  'createTask',
  'Create a new task. Tasks can be standalone (backlog) or added to a project. No confirmation needed.',
  {
    title: z.string().describe('Task title/name'),
    duration: z.number().optional().describe('Duration in minutes (default: 30)'),
    projectId: z.string().optional().describe('ID of project to add task to (leave empty for backlog)'),
    goalId: z.string().optional().describe('ID of goal to associate with'),
    dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
    description: z.string().optional().describe('Task description')
  },
  async ({ title, duration, projectId, goalId, dueDate, description }, _extra) => {
    console.log('➕ createTask called:', { title, duration, projectId, goalId, dueDate });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createTask(userId, {
        title,
        duration: duration || 30,
        projectId,
        goalId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        description
      });

      console.log('➕ Task created:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created task: "${title}"`,
            taskId: result.item._id.toString(),
            task: {
              id: result.item._id.toString(),
              title: result.item.title,
              duration: result.item.duration,
              projectId: result.item.projectId?.toString(),
              goalId: result.item.goalId
            }
          })
        }]
      };
    } catch (error) {
      console.error('➕ Error creating task:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create task'
          })
        }]
      };
    }
  }
);

const createEventTool = tool(
  'createEvent',
  'Create a new event. Events are calendar appointments with specific dates and times. If endTime is not provided, it will automatically be set to 1 hour after startTime. No confirmation needed.',
  {
    name: z.string().describe('Event name'),
    date: z.string().describe('Event date in YYYY-MM-DD format'),
    startTime: z.string().optional().describe('Start time in HH:MM format (24-hour). Defaults to 09:00 if not provided.'),
    endTime: z.string().optional().describe('End time in HH:MM format (24-hour). Auto-calculated as startTime + 1 hour if not provided.'),
    location: z.string().optional().describe('Event location'),
    zoomLink: z.string().optional().describe('Zoom or meeting link'),
    goalId: z.string().optional().describe('ID of goal to associate with')
  },
  async ({ name, date, startTime, endTime, location, zoomLink, goalId }, _extra) => {
    console.log('➕ createEvent called:', { name, date, startTime, endTime });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Auto-calculate endTime if not provided (default to 1 hour duration)
      let finalStartTime = startTime || '09:00'; // Default to 9am if not provided
      let finalEndTime = endTime;

      if (!finalEndTime) {
        // Parse startTime and add 1 hour
        const [hours, minutes] = finalStartTime.split(':').map(Number);
        const endHours = (hours + 1) % 24; // Handle wrap-around at midnight
        finalEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log(`➕ Auto-calculated endTime: ${finalStartTime} + 1hr = ${finalEndTime}`);
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createEvent(userId, {
        name,
        dueDate: new Date(date),
        startTime: finalStartTime,
        endTime: finalEndTime,
        location,
        zoomLink,
        goalId
      });

      console.log('➕ Event created:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created event: "${name}" on ${date}`,
            eventId: result.item._id.toString(),
            event: {
              id: result.item._id.toString(),
              name: result.item.name,
              date: date,
              startTime: finalStartTime,
              endTime: finalEndTime
            }
          })
        }]
      };
    } catch (error) {
      console.error('➕ Error creating event:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event'
          })
        }]
      };
    }
  }
);

const createProjectTool = tool(
  'createProject',
  'Create a new project. Projects are containers for related tasks. No confirmation needed.',
  {
    name: z.string().describe('Project name'),
    goalId: z.string().optional().describe('ID of goal to associate with'),
    dueDate: z.string().optional().describe('Project due date in YYYY-MM-DD format'),
    description: z.string().optional().describe('Project description')
  },
  async ({ name, goalId, dueDate, description }, _extra) => {
    console.log('➕ createProject called:', { name, goalId, dueDate });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createProject(userId, {
        name,
        goalId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        description
      });

      console.log('➕ Project created:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created project: "${name}"`,
            projectId: result.item._id.toString(),
            project: {
              id: result.item._id.toString(),
              name: result.item.name,
              goalId: result.item.goalId
            }
          })
        }]
      };
    } catch (error) {
      console.error('➕ Error creating project:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create project'
          })
        }]
      };
    }
  }
);

const createGoalTool = tool(
  'createGoal',
  'Create a new goal. Goals are high-level objectives that projects and tasks can be associated with. The system will auto-select an appropriate color based on the goal content. No confirmation needed.',
  {
    content: z.string().describe('Goal description/content'),
    deadline: z.string().optional().describe('Goal deadline in YYYY-MM-DD format'),
    color: z.string().optional().describe('Color theme (leave empty for auto-selection)')
  },
  async ({ content, deadline, color }, _extra) => {
    console.log('➕ createGoal called:', { content, deadline });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createGoal(userId, {
        content,
        deadline: deadline ? new Date(deadline) : undefined,
        color
      });

      console.log('➕ Goal created:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created goal: "${content}"`,
            goalId: result.item._id.toString(),
            goal: {
              id: result.item._id.toString(),
              content: result.item.content,
              color: result.item.color
            }
          })
        }]
      };
    } catch (error) {
      console.error('➕ Error creating goal:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create goal'
          })
        }]
      };
    }
  }
);

const createBlockTool = tool(
  'createBlock',
  'Create a new time block on the schedule. Blocks are scheduled time slots with a specific start time and duration. Use this to add breaks, meetings, deep work sessions, etc. No confirmation needed.',
  {
    title: z.string().describe('Block title/name (e.g., "Lunch Break", "Team Meeting")'),
    time: z.string().describe('Start time in HH:MM format (24-hour, e.g., "14:00" for 2pm)'),
    duration: z.number().describe('Duration in minutes (e.g., 60 for 1 hour)'),
    type: z.enum(['deep-work', 'admin', 'break', 'meeting', 'personal', 'event', 'routine']).describe('Block type'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
    tasks: z.array(z.object({
      title: z.string(),
      duration: z.number().optional()
    })).optional().describe('Array of tasks to include in this block'),
    location: z.string().optional().describe('Location for the block'),
    zoomLink: z.string().optional().describe('Zoom or meeting link')
  },
  async ({ title, time, duration, type, date, tasks, location, zoomLink }, _extra) => {
    console.log('📅 createBlock called:', { title, time, duration, type, date });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createBlock(userId, {
        title,
        time,
        duration,
        type,
        date,
        tasks,
        metadata: {
          location,
          zoomLink
        }
      });

      console.log('📅 Block created:', result.item._id, 'on', result.date);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created ${type} block: "${title}" at ${time} (${duration}min)`,
            blockId: result.item._id.toString(),
            date: result.date,
            block: {
              id: result.item._id.toString(),
              title: result.item.title,
              time: result.item.time,
              duration: result.item.duration,
              type: result.item.type,
              tasks: result.item.tasks?.map((t: any) => ({
                id: t._id?.toString(),
                title: t.title,
                duration: t.duration
              })) || []
            }
          })
        }]
      };
    } catch (error) {
      console.error('📅 Error creating block:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create block'
          })
        }]
      };
    }
  }
);

const createRoutineTool = tool(
  'createRoutine',
  'Create a new recurring routine. Routines are activities that repeat on specific days of the week (e.g., "Morning workout every Mon/Wed/Fri"). No confirmation needed.',
  {
    name: z.string().describe('Routine name/title'),
    days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).describe('Days of the week this routine occurs'),
    startTime: z.string().describe('Start time in HH:MM format (24-hour)'),
    duration: z.number().optional().describe('Duration in minutes (default: 60)'),
    startDate: z.string().optional().describe('Start date in YYYY-MM-DD format (default: today)'),
    endDate: z.string().optional().describe('End date in YYYY-MM-DD format (default: 6 weeks from start)'),
    goalId: z.string().optional().describe('ID of goal to associate with'),
    description: z.string().optional().describe('Routine description'),
    tasks: z.array(z.object({
      title: z.string(),
      duration: z.number().optional()
    })).optional().describe('Tasks to include in this routine')
  },
  async ({ name, days, startTime, duration, startDate, endDate, goalId, description, tasks }, _extra) => {
    console.log('🔄 createRoutine called:', { name, days, startTime, duration });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.createRoutine(userId, {
        name,
        days,
        startTime,
        duration: duration || 60,
        startDate,
        endDate,
        goalId,
        description,
        tasks
      });

      console.log('🔄 Routine created:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Created routine: "${name}" (${days.join(', ')})`,
            routineId: result.item._id.toString(),
            routine: {
              id: result.item._id.toString(),
              name: result.item.name,
              days: result.item.days,
              startTime: result.item.startTime,
              duration: result.item.duration
            }
          })
        }]
      };
    } catch (error) {
      console.error('🔄 Error creating routine:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create routine'
          })
        }]
      };
    }
  }
);

// ==================== UPDATE TOOLS ====================

const updateTaskTool = tool(
  'updateTask',
  'Update an existing task. Can modify title, duration, due date, completion status, etc. Must provide the task ID.',
  {
    taskId: z.string().describe('ID of the task to update'),
    title: z.string().optional().describe('New task title'),
    duration: z.number().optional().describe('New duration in minutes'),
    dueDate: z.string().optional().describe('New due date in YYYY-MM-DD format'),
    completed: z.boolean().optional().describe('Mark as completed/incomplete'),
    description: z.string().optional().describe('New task description'),
    projectId: z.string().optional().describe('Move to different project (or null to remove from project)')
  },
  async ({ taskId, title, duration, dueDate, completed, description, projectId }, _extra) => {
    console.log('✏️ updateTask called:', { taskId, title, duration, dueDate, completed });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (title !== undefined) changes.title = title;
      if (duration !== undefined) changes.duration = duration;
      if (dueDate !== undefined) changes.dueDate = dueDate ? new Date(dueDate) : null;
      if (completed !== undefined) changes.completed = completed;
      if (description !== undefined) changes.description = description;
      if (projectId !== undefined) changes.projectId = projectId || null;

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateTask(userId, { taskId, changes });

      console.log('✏️ Task updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated task successfully`,
            taskId: result.item._id.toString(),
            task: {
              id: result.item._id.toString(),
              title: result.item.title,
              duration: result.item.duration,
              completed: result.item.completed
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating task:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update task'
          })
        }]
      };
    }
  }
);

const updateEventTool = tool(
  'updateEvent',
  'Update an existing event. Can modify name, date, times, location, etc. Must provide the event ID.',
  {
    eventId: z.string().describe('ID of the event to update'),
    name: z.string().optional().describe('New event name'),
    date: z.string().optional().describe('New event date in YYYY-MM-DD format'),
    startTime: z.string().optional().describe('New start time in HH:MM format'),
    endTime: z.string().optional().describe('New end time in HH:MM format'),
    location: z.string().optional().describe('New location'),
    zoomLink: z.string().optional().describe('New zoom/meeting link')
  },
  async ({ eventId, name, date, startTime, endTime, location, zoomLink }, _extra) => {
    console.log('✏️ updateEvent called:', { eventId, name, date, startTime, endTime });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (name !== undefined) changes.name = name;
      if (date !== undefined) changes.dueDate = new Date(date);
      if (startTime !== undefined) changes.startTime = startTime;
      if (endTime !== undefined) changes.endTime = endTime;
      if (location !== undefined) changes.location = location;
      if (zoomLink !== undefined) changes.zoomLink = zoomLink;

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateEvent(userId, { eventId, changes });

      console.log('✏️ Event updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated event successfully`,
            eventId: result.item._id.toString(),
            event: {
              id: result.item._id.toString(),
              name: result.item.name,
              startTime: result.item.startTime,
              endTime: result.item.endTime
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating event:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update event'
          })
        }]
      };
    }
  }
);

const updateProjectTool = tool(
  'updateProject',
  'Update an existing project. Can modify name, deadline, goal association, etc. Must provide the project ID.',
  {
    projectId: z.string().describe('ID of the project to update'),
    name: z.string().optional().describe('New project name'),
    dueDate: z.string().optional().describe('New due date in YYYY-MM-DD format'),
    goalId: z.string().optional().describe('Associate with different goal (or null to remove)'),
    completed: z.boolean().optional().describe('Mark as completed/incomplete')
  },
  async ({ projectId, name, dueDate, goalId, completed }, _extra) => {
    console.log('✏️ updateProject called:', { projectId, name, dueDate, goalId, completed });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (name !== undefined) changes.name = name;
      if (dueDate !== undefined) changes.dueDate = dueDate ? new Date(dueDate) : null;
      if (goalId !== undefined) changes.goalId = goalId || null;
      if (completed !== undefined) changes.completed = completed;

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateProject(userId, { projectId, changes });

      console.log('✏️ Project updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated project successfully`,
            projectId: result.item._id.toString(),
            project: {
              id: result.item._id.toString(),
              name: result.item.name,
              completed: result.item.completed
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating project:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update project'
          })
        }]
      };
    }
  }
);

const updateGoalTool = tool(
  'updateGoal',
  'Update an existing goal. Can modify content, deadline, color, etc. Must provide the goal ID.',
  {
    goalId: z.string().describe('ID of the goal to update'),
    content: z.string().optional().describe('New goal content/description'),
    deadline: z.string().optional().describe('New deadline in YYYY-MM-DD format'),
    color: z.string().optional().describe('New color theme')
  },
  async ({ goalId, content, deadline, color }, _extra) => {
    console.log('✏️ updateGoal called:', { goalId, content, deadline, color });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (content !== undefined) changes.content = content;
      if (deadline !== undefined) changes.deadline = deadline ? new Date(deadline) : null;
      if (color !== undefined) changes.color = color;

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateGoal(userId, { goalId, changes });

      console.log('✏️ Goal updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated goal successfully`,
            goalId: result.item._id.toString(),
            goal: {
              id: result.item._id.toString(),
              content: result.item.content,
              deadline: result.item.deadline
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating goal:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update goal'
          })
        }]
      };
    }
  }
);

const updateBlockTool = tool(
  'updateBlock',
  'Update an existing schedule block. Can modify title, time, duration, type, etc. Must provide the block ID.',
  {
    blockId: z.string().describe('ID of the block to update'),
    title: z.string().optional().describe('New block title'),
    time: z.string().optional().describe('New start time in HH:MM format'),
    duration: z.number().optional().describe('New duration in minutes'),
    type: z.enum(['deep-work', 'admin', 'break', 'meeting', 'personal', 'event', 'routine']).optional().describe('New block type'),
    location: z.string().optional().describe('New location'),
    zoomLink: z.string().optional().describe('New zoom/meeting link')
  },
  async ({ blockId, title, time, duration, type, location, zoomLink }, _extra) => {
    console.log('✏️ updateBlock called:', { blockId, title, time, duration, type });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (title !== undefined) changes.title = title;
      if (time !== undefined) changes.time = time;
      if (duration !== undefined) changes.duration = duration;
      if (type !== undefined) changes.type = type;

      // Handle metadata updates
      if (location !== undefined || zoomLink !== undefined) {
        changes.metadata = {};
        if (location !== undefined) changes.metadata.location = location;
        if (zoomLink !== undefined) changes.metadata.zoomLink = zoomLink;
      }

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateBlock(userId, { blockId, changes });

      console.log('✏️ Block updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated block successfully`,
            blockId: result.item._id.toString(),
            block: {
              id: result.item._id.toString(),
              title: result.item.title,
              time: result.item.time,
              duration: result.item.duration,
              type: result.item.type
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating block:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update block'
          })
        }]
      };
    }
  }
);

const updateRoutineTool = tool(
  'updateRoutine',
  'Update an existing routine. Can modify name, days, start time, duration, dates, etc. Must provide the routine ID.',
  {
    routineId: z.string().describe('ID of the routine to update'),
    name: z.string().optional().describe('New routine name'),
    description: z.string().optional().describe('New routine description'),
    days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional().describe('New days of the week'),
    startTime: z.string().optional().describe('New start time in HH:MM format'),
    duration: z.number().optional().describe('New duration in minutes'),
    startDate: z.string().optional().describe('New start date in YYYY-MM-DD format'),
    endDate: z.string().optional().describe('New end date in YYYY-MM-DD format'),
    goalId: z.string().optional().describe('New goal ID to link to (or null to remove link)')
  },
  async ({ routineId, name, description, days, startTime, duration, startDate, endDate, goalId }, _extra) => {
    console.log('✏️ updateRoutine called:', { routineId, name, days, startTime, duration });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Build changes object
      const changes: any = {};
      if (name !== undefined) changes.name = name;
      if (description !== undefined) changes.description = description;
      if (days !== undefined) changes.days = days;
      if (startTime !== undefined) changes.startTime = startTime;
      if (duration !== undefined) changes.duration = duration;
      if (startDate !== undefined) changes.startDate = startDate;
      if (endDate !== undefined) changes.endDate = endDate;
      if (goalId !== undefined) changes.goalId = goalId || null;

      const tools = await import('@/app/api/ai/tools/individualTools');
      const result = await tools.updateRoutine(userId, { routineId, changes });

      console.log('✏️ Routine updated:', result.item._id);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Updated routine successfully`,
            routineId: result.item._id.toString(),
            routine: {
              id: result.item._id.toString(),
              name: result.item.name,
              days: result.item.days,
              startTime: result.item.startTime,
              duration: result.item.duration
            }
          })
        }]
      };
    } catch (error) {
      console.error('✏️ Error updating routine:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update routine'
          })
        }]
      };
    }
  }
);

// ==================== PLAN CUD TOOL (DISABLED FOR NOW) ====================
// Commenting out planCUD to test simpler delete flow first
/*
const planCUDTool = tool(
  'planCUD',
  'Generate a plan for creating, updating, or deleting goals, projects, tasks, events, routines, or schedule blocks. ALWAYS use this before making changes.',
  {
    reason: z.string().describe('What the user wants to create, update, or delete'),
    date: z.string().optional().describe('Date for schedule operations (YYYY-MM-DD)')
  },
  async ({ reason, date }, _extra) => {
    console.log('🔧 planCUD tool called:', { reason, date });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const result = await planCUDMultiAgent(userId, { reason, date });

      console.log('🔧 Plan generated:', {
        success: result.success,
        type: result.type,
        requiresConfirmation: result.requiresConfirmation
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      console.error('🔧 Error in planCUD:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);
*/

// Plan Schedule tool (daily schedule planning) - COMMENTED OUT FOR TESTING
// Testing conversational approach with createBlock instead
/*
const planScheduleTool = tool(
  'planSchedule',
  'Generate a daily schedule plan by organizing tasks and events into time blocks. Use this when the user wants to plan their day.',
  {
    targetDate: z.string().describe('Date to plan in YYYY-MM-DD format'),
    planningStartTime: z.string().describe('What time to start planning from (HH:MM format, e.g., "09:00")'),
    mode: z.enum(['create', 'update']).optional().describe('Create new schedule or update existing. Defaults to create.'),
    existingPlan: z.any().optional().describe('Current schedule (required if mode is update)'),
    userChanges: z.string().optional().describe('Description of changes to make (required if mode is update)')
  },
  async ({ targetDate, planningStartTime, mode, existingPlan, userChanges }, _extra) => {
    console.log('📅 planSchedule tool called:', { targetDate, planningStartTime, mode });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const result = await planScheduleMultiAgent(userId, {
        targetDate,
        planningStartTime,
        mode,
        existingPlan,
        userChanges
      });

      console.log('📅 Schedule plan generated:', {
        success: result.success,
        type: result.type,
        requiresConfirmation: result.requiresConfirmation
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      console.error('📅 Error in planSchedule:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);
*/

// Plan Goal tool (goal planning with projects, tasks, routines)
const planGoalTool = tool(
  'planGoal',
  'Create a comprehensive goal plan with projects, tasks, and routines to achieve a specific goal. Use this when the user wants to achieve something over time.',
  {
    goalDescription: z.string().describe('What the user wants to achieve'),
    timeline: z.string().optional().describe('How long to achieve the goal (e.g., "3 months", "1 year"). Defaults to appropriate timeframe.')
  },
  async ({ goalDescription, timeline }, _extra) => {
    console.log('🎯 planGoal tool called:', { goalDescription, timeline });

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      const result = await planGoalMultiAgent(userId, {
        goalDescription,
        timeline
      });

      console.log('🎯 Goal plan generated:', {
        success: result.success,
        type: result.type,
        requiresConfirmation: result.requiresConfirmation
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      console.error('🎯 Error in planGoal:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);

// Execute tool (executes confirmed plans)
const executeTool = tool(
  'execute',
  'Execute a previously confirmed plan. ONLY call this after the user has confirmed the plan with "yes", "go ahead", etc.',
  {
    plan: z.any().describe('The plan object to execute (from a previous planCUD/planSchedule/planGoal call)')
  },
  async ({ plan }, _extra) => {
    console.log('🚀 execute tool called');

    try {
      const { userId } = auth();
      if (!userId) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ success: false, error: 'Not authenticated' })
          }]
        };
      }

      // Parse plan if it's a string (Claude Agent SDK serializes objects to JSON strings)
      let parsedPlan = plan;
      if (typeof plan === 'string') {
        console.log('🚀 Plan is a string, parsing to object...');
        parsedPlan = JSON.parse(plan);
      }

      console.log('🚀 Executing plan with type:', parsedPlan.type);

      const result = await executeMultiAgent(userId, { plan: parsedPlan });

      console.log('🚀 Execution result:', {
        success: result.success,
        type: parsedPlan.type
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      console.error('🚀 Error in execute:', error);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }]
      };
    }
  }
);

// Create MCP server with the tools
const agentServer = createSdkMcpServer({
  name: 'agent-tools',
  version: '1.0.0',
  tools: [
    readScheduleTool,
    readInventoryTool,
    searchPreviousChats,
    manageTodosTool,
    deleteItemsTool,        // NEW: Simple delete with inline confirmation
    createTaskTool,         // NEW: Create new tasks
    createEventTool,        // NEW: Create new events
    createProjectTool,      // NEW: Create new projects
    createGoalTool,         // NEW: Create new goals
    createBlockTool,        // NEW: Create schedule blocks
    createRoutineTool,      // NEW: Create recurring routines
    updateTaskTool,         // NEW: Update existing tasks
    updateEventTool,        // NEW: Update existing events
    updateProjectTool,      // NEW: Update existing projects
    updateGoalTool,         // NEW: Update existing goals
    updateBlockTool,        // NEW: Update existing blocks
    updateRoutineTool,      // NEW: Update existing routines
    // planCUDTool,         // DISABLED: Testing simpler delete-only flow
    // planScheduleTool,    // DISABLED: Testing conversational approach with createBlock
    // planGoalTool,        // DISABLED: Conversational planning works better - planGoal generates generic templates that ignore context
    // executeTool          // DISABLED: Testing if main agent can execute plans directly with CRUD tools
  ]
});

export async function POST(req: NextRequest) {
  console.log("\n🧪 AGENT POC - Request received");

  try {
    // Auth check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const { message, context } = await req.json();
    console.log("🧪 User message:", message);

    // Connect to database and load session
    await dbConnect();
    const conversationId = context?.conversationId;
    let sessionData = { todos: [], pendingPlan: null };

    if (conversationId) {
      const sessionId = `${userId}-${conversationId}`;
      console.log('🔍 Loading session:', sessionId);

      const session = await Session.findOne({ sessionId });
      if (session) {
        sessionData = {
          todos: session.todos || [],
          pendingPlan: session.pendingPlan || null,
        };
        console.log(`📚 Loaded session: ${sessionData.todos.length} todos, has plan: ${!!sessionData.pendingPlan}`);
      } else {
        console.log('📭 No existing session found');
      }
    } else {
      console.log('⚠️ No conversationId provided - session will not be persisted');
    }

    // Initialize shared state from session
    currentTodosState = sessionData.todos;
    console.log('🧪 Initialized todos state:', currentTodosState.length, 'items');

    // Load today's chat history for context
    const Chat = (await import('@/models/Chat')).default;
    const user = await User.findOne({ clerkId: userId }).lean() as { _id: any } | null;

    let chatHistory = '';
    if (user && conversationId) {
      const today = new Date().toISOString().split('T')[0];

      // Load ALL of today's chat messages
      const todaysChats = await Chat.find({
        userId: user._id,
        date: today
      })
      .sort({ timestamp: 1 })
      .lean();

      if (todaysChats.length > 0) {
        console.log(`💬 Loaded ${todaysChats.length} chat messages from today (full conversation)`);
        chatHistory = '\n[PREVIOUS CONVERSATION TODAY]:\n';
        todaysChats.forEach((chat: any) => {
          const role = chat.role === 'user' ? 'User' : 'Assistant';
          chatHistory += `${role}: ${chat.message}\n`;
        });
        chatHistory += '\n[END PREVIOUS CONVERSATION]\n\n';
      }
    }

    // Build prompt with context
    let promptToSend = chatHistory + message;

    // If there's a pending plan, inject it into the prompt
    if (sessionData.pendingPlan) {
      console.log('📋 Pending plan detected - injecting into prompt');
      console.log('📋 Plan type:', sessionData.pendingPlan.type);

      promptToSend = `[CONTEXT: You previously generated a plan that requires user confirmation]

PENDING PLAN (you must pass this EXACT object to the execute tool):
\`\`\`json
${JSON.stringify(sessionData.pendingPlan, null, 2)}
\`\`\`

USER'S RESPONSE: ${message}

INSTRUCTIONS:
1. Interpret the user's response in context of the pending plan
2. If they confirm (yes, go ahead, do it, looks good, etc.):
   - Call execute tool with parameter: plan = <the exact JSON object above>
   - CRITICAL: The plan parameter must include the "type" field (currently: "${sessionData.pendingPlan.type}")
3. If they deny (no, cancel, nevermind), acknowledge and ask what they'd like instead
4. If they modify (change X, but not Y), acknowledge the limitation and suggest alternatives

EXAMPLE of how to call execute:
execute({ plan: ${JSON.stringify(sessionData.pendingPlan)} })`;
    }

    // Create query with Claude Agent SDK
    console.log("🧪 Starting Claude Agent SDK query...");
    const result = query({
      prompt: promptToSend,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        maxTurns: 50, // Increased to allow inline confirmation and multi-step operations
        mcpServers: {
          agentTools: agentServer
        },
        systemPrompt: `You are a helpful, conversational schedule assistant. Think of yourself as a personal assistant having a natural conversation with the user.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD format)

When creating routines, events, projects, or setting dates, use today's date as your reference point. For routines, set startDate to today or later. For events and deadlines, use realistic future dates based on today.

COMMUNICATION STYLE (CRITICAL):

1. **Be conversational and cohesive** - Your responses should flow naturally from the previous conversation
2. **Never narrate your internal process** - Don't say "I found", "I'm checking", "Let me search"
3. **Maintain context** - If you just told the user about items, don't act like you're discovering them again
4. **Be concise** - Get to the point without technical explanations

GOOD vs BAD Examples:

❌ BAD: "I found 2 tasks to delete. Should I proceed?"
✅ GOOD: "Should I delete both tasks?"

❌ BAD: "Let me check your schedule for today..."
✅ GOOD: "Here's your schedule for today:"

❌ BAD: "I've searched through your inventory and found..."
✅ GOOD: "You have 3 projects and 5 tasks."

❌ BAD: "I'll help you delete those two admin tasks. Let me first confirm what will be deleted."
✅ GOOD: "Should I delete these two tasks?"

CONVERSATION FLOW:

When user asks about their data:
- Just show them the information naturally
- Example: "You have 2 tasks: Send the letter and Write the complaint"

When user asks to delete something you JUST showed them:
- Don't re-announce what they already know
- Just ask for confirmation: "Should I delete them?" or "Delete both?"
- If there are critical details (count, names), mention briefly: "Delete these 2 tasks?"

When user confirms deletion:
- Execute it and confirm: "Done!" or "Deleted both tasks"
- Don't over-explain what you did

TOOL USAGE (Technical - User Never Sees This):

**READ OPERATIONS:**
- readSchedule, readInventory, searchPreviousChats
- Execute immediately, present results naturally

**DELETE OPERATIONS - UNCERTAINTY-BASED CONFIRMATION:**

CRITICAL: Assess your certainty BEFORE calling deleteItems:

✅ **100% CERTAIN** (delete immediately):
- User was very specific: "Delete task 'Call dentist'"
- You just showed them the items: User asks "what tasks?" → You show 2 tasks → User says "delete them"
- Only 1 item matches: "Delete the meeting" and there's only 1 meeting
- You're in active conversation about specific items

⚠️ **ANY DOUBT** (confirm first, DON'T call deleteItems yet):
- Vague reference: "Delete those tasks from yesterday"
- Unclear scope: "Delete old tasks" (how old?)
- Large batch: More than 5 items would be deleted
- Unclear pronoun: "Delete that thing", "delete those"
- Haven't shown them recently: "Delete my admin tasks" (which ones?)

**When uncertain:**
1. Call readInventory to find the items
2. Show user exactly what would be deleted
3. Ask: "Delete these [X] items?" or list them and ask confirmation
4. Mark the delete todo as in_progress (don't complete it yet)
5. Wait for user to confirm

**After user confirms:**
1. Call deleteItems immediately WITH THE ID FROM THE JSON RESPONSE
2. Mark delete todo as completed
3. Check for pending todos
4. Continue with next pending task (don't stop!)

**CRITICAL - USING ITEM IDs:**
- readInventory returns JSON with an "id" field for each item
- deleteItems accepts an ARRAY of IDs (itemIds parameter)
- ALWAYS extract the "id" values from readInventory JSON, NOT titles/names
- For single item: pass array with one ID: itemIds=['abc123']
- For multiple items: pass array with all IDs: itemIds=['abc123', 'def456', 'ghi789']

Examples:
✅ CORRECT - Single item:
  readInventory returns: {"id": "6918dd847940fdf06ee57e74", "title": "Send letter"}
  Call: deleteItems(type='task', itemIds=['6918dd847940fdf06ee57e74'])

✅ CORRECT - Multiple items:
  readInventory returns: [{"id": "abc123", "title": "Task 1"}, {"id": "def456", "title": "Task 2"}]
  Call: deleteItems(type='task', itemIds=['abc123', 'def456'])

❌ WRONG - Using titles:
  Call: deleteItems(type='task', itemIds=['Send letter', 'Task 1'])

❌ WRONG - Not using array:
  Call: deleteItems(type='task', itemId='abc123')  // itemId not itemIds!

**PLANNING OPERATIONS:**
- planSchedule executes immediately
- No confirmation needed (non-destructive)

CRITICAL RULES:
1. Be conversational, not robotic
2. Don't narrate your process
3. Maintain conversation continuity
4. Be concise and helpful

CONVERSATIONAL EXAMPLES:

Example 1 - Certain Delete (just showed them):
User: "What tasks do I have?"
You: *calls readInventory - gets [{"id":"abc123","title":"Send letter"},{"id":"def456","title":"Write complaint"}]*
You: "You have 2 tasks: Send the letter and Write the complaint (both 30 min)"
User: "Delete both please"
You: *100% certain - just showed them* *calls deleteItems(type='task', itemIds=['abc123','def456'])* "Done!"

Example 2 - Uncertain Delete (need to confirm):
User: "Delete my admin tasks"
You: *uncertain - which admin tasks?* *calls readInventory - gets [{"id":"abc123","title":"Send letter"},{"id":"def456","title":"Write complaint"}]*
You: "Delete these 2 tasks? Send letter and Write complaint"
User: "yes"
You: *now certain* *calls deleteItems(type='task', itemIds=['abc123','def456'])* "Done!"

Example 3 - Multi-step with Delete:
User: "Delete my admin tasks and create a timeblock"
You: *creates todos: ["Delete admin tasks", "Create timeblock"]*
You: *uncertain about tasks* *calls readInventory* "Delete these 2 tasks: Send letter and Write complaint?"
User: "yes"
You: *calls deleteItems* *marks delete todo completed* *sees "Create timeblock" pending* *calls createTimeblock* "Deleted 2 tasks and created your timeblock"

Example 4 - Vague Delete:
User: "Delete those old tasks"
You: *very uncertain - which tasks? how old?* *calls readInventory* "Delete these 8 tasks from last week? [lists them]"
User: "yes"
You: *calls deleteItems* "Done! Deleted 8 tasks"

Example 5 - Specific Delete (certain):
User: "Delete task 'Call dentist'"
You: *100% certain - specific name* *calls deleteItems immediately* "Done!"

AVAILABLE TOOLS:
- readSchedule(date) - Read schedule for any date
- readInventory(type, scope) - Read goals/projects/tasks/events/routines (returns JSON with IDs)
- searchPreviousChats(keywords, startDate, endDate, limit) - Search chat history
- deleteItems(type, itemIds) - Delete items by ID array (assess certainty first!)
- createTask(title, duration?, projectId?, goalId?, dueDate?, description?) - Create new task
- createEvent(name, date, startTime?, endTime?, location?, zoomLink?, goalId?) - Create new event
- createProject(name, goalId?, dueDate?, description?) - Create new project
- createGoal(content, deadline?, color?) - Create new goal (auto-colors if not specified)
- createBlock(title, time, duration, type, date?, tasks?, location?, zoomLink?) - Create schedule block
- createRoutine(name, days, startTime, duration?, startDate?, endDate?, goalId?, tasks?) - Create recurring routine
- updateTask(taskId, title?, duration?, dueDate?, completed?, description?, projectId?) - Update task
- updateEvent(eventId, name?, date?, startTime?, endTime?, location?, zoomLink?) - Update event
- updateProject(projectId, name?, dueDate?, goalId?, completed?) - Update project
- updateGoal(goalId, content?, deadline?, color?) - Update goal
- updateBlock(blockId, title?, time?, duration?, type?, location?, zoomLink?) - Update block
- manageTodos(action, todos) - Track multi-step operations

ROUTINES vs PROJECTS:
- ROUTINE: Recurring atomic habits done on a schedule (daily weigh-in, weekly meal prep, track food intake)
- PROJECT: One-time work with multiple tasks (research recipes, build website, plan vacation)

GOAL PLANNING:
Use conversational approach with direct CRUD tools (createGoal, createProject, createTask, createRoutine, createEvent). Discuss with the user and create items directly based on their specific needs.

IMPORTANT - Goal Linking: When creating projects, tasks, or routines related to a goal, ALWAYS pass the goalId parameter to link them. After creating a goal, save its ID and include it when calling createProject, createTask, and createRoutine.

SCHEDULE PLANNING:
When a user wants to plan their day/schedule:
1. Use readInventory to see available tasks, routines, and events
2. Discuss with user what they want to schedule and when (start time, priorities)
3. Use createBlock to add time blocks to their schedule - call it for each block you want to create
4. Calculate time slots sequentially (if starting at 9am with 30min task, next block starts at 9:30am)
5. Use appropriate block types: 'deep-work' for focused tasks, 'admin' for small tasks, 'break' for breaks, 'personal' for routines

Remember: Always respond to the user. Don't just call tools and stop.`,
        permissionMode: 'bypassPermissions' // For POC, bypass permission checks
      }
    });

    // Collect all messages from the async generator
    console.log("🧪 Collecting messages from agent...");
    const messages = [];
    let finalResult = null;
    let lastAssistantText = '';
    let detectedPendingPlan: any = null;

    for await (const msg of result) {
      console.log("🧪 Message type:", msg.type);

      if (msg.type === 'assistant') {
        // Extract text from assistant message
        const content = msg.message.content;
        if (Array.isArray(content)) {
          const textBlocks = content.filter(block => block.type === 'text');
          if (textBlocks.length > 0) {
            lastAssistantText = textBlocks.map(b => b.text).join('\n');
            console.log("🧪 Assistant text:", lastAssistantText);
          }
        }
      }

      if (msg.type === 'user' && msg.message.role === 'user') {
        // Check tool results for plans that need confirmation
        const content = msg.message.content;

        console.log('🔍 Checking user message for plan. Content type:', typeof content, 'Is array:', Array.isArray(content));

        // Content might be an array of blocks or a string
        let textContent = '';
        if (Array.isArray(content)) {
          console.log('🔍 Content is array with', content.length, 'blocks');

          // Log the types of all blocks
          content.forEach((block: any, i: number) => {
            console.log(`🔍 Block ${i} type:`, block.type, 'keys:', Object.keys(block));
          });

          // Check for tool_result type blocks (this is what planCUD returns)
          const toolResultBlocks = content.filter((block: any) => block.type === 'tool_result');
          if (toolResultBlocks.length > 0) {
            console.log('🔍 Found', toolResultBlocks.length, 'tool_result blocks');
            // Tool results have content inside them
            const toolContent = toolResultBlocks[0].content;
            if (typeof toolContent === 'string') {
              textContent = toolContent;
            } else if (Array.isArray(toolContent)) {
              const textBlock = toolContent.find((b: any) => b.type === 'text');
              if (textBlock) {
                textContent = textBlock.text;
              }
            }
            console.log('🔍 Tool result content preview:', textContent.substring(0, 100));
          }

          // Also check for regular text blocks (for backward compatibility)
          const textBlocks = content.filter((block: any) => block.type === 'text');
          if (textBlocks.length > 0 && !textContent) {
            console.log('🔍 Found', textBlocks.length, 'text blocks');
            textContent = textBlocks[0].text;
            console.log('🔍 Text content preview:', textContent.substring(0, 100));
          }
        } else if (typeof content === 'string') {
          textContent = content;
          console.log('🔍 Content is string, preview:', textContent.substring(0, 100));
        }

        if (textContent) {
          try {
            const parsed = JSON.parse(textContent);
            console.log('🔍 Successfully parsed JSON. Keys:', Object.keys(parsed));
            console.log('🔍 requiresConfirmation:', parsed.requiresConfirmation);
            console.log('🔍 has data:', !!parsed.data);

            if (parsed.requiresConfirmation && parsed.data) {
              console.log('⏸️ PLAN DETECTED - requires confirmation');
              // Save the full plan structure that execute expects
              detectedPendingPlan = {
                type: parsed.type,  // e.g., 'cud', 'schedule', 'goal_plan'
                data: parsed.data   // The actual plan data with changes, summary, stats, etc.
              };
              console.log('⏸️ Plan type:', detectedPendingPlan.type);
              console.log('⏸️ Plan summary:', parsed.message);
            }
          } catch (e) {
            console.log('🔍 Not JSON or parse error:', e instanceof Error ? e.message : 'unknown');
          }
        } else {
          console.log('🔍 No text content found in user message');
        }
      }

      if (msg.type === 'result') {
        console.log("🧪 Final result subtype:", msg.subtype);
        finalResult = msg;
        if (msg.subtype === 'success') {
          console.log("🧪 Success! Result text:", msg.result);
          console.log("🧪 Turns used:", msg.num_turns);
        } else {
          console.log("🧪 Error or limit:", msg.subtype);
          console.log("🧪 Turns used:", msg.num_turns);
        }
      }

      messages.push(msg);
    }

    console.log("🧪 Total messages collected:", messages.length);
    console.log("🧪 Final assistant text:", lastAssistantText);
    console.log("🧪 Final result exists:", !!finalResult);
    console.log("🧪 Final result subtype:", finalResult?.subtype);

    // Determine response
    let responseText = lastAssistantText;
    if (!responseText && finalResult?.subtype === 'success') {
      responseText = finalResult.result;
    }
    if (!responseText) {
      responseText = finalResult ?
        `Agent stopped (${finalResult.subtype}) without generating response` :
        "Agent completed but no result received";
    }

    console.log("🧪 Sending response to client:", responseText);

    // Save conversation to Chat model for history
    if (conversationId && user) {
      const Chat = (await import('@/models/Chat')).default;
      const today = new Date().toISOString().split('T')[0];

      try {
        // Find or create today's day
        const day = await Day.findOne({
          user: user._id,
          date: today
        });

        if (day) {
          // Save user message
          await Chat.create({
            userId: user._id,
            dayId: day._id,
            date: today,
            role: 'user',
            message: message,
            timestamp: new Date()
          });

          // Save assistant response
          await Chat.create({
            userId: user._id,
            dayId: day._id,
            date: today,
            role: 'ai',
            message: responseText,
            timestamp: new Date()
          });

          console.log(`💬 Chat history saved for ${today}`);
        } else {
          console.log(`⚠️ No day found for ${today}, chat not saved`);
        }
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }

    // Save session to database if we have a conversationId
    if (conversationId) {
      const sessionId = `${userId}-${conversationId}`;
      try {
        await Session.findOneAndUpdate(
          { sessionId },
          {
            userId,
            conversationId,
            sessionId,
            todos: currentTodosState,
            pendingPlan: detectedPendingPlan, // Save detected plan
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          { upsert: true, new: true }
        );
        console.log(`💾 Session saved: ${sessionId}, todos: ${currentTodosState.length}, has plan: ${!!detectedPendingPlan}`);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    } else {
      console.log('⚠️ Session not saved - no conversationId');
    }

    // Return response to frontend
    return NextResponse.json({
      success: true,
      response: responseText,
      todos: currentTodosState, // Include todos in response
      todoStatus: currentTodosState.length > 0 ? {
        total: currentTodosState.length,
        completed: currentTodosState.filter((t: any) => t.status === 'completed').length,
        pending: currentTodosState.filter((t: any) => t.status === 'pending').length,
      } : undefined,
      awaitingConfirmation: !!detectedPendingPlan, // Tell frontend we need confirmation
      pendingPlan: detectedPendingPlan, // Include plan for frontend to display
      messages: messages.map(m => ({
        type: m.type,
        content: m.type === 'assistant' ? JSON.stringify(m.message.content) :
                 m.type === 'result' && m.subtype === 'success' ? m.result :
                 m.type === 'user' ? JSON.stringify(m.message) : null
      })),
      debug: {
        totalMessages: messages.length,
        finalResult: finalResult ? {
          subtype: finalResult.subtype,
          numTurns: finalResult.num_turns,
          totalCost: finalResult.total_cost_usd
        } : null
      }
    });

  } catch (error) {
    console.error("🧪 Error in AGENT POC:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
