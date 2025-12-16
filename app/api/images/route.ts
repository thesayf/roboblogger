import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

// GET /api/images - Get all images from ImageKit
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    // List files from ImageKit
    const results = await imagekit.listFiles({
      limit,
      skip,
      sort: "DESC_CREATED", // Most recent first
    });

    // Filter only files (not folders) and transform ImageKit response to match our interface
    const files = results.filter((item) => item.type === "file") as any[];
    const transformedImages = files.map((image: any) => ({
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
      total: transformedImages.length,
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
