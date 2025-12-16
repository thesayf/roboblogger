import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Routine from "@/models/Routine";
import Task from "@/models/Task";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const { routineId } = await request.json();

    console.log("Deleting routine task with ID:", id);
    console.log("Routine ID:", routineId);

    // Find and delete the task
    const deletedTask = await Task.findByIdAndDelete(id);

    console.log("Deleted task:", deletedTask);

    if (!deletedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Remove the task from the routine's tasks array
    const updatedRoutine = await Routine.findByIdAndUpdate(
      routineId,
      { $pull: { tasks: id } },
      { new: true }
    );

    console.log("Updated routine:", updatedRoutine);

    if (!updatedRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Task deleted successfully",
      updatedRoutine,
    });
  } catch (error) {
    console.error("Error deleting routine task:", error);
    return NextResponse.json(
      { error: "Error deleting routine task" },
      { status: 500 }
    );
  }
}
