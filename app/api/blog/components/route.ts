import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogComponent from "@/models/BlogComponent";
import BlogPost from "@/models/BlogPost";
import User from "@/models/User";
import { Types } from "mongoose";

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
    const { blogPost, type, order, ...componentFields } = body;

    // Check if blog post exists and user is the author (skip for anonymous)
    const post = await BlogPost.findById(blogPost);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    if (clerkId !== "anonymous") {
      if (!post.author.equals(user._id)) {
        return NextResponse.json(
          { error: "Forbidden - You can only add components to your own posts" },
          { status: 403 }
        );
      }
    } else {
      // For anonymous users, check if the post author is the anonymous user
      const anonymousId = new Types.ObjectId("000000000000000000000000");
      if (!post.author.equals(anonymousId)) {
        return NextResponse.json(
          { error: "Forbidden - You can only add components to your own posts" },
          { status: 403 }
        );
      }
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
