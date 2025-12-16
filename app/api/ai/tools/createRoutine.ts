import { tool } from 'ai';
import { z } from 'zod';
import Routine from '@/models/Routine';
import Task from '@/models/Task';

export const createRoutineTool = (userId: string, routines: any[]) => {
  return tool({
    description: 'Create a new routine with optional tasks',
    inputSchema: z.object({
      name: z.string().describe('Routine name'),
      description: z.string().optional().describe('Routine description'),
      goalId: z.string().optional().describe('ID of the goal this routine supports'),
      tasks: z.array(z.object({
        title: z.string().describe('Task title'),
        duration: z.number().describe('Duration in minutes'),
      })).optional().describe('Tasks for the routine'),
      days: z.array(z.string()).optional().describe('Days of week (e.g., ["Monday", "Wednesday", "Friday"])'),
      earliestStartTime: z.string().optional().describe('Earliest time to start (e.g., "06:00")'),
      latestEndTime: z.string().optional().describe('Latest time to end (e.g., "22:00")'),
      startDate: z.string().optional().describe('Start date (ISO string or YYYY-MM-DD)'),
      endDate: z.string().optional().describe('End date (ISO string or YYYY-MM-DD)'),
    }),
    execute: async ({ name, description, goalId, tasks, days, earliestStartTime, latestEndTime, startDate, endDate }) => {
      try {
        // Set default dates if not provided
        const routineStartDate = startDate ? new Date(startDate) : new Date();
        const routineEndDate = endDate ? new Date(endDate) : new Date(routineStartDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
        
        // Create the routine
        const routine = await Routine.create({
          userId,
          name,
          description: description || null,
          goalId: goalId || null,
          days: days || [],
          startDate: routineStartDate.toISOString().split('T')[0],
          endDate: routineEndDate.toISOString().split('T')[0],
          earliestStartTime: earliestStartTime || null,
          latestEndTime: latestEndTime || null,
          order: routines.length,
        });
        
        // Create tasks if provided
        const createdTasks = [];
        if (tasks && tasks.length > 0) {
          for (const taskData of tasks) {
            const task = await Task.create({
              userId,
              title: taskData.title,
              duration: taskData.duration,
              completed: false,
              routineId: routine._id,
              order: createdTasks.length,
            });
            
            createdTasks.push(task);
            
            // Add task reference to routine
            await Routine.findByIdAndUpdate(
              routine._id,
              { $push: { tasks: task._id } }
            );
          }
        }
        
        return {
          success: true,
          routine: {
            id: routine._id.toString(),
            name: routine.name,
            description: routine.description,
            goalId: routine.goalId,
            days: routine.days,
            schedule: {
              startDate: routine.startDate,
              endDate: routine.endDate,
              timeWindow: earliestStartTime && latestEndTime ? 
                `${earliestStartTime} - ${latestEndTime}` : 
                'Any time',
              days: routine.days.length > 0 ? routine.days.join(', ') : 'Every day',
            },
            taskCount: createdTasks.length,
            tasks: createdTasks.map(t => ({
              id: t._id.toString(),
              title: t.title,
              duration: t.duration,
            })),
          },
          message: `Created routine "${name}" with ${createdTasks.length} tasks`,
        };
      } catch (error) {
        console.error('Error creating routine:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create routine',
        };
      }
    },
  });
};