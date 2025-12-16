import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const body = await request.json();

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id } = params;
    const body = await request.json();

    // Only update fields that are provided
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.dueDate !== undefined) updateFields.dueDate = body.dueDate;
    if (body.goalId !== undefined) updateFields.goalId = body.goalId;
    if (body.completed !== undefined) updateFields.completed = body.completed;
    if (body.order !== undefined) updateFields.order = body.order;

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log('[API] Project updated:', id, updateFields);
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  console.log("Deleting project with id:", id);

  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const project = await Project.findById(params.id).populate("tasks");
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching project" },
      { status: 400 }
    );
  }
}
