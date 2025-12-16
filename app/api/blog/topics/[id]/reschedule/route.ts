import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Topic from "@/models/Topic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { scheduledAt } = await request.json();
    
    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 }
      );
    }

    // Find the topic
    const topic = await Topic.findById(params.id);
    
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Update topic with new schedule and reset status
    topic.scheduledAt = new Date(scheduledAt);
    topic.status = "pending";
    topic.generationStatus = null;
    topic.error = null;
    topic.attempts = 0;
    topic.lastAttempt = null;
    
    await topic.save();

    // Vercel Cron will handle scheduled generation
    console.log(`Topic ${params.id} rescheduled for ${scheduledAt} - will be processed by Vercel Cron`);

    return NextResponse.json({
      message: "Topic rescheduled successfully",
      topic: topic,
    });
  } catch (error) {
    console.error("Error rescheduling topic:", error);
    return NextResponse.json(
      { error: "Failed to reschedule topic" },
      { status: 500 }
    );
  }
}