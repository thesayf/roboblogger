import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import User from "@/models/User";
import Goal from "@/models/Goal";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import Event from "@/models/Event";

// Helper function to convert minutes (number) to duration string
function convertMinutesToString(minutes: number | undefined): string {
  if (!minutes) return "30m"; // Default
  
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1h" : `${hours}h`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}.${mins === 30 ? '5' : mins}h`;
  }
}

// GET - Fetch all user data for the You page
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch all data in parallel
    const [user, goals, projects, tasks, routines, events] = await Promise.all([
      User.findOne({ clerkId: userId }),
      Goal.find({ userId }).sort({ order: 1 }),
      Project.find({ userId, completed: { $ne: true } }).sort({ order: 1 }), // Only active projects (tasks queried separately)
      Task.find({ userId, projectId: null, routineId: null }).sort({ order: 1 }), // Backlog tasks only
      Routine.find({ userId }).sort({ order: 1 }), // Tasks queried separately
      Event.find({ userId }).sort({ order: 1 })
    ]);
    
    // Also check for routines that might have been saved with MongoDB user._id
    let additionalRoutines = [];
    if (user && user._id) {
      const mongoUserId = user._id.toString();
      additionalRoutines = await Routine.find({
        userId: mongoUserId,
        _id: { $nin: routines.map(r => r._id) } // Exclude already found routines
      }).sort({ order: 1 }); // Tasks queried separately
      
      if (additionalRoutines.length > 0) {
        console.log(`Found ${additionalRoutines.length} routines with MongoDB user ID: ${mongoUserId}`);
        // Migrate these routines to use Clerk userId
        console.log('Migrating routines to use Clerk userId...');
        await Routine.updateMany(
          { userId: mongoUserId },
          { $set: { userId: userId } }
        );
        console.log('Migration complete');
      }
    }

    // Fetch tasks for all projects and routines
    const projectIds = projects.map(p => p._id);
    const routineIds = [...routines, ...additionalRoutines].map(r => r._id);

    const [projectTasks, routineTasks] = await Promise.all([
      Task.find({ projectId: { $in: projectIds } }).sort({ order: 1 }),
      Task.find({ routineId: { $in: routineIds } }).sort({ order: 1 })
    ]);

    // Create maps for quick lookup
    const projectTasksMap = new Map();
    projectTasks.forEach(task => {
      const projectId = task.projectId.toString();
      if (!projectTasksMap.has(projectId)) {
        projectTasksMap.set(projectId, []);
      }
      projectTasksMap.get(projectId).push(task);
    });

    const routineTasksMap = new Map();
    routineTasks.forEach(task => {
      const routineId = task.routineId.toString();
      if (!routineTasksMap.has(routineId)) {
        routineTasksMap.set(routineId, []);
      }
      routineTasksMap.get(routineId).push(task);
    });

    // Removed excessive user data logging

    // Format the response to match the You page structure
    const response = {
      profileData: {
        name: user?.name || "",
        email: user?.email || "",
        occupation: user?.occupation || "",
        location: user?.location || "",
        bio: user?.bio || "",
      },
      goals: goals.map(goal => ({
        id: goal._id.toString(),
        content: goal.content,
        type: "goal",
        color: goal.color,
        deadline: goal.deadline, // Add deadline field directly
        metadata: {}
      })),
      sections: {
        projects: projects.map(project => {
          const projectId = project._id.toString();
          const tasksForProject = projectTasksMap.get(projectId) || [];

          return {
            id: projectId,
            content: project.name,
            type: "project",
            order: project.order, // Include the order field
            metadata: {
              completed: project.completed,
              goalId: project.goalId,
              dueDate: project.dueDate?.toISOString(),
            },
            tasks: tasksForProject.map((task: any) => ({
            id: task._id.toString(),
            _id: task._id.toString(), // Include _id for compatibility
            content: task.title || task.name,  // Use title, fallback to name
            title: task.title || task.name,
            name: task.title || task.name,
            type: "task",
            duration: task.duration || 30, // Keep as number
            dueDate: task.dueDate || null, // Include dueDate
            completed: task.completed || false,
            metadata: {
              completed: task.completed,
              duration: convertMinutesToString(task.duration),  // Keep string format in metadata for compatibility
              dueDate: task.dueDate?.toISOString(),
              projectId: projectId,
            }
          })),
          isExpanded: false
        };
        }),
        backlog: tasks.map(task => ({
          id: task._id.toString(),
          _id: task._id.toString(), // Include _id for compatibility
          content: task.title || task.name,  // Use title, fallback to name
          title: task.title || task.name,
          name: task.title || task.name,
          type: "task",
          completed: task.completed || false, // Include completed at top level
          duration: task.duration, // Include duration as number at top level
          metadata: {
            completed: task.completed,
            duration: convertMinutesToString(task.duration),  // Convert number to string format
            dueDate: task.dueDate?.toISOString(),
            isScheduled: task.isScheduled,
            goalId: task.goalId,
          }
        })),
        routines: [...routines, ...additionalRoutines].map(routine => {
          const routineId = routine._id.toString();
          const tasksForRoutine = routineTasksMap.get(routineId) || [];

          return {
            id: routineId,
            content: routine.name,
            type: "routine",
            metadata: {
              days: routine.days || [],  // Add days array
              goalId: routine.goalId,
              routineStartDate: routine.startDate,
              routineEndDate: routine.endDate,
              startTime: routine.startTime,  // Add the actual startTime field
              duration: routine.duration,     // Add the duration field
              earliestStartTime: routine.earliestStartTime || routine.startTime,  // Fallback for compatibility
              latestEndTime: routine.latestEndTime,
            },
            tasks: tasksForRoutine.map((task: any) => ({
            id: task._id.toString(),
            content: task.title || task.name,  // Use title, fallback to name
            title: task.title || task.name,
            name: task.title || task.name,
            type: "task",
            duration: task.duration || 30,  // Include duration as number directly on task
            completed: task.completed || false,
            metadata: {
              duration: convertMinutesToString(task.duration),  // Convert number to string format
              routineId: routineId,
            }
          })),
          isExpanded: false
        };
        }),
        events: events.map(event => ({
          id: event._id.toString(),
          name: event.name,
          content: event.name,
          type: "event",
          date: event.date?.toISOString() || event.dueDate?.toISOString(),
          location: event.location,
          metadata: {
            dueDate: event.date?.toISOString() || event.dueDate?.toISOString(), // Use date field, fallback to dueDate
            startTime: event.startTime,
            endTime: event.endTime,
            isRecurring: event.isRecurring,
            recurringDays: event.recurringDays,
            zoomLink: event.zoomLink,
            link: event.zoomLink, // Also add as 'link' for compatibility
            goalId: event.goalId
          }
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching You page data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Full save (for initial creation or bulk updates)
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { profileData, goals, sections } = await req.json();

    // Clear existing data and save fresh
    await Promise.all([
      Goal.deleteMany({ userId }),
      Project.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Routine.deleteMany({ userId }),
      Event.deleteMany({ userId })
    ]);

    // Save goals
    const savedGoals = [];
    const goalIdMap = new Map();
    
    for (const goal of goals || []) {
      const savedGoal = await Goal.create({
        userId,
        content: goal.content,
        color: goal.color,
        order: goals.indexOf(goal)
      });
      savedGoals.push(savedGoal);
      goalIdMap.set(goal.id, savedGoal._id.toString());
    }

    // Save projects with tasks
    for (const project of sections?.projects || []) {
      const taskDocs = [];
      
      // Create tasks first
      for (const task of project.tasks || []) {
        const savedTask = await Task.create({
          userId,
          name: task.content,
          completed: task.metadata?.completed || false,
          duration: task.metadata?.duration,
          order: project.tasks.indexOf(task)
        });
        taskDocs.push(savedTask._id);
      }
      
      // Create project with task references
      await Project.create({
        userId,
        name: project.content,
        completed: project.metadata?.completed || false,
        dueDate: project.metadata?.dueDate,
        goalId: project.metadata?.goalId ? goalIdMap.get(project.metadata.goalId) : null,
        tasks: taskDocs,
        order: sections.projects.indexOf(project)
      });
      
      // Update tasks with projectId
      if (taskDocs.length > 0) {
        const projectId = (await Project.findOne({ userId, name: project.content }))?._id;
        await Task.updateMany(
          { _id: { $in: taskDocs } },
          { projectId }
        );
      }
    }

    // Save backlog tasks
    for (const task of sections?.backlog || []) {
      await Task.create({
        userId,
        name: task.content,
        completed: task.metadata?.completed || false,
        duration: task.metadata?.duration,
        dueDate: task.metadata?.dueDate,
        isScheduled: task.metadata?.isScheduled || false,
        goalId: task.metadata?.goalId ? goalIdMap.get(task.metadata.goalId) : null,
        order: sections.backlog.indexOf(task)
      });
    }

    // Save routines with tasks
    for (const routine of sections?.routines || []) {
      const taskDocs = [];
      
      // Create tasks first
      for (const task of routine.tasks || []) {
        const savedTask = await Task.create({
          userId,
          name: task.content,
          duration: task.metadata?.duration,
          order: routine.tasks.indexOf(task)
        });
        taskDocs.push(savedTask._id);
      }
      
      // Create routine with task references
      await Routine.create({
        userId,
        name: routine.content,
        days: routine.metadata?.days || [],  // Add days
        startDate: routine.metadata?.routineStartDate,
        endDate: routine.metadata?.routineEndDate,
        startTime: routine.metadata?.startTime || routine.metadata?.earliestStartTime || '09:00',  // Use startTime
        duration: routine.metadata?.duration || 30,  // Add duration with default
        earliestStartTime: routine.metadata?.earliestStartTime,
        latestEndTime: routine.metadata?.latestEndTime,
        goalId: routine.metadata?.goalId ? goalIdMap.get(routine.metadata.goalId) : null,
        tasks: taskDocs,
        order: sections.routines.indexOf(routine)
      });
      
      // Update tasks with routineId
      if (taskDocs.length > 0) {
        const routineId = (await Routine.findOne({ userId, name: routine.content }))?._id;
        await Task.updateMany(
          { _id: { $in: taskDocs } },
          { routineId }
        );
      }
    }

    // Save events
    for (const event of sections?.events || []) {
      await Event.create({
        userId,
        name: event.content,
        dueDate: event.metadata?.dueDate,
        startTime: event.metadata?.startTime || "",
        endTime: event.metadata?.endTime || "",
        isRecurring: event.metadata?.isRecurring || false,
        recurringDays: event.metadata?.recurringDays || [],
        zoomLink: event.metadata?.zoomLink,
        goalId: event.metadata?.goalId ? goalIdMap.get(event.metadata.goalId) : null,
        order: sections.events.indexOf(event)
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving You page data:", error);
    return NextResponse.json(
      { error: "Failed to save data" },
      { status: 500 }
    );
  }
}