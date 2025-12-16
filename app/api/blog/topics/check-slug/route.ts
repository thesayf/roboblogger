import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Topic from "@/models/Topic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");
    
    if (!slug) {
      return NextResponse.json({ available: true });
    }
    
    const query: any = { "seo.slug": slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingTopic = await Topic.findOne(query);
    
    return NextResponse.json({
      available: !existingTopic,
      slug: slug,
      suggestion: existingTopic ? `${slug}-${Date.now().toString(36)}` : null
    });
  } catch (error) {
    console.error("Error checking slug:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    );
  }
}