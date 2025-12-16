"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function InventoryFontTest() {
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
                <h2 className="text-lg text-gray-900 mb-3" style={{ fontFamily: "Lora, Georgia, serif" }}>My Context</h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Lora, Georgia, serif" }}>
                  Software engineer, who works for himself.
                </p>
              </div>

              <div className="space-y-3 text-sm font-mono">
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Occupation</span>
                  <span className="text-gray-900">Software Engineer</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Location</span>
                  <span className="text-gray-900">Leicester UK</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Email</span>
                  <span className="text-gray-900">mrrorihinds@gmail.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Work Hours</span>
                  <span className="text-gray-900">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Commute Time</span>
                  <span className="text-gray-900">None (work from home)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Sleep Schedule</span>
                  <span className="text-gray-900">11:00 PM - 7:00 AM</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 w-32">Focus Periods</span>
                  <span className="text-gray-900">Morning (9-12), Afternoon (2-5)</span>
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
                <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Goals</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">GOAL 01</span>
                  <div className="flex-1 flex items-start justify-between">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      Launch e-b-todo-app
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">GOAL 02</span>
                  <div className="flex-1 flex items-start justify-between">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      Launch The AI Blog App
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">GOAL 03</span>
                  <div className="flex-1 flex items-start justify-between">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      Get Deploy AI to 20,000 MRR
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">GOAL 04</span>
                  <div className="flex-1 flex items-start justify-between">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      Get to 17 stone
                    </span>
                    <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">GOAL 05</span>
                  <div className="flex-1 flex items-start justify-between">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
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
                <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Projects</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-20">PROJECT 01</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Add payments into the app
                      </span>
                      <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">→ Launch e-b-todo-app</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-20">PROJECT 02</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Improve the mobile view design to fit the current desktop view
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">→ Launch e-b-todo-app</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-20">PROJECT 03</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Create Brand Identity
                      </span>
                      <span className="text-xs font-mono text-gray-500">11/26/2025</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">→ Launch e-b-todo-app</span>
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
                <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routines</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-20">ROUTINE 01</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Morning Exercise
                      </span>
                      <span className="text-xs font-mono text-gray-500">09:00</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Mon, Tue, Wed, Thu, Fri, Sat, Sun</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-20">ROUTINE 02</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Review the week
                      </span>
                      <span className="text-xs font-mono text-gray-500">09:00</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Sun</span>
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
                <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Admin Tasks</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="w-4 h-4 border border-gray-300 rounded hover:border-gray-400 transition-colors cursor-pointer"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      File Q4 taxes
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-600">high</span>
                      <span className="text-xs font-mono text-gray-500">Apr 15</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="w-4 h-4 border border-gray-300 rounded hover:border-gray-400 transition-colors cursor-pointer"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      Update insurance policy
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600">medium</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="w-4 h-4 border border-gray-300 rounded hover:border-gray-400 transition-colors cursor-pointer"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
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
                <h2 className="text-lg text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Events</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">EVENT 01</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        Team standup
                      </span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Oct 14 • 10:00 AM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 w-16">EVENT 02</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
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
            <strong>Font Test Version</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Section headers in Lora serif</li>
            <li>• Item labels still mono (GOAL 01)</li>
            <li>• Matches timeline block pattern</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link href="/inventory-redesign" className="text-xs text-blue-600 hover:text-blue-800">
              ← Back to mono version
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
