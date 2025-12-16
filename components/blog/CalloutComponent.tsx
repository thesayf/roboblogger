"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IBlogComponent, CalloutVariant } from "@/models/BlogComponent";
import { Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface CalloutComponentProps {
  component: IBlogComponent;
}

const getCalloutStyles = (variant: CalloutVariant) => {
  switch (variant) {
    case "info":
      return {
        container: "bg-gray-50 border border-gray-300",
        icon: <Info className="w-4 h-4 text-gray-600" />,
        text: "text-gray-800",
        title: "text-gray-900",
      };
    case "success":
      return {
        container: "bg-gray-50 border border-gray-300",
        icon: <CheckCircle className="w-4 h-4 text-gray-600" />,
        text: "text-gray-800",
        title: "text-gray-900",
      };
    case "warning":
      return {
        container: "bg-gray-50 border border-gray-300",
        icon: <AlertTriangle className="w-4 h-4 text-gray-600" />,
        text: "text-gray-800",
        title: "text-gray-900",
      };
    case "error":
      return {
        container: "bg-gray-50 border border-gray-300",
        icon: <XCircle className="w-4 h-4 text-gray-600" />,
        text: "text-gray-800",
        title: "text-gray-900",
      };
    default:
      return {
        container: "bg-gray-50 border border-gray-300",
        icon: <Info className="w-4 h-4 text-gray-600" />,
        text: "text-gray-800",
        title: "text-gray-900",
      };
  }
};

export default function CalloutComponent({ component }: CalloutComponentProps) {
  if (!component.content && !component.title) return null;

  const variant = component.variant || "info";
  const styles = getCalloutStyles(variant);

  return (
    <div className={`${styles.container} p-6 my-8`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {styles.icon}
        </div>

        <div className="flex-1">
          {component.title && (
            <h4 className={`${styles.title} font-medium text-lg mb-3`} style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {component.title}
            </h4>
          )}
          {component.content && (
            <div className={`${styles.text} text-base leading-relaxed`} style={{ fontFamily: 'Lora, Georgia, serif' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ul: ({children}) => <ul className="list-disc list-outside ml-5 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-outside ml-5 space-y-1">{children}</ol>,
                  li: ({children}) => <li>{children}</li>,
                  p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({children}) => <strong className="font-bold">{children}</strong>,
                  em: ({children}) => <em className="italic">{children}</em>,
                  code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 text-xs font-mono">{children}</code>,
                }}
              >
                {component.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}