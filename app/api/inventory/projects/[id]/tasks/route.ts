import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Project from '@/models/Project';
import Task from '@/models/Task'; // Import Task model to register it

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify project exists and belongs to user
    const project = await Project.findOne({
      _id: params.id,
      userId,
      isDeleted: { $ne: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Query tasks separately
    const tasks = await Task.find({
      projectId: params.id,
      completed: { $ne: true } // Only fetch incomplete tasks
    });

    // Format tasks
    const formattedTasks = tasks.map((task: any) => ({
      _id: task._id,
      title: task.title || task.name || task.content || 'Unnamed Task',
      duration: task.duration || 30,
      completed: task.completed || false,
      dueDate: task.dueDate || null
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { title, duration, dueDate, order } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const project = await Project.findOne({
      _id: params.id,
      userId,
      isDeleted: { $ne: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create the new task
    const newTask = new Task({
      userId,
      title,
      duration: duration || 30,
      dueDate: dueDate || null,
      completed: false,
      projectId: params.id,
      order: order !== undefined ? order : 9999
    });

    await newTask.save();

    // Return the created task with standardized format
    return NextResponse.json({
      _id: newTask._id,
      title: newTask.title,
      duration: newTask.duration,
      completed: newTask.completed,
      dueDate: newTask.dueDate
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}