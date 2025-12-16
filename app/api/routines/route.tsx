// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Routine from "@/models/Routine";
// import Task from "@/models/Task"; // Import the Task model

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const body = await request.json();
//     console.log("Received routine data:", body);

//     const {
//       name,
//       description,
//       days,
//       block,
//       userId,
//       startTime,
//       endTime,
//       startDate, // Extract startDate
//       endDate, // Extract endDate
//       blockType,
//     } = body;

//     if (!userId) {
//       return NextResponse.json(
//         { error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     const newRoutine = new Routine({
//       name,
//       description,
//       days,
//       block,
//       userId,
//       startTime,
//       endTime,
//       startDate, // Extract startDate
//       endDate, // Extract endDate
//       blockType, // Add the blockType field here
//     });

//     await newRoutine.save();

//     console.log("Created routine:", newRoutine);

//     return NextResponse.json(newRoutine, { status: 201 });
//   } catch (error) {
//     console.error("Error creating routine:", error);

//     let errorMessage = "Error creating routine";
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     }

//     return NextResponse.json(
//       { error: "Error creating routine", details: errorMessage },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request: NextRequest) {
//   await dbConnect();

//   try {
//     const userId = request.nextUrl.searchParams.get("userId");

//     if (!userId) {
//       return NextResponse.json(
//         { error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     const routines = await Routine.find({ userId })
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "tasks",
//         model: Task,
//       });

//     return NextResponse.json(routines);
//   } catch (error) {
//     console.error("Error fetching routines:", error);
//     return NextResponse.json(
//       { error: "Error fetching routines" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Routine from "@/models/Routine";
import Task from "@/models/Task";
import User from "@/models/User"; // Import the User model

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    console.log("Received routine data:", body);

    const {
      name,
      description,
      days,
      block,
      userId, // This is the clerkId from the client
      startTime,
      endTime,
      startDate,
      endDate,
      blockType,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the MongoDB user using the clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the routine with the MongoDB user._id
    const newRoutine = new Routine({
      name,
      description,
      days,
      block,
      userId: user._id, // Use the MongoDB user._id
      startTime,
      endTime,
      startDate,
      endDate,
      blockType,
    });

    await newRoutine.save();

    console.log("Created routine:", newRoutine);

    return NextResponse.json(newRoutine, { status: 201 });
  } catch (error) {
    console.error("Error creating routine:", error);

    let errorMessage = "Error creating routine";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: "Error creating routine", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const clerkId = request.nextUrl.searchParams.get("userId");

    if (!clerkId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the MongoDB user using the clerkId
    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Query routines using the MongoDB user._id
    const routines = await Routine.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "tasks",
        model: Task,
      });

    return NextResponse.json(routines);
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Error fetching routines" },
      { status: 500 }
    );
  }
}
