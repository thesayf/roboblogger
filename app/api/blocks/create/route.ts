import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Day from "@/models/Day";
import Task from "@/models/Task";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { dayId, title, time, duration, type, tasks, metadata, index } = await req.json();

    console.log('[blocks/create] Creating block with:', { 
      dayId, 
      title, 
      type, 
      tasksCount: tasks?.length || 0,
      metadata 
    });

    // Create tasks first if they exist
    let taskIds = [];
    if (tasks && tasks.length > 0) {
      for (const taskData of tasks) {
        const task = await Task.create({
          userId,
          title: taskData.title || taskData.name || "New task",
          duration: taskData.duration || 30,
          completed: taskData.completed || false,
          // If this is from a routine, link it
          routineId: metadata?.routineId || null
        });
        taskIds.push(task._id);
        console.log('[blocks/create] Created task:', task._id, task.title);
      }
    }

    // Create the block with task references
    const block = await Block.create({
      dayId,
      title,
      time,
      duration,
      type,
      tasks: taskIds, // Use the created task IDs
      index: index || 0,
      metadata: metadata || {}
    });

    console.log('[blocks/create] Created block:', block._id);

    // Add block to day's blocks array
    await Day.findByIdAndUpdate(
      dayId,
      { $push: { blocks: block._id } },
      { new: true }
    );

    // Return the block with populated tasks for immediate UI update
    const populatedBlock = await Block.findById(block._id).populate('tasks');
    
    return NextResponse.json({
      id: populatedBlock._id,
      _id: populatedBlock._id,
      title: populatedBlock.title,
      time: populatedBlock.time,
      duration: populatedBlock.duration,
      type: populatedBlock.type,
      tasks: populatedBlock.tasks.map((task: any) => ({
        id: task._id,
        _id: task._id,
        title: task.title,
        duration: task.duration,
        completed: task.completed
      })),
      metadata: populatedBlock.metadata
    });
  } catch (error) {
    console.error('[blocks/create] Error:', error);
    return NextResponse.json(
      { error: "Failed to create block" },
      { status: 500 }
    );
  }
}