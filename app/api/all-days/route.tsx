// app/api/days/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { userId: clerkId, page = 1, limit = 30 } = await request.json();

    if (!clerkId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mongoUserId = user._id;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalDays = await Day.countDocuments({ user: mongoUserId });
    const totalPages = Math.ceil(totalDays / limit);

    const days = await Day.find({ user: mongoUserId })
      .populate({
        path: "blocks",
        populate: {
          path: "tasks",
          select: "completed title",
        },
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Process days data
    const processedDays = days.map((day) => {
      let dayTotalTasks = 0;
      let dayCompletedTasks = 0;
      let blocksCompleted = 0;
      let totalBlocks = day.blocks?.length || 0;

      day.blocks?.forEach((block: any) => {
        let blockCompleted = true;
        block.tasks?.forEach((task: any) => {
          dayTotalTasks++;
          if (task.completed) {
            dayCompletedTasks++;
          } else {
            blockCompleted = false;
          }
        });
        if (blockCompleted && block.tasks?.length > 0) {
          blocksCompleted++;
        }
      });

      return {
        date: day.date,
        tasksCompleted: dayCompletedTasks,
        totalTasks: dayTotalTasks,
        blocksCompleted,
        totalBlocks,
        performanceScore:
          dayTotalTasks > 0
            ? ((dayCompletedTasks / dayTotalTasks) * 10).toFixed(1)
            : "0",
        performanceLevel: getPerformanceLevel(dayCompletedTasks, dayTotalTasks),
        blocks: day.blocks, // Include blocks for detailed view
      };
    });

    return NextResponse.json({
      days: processedDays,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalDays,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching days:", error);
    return NextResponse.json(
      { error: "Error fetching days data" },
      { status: 500 }
    );
  }
}

function getPerformanceLevel(completed: number, total: number): string {
  if (total === 0) return "No Tasks";
  const ratio = completed / total;
  if (ratio >= 0.9) return "Peak Performance";
  if (ratio >= 0.7) return "In the Zone";
  if (ratio >= 0.5) return "Making Progress";
  return "Getting Started";
}
