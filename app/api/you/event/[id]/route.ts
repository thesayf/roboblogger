import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Event from "@/models/Event";

// PATCH - Update a specific event
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

    console.log('[Event PATCH] ===== UPDATING EVENT =====');
    console.log('[Event PATCH] Event ID:', params.id);
    console.log('[Event PATCH] User ID:', userId);
    console.log('[Event PATCH] Updates received:', JSON.stringify(updates, null, 2));

    // Find the event first to see current state
    const existingEvent = await Event.findOne({ _id: params.id, userId });
    console.log('[Event PATCH] Existing event before update:', JSON.stringify(existingEvent, null, 2));

    // Update the event
    const event = await Event.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: updates },
      { new: true }
    );

    if (!event) {
      console.log('[Event PATCH] Event not found with ID:', params.id, 'and userId:', userId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log('[Event PATCH] Event after update:', JSON.stringify(event, null, 2));
    console.log('[Event PATCH] ===== UPDATE COMPLETE =====');

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[Event PATCH] Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}