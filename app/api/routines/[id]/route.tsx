import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Routine from "@/models/Routine";
import Task from "@/models/Task";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const routine = await Routine.findById(params.id).populate("tasks");
    if (!routine) {
      return NextResponse.json(
        { success: false, error: "Routine not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(routine);
  } catch (error) {
    console.error("Error fetching routine:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching routine" },
      { status: 400 }
    );
  }
}

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   await dbConnect();

//   try {
//     console.log("params", params);
//   } catch (error) {
//     console.error("Error fetching routine:", error);
//     return NextResponse.json(
//       { error: "Error fetching routine" },
//       { status: 500 }
//     );
//   }

//   // try {
//   //   const routine = await Routine.findById(params.id).populate("tasks");
//   //   if (!routine) {
//   //     return NextResponse.json({ error: "Routine not found" }, { status: 404 });
//   //   }
//   //   return NextResponse.json(routine);
//   // } catch (error) {
//   //   console.error("Error fetching routine:", error);
//   //   return NextResponse.json(
//   //     { error: "Error fetching routine" },
//   //     { status: 500 }
//   //   );
//   // }
// }

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const body = await request.json();
    const updatedRoutine = await Routine.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }
    return NextResponse.json(updatedRoutine);
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { error: "Error updating routine" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Routine ID is required" },
        { status: 400 }
      );
    }

    // First, delete all tasks associated with this routine
    await Task.deleteMany({ routine: id });

    // Then, delete the routine
    const deletedRoutine = await Routine.findByIdAndDelete(id);

    if (!deletedRoutine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Routine and associated tasks deleted successfully",
      routine: deletedRoutine,
    });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      {
        error: "Error deleting routine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
