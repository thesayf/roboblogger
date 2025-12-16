"use client";

import React, { useState } from "react";
import { Brain, Briefcase, Coffee, User, Activity, Layers, Calendar, RefreshCw } from 'lucide-react';

export default function PopupDesigns() {
  const [selectedDesign, setSelectedDesign] = useState<string>("minimal");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
              Popup Design Options
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">
              Compare different popup styles to choose the right direction
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Design selector */}
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => setSelectedDesign("minimal")}
              className={`px-4 py-2 text-sm font-mono border-2 transition-colors ${
                selectedDesign === "minimal"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Minimal (No Icons)
            </button>
            <button
              onClick={() => setSelectedDesign("with-icons-gray")}
              className={`px-4 py-2 text-sm font-mono border-2 transition-colors ${
                selectedDesign === "with-icons-gray"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              With Icons (Gray)
            </button>
            <button
              onClick={() => setSelectedDesign("with-icons-color")}
              className={`px-4 py-2 text-sm font-mono border-2 transition-colors ${
                selectedDesign === "with-icons-color"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              With Icons (Color)
            </button>
            <button
              onClick={() => setSelectedDesign("rounded")}
              className={`px-4 py-2 text-sm font-mono border-2 transition-colors ${
                selectedDesign === "rounded"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              Rounded Style
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Block Type Menu Examples */}
            <div>
              <h2 className="text-lg font-mono text-gray-700 mb-6">Block Type Menu</h2>

              {/* Minimal Design */}
              {selectedDesign === "minimal" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-baseline justify-between border-b border-gray-100"
                  >
                    <span className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Deep Work
                    </span>
                    <span className="text-xs font-mono text-gray-500">90m</span>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex items-baseline justify-between border-b border-gray-100"
                  >
                    <span className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Admin
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-baseline justify-between border-b border-gray-100"
                  >
                    <span className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Break
                    </span>
                    <span className="text-xs font-mono text-gray-500">15m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-baseline justify-between border-b border-gray-100"
                  >
                    <span className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Personal
                    </span>
                    <span className="text-xs font-mono text-gray-500">60m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-baseline justify-between"
                  >
                    <span className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Workout
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • 1-5 Quick • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* With Icons Gray */}
              {selectedDesign === "with-icons-gray" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Brain className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Deep Work
                    </span>
                    <span className="text-xs font-mono text-gray-500">90m</span>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Admin
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Coffee className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Break
                    </span>
                    <span className="text-xs font-mono text-gray-500">15m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Personal
                    </span>
                    <span className="text-xs font-mono text-gray-500">60m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Workout
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • 1-5 Quick • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* With Icons Color */}
              {selectedDesign === "with-icons-color" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Deep Work
                    </span>
                    <span className="text-xs font-mono text-gray-500">90m</span>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Admin
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <Coffee className="h-4 w-4 text-green-600" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Break
                    </span>
                    <span className="text-xs font-mono text-gray-500">15m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3 border-b border-gray-100"
                  >
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Personal
                    </span>
                    <span className="text-xs font-mono text-gray-500">60m</span>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Activity className="h-4 w-4 text-red-600" />
                    <span className="text-base text-gray-900 flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Workout
                    </span>
                    <span className="text-xs font-mono text-gray-500">45m</span>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • 1-5 Quick • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* Rounded Style */}
              {selectedDesign === "rounded" && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-80">
                  <div
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-900 flex-1 font-medium">
                      Deep Work
                    </span>
                    <span className="text-xs text-gray-500">90m</span>
                  </div>
                  <div
                    className="px-4 py-2.5 bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-900 flex-1 font-medium">
                      Admin
                    </span>
                    <span className="text-xs text-gray-500">45m</span>
                  </div>
                  <div
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Coffee className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900 flex-1 font-medium">
                      Break
                    </span>
                    <span className="text-xs text-gray-500">15m</span>
                  </div>
                  <div
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-gray-900 flex-1 font-medium">
                      Personal
                    </span>
                    <span className="text-xs text-gray-500">60m</span>
                  </div>
                  <div
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Activity className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-900 flex-1 font-medium">
                      Workout
                    </span>
                    <span className="text-xs text-gray-500">45m</span>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                    ↑↓ Navigate • Enter Select • 1-5 Quick • ESC Cancel
                  </div>
                </div>
              )}
            </div>

            {/* Slash Command Menu Examples */}
            <div>
              <h2 className="text-lg font-mono text-gray-700 mb-6">Slash Command Menu</h2>

              {/* Minimal Design */}
              {selectedDesign === "minimal" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Block</div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">Add a time block (or use /d930, /m14)</div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Event</div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">Add an event from inventory</div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routine</div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5">Add a routine from inventory</div>
                  </div>

                  <div className="border-t-2 border-gray-200 px-4 py-3">
                    <div className="text-xs font-mono text-gray-400 mb-2">Quick Commands (ESC to close)</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">d930</span> → Deep work at 9:30
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">m14</span> → Meeting at 14:00
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">w630</span> → Workout at 6:30
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* With Icons Gray */}
              {selectedDesign === "with-icons-gray" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <Layers className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Block</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add a time block (or use /d930, /m14)</div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Event</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add an event from inventory</div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routine</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add a routine from inventory</div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 px-4 py-3">
                    <div className="text-xs font-mono text-gray-400 mb-2">Quick Commands (ESC to close)</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">d930</span> → Deep work at 9:30
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">m14</span> → Meeting at 14:00
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">w630</span> → Workout at 6:30
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* With Icons Color */}
              {selectedDesign === "with-icons-color" && (
                <div className="bg-white border-2 border-gray-300 w-80">
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <Layers className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Block</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add a time block (or use /d930, /m14)</div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <Calendar className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Event</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add an event from inventory</div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <RefreshCw className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routine</div>
                      <div className="text-xs font-mono text-gray-500 mt-0.5">Add a routine from inventory</div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 px-4 py-3">
                    <div className="text-xs font-mono text-gray-400 mb-2">Quick Commands (ESC to close)</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">d930</span> → Deep work at 9:30
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">m14</span> → Meeting at 14:00
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">w630</span> → Workout at 6:30
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rounded Style */}
              {selectedDesign === "rounded" && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-80">
                  <div
                    className="px-3 py-2 bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <Layers className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Block</div>
                      <div className="text-xs text-gray-500">Add a time block (or use /d930, /m14)</div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3"
                  >
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Event</div>
                      <div className="text-xs text-gray-500">Add an event from inventory</div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3"
                  >
                    <RefreshCw className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Routine</div>
                      <div className="text-xs text-gray-500">Add a routine from inventory</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 px-3 py-2">
                    <div className="text-xs font-semibold text-gray-400 mb-1">Quick Commands (ESC to close)</div>
                    <div className="space-y-0.5">
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">d930</span> → Deep work at 9:30
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">m14</span> → Meeting at 14:00
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-mono text-gray-600">w630</span> → Workout at 6:30
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Task Input Popup Examples */}
            <div>
              <h2 className="text-lg font-mono text-gray-700 mb-6">Task Input Popup</h2>

              {/* Minimal Design */}
              {selectedDesign === "minimal" && (
                <div className="bg-white border-2 border-gray-300 p-4 w-80">
                  <input
                    type="text"
                    placeholder="Task name..."
                    className="w-full px-0 py-1 text-base border-0 outline-none focus:ring-0 text-gray-900"
                    style={{ fontFamily: "Lora, Georgia, serif" }}
                  />
                  <div className="mt-3 text-xs font-mono text-gray-400">
                    Enter to confirm • ESC to cancel
                  </div>
                </div>
              )}

              {/* With Icons Gray */}
              {selectedDesign === "with-icons-gray" && (
                <div className="bg-white border-2 border-gray-300 p-4 w-80">
                  <input
                    type="text"
                    placeholder="Task name..."
                    className="w-full px-0 py-1 text-base border-0 outline-none focus:ring-0 text-gray-900"
                    style={{ fontFamily: "Lora, Georgia, serif" }}
                  />
                  <div className="mt-3 text-xs font-mono text-gray-400">
                    Enter to confirm • ESC to cancel
                  </div>
                </div>
              )}

              {/* With Icons Color */}
              {selectedDesign === "with-icons-color" && (
                <div className="bg-white border-2 border-gray-300 p-4 w-80">
                  <input
                    type="text"
                    placeholder="Task name..."
                    className="w-full px-0 py-1 text-base border-0 outline-none focus:ring-0 text-gray-900"
                    style={{ fontFamily: "Lora, Georgia, serif" }}
                  />
                  <div className="mt-3 text-xs font-mono text-gray-400">
                    Enter to confirm • ESC to cancel
                  </div>
                </div>
              )}

              {/* Rounded Style */}
              {selectedDesign === "rounded" && (
                <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3 w-80">
                  <input
                    type="text"
                    placeholder="Task name..."
                    className="w-full px-2 py-1 text-sm border-0 outline-none focus:ring-0"
                  />
                  <div className="mt-2 text-xs text-gray-400">
                    Enter to confirm • ESC to cancel
                  </div>
                </div>
              )}
            </div>

            {/* Project Selection Popup Examples */}
            <div>
              <h2 className="text-lg font-mono text-gray-700 mb-6">Project Selection Popup</h2>

              {/* Minimal Design */}
              {selectedDesign === "minimal" && (
                <div className="bg-white border-2 border-gray-300 w-96">
                  <div className="px-4 py-3 border-b-2 border-gray-200">
                    <div className="text-xs font-mono text-gray-500">Select a Project</div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Create Brand Identity
                    </div>
                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      → Launch e-b-todo-app
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Add payments into the app
                    </div>
                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      → Launch e-b-todo-app
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Improve the mobile view design
                    </div>
                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      → Launch e-b-todo-app
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* With Icons Gray */}
              {selectedDesign === "with-icons-gray" && (
                <div className="bg-white border-2 border-gray-300 w-96">
                  <div className="px-4 py-3 border-b-2 border-gray-200">
                    <div className="text-xs font-mono text-gray-500">Select a Project</div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Create Brand Identity
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Add payments into the app
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Improve the mobile view design
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* With Icons Color */}
              {selectedDesign === "with-icons-color" && (
                <div className="bg-white border-2 border-gray-300 w-96">
                  <div className="px-4 py-3 border-b-2 border-gray-200">
                    <div className="text-xs font-mono text-gray-500">Select a Project</div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Create Brand Identity
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 bg-gray-200 cursor-pointer transition-colors flex gap-3 border-b border-gray-100"
                  >
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Add payments into the app
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-base text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Improve the mobile view design
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        → Launch e-b-todo-app
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-200 px-4 py-2">
                    <span className="text-xs font-mono text-gray-400">↑↓ Navigate • Enter Select • ESC Cancel</span>
                  </div>
                </div>
              )}

              {/* Rounded Style */}
              {selectedDesign === "rounded" && (
                <div className="bg-white border border-gray-200 rounded-md shadow-lg w-96">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-600">Select a Project</div>
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">Create Brand Identity</div>
                      <div className="text-xs text-gray-500">2 tasks</div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-2 bg-gray-100 cursor-pointer transition-colors flex gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">Add payments into the app</div>
                      <div className="text-xs text-gray-500">0 tasks</div>
                    </div>
                  </div>
                  <div
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">Improve the mobile view design</div>
                      <div className="text-xs text-gray-500">10 tasks</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
                    ↑↓ Navigate • Enter Select • ESC Cancel
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Design notes */}
          <div className="mt-12 p-6 bg-white border-2 border-gray-300">
            <h3 className="text-base font-mono text-gray-900 mb-4">Design Comparison Notes</h3>

            <div className="space-y-4 text-sm">
              <div>
                <strong className="font-mono text-gray-900">Minimal (No Icons):</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• Clean, text-focused interface</li>
                  <li>• Lora serif for all primary content</li>
                  <li>• Sharp corners (no border-radius)</li>
                  <li>• Strong borders (border-2) for definition</li>
                  <li>• Larger text (text-base = 16px)</li>
                  <li>• Higher contrast hover states (gray-200 for selected)</li>
                </ul>
              </div>

              <div>
                <strong className="font-mono text-gray-900">With Icons (Gray):</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• Same structure as minimal but with gray icons</li>
                  <li>• Icons help with quick visual scanning</li>
                  <li>• Maintains minimal aesthetic with muted colors</li>
                  <li>• Good for semantic categories (Project/Event/Routine)</li>
                </ul>
              </div>

              <div>
                <strong className="font-mono text-gray-900">With Icons (Color):</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• Colorful icons add visual interest</li>
                  <li>• Breaks minimal gray aesthetic</li>
                  <li>• Could feel too playful/consumer-focused</li>
                  <li>• More visual noise</li>
                </ul>
              </div>

              <div>
                <strong className="font-mono text-gray-900">Rounded Style (Current Design):</strong>
                <ul className="mt-2 space-y-1 text-gray-600 ml-4">
                  <li>• Softer, friendlier aesthetic</li>
                  <li>• Smaller text (text-sm = 14px)</li>
                  <li>• Lighter borders and shadows</li>
                  <li>• Doesn't match your sharp, minimal inventory design</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <p className="text-sm font-mono text-gray-700">
                <strong>Recommendation:</strong> Start with "Minimal (No Icons)" for block types, use "With Icons (Gray)" only for semantic selection popups (projects, events, routines).
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
