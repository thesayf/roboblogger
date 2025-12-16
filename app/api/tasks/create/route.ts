import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";
import Project from "@/models/Project";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { blockId, title, duration, insertPosition, projectId, taskId } = await req.json();

    console.log('[tasks/create] Request:', { blockId, title, duration, taskId, projectId });

    let task;

    // If taskId is provided, we're linking an existing task to the block
    if (taskId) {
      // Find the existing task
      task = await Task.findById(taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      console.log('[tasks/create] Using existing task:', task._id);
    } else {
      // Create a new task
      task = await Task.create({
        userId,
        title,
        duration: duration || 30,
        completed: false,
        projectId: projectId || null,
      });
      console.log('[tasks/create] Created new task:', task._id);

      // If projectId is provided, add this task to the project's tasks array
      if (projectId) {
        try {
          const project = await Project.findById(projectId);
          if (project) {
            project.tasks = project.tasks || [];
            project.tasks.push(task._id);
            await project.save();
            console.log('[tasks/create] Added task to project:', projectId);
          }
        } catch (error) {
          console.error('[tasks/create] Error adding task to project:', error);
          // Continue anyway - task was created successfully
        }
      }
    }

    // Add task to block's tasks array at the specified position
    const block = await Block.findById(blockId);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Insert task at the specified position
    if (insertPosition !== undefined && insertPosition >= 0) {
      block.tasks.splice(insertPosition, 0, task._id);
    } else {
      block.tasks.push(task._id);
    }

    await block.save();
    console.log('[tasks/create] Added task to block:', blockId);

    // Return the task data
    return NextResponse.json({
      id: task._id,
      _id: task._id,
      title: task.title,
      duration: task.duration,
      completed: task.completed,
      projectId: task.projectId,
    });
  } catch (error) {
    console.error('[tasks/create] Error:', error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
