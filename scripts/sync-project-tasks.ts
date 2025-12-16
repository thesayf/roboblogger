// Script to sync tasks back to their parent projects
// Run this once to fix existing data: npx tsx scripts/sync-project-tasks.ts

import dbConnect from '../lib/mongo';
import Project from '../models/Project';
import Task from '../models/Task';

async function syncProjectTasks() {
  console.log('🔄 Starting project-task sync...\n');

  await dbConnect();

  // Get all tasks that have a projectId
  const tasksWithProjects = await Task.find({
    projectId: { $exists: true, $ne: null }
  }).lean();

  console.log(`Found ${tasksWithProjects.length} tasks with projectId\n`);

  // Group tasks by projectId
  const tasksByProject = new Map<string, any[]>();

  for (const task of tasksWithProjects) {
    const projectId = task.projectId.toString();
    if (!tasksByProject.has(projectId)) {
      tasksByProject.set(projectId, []);
    }
    tasksByProject.get(projectId)!.push(task);
  }

  console.log(`Tasks span ${tasksByProject.size} projects\n`);

  // Update each project
  let updatedCount = 0;
  let errorCount = 0;

  for (const [projectId, tasks] of tasksByProject.entries()) {
    try {
      const project = await Project.findById(projectId);

      if (!project) {
        console.log(`⚠️  Project ${projectId} not found - skipping ${tasks.length} orphaned tasks`);
        errorCount++;
        continue;
      }

      // Get task IDs
      const taskIds = tasks.map(t => t._id);

      // Update project's tasks array
      project.tasks = taskIds;
      await project.save();

      console.log(`✅ Updated "${project.name}" - added ${tasks.length} tasks`);
      updatedCount++;

    } catch (error) {
      console.error(`❌ Error updating project ${projectId}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Updated: ${updatedCount} projects`);
  console.log(`  ❌ Errors: ${errorCount} projects`);
  console.log(`\n🎉 Sync complete!`);

  process.exit(0);
}

syncProjectTasks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
