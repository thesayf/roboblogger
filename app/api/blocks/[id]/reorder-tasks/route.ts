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
    
    const blockId = params.id;
    const body = await req.json();
    const { taskIds } = body;

    console.log('[blocks/reorder-tasks] Reordering tasks for block:', blockId);
    console.log('[blocks/reorder-tasks] New task order:', taskIds);

    // Update the block with the new task order
    const updatedBlock = await Block.findByIdAndUpdate(
      blockId,
      { tasks: taskIds },
      { new: true }
    );

    if (!updatedBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    console.log('[blocks/reorder-tasks] Tasks reordered successfully');

    return NextResponse.json({ 
      success: true,
      block: updatedBlock
    });
  } catch (error) {
    console.error('[blocks/reorder-tasks] Error:', error);
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}