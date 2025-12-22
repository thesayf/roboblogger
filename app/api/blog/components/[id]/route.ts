import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogComponent from "@/models/BlogComponent";
import BlogPost from "@/models/BlogPost";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET /api/blog/components/[id] - Get single component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const component = await BlogComponent.findById(params.id).populate(
      "blogPost",
      "title author owner"
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
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to update components" },
        { status: 401 }
      );
    }

    // Check if component exists
    const existingComponent = await BlogComponent.findById(params.id).populate(
      "blogPost",
      "owner"
    );

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner of the blog post
    if (existingComponent.blogPost.owner.toString() !== currentUser.mongoId) {
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
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to delete components" },
        { status: 401 }
      );
    }

    // Check if component exists
    const existingComponent = await BlogComponent.findById(params.id).populate(
      "blogPost",
      "owner"
    );

    if (!existingComponent) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner of the blog post
    if (existingComponent.blogPost.owner.toString() !== currentUser.mongoId) {
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
