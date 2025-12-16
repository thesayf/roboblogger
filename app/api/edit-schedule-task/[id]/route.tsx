// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Task from "@/models/Task";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    await dbConnect();

    const body = await request.json();
    console.log("id", id);
    console.log("request", request);

    const task = await Task.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update task" },
      { status: 400 }
    );
  }
}
