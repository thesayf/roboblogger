import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";
import Project from "@/models/Project";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const {
      name,
      description,
      priority,
      duration,
      deadline,
      status,
      completed,
      projectId,
    } = await request.json();

    console.log("Received project task update data:", {
      name,
      description,
      priority,
      duration,
      deadline,
      status,
      completed,
      projectId,
    });

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        name,
        description,
        priority,
        duration,
        deadline,
        status,
        completed,
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Optionally, update the project if needed
    // For example, you might want to update some project statistics
    // await Project.findByIdAndUpdate(projectId, { /* update project data */ });

    return NextResponse.json({ updatedTask });
  } catch (error) {
    console.error("Error updating project task:", error);
    return NextResponse.json(
      { error: "Error updating project task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const { projectId } = await request.json();

    console.log("Deleting project task with ID:", id);
    console.log("Project ID:", projectId);

    // Find and delete the task
    const deletedTask = await Task.findByIdAndDelete(id);

    console.log("Deleted task:", deletedTask);

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Remove the task from the project's tasks array
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $pull: { tasks: id } },
      { new: true }
    );

    console.log("Updated project:", updatedProject);

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Task deleted successfully",
      updatedProject,
    });
  } catch (error) {
    console.error("Error deleting project task:", error);
    return NextResponse.json(
      { error: "Error deleting project task" },
      { status: 500 }
    );
  }
}
