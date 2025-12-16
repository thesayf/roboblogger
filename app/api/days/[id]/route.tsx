import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const body = await req.json();

    // Validate the performance rating data
    const { level, score, comment } = body.performanceRating;
    if (!level || typeof score !== "number" || !comment) {
      return NextResponse.json(
        { success: false, message: "Invalid performance rating data" },
        { status: 400 }
      );
    }

    const updatedDay = await Day.findByIdAndUpdate(
      id,
      {
        $set: {
          performanceRating: { level, score, comment },
          // You can add other fields to update here if needed
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedDay) {
      return NextResponse.json(
        { success: false, message: "Day not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedDay });
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json(
      { success: false, message: "Error updating day" },
      { status: 500 }
    );
  }
}
