"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface QuoteComponentProps {
  component: IBlogComponent;
}

export default function QuoteComponent({ component }: QuoteComponentProps) {
  if (!component.content) return null;

  return (
    <div className="border-l-4 border-gray-300 pl-6 my-12">
      <blockquote
        className="text-gray-800 text-lg leading-relaxed italic"
        style={{ fontFamily: 'Lora, Georgia, serif' }}
        dangerouslySetInnerHTML={{ __html: component.content }}
      />
      {component.author && (
        <footer className="text-gray-600 text-sm mt-4 not-italic font-mono">
          — {component.author}
          {component.citation && `, ${component.citation}`}
        </footer>
      )}
    </div>
  );
}