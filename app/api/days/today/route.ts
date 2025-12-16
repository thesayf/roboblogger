import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Block from "@/models/Block";
import Task from "@/models/Task";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json(
        { error: "Missing userId or date" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find or create the day
    let day = await Day.findOne({ user: userId, date })
      .populate({
        path: 'blocks',
        model: Block,
        populate: {
          path: 'tasks',
          model: Task
        }
      });

    if (!day) {
      // Create a new day if it doesn't exist
      day = await Day.create({
        user: userId,
        date,
        blocks: [],
        completed: false,
        completedTasksCount: 0
      });
    }

    // Format the response
    const formattedDay = {
      _id: day._id,
      date: day.date,
      blocks: (day.blocks || []).map((block: any) => ({
        _id: block._id,
        id: block._id,
        title: block.title,
        time: block.time,
        duration: block.duration,
        type: block.type,
        completed: block.completed,
        note: block.note || '',
        tasks: (block.tasks || []).map((task: any) => ({
          _id: task._id,
          id: task._id,
          title: task.title,
          duration: task.duration,
          completed: task.completed
        })),
        metadata: block.metadata || {}
      })),
      completed: day.completed,
      completedTasksCount: day.completedTasksCount
    };

    console.log('[days/today] Returning day:', {
      dayId: formattedDay._id,
      date: formattedDay.date,
      blocksCount: formattedDay.blocks.length,
      blocks: formattedDay.blocks.map(b => ({
        title: b.title,
        type: b.type,
        tasksCount: b.tasks?.length || 0
      }))
    });

    return NextResponse.json(formattedDay);
  } catch (error) {
    console.error("[days/today] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch day data" },
      { status: 500 }
    );
  }
}