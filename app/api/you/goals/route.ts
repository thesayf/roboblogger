import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Goal from "@/models/Goal";

// Update a specific goal or create new one
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, content, color, order, deadline } = await req.json();
    
    console.log('📅 GOAL PATCH Request:', { id, content, deadline, hasDeadline: deadline !== undefined });

    let goal;
    
    // Check if this is a temporary ID
    const isTempId = id && (id.startsWith('temp_') || !id.match(/^[0-9a-fA-F]{24}$/));
    
    if (!isTempId) {
      // Try to find by real MongoDB ID
      goal = await Goal.findOne({ _id: id, userId }).catch(() => null);
    }
    
    if (!goal && !isTempId) {
      // ID looks like MongoDB ID but goal not found - error
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    
    if (!goal) {
      // This is a new goal with a temporary ID
      // Check if this might be a duplicate creation attempt
      const existingGoal = await Goal.findOne({ 
        userId, 
        content, 
        order 
      });
      
      if (existingGoal && Math.abs(existingGoal.order - order) < 0.01) {
        // This is likely the same goal, update it
        const updateData: any = { content, color, order };
        if (deadline !== undefined) {
          updateData.deadline = deadline;
        }
        goal = await Goal.findOneAndUpdate(
          { _id: existingGoal._id, userId },
          updateData,
          { new: true }
        );
      } else {
        // Create new goal - deadline is required
        if (!deadline) {
          console.log('📅 ERROR: No deadline provided for new goal');
          return NextResponse.json({ error: "Deadline is required for goals" }, { status: 400 });
        }
        console.log('📅 Creating new goal with deadline:', deadline);
        goal = await Goal.create({
          userId,
          content,
          color,
          deadline,
          order: order ?? 0
        });
        console.log('📅 Created goal:', { id: goal._id, deadline: goal.deadline });
      }
    } else {
      // Update existing goal
      const updateData: any = { content, color, order };
      if (deadline !== undefined) {
        updateData.deadline = deadline;
        console.log('📅 Updating goal deadline to:', deadline);
      }
      console.log('📅 Update data:', updateData);
      goal = await Goal.findOneAndUpdate(
        { _id: id, userId },
        updateData,
        { new: true }
      );
      console.log('📅 Updated goal:', { id: goal._id, deadline: goal.deadline });
    }

    console.log('📅 Returning goal with deadline:', goal.deadline);
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

// Delete a goal
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await Goal.findOneAndDelete({ _id: id, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}

// Create a new goal or reorder goals
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    
    // Check if this is a create request or reorder request
    if (body.name !== undefined) {
      // Create new goal
      const { name, color, order, deadline } = body;
      
      // Set deadline to 30 days from now if not provided
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 30);
      
      const goal = await Goal.create({
        userId,
        content: name || "New goal",
        color: color || "from-purple-100 to-indigo-100",
        deadline: deadline || defaultDeadline,
        order: order || 9999
      });
      
      return NextResponse.json({ success: true, goal });
    } else if (body.goals) {
      // Reorder goals
      const { goals } = body;
      const bulkOps = goals.map((goal: any, index: number) => ({
        updateOne: {
          filter: { _id: goal.id, userId },
          update: { order: index }
        }
      }));

      await Goal.bulkWrite(bulkOps);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing goal request:", error);
    return NextResponse.json({ error: "Failed to process goal request" }, { status: 500 });
  }
}