"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, Copy, ExternalLink } from "lucide-react";

interface Image {
  _id: string;
  fileId: string;
  url: string;
  thumbnailUrl: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  usageCount?: number;
}

interface ImagesTabProps {
  images: Image[];
  isLoadingImages: boolean;
  isUploading: boolean;
  uploadProgress: number;
  handleImageUpload: (files: FileList | null) => void;
  handleDeleteImage: (imageId: string) => void;
  refreshImages: () => void;
}

export function ImagesTab({
  images,
  isLoadingImages,
  isUploading,
  uploadProgress,
  handleImageUpload,
  handleDeleteImage,
  refreshImages,
}: ImagesTabProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Blog Images</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <label htmlFor="image-upload">
              <Button variant="outline" asChild disabled={isUploading}>
                <span className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingImages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading images...</span>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No images uploaded yet.</p>
            <label htmlFor="image-upload">
              <Button className="mt-4" asChild>
                <span className="cursor-pointer">Upload your first image</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div
                key={image._id}
                className="group relative cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(image.url);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.url, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate">{image.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </p>
                  {image.usageCount !== undefined && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Used {image.usageCount}x
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}