"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function InventoryRedesign() {
  const [activeSection, setActiveSection] = useState<"user" | "goals" | "projects" | "routines" | "admin" | "events">("user");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-2xl text-gray-900 tracking-tight" style={{ fontFamily: "Lora, Georgia, serif" }}>
                Rori's Inventory
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span>⌘↑↓ views</span>
                <span>• Tab enter</span>
                <span>• ↑↓ sections</span>
              </div>
            </div>
          </div>
        </header>

        {/* Inventory content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* User Context Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "user" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("user")}
            >
              <div className="mb-4">
                <h2 className="text-2xl text-gray-900 mb-3" style={{ fontFamily: "Lora, Georgia, serif" }}>My Context</h2>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                  Software engineer, who works for himself.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Occupation</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>Software Engineer</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Location</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>Leicester UK</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Email</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>mrrorihinds@gmail.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Work Hours</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Commute Time</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>None (work from home)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Sleep Schedule</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>11:00 PM - 7:00 AM</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Focus Periods</span>
                  <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>Morning (9-12), Afternoon (2-5)</span>
                </div>
              </div>
            </section>

            {/* Goals Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "goals" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("goals")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Goals</h2>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <div className="flex-1 flex items-baseline justify-between">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Launch e-b-todo-app
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <div className="flex-1 flex items-baseline justify-between">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Launch The AI Blog App
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <div className="flex-1 flex items-baseline justify-between">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Get Deploy AI to 20,000 MRR
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <div className="flex-1 flex items-baseline justify-between">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Get to 17 stone
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  <div className="flex-1 flex items-baseline justify-between">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Improve Overall health
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Projects Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "projects" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("projects")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Projects</h2>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Add payments into the app
                      </span>
                      <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                    </div>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "Lora, Georgia, serif" }}>→ Launch e-b-todo-app</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Improve the mobile view design to fit the current desktop view
                      </span>
                    </div>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "Lora, Georgia, serif" }}>→ Launch e-b-todo-app</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Create Brand Identity
                      </span>
                      <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                    </div>
                    <span className="text-xs text-gray-400 mb-3" style={{ fontFamily: "Lora, Georgia, serif" }}>→ Launch e-b-todo-app</span>

                    {/* Project tasks */}
                    <div className="mt-3 space-y-2 pl-4 border-l border-gray-200">
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-3 h-3 border border-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Research competitor brand identities
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-3 h-3 border border-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Define color palette and typography
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-3 h-3 border border-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Create logo concepts
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex-shrink-0">
                          <div className="w-3 h-3 border border-gray-300 rounded"></div>
                        </div>
                        <span className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Design brand guidelines document
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Routines Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "routines" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("routines")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routines</h2>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Morning Exercise
                      </span>
                      <span className="text-xs font-mono text-gray-500">09:00</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 mb-3">Mon, Tue, Wed, Thu, Fri, Sat, Sun</span>

                    {/* Routine tasks */}
                    <div className="mt-3 space-y-1 pl-4">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Warm up stretches
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          30 min cardio
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Strength training
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Review the week
                      </span>
                      <span className="text-xs font-mono text-gray-500">09:00</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 mb-3">Sun</span>

                    {/* Routine tasks */}
                    <div className="mt-3 space-y-1 pl-4">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Review completed tasks
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Plan next week's priorities
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-500" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          Adjust goals if needed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin Tasks Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "admin" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("admin")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Admin Tasks</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      File Q4 taxes
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-600">high</span>
                      <span className="text-xs font-mono text-gray-500">Apr 15</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Update insurance policy
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600">medium</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      Schedule dentist appointment
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-50 text-gray-600">low</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Events Section */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "events" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("events")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Events</h2>
              </div>

              <div className="space-y-2">
                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Team standup
                      </span>
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Oct 14 • 10:00 AM</span>
                  </div>
                </div>

                <div className="flex gap-3 py-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="mb-1">
                      <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        Client presentation
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Oct 15 • 2:00 PM</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Mockup info */}
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 px-4 py-3 shadow-lg rounded max-w-xs">
          <p className="text-xs font-mono text-gray-900 mb-2">
            <strong>Keyboard-First Inventory</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Vertical left-border (like timeline blocks)</li>
            <li>• Active section = darker border</li>
            <li>• Lora serif for content</li>
            <li>• Mono for labels/metadata</li>
            <li>• User context for AI scheduling</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link href="/timeline-logo-medium" className="text-xs text-blue-600 hover:text-blue-800">
              ← Back to timeline
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
