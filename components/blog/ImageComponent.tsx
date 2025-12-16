"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface ImageComponentProps {
  component: IBlogComponent;
}

export default function ImageComponent({ component }: ImageComponentProps) {
  if (!component.url) return null;

  return (
    <div className="my-12">
      <div className="overflow-hidden bg-gray-100">
        <img
          src={component.url}
          alt={component.alt || ""}
          className="w-full h-auto object-cover"
        />
      </div>
      {component.caption && (
        <p className="mt-3 text-sm font-mono text-gray-500 text-center">
          {component.caption}
        </p>
      )}
    </div>
  );
}
