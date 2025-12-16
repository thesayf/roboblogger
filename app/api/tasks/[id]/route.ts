import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";
import Project from "@/models/Project";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const taskId = params.id;
    const body = await req.json();
    const { title, duration, completed, projectId } = body;

    console.log('[tasks/PATCH] Updating task properties:', { taskId, title, duration, completed, projectId });

    // Build update object with only provided fields
    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (duration !== undefined) updateFields.duration = duration;
    if (completed !== undefined) updateFields.completed = completed;
    if (projectId !== undefined) updateFields.projectId = projectId;

    // If updating projectId, handle project task arrays
    if (projectId !== undefined) {
      const task = await Task.findById(taskId);
      if (task) {
        const oldProjectId = task.projectId;

        // Remove from old project if it had one
        if (oldProjectId) {
          await Project.findByIdAndUpdate(
            oldProjectId,
            { $pull: { tasks: taskId } }
          );
          console.log('[tasks/PATCH] Removed task from old project:', oldProjectId);
        }

        // Add to new project if provided
        if (projectId) {
          await Project.findByIdAndUpdate(
            projectId,
            { $addToSet: { tasks: taskId } }
          );
          console.log('[tasks/PATCH] Added task to new project:', projectId);
        }
      }
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateFields,
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log('[tasks/PATCH] Task updated successfully:', updatedTask);

    return NextResponse.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('[tasks/PATCH] Error:', error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const taskId = params.id;
    const body = await req.json();
    const { completed, dayId } = body;

    console.log('[tasks/PUT] Updating task completion:', { taskId, completed, dayId });

    // Update the task's completion status
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { completed },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log('[tasks/PUT] Task updated successfully:', updatedTask._id);

    return NextResponse.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('[tasks/PUT] Error:', error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const taskId = params.id;
    const body = await req.json();
    const { blockId, unassignOnly } = body;

    console.log('[tasks/DELETE] Request:', { taskId, blockId, unassignOnly });

    if (unassignOnly) {
      // Just remove the task from the block, don't delete the task itself
      console.log('[tasks/DELETE] Unassigning task from block');
      
      if (blockId) {
        // Remove task reference from block
        await Block.findByIdAndUpdate(
          blockId,
          { $pull: { tasks: taskId } },
          { new: true }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        action: 'unassigned',
        message: 'Task unassigned from timeline' 
      });
    } else {
      // Actually delete the task (only for standalone tasks)
      console.log('[tasks/DELETE] Deleting standalone task');
      
      // First remove from block if it exists
      if (blockId) {
        await Block.findByIdAndUpdate(
          blockId,
          { $pull: { tasks: taskId } },
          { new: true }
        );
      }
      
      // Then delete the task
      await Task.findByIdAndDelete(taskId);
      
      return NextResponse.json({ 
        success: true, 
        action: 'deleted',
        message: 'Task deleted' 
      });
    }
  } catch (error) {
    console.error('[tasks/DELETE] Error:', error);
    return NextResponse.json(
      { error: "Failed to process task operation" },
      { status: 500 }
    );
  }
}