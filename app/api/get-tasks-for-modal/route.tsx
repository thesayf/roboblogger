import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";

export async function GET(request: NextRequest) {
  await dbConnect();

  const userId = request.nextUrl.searchParams.get("userId");
  console.log("Fetching incomplete tasks for user:", userId);

  try {
    console.log("Fetching incomplete standalone tasks...");
    // Find all tasks where:
    // - userId matches
    // - completed is false
    // - project is null or undefined
    // - isRoutineTask is false or undefined
    const incompleteStandaloneTasks = await Task.find({
      userId: userId,
      completed: false,
      project: { $in: [null, undefined] },
      $or: [{ isRoutineTask: false }, { isRoutineTask: { $exists: false } }],
    }).sort({ createdAt: -1 });

    return NextResponse.json(incompleteStandaloneTasks);
  } catch (error) {
    console.error("Error fetching incomplete standalone tasks:", error);
    return NextResponse.json(
      { error: "Error fetching incomplete standalone tasks" },
      { status: 500 }
    );
  }
}
