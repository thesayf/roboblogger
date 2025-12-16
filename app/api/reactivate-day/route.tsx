import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { dayId } = body;

    if (!dayId) {
      return NextResponse.json(
        { error: "Day ID is required" },
        { status: 400 }
      );
    }

    const updatedDay = await Day.findByIdAndUpdate(
      dayId,
      { completed: false },
      { new: true }
    );

    if (!updatedDay) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDay);
  } catch (error) {
    console.error("Error reactivating day:", error);
    return NextResponse.json(
      { error: "Error reactivating day" },
      { status: 500 }
    );
  }
}
