import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";

export async function POST(request: NextRequest) {
  await dbConnect();

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ message: "Missing userId" }, { status: 400 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all incomplete blocks before today
    const incompleteBlocks = await Block.find({
      userId: userId,
      date: { $lt: today },
      status: { $ne: "completed" },
    });

    if (incompleteBlocks.length === 0) {
      return NextResponse.json({ message: "No incomplete blocks to process." });
    }

    const blockIds = incompleteBlocks.map((block) => block._id);

    // Update block statuses to 'completed'
    await Block.updateMany(
      { _id: { $in: blockIds } },
      { $set: { status: "completed" } }
    );

    // Unassign incomplete tasks
    await Task.updateMany(
      {
        blockId: { $in: blockIds },
        completed: false,
      },
      { $unset: { blockId: "" } }
    );

    return NextResponse.json({
      message: "Incomplete blocks processed successfully.",
    });
  } catch (error) {
    console.error("Error processing incomplete blocks:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
