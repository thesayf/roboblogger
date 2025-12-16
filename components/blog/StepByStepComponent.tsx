"use client";

import React from "react";
import { IBlogComponent } from "@/models/BlogComponent";

interface StepByStepComponentProps {
  component: IBlogComponent;
}

export default function StepByStepComponent({ component }: StepByStepComponentProps) {
  const { data } = component;

  if (!data || !data.steps) {
    return null;
  }

  const { steps, title, description } = data;

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
        {steps.map((step: any, index: number) => (
          <div key={index} className="border-l-4 border-gray-300 pl-6">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-gray-500 font-mono text-sm font-medium">
                Step {index + 1}
              </span>
            </div>

            <h4 className="text-xl font-medium text-gray-900 mb-3" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {step.title}
            </h4>

            {step.description && (
              <p className="text-gray-700 text-base leading-relaxed mb-3" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                {step.description}
              </p>
            )}

            {step.substeps && step.substeps.length > 0 && (
              <ul className="list-disc list-outside ml-5 space-y-2 text-base text-gray-700" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                {step.substeps.map((substep: string, subIndex: number) => (
                  <li key={subIndex}>{substep}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
