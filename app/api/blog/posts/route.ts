import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";
import BlogComponent from "@/models/BlogComponent";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import Topic from "@/models/Topic";
import TopicCluster from "@/models/TopicCluster";
import {
  contentStructureErrorResponse,
  resolveContentStructure,
} from "@/lib/content-structure";

// GET /api/blog/posts - Get all blog posts
// For admin: pass ownerOnly=true to filter by current user
// For public: pass status=published to get all published posts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const author = url.searchParams.get("author");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search");
    const ownerOnly = url.searchParams.get("ownerOnly") === "true";
    const clusterId = url.searchParams.get("clusterId");
    const seriesId = url.searchParams.get("seriesId");
    const unassigned = url.searchParams.get("unassigned") === "true";

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (author) query.author = author;
    if (clusterId) query.clusterId = clusterId;
    if (seriesId) query.seriesId = seriesId;
    if (unassigned) {
      query.clusterId = { $exists: false };
      query.seriesId = { $exists: false };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by owner if requested (for admin dashboard)
    if (ownerOnly) {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      query.owner = currentUser.mongoId;
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
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isSystemCall = searchParams.get('systemCall') === 'true';

    // Get the current authenticated user (or allow system calls)
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const {
      title,
      description,
      slug,
      components,
      owner: bodyOwner,
      sourceTopicId,
      clusterId,
      seriesId,
      ...otherFields
    } = body;

    // For system calls (e.g., from topic generation), use the owner from the request body
    // For regular calls, require authentication
    let ownerId: string;
    if (isSystemCall && bodyOwner) {
      // System call with owner provided (from topic generation)
      ownerId = bodyOwner;
      console.log(`[Posts] System call creating post for owner: ${ownerId}`);
    } else if (currentUser) {
      // Regular authenticated user
      ownerId = currentUser.mongoId;
    } else {
      return NextResponse.json(
        { error: "Unauthorized - you must be logged in to create posts" },
        { status: 401 }
      );
    }

    let structure;
    if (sourceTopicId) {
      const sourceTopic = await Topic.findOne({ _id: sourceTopicId, owner: ownerId })
        .select('clusterId seriesId')
        .lean() as { clusterId?: { toString(): string }; seriesId?: { toString(): string } } | null;
      if (!sourceTopic) {
        return NextResponse.json({ error: "Source topic not found" }, { status: 404 });
      }
      structure = await resolveContentStructure({
        ownerId,
        clusterId: sourceTopic.clusterId?.toString(),
        seriesId: sourceTopic.seriesId?.toString(),
      });
    } else {
      structure = await resolveContentStructure({ ownerId, clusterId, seriesId });
    }

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the blog post with owner set to current user or system-provided owner
    const blogPost = new BlogPost({
      title,
      description,
      slug,
      owner: ownerId,
      author: ownerId,
      sourceTopicId: sourceTopicId || undefined,
      clusterId: structure.clusterId,
      seriesId: structure.seriesId,
      ...otherFields,
    });

    await blogPost.save();

    if (sourceTopicId) {
      await TopicCluster.findOneAndUpdate(
        { owner: ownerId, primaryPillarTopicId: sourceTopicId },
        { $set: { primaryPillarPostId: blogPost._id } }
      );
    }

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

        const component = new BlogComponent(componentData);
        return component.save();
      });

      const savedComponents = await Promise.all(componentPromises);

      // Update blog post with component IDs
      blogPost.components = savedComponents.map((comp) => comp._id);
      await blogPost.save();
    }

    // Populate the response
    const populatedPost = await BlogPost.findById(blogPost._id)
      .populate("author", "name email imageUrl")
      .populate("components");

    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json(
        { error: structureError.message },
        { status: structureError.status }
      );
    }
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
