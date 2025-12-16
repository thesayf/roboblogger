import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";
import Task from "@/models/Task";

export async function DELETE(request: NextRequest) {
  await dbConnect();

  try {
    // Get the project ID from the request body
    const { id } = await request.json();

    console.log("Attempting to delete project with ID:", id);

    // First, delete all tasks associated with this project
    const deletedTasks = await Task.deleteMany({ projectId: id });
    console.log("Deleted associated tasks:", deletedTasks);

    // Then delete the project itself
    const deletedProject = await Project.findByIdAndDelete(id);
    console.log("Deleted project:", deletedProject);

    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Project and associated tasks deleted successfully",
      deletedProject,
      tasksDeleted: deletedTasks.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Error deleting project" },
      { status: 500 }
    );
  }
}
