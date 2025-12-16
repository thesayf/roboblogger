// // app/api/add-block-to-schedule/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// export async function POST(request: NextRequest) {
//   console.log("did this even load");
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       console.log("missing the required fields");
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }
//     console.log("this loaded? part two");

//     // Find the day and get the current number of blocks to set the index
//     const day = await Day.findById(dayId).populate('blocks');
//     const blockCount = day?.blocks?.length || 0;

//     // Create the new block with the index set to the end of the list
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       status: "pending",
//       blockType,
//       description,
//       index: blockCount, // Set the index based on current block count
//     });

//     console.log("this is the new block", newBlock);

//     await newBlock.save();

//     console.log(newBlock);
//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: newBlock._id } });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding block to schedule:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Find the day and get all its blocks
//     const day = await Day.findById(dayId).populate("blocks");
//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Find the correct insertion index based on time
//     const newBlockTime = timeToMinutes(startTime);
//     let insertIndex = day.blocks.length; // Default to end

//     for (let i = 0; i < day.blocks.length; i++) {
//       const blockTime = timeToMinutes(day.blocks[i].startTime);
//       if (newBlockTime < blockTime) {
//         insertIndex = i;
//         break;
//       }
//     }

//     // Create the new block with the correct index
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       status: "pending",
//       blockType,
//       description,
//       index: insertIndex,
//     });

//     await newBlock.save();

//     // Increment indices for all blocks that should come after this one
//     await Block.updateMany(
//       { dayId, index: { $gte: insertIndex } },
//       { $inc: { index: 1 } }
//     );

//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: newBlock._id } });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding block to schedule:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Find the day
//     const day = await Day.findById(dayId);
//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Get all blocks for this day and explicitly sort them by startTime
//     const existingBlocks = await Block.find({ dayId }).sort({ startTime: 1 });

//     // Find the correct insertion index based on time
//     const newBlockTimeMinutes = timeToMinutes(startTime);
//     let insertIndex = existingBlocks.length; // Default to end

//     for (let i = 0; i < existingBlocks.length; i++) {
//       const blockTimeMinutes = timeToMinutes(existingBlocks[i].startTime);
//       if (newBlockTimeMinutes < blockTimeMinutes) {
//         insertIndex = i;
//         break;
//       }
//     }

//     // Create the new block with the correct index
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       status: "pending",
//       blockType,
//       description,
//       index: insertIndex,
//     });

//     // Save the new block first
//     await newBlock.save();

//     // Update indices of all blocks that should come after this one
//     // Use a more specific query to update only the affected blocks
//     await Block.updateMany(
//       {
//         dayId,
//         _id: { $ne: newBlock._id }, // Don't update the new block
//         index: { $gte: insertIndex },
//       },
//       { $inc: { index: 1 } }
//     );

//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: newBlock._id } });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding block to schedule:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// export async function POST(request: NextRequest) {
//   console.log("=== ADD BLOCK ENDPOINT STARTED ===");
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     console.log("Request Body:", {
//       dayId,
//       name,
//       startTime,
//       endTime,
//       userId,
//       blockType,
//     });

//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       console.log("Missing required fields");
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Find the day
//     const day = await Day.findById(dayId);
//     console.log("Day found:", day ? "Yes" : "No");

//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Get all blocks for this day and explicitly sort them by index first, then startTime
//     const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });
//     console.log("Existing blocks count:", existingBlocks.length);
//     console.log(
//       "Existing blocks (simplified):",
//       existingBlocks.map((b) => ({
//         id: b._id.toString().slice(-4),
//         name: b.name,
//         startTime: b.startTime,
//         index: b.index,
//         minutes: timeToMinutes(b.startTime),
//       }))
//     );

//     // Find the correct insertion index based on time
//     const newBlockTimeMinutes = timeToMinutes(startTime);
//     console.log("New block time in minutes:", newBlockTimeMinutes);

//     let insertIndex = existingBlocks.length; // Default to end
//     console.log("Initial insert index (end of list):", insertIndex);

//     for (let i = 0; i < existingBlocks.length; i++) {
//       const blockTimeMinutes = timeToMinutes(existingBlocks[i].startTime);
//       console.log(`Comparing with block ${i}:`, {
//         blockName: existingBlocks[i].name,
//         blockTime: existingBlocks[i].startTime,
//         blockMinutes: blockTimeMinutes,
//         newBlockMinutes: newBlockTimeMinutes,
//         comparison:
//           newBlockTimeMinutes < blockTimeMinutes ? "earlier" : "later or equal",
//       });

//       if (newBlockTimeMinutes < blockTimeMinutes) {
//         insertIndex = i;
//         console.log(`Found insertion point at index ${i}`);
//         break;
//       }
//     }

//     console.log("Final decided insert index:", insertIndex);

//     // Create the new block with the correct index
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       status: "pending",
//       blockType,
//       description,
//       index: insertIndex,
//     });

//     console.log("New block created (not yet saved):", {
//       id: newBlock._id.toString(),
//       name: newBlock.name,
//       startTime: newBlock.startTime,
//       index: newBlock.index,
//     });

//     // Save the new block first
//     await newBlock.save();
//     console.log("New block saved to database");

//     // Update indices of all blocks that should come after this one
//     const updateResult = await Block.updateMany(
//       {
//         dayId,
//         _id: { $ne: newBlock._id }, // Don't update the new block
//         index: { $gte: insertIndex },
//       },
//       { $inc: { index: 1 } }
//     );

//     console.log("Update result for existing blocks:", {
//       matched: updateResult.matchedCount,
//       modified: updateResult.modifiedCount,
//     });

//     // Add the block to the day
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: newBlock._id } });
//     console.log("Block added to day's blocks array");

//     // Do a final query to verify the state
//     const finalBlocks = await Block.find({ dayId }).sort({ index: 1 });
//     console.log(
//       "Final blocks after operation (simplified):",
//       finalBlocks.map((b) => ({
//         id: b._id.toString().slice(-4),
//         name: b.name,
//         startTime: b.startTime,
//         index: b.index,
//         minutes: timeToMinutes(b.startTime),
//       }))
//     );

//     console.log("=== ADD BLOCK ENDPOINT COMPLETED SUCCESSFULLY ===");
//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("=== ADD BLOCK ENDPOINT ERROR ===");
//     console.error("Error adding block to schedule:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// // app/api/add-block-to-schedule/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// // Helper to convert "HH:mm" → total minutes
// function timeToMinutes(timeStr: string): number {
//   const [hrs, mins] = timeStr.split(":").map(Number);
//   return hrs * 60 + mins;
// }

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     // --- 1) Validate input ---
//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // --- 2) Ensure the day exists ---
//     const day = await Day.findById(dayId);
//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // --- 3) Fetch existing blocks in true chronological order ---
//     const existingBlocks = await Block.find({ dayId }).sort({ startTime: 1 });

//     // --- 4) Find where the new block belongs by time ---
//     const newBlockMinutes = timeToMinutes(startTime);
//     let insertIndex = existingBlocks.findIndex(
//       (b) => timeToMinutes(b.startTime) > newBlockMinutes
//     );
//     if (insertIndex === -1) {
//       // all existing blocks start at or before this time → goes to end
//       insertIndex = existingBlocks.length;
//     }

//     // --- 5) Create & save the new block with that index ---
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       description,
//       blockType,
//       status: "pending",
//       index: insertIndex,
//     });
//     await newBlock.save();

//     // --- 6) Bump the indices of only those blocks *after* our insertion point ---
//     const toBump = existingBlocks.slice(insertIndex).map((b) => b._id);
//     if (toBump.length > 0) {
//       await Block.updateMany({ _id: { $in: toBump } }, { $inc: { index: 1 } });
//     }

//     // --- 7) Add the new block’s ID into the Day document’s blocks array ---
//     await Day.findByIdAndUpdate(dayId, {
//       $push: { blocks: newBlock._id },
//     });

//     // --- 8) Return success + the new block ---
//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("Error in add-block route:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Day from "@/models/Day";
// import Block from "@/models/Block";

// // Helper to convert "HH:mm" → total minutes
// function timeToMinutes(timeStr: string): number {
//   const [hrs, mins] = timeStr.split(":").map(Number);
//   return hrs * 60 + mins;
// }

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const { dayId, name, startTime, endTime, userId, description, blockType } =
//       await request.json();

//     // --- 1) Validate input ---
//     if (!dayId || !name || !startTime || !endTime || !userId) {
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // --- 2) Ensure the day exists ---
//     const day = await Day.findById(dayId);
//     if (!day) {
//       return NextResponse.json(
//         { success: false, message: "Day not found" },
//         { status: 404 }
//       );
//     }

//     // --- 3) Fetch existing blocks ---
//     const existingBlocks = await Block.find({ dayId });

//     // --- 4) Find where to insert new block based on closest end time ---
//     const newBlockStartMinutes = timeToMinutes(startTime);
//     let insertIndex = 0;

//     if (existingBlocks.length > 0) {
//       // Find the block with the closest end time to new block's start time
//       let closestBlock = existingBlocks[0];
//       let smallestDifference = Infinity;

//       existingBlocks.forEach((block) => {
//         const endTimeMinutes = timeToMinutes(block.endTime);
//         const difference = Math.abs(newBlockStartMinutes - endTimeMinutes);

//         if (difference < smallestDifference) {
//           smallestDifference = difference;
//           closestBlock = block;
//         }
//       });

//       // Insert after the closest block
//       insertIndex = (closestBlock.index || 0) + 1;
//     }

//     // --- 5) Create & save the new block with that index ---
//     const newBlock = new Block({
//       name,
//       startTime,
//       endTime,
//       dayId,
//       userId,
//       description,
//       blockType,
//       status: "pending",
//       index: insertIndex,
//     });
//     await newBlock.save();

//     // --- 6) Bump the indices of blocks after our insertion point ---
//     await Block.updateMany(
//       { dayId, index: { $gte: insertIndex }, _id: { $ne: newBlock._id } },
//       { $inc: { index: 1 } }
//     );

//     // --- 7) Add the new block's ID into the Day document's blocks array ---
//     await Day.findByIdAndUpdate(dayId, {
//       $push: { blocks: newBlock._id },
//     });

//     // --- 8) Return success + the new block ---
//     return NextResponse.json(
//       {
//         success: true,
//         message: "Block added to schedule successfully",
//         block: newBlock,
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("Error in add-block route:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Error adding block to schedule",
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Block from "@/models/Block";

// Helper to convert "HH:mm" → total minutes
function timeToMinutes(timeStr: string): number {
  const [hrs, mins] = timeStr.split(":").map(Number);
  return hrs * 60 + mins;
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { dayId, name, startTime, endTime, userId, description, blockType } =
      await request.json();

    // --- 1) Validate input ---
    if (!dayId || !name || !startTime || !endTime || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- 2) Ensure the day exists ---
    const day = await Day.findById(dayId);
    if (!day) {
      return NextResponse.json(
        { success: false, message: "Day not found" },
        { status: 404 }
      );
    }

    // --- 3) Fetch existing blocks ---
    const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });

    // --- 4) Find where to insert new block based on nearest end time to the new block's start time
    const newBlockStartMinutes = timeToMinutes(startTime);
    let insertIndex = 0;
    let closestPrecedingBlockIndex = -1;
    let closestEndTimeBeforeStart = -Infinity;

    if (existingBlocks.length > 0) {
      // Find the block with the closest end time to our new block's start time
      for (let i = 0; i < existingBlocks.length; i++) {
        const block = existingBlocks[i];
        const blockEndTime = timeToMinutes(block.endTime);

        // Look for blocks that end before our new block starts
        if (blockEndTime <= newBlockStartMinutes) {
          // Find the block with the closest end time to our start time
          if (blockEndTime > closestEndTimeBeforeStart) {
            closestEndTimeBeforeStart = blockEndTime;
            closestPrecedingBlockIndex = i;
          }
        }
      }

      // If we found a block that ends before our new block starts, insert after it
      if (closestPrecedingBlockIndex !== -1) {
        insertIndex = existingBlocks[closestPrecedingBlockIndex].index + 1;
      }
    }

    // --- 5) Create & save the new block with that index ---
    const newBlock = new Block({
      name,
      startTime,
      endTime,
      dayId,
      userId,
      description,
      blockType,
      status: "pending",
      index: insertIndex,
    });
    await newBlock.save();

    // --- 6) Bump the indices of blocks after our insertion point ---
    await Block.updateMany(
      { dayId, index: { $gte: insertIndex }, _id: { $ne: newBlock._id } },
      { $inc: { index: 1 } }
    );

    // --- 7) Add the new block's ID into the Day document's blocks array ---
    await Day.findByIdAndUpdate(dayId, {
      $push: { blocks: newBlock._id },
    });

    // --- 8) Return success + the new block ---
    return NextResponse.json(
      {
        success: true,
        message: "Block added to schedule successfully",
        block: newBlock,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in add-block route:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error adding block to schedule",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
