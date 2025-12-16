import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Routine from "@/models/Routine";
import Task from "@/models/Task";

// GET - Fetch all routines for the user
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const routines = await Routine.find({ userId })
      .sort({ order: 1 });

    // Fetch tasks for all routines
    const routineIds = routines.map(r => r._id);
    const tasks = await Task.find({ routineId: { $in: routineIds } }).sort({ order: 1 });

    // Map tasks to routines
    const routinesWithTasks = routines.map(routine => {
      const routineTasks = tasks.filter(t => t.routineId?.toString() === routine._id.toString());
      return {
        ...routine.toObject(),
        tasks: routineTasks
      };
    });

    return NextResponse.json({ success: true, routines: routinesWithTasks });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines" },
      { status: 500 }
    );
  }
}

// POST - Create a new routine
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { name, startDate, endDate, days, startTime, duration, goalId, order } = await req.json();

    const routine = await Routine.create({
      userId,
      name,
      startDate,
      endDate,
      days: days || [],
      startTime,
      duration,
      goalId: goalId || null,
      order: order || 9999
    });

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { error: "Failed to create routine" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a routine
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await Routine.findOneAndDelete({ _id: id, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json({ error: "Failed to delete routine" }, { status: 500 });
  }
}