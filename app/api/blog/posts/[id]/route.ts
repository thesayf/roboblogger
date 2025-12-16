import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";
import BlogComponent from "@/models/BlogComponent";
import User from "@/models/User";
import { Types } from "mongoose";

// GET /api/blog/posts/[id] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const post = await BlogPost.findById(params.id)
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

    // Increment view count if not the author viewing
    const clerkId = request.nextUrl.searchParams.get("clerkId");
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user && !user._id.equals(post.author._id)) {
        await BlogPost.findByIdAndUpdate(params.id, { $inc: { views: 1 } });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/[id] - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if post exists and user is the author (skip for anonymous)
    const existingPost = await BlogPost.findById(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (clerkId !== "anonymous" && !existingPost.author.equals(user._id)) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { components, ...postFields } = body;

    // Update blog post
    const updatedPost = await BlogPost.findByIdAndUpdate(
      params.id,
      postFields,
      { new: true }
    );

    // Handle components update if provided
    if (components && Array.isArray(components)) {
      // Delete existing components
      await BlogComponent.deleteMany({ blogPost: params.id });

      // Create new components
      const componentPromises = components.map((comp: any, index: number) => {
        const component = new BlogComponent({
          blogPost: params.id,
          type: comp.type,
          order: index,
          ...comp,
        });
        return component.save();
      });

      const savedComponents = await Promise.all(componentPromises);

      // Update blog post with new component IDs
      updatedPost!.components = savedComponents.map((comp) => comp._id);
      await updatedPost!.save();
    }

    // Populate the response
    const populatedPost = await BlogPost.findById(params.id)
      .populate("author", "name email imageUrl")
      .populate({
        path: "components",
        options: { sort: { order: 1 } },
      });

    return NextResponse.json(populatedPost);
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[id] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if post exists and user is the author (skip for anonymous)
    const existingPost = await BlogPost.findById(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (clerkId !== "anonymous" && !existingPost.author.equals(user._id)) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Delete associated components first
    await BlogComponent.deleteMany({ blogPost: params.id });

    // Delete the blog post
    await BlogPost.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
