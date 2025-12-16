import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongo';
import Task from '@/models/Task';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { taskId, ...updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Update the admin task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask
    });

  } catch (error) {
    console.error('Error updating admin task:', error);
    return NextResponse.json(
      { error: 'Failed to update admin task' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, title, duration, dueDate, goalId, order, completed } = body;

    if (!name && !title) {
      return NextResponse.json(
        { error: 'Task name or title is required' },
        { status: 400 }
      );
    }

    // Create the admin task (backlog task - no project or routine)
    const newTask = new Task({
      userId,
      name: name || title,
      title: title || name,
      duration: duration || 30,
      dueDate: dueDate || null,
      goalId: goalId || null,
      completed: completed || false,
      order: order !== undefined ? order : 9999,
      // No projectId or routineId - this makes it a backlog/admin task
    });

    await newTask.save();

    // Return the created task with standardized format
    return NextResponse.json({
      _id: newTask._id,
      id: newTask._id,
      title: newTask.title,
      name: newTask.title, // Legacy compatibility - Task model uses title
      duration: newTask.duration,
      completed: newTask.completed,
      dueDate: newTask.dueDate,
      goalId: newTask.goalId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin task:', error);
    return NextResponse.json(
      { error: 'Failed to create admin task' },
      { status: 500 }
    );
  }
}