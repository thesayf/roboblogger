"use client";

import React from "react";
import Link from "next/link";
import { IBlogComponent } from "@/models/BlogComponent";

interface CTAComponentProps {
  component: IBlogComponent;
}

export default function CTAComponent({ component }: CTAComponentProps) {
  if (!component.text || !component.link) return null;

  return (
    <div className="my-12 p-8 bg-gray-50 border border-gray-200">
      {component.title && (
        <p className="text-gray-900 font-medium mb-3 font-mono">
          {component.title}
        </p>
      )}
      {component.content && (
        <div
          className="text-gray-600 text-sm mb-4 font-mono"
          dangerouslySetInnerHTML={{ __html: component.content }}
        />
      )}
      {component.link.startsWith('http') ? (
        <a
          href={component.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-mono hover:bg-gray-800 transition-colors"
        >
          {component.text}
        </a>
      ) : (
        <Link
          href={component.link}
          className="inline-block px-6 py-2 bg-gray-900 text-white text-sm font-mono hover:bg-gray-800 transition-colors"
        >
          {component.text}
        </Link>
      )}
    </div>
  );
}