import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    // Expecting a payload of the form:
    // { projects: [{ _id: "someProjectId", order: 0 }, { _id: "anotherId", order: 1 }, ... ] }
    const { projects } = await request.json();
    console.log(projects);

    if (!Array.isArray(projects)) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must include an array 'projects'.",
        },
        { status: 400 }
      );
    }

    // Build a list of bulk update operations
    const bulkOps = projects.map((proj: { _id: string; order: number }) => ({
      updateOne: {
        filter: { _id: proj._id },
        update: { order: proj.order }, // set the new order
      },
    }));

    console.log("bulk Ops", bulkOps);

    // Perform all updates in one bulkWrite call
    await Project.bulkWrite(bulkOps);

    console.log(Project);

    return NextResponse.json({
      success: true,
      message: "Project order updated successfully.",
    });
  } catch (error) {
    console.error("Error updating project order:", error);
    return NextResponse.json(
      { success: false, error: "Error updating project order." },
      { status: 500 }
    );
  }
}
