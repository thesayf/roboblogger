import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch active (non-completed, non-deleted) projects
    const projects = await Project.find({
      userId,
      isDeleted: { $ne: true },
      completed: { $ne: true }
    })
    .select('_id name content description')
    .sort({ createdAt: -1 });

    // Fetch tasks for all projects
    const projectIds = projects.map(p => p._id);
    const allTasks = await Task.find({
      projectId: { $in: projectIds }
    });

    // Group tasks by projectId
    const tasksByProject = new Map();
    allTasks.forEach((task: any) => {
      const projectId = task.projectId.toString();
      if (!tasksByProject.has(projectId)) {
        tasksByProject.set(projectId, []);
      }
      tasksByProject.get(projectId).push(task);
    });

    // Add task count to each project and format tasks
    const projectsWithCount = projects.map(project => {
      const projectId = project._id.toString();
      const tasks = tasksByProject.get(projectId) || [];
      const formattedTasks = tasks.map((task: any) => ({
        _id: task._id,
        id: task._id, // Include id for compatibility
        title: task.title || task.name || task.content || 'Unnamed Task',
        name: task.name || task.title || task.content,
        content: task.content || task.title || task.name,
        duration: task.duration || 30,
        dueDate: task.dueDate || null,
        completed: task.completed || false
      }));

      return {
        _id: project._id,
        name: project.name || project.description || project.content || 'Unnamed Project',
        content: project.content || project.description,
        tasksCount: tasks.length,
        tasks: formattedTasks
      };
    });

    return NextResponse.json({ projects: projectsWithCount });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}