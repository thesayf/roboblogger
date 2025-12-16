import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Goal from "@/models/Goal";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const { goals } = await request.json();

    if (!Array.isArray(goals)) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must include an array 'goals'.",
        },
        { status: 400 }
      );
    }

    const bulkOps = goals.map((goal: { _id: string; order: number }) => ({
      updateOne: {
        filter: { _id: goal._id },
        update: { order: goal.order },
      },
    }));

    await Goal.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: "Goal order updated successfully.",
    });
  } catch (error) {
    console.error("Error updating goal order:", error);
    return NextResponse.json(
      { success: false, error: "Error updating goal order." },
      { status: 500 }
    );
  }
}
