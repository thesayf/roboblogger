import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { dayId, performanceRating } = body;

    console.log("this is the performance rating", performanceRating);

    if (!dayId) {
      return NextResponse.json(
        { error: "Day ID is required" },
        { status: 400 }
      );
    }

    // Create update object with completed status
    const updateData: any = { completed: true };

    // Add performance rating if provided
    if (performanceRating) {
      updateData.performanceRating = performanceRating;
    }

    // Update the day with completed status and optional performance rating
    // Use populate to get blocks and tasks
    const updatedDay = await Day.findByIdAndUpdate(dayId, updateData, {
      new: true,
    }).populate({
      path: "blocks",
      populate: {
        path: "tasks",
      },
    });

    console.log(updateData);
    console.log(updatedDay);

    if (!updatedDay) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDay);
  } catch (error) {
    console.error("Error completing day:", error);
    return NextResponse.json(
      { error: "Error completing day" },
      { status: 500 }
    );
  }
}
