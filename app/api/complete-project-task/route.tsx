import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";
import Project from "@/models/Project";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const { id, completed, projectId } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { completed },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Get the updated project with all tasks
    const updatedProject = await Project.findById(projectId).populate("tasks");

    if (!updatedProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedTask,
      updatedProject,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, error: "Error updating task" },
      { status: 500 }
    );
  }
}
