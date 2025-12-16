import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Day from "@/models/Day";
import Event from "@/models/Event";
import Task from "@/models/Task";

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   await dbConnect();

//   try {
//     const blockId = params.id;

//     // Find the block and update its status
//     const block = await Block.findByIdAndUpdate(
//       blockId,
//       { status: "pending" },
//       { new: true }
//     );

//     if (!block) {
//       return NextResponse.json({ error: "Block not found" }, { status: 404 });
//     }

//     // Find the day containing this block and update its completedBlocksCount
//     const day = await Day.findOne({ blocks: blockId });
//     if (day) {
//       day.completedBlocksCount = (day.completedBlocksCount || 0) - 1;
//       await day.save();
//     }

//     return NextResponse.json({
//       message: "Block reactivated successfully",
//       block,
//     });
//   } catch (error) {
//     console.error("Error reactivating block:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const blockId = params.id;

    // Find the block and update its status
    const block = await Block.findByIdAndUpdate(
      blockId,
      { status: "pending" },
      { new: true }
    ).populate("event");

    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // If this is an event block, update the associated event
    if (block.event) {
      const event = block.event;

      // Handle recurring vs. one-time events differently
      if (event.isRecurring) {
        // For recurring events, update the instance in history to "incomplete"
        await Event.findOneAndUpdate(
          {
            _id: event._id,
            "instanceHistory.blockId": blockId,
          },
          {
            $set: {
              "instanceHistory.$.status": "incomplete",
            },
          },
          { new: true }
        );
      } else {
        // For one-time events, mark the event itself as not completed
        await Event.findByIdAndUpdate(
          event._id,
          { completed: false },
          { new: true }
        );
      }
    }

    // Find the day containing this block and update its completedBlocksCount
    const day = await Day.findOne({ blocks: blockId });
    if (day) {
      day.completedBlocksCount = (day.completedBlocksCount || 0) - 1;
      await day.save();
    }

    return NextResponse.json({
      message: "Block reactivated successfully",
      block,
    });
  } catch (error) {
    console.error("Error reactivating block:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
