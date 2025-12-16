"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";
import { Check, X, Minus } from "lucide-react";

interface ComparisonTableComponentProps {
  component: IBlogComponent;
}

export default function ComparisonTableComponent({ component }: ComparisonTableComponentProps) {
  const { data } = component;

  if (!data || !data.columns || !data.rows) {
    return null;
  }

  const { columns, rows, title, description } = data;

  const renderCellContent = (content: any) => {
    if (typeof content === 'boolean') {
      return content ? (
        <Check className="h-4 w-4 text-gray-600 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-gray-400 mx-auto" />
      );
    }

    if (content === null || content === undefined || content === '') {
      return <Minus className="h-4 w-4 text-gray-400 mx-auto" />;
    }

    return <span style={{ fontFamily: 'Lora, Georgia, serif' }}>{content}</span>;
  };

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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {columns.map((col: any, index: number) => (
                <th
                  key={index}
                  className="border border-gray-300 px-4 py-3 bg-gray-100 font-medium text-gray-900 text-center"
                >
                  {col.name || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell: any, cellIndex: number) => (
                  <td
                    key={cellIndex}
                    className="border border-gray-300 px-4 py-3 text-gray-800 text-base text-center"
                    style={{ fontFamily: 'Lora, Georgia, serif' }}
                  >
                    {renderCellContent(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
