import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { taskId, name, description, duration, priority } = body;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Missing task id" },
        { status: 400 }
      );
    }

    // Find the task by its ID
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Update task fields (store duration as a string if provided)
    task.name = name || task.name;
    task.description = description || task.description;
    task.duration = duration ? duration.toString() : task.duration;
    task.priority = priority || task.priority;

    await task.save();

    return NextResponse.json(
      { success: true, updatedTask: task },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error updating task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
