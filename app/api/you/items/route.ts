import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import Event from "@/models/Event";

// Update a single item (project, task, routine, or event)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('API PATCH - userId:', userId);
    
    if (!userId) {
      console.log('API PATCH - No userId, returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, updates } = body;
    console.log('API PATCH - Request body:', { type, id, updates });
    
    // Start DB connection
    await dbConnect();

    let result;
    
    // Check if this is a temporary ID (from frontend) or MongoDB ObjectId
    const isNewItem = id && !id.match(/^[0-9a-fA-F]{24}$/);
    
    if (isNewItem) {
      // Create new item
      const newData = { ...updates, userId };
      
      // For tasks, ensure we have required fields with defaults
      if (type === "task") {
        newData.title = newData.title || newData.name || "New task";
        newData.duration = newData.duration || 30; // Default 30 minutes
        delete newData.name; // Remove 'name' if it exists
      }
      
      switch (type) {
        case "project":
          result = await Project.create(newData);
          break;
        case "task":
          result = await Task.create(newData);
          break;
        case "routine":
          console.log('Creating routine with data:', newData);
          result = await Routine.create(newData);
          console.log('Created routine:', result);
          break;
        case "event":
          result = await Event.create(newData);
          break;
        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      
      // Return the new ID so frontend can update its reference
      return NextResponse.json({ success: true, id: result._id.toString(), isNew: true });
    } else {
      // Update existing item
      const updateOptions = { new: true, lean: true, runValidators: false };
      
      switch (type) {
        case "project":
          result = await Project.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            updateOptions
          );
          break;
        case "task":
          // Handle both 'name' and 'title' fields for backward compatibility
          const taskUpdates = { ...updates };
          if (taskUpdates.name && !taskUpdates.title) {
            taskUpdates.title = taskUpdates.name;
            delete taskUpdates.name;
          }
          result = await Task.findOneAndUpdate(
            { _id: id, userId },
            { $set: taskUpdates },
            updateOptions
          );
          break;
        case "routine":
          console.log('Updating routine:', id, 'with updates:', updates);
          result = await Routine.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            updateOptions
          );
          console.log('Updated routine result:', result);
          break;
        case "event":
          result = await Event.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            updateOptions
          );
          break;
        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// Delete an item
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    switch (type) {
      case "project":
        // Delete project and its tasks
        const project = await Project.findOne({ _id: id, userId });
        if (project?.tasks) {
          await Task.deleteMany({ _id: { $in: project.tasks } });
        }
        await Project.findOneAndDelete({ _id: id, userId });
        break;
      
      case "task":
        await Task.findOneAndDelete({ _id: id, userId });
        break;
      
      case "routine":
        // Delete routine and its tasks
        const routine = await Routine.findOne({ _id: id, userId });
        if (routine?.tasks) {
          await Task.deleteMany({ _id: { $in: routine.tasks } });
        }
        await Routine.findOneAndDelete({ _id: id, userId });
        break;
      
      case "event":
        await Event.findOneAndDelete({ _id: id, userId });
        break;
      
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

// Create a new item
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('POST /api/you/items - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { type, data } = await req.json();
    console.log('POST /api/you/items - Request:', { type, data });

    let result;
    switch (type) {
      case "project":
        result = await Project.create({ ...data, userId });
        break;
      
      case "task":
        // Ensure task has required fields with defaults
        const taskData = {
          ...data,
          userId,
          title: data.title || data.name || "New task",
          duration: data.duration || 30  // Default 30 minutes
        };
        delete taskData.name; // Remove 'name' if it exists
        
        console.log('Creating task with data:', taskData);
        result = await Task.create(taskData);
        console.log('Created task:', result);
        
        // If this task belongs to a project, add it to the project's tasks array
        if (data.projectId) {
          console.log('Adding task to project:', data.projectId);
          const projectUpdate = await Project.findByIdAndUpdate(
            data.projectId,
            { $push: { tasks: result._id } },
            { new: true }
          );
          console.log('Updated project:', projectUpdate);
        }
        
        // If this task belongs to a routine, add it to the routine's tasks array
        if (data.routineId) {
          console.log('Adding task to routine:', data.routineId);
          await Routine.findByIdAndUpdate(
            data.routineId,
            { $push: { tasks: result._id } }
          );
        }
        break;
      
      case "routine":
        result = await Routine.create({ ...data, userId });
        break;
      
      case "event":
        result = await Event.create({ ...data, userId });
        break;
      
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    console.log('Returning result:', { success: true, item: result });
    return NextResponse.json({ success: true, item: result });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}