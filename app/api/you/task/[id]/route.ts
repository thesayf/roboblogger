import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";

// PATCH - Update a specific task
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const updates = await req.json();

    console.log('[Task API] Updating task:', params.id);
    console.log('[Task API] Updates:', updates);
    console.log('[Task API] UserId:', userId);

    // First, find the task to see if it exists and check its userId
    const existingTask = await Task.findById(params.id);
    console.log('[Task API] Existing task:', existingTask);

    // Update the task - if task doesn't have userId, update without userId check
    const query = existingTask?.userId ? { _id: params.id, userId } : { _id: params.id };

    const task = await Task.findOneAndUpdate(
      query,
      { $set: { ...updates, userId } }, // Also set userId if missing
      { new: true }
    );

    console.log('[Task API] Updated task:', task);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    console.log('[Task API] Deleting task:', params.id);
    console.log('[Task API] UserId:', userId);

    // Find the task to see if it exists
    const existingTask = await Task.findById(params.id);
    console.log('[Task API] Existing task:', existingTask);

    // Delete the task - if task doesn't have userId, delete without userId check
    const query = existingTask?.userId ? { _id: params.id, userId } : { _id: params.id };

    const task = await Task.findOneAndDelete(query);

    console.log('[Task API] Deleted task:', task);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}