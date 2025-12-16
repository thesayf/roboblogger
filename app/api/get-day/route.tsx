import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const clerkId = request.nextUrl.searchParams.get("userId");
    const dateParam = request.nextUrl.searchParams.get("date");

    console.log("clerkId", clerkId);
    console.log("dateParam", dateParam);

    if (!clerkId || !dateParam) {
      return NextResponse.json(
        { error: "User ID and date parameter are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("user", user);

    let targetDate = new Date();
    if (dateParam === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    console.log("targetDate", targetDate);
    const formattedDate = targetDate.toISOString().split("T")[0]; // Get date in YYYY-MM-DD format
    console.log("formattedDate", formattedDate);

    let day = await Day.findOne({
      user: user._id,
      date: formattedDate,
    }).populate({
      path: "blocks",
      options: { sort: { index: 1 } }, // Sort blocks by index
      populate: { path: "tasks" },
    });

    console.log("this is from server");

    if (!day) {
      day = new Day({
        user: user._id,
        date: formattedDate,
        completed: false,
        blocks: [],
        completedTasksCount: 0,
        performanceRating: {
          level: "Not Rated",
          score: 0,
          comment: "Your day hasn't been rated yet.",
        },
      });
      await day.save();

      // Add the day to the user's days array
      user.days.push(day._id);
      await user.save();
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error("Error fetching or creating day:", error);
    return NextResponse.json(
      { error: "Error fetching or creating day" },
      { status: 500 }
    );
  }
}
