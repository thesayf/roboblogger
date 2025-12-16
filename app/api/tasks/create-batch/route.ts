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
    const { blockId, tasksData, insertPosition } = await req.json();

    console.log('[tasks/create-batch] Request:', {
      blockId,
      tasksCount: tasksData?.length,
      insertPosition
    });

    if (!tasksData || !Array.isArray(tasksData) || tasksData.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    // Find the block first
    const block = await Block.findById(blockId);
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const createdTasks = [];
    const taskIds = [];

    // Process all tasks
    for (const taskData of tasksData) {
      const { title, duration, projectId, taskId } = taskData;
      let task;

      // If taskId is provided, we're linking an existing task to the block
      if (taskId) {
        task = await Task.findById(taskId);
        if (!task) {
          console.error('[tasks/create-batch] Task not found:', taskId);
          continue; // Skip this task but continue with others
        }
        console.log('[tasks/create-batch] Using existing task:', task._id);
      } else {
        // Create a new task
        task = await Task.create({
          userId,
          title,
          duration: duration || 30,
          completed: false,
          projectId: projectId || null,
        });
        console.log('[tasks/create-batch] Created new task:', task._id);

        // If projectId is provided, add this task to the project's tasks array
        if (projectId) {
          try {
            const project = await Project.findById(projectId);
            if (project) {
              project.tasks = project.tasks || [];
              project.tasks.push(task._id);
              await project.save();
              console.log('[tasks/create-batch] Added task to project:', projectId);
            }
          } catch (error) {
            console.error('[tasks/create-batch] Error adding task to project:', error);
            // Continue anyway - task was created successfully
          }
        }
      }

      // Collect task IDs and created task data
      taskIds.push(task._id);
      createdTasks.push({
        id: task._id.toString(),
        _id: task._id.toString(),
        title: task.title,
        duration: task.duration,
        completed: task.completed,
        projectId: task.projectId,
      });
    }

    // Insert all tasks at once at the specified position (atomic operation)
    if (insertPosition !== undefined && insertPosition >= 0) {
      block.tasks.splice(insertPosition, 0, ...taskIds);
    } else {
      block.tasks.push(...taskIds);
    }

    await block.save();
    console.log('[tasks/create-batch] Added', taskIds.length, 'tasks to block:', blockId);

    // Return all created tasks
    return NextResponse.json({
      tasks: createdTasks,
      count: createdTasks.length,
    });
  } catch (error) {
    console.error('[tasks/create-batch] Error:', error);
    return NextResponse.json(
      { error: "Failed to create tasks" },
      { status: 500 }
    );
  }
}
