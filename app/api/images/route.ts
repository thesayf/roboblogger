import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// GET /api/images - Get images from ImageKit for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    // Find all mongoIds for this user's email (handles duplicate accounts)
    await dbConnect();
    const userRecord = await User.findById(user.mongoId).lean() as any;
    const allUserRecords = userRecord?.email
      ? await User.find({ email: userRecord.email }).select('_id').lean()
      : [{ _id: user.mongoId }];
    const mongoIds = allUserRecords.map((u: any) => u._id.toString());

    // List files from all user folders + legacy root
    const folderPaths = [
      ...mongoIds.map((id: string) => `/blog-images/${id}`),
      '/blog-images',  // legacy uploads (no user subfolder)
    ];

    const allResults = await Promise.all(
      folderPaths.map((path) =>
        imagekit.listFiles({ limit, skip, sort: "DESC_CREATED", path })
      )
    );

    // Deduplicate by fileId
    const seen = new Set<string>();
    const files: any[] = [];
    for (const results of allResults) {
      for (const item of results) {
        if (item.type === "file" && !seen.has((item as any).fileId)) {
          seen.add((item as any).fileId);
          files.push(item);
        }
      }
    }

    // Sort by createdAt descending and limit
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limited = files.slice(0, limit);
    const transformedImages = limited.map((image: any) => ({
      fileId: image.fileId,
      name: image.name,
      url: image.url,
      thumbnailUrl: image.thumbnailUrl || image.url,
      size: image.size || 0,
      width: image.width || 0,
      height: image.height || 0,
      format: image.fileType?.split("/")[1] || "unknown",
      createdAt: image.createdAt,
      tags: image.tags || [],
    }));

    return NextResponse.json({
      success: true,
      images: transformedImages,
      total: files.length,
    });
  } catch (error) {
    console.error("Error fetching images from ImageKit:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch images from ImageKit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/images - Delete image from ImageKit
export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "fileId is required" },
        { status: 400 }
      );
    }

    // Delete file from ImageKit
    await imagekit.deleteFile(fileId);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image from ImageKit:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete image from ImageKit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
