import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";

// GET /api/blog/posts/slug/[slug] - Get single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();

    const post = await BlogPost.findOne({
      slug: params.slug,
      status: "published", // Only return published posts for public viewing
    })
      .populate("author", "name email imageUrl")
      .populate({
        path: "components",
        options: { sort: { order: 1 } },
      });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment view count for public viewing
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
