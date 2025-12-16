"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";
import { ArrowRight } from "lucide-react";

interface ProsConsComponentProps {
  component: IBlogComponent;
}

export default function ProsConsComponent({ component }: ProsConsComponentProps) {
  const { data } = component;

  if (!data) {
    return null;
  }

  const { title, description } = data;

  let prosData = [];
  let consData = [];
  let prosTitle = "Advantages";
  let consTitle = "Disadvantages";

  // Check if data is in a comparison array format (which it is based on logs)
  if (data.comparison && Array.isArray(data.comparison) && data.comparison.length > 0) {
    // The comparison array has TWO items: one for advantages, one for disadvantages
    // First item has pros array filled, second item has cons array filled
    data.comparison.forEach((item: any) => {
      if (item.pros && item.pros.length > 0) {
        prosData = item.pros;
        prosTitle = item.name || "Advantages";
      }
      if (item.cons && item.cons.length > 0) {
        consData = item.cons;
        consTitle = item.name || "Disadvantages";
      }
    });
  } else {
    // Fallback to direct pros/cons if not in comparison format
    prosData = data.pros || [];
    consData = data.cons || [];
  }

  // If still no data, return null
  if (prosData.length === 0 && consData.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      {title && (
        <h2 className="text-2xl font-normal text-gray-900 mb-4 text-center" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {title}
        </h2>
      )}
      {description && (
        <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {description}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Advantages */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-medium text-gray-900 mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            {prosTitle}
          </h3>
          {prosData.length > 0 ? (
            <div className="space-y-3">
              {prosData.map((pro: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                    {pro}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">None listed</p>
          )}
        </div>

        {/* Disadvantages */}
        <div className="border border-gray-300 p-6">
          <h3 className="text-xl font-medium text-gray-900 mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
            {consTitle}
          </h3>
          {consData.length > 0 ? (
            <div className="space-y-3">
              {consData.map((con: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-800 text-base leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                    {con}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">None listed</p>
          )}
        </div>
      </div>
    </div>
  );
}
