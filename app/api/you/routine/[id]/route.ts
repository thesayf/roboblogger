import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Routine from "@/models/Routine";

// PATCH - Update a specific routine
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

    // Update the routine
    const routine = await Routine.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: updates },
      { new: true }
    );

    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { error: "Failed to update routine" },
      { status: 500 }
    );
  }
}