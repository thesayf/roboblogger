// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Event from "@/models/Event";

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();

//     const searchParams = request.nextUrl.searchParams;
//     const userId = searchParams.get("userId");
//     const date = searchParams.get("date");

//     if (!userId || !date) {
//       return NextResponse.json(
//         { success: false, error: "Missing required parameters" },
//         { status: 400 }
//       );
//     }

//     // Populate the tasks field for each event
//     const events = await Event.find({ userId, date }).populate("tasks");

//     return NextResponse.json(events, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     return NextResponse.json(
//       { success: false, error: "Error fetching events" },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Event from "@/models/Event";

// export async function GET(request: NextRequest) {
//   try {
//     await dbConnect();

//     const searchParams = request.nextUrl.searchParams;
//     const userId = searchParams.get("userId");
//     const date = searchParams.get("date");

//     if (!userId || !date) {
//       return NextResponse.json(
//         { success: false, error: "Missing required parameters" },
//         { status: 400 }
//       );
//     }

//     // Parse the date to get day of week
//     const dateObj = new Date(date);
//     const dayOfWeek = dateObj
//       .toLocaleString("en-US", { weekday: "long" })
//       .toLowerCase();
//     const dayOfWeekFormatted =
//       dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

//     console.log(dateObj);
//     console.log(dayOfWeek);

//     // Find both:
//     // 1. Regular events for the specific date
//     // 2. Recurring events that have the current day of week in their days array
//     const events = await Event.find({
//       userId: userId,
//       $or: [
//         { date: date }, // Regular events for this date
//         {
//           isRecurring: true,
//           days: { $in: [dayOfWeekFormatted] },
//         }, // Recurring events for this day of week
//       ],
//     }).populate("tasks");

//     console.log("these are the events", events);

//     return NextResponse.json(events, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     return NextResponse.json(
//       { success: false, error: "Error fetching events" },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Event from "@/models/Event";
import User from "@/models/User"; // Add this import

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const clerkId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!clerkId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the MongoDB user by Clerk ID
    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Parse the date to get day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const dayOfWeekFormatted =
      dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

    console.log(dateObj);
    console.log(dayOfWeek);

    // Find both:
    // 1. Regular events for the specific date
    // 2. Recurring events that have the current day of week in their days array
    // Using MongoDB user ID instead of Clerk ID
    const events = await Event.find({
      userId: user._id, // Use the MongoDB user ID here
      $or: [
        { date: date }, // Regular events for this date
        {
          isRecurring: true,
          days: { $in: [dayOfWeekFormatted] },
        }, // Recurring events for this day of week
      ],
    }).populate("tasks");

    console.log("these are the events", events);

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching events" },
      { status: 500 }
    );
  }
}
