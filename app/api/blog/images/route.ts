import { NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, return an empty array since we don't have image storage set up
    // In a real implementation, this would fetch from your image storage system
    return NextResponse.json({
      images: [],
      total: 0
    });
  } catch (error) {
    console.error("Error fetching blog images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}