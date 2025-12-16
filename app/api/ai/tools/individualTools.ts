import dbConnect from '@/lib/mongo';
import Goal from '@/models/Goal';
import Project from '@/models/Project';
import Routine from '@/models/Routine';
import Event from '@/models/Event';
import Task from '@/models/Task';
import Block from '@/models/Block';
import Day from '@/models/Day';
import User from '@/models/User';
import mongoose from 'mongoose';

// Helper to parse time strings
function parseTime(timeStr: string): string {
  const cleaned = timeStr.replace(/\s/g, '').toLowerCase();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?([ap]m)?$/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] || '00';
    const period = match[3];
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  if (/^\d{2}:\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  return '12:00';
}

// ============= GOAL TOOLS =============
export async function createGoal(userId: string, params: any) {
  await dbConnect();
  
  const defaultColors = [
    'from-blue-100 to-blue-200',
    'from-green-100 to-green-200', 
    'from-purple-100 to-purple-200',
    'from-pink-100 to-rose-100',
    'from-yellow-100 to-amber-100',
    'from-indigo-100 to-indigo-200'
  ];
  
  let goalColor = params.color;
  if (!goalColor || goalColor.startsWith('#')) {
    if (params.content.toLowerCase().includes('weight') || params.content.toLowerCase().includes('health')) {
      goalColor = 'from-green-100 to-green-200';
    } else if (params.content.toLowerCase().includes('learn') || params.content.toLowerCase().includes('study')) {
      goalColor = 'from-blue-100 to-blue-200';
    } else if (params.content.toLowerCase().includes('work') || params.content.toLowerCase().includes('project')) {
      goalColor = 'from-purple-100 to-purple-200';
    } else {
      goalColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    }
  }
  
  const goal = new Goal({
    userId: userId,
    content: params.content,
    color: goalColor,
    deadline: params.deadline,
    order: params.order || 0
  });
  
  await goal.save();
  return { success: true, item: goal, message: 'Goal created successfully' };
}

export async function updateGoal(userId: string, params: any) {
  await dbConnect();
  const goal = await Goal.findOneAndUpdate(
    { _id: params.goalId, userId },
    { $set: params.changes },
    { new: true }
  );
  return { success: true, item: goal, message: 'Goal updated successfully' };
}

export async function deleteGoal(userId: string, params: any) {
  await dbConnect();
  await Goal.findOneAndDelete({ _id: params.goalId, userId });
  return { success: true, message: 'Goal deleted successfully' };
}

// ============= PROJECT TOOLS =============
export async function createProject(userId: string, params: any) {
  await dbConnect();

  const project = new Project({
    userId: userId,
    name: params.name,
    goalId: params.goalId || null,
    dueDate: params.dueDate || null,
    completed: false,
    order: params.order || 0
  });

  await project.save();

  // Create tasks if provided
  if (params.tasks && params.tasks.length > 0) {
    for (let i = 0; i < params.tasks.length; i++) {
      const t = params.tasks[i];
      const task = new Task({
        userId: userId,
        title: t.title,
        duration: t.duration || 30,
        completed: false,
        projectId: project._id,
        order: i
      });
      await task.save();
    }
  }

  return { success: true, item: project, message: 'Project created successfully' };
}

export async function addTaskToProject(userId: string, params: any) {
  await dbConnect();

  const project = await Project.findOne({ _id: params.projectId, userId });
  if (!project) throw new Error('Project not found');

  // Handle both single task and array of tasks
  const tasks = params.tasks || (params.task ? [params.task] : []);

  // Get current task count for ordering
  const existingTaskCount = await Task.countDocuments({ projectId: project._id });

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const task = new Task({
      userId: userId,
      title: t.title,
      duration: t.duration || 30,
      completed: false,
      projectId: project._id,
      order: existingTaskCount + i
    });
    await task.save();
  }

  return { success: true, item: project, message: 'Tasks added to project' };
}

export async function updateProject(userId: string, params: any) {
  await dbConnect();
  const project = await Project.findOneAndUpdate(
    { _id: params.projectId, userId },
    { $set: params.changes },
    { new: true }
  );
  return { success: true, item: project, message: 'Project updated successfully' };
}

export async function deleteProject(userId: string, params: any) {
  await dbConnect();
  // Delete associated tasks
  await Task.deleteMany({ projectId: params.projectId });
  await Project.findOneAndDelete({ _id: params.projectId, userId });
  return { success: true, message: 'Project deleted successfully' };
}

// ============= ROUTINE TOOLS =============
export async function createRoutine(userId: string, params: any) {
  await dbConnect();
  
  // Calculate default dates if not provided
  const today = new Date();
  const defaultStartDate = params.startDate || today.toISOString().split('T')[0];
  const sixWeeksLater = new Date(today);
  sixWeeksLater.setDate(sixWeeksLater.getDate() + 42); // 6 weeks
  const defaultEndDate = params.endDate || sixWeeksLater.toISOString().split('T')[0];
  
  const routine = new Routine({
    userId: userId,
    name: params.name,
    description: params.description || null,
    days: params.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    startTime: params.startTime || params.time || '07:00', // Default to 7am
    duration: params.duration || 60, // Default to 60 minutes
    goalId: params.goalId || null,
    order: params.order || 0
  });
  
  await routine.save();
  
  // Create tasks if provided
  if (params.tasks && params.tasks.length > 0) {
    for (let i = 0; i < params.tasks.length; i++) {
      const t = params.tasks[i];
      let taskDuration = t.duration;
      if (!taskDuration) {
        const hourMatch = t.title.match(/(\d+)\s*hour/i);
        if (hourMatch) {
          taskDuration = parseInt(hourMatch[1]) * 60;
        } else if (t.title.toLowerCase().includes('jog')) {
          taskDuration = 60;
        } else {
          taskDuration = 30;
        }
      }

      const task = new Task({
        userId: userId,
        title: t.title,
        duration: taskDuration,
        completed: false,
        routineId: routine._id,
        order: i
      });
      await task.save();
    }
  }

  // Note: Routine schema doesn't have tasks array - tasks are queried via Task.find({ routineId })
  return { success: true, item: routine, message: 'Routine created successfully' };
}

export async function addTaskToRoutine(userId: string, params: any) {
  await dbConnect();

  const routine = await Routine.findOne({ _id: params.routineId, userId });
  if (!routine) throw new Error('Routine not found');

  // Get current task count for ordering
  const existingTaskCount = await Task.countDocuments({ routineId: routine._id });

  const tasksToAdd = [];
  for (let i = 0; i < params.tasks.length; i++) {
    const t = params.tasks[i];
    const task = new Task({
      userId: userId,
      title: t.title,
      duration: t.duration || 30,
      completed: false,
      routineId: routine._id,
      order: existingTaskCount + i
    });
    await task.save();
    tasksToAdd.push(task._id);
  }

  // Note: Routine schema doesn't have tasks array - tasks are queried via Task.find({ routineId })
  return { success: true, item: routine, message: 'Tasks added to routine' };
}

export async function updateRoutine(userId: string, params: any) {
  await dbConnect();
  const routine = await Routine.findOneAndUpdate(
    { _id: params.routineId, userId },
    { $set: params.changes },
    { new: true }
  );
  return { success: true, item: routine, message: 'Routine updated successfully' };
}

export async function deleteRoutine(userId: string, params: any) {
  await dbConnect();
  console.log('🗑️ deleteRoutine called with params:', params);

  // Support both 'id' and 'routineId' parameter names
  const routineId = params.routineId || params.id;

  if (!routineId) {
    console.log('❌ No routineId or id provided in params');
    return { success: false, message: 'No routine ID provided' };
  }

  console.log('🗑️ Deleting routine with ID:', routineId);

  // Delete associated tasks
  const tasksDeleted = await Task.deleteMany({ routineId });
  console.log('🗑️ Deleted tasks:', tasksDeleted.deletedCount);

  const deletedRoutine = await Routine.findOneAndDelete({ _id: routineId, userId });
  console.log('🗑️ Deleted routine:', !!deletedRoutine);

  return {
    success: !!deletedRoutine,
    message: deletedRoutine ? 'Routine deleted successfully' : 'Routine not found',
    data: deletedRoutine
  };
}

// ============= EVENT TOOLS =============
export async function createEvent(userId: string, params: any) {
  await dbConnect();
  
  const event = new Event({
    userId: userId,
    name: params.name,
    goalId: params.goalId || null,
    dueDate: params.dueDate,
    startTime: params.startTime || null,
    endTime: params.endTime || null,
    order: params.order || 0
  });
  
  await event.save();
  return { success: true, item: event, message: 'Event created successfully' };
}

export async function updateEvent(userId: string, params: any) {
  await dbConnect();
  const event = await Event.findOneAndUpdate(
    { _id: params.eventId, userId },
    { $set: params.changes },
    { new: true }
  );
  return { success: true, item: event, message: 'Event updated successfully' };
}

export async function deleteEvent(userId: string, params: any) {
  await dbConnect();
  await Event.findOneAndDelete({ _id: params.eventId, userId });
  return { success: true, message: 'Event deleted successfully' };
}

// ============= TASK TOOLS =============
export async function createTask(userId: string, params: any) {
  await dbConnect();

  const task = new Task({
    userId: userId,
    title: params.title,
    duration: params.duration || 30,
    completed: false,
    projectId: params.projectId || null,
    routineId: params.routineId || null,
    goalId: params.goalId || null,
    dueDate: params.dueDate || null,
    order: params.order || 0
  });

  await task.save();
  return { success: true, item: task, message: 'Task created successfully' };
}

export async function updateTask(userId: string, params: any) {
  await dbConnect();
  const task = await Task.findOneAndUpdate(
    { _id: params.taskId, userId },
    { $set: params.changes },
    { new: true }
  );
  return { success: true, item: task, message: 'Task updated successfully' };
}

export async function completeTask(userId: string, params: any) {
  await dbConnect();
  const task = await Task.findOneAndUpdate(
    { _id: params.taskId, userId },
    { completed: true },
    { new: true }
  );
  return { success: true, item: task, message: 'Task marked as complete' };
}

export async function deleteTask(userId: string, params: any) {
  await dbConnect();
  await Task.findOneAndDelete({ _id: params.taskId, userId });
  return { success: true, message: 'Task deleted successfully' };
}

// ============= SCHEDULE/BLOCK TOOLS =============
export async function addBlock(userId: string, params: any) {
  console.log('[addBlock] Starting with params:', JSON.stringify(params, null, 2));
  console.log('[addBlock] userId:', userId);
  
  await dbConnect();
  
  // userId here is the clerkId from auth
  // Get user ObjectId for Day model
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    console.error('[addBlock] User not found for clerkId:', userId);
    throw new Error('User not found');
  }
  console.log('[addBlock] Found user:', user._id);
  
  // Get or create day - use user._id string for consistency with /api/days/today
  let day = await Day.findOne({ user: user._id.toString(), date: params.date || new Date().toISOString().split('T')[0] });
  if (!day) {
    day = new Day({ 
      user: user._id, 
      date: params.date || new Date().toISOString().split('T')[0], 
      completed: false 
    });
    await day.save();
  }
  
  const blocks = await Block.find({ dayId: day._id }).sort({ index: 1 });
  const newIndex = blocks.length;
  
  const block = new Block({
    dayId: day._id,
    title: params.title,
    time: parseTime(params.time),
    type: params.type || 'deep-work',
    duration: params.duration || 60,
    index: newIndex,
    tasks: []
  });
  
  await block.save();
  
  // If tasks are provided, add them to block
  if (params.tasks && Array.isArray(params.tasks)) {
    console.log(`[addBlock] Processing ${params.tasks.length} tasks for block ${params.title}`);
    for (const taskData of params.tasks) {
      // If task has an ID, it's an existing task
      if (taskData.id || taskData._id) {
        const taskId = taskData.id || taskData._id;
        console.log(`[addBlock] Looking up existing task: ${taskId}`);
        
        try {
          const existingTask = await Task.findById(taskId);
          if (existingTask) {
            // Check if this is a routine task
            if (existingTask.routineId) {
              // ALWAYS clone routine tasks to create instances
              console.log(`[addBlock] Creating instance of routine task: ${existingTask.title}`);
              const taskInstance = new Task({
                userId: userId,
                title: existingTask.title,
                duration: existingTask.duration || 30,
                completed: false,
                routineId: existingTask.routineId,  // Keep reference to source routine
                isScheduled: true  // Mark as a scheduled instance
              });
              await taskInstance.save();
              block.tasks.push(taskInstance._id);
            } else {
              // For non-routine tasks (project tasks, standalone), use the actual task
              console.log(`[addBlock] Using non-routine task: ${existingTask.title}`);
              block.tasks.push(existingTask._id);
            }
          } else {
            console.log(`[addBlock] Task not found with ID ${taskId}, creating new task`);
            // Create the task if ID lookup fails
            const task = new Task({
              userId: userId,
              title: taskData.title,
              duration: taskData.duration || 30,
              completed: false
            });
            await task.save();
            block.tasks.push(task._id);
          }
        } catch (error) {
          console.error(`[addBlock] Error finding task ${taskId}:`, error);
          // Create new task on error
          const task = new Task({
            userId: userId,
            title: taskData.title,
            duration: taskData.duration || 30,
            completed: false
          });
          await task.save();
          block.tasks.push(task._id);
        }
      } else {
        // No ID provided - create new task
        console.log(`[addBlock] Creating new task: ${taskData.title}`);
        const task = new Task({
          userId: userId,
          title: taskData.title,
          duration: taskData.duration || 30,
          completed: false
        });
        await task.save();
        block.tasks.push(task._id);
      }
    }
    
    // Update block duration based on tasks if tasks were added
    if (block.tasks.length > 0) {
      const allTasks = await Task.find({ _id: { $in: block.tasks } });
      block.duration = allTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
      await block.save();
    }
  }
  
  // Add block to day's blocks array
  day.blocks.push(block._id);
  await day.save();
  
  console.log('[addBlock] Successfully created block:', block._id, 'with', block.tasks.length, 'tasks');
  return { success: true, item: block, message: 'Block added to schedule' };
}

export async function updateBlock(userId: string, params: any) {
  await dbConnect();
  
  const block = await Block.findByIdAndUpdate(
    params.blockId,
    { $set: params.changes },
    { new: true }
  );
  
  return { success: true, item: block, message: 'Block updated' };
}

export async function deleteBlock(userId: string, params: any) {
  await dbConnect();
  
  const block = await Block.findById(params.blockId);
  if (!block) throw new Error('Block not found');
  
  const dayId = block.dayId;
  await Block.findByIdAndDelete(params.blockId);
  
  // Reindex remaining blocks
  const remainingBlocks = await Block.find({ dayId }).sort({ index: 1 });
  for (let i = 0; i < remainingBlocks.length; i++) {
    remainingBlocks[i].index = i;
    await remainingBlocks[i].save();
  }
  
  return { success: true, message: 'Block removed from schedule' };
}

export async function addTaskToBlock(userId: string, params: any) {
  await dbConnect();
  
  const block = await Block.findById(params.blockId);
  if (!block) throw new Error('Block not found');
  
  if (params.taskId) {
    // Add existing task
    block.tasks.push(params.taskId);
  } else if (params.task) {
    // Create new task
    const task = new Task({
      userId: userId,
      title: params.task.title,
      duration: params.task.duration || 30,
      completed: false
    });
    await task.save();
    block.tasks.push(task._id);
  }
  
  await block.save();
  await block.populate('tasks');

  return { success: true, item: block, message: 'Task added to block' };
}

// ============= BLOCK TOOLS =============
export async function createBlock(userId: string, params: any) {
  await dbConnect();

  console.log('[createBlock] Creating block:', params);

  // Get or create the day
  let day;
  if (params.dayId) {
    day = await Day.findById(params.dayId);
  } else if (params.date) {
    // Find or create day by date
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error('User not found');
    }

    day = await Day.findOne({ user: user._id, date: params.date });
    if (!day) {
      day = await Day.create({
        user: user._id,
        date: params.date,
        blocks: []
      });
      console.log('[createBlock] Created new day:', day._id);
    }
  } else {
    // Default to today
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date().toISOString().split('T')[0];
    day = await Day.findOne({ user: user._id, date: today });
    if (!day) {
      day = await Day.create({
        user: user._id,
        date: today,
        blocks: []
      });
      console.log('[createBlock] Created new day for today:', day._id);
    }
  }

  // Create tasks if provided
  let taskIds = [];
  if (params.tasks && params.tasks.length > 0) {
    for (const taskData of params.tasks) {
      const task = await Task.create({
        userId,
        title: taskData.title || taskData.name || "New task",
        duration: taskData.duration || 30,
        completed: taskData.completed || false,
        routineId: params.metadata?.routineId || null
      });
      taskIds.push(task._id);
      console.log('[createBlock] Created task:', task._id, task.title);
    }
  }

  // Create the block
  const block = await Block.create({
    dayId: day._id,
    title: params.title,
    time: params.time,
    duration: params.duration,
    type: params.type || 'personal',
    tasks: taskIds,
    index: params.index || 0,
    metadata: params.metadata || {}
  });

  console.log('[createBlock] Created block:', block._id);

  // Add block to day's blocks array
  await Day.findByIdAndUpdate(
    day._id,
    { $push: { blocks: block._id } },
    { new: true }
  );

  // Populate tasks for return
  await block.populate('tasks');

  return {
    success: true,
    item: block,
    message: `Created ${params.type || 'personal'} block: "${params.title}"`,
    dayId: day._id.toString(),
    date: day.date
  };
}