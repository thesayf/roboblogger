// app/api/days/[dayId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { dayId: string } }
) {
  await dbConnect();

  try {
    const { dayId } = params;
    console.log("Fetching day with ID:", dayId);

    const day = await Day.findById(dayId).populate({
      path: "blocks",
      populate: { path: "tasks" },
    });

    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error("Error fetching day:", error);
    return NextResponse.json({ error: "Error fetching day" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { dayId: string } }
) {
  await dbConnect();

  try {
    const { dayId } = params;
    const updateData = await request.json();

    console.log("Updating day:", dayId);
    console.log("Update data:", updateData);

    const updatedDay = await Day.findByIdAndUpdate(
      dayId,
      { $set: updateData },
      { new: true }
    ).populate({
      path: "blocks",
      populate: { path: "tasks" },
    });

    if (!updatedDay) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDay);
  } catch (error) {
    console.error("Error updating day:", error);
    return NextResponse.json({ error: "Error updating day" }, { status: 500 });
  }
}
