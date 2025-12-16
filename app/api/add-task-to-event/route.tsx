import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";
import Event from "@/models/Event";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { eventId, name, description, duration, priority } = body;

    if (!eventId || !name || !duration) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the event by its ID
    const event = await Event.findById(eventId);
    console.log(event);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Create the task (store duration as a string)
    const task = new Task({
      name,
      description,
      duration: duration.toString(),
      priority,
      eventId, // Associate the task with the event
      type: "admin",
    });
    await task.save();

    // Add the task's ID to the event's tasks array (legacy - events may have tasks in metadata)
    if (!(event as any).tasks) {
      (event as any).tasks = [];
    }
    (event as any).tasks.push(task._id);
    await event.save();

    // Re-fetch the event with tasks populated so the client receives full task details
    const updatedEvent = await Event.findById(eventId).populate("tasks");
    console.log(updatedEvent);

    return NextResponse.json(
      { success: true, task, event: updatedEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error creating task",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
