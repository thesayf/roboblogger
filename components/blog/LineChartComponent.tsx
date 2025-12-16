"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface LineChartComponentProps {
  component: IBlogComponent;
}

export default function LineChartComponent({ component }: LineChartComponentProps) {
  if (!component.data?.data || !Array.isArray(component.data.data)) {
    return null;
  }

  const { title, xAxisLabel, yAxisLabel, data } = component.data;
  const maxValue = Math.max(...data.map((item: any) => item.value));
  const minValue = Math.min(...data.map((item: any) => item.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="my-12">
      {title && (
        <h3 className="text-2xl text-gray-900 mb-8" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {title}
        </h3>
      )}

      <div className="relative">
        {/* Chart area */}
        <div className="relative h-64 border-l-2 border-b-2 border-gray-300">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 -ml-12 flex flex-col justify-between text-xs font-mono text-gray-500">
            <span>{maxValue}</span>
            <span>{Math.round((maxValue + minValue) / 2)}</span>
            <span>{minValue}</span>
          </div>

          {/* Line chart using text representation */}
          <div className="relative h-full px-4">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#111827"
                strokeWidth="2"
                points={data
                  .map((item: any, index: number) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - ((item.value - minValue) / range) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(" ")}
              />
              {/* Data points */}
              {data.map((item: any, index: number) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((item.value - minValue) / range) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#111827"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
          {data.map((item: any, index: number) => (
            <span key={index}>{item.label}</span>
          ))}
        </div>
      </div>

      {(xAxisLabel || yAxisLabel) && (
        <div className="mt-6 flex items-center justify-between text-xs font-mono text-gray-500">
          {xAxisLabel && <span>{xAxisLabel}</span>}
          {yAxisLabel && <span>{yAxisLabel}</span>}
        </div>
      )}
    </div>
  );
}
