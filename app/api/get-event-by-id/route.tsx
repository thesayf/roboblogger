import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongo";
import Event from "@/models/Event";
import Task from "@/models/Task";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // Parse the request body to get the eventId
    const { eventId } = await request.json();

    if (!eventId) {
      console.error("Missing eventId in request body");
      return NextResponse.json(
        { error: "Missing eventId in request" },
        { status: 400 }
      );
    }

    console.log("Fetching event with ID:", eventId);

    // Find the event by ID
    const event = await Event.findById(eventId).populate({
      path: "tasks",
      model: Task,
    });

    if (!event) {
      console.log("Event not found with ID:", eventId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("Found event:", event.name);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Error fetching event" },
      { status: 500 }
    );
  }
}
