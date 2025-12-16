import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";
import BlogComponent from "@/models/BlogComponent";
import User from "@/models/User";
import { Types } from "mongoose";

// GET /api/blog/posts - Get all blog posts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const author = url.searchParams.get("author");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search");

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get posts with pagination
    const posts = await BlogPost.find(query)
      .populate("author", "name email imageUrl")
      .populate("components")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await BlogPost.countDocuments(query);

    // Remove this log in production to avoid cluttering the console
    // console.log("these are the posts im getting from the api", JSON.stringify(posts, null, 2));

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const clerkId = request.nextUrl.searchParams.get("clerkId");
    if (!clerkId) {
      return NextResponse.json(
        { error: "CLERK_AUTH_FAILED: Missing clerkId parameter in /api/blog/posts endpoint" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Handle anonymous user for testing and system-generated posts
    let user;
    if (clerkId === "anonymous") {
      // Create a consistent ObjectId for anonymous users
      const anonymousId = new Types.ObjectId("000000000000000000000000");
      user = { _id: anonymousId, name: "Anonymous User" };
    } else if (clerkId === "system") {
      // Create a consistent ObjectId for system-generated posts
      const systemId = new Types.ObjectId("111111111111111111111111");
      user = { _id: systemId, name: "System" };
    } else {
      // Get user from database
      user = await User.findOne({ clerkId });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const body = await request.json();
    const { title, description, slug, components, ...otherFields } = body;

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the blog post
    const blogPost = new BlogPost({
      title,
      description,
      slug,
      author: user._id,
      ...otherFields,
    });

    await blogPost.save();

    // Create components if provided
    if (components && Array.isArray(components)) {
      console.log(`Creating ${components.length} components for blog post:`, blogPost._id);
      
      const componentPromises = components.map((comp: any, index: number) => {
        const componentData = {
          blogPost: blogPost._id,
          type: comp.type,
          order: index,
          ...comp,
        };
        console.log(`Component ${index} data being saved:`, componentData);
        
        const component = new BlogComponent(componentData);
        return component.save();
      });

      const savedComponents = await Promise.all(componentPromises);

      // Update blog post with component IDs
      blogPost.components = savedComponents.map((comp) => comp._id);
      await blogPost.save();
    }

    // Populate the response (handle anonymous user case)
    let populatedPost;
    if (clerkId === "anonymous") {
      populatedPost = await BlogPost.findById(blogPost._id).populate(
        "components"
      );
      // Manually set author data for anonymous user
      populatedPost = populatedPost.toObject();
      populatedPost.author = { _id: user._id, name: "Anonymous User" };
    } else {
      populatedPost = await BlogPost.findById(blogPost._id)
        .populate("author", "name email imageUrl")
        .populate("components");
    }

    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
