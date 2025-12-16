import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import mongoose from "mongoose";
import Goal from "@/models/Goal";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Routine from "@/models/Routine";
import Event from "@/models/Event";

// Fast reorder endpoint - just updates order field
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { type, items } = await req.json();
    
    console.log('Reorder API - type:', type);
    console.log('Reorder API - items:', items.map((item: any) => ({ id: item.id, content: item.content })));

    // Bulk update just the order field
    const bulkOps = items.map((item: any, index: number) => {
      // Convert string ID to ObjectId if needed
      const itemId = mongoose.Types.ObjectId.isValid(item.id) 
        ? new mongoose.Types.ObjectId(item.id)
        : item.id;
      
      return {
        updateOne: {
          filter: { _id: itemId, userId },
          update: { order: index }
        }
      };
    });
    
    console.log('Bulk operations:', bulkOps);

    let result;
    switch (type) {
      case 'goals':
        result = await Goal.bulkWrite(bulkOps);
        console.log('Goals bulk write result:', result);
        break;
      case 'projects':
        result = await Project.bulkWrite(bulkOps);
        console.log('Projects bulk write result:', result);
        break;
      case 'backlog':
      case 'tasks':
        result = await Task.bulkWrite(bulkOps);
        console.log('Tasks bulk write result:', result);
        break;
      case 'routines':
        result = await Routine.bulkWrite(bulkOps);
        console.log('Routines bulk write result:', result);
        break;
      case 'events':
        result = await Event.bulkWrite(bulkOps);
        console.log('Events bulk write result:', result);
        break;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error reordering:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}