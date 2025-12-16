import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Block from "@/models/Block";
import Day from "@/models/Day";

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const { blockId, dayId, direction, fromIndex, toIndex } = await request.json();

        if (!blockId || !dayId || !direction) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get the day with all blocks sorted by index
        const day = await Day.findById(dayId).populate({
            path: "blocks",
            options: { sort: { index: 1 } }, // Sort by index in ascending order
        });

        if (!day) {
            return NextResponse.json({ message: "Day not found" }, { status: 404 });
        }

        // Find the current block and its index in the array
        const blockIndex = day.blocks.findIndex(
            (block: any) => block._id.toString() === blockId
        );

        if (blockIndex === -1) {
            return NextResponse.json(
                { message: "Block not found in this day" },
                { status: 404 }
            );
        }

        // Calculate new positions based on direction
        if (direction === "up") {
            // Can't move up if already at the top
            if (blockIndex === 0) {
                return NextResponse.json(
                    { message: "Block is already at the top" },
                    { status: 400 }
                );
            }

            // Get the block above
            const blockAbove = day.blocks[blockIndex - 1];
            const currentBlock = day.blocks[blockIndex];

            // Swap the indices
            const tempIndex = blockAbove.index;

            await Block.findByIdAndUpdate(blockAbove._id, {
                index: currentBlock.index,
            });

            await Block.findByIdAndUpdate(currentBlock._id, {
                index: tempIndex,
            });
        } else if (direction === "down") {
            // Can't move down if already at the bottom
            if (blockIndex === day.blocks.length - 1) {
                return NextResponse.json(
                    { message: "Block is already at the bottom" },
                    { status: 400 }
                );
            }

            // Get the block below
            const blockBelow = day.blocks[blockIndex + 1];
            const currentBlock = day.blocks[blockIndex];

            // Swap the indices
            const tempIndex = blockBelow.index;

            await Block.findByIdAndUpdate(blockBelow._id, {
                index: currentBlock.index,
            });

            await Block.findByIdAndUpdate(currentBlock._id, {
                index: tempIndex,
            });
        } else {
            return NextResponse.json(
                { message: "Invalid direction. Use 'up' or 'down'" },
                { status: 400 }
            );
        }

        // Get updated day with newly sorted blocks
        const updatedDay = await Day.findById(dayId).populate({
            path: "blocks",
            options: { sort: { index: 1 } }, // Sort by index in ascending order
        });

        return NextResponse.json({
            message: "Block reordered successfully",
            day: updatedDay,
        });
    } catch (error) {
        console.error("Error reordering blocks:", error);
        return NextResponse.json(
            {
                message: "Error reordering blocks",
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}