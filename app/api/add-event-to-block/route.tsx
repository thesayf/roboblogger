// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Task from "@/models/Task";
// import Event from "@/models/Event";
// import Day from "@/models/Day";

// interface AddEventToBlockRequestBody {
//   eventId: string;
//   dayId: string;
//   date: string;
//   isRecurringInstance: boolean;
//   meetingLink?: string;
// }

// export async function POST(request: Request) {
//   await dbConnect();

//   try {
//     const body: AddEventToBlockRequestBody = await request.json();
//     const { eventId, dayId, date, isRecurringInstance } = body;

//     if (!eventId || !dayId || !date) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Fetch the event and populate its tasks
//     const event = await Event.findById(eventId).populate("tasks");
//     if (!event) {
//       return NextResponse.json(
//         { success: false, error: "Event not found" },
//         { status: 404 }
//       );
//     }

//     console.log("this is the event.", event);

//     // Format the date for display (MM/DD/YY format)
//     const formattedDate = new Date(date).toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//       year: "2-digit",
//     });

//     // Create a name for the block based on whether it's a recurring instance
//     let blockName = event.name;
//     if (isRecurringInstance) {
//       blockName = `${event.name} • ${formattedDate}`;
//     }

//     // Create the new block for the event
//     const block = new Block({
//       dayId,
//       name: blockName,
//       description: event.description,
//       startTime: event.startTime,
//       endTime: event.endTime,
//       status: "pending",
//       event: eventId,
//       blockType: "meeting", // Use eventType from event or default to meeting
//       meetingLink: body.meetingLink || event.zoomLink,
//       isRecurringInstance: isRecurringInstance || false,
//       originalEventName: event.name, // Store original name for reference
//     });
//     await block.save();

//     // Create new tasks for the block based on the event's tasks.
//     // This copies over each task's name, description, priority, duration, type, etc.
//     const tasksToCreate = (event.tasks || []).map((task: any) => ({
//       name: task.name,
//       description: task.description,
//       priority: task.priority,
//       duration: task.duration,
//       blockId: block._id,
//       eventId: eventId,
//       type: task.type || "default", // adjust as needed
//       completed: false,
//     }));

//     const createdTasks = await Task.insertMany(tasksToCreate);

//     // Update the block with the new task IDs
//     block.tasks = createdTasks.map((task) => task._id);
//     await block.save();

//     // Update the Day document to include the new block
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

//     // Only update the Event with the block reference if it's not a recurring instance
//     if (!isRecurringInstance) {
//       await Event.findByIdAndUpdate(eventId, { block: block._id });
//     }

//     return NextResponse.json(
//       { success: true, block, tasks: createdTasks },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding event to block:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Error adding event to block",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Task from "@/models/Task";
// import Event from "@/models/Event";
// import Day from "@/models/Day";

// interface AddEventToBlockRequestBody {
//   eventId: string;
//   dayId: string;
//   date: string;
//   isRecurringInstance: boolean;
//   meetingLink?: string;
// }

// export async function POST(request: Request) {
//   await dbConnect();

//   try {
//     const body: AddEventToBlockRequestBody = await request.json();
//     const { eventId, dayId, date, isRecurringInstance } = body;

//     if (!eventId || !dayId || !date) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Fetch the event and populate its tasks
//     const event = await Event.findById(eventId).populate("tasks");
//     if (!event) {
//       return NextResponse.json(
//         { success: false, error: "Event not found" },
//         { status: 404 }
//       );
//     }

//     // Find the day and get all its blocks to determine insertion position
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
//     const eventStartTime = timeToMinutes(event.startTime);
//     let insertIndex = day.blocks.length; // Default to end

//     for (let i = 0; i < day.blocks.length; i++) {
//       const blockTime = timeToMinutes(day.blocks[i].startTime);
//       if (eventStartTime < blockTime) {
//         insertIndex = i;
//         break;
//       }
//     }

//     // Format the date for display (MM/DD/YY format)
//     const formattedDate = new Date(date).toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//       year: "2-digit",
//     });

//     // Create a name for the block based on whether it's a recurring instance
//     let blockName = event.name;
//     if (isRecurringInstance) {
//       blockName = `${event.name} • ${formattedDate}`;
//     }

//     // Create the new block for the event with the correct index
//     const block = new Block({
//       dayId,
//       name: blockName,
//       description: event.description,
//       startTime: event.startTime,
//       endTime: event.endTime,
//       status: "pending",
//       event: eventId,
//       blockType: "meeting",
//       meetingLink: body.meetingLink || event.zoomLink,
//       isRecurringInstance: isRecurringInstance || false,
//       originalEventName: event.name,
//       index: insertIndex, // Set the correct index position
//     });
//     await block.save();

//     // Increment indices for all blocks that should come after this one
//     await Block.updateMany(
//       { dayId, index: { $gte: insertIndex } },
//       { $inc: { index: 1 } }
//     );

//     // Create new tasks for the block based on the event's tasks
//     const tasksToCreate = (event.tasks || []).map((task: any) => ({
//       name: task.name,
//       description: task.description,
//       priority: task.priority,
//       duration: task.duration,
//       blockId: block._id,
//       eventId: eventId,
//       type: task.type || "default",
//       completed: false,
//     }));

//     const createdTasks = await Task.insertMany(tasksToCreate);

//     // Update the block with the new task IDs
//     block.tasks = createdTasks.map((task) => task._id);
//     await block.save();

//     // Update the Day document to include the new block
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

//     // Only update the Event with the block reference if it's not a recurring instance
//     if (!isRecurringInstance) {
//       await Event.findByIdAndUpdate(eventId, { block: block._id });
//     }

//     return NextResponse.json(
//       { success: true, block, tasks: createdTasks },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding event to block:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Error adding event to block",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Task from "@/models/Task";
// import Event from "@/models/Event";
// import Day from "@/models/Day";

// interface AddEventToBlockRequestBody {
//   eventId: string;
//   dayId: string;
//   date: string;
//   isRecurringInstance: boolean;
//   meetingLink?: string;
// }

// export async function POST(request: Request) {
//   await dbConnect();

//   try {
//     const body: AddEventToBlockRequestBody = await request.json();
//     const { eventId, dayId, date, isRecurringInstance } = body;

//     if (!eventId || !dayId || !date) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // Fetch the event and populate its tasks
//     const event = await Event.findById(eventId).populate("tasks");
//     if (!event) {
//       return NextResponse.json(
//         { success: false, error: "Event not found" },
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
//     const eventStartTimeMinutes = timeToMinutes(event.startTime);
//     let insertIndex = existingBlocks.length; // Default to end

//     for (let i = 0; i < existingBlocks.length; i++) {
//       const blockTimeMinutes = timeToMinutes(existingBlocks[i].startTime);
//       if (eventStartTimeMinutes < blockTimeMinutes) {
//         insertIndex = i;
//         break;
//       }
//     }

//     // Format the date for display (MM/DD/YY format)
//     const formattedDate = new Date(date).toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//       year: "2-digit",
//     });

//     // Create a name for the block based on whether it's a recurring instance
//     let blockName = event.name;
//     if (isRecurringInstance) {
//       blockName = `${event.name} • ${formattedDate}`;
//     }

//     // Create the new block for the event with the correct index
//     const block = new Block({
//       dayId,
//       name: blockName,
//       description: event.description,
//       startTime: event.startTime,
//       endTime: event.endTime,
//       status: "pending",
//       event: eventId,
//       blockType: "meeting",
//       meetingLink: body.meetingLink || event.zoomLink,
//       isRecurringInstance: isRecurringInstance || false,
//       originalEventName: event.name,
//       index: insertIndex, // Set the correct index position
//     });

//     // Save the block first
//     await block.save();

//     // Update indices of all blocks that should come after this one
//     // Use a more specific query to avoid updating the newly created block
//     await Block.updateMany(
//       {
//         dayId,
//         _id: { $ne: block._id }, // Exclude the new block from the update
//         index: { $gte: insertIndex },
//       },
//       { $inc: { index: 1 } }
//     );

//     // Create new tasks for the block based on the event's tasks
//     const tasksToCreate = (event.tasks || []).map((task: any) => ({
//       name: task.name,
//       description: task.description,
//       priority: task.priority,
//       duration: task.duration,
//       blockId: block._id,
//       eventId: eventId,
//       type: task.type || "default",
//       completed: false,
//     }));

//     const createdTasks = await Task.insertMany(tasksToCreate);

//     // Update the block with the new task IDs
//     block.tasks = createdTasks.map((task) => task._id);
//     await block.save();

//     // Update the Day document to include the new block
//     await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

//     // Only update the Event with the block reference if it's not a recurring instance
//     if (!isRecurringInstance) {
//       await Event.findByIdAndUpdate(eventId, { block: block._id });
//     }

//     return NextResponse.json(
//       { success: true, block, tasks: createdTasks },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error adding event to block:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Error adding event to block",
//         details: error instanceof Error ? error.message : String(error),
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";
import Event from "@/models/Event";
import Day from "@/models/Day";

interface AddEventToBlockRequestBody {
  eventId: string;
  dayId: string;
  date: string;
  isRecurringInstance: boolean;
  meetingLink?: string;
}
// Helper function to convert time to minutes for comparison
function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body: AddEventToBlockRequestBody = await request.json();
    const { eventId, dayId, date, isRecurringInstance } = body;

    if (!eventId || !dayId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the event and populate its tasks
    const event = await Event.findById(eventId).populate("tasks");
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Get all blocks for this day
    const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });

    // Find where to insert new event based on nearest end time to the event's start time
    const eventStartTimeMinutes = timeToMinutes(event.startTime);
    let insertIndex = 0;
    let closestEndTimeBeforeStart = -Infinity;
    let closestPrecedingBlockIndex = -1;

    if (existingBlocks.length > 0) {
      // Find the block with the closest end time to our event's start time
      for (let i = 0; i < existingBlocks.length; i++) {
        const block = existingBlocks[i];
        const blockEndTime = timeToMinutes(block.endTime);

        // Look for blocks that end before our event starts
        if (blockEndTime <= eventStartTimeMinutes) {
          // Find the block with the closest end time to our start time
          if (blockEndTime > closestEndTimeBeforeStart) {
            closestEndTimeBeforeStart = blockEndTime;
            closestPrecedingBlockIndex = i;
          }
        }
      }

      // If we found a block that ends before our event starts, insert after it
      if (closestPrecedingBlockIndex !== -1) {
        insertIndex = existingBlocks[closestPrecedingBlockIndex].index + 1;
      }
    }

    // Format the date for display (MM/DD/YY format)
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

    // Create a name for the block based on whether it's a recurring instance
    let blockName = event.name;
    if (isRecurringInstance) {
      blockName = `${event.name} • ${formattedDate}`;
    }

    // Create the new block for the event with the correct index
    const block = new Block({
      dayId,
      name: blockName,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      status: "pending",
      event: eventId,
      blockType: "meeting",
      meetingLink: body.meetingLink || event.zoomLink,
      isRecurringInstance: isRecurringInstance || false,
      originalEventName: event.name,
      index: insertIndex, // Set the correct index position
    });

    // Save the block first
    await block.save();

    // Update indices of all blocks that should come after this one
    // Use a more specific query to avoid updating the newly created block
    await Block.updateMany(
      {
        dayId,
        _id: { $ne: block._id }, // Exclude the new block from the update
        index: { $gte: insertIndex },
      },
      { $inc: { index: 1 } }
    );

    // Create new tasks for the block based on the event's tasks (if any exist in metadata)
    const tasksToCreate = ((event as any).tasks || []).map((task: any) => ({
      name: task.name,
      description: task.description,
      priority: task.priority,
      duration: task.duration,
      blockId: block._id,
      eventId: eventId,
      type: task.type || "default",
      completed: false,
    }));

    const createdTasks = await Task.insertMany(tasksToCreate);

    // Update the block with the new task IDs
    block.tasks = createdTasks.map((task) => task._id);
    await block.save();

    // Update the Day document to include the new block
    await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });

    // Only update the Event with the block reference if it's not a recurring instance
    if (!isRecurringInstance) {
      await Event.findByIdAndUpdate(eventId, { block: block._id });
    }

    return NextResponse.json(
      { success: true, block, tasks: createdTasks },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding event to block:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error adding event to block",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
