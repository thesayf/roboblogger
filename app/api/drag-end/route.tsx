import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";
import mongoose from "mongoose";

export async function PATCH(request: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { blocks } = await request.json();

    // Bulk update blocks with their task arrays
    const blockUpdates = blocks.map((block: any) => ({
      updateOne: {
        filter: { _id: block._id },
        update: { $set: { index: block.index, tasks: block.tasks.map((task: any) => task._id) } },
      },
    }));


    // Get all tasks that need updating
    const taskUpdates = blocks.flatMap((block: any) =>
      block.tasks.map((task: any) => ({
        updateOne: {
          filter: { _id: task._id },
          update: { $set: { block: block._id } },
        },
      }))
    );

    // Execute bulk operations
    await Block.bulkWrite(blockUpdates, { session });
    await Task.bulkWrite(taskUpdates, { session });

    await session.commitTransaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in bulk update:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  } finally {
    session.endSession();
  }
}
