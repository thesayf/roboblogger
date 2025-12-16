import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import Block from "@/models/Block";
import { format, addDays } from "date-fns";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // Get eventId from request body
    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get today and tomorrow's dates in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    // Find days for today and tomorrow
    const days = await Day.find({
      date: { $in: [today, tomorrow] },
    });

    if (!days || days.length === 0) {
      return NextResponse.json({
        isScheduled: false,
        scheduledDate: null,
      });
    }

    // Get all block IDs from the days
    const blockIds = days.flatMap((day) => day.blocks);

    // Find blocks that contain the eventId
    const blocks = await Block.find({
      _id: { $in: blockIds },
      event: eventId,
    });

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({
        isScheduled: false,
        scheduledDate: null,
      });
    }

    // Find which day the block belongs to
    const block = blocks[0]; // Use the first matching block
    const day = days.find((day) =>
      day.blocks.some(
        (blockId: { toString: () => any }) =>
          blockId.toString() === block._id.toString()
      )
    );

    return NextResponse.json({
      isScheduled: true,
      scheduledDate: day?.date || null,
      blockId: block._id,
      startTime: block.startTime,
      endTime: block.endTime,
    });
  } catch (error) {
    console.error("Error checking event schedule:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
