import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";

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
    
    const taskId = params.id;
    const body = await req.json();
    const { fromBlockId, toBlockId, position } = body;

    console.log('[tasks/move] Moving task:', taskId);
    console.log('[tasks/move] From block:', fromBlockId, 'To block:', toBlockId, 'Position:', position);

    // Remove task from source block
    if (fromBlockId) {
      await Block.findByIdAndUpdate(
        fromBlockId,
        { $pull: { tasks: taskId } }
      );
    }

    // Add task to destination block at specific position
    if (toBlockId) {
      const toBlock = await Block.findById(toBlockId);
      if (!toBlock) {
        return NextResponse.json({ error: "Destination block not found" }, { status: 404 });
      }

      // Insert task at the specified position
      const tasks = toBlock.tasks || [];
      if (position !== undefined && position >= 0) {
        tasks.splice(position, 0, taskId);
      } else {
        tasks.push(taskId); // Add to end if no position specified
      }

      await Block.findByIdAndUpdate(
        toBlockId,
        { tasks }
      );
    }

    console.log('[tasks/move] Task moved successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Task moved successfully'
    });
  } catch (error) {
    console.error('[tasks/move] Error:', error);
    return NextResponse.json(
      { error: "Failed to move task" },
      { status: 500 }
    );
  }
}