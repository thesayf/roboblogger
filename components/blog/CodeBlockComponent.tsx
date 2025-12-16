"use client";

import React, { useState } from "react";
import { IBlogComponent } from "@/models/BlogComponent";
import { Copy, Check, Code2, Terminal } from "lucide-react";

interface CodeBlockComponentProps {
  component: IBlogComponent;
}

export default function CodeBlockComponent({ component }: CodeBlockComponentProps) {
  const [copied, setCopied] = useState(false);

  if (!component.content) return null;

  // Extract language from data if available
  const language = component.data?.language || 'text';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(component.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getLanguageIcon = () => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return <Code2 className="w-4 h-4" />;
      case 'bash':
      case 'shell':
      case 'terminal':
        return <Terminal className="w-4 h-4" />;
      default:
        return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="my-12">
      {/* Optional title */}
      {component.data?.title && (
        <h4 className="text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {component.data.title}
        </h4>
      )}

      {/* Code block */}
      <div className="bg-gray-900 rounded overflow-hidden border border-gray-700">
        {/* Header with language indicator and copy button */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-mono">
            {getLanguageIcon()}
            <span className="text-sm font-medium uppercase tracking-wider">
              {language}
            </span>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-mono transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code content */}
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-gray-100 font-mono whitespace-pre">
            {component.content}
          </code>
        </pre>
      </div>

      {/* Optional description */}
      {component.data?.description && (
        <p className="mt-4 text-sm text-gray-600 italic" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {component.data.description}
        </p>
      )}
    </div>
  );
}
