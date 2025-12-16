"use client";

import React from "react";
import MarkdownIt from "markdown-it";
import { IBlogComponent } from "@/models/BlogComponent";

interface RichTextComponentProps {
  component: IBlogComponent;
}

// Initialize markdown-it with better options
const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true  // Enable smart quotes and other typographic replacements
});

export default function RichTextComponent({ component }: RichTextComponentProps) {
  if (!component.content) return null;

  // Parse markdown to HTML
  const htmlContent = md.render(component.content);

  return (
    <div
      className="rich-text-content"
      style={{ fontFamily: 'Lora, Georgia, serif' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}