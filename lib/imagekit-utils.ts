// ImageKit utility functions and types

export interface ImageKitResponse {
  success: boolean;
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  width: number;
  height: number;
  format: string;
}

export interface ImageKitMetadata {
  fileId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

// Validate image file before upload
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Only image files are allowed" };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum 10MB allowed.",
    };
  }

  // Check for supported formats
  const supportedFormats = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported format. Please use JPEG, PNG, GIF, or WebP.",
    };
  }

  return { valid: true };
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Generate ImageKit URL with transformations
export const getOptimizedImageUrl = (
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string => {
  if (!url) return "";

  const { width, height, quality = 80 } = options;

  let transformations = `q-${quality}`;
  if (width) transformations += `,w-${width}`;
  if (height) transformations += `,h-${height}`;

  // Check if it's an ImageKit URL
  if (url.includes("ik.imagekit.io")) {
    // Add transformations to ImageKit URL
    const parts = url.split("/");
    const pathIndex =
      parts.findIndex((part) => part.includes("ik.imagekit.io")) + 1;
    parts.splice(pathIndex, 0, `tr:${transformations}`);
    return parts.join("/");
  }

  return url; // Return original URL if not ImageKit
};
