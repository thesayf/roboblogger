// api/get-today/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { userId, date } = await request.json();
    console.log("Received data:", { userId: userId, date });

    // First find the user by clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      console.log("User not found for clerkId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Found user:", user._id);

    // Now find the day using the MongoDB user ID
    let day = await Day.findOne({ user: user._id, date: date }).populate({
      path: "blocks",
      populate: { path: "tasks" },
    });

    console.log("Day found:", day ? "yes" : "no");

    return NextResponse.json(day);
  } catch (error) {
    console.error("Error fetching day:", error);
    return NextResponse.json({ error: "Error fetching day" }, { status: 500 });
  }
}
