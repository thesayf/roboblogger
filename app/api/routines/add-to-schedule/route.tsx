// // // import { NextResponse } from "next/server";
// // // import dbConnect from "@/lib/mongo";
// // // import Block from "@/models/Block";
// // // import Task from "@/models/Task";
// // // import Day from "@/models/Day"; // Import the Day model
// // // import { ITask } from "@/models/Task";

// // // interface AddRoutineRequestBody {
// // //   dayId: string;
// // //   routineId: string;
// // //   name: string;
// // //   startTime: string;
// // //   endTime: string;
// // //   tasks: Omit<ITask, "blockId">[];
// // //   blockType?:
// // //     | "deep-work"
// // //     | "break"
// // //     | "meeting"
// // //     | "health"
// // //     | "exercise"
// // //     | "admin"
// // //     | "personal";
// // // }

// // // export async function POST(request: Request) {
// // //   await dbConnect();

// // //   try {
// // //     const body: AddRoutineRequestBody = await request.json();
// // //     const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
// // //       body;

// // //     console.log("Add routine to schedule:", body);

// // //     // Helper function to convert time to minutes for comparison
// // //     function timeToMinutes(timeStr) {
// // //       const [hours, minutes] = timeStr.split(":").map(Number);
// // //       return hours * 60 + minutes;
// // //     }

// // //     // Get all blocks for this day
// // //     const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });

// // //     // Find where to insert new routine block based on closest end time
// // //     const routineStartTimeMinutes = timeToMinutes(startTime);
// // //     let insertIndex = 0;
// // //     let blockFoundBefore = false;

// // //     if (existingBlocks.length > 0) {
// // //       // Find the block with the closest end time that comes BEFORE the routine's start time
// // //       let closestBlock = null;
// // //       let smallestDifference = Infinity;

// // //       existingBlocks.forEach((block) => {
// // //         const endTimeMinutes = timeToMinutes(block.endTime);

// // //         // Only consider blocks that end before or at the routine's start time
// // //         if (endTimeMinutes <= routineStartTimeMinutes) {
// // //           const difference = routineStartTimeMinutes - endTimeMinutes;

// // //           if (difference < smallestDifference) {
// // //             smallestDifference = difference;
// // //             closestBlock = block;
// // //             blockFoundBefore = true;
// // //           }
// // //         }
// // //       });

// // //       // If we found a block before this one, insert after it
// // //       // Otherwise, insert at the beginning (index 0)
// // //       if (blockFoundBefore && closestBlock) {
// // //         insertIndex = (closestBlock.index || 0) + 1;
// // //       } else {
// // //         insertIndex = 0;
// // //       }
// // //     }

// // //     // Create the new block with the correct insertion index
// // //     const block = await Block.create({
// // //       dayId,
// // //       name,
// // //       startTime,
// // //       endTime,
// // //       routineId,
// // //       blockType: blockType || "personal",
// // //       index: insertIndex, // Set the correct insertion index
// // //       isRoutine: true,
// // //     });

// // //     // Update indices of all blocks that should come after this one
// // //     await Block.updateMany(
// // //       { dayId, index: { $gte: insertIndex }, _id: { $ne: block._id } },
// // //       { $inc: { index: 1 } }
// // //     );

// // //     // Create new tasks based on the routine's tasks
// // //     const tasksToCreate = tasks.map((task) => ({
// // //       name: task.name,
// // //       priority: task.priority,
// // //       duration: task.duration,
// // //       blockId: block._id,
// // //       routineId,
// // //       isRoutineTask: true,
// // //       originalRoutineTaskId: task._id, // Add this line to store reference to original task
// // //       // Add any other relevant fields, but exclude _id
// // //     }));

// // //     const createdTasks = await Task.insertMany(tasksToCreate);

// // //     console.log("tasks created:", createdTasks);

// // //     // Update the block with the created tasks
// // //     block.tasks = createdTasks.map((task) => task._id);
// // //     await block.save();

// // //     // Update the Day document to include the new block
// // //     await Day.findByIdAndUpdate(
// // //       dayId,
// // //       { $push: { blocks: block._id } },
// // //       { new: true }
// // //     );

// // //     return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
// // //   } catch (error) {
// // //     console.error("Error adding routine to schedule:", error);
// // //     return NextResponse.json(
// // //       { message: "Error adding routine to schedule" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // import { NextResponse } from "next/server";
// // import dbConnect from "@/lib/mongo";
// // import Block from "@/models/Block";
// // import Task from "@/models/Task";
// // import Day from "@/models/Day";
// // import { ITask } from "@/models/Task";

// // interface AddRoutineRequestBody {
// //   dayId: string;
// //   routineId: string;
// //   name: string;
// //   startTime: string;
// //   endTime: string;
// //   tasks: Omit<ITask, "blockId">[];
// //   blockType?:
// //     | "deep-work"
// //     | "break"
// //     | "meeting"
// //     | "health"
// //     | "exercise"
// //     | "admin"
// //     | "personal";
// // }

// // export async function POST(request: Request) {
// //   await dbConnect();

// //   try {
// //     const body: AddRoutineRequestBody = await request.json();
// //     const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
// //       body;

// //     console.log("-------- ADD ROUTINE TO SCHEDULE --------");
// //     console.log("Request body:", body);
// //     console.log(
// //       `New routine "${name}" with time range: ${startTime} - ${endTime}`
// //     );

// //     // Helper function to convert time to minutes for comparison
// //     function timeToMinutes(timeStr) {
// //       const [hours, minutes] = timeStr.split(":").map(Number);
// //       return hours * 60 + minutes;
// //     }

// //     // Get all blocks for this day and sort by start time since indices are undefined
// //     const existingBlocks = await Block.find({ dayId }).sort({ startTime: 1 });

// //     console.log(
// //       `Found ${existingBlocks.length} existing blocks for dayId: ${dayId}`
// //     );

// //     // First, let's fix any undefined indices by assigning sequential indices
// //     // This ensures all blocks have proper index values for future operations
// //     let indexFixRequired = false;
// //     for (let i = 0; i < existingBlocks.length; i++) {
// //       if (existingBlocks[i].index === undefined) {
// //         indexFixRequired = true;
// //         break;
// //       }
// //     }

// //     if (indexFixRequired) {
// //       console.log("Fixing undefined block indices...");
// //       // Assign sequential indices based on startTime ordering
// //       for (let i = 0; i < existingBlocks.length; i++) {
// //         await Block.findByIdAndUpdate(existingBlocks[i]._id, { index: i });
// //         existingBlocks[i].index = i; // Update our local copy too
// //       }
// //       console.log("Block indices fixed");
// //     }

// //     // Log all existing blocks
// //     if (existingBlocks.length > 0) {
// //       console.log("Existing blocks with fixed indices:");
// //       existingBlocks.forEach((block, idx) => {
// //         console.log(`[${idx}] Block ID: ${block._id}`);
// //         console.log(`    Name: "${block.name}"`);
// //         console.log(`    Time: ${block.startTime} - ${block.endTime}`);
// //         console.log(`    Index: ${block.index}`);
// //         console.log(`    End Time in minutes: ${timeToMinutes(block.endTime)}`);
// //       });
// //     } else {
// //       console.log("No existing blocks found - new block will be first");
// //     }

// //     // Find where to insert new routine block based on closest end time
// //     const routineStartTimeMinutes = timeToMinutes(startTime);
// //     console.log(
// //       `New routine start time in minutes: ${routineStartTimeMinutes}`
// //     );

// //     let insertIndex = 0;
// //     let blockFoundBefore = false;
// //     let insertAfterBlockId = null;

// //     if (existingBlocks.length > 0) {
// //       // Find the block with the closest end time that comes BEFORE the routine's start time
// //       let closestBlock = null;
// //       let smallestDifference = Infinity;

// //       console.log(
// //         "Evaluating each block to find where to insert the new routine:"
// //       );

// //       existingBlocks.forEach((block, idx) => {
// //         const endTimeMinutes = timeToMinutes(block.endTime);

// //         console.log(
// //           `Checking block "${block.name}" (${block.startTime} - ${block.endTime}):`
// //         );
// //         console.log(`  Block end time in minutes: ${endTimeMinutes}`);
// //         console.log(
// //           `  Routine start time in minutes: ${routineStartTimeMinutes}`
// //         );

// //         // Only consider blocks that end before or at the routine's start time
// //         if (endTimeMinutes <= routineStartTimeMinutes) {
// //           const difference = routineStartTimeMinutes - endTimeMinutes;
// //           console.log(
// //             `  ✓ This block ends before/at routine start time. Difference: ${difference} minutes`
// //           );

// //           if (difference < smallestDifference) {
// //             smallestDifference = difference;
// //             closestBlock = block;
// //             blockFoundBefore = true;
// //             console.log(
// //               `  ✓ This is now the closest block! (Difference: ${difference} minutes)`
// //             );
// //           } else {
// //             console.log(
// //               `  ✗ Not the closest block (current closest difference: ${smallestDifference} minutes)`
// //             );
// //           }
// //         } else {
// //           console.log(
// //             `  ✗ This block ends AFTER routine start time - cannot insert after it`
// //           );
// //         }
// //       });

// //       // If we found a block before this one, insert after it
// //       // Otherwise, insert at the beginning (index 0)
// //       if (blockFoundBefore && closestBlock) {
// //         insertIndex = closestBlock.index + 1;
// //         insertAfterBlockId = closestBlock._id;
// //         console.log(
// //           `Found a block to insert after: "${closestBlock.name}" (${closestBlock.startTime} - ${closestBlock.endTime})`
// //         );
// //         console.log(
// //           `Block's current index: ${closestBlock.index}, so inserting at index: ${insertIndex}`
// //         );
// //       } else {
// //         insertIndex = 0;
// //         console.log(
// //           "No suitable block found that ends before this routine - inserting at beginning (index 0)"
// //         );
// //       }
// //     }

// //     console.log(
// //       `FINAL DECISION: Inserting new routine at index ${insertIndex}`
// //     );

// //     // Create the new block with the correct insertion index
// //     const block = await Block.create({
// //       dayId,
// //       name,
// //       startTime,
// //       endTime,
// //       routineId,
// //       blockType: blockType || "personal",
// //       index: insertIndex, // Set the correct insertion index
// //       isRoutine: true,
// //     });

// //     console.log(
// //       `Created new block with ID: ${block._id} at index: ${insertIndex}`
// //     );

// //     // Update indices of all blocks that should come after this one
// //     const updateResult = await Block.updateMany(
// //       { dayId, index: { $gte: insertIndex }, _id: { $ne: block._id } },
// //       { $inc: { index: 1 } }
// //     );

// //     console.log(
// //       `Updated indices for ${updateResult.modifiedCount} blocks that come after this one`
// //     );

// //     // Create new tasks based on the routine's tasks
// //     const tasksToCreate = tasks.map((task) => ({
// //       name: task.name,
// //       priority: task.priority,
// //       duration: task.duration,
// //       blockId: block._id,
// //       routineId,
// //       isRoutineTask: true,
// //       originalRoutineTaskId: task._id,
// //     }));

// //     const createdTasks = await Task.insertMany(tasksToCreate);
// //     console.log(`Created ${createdTasks.length} tasks for the routine`);

// //     // Update the block with the created tasks
// //     block.tasks = createdTasks.map((task) => task._id);
// //     await block.save();
// //     console.log("Updated block with task IDs");

// //     // Update the Day document to include the new block
// //     const dayUpdateResult = await Day.findByIdAndUpdate(
// //       dayId,
// //       { $push: { blocks: block._id } },
// //       { new: true }
// //     );
// //     console.log(
// //       `Updated day with new block. Day now has ${dayUpdateResult.blocks.length} blocks`
// //     );

// //     // Fetch all blocks again to see the final order
// //     const finalBlocks = await Block.find({ dayId }).sort({ index: 1 });
// //     console.log("Final block order after update:");
// //     finalBlocks.forEach((b, idx) => {
// //       console.log(
// //         `[${idx}] "${b.name}" (${b.startTime} - ${b.endTime}) - Index: ${b.index}`
// //       );
// //     });

// //     console.log("-------- ROUTINE ADDITION COMPLETE --------");

// //     return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
// //   } catch (error) {
// //     console.error("Error adding routine to schedule:", error);
// //     return NextResponse.json(
// //       { message: "Error adding routine to schedule" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // import { NextResponse } from "next/server";
// // import dbConnect from "@/lib/mongo";
// // import Block from "@/models/Block";
// // import Task from "@/models/Task";
// // import Day from "@/models/Day";
// // import { ITask } from "@/models/Task";

// // interface AddRoutineRequestBody {
// //   dayId: string;
// //   routineId: string;
// //   name: string;
// //   startTime: string;
// //   endTime: string;
// //   tasks: Omit<ITask, "blockId">[];
// //   blockType?:
// //     | "deep-work"
// //     | "break"
// //     | "meeting"
// //     | "health"
// //     | "exercise"
// //     | "admin"
// //     | "personal";
// // }

// // export async function POST(request: Request) {
// //   await dbConnect();

// //   try {
// //     const body: AddRoutineRequestBody = await request.json();
// //     const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
// //       body;

// //     console.log("-------- ADD ROUTINE TO SCHEDULE --------");
// //     console.log(
// //       `New routine "${name}" with time range: ${startTime} - ${endTime}`
// //     );

// //     // Helper function to convert time to minutes for comparison
// //     function timeToMinutes(timeStr) {
// //       const [hours, minutes] = timeStr.split(":").map(Number);
// //       return hours * 60 + minutes;
// //     }

// //     // Get all blocks for this day
// //     const existingBlocks = await Block.find({ dayId });
// //     console.log(
// //       `Found ${existingBlocks.length} existing blocks for dayId: ${dayId}`
// //     );

// //     // Find block with closest end time to the routine's start time
// //     const routineStartTimeMinutes = timeToMinutes(startTime);
// //     console.log(
// //       `New routine start time in minutes: ${routineStartTimeMinutes}`
// //     );

// //     let closestBlock = null;
// //     let smallestDifference = Infinity;

// //     console.log(
// //       "Evaluating each block to find closest end time to routine start time:"
// //     );
// //     existingBlocks.forEach((block) => {
// //       const blockEndTimeMinutes = timeToMinutes(block.endTime);

// //       console.log(
// //         `Checking block "${block.name}" (${block.startTime} - ${block.endTime}):`
// //       );
// //       console.log(`  Block end time in minutes: ${blockEndTimeMinutes}`);

// //       // Only consider blocks that end before or at the routine's start time
// //       if (blockEndTimeMinutes <= routineStartTimeMinutes) {
// //         const difference = routineStartTimeMinutes - blockEndTimeMinutes;
// //         console.log(
// //           `  ✓ This block ends before/at routine start time. Difference: ${difference} minutes`
// //         );

// //         if (difference < smallestDifference) {
// //           smallestDifference = difference;
// //           closestBlock = block;
// //           console.log(
// //             `  ✓ This is now the closest block! (Difference: ${difference} minutes)`
// //           );
// //         } else {
// //           console.log(
// //             `  ✗ Not the closest block (current closest difference: ${smallestDifference} minutes)`
// //           );
// //         }
// //       } else {
// //         console.log(
// //           `  ✗ This block ends AFTER routine start time - cannot insert after it`
// //         );
// //       }
// //     });

// //     if (closestBlock) {
// //       console.log(
// //         `CLOSEST BLOCK FOUND: "${closestBlock.name}" (${closestBlock.startTime} - ${closestBlock.endTime})`
// //       );
// //     } else {
// //       console.log("No suitable block found that ends before this routine");
// //     }

// //     // For now, just add the routine to the end of the schedule
// //     console.log(
// //       "SIMPLIFIED APPROACH: Adding routine to the end of the schedule"
// //     );

// //     // Create the new block
// //     const block = await Block.create({
// //       dayId,
// //       name,
// //       startTime,
// //       endTime,
// //       routineId,
// //       blockType: blockType || "personal",
// //       isRoutine: true,
// //     });

// //     console.log(`Created new block with ID: ${block._id}`);

// //     // Create new tasks based on the routine's tasks
// //     const tasksToCreate = tasks.map((task) => ({
// //       name: task.name,
// //       priority: task.priority,
// //       duration: task.duration,
// //       blockId: block._id,
// //       routineId,
// //       isRoutineTask: true,
// //       originalRoutineTaskId: task._id,
// //     }));

// //     const createdTasks = await Task.insertMany(tasksToCreate);
// //     console.log(`Created ${createdTasks.length} tasks for the routine`);

// //     // Update the block with the created tasks
// //     block.tasks = createdTasks.map((task) => task._id);
// //     await block.save();
// //     console.log("Updated block with task IDs");

// //     // Update the Day document to include the new block
// //     const dayUpdateResult = await Day.findByIdAndUpdate(
// //       dayId,
// //       { $push: { blocks: block._id } },
// //       { new: true }
// //     );
// //     console.log(
// //       `Updated day with new block. Day now has ${dayUpdateResult.blocks.length} blocks`
// //     );

// //     console.log("-------- ROUTINE ADDITION COMPLETE --------");

// //     return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
// //   } catch (error) {
// //     console.error("Error adding routine to schedule:", error);
// //     return NextResponse.json(
// //       { message: "Error adding routine to schedule" },
// //       { status: 500 }
// //     );
// //   }
// // }

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Task from "@/models/Task";
// import Day from "@/models/Day";
// import { ITask } from "@/models/Task";

// interface AddRoutineRequestBody {
//   dayId: string;
//   routineId: string;
//   name: string;
//   startTime: string;
//   endTime: string;
//   tasks: Omit<ITask, "blockId">[];
//   blockType?:
//     | "deep-work"
//     | "break"
//     | "meeting"
//     | "health"
//     | "exercise"
//     | "admin"
//     | "personal";
// }

// export async function POST(request: Request) {
//   await dbConnect();

//   try {
//     const body: AddRoutineRequestBody = await request.json();
//     const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
//       body;

//     console.log("-------- ADD ROUTINE TO SCHEDULE --------");
//     console.log(
//       `New routine "${name}" with time range: ${startTime} - ${endTime}`
//     );

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Get the Day document to access its blocks array
//     const day = await Day.findById(dayId);
//     if (!day) {
//       throw new Error(`Day with ID ${dayId} not found`);
//     }

//     console.log(`Found day with ${day.blocks.length} blocks`);

//     // Get all blocks for this day
//     const existingBlocks = await Block.find({ dayId });
//     console.log(
//       `Found ${existingBlocks.length} existing blocks for dayId: ${dayId}`
//     );

//     // Find block with closest end time to the routine's start time
//     const routineStartTimeMinutes = timeToMinutes(startTime);
//     console.log(
//       `New routine start time in minutes: ${routineStartTimeMinutes}`
//     );

//     let closestBlock = null;
//     let smallestDifference = Infinity;

//     console.log(
//       "Evaluating each block to find closest end time to routine start time:"
//     );
//     existingBlocks.forEach((block) => {
//       const blockEndTimeMinutes = timeToMinutes(block.endTime);

//       console.log(
//         `Checking block "${block.name}" (${block.startTime} - ${block.endTime}):`
//       );
//       console.log(`  Block end time in minutes: ${blockEndTimeMinutes}`);

//       // Only consider blocks that end before or at the routine's start time
//       if (blockEndTimeMinutes <= routineStartTimeMinutes) {
//         const difference = routineStartTimeMinutes - blockEndTimeMinutes;
//         console.log(
//           `  ✓ This block ends before/at routine start time. Difference: ${difference} minutes`
//         );

//         if (difference < smallestDifference) {
//           smallestDifference = difference;
//           closestBlock = block;
//           console.log(
//             `  ✓ This is now the closest block! (Difference: ${difference} minutes)`
//           );
//         } else {
//           console.log(
//             `  ✗ Not the closest block (current closest difference: ${smallestDifference} minutes)`
//           );
//         }
//       } else {
//         console.log(
//           `  ✗ This block ends AFTER routine start time - cannot insert after it`
//         );
//       }
//     });

//     // Create the new block
//     const block = await Block.create({
//       dayId,
//       name,
//       startTime,
//       endTime,
//       routineId,
//       blockType: blockType || "personal",
//       isRoutine: true,
//     });

//     console.log(`Created new block with ID: ${block._id}`);

//     // Create new tasks based on the routine's tasks
//     const tasksToCreate = tasks.map((task) => ({
//       name: task.name,
//       priority: task.priority,
//       duration: task.duration,
//       blockId: block._id,
//       routineId,
//       isRoutineTask: true,
//       originalRoutineTaskId: task._id,
//     }));

//     const createdTasks = await Task.insertMany(tasksToCreate);
//     console.log(`Created ${createdTasks.length} tasks for the routine`);

//     // Update the block with the created tasks
//     block.tasks = createdTasks.map((task) => task._id);
//     await block.save();
//     console.log("Updated block with task IDs");

//     // Update the Day document by inserting the new block in the correct position
//     if (closestBlock) {
//       console.log(
//         `CLOSEST BLOCK FOUND: "${closestBlock.name}" (${closestBlock.startTime} - ${closestBlock.endTime})`
//       );

//       // Find the position of the closest block in the day's blocks array
//       const closestBlockIndex = day.blocks.findIndex(
//         (blockId) => blockId.toString() === closestBlock._id.toString()
//       );

//       if (closestBlockIndex !== -1) {
//         console.log(
//           `Closest block found at position ${closestBlockIndex} in the day's blocks array`
//         );

//         // Insert the new block after the closest block
//         const updatedBlocks = [...day.blocks];
//         updatedBlocks.splice(closestBlockIndex + 1, 0, block._id);

//         day.blocks = updatedBlocks;
//         await day.save();

//         console.log(`Inserted new block after position ${closestBlockIndex}`);
//       } else {
//         console.log(
//           "Closest block not found in day's blocks array (unusual) - adding to the end"
//         );
//         day.blocks.push(block._id);
//         await day.save();
//       }
//     } else {
//       console.log(
//         "No suitable block found that ends before this routine - adding to beginning"
//       );
//       day.blocks.unshift(block._id);
//       await day.save();
//     }

//     console.log(`Day now has ${day.blocks.length} blocks`);
//     console.log("-------- ROUTINE ADDITION COMPLETE --------");

//     return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
//   } catch (error) {
//     console.error("Error adding routine to schedule:", error);
//     return NextResponse.json(
//       { message: "Error adding routine to schedule" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Block from "@/models/Block";
// import Task from "@/models/Task";
// import Day from "@/models/Day";
// import { ITask } from "@/models/Task";

// interface AddRoutineRequestBody {
//   dayId: string;
//   routineId: string;
//   name: string;
//   startTime: string;
//   endTime: string;
//   tasks: Omit<ITask, "blockId">[];
//   blockType?:
//     | "deep-work"
//     | "break"
//     | "meeting"
//     | "health"
//     | "exercise"
//     | "admin"
//     | "personal";
// }

// export async function POST(request: Request) {
//   await dbConnect();

//   try {
//     const body: AddRoutineRequestBody = await request.json();
//     const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
//       body;

//     console.log("-------- ADD ROUTINE TO SCHEDULE --------");
//     console.log(
//       `New routine "${name}" with time range: ${startTime} - ${endTime}`
//     );

//     // Helper function to convert time to minutes for comparison
//     function timeToMinutes(timeStr) {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       return hours * 60 + minutes;
//     }

//     // Get the Day document to access its blocks array
//     const day = await Day.findById(dayId).populate("blocks");
//     if (!day) {
//       throw new Error(`Day with ID ${dayId} not found`);
//     }

//     console.log(`Found day with ${day.blocks.length} blocks`);

//     // Log the current order of blocks in the day document
//     console.log("Current order of blocks in Day document:");
//     console.log("--------------------------------------");
//     if (day.blocks.length > 0) {
//       day.blocks.forEach((blockRef, idx) => {
//         // The blocks should be populated if we used .populate('blocks')
//         const block = blockRef;
//         console.log(`[${idx}] Block ID: ${block._id}`);
//         console.log(`    Name: "${block.name}"`);
//         console.log(`    Time: ${block.startTime} - ${block.endTime}`);
//         console.log(`    End time in minutes: ${timeToMinutes(block.endTime)}`);
//         console.log(`    Is Routine: ${block.isRoutine}`);
//         console.log("--------------------------------------");
//       });
//     } else {
//       console.log("No blocks found in the day document");
//     }

//     // Get all blocks for this day using Block model directly to compare
//     const existingBlocks = await Block.find({ dayId });
//     console.log(
//       `Found ${existingBlocks.length} blocks for dayId: ${dayId} using Block.find`
//     );

//     // Check if counts match
//     if (existingBlocks.length !== day.blocks.length) {
//       console.log(
//         "⚠️ WARNING: Block count mismatch between Day.blocks and Block.find!"
//       );
//       console.log(
//         `Day.blocks has ${day.blocks.length} blocks but Block.find returned ${existingBlocks.length} blocks`
//       );
//     }

//     // Find block with closest end time to the routine's start time
//     const routineStartTimeMinutes = timeToMinutes(startTime);
//     console.log(
//       `New routine start time in minutes: ${routineStartTimeMinutes}`
//     );

//     let closestBlock = null;
//     let smallestDifference = Infinity;

//     console.log(
//       "Evaluating each block to find closest end time to routine start time:"
//     );
//     existingBlocks.forEach((block) => {
//       const blockEndTimeMinutes = timeToMinutes(block.endTime);

//       console.log(
//         `Checking block "${block.name}" (${block.startTime} - ${block.endTime}):`
//       );
//       console.log(`  Block end time in minutes: ${blockEndTimeMinutes}`);

//       // Only consider blocks that end before or at the routine's start time
//       if (blockEndTimeMinutes <= routineStartTimeMinutes) {
//         const difference = routineStartTimeMinutes - blockEndTimeMinutes;
//         console.log(
//           `  ✓ This block ends before/at routine start time. Difference: ${difference} minutes`
//         );

//         if (difference < smallestDifference) {
//           smallestDifference = difference;
//           closestBlock = block;
//           console.log(
//             `  ✓ This is now the closest block! (Difference: ${difference} minutes)`
//           );
//         } else {
//           console.log(
//             `  ✗ Not the closest block (current closest difference: ${smallestDifference} minutes)`
//           );
//         }
//       } else {
//         console.log(
//           `  ✗ This block ends AFTER routine start time - cannot insert after it`
//         );
//       }
//     });

//     if (closestBlock) {
//       console.log(
//         `CLOSEST BLOCK FOUND: "${closestBlock.name}" (${closestBlock.startTime} - ${closestBlock.endTime})`
//       );

//       // Find the position of the closest block in the day's blocks array
//       const closestBlockIndex = day.blocks.findIndex(
//         (block) => block._id.toString() === closestBlock._id.toString()
//       );

//       console.log(
//         `Closest block position in day.blocks array: ${closestBlockIndex}`
//       );
//     } else {
//       console.log("No suitable block found that ends before this routine");
//     }

//     // Create the new block
//     const block = await Block.create({
//       dayId,
//       name,
//       startTime,
//       endTime,
//       routineId,
//       blockType: blockType || "personal",
//       isRoutine: true,
//     });

//     console.log(`Created new block with ID: ${block._id}`);

//     // Create new tasks based on the routine's tasks
//     const tasksToCreate = tasks.map((task) => ({
//       name: task.name,
//       priority: task.priority,
//       duration: task.duration,
//       blockId: block._id,
//       routineId,
//       isRoutineTask: true,
//       originalRoutineTaskId: task._id,
//     }));

//     const createdTasks = await Task.insertMany(tasksToCreate);
//     console.log(`Created ${createdTasks.length} tasks for the routine`);

//     // Update the block with the created tasks
//     block.tasks = createdTasks.map((task) => task._id);
//     await block.save();
//     console.log("Updated block with task IDs");

//     // Update the Day document by inserting the new block in the correct position
//     if (closestBlock) {
//       const closestBlockIndex = day.blocks.findIndex(
//         (block) => block._id.toString() === closestBlock._id.toString()
//       );

//       if (closestBlockIndex !== -1) {
//         console.log(`Inserting new block after position ${closestBlockIndex}`);

//         // Insert the new block after the closest block using $position operator
//         await Day.findByIdAndUpdate(dayId, {
//           $push: {
//             blocks: {
//               $each: [block._id],
//               $position: closestBlockIndex + 1,
//             },
//           },
//         });

//         console.log(
//           `Used MongoDB $position operator to insert at position ${closestBlockIndex + 1}`
//         );
//       } else {
//         console.log(
//           "Closest block not found in day's blocks array (unusual) - adding to the end"
//         );
//         await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });
//       }
//     } else {
//       console.log(
//         "No suitable block found that ends before this routine - adding to beginning"
//       );

//       // Insert at the beginning of the array using $position: 0
//       // await Day.findByIdAndUpdate(dayId, {
//       //   $push: { blocks: { $each: [block._id], $position: 0 } },
//       // });

//       console.log("Used MongoDB $position operator to insert at beginning");
//     }

//     // Fetch the updated day to log the final block order
//     const updatedDay = await Day.findById(dayId).populate("blocks");
//     console.log(`Day now has ${updatedDay.blocks.length} blocks`);

//     console.log("Final order of blocks after addition:");
//     console.log("--------------------------------------");
//     if (updatedDay.blocks.length > 0) {
//       updatedDay.blocks.forEach((blockRef, idx) => {
//         const block = blockRef;
//         console.log(`[${idx}] Block ID: ${block._id}`);
//         console.log(`    Name: "${block.name}"`);
//         console.log(`    Time: ${block.startTime} - ${block.endTime}`);
//         console.log(`    End time in minutes: ${timeToMinutes(block.endTime)}`);
//         console.log(`    Is Routine: ${block.isRoutine}`);
//         console.log("--------------------------------------");
//       });
//     }

//     console.log("-------- ROUTINE ADDITION COMPLETE --------");

//     return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
//   } catch (error) {
//     console.error("Error adding routine to schedule:", error);
//     return NextResponse.json(
//       { message: "Error adding routine to schedule" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Task from "@/models/Task";
import Day from "@/models/Day";
import { ITask } from "@/models/Task";

interface AddRoutineRequestBody {
  dayId: string;
  routineId: string;
  name: string;
  startTime: string;
  endTime: string;
  tasks: Omit<ITask, "blockId">[];
  blockType?:
    | "deep-work"
    | "break"
    | "meeting"
    | "health"
    | "exercise"
    | "admin"
    | "personal";
}

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body: AddRoutineRequestBody = await request.json();
    const { dayId, routineId, name, startTime, endTime, tasks, blockType } =
      body;

    console.log("-------- ADD ROUTINE TO SCHEDULE --------");
    console.log(
      `New routine "${name}" with time range: ${startTime} - ${endTime}`
    );

    // Helper function to convert time to minutes for comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Get the Day document to access its blocks array
    const day = await Day.findById(dayId).populate("blocks");
    if (!day) {
      throw new Error(`Day with ID ${dayId} not found`);
    }

    console.log(`Found day with ${day.blocks.length} blocks`);

    // Log the current order of blocks in the day document
    console.log("Current order of blocks in Day document:");
    console.log("--------------------------------------");
    if (day.blocks.length > 0) {
      day.blocks.forEach((blockRef: any, idx: number) => {
        // ✅ Fix: Add explicit types
        // The blocks should be populated if we used .populate('blocks')
        const block = blockRef;
        console.log(`[${idx}] Block ID: ${block._id}`);
        console.log(`    Name: "${block.name}"`);
        console.log(`    Time: ${block.startTime} - ${block.endTime}`);
        console.log(`    End time in minutes: ${timeToMinutes(block.endTime)}`);
        console.log(`    Is Routine: ${block.isRoutine}`);
        console.log("--------------------------------------");
      });
    } else {
      console.log("No blocks found in the day document");
    }

    // Get all blocks for this day using Block model directly - sorted by index for consistent behavior
    const existingBlocks = await Block.find({ dayId }).sort({ index: 1 });
    console.log(
      `Found ${existingBlocks.length} blocks for dayId: ${dayId} using Block.find (sorted by index)`
    );

    // Check if counts match
    if (existingBlocks.length !== day.blocks.length) {
      console.log(
        "⚠️ WARNING: Block count mismatch between Day.blocks and Block.find!"
      );
      console.log(
        `Day.blocks has ${day.blocks.length} blocks but Block.find returned ${existingBlocks.length} blocks`
      );
    }

    // Find where to insert new routine block based on nearest end time to the routine's start time
    const routineStartTimeMinutes = timeToMinutes(startTime);
    console.log(
      `New routine start time in minutes: ${routineStartTimeMinutes}`
    );

    let insertIndex = 0;
    let closestPrecedingBlockIndex = -1;
    let closestEndTimeBeforeStart = -Infinity;

    console.log(
      "Evaluating each block to find closest end time to routine start time:"
    );

    for (let i = 0; i < existingBlocks.length; i++) {
      const block = existingBlocks[i];
      const blockEndTime = timeToMinutes(block.endTime);

      console.log(
        `Checking block "${block.name}" (${block.startTime} - ${block.endTime}):`
      );
      console.log(`  Block end time in minutes: ${blockEndTime}`);

      // Look for blocks that end before our routine starts
      if (blockEndTime <= routineStartTimeMinutes) {
        // Find the block with the closest end time to our start time
        if (blockEndTime > closestEndTimeBeforeStart) {
          closestEndTimeBeforeStart = blockEndTime;
          closestPrecedingBlockIndex = i;
          console.log(
            `  ✓ New closest block ending before our routine: "${block.name}" at index ${i} (end time: ${block.endTime})`
          );
        }
      } else {
        console.log(
          `  ✗ This block ends AFTER routine start time - cannot insert after it`
        );
      }
    }

    // If we found a block that ends before our routine starts, insert after it
    if (closestPrecedingBlockIndex !== -1) {
      insertIndex = existingBlocks[closestPrecedingBlockIndex].index + 1;
      console.log(
        `Found closest block at index ${closestPrecedingBlockIndex}, inserting at index ${insertIndex}`
      );
    } else {
      console.log(
        `No suitable preceding block found, inserting at the beginning (index 0)`
      );
    }

    // Create the new block with the correct index
    const block = await Block.create({
      dayId,
      name,
      startTime,
      endTime,
      routineId,
      blockType: blockType || "personal",
      isRoutine: true,
      index: insertIndex, // Set the index explicitly
    });

    console.log(`Created new block with ID: ${block._id}`);

    // Create new tasks based on the routine's tasks
    const tasksToCreate = tasks.map((task) => ({
      name: task.name,
      priority: task.priority,
      duration: task.duration,
      blockId: block._id,
      routineId,
      isRoutineTask: true,
      originalRoutineTaskId: task._id,
    }));

    const createdTasks = await Task.insertMany(tasksToCreate);
    console.log(`Created ${createdTasks.length} tasks for the routine`);

    // Update the block with the created tasks
    block.tasks = createdTasks.map((task) => task._id);
    await block.save();
    console.log("Updated block with task IDs");

    // Update the Day document by inserting the new block in the correct position
    if (closestPrecedingBlockIndex !== -1) {
      // We found a block that ends before our routine starts
      const closestBlock = existingBlocks[closestPrecedingBlockIndex];
      console.log(
        `CLOSEST BLOCK FOUND: "${closestBlock.name}" (${closestBlock.startTime} - ${closestBlock.endTime})`
      );
      console.log(
        `Inserting routine after block with index ${closestBlock.index}`
      );

      // Calculate the index in the Day document's blocks array
      // First set block.index for managing the ordered list
      // (this is what add-block-to-schedule does)
      const blockIndex = closestBlock.index + 1;

      // Update all blocks whose index is >= the insertion point
      await Block.updateMany(
        { dayId, index: { $gte: blockIndex }, _id: { $ne: block._id } },
        { $inc: { index: 1 } }
      );

      console.log(
        `Incremented index for all blocks with index >= ${blockIndex}`
      );

      // Add the block to the day
      await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });
      console.log(`Added block to day's blocks array`);
    } else {
      console.log(
        "No suitable block found that ends before this routine - adding to beginning"
      );

      // Update all blocks to shift their indices up by 1
      await Block.updateMany(
        { dayId, _id: { $ne: block._id } },
        { $inc: { index: 1 } }
      );

      console.log(
        `Incremented index for all blocks to make room at the beginning`
      );

      // Add the block to the day
      await Day.findByIdAndUpdate(dayId, { $push: { blocks: block._id } });
      console.log(`Added block to day's blocks array at the beginning`);
    }

    // Fetch the updated day to log the final block order
    const updatedDay = await Day.findById(dayId).populate("blocks");
    console.log(`Day now has ${updatedDay.blocks.length} blocks`);

    console.log("Final order of blocks after addition:");
    console.log("--------------------------------------");
    if (updatedDay.blocks.length > 0) {
      updatedDay.blocks.forEach((blockRef: any, idx: number) => {
        // ✅ Fix: Add explicit types
        const block = blockRef;
        console.log(`[${idx}] Block ID: ${block._id}`);
        console.log(`    Name: "${block.name}"`);
        console.log(`    Time: ${block.startTime} - ${block.endTime}`);
        console.log(`    End time in minutes: ${timeToMinutes(block.endTime)}`);
        console.log(`    Is Routine: ${block.isRoutine}`);
        console.log("--------------------------------------");
      });
    }

    console.log("-------- ROUTINE ADDITION COMPLETE --------");

    return NextResponse.json({ block, tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error("Error adding routine to schedule:", error);
    return NextResponse.json(
      { message: "Error adding routine to schedule" },
      { status: 500 }
    );
  }
}
