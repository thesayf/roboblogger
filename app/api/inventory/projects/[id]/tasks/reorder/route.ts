import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Project from '@/models/Project';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { taskIds } = await request.json();

    if (!Array.isArray(taskIds)) {
      return NextResponse.json(
        { error: 'taskIds must be an array' },
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

    // Update the tasks array with the new order
    project.tasks = taskIds.map((id: string) => id);
    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Task order updated successfully'
    });

  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}
