// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Task from "@/models/Task";
// import Project from "@/models/Project";
// import Block from "@/models/Block";

// export async function POST(request: NextRequest) {
//   await dbConnect();
//   try {
//     // Parse the incoming JSON data
//     const body = await request.json();
//     const { projectId, blockId, ...taskData } = body;

//     // Log the received data
//     console.log("Received task data:", body);

//     // Create the task object, only including blockId if it's provided
//     const taskToCreate = {
//       ...taskData,
//       project: projectId || undefined,
//       block: blockId || undefined,
//     };

//     // Create the new task
//     const task = new Task(taskToCreate);
//     await task.save();

//     // If a project is specified, add the task to the project's tasks array
//     if (projectId) {
//       await Project.findByIdAndUpdate(projectId, {
//         $push: { tasks: task._id },
//       });
//     }

//     // If a block is specified, add the task to the block's tasks array
//     if (blockId) {
//       await Block.findByIdAndUpdate(blockId, { $push: { tasks: task._id } });
//     }

//     // Return a success message along with the created task
//     return NextResponse.json(
//       {
//         message: "Task created successfully",
//         task: task,
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Error creating task:", error);
//     return NextResponse.json(
//       {
//         error: "Error creating task",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request: NextRequest) {
//   await dbConnect();
//   const userId = request.nextUrl.searchParams.get("userId");
//   console.log("Fetching tasks for user:", userId);
//   try {
//     console.log("Fetching standalone tasks...");
//     // Find all tasks where project and routine fields are null or undefined
//     const standaloneTasks = await Task.find({
//       userId: userId,
//       $and: [
//         { projectId: { $in: [null, undefined] } },
//         { isRoutineTask: { $in: [false, undefined] } },
//       ],
//     }).sort({ createdAt: -1 }); // Sort by creation date, newest first

//     return NextResponse.json(standaloneTasks);
//   } catch (error) {
//     console.error("Error fetching standalone tasks:", error);
//     return NextResponse.json(
//       { error: "Error fetching standalone tasks" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";
import Project from "@/models/Project";
import Block from "@/models/Block";
import User from "@/models/User"; // Add this import

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    // Parse the incoming JSON data
    const body = await request.json();
    const { projectId, blockId, userId: clerkId, ...taskData } = body;

    // Log the received data
    console.log("Received task data:", body);

    if (!clerkId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the MongoDB user by Clerk ID
    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the task object with MongoDB user ID
    const taskToCreate = {
      ...taskData,
      userId: user._id, // Use MongoDB user ID
      project: projectId || undefined,
      block: blockId || undefined,
    };

    // Create the new task
    const task = new Task(taskToCreate);
    await task.save();

    // If a project is specified, add the task to the project's tasks array
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { tasks: task._id },
      });
    }

    // If a block is specified, add the task to the block's tasks array
    if (blockId) {
      await Block.findByIdAndUpdate(blockId, { $push: { tasks: task._id } });
    }

    // Return a success message along with the created task
    return NextResponse.json(
      {
        message: "Task created successfully",
        task: task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        error: "Error creating task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();
  const clerkId = request.nextUrl.searchParams.get("userId");
  console.log("Fetching tasks for clerk user:", clerkId);

  try {
    if (!clerkId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the MongoDB user by Clerk ID
    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Fetching tasks for MongoDB user ID:", user._id);
    console.log("Also checking for Clerk ID:", clerkId);

    // Find all standalone tasks (no project or routine)
    // Check for both MongoDB user ID and Clerk ID since there might be inconsistency
    const tasks = await Task.find({
      $or: [
        { userId: user._id.toString() },
        { userId: clerkId }
      ],
      projectId: { $in: [null, undefined] },
      isRoutineTask: { $ne: true }
    }).sort({ createdAt: -1 });

    console.log("Found tasks:", tasks.length, tasks.map(t => ({
      id: t._id,
      title: t.title,
      content: t.content,
      userId: t.userId
    })));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 }
    );
  }
}
