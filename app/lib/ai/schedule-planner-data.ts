// Schedule Planner Data Preparation
// Fetches and filters data for the AI schedule planning agent

import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import Day from '@/models/Day';
import Block from '@/models/Block';
import Goal from '@/models/Goal';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import Event from '@/models/Event';

export interface SchedulePlannerData {
  currentContext: {
    targetDate: string;
    dayOfWeek: string;
    currentTime: string;
    isToday: boolean;
    planningFromTime: string;
    workdayStart: string;
    workdayEnd: string;
  };
  existingSchedule: {
    existingBlocks: any[];
    pastBlocks: any[];
    futureBlocks: any[];
    incompleteTasks: any[];
  };
  fixedCommitments: {
    eventsToday: any[];
    routinesToday: any[];
  };
  recommendedTasks: {
    urgentTasks: any[];
    carriedOverTasks: any[];
    prioritizedProjectTasks: any[];
    otherTasks: any[];
  };
  conversationHistory: any[];
  preferences: any;
  metadata: any;
}

/**
 * Prepares all data needed for the schedule planner AI
 *
 * @param userId - Clerk user ID
 * @param targetDate - Date in YYYY-MM-DD format
 * @param planningStartTime - Time to start planning from in HH:MM format
 * @param conversationHistory - Previous chat messages for context
 */
export async function prepareSchedulePlannerData(
  userId: string,
  targetDate: string,
  planningStartTime: string,
  conversationHistory: any[] = []
): Promise<SchedulePlannerData> {

  await dbConnect();

  console.log('📊 [Schedule Planner Data] Starting data preparation...');
  console.log('📊 userId:', userId);
  console.log('📊 targetDate:', targetDate);
  console.log('📊 planningStartTime:', planningStartTime);

  // Get user's MongoDB ID
  const user = await User.findOne({ clerkId: userId }).lean();
  if (!user) {
    throw new Error(`User not found for clerkId: ${userId}`);
  }
  const userMongoId = user._id;
  console.log('📊 userMongoId:', userMongoId);

  // Calculate context info
  const now = new Date();
  const targetDateObj = new Date(targetDate);
  const isToday = targetDate === now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5); // Actual current time
  const dayOfWeek = targetDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dayOfWeekShort = targetDateObj.toLocaleDateString('en-US', { weekday: 'short' });

  console.log('📊 isToday:', isToday);
  console.log('📊 currentTime (actual):', currentTime);
  console.log('📊 planningStartTime (for schedule):', planningStartTime);
  console.log('📊 dayOfWeek:', dayOfWeek);

  // Fetch existing day and blocks
  const day = await Day.findOne({
    user: userMongoId,
    date: targetDate
  })
  .populate({
    path: 'blocks',
    populate: { path: 'tasks' }
  })
  .lean();

  const existingBlocks = day?.blocks || [];
  console.log('📊 existingBlocks count:', existingBlocks.length);

  // Separate past and future blocks
  // Note: The most recent block is considered a future block as it might still be running
  const pastBlocks = isToday
    ? existingBlocks.filter((b: any) => {
        const blockEndTime = calculateEndTime(b.time, b.duration);
        return blockEndTime <= currentTime;
      })
    : [];
  const futureBlocks = isToday
    ? existingBlocks.filter((b: any) => {
        const blockEndTime = calculateEndTime(b.time, b.duration);
        return blockEndTime > currentTime;
      })
    : existingBlocks;

  // Helper function to calculate end time
  function calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  console.log('📊 pastBlocks count:', pastBlocks.length);
  console.log('📊 futureBlocks count:', futureBlocks.length);

  // Extract incomplete tasks from past blocks (exclude routine tasks)
  const incompleteTasks = pastBlocks.flatMap((block: any) =>
    (block.tasks || [])
      .filter((t: any) => !t.completed)
      .filter((t: any) => !t.routineId) // Exclude routine tasks - they're day-specific
      .map((t: any) => ({
        id: t._id.toString(),
        title: t.title,
        duration: t.duration,
        completed: t.completed,
        fromBlock: block._id.toString(),
        fromBlockTitle: block.title
      }))
  );

  console.log('📊 incompleteTasks count:', incompleteTasks.length);

  // Fetch events for this date
  const events = await Event.find({
    userId: userId,
    date: targetDateObj
  }).lean();

  console.log('📊 events count:', events.length);

  const eventsToday = events.map((e: any) => ({
    id: e._id.toString(),
    name: e.name,
    time: e.time || '09:00',
    duration: e.duration || 60,
    isAlreadyScheduled: existingBlocks.some((b: any) =>
      b.metadata?.eventId?.toString() === e._id.toString()
    )
  }));

  // Fetch routines and filter for this day of week
  const routines = await Routine.find({ userId: userId })
    .lean();

  console.log('📊 total routines:', routines.length);

  // Fetch tasks for all routines separately (Routine model no longer has tasks array)
  const routineIds = routines.map((r: any) => r._id);
  const routineTasks = await Task.find({ routineId: { $in: routineIds } }).lean();

  // Map tasks to routines
  const routineTasksMap = new Map();
  routineTasks.forEach((task: any) => {
    const routineId = task.routineId?.toString();
    if (routineId) {
      if (!routineTasksMap.has(routineId)) {
        routineTasksMap.set(routineId, []);
      }
      routineTasksMap.get(routineId).push(task);
    }
  });

  // Attach tasks to routines
  routines.forEach((routine: any) => {
    routine.tasks = routineTasksMap.get(routine._id.toString()) || [];
  });

  const routinesToday = routines
    .filter((r: any) => {
      const days = r.days || [];
      console.log('📊 Checking routine:', r.name, 'days:', days, 'looking for:', dayOfWeekShort);
      // Check both short and long format to be flexible
      return days.includes(dayOfWeek) || days.includes(dayOfWeekShort);
    })
    .filter((r: any) => {
      // Only include if still available (not in the past)
      if (!isToday) return true;
      const isStillAvailable = r.startTime >= currentTime;
      console.log('📊 Routine time check:', r.name, 'startTime:', r.startTime, 'currentTime:', currentTime, 'isStillAvailable:', isStillAvailable);
      return isStillAvailable;
    })
    .map((r: any) => ({
      id: r._id.toString(),
      name: r.name,
      time: r.startTime || '07:00',
      duration: r.duration || 60,
      days: r.days,
      isAlreadyScheduled: existingBlocks.some((b: any) =>
        b.metadata?.routineId?.toString() === r._id.toString()
      ),
      isStillAvailable: !isToday || r.startTime >= currentTime,
      tasks: (r.tasks || []).map((t: any) => ({
        id: t._id ? t._id.toString() : t.toString(),
        title: t.title || t.name || 'Task',
        duration: t.duration || 30
      }))
    }));

  console.log('📊 routinesToday count:', routinesToday.length);

  // Fetch goals
  const goals = await Goal.find({ userId: userId })
    .sort({ order: 1 })
    .lean();

  console.log('📊 goals count:', goals.length);

  // Fetch projects
  const projects = await Project.find({
    userId: userId,
    completed: { $ne: true }
  })
  .sort({ order: 1 })
  .lean();

  console.log('📊 projects count:', projects.length);

  // Fetch tasks for all projects separately (Project model no longer has tasks array)
  const projectIds = projects.map((p: any) => p._id);
  const projectTasks = await Task.find({ projectId: { $in: projectIds } }).lean();

  // Map tasks to projects
  const projectTasksMap = new Map();
  projectTasks.forEach((task: any) => {
    const projectId = task.projectId?.toString();
    if (projectId) {
      if (!projectTasksMap.has(projectId)) {
        projectTasksMap.set(projectId, []);
      }
      projectTasksMap.get(projectId).push(task);
    }
  });

  // Attach tasks to projects
  projects.forEach((project: any) => {
    project.tasks = projectTasksMap.get(project._id.toString()) || [];
  });

  // Fetch all incomplete tasks
  const allTasks = await Task.find({
    userId: userMongoId,
    completed: false
  }).lean();

  console.log('📊 allTasks count:', allTasks.length);

  // Build a set of all scheduled task IDs for quick lookup
  const scheduledTaskIds = new Set(
    existingBlocks.flatMap((b: any) =>
      (b.tasks || []).map((t: any) => t._id.toString())
    )
  );
  console.log('📊 scheduledTaskIds count:', scheduledTaskIds.size);

  // Get prioritized project tasks
  // We want enough tasks to potentially fill a day (~8 hours = 480 minutes)
  // Gather tasks from projects in order until we have enough
  const targetTaskMinutes = 480; // 8 hours worth of tasks
  let accumulatedMinutes = 0;
  const prioritizedProjectTasks: any[] = [];

  console.log('📊 Building prioritized project tasks list...');

  // Go through projects in order (they're already sorted by order field)
  for (const project of projects) {
    if (accumulatedMinutes >= targetTaskMinutes) break;

    const projectTasks = project.tasks || [];
    const incompleteTasks = projectTasks.filter((t: any) => !t.completed);

    console.log(`📊 Project: ${project.name}, incomplete tasks: ${incompleteTasks.length}`);

    // Find the goal for this project
    const projectGoal = goals.find((g: any) => g._id.toString() === project.goalId);

    for (const task of incompleteTasks) {
      if (accumulatedMinutes >= targetTaskMinutes) break;

      const taskDuration = task.duration || 60;

      prioritizedProjectTasks.push({
        id: task._id.toString(),
        title: task.title,
        duration: taskDuration,
        project: project.name,
        projectId: project._id.toString(),
        projectOrder: project.order || 9999,
        goal: projectGoal?.content || 'No goal',
        goalId: projectGoal?._id.toString() || null,
        goalOrder: projectGoal?.order || 9999,
        isAlreadyScheduled: scheduledTaskIds.has(task._id.toString())
      });

      accumulatedMinutes += taskDuration;
    }
  }

  console.log('📊 prioritizedProjectTasks count:', prioritizedProjectTasks.length);
  console.log('📊 Total minutes of project tasks:', accumulatedMinutes);

  // Calculate urgent tasks (due within 3 days)
  const urgentTasks = allTasks
    .filter((t: any) => {
      if (!t.dueDate) return false;
      const daysUntil = Math.ceil((new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    })
    .map((t: any) => {
      const project = projects.find((p: any) => p._id.toString() === t.projectId?.toString());
      const goal = goals.find((g: any) => g._id.toString() === t.goalId);
      const daysUntilDue = Math.ceil((new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: t._id.toString(),
        title: t.title,
        duration: t.duration || 60,
        dueDate: t.dueDate,
        daysUntilDue,
        project: project?.name,
        goal: goal?.content,
        isAlreadyScheduled: scheduledTaskIds.has(t._id.toString())
      };
    });

  console.log('📊 urgentTasks count:', urgentTasks.length);

  // Get yesterday's incomplete tasks (if planning for today)
  let carriedOverTasks: any[] = [];
  if (isToday) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const yesterdayDay = await Day.findOne({
      user: userMongoId,
      date: yesterdayDate
    })
    .populate({
      path: 'blocks',
      populate: { path: 'tasks' }
    })
    .lean();

    if (yesterdayDay?.blocks) {
      carriedOverTasks = yesterdayDay.blocks.flatMap((block: any) =>
        (block.tasks || [])
          .filter((t: any) => !t.completed)
          .filter((t: any) => !t.routineId) // Exclude routine tasks - they're day-specific
          .map((t: any) => {
            const project = projects.find((p: any) => p._id.toString() === t.projectId?.toString());
            return {
              id: t._id.toString(),
              title: t.title,
              duration: t.duration || 60,
              scheduledYesterday: true,
              wasNotCompleted: true,
              project: project?.name,
              isAlreadyScheduled: scheduledTaskIds.has(t._id.toString())
            };
          })
      );
    }
  }

  console.log('📊 carriedOverTasks count:', carriedOverTasks.length);

  // Get other available tasks (limit to 15)
  // These are tasks not in other priority categories
  const otherTasks = allTasks
    .filter((t: any) => {
      // Exclude tasks already in other priority categories
      const isUrgent = urgentTasks.some((ut: any) => ut.id === t._id.toString());
      const isCarriedOver = carriedOverTasks.some((ct: any) => ct.id === t._id.toString());
      const isPrioritizedProject = prioritizedProjectTasks.some((pt: any) => pt.id === t._id.toString());
      return !isUrgent && !isCarriedOver && !isPrioritizedProject;
    })
    .slice(0, 15)
    .map((t: any) => {
      const project = projects.find((p: any) => p._id.toString() === t.projectId?.toString());
      return {
        id: t._id.toString(),
        title: t.title || 'Untitled Task',
        duration: t.duration || 60,
        project: project?.name,
        isAlreadyScheduled: scheduledTaskIds.has(t._id.toString())
      };
    });

  console.log('📊 otherTasks count:', otherTasks.length);

  // Prepare user preferences
  const preferences = {
    deepWorkDuration: 90,
    breakFrequency: 90,
    lunchTime: '12:00',
    lunchDuration: 60,
    maxDeepWorkBlocks: 3,
    preferredWorkHours: {
      start: '08:00',
      end: '17:00'
    }
  };

  // Prepare metadata
  const metadata = {
    userName: user.name || 'User',
    daysOnApp: Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    occupation: user.occupation || null,
  };

  // Build final data structure
  const plannerData: SchedulePlannerData = {
    currentContext: {
      targetDate,
      dayOfWeek,
      currentTime,  // Actual current time (for reference)
      isToday,
      planningFromTime: planningStartTime,  // Where the schedule should start from
      workdayStart: '07:00',
      workdayEnd: '18:00',
    },
    existingSchedule: {
      existingBlocks: existingBlocks.map((b: any) => ({
        id: b._id.toString(),
        time: b.time,
        duration: b.duration,
        title: b.title,
        type: b.type,
        isPast: isToday && b.time < currentTime,
        hasCompletedTasks: (b.tasks || []).some((t: any) => t.completed),
        tasks: (b.tasks || []).map((t: any) => ({
          id: t._id.toString(),
          title: t.title,
          duration: t.duration,
          completed: t.completed
        }))
      })),
      pastBlocks: pastBlocks.map((b: any) => ({
        id: b._id.toString(),
        time: b.time,
        title: b.title,
        hasCompletedTasks: (b.tasks || []).some((t: any) => t.completed)
      })),
      futureBlocks: futureBlocks.map((b: any) => ({
        id: b._id.toString(),
        time: b.time,
        title: b.title
      })),
      incompleteTasks,
    },
    fixedCommitments: {
      eventsToday,
      routinesToday,
    },
    recommendedTasks: {
      urgentTasks,
      carriedOverTasks,
      prioritizedProjectTasks,
      otherTasks,
    },
    conversationHistory,
    preferences,
    metadata,
  };

  console.log('📊 [Schedule Planner Data] Data preparation complete!');
  console.log('📊 Summary:');
  console.log('  - Existing blocks:', existingBlocks.length);
  console.log('  - Events today:', eventsToday.length);
  console.log('  - Routines today:', routinesToday.length);
  console.log('  - Urgent tasks:', urgentTasks.length);
  console.log('  - Carried over:', carriedOverTasks.length);
  console.log('  - Prioritized project tasks:', prioritizedProjectTasks.length);
  console.log('  - Other tasks:', otherTasks.length);

  return plannerData;
}
