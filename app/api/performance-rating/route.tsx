// /app/api/dayPerformance/route.ts
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Task from "@/models/Task";
import Project from "@/models/Project";
import Routine from "@/models/Routine";
import Event from "@/models/Event";

// Define proper interfaces for your data models
interface TaskModel {
  _id: string;
  name: string;
  description?: string;
  completed: boolean;
  duration: string;
  deadline?: string;
  user: string;
  isRoutineTask: boolean;
  blockId: string | null;
}

interface BlockModel {
  _id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  status: "pending" | "complete" | "in-progress";
  blockType: string;
  tasks: TaskModel[];
}

interface DayModel {
  _id: string;
  date: string;
  completed: boolean;
  user: string;
  blocks: BlockModel[];
}

interface ProjectModel {
  _id: string;
  name: string;
  deadline?: string;
  completed: boolean;
  user: string;
  tasks: TaskModel[];
}

interface RoutineModel {
  _id: string;
  name: string;
  blockType: string;
  user: string;
  tasks: TaskModel[];
}

interface EventModel {
  _id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  eventType: string;
  user: string;
}

interface BlockData {
  name: string;
  startTime?: string;
  endTime?: string;
  status: string;
  blockType: string;
  tasks: {
    name: string;
    description?: string;
    completed: boolean;
    durationMinutes: number;
  }[];
}

interface DayData {
  date: string;
  metrics: {
    completedTasksCount: number;
    totalTasksCount: number;
    taskCompletionRate: number;
  };
  blocks: BlockData[];
  allTaskNames: string[];
}

interface ContextData {
  previousDays: {
    date: string;
    completed: boolean;
    blocks: {
      name: string;
      blockType: string;
      startTime?: string;
      endTime?: string;
      status: string;
      tasks: {
        name: string;
        description?: string;
        completed: boolean;
      }[];
    }[];
  }[];
  incompleteProjects: {
    name: string;
    deadline?: string;
    completedTasksCount: number;
    totalTasksCount: number;
    tasks: {
      name: string;
      description?: string;
      completed: boolean;
    }[];
  }[];
  availableRoutinesForDay: {
    name: string;
    blockType: string;
    tasks: {
      name: string;
      description?: string;
      completed: boolean;
    }[];
  }[];
  incompleteTasks: {
    name: string;
    description?: string;
    duration: string;
    deadline?: string;
  }[];
  futureEvents: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    eventType: string;
  }[];
}

interface PerformanceRating {
  level: string;
  score: number;
  comment: string;
}

export const maxDuration = 300; // Set execution timeout to 30 seconds

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // Extract request data
    const { dayId, userId } = await request.json();
    console.log("Performance rating request received:", { dayId, userId });

    if (!dayId || !userId) {
      console.error("Missing required fields:", { dayId, userId });
      return new Response(
        JSON.stringify({ error: "Day ID and User ID are required" }),
        { status: 400 }
      );
    }

    // Get Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Missing Anthropic API key in environment variables");
      return new Response(
        JSON.stringify({ error: "Missing Anthropic API key" }),
        { status: 500 }
      );
    }

    // Get the current day with populated blocks and tasks
    const currentDay = await Day.findById(dayId).populate({
      path: "blocks",
      populate: {
        path: "tasks",
      },
    });

    if (!currentDay) {
      console.error("Day not found:", dayId);
      return new Response(JSON.stringify({ error: "Day not found" }), {
        status: 404,
      });
    }

    console.log("Found day data:", {
      date: currentDay.date,
      blocksCount: currentDay.blocks.length,
      completedBlocks: currentDay.blocks.filter(
        (b: BlockModel) => b.status === "complete"
      ).length,
    });

    // Sort blocks by startTime
    currentDay.blocks.sort((a: BlockModel, b: BlockModel) => {
      if (!a.startTime) return -1;
      if (!b.startTime) return 1;
      const timeA = new Date(`1970-01-01T${a.startTime}`);
      const timeB = new Date(`1970-01-01T${b.startTime}`);
      return timeA.getTime() - timeB.getTime();
    });

    // Get the last 7 days (excluding current day)
    const lastSevenDays = await Day.find({
      user: userId,
      date: { $ne: currentDay.date },
    })
      .sort({ date: -1 })
      .limit(7)
      .populate({
        path: "blocks",
        populate: {
          path: "tasks",
        },
      });

    // Sort blocks chronologically for each previous day
    lastSevenDays.forEach((day: DayModel) => {
      if (day.blocks && day.blocks.length > 0) {
        day.blocks.sort((a: BlockModel, b: BlockModel) => {
          if (!a.startTime) return -1;
          if (!b.startTime) return 1;
          const timeA = new Date(`1970-01-01T${a.startTime}`);
          const timeB = new Date(`1970-01-01T${b.startTime}`);
          return timeA.getTime() - timeB.getTime();
        });
      }
    });

    // Get only incomplete projects with their tasks
    const incompleteProjects = await Project.find({
      userId: userId,
      completed: { $ne: true }, // Only get non-completed projects
    }).populate("tasks");

    // Get user's routines with populated tasks
    const routines = await Routine.find({ userId: userId }).populate("tasks");

    const evaluationDayOfWeek = new Date(currentDay.date).toLocaleDateString(
      "en-US",
      { weekday: "long" }
    );
    const dayRoutines = routines.filter(
      (routine) => routine.days && routine.days.includes(evaluationDayOfWeek)
    );
    // Get incomplete standalone tasks
    const incompleteTasks = await Task.find({
      user: userId,
      isRoutineTask: false,
      blockId: null,
      completed: false,
    });

    // Get all future events
    const currentDate = new Date();
    const futureEvents = await Event.find({
      userId: userId,
      $or: [
        // Events with a future date
        {
          date: {
            $gte: currentDate.toISOString().split("T")[0], // Today or future dates
          },
        },
        // Recurring events (these repeat regardless of date)
        { isRecurring: true },
      ],
    });

    // SIMPLIFIED METRICS CALCULATION
    let totalTasks = 0;
    let completedTasks = 0;
    let taskNames: string[] = [];

    // Parse blocks to get basic task metrics only
    currentDay.blocks.forEach((block: BlockModel) => {
      if (block.tasks) {
        totalTasks += block.tasks.length;
        completedTasks += block.tasks.filter(
          (task: TaskModel) => task.completed
        ).length;

        // Add task names for analysis
        taskNames = taskNames.concat(
          block.tasks.map((task: TaskModel) => task.name)
        );
      }
    });

    const taskCompletionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Simplified day data - removed all the confusing metrics
    const dayData: DayData = {
      date: currentDay.date,
      metrics: {
        completedTasksCount: completedTasks,
        totalTasksCount: totalTasks,
        taskCompletionRate,
      },
      blocks: currentDay.blocks.map((block: BlockModel) => ({
        name: block.name,
        startTime: block.startTime,
        endTime: block.endTime,
        status: block.status,
        blockType: block.blockType,
        tasks: block.tasks.map((task: TaskModel) => ({
          name: task.name,
          description: task.description,
          completed: task.completed,
          durationMinutes: parseInt(task.duration) || 0,
        })),
      })),
      allTaskNames: taskNames,
    };

    const contextData: ContextData = {
      previousDays: lastSevenDays.map((day: DayModel) => ({
        date: day.date,
        completed: day.completed,
        blocks: day.blocks.map((block: BlockModel) => ({
          name: block.name,
          blockType: block.blockType,
          startTime: block.startTime,
          endTime: block.endTime,
          status: block.status,
          tasks: block.tasks.map((task: TaskModel) => ({
            name: task.name,
            description: task.description,
            completed: task.completed,
          })),
        })),
      })),
      incompleteProjects: incompleteProjects.map((project: ProjectModel) => ({
        name: project.name,
        deadline: project.deadline,
        completedTasksCount: project.tasks.filter(
          (task: TaskModel) => task.completed
        ).length,
        totalTasksCount: project.tasks.length,
        tasks: project.tasks.map((task: TaskModel) => ({
          name: task.name,
          description: task.description,
          completed: task.completed,
        })),
      })),
      availableRoutinesForDay: dayRoutines.map((routine: RoutineModel) => ({
        name: routine.name,
        blockType: routine.blockType,
        tasks: routine.tasks.map((task: TaskModel) => ({
          name: task.name,
          description: task.description,
          completed: task.completed,
        })),
      })),
      incompleteTasks: incompleteTasks.map((task) => ({
        name: task.name,
        description: task.description ?? undefined,
        duration: task.duration ?? "",
        deadline:
          task.deadline instanceof Date
            ? task.deadline.toISOString().split("T")[0]
            : typeof task.deadline === "string"
              ? task.deadline
              : undefined,
      })),
      futureEvents: futureEvents.map((event) => ({
        name: event.name,
        date:
          event.date instanceof Date
            ? event.date.toISOString().split("T")[0]
            : String(event.date),
        startTime: event.startTime,
        endTime: event.endTime,
        isRecurring: !!event.isRecurring,
        eventType: event.eventType ?? "",
      })),
    };
    console.log("contextData", contextData);
    console.log("dayData", dayData);
    console.log("dayRoutines", dayRoutines);

    // Updated prompt with nuanced comment instructions
    const prompt = `You are a productivity coach analyzing what a user actually accomplished today. Focus on meaningful progress, not metrics or theories.

DAY PERFORMANCE DATA:
${JSON.stringify(dayData, null, 2)}

ADDITIONAL CONTEXT:
${JSON.stringify(contextData, null, 2)}

CORE EVALUATION AREAS:
1. **Project Progress**: Did they complete tasks that move important projects forward?
2. **Routine Consistency**: Did they incorporate their available routines into their day and complete routine-related tasks?
3. **Commitments Kept**: Did they attend scheduled meetings/events?
4. **Meaningful Work**: Did they complete significant standalone tasks, especially those with deadlines?
5. **Healthy Balance**: Did they include adequate rest, personal time, and self-care activities?
6. **Work-Life Timing**: Did they maintain healthy work hours based on their block timing (reasonable start time, not working too late)?

ANALYSIS FOCUS:
- Compare what the user scheduled/assigned in their day (blocks, routines, tasks) against what they actually completed - focus on execution vs intention
- Use task descriptions to understand the significance of what was accomplished
- Consider how today's work serves their bigger goals and projects
- Be specific about what they actually did, not general productivity advice
- Evaluate work-life balance: look for personal time, breaks, health activities, and family time
- For routine evaluation: Consider which of the available routines for that day were actually incorporated into blocks or had their tasks completed. Evaluate whether the user maintained good routine habits from their available options.

SCORING APPROACH (1-10):
- 8-10: Excellent progress on important projects + incorporated available routines well + met commitments + healthy work-life balance + sustainable work timing
- 6-7: Solid progress with some meaningful accomplishments 
- 4-5: Average day with modest progress
- 2-3: Minimal meaningful progress
- 1: Very little accomplished

Be realistic but encouraging. Focus on specific accomplishments and how they contribute to the user's goals.

YOUR RESPONSE:
Provide a JSON object with exactly these three fields:
1. "level": A descriptive level name (e.g., "Excellent", "Good", "Average", "Needs Improvement")
2. "score": A numerical score from 1-10 (decimals allowed)
3. "comment": A personalized 2-3 sentence comment about specific achievements, actionable recommendations. **TAILOR YOUR COMMENT BASED ON USER'S CONTEXT**: If the user has few/no projects, routines, events, or task backlog, focus on evaluating the difficulty and significance of the day's completed tasks based on their names and descriptions, then suggest ways to build more structure (projects, routines) for higher productivity and work-life balance. If the user has established projects, available routines for this day, events, and task backlog, prioritize commenting on: (1) project progress and how well they incorporated their available routines (mention both routines they successfully included AND routines they had available but didn't use) first, then (2) event attendance and standalone task effectiveness and (3) work-life balance. Always mention specific task names when they represent significant accomplishments. **END WITH A SPECIFIC RECOMMENDATION**: Suggest 1-2 concrete actions they could take tomorrow to improve their score, such as focusing on a specific project, incorporating a specific available routine they missed, improving work timing (earlier start/earlier finish), or tackling high-impact tasks`;

    // Type for Anthropic API response
    interface AnthropicResponse {
      content: {
        text: string;
        type: string;
      }[];
      id: string;
      model: string;
      role: string;
      [key: string]: any;
    }

    // Call Anthropic API - non-streaming request
    console.log("Calling Anthropic API...");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        temperature: 0.2,
        stream: false,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Anthropic API error! Status: ${response.status}`,
        errorBody
      );
      throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
    }

    // Parse the response from Anthropic
    const responseData: AnthropicResponse = await response.json();
    console.log("Received response from Anthropic API");

    let performanceRating: PerformanceRating;

    try {
      performanceRating = JSON.parse(responseData.content[0].text);
      console.log("Successfully parsed performance rating:", performanceRating);
    } catch (error) {
      console.error("Error parsing Anthropic response:", error);
      console.log("Raw response:", responseData.content[0].text);

      // If parsing fails, attempt to extract JSON with regex
      const jsonMatch = responseData.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          performanceRating = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted and parsed JSON from response");
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
          throw new Error("Failed to parse performance rating from response");
        }
      } else {
        console.error("No valid JSON found in response");
        throw new Error("No valid JSON found in response");
      }
    }

    // Return the performance rating
    return new Response(JSON.stringify({ performanceRating }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("An error occurred in performance rating API:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({
        error: "Error analyzing day performance",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
