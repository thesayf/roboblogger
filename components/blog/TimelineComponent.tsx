"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface TimelineComponentProps {
  component: IBlogComponent;
}

export default function TimelineComponent({ component }: TimelineComponentProps) {
  const { data } = component;

  if (!data || !data.events) {
    return null;
  }

  const { events, title, description } = data;

  return (
    <div className="my-12">
      {title && (
        <h2 className="text-2xl font-normal text-gray-900 mb-4" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {title}
        </h2>
      )}
      {description && (
        <p className="text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {description}
        </p>
      )}

      <div className="space-y-6">
        {events.map((event: any, index: number) => (
          <div key={index} className="border-l-4 border-gray-300 pl-6">
            {event.date && (
              <span className="text-gray-500 font-mono text-sm font-medium block mb-2">
                {event.date}
              </span>
            )}

            <h4 className="text-xl font-medium text-gray-900 mb-2" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {event.title}
            </h4>

            {event.description && (
              <p className="text-gray-700 text-base leading-relaxed" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                {event.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
