"use client";

import React from "react";
import { Focus, Zap, BookOpen, Flame, Brain, Target, Lightbulb, Sparkles, Rocket, Award } from 'lucide-react';

export default function DeepWorkIcons() {
  const iconOptions = [
    { name: "Focus (Current)", icon: Focus, description: "Target/crosshair - represents concentration" },
    { name: "Zap", icon: Zap, description: "Lightning bolt - energy and intensity" },
    { name: "BookOpen", icon: BookOpen, description: "Open book - learning and deep thinking" },
    { name: "Flame", icon: Flame, description: "Fire - intensity and passion" },
    { name: "Brain", icon: Brain, description: "Brain - cognitive work (original)" },
    { name: "Target", icon: Target, description: "Bullseye target - focused goal" },
    { name: "Lightbulb", icon: Lightbulb, description: "Light bulb - ideas and thinking" },
    { name: "Sparkles", icon: Sparkles, description: "Sparkles - creativity and brilliance" },
    { name: "Rocket", icon: Rocket, description: "Rocket - productivity and momentum" },
    { name: "Award", icon: Award, description: "Medal - achievement and excellence" }
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <h1 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Deep Work Icon Options
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">
              Choose the icon that best represents focused, deep work
            </p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {iconOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div
                  key={index}
                  className="border-2 border-gray-300 p-6 hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <Icon className="h-8 w-8 text-gray-400" />
                    <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {option.name}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                    {option.description}
                  </p>

                  {/* Show in context */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-mono text-gray-400 mb-2">In menu context:</div>
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50">
                      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Deep Work
                        </div>
                        <div className="text-xs font-mono text-gray-500">90m</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-12 p-6 bg-gray-50 border-2 border-gray-300">
            <h3 className="text-base font-mono text-gray-900 mb-4">Selection Notes</h3>
            <div className="space-y-2 text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
              <p><strong>Best for clarity:</strong> Zap (lightning), Flame (fire), or Target - they're simple and instantly recognizable</p>
              <p><strong>Most literal:</strong> Brain or BookOpen - directly represent thinking/learning</p>
              <p><strong>Most motivational:</strong> Rocket, Award, or Sparkles - suggest achievement and excellence</p>
              <p><strong>Most abstract:</strong> Focus (crosshair) or Target - require understanding the metaphor</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
