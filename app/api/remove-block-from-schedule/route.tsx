// app/api/remove-block-from-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Block from "@/models/Block";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { blockId, dayId } = await request.json();

    if (!blockId || !dayId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Remove the block from the day
    const updatedDay = await Day.findByIdAndUpdate(
      dayId,
      { $pull: { blocks: blockId } },
      { new: true }
    );

    if (!updatedDay) {
      return NextResponse.json({ message: "Day not found" }, { status: 404 });
    }

    // Update the block to remove the day reference
    const updatedBlock = await Block.findByIdAndUpdate(
      blockId,
      { $unset: { dayId: "" } },
      { new: true }
    );

    if (!updatedBlock) {
      return NextResponse.json({ message: "Block not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Block removed from schedule successfully",
        updatedDay,
        updatedBlock,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing block from schedule:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
