import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogComponent from "@/models/BlogComponent";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { Types } from "mongoose";

// GET /api/blog/components/[id] - Get single component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const component = await BlogComponent.findById(params.id).populate(
      "blogPost",
      "title author"
    );

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(component);
  } catch (error) {
    console.error("Error fetching blog component:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog component" },
      { status: 500 }
    );
  }
}

// PUT /api/blog/components/[id] - Update component
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

    // Check if component exists
    const existingComponent = await BlogComponent.findById(params.id).populate(
      "blogPost"
    );

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Check if user is the author of the blog post (skip for anonymous)
    if (
      clerkId !== "anonymous" &&
      !existingComponent.blogPost.author.equals(user._id)
    ) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit components of your own posts" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Update component
    const updatedComponent = await BlogComponent.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );

    return NextResponse.json(updatedComponent);
  } catch (error) {
    console.error("Error updating blog component:", error);
    return NextResponse.json(
      { error: "Failed to update blog component" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/components/[id] - Delete component
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

    // Check if component exists
    const existingComponent = await BlogComponent.findById(params.id).populate(
      "blogPost"
    );

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Check if user is the author of the blog post (skip for anonymous)
    if (
      clerkId !== "anonymous" &&
      !existingComponent.blogPost.author.equals(user._id)
    ) {
      return NextResponse.json(
        {
          error: "Forbidden - You can only delete components of your own posts",
        },
        { status: 403 }
      );
    }

    // Remove component from blog post
    await BlogPost.findByIdAndUpdate(existingComponent.blogPost._id, {
      $pull: { components: params.id },
    });

    // Delete the component
    await BlogComponent.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Component deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog component:", error);
    return NextResponse.json(
      { error: "Failed to delete blog component" },
      { status: 500 }
    );
  }
}
