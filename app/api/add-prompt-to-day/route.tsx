// /app/api/days/[id]/prompts/route.ts
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    const dayId = body.dayId;
    const prompt = body.prompt;

    await dbConnect();

    // Add the new prompt to the day's history
    const updatedDay = await Day.findByIdAndUpdate(
      dayId,
      {
        $push: {
          promptHistory: {
            prompt,
            timestamp: Date.now(),
          },
        },
      },
      { new: true } // Return the updated document
    );

    return new Response(JSON.stringify({ success: true, day: updatedDay }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error recording prompt:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to record prompt" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
