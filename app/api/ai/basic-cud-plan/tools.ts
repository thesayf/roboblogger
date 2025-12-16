// Tools for the BASIC_CUD_PLAN layer - Smart data fetching for CUD operations
import dbConnect from '@/lib/mongo';
import Goal from '@/models/Goal';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import Event from '@/models/Event';
import Day from '@/models/Day';
import Block from '@/models/Block';
import User from '@/models/User';

/**
 * Detect what data is needed based on keywords in the user's message
 */
export function detectDataNeeds(message: string): { needsSchedule: boolean; needsInventory: boolean } {
  const messageLower = message.toLowerCase();

  // Schedule/timeline keywords
  const scheduleKeywords = [
    'block', 'time', 'lunch', 'break', 'schedule', 'timeline',
    'move', 'shift', 'reschedule', 'earlier', 'later', 'morning', 'afternoon',
    'evening', 'today', 'tomorrow', 'clock', 'hour', 'minute'
  ];

  // Inventory keywords
  const inventoryKeywords = [
    'routine', 'goal', 'project', 'task', 'event',
    'create', 'add', 'delete', 'remove', 'update', 'modify',
    'habit', 'objective', 'appointment', 'meeting'
  ];

  const needsSchedule = scheduleKeywords.some(keyword => messageLower.includes(keyword));
  const needsInventory = inventoryKeywords.some(keyword => messageLower.includes(keyword));

  // If neither is detected, default to inventory (most common case)
  if (!needsSchedule && !needsInventory) {
    return { needsSchedule: false, needsInventory: true };
  }

  return { needsSchedule, needsInventory };
}

/**
 * Fetch schedule/timeline data for a specific date
 */
export async function fetchScheduleForCUD(mongoUserId: string, date?: string) {
  console.log('\n📅 === FETCHING SCHEDULE FOR CUD ===');
  console.log('📅 MongoDB userId:', mongoUserId);
  console.log('📅 Date:', date || 'today');

  try {
    await dbConnect();

    // Parse date - default to today
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

    console.log('📅 Target date resolved to:', targetDate);

    // Get user to ensure we have correct ID
    const user = await User.findById(mongoUserId).lean();
    if (!user) {
      console.log('📅 User not found');
      return { blocks: [], date: targetDate };
    }

    // Fetch the day with blocks and tasks
    const day = await Day.findOne({
      user: mongoUserId,
      date: targetDate
    })
    .populate({
      path: 'blocks',
      populate: { path: 'tasks' }
    })
    .lean();

    if (!day || !day.blocks || day.blocks.length === 0) {
      console.log('📅 No schedule found for date:', targetDate);
      return { blocks: [], date: targetDate };
    }

    console.log('📅 Found', day.blocks.length, 'blocks');

    // Format blocks for AI consumption
    const blocks = (day.blocks as any[]).map((b: any) => ({
      id: b._id.toString(),
      time: b.time,
      duration: b.duration,
      title: b.title,
      type: b.type,
      tasks: (b.tasks || []).map((t: any) => ({
        id: t._id?.toString(),
        title: t.title,
        duration: t.duration,
        completed: t.completed
      })),
      metadata: b.metadata || {}
    }));

    console.log('📅 === SCHEDULE FETCH COMPLETE ===\n');
    return { blocks, date: targetDate, dayId: day._id.toString() };

  } catch (error) {
    console.error('📅 Error fetching schedule:', error);
    throw error;
  }
}

export async function fetchInventoryForCUD(mongoUserId: string, clerkUserId: string, context: any) {
  console.log('\n🔍 === FETCHING INVENTORY FOR CUD ===');
  console.log('🔍 MongoDB userId:', mongoUserId);
  console.log('🔍 Clerk userId:', clerkUserId);
  
  try {
    await dbConnect();
    
    // Fetch all relevant data
    // ALL models use Clerk ID (string)
    const [goals, projects, standaloneTasksOnly, routines, events] = await Promise.all([
      Goal.find({ userId: clerkUserId })
        .sort({ order: 'asc' })
        .lean(),
      Project.find({
        userId: clerkUserId,
        isDeleted: { $ne: true },
        completed: { $ne: true }
      })
        .sort({ order: 'asc' })
        .lean(),
      Task.find({
        userId: clerkUserId,
        completed: { $ne: true },
        projectId: null // Only standalone tasks
      })
        .lean(),
      Routine.find({ userId: clerkUserId })
        .lean(),
      Event.find({ userId: clerkUserId })
        .sort({ date: -1, dueDate: -1 })
        .lean()
    ]);

    // Fetch tasks for projects and routines in separate queries
    const projectIds = projects.map(p => p._id);
    const routineIds = routines.map(r => r._id);

    const [projectTasks, routineTasks] = await Promise.all([
      Task.find({
        projectId: { $in: projectIds },
        completed: { $ne: true }
      }).lean(),
      Task.find({
        routineId: { $in: routineIds }
      }).lean()
    ]);

    // Group tasks by projectId and routineId
    const tasksByProject = new Map();
    projectTasks.forEach((task: any) => {
      const pid = task.projectId.toString();
      if (!tasksByProject.has(pid)) {
        tasksByProject.set(pid, []);
      }
      tasksByProject.get(pid).push(task);
    });

    const tasksByRoutine = new Map();
    routineTasks.forEach((task: any) => {
      const rid = task.routineId.toString();
      if (!tasksByRoutine.has(rid)) {
        tasksByRoutine.set(rid, []);
      }
      tasksByRoutine.get(rid).push(task);
    });

    const tasks = standaloneTasksOnly;

    console.log('🔍 Inventory found:');
    console.log(`  - Goals: ${goals.length}`);
    console.log(`  - Projects: ${projects.length}`);
    console.log(`  - Standalone Tasks: ${tasks.length}`);
    console.log(`  - Routines: ${routines.length}`);
    console.log(`  - Upcoming Events: ${events.length}`);

    // Format for AI consumption
    const inventory = {
      goals: goals.map(g => ({
        id: g._id.toString(),
        content: g.content,
        order: g.order,
        deadline: g.deadline
      })),
      projects: projects.map(p => {
        const projectId = p._id.toString();
        const projectTaskList = tasksByProject.get(projectId) || [];
        return {
          id: projectId,
          name: p.name,
          goalId: p.goalId,
          order: p.order,
          completed: p.completed,
          tasks: projectTaskList.map((t: any) => ({
            id: t._id?.toString(),
            title: t.title,
            duration: t.duration,
            completed: t.completed
          }))
        };
      }),
      tasks: tasks.map(t => ({
        id: t._id.toString(),
        title: t.title,
        duration: t.duration || 30,
        dueDate: t.dueDate,
        completed: t.completed
      })),
      routines: routines.map(r => {
        const routineId = r._id.toString();
        const routineTaskList = tasksByRoutine.get(routineId) || [];
        return {
          id: routineId,
          name: r.name,
          days: r.days,
          startTime: r.startTime,
          duration: r.duration,
          tasks: routineTaskList.map((t: any) => ({
            id: t._id?.toString(),
            title: t.title || t.name,
            duration: t.duration
          }))
        };
      }),
      events: events.map(e => ({
        id: e._id.toString(),
        name: e.name,
        date: e.date || e.dueDate,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        isRecurring: e.isRecurring,
        recurringDays: e.recurringDays
      }))
    };

    console.log('🔍 === INVENTORY FETCH COMPLETE ===\n');
    return inventory;
    
  } catch (error) {
    console.error('🔍 Error fetching inventory:', error);
    throw error;
  }
}