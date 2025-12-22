import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogComponent from "@/models/BlogComponent";
import BlogPost from "@/models/BlogPost";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET /api/blog/components - Get components for a blog post
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const blogPostId = request.nextUrl.searchParams.get("blogPostId");
    if (!blogPostId) {
      return NextResponse.json(
        { error: "blogPostId is required" },
        { status: 400 }
      );
    }

    const components = await BlogComponent.find({ blogPost: blogPostId }).sort({
      order: 1,
    });

    return NextResponse.json(components);
  } catch (error) {
    console.error("Error fetching blog components:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog components" },
      { status: 500 }
    );
  }
}

// POST /api/blog/components - Create new component
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to create components" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { blogPost, type, order, ...componentFields } = body;

    // Check if blog post exists and user is the owner
    const post = await BlogPost.findById(blogPost);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (post.owner.toString() !== currentUser.mongoId) {
      return NextResponse.json(
        { error: "Forbidden - You can only add components to your own posts" },
        { status: 403 }
      );
    }

    // Create the component
    const component = new BlogComponent({
      blogPost,
      type,
      order,
      ...componentFields,
    });

    console.log("Creating component with data:", {
      blogPost,
      type,
      order,
      ...componentFields,
    });

    await component.save();

    // Add component to blog post
    await BlogPost.findByIdAndUpdate(blogPost, {
      $push: { components: component._id },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error("Error creating blog component:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: "Failed to create blog component",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
