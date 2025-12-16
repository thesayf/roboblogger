"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface BarChartComponentProps {
  component: IBlogComponent;
}

export default function BarChartComponent({ component }: BarChartComponentProps) {
  if (!component.data?.data || !Array.isArray(component.data.data)) {
    return null;
  }

  const { title, xAxisLabel, yAxisLabel, data } = component.data;
  const maxValue = Math.max(...data.map((item: any) => item.value));

  return (
    <div className="my-12">
      {title && (
        <h3 className="text-2xl text-gray-900 mb-8" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {title}
        </h3>
      )}

      <div className="space-y-4">
        {data.map((item: any, index: number) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div key={index}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-mono text-gray-600">{item.label}</span>
                <span className="text-sm font-mono text-gray-900">{item.value}</span>
              </div>
              <div className="w-full h-8 bg-gray-100">
                <div
                  className="h-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
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
