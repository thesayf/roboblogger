import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";
import BlogComponent from "@/models/BlogComponent";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

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

    // Increment view count if not the owner viewing
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.mongoId !== post.owner.toString()) {
      await BlogPost.findByIdAndUpdate(params.id, { $inc: { views: 1 } });
    } else if (!currentUser) {
      // Anonymous visitors increment views
      await BlogPost.findByIdAndUpdate(params.id, { $inc: { views: 1 } });
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
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to edit posts" },
        { status: 401 }
      );
    }

    // Check if post exists and user is the owner
    const existingPost = await BlogPost.findById(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (existingPost.owner.toString() !== currentUser.mongoId) {
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
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to delete posts" },
        { status: 401 }
      );
    }

    // Check if post exists and user is the owner
    const existingPost = await BlogPost.findById(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (existingPost.owner.toString() !== currentUser.mongoId) {
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
