// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Event from "@/models/Event";
// import Day from "@/models/Day";

// export async function POST(request: Request) {
//   try {
//     await dbConnect();

//     const body = await request.json();
//     const {
//       name,
//       description,
//       date,
//       startTime,
//       endTime,
//       dayId,
//       priority,
//       userId,
//       meetingLink, // Add meetingLink to destructured properties
//       eventType,
//     } = body;

//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     // Create the block
//     const block = new Block({
//       dayId,
//       name,
//       startTime,
//       endTime,
//       status: "pending",
//       userId, // Add userId to the block
//       meetingLink, // Add meetingLink to destructured properties
//       blockType: eventType || "meeting", // Set blockType from eventType
//     });
//     await block.save();

//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

//     // Create the event
//     const event = new Event({
//       name,
//       description,
//       date,
//       startTime,
//       endTime,
//       block: block._id,
//       priority,
//       userId, // Add userId to the event
//       meetingLink, // Add meeting link to the event
//       eventType, // Add eventType to the event
//     });
//     await event.save();

//     // Update the block with the event ID
//     const updatedBlock = await Block.findByIdAndUpdate(
//       block._id,
//       { event: event._id },
//       { new: true }
//     );

//     if (!updatedBlock) {
//       throw new Error("Failed to update block with event ID");
//     }

//     return NextResponse.json(
//       { success: true, block: updatedBlock, event },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error creating event with block:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Error creating event with block",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Event from "@/models/Event";
// import Day from "@/models/Day";

// export async function POST(request: Request) {
//   try {
//     await dbConnect();

//     const body = await request.json();
//     const {
//       name,
//       description,
//       date,
//       startTime,
//       endTime,
//       dayId,
//       priority,
//       userId,
//       meetingLink,
//       eventType,
//     } = body;

//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Find the day and get all its blocks
//     const day = await Day.findById(dayId).populate("blocks");
//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // Find the correct insertion index based on time
//     const eventStartTime = timeToMinutes(startTime);
//     let insertIndex = day.blocks.length; // Default to end

//     for (let i = 0; i < day.blocks.length; i++) {
//       const blockTime = timeToMinutes(day.blocks[i].startTime);
//       if (eventStartTime < blockTime) {
//         insertIndex = i;
//         break;
//       }
//     }

//     // Create the block with the correct index
//     const block = new Block({
//       dayId,
//       name,
//       startTime,
//       endTime,
//       status: "pending",
//       userId,
//       meetingLink,
//       blockType: eventType || "meeting",
//       index: insertIndex, // Set the correct index based on time
//     });
//     await block.save();

//     // Increment indices for all blocks that should come after this one
//     await Block.updateMany(
//       { dayId, index: { $gte: insertIndex } },
//       { $inc: { index: 1 } }
//     );

//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

//     // Create the event
//     const event = new Event({
//       name,
//       description,
//       date,
//       startTime,
//       endTime,
//       block: block._id,
//       priority,
//       userId,
//       meetingLink,
//       eventType,
//     });
//     await event.save();

//     // Update the block with the event ID
//     const updatedBlock = await Block.findByIdAndUpdate(
//       block._id,
//       { event: event._id },
//       { new: true }
//     );

//     if (!updatedBlock) {
//       throw new Error("Failed to update block with event ID");
//     }

//     return NextResponse.json(
//       { success: true, block: updatedBlock, event },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error creating event with block:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Error creating event with block",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Event from "@/models/Event";
import Day from "@/models/Day";

// Helper function to convert time to minutes for comparison
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      dayId,
      priority,
      userId,
      meetingLink,
      eventType,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the day
    const day = await Day.findById(dayId);
    if (!day) {
      return NextResponse.json(
        { success: false, message: "Day not found" },
        { status: 404 }
      );
    }

    // Get all blocks for this day
    const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });

    // Find where to insert new event/block based on closest end time
    const eventStartTimeMinutes = timeToMinutes(startTime);
    let insertIndex = 0;
    let blockFoundBefore = false;

    // Replace it with this fixed version:
    if (existingBlocks.length > 0) {
      // Find the block with the closest end time that comes BEFORE the event's start time
      let closestBlock: any = null; // ✅ Fix: Explicitly type as 'any'
      let smallestDifference = Infinity;

      existingBlocks.forEach((block: any) => {
        // ✅ Fix: Type the block parameter too
        const endTimeMinutes = timeToMinutes(block.endTime);

        // Only consider blocks that end before or at the event's start time
        if (endTimeMinutes <= eventStartTimeMinutes) {
          const difference = eventStartTimeMinutes - endTimeMinutes;

          if (difference < smallestDifference) {
            smallestDifference = difference;
            closestBlock = block;
            blockFoundBefore = true;
          }
        }
      });

      // ✅ Now this works without error:
      if (blockFoundBefore && closestBlock) {
        insertIndex = (closestBlock.index || 0) + 1;
      } else {
        insertIndex = 0;
      }
    }

    // Create the block with the correct index
    const block = new Block({
      dayId,
      name,
      description, // Adding description to the block for consistency
      startTime,
      endTime,
      status: "pending",
      userId,
      meetingLink,
      blockType: eventType || "meeting",
      index: insertIndex, // Set the correct index based on our new logic
    });
    await block.save();

    // Increment indices for all blocks that should come after this one
    // Exclude the newly created block from the update
    await Block.updateMany(
      { dayId, index: { $gte: insertIndex }, _id: { $ne: block._id } },
      { $inc: { index: 1 } }
    );

    // Add the block to the day
    await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

    // Create the event
    const event = new Event({
      name,
      description,
      date,
      startTime,
      endTime,
      block: block._id,
      priority,
      userId,
      meetingLink,
      eventType,
    });
    await event.save();

    // Update the block with the event ID
    const updatedBlock = await Block.findByIdAndUpdate(
      block._id,
      { event: event._id },
      { new: true }
    );

    if (!updatedBlock) {
      throw new Error("Failed to update block with event ID");
    }

    return NextResponse.json(
      { success: true, block: updatedBlock, event },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event with block:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error creating event with block",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
