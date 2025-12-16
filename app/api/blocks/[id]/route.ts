import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Day from "@/models/Day";
import Task from "@/models/Task";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const blockId = params.id;
    const body = await req.json();
    const { completed } = body;

    console.log('[blocks/PUT] Updating block completion:', blockId, { completed });

    // Update the block completion status
    const updatedBlock = await Block.findByIdAndUpdate(
      blockId,
      { completed },
      { new: true }
    );

    if (!updatedBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    console.log('[blocks/PUT] Block completion updated successfully');

    return NextResponse.json({
      success: true,
      block: updatedBlock
    });
  } catch (error) {
    console.error('[blocks/PUT] Error:', error);
    return NextResponse.json(
      { error: "Failed to update block completion" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const blockId = params.id;
    const body = await req.json();
    const { time, type, title, duration, note } = body;

    console.log('[blocks/PATCH] Updating block:', blockId, { time, type, title, duration, note });

    // Build update object with only provided fields
    const updateData: any = {};
    if (time !== undefined) updateData.time = time;
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (duration !== undefined) updateData.duration = duration;
    if (note !== undefined) updateData.note = note;

    // Update the block
    const updatedBlock = await Block.findByIdAndUpdate(
      blockId,
      updateData,
      { new: true }
    );

    if (!updatedBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    console.log('[blocks/PATCH] Block updated successfully');

    return NextResponse.json({ 
      success: true,
      block: updatedBlock
    });
  } catch (error) {
    console.error('[blocks/PATCH] Error:', error);
    return NextResponse.json(
      { error: "Failed to update block" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    const blockId = params.id;
    const body = await req.json();
    const { dayId } = body;

    console.log('[blocks/DELETE] Deleting block:', blockId);

    // Fetch the block with its tasks
    const block = await Block.findById(blockId).populate('tasks');
    if (!block) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Check if this is a routine or event block
    const isRoutineBlock = block.type === 'routine' || block.metadata?.routineId;
    const isEventBlock = block.type === 'event' || block.metadata?.eventId;

    console.log('[blocks/DELETE] Block type:', block.type, 'Is routine:', isRoutineBlock);

    // Handle tasks based on block type
    if (block.tasks && block.tasks.length > 0) {
      if (isRoutineBlock || isEventBlock) {
        // For routine/event blocks, don't delete the tasks (they belong to the routine/event)
        console.log('[blocks/DELETE] Block contains routine/event tasks - preserving tasks');
        // Tasks remain in the database, just the block reference is removed
      } else {
        // For regular blocks, check each task
        for (const task of block.tasks) {
          // Check if task belongs to a project or routine
          if (task.projectId || task.routineId) {
            console.log('[blocks/DELETE] Preserving task:', task._id, '(belongs to project/routine)');
            // Don't delete tasks that belong to projects or routines
          } else {
            console.log('[blocks/DELETE] Deleting standalone task:', task._id);
            // Delete standalone tasks
            await Task.findByIdAndDelete(task._id);
          }
        }
      }
    }

    // Remove block from day's blocks array
    if (dayId) {
      await Day.findByIdAndUpdate(
        dayId,
        { $pull: { blocks: blockId } },
        { new: true }
      );
    }

    // Delete the block itself
    await Block.findByIdAndDelete(blockId);

    return NextResponse.json({ 
      success: true,
      message: 'Block deleted, tasks preserved where appropriate'
    });
  } catch (error) {
    console.error('[blocks/DELETE] Error:', error);
    return NextResponse.json(
      { error: "Failed to delete block" },
      { status: 500 }
    );
  }
}