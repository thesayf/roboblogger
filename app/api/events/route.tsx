// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Event from "@/models/Event";

// export async function POST(request: NextRequest) {
//   await dbConnect();

//   try {
//     const body = await request.json();
//     const { userId, ...eventData } = body;

//     console.log("eventData", eventData);
//     console.log("userId", userId);

//     if (!userId) {
//       return NextResponse.json(
//         { error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     const event = new Event({ ...eventData, userId });
//     await event.save();

//     return NextResponse.json(event, { status: 201 });
//   } catch (error) {
//     console.error("Error creating event:", error);
//     return NextResponse.json(
//       { error: "Error creating event" },
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

//     const events = await Event.find({ userId }).sort({ date: 1 }); // Sort by date ascending
//     return NextResponse.json(events);
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     return NextResponse.json(
//       { error: "Error fetching events" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Event from "@/models/Event";
import User from "@/models/User"; // Add User model import

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { userId: clerkId, ...eventData } = body;

    console.log("eventData", eventData);
    console.log("clerkId", clerkId);

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

    // Create the event with MongoDB user ID
    const event = new Event({
      ...eventData,
      userId: user._id, // Use MongoDB ObjectID instead of Clerk ID
    });
    await event.save();

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Error creating event" },
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

    // Find the MongoDB user by Clerk ID
    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch events using MongoDB user ID
    const events = await Event.find({ userId: user._id }).sort({ date: 1 });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Error fetching events" },
      { status: 500 }
    );
  }
}
