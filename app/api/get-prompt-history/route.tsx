// /app/api/get-prompt-history/route.ts
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";

export async function POST(request: NextRequest) {
  try {
    const { dayId } = await request.json();

    // Validate required fields
    if (!dayId) {
      return new Response(
        JSON.stringify({ success: false, error: "Day ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await dbConnect();

    const day = await Day.findById(dayId).select("promptHistory");

    if (!day) {
      return new Response(
        JSON.stringify({ success: false, error: "Day not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        promptHistory: day.promptHistory || [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching prompt history:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch prompt history",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
