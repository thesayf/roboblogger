import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";
import mongoose, { Types } from "mongoose";

// Lean document type definitions
interface LeanTask {
  _id: Types.ObjectId;
  blockId: Types.ObjectId;
  dayId: Types.ObjectId;
  name: string;
  description: string;
  duration: number;
  priority: string;
  status: string;
  type: string;
  isRoutineTask: boolean;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanBlock {
  _id: Types.ObjectId;
  dayId: Types.ObjectId;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
  blockType: string;
  event?: string;
  meetingLink?: string;
  tasks: LeanTask[];
  createdAt: Date;
  updatedAt: Date;
}

interface DayWithBlocks {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  date: string;
  completed: boolean;
  blocks: LeanBlock[];
  completedTasksCount: number;
  performanceRating?: {
    level: string;
    score: number;
    comment: string;
  };
}

interface DayAnalyticsResponse {
  _id: Types.ObjectId | string;
  date: string;
  blocks: Array<{
    _id: Types.ObjectId | string;
    dayId: Types.ObjectId | string;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    status: string;
    blockType: string;
    event?: string;
    meetingLink?: string;
    tasks: Array<{
      _id: Types.ObjectId | string;
      blockId: Types.ObjectId | string;
      dayId: Types.ObjectId | string;
      name: string;
      description: string;
      duration: number;
      priority: string;
      status: string;
      type: string;
      isRoutineTask: boolean;
      completed: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
  taskCompletionRate: number;
  blockCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  totalBlocks: number;
  completedBlocks: number;
  completed: boolean;
}

interface DayAnalyticsResponse {
  _id: Types.ObjectId | string;
  date: string;
  taskCompletionRate: number;
  blockCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  totalBlocks: number;
  completedBlocks: number;
  completed: boolean;
  performanceRating?: {
    level: string;
    score: number;
    comment: string;
  };
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { userId: clerkId, date } = await request.json();

    console.log("Date is", date);
    console.log("UserId", clerkId);

    if (!clerkId || !date) {
      return NextResponse.json(
        { error: "User ID and date are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mongoUserId = user._id;

    const day = (await Day.findOne({
      user: mongoUserId,
      date: date,
    })
      .populate({
        path: "blocks",
        populate: {
          path: "tasks",
          select:
            "_id blockId dayId name description duration priority status type completed isRoutineTask createdAt updatedAt",
        },
      })
      .lean()) as DayWithBlocks;

    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    if (!day.blocks || !Array.isArray(day.blocks)) {
      return NextResponse.json(
        { error: "Invalid blocks data" },
        { status: 500 }
      );
    }

    let totalTasks = 0;
    let completedTasks = 0;
    let completedBlocks = 0;

    day.blocks.forEach((block) => {
      if (block && block.tasks && Array.isArray(block.tasks)) {
        const blockTasks = block.tasks.length;
        const blockCompletedTasks = block.tasks.filter(
          (task) => task && task.completed
        ).length;
        totalTasks += blockTasks;
        completedTasks += blockCompletedTasks;

        if (blockTasks > 0 && blockCompletedTasks === blockTasks) {
          completedBlocks++;
        }
      }
    });

    const taskCompletionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const blockCompletionRate =
      day.blocks.length > 0 ? (completedBlocks / day.blocks.length) * 100 : 0;

    const safeToString = (id: Types.ObjectId | undefined): string => {
      if (!id) return "";
      return id.toString();
    };

    // Process blocks with type safety
    const processedBlocks = day.blocks
      .map((block): DayAnalyticsResponse["blocks"][0] | null => {
        if (!block) return null;
        return {
          _id: safeToString(block._id),
          dayId: safeToString(block.dayId),
          name: block.name || "",
          description: block.description || "",
          startTime: block.startTime || "",
          endTime: block.endTime || "",
          status: block.status || "",
          blockType: block.blockType || "",
          event: block.event,
          meetingLink: block.meetingLink,
          tasks: (block.tasks || [])
            .map(
              (task): DayAnalyticsResponse["blocks"][0]["tasks"][0] | null => {
                if (!task) return null;
                return {
                  _id: safeToString(task._id),
                  blockId: safeToString(task.blockId),
                  dayId: safeToString(task.dayId),
                  name: task.name || "",
                  description: task.description || "",
                  duration: task.duration || 0,
                  priority: task.priority || "",
                  status: task.status || "",
                  type: task.type || "",
                  isRoutineTask: !!task.isRoutineTask,
                  completed: !!task.completed,
                  createdAt: task.createdAt || new Date(),
                  updatedAt: task.updatedAt || new Date(),
                };
              }
            )
            .filter(
              (task): task is DayAnalyticsResponse["blocks"][0]["tasks"][0] =>
                task !== null
            ),
          createdAt: block.createdAt || new Date(),
          updatedAt: block.updatedAt || new Date(),
        };
      })
      .filter(
        (block): block is DayAnalyticsResponse["blocks"][0] => block !== null
      );

    const response: DayAnalyticsResponse = {
      _id: safeToString(day._id),
      date: day.date,
      blocks: processedBlocks,
      taskCompletionRate: Number(taskCompletionRate.toFixed(1)),
      blockCompletionRate: Number(blockCompletionRate.toFixed(1)),
      totalTasks,
      completedTasks,
      totalBlocks: day.blocks.length,
      completedBlocks,
      completed: day.completed,
    };

    // Add performance rating to response if it exists
    if (day.performanceRating) {
      response.performanceRating = {
        level: day.performanceRating.level,
        score: day.performanceRating.score,
        comment: day.performanceRating.comment,
      };
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error fetching day analytics:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error fetching day analytics data", details: errorMessage },
      { status: 500 }
    );
  }
}
