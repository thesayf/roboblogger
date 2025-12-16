import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const { projectId, taskIds } = await request.json();

    if (!projectId || !taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.log(taskIds);

    // Update the project's tasks array with the new order
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { tasks: taskIds }, // Simply update the tasks array with the new order
      {
        new: true,
        runValidators: true,
      }
    ).populate("tasks");

    if (!updatedProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { success: false, error: "Error reordering tasks" },
      { status: 500 }
    );
  }
}
