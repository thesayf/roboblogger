"use client";

import React from "react";

interface AIBlogEditorProps {
  onBack: () => void;
}

export default function AIBlogEditor({ onBack }: AIBlogEditorProps) {
  return (
    <div>
      <h1>AI Blog Editor Test</h1>
      <button onClick={onBack}>Back</button>
      <p>This is a simple test version to isolate the issue.</p>
    </div>
  );
}