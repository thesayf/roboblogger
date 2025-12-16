"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface TableComponentProps {
  component: IBlogComponent;
}

export default function TableComponent({ component }: TableComponentProps) {
  const { headers, rows, tableCaption, tableStyle } = component;

  if (!headers || !rows || headers.length === 0 || rows.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        Table component (no data available)
      </div>
    );
  }

  const getTableStyleClasses = () => {
    return "border-collapse border border-gray-300 bg-white";
  };

  const getHeaderClasses = () => {
    return "border border-gray-300 px-4 py-3 bg-gray-100 font-medium text-gray-900";
  };

  const getCellClasses = () => {
    return "border border-gray-300 px-4 py-3 text-gray-800 text-base";
  };

  return (
    <div className="my-8">
      {tableCaption && (
        <div className="text-sm text-gray-600 mb-2 font-medium">
          {tableCaption}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className={`w-full ${getTableStyleClasses()}`}>
          <thead>
            <tr style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {headers.map((header, index) => (
                <th key={index} className={getHeaderClasses()}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ fontFamily: 'Lora, Georgia, serif' }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={getCellClasses()}>
                    {cell}
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