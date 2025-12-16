"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface VideoComponentProps {
  component: IBlogComponent;
}

const getEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('/')[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

export default function VideoComponent({ component }: VideoComponentProps) {
  if (!component.videoUrl) return null;

  const embedUrl = getEmbedUrl(component.videoUrl);

  return (
    <div className="my-12">
      {component.videoTitle && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          {component.videoTitle}
        </h3>
      )}
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={component.videoTitle || "Video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}