import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Event from "@/models/Event";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const { id, completed } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Simply update the completed status, regardless of whether it's recurring or not
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { completed },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("Error updating event completion status:", error);
    return NextResponse.json(
      { error: "Error updating event" },
      { status: 500 }
    );
  }
}
