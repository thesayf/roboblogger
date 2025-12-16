"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface PieChartComponentProps {
  component: IBlogComponent;
}

export default function PieChartComponent({ component }: PieChartComponentProps) {
  if (!component.data?.data || !Array.isArray(component.data.data)) {
    return null;
  }

  const { title, data } = component.data;
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <div className="my-12">
      {title && (
        <h3 className="text-2xl text-gray-900 mb-8" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          {title}
        </h3>
      )}

      {/* Simple text-based representation */}
      <div className="space-y-4">
        {data.map((item: any, index: number) => {
          const percentage = ((item.value / total) * 100).toFixed(1);

          return (
            <div key={index}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-mono text-gray-600">{item.label}</span>
                <span className="text-sm font-mono text-gray-900">{percentage}%</span>
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

      {/* Total */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-mono text-gray-600">Total</span>
          <span className="text-sm font-mono text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}
