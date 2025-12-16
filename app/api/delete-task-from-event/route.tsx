import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";
import Event from "@/models/Event";

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { eventId, taskId } = body;

    if (!eventId || !taskId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the event by its ID
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Remove the task's ID from the event's tasks array
    event.tasks = event.tasks.filter((t: any) => t.toString() !== taskId);
    await event.save();

    // Delete the task document from the database
    await Task.findByIdAndDelete(taskId);

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error deleting task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
