import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // First get the current project to check its completed status
    const currentProject = await Project.findById(id);

    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Set the update object based on whether we're completing or reactivating
    const updateObj = currentProject.completed
      ? {
          completed: false,
          completedAt: null, // Clear the completedAt date when reactivating
        }
      : {
          completed: true,
          completedAt: new Date(), // Set completedAt to current date when completing
        };

    // Update the project with the new completed status and completedAt date
    const updatedProject = await Project.findByIdAndUpdate(id, updateObj, {
      new: true,
      runValidators: true,
    }).populate("tasks");

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error toggling project completion:", error);
    return NextResponse.json(
      { success: false, error: "Error toggling project completion" },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongo";
// import Project from "@/models/Project";

// export async function PUT(request: NextRequest) {
//   await dbConnect();

//   try {
//     const { id } = await request.json();

//     if (!id) {
//       return NextResponse.json(
//         { success: false, error: "Project ID is required" },
//         { status: 400 }
//       );
//     }

//     // First get the current project to check its completed status
//     const currentProject = await Project.findById(id);

//     if (!currentProject) {
//       return NextResponse.json(
//         { success: false, error: "Project not found" },
//         { status: 404 }
//       );
//     }

//     // Toggle the completed status
//     const updatedProject = await Project.findByIdAndUpdate(
//       id,
//       { completed: !currentProject.completed },
//       { new: true, runValidators: true }
//     ).populate("tasks");

//     return NextResponse.json({
//       success: true,
//       project: updatedProject,
//     });
//   } catch (error) {
//     console.error("Error toggling project completion:", error);
//     return NextResponse.json(
//       { success: false, error: "Error toggling project completion" },
//       { status: 500 }
//     );
//   }
// }
