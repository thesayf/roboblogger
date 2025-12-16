import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogComponent from "@/models/BlogComponent";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { Types } from "mongoose";

// PUT /api/blog/components/reorder - Reorder components
export async function PUT(request: NextRequest) {
  try {
    const clerkId = request.nextUrl.searchParams.get("clerkId");
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized - clerkId required" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Handle anonymous user for testing
    let user;
    if (clerkId === "anonymous") {
      // Create a consistent ObjectId for anonymous users
      const anonymousId = new Types.ObjectId("000000000000000000000000");
      user = { _id: anonymousId, name: "Anonymous User" };
    } else {
      // Get user from database
      user = await User.findOne({ clerkId });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const body = await request.json();
    const { blogPostId, componentOrders } = body;

    // componentOrders should be an array of { componentId, order }
    if (!blogPostId || !Array.isArray(componentOrders)) {
      return NextResponse.json(
        { error: "blogPostId and componentOrders array are required" },
        { status: 400 }
      );
    }

    // Check if blog post exists and user is the author (skip for anonymous)
    const post = await BlogPost.findById(blogPostId);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (clerkId !== "anonymous" && !post.author.equals(user._id)) {
      return NextResponse.json(
        {
          error:
            "Forbidden - You can only reorder components of your own posts",
        },
        { status: 403 }
      );
    }

    // Update component orders
    const updatePromises = componentOrders.map(({ componentId, order }: any) =>
      BlogComponent.findByIdAndUpdate(componentId, { order })
    );

    await Promise.all(updatePromises);

    // Get updated components
    const updatedComponents = await BlogComponent.find({
      blogPost: blogPostId,
    }).sort({ order: 1 });

    return NextResponse.json({
      message: "Components reordered successfully",
      components: updatedComponents,
    });
  } catch (error) {
    console.error("Error reordering blog components:", error);
    return NextResponse.json(
      { error: "Failed to reorder blog components" },
      { status: 500 }
    );
  }
}
