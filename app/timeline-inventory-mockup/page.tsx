"use client";

import React, { useState } from "react";
import Link from "next/link";

const mockGoals = [
  { id: "1", name: "Launch Daybook v1", deadline: "Dec 31" },
  { id: "2", name: "Build sustainable revenue", deadline: "Q1 2026" },
];

const mockProjects = [
  { id: "1", name: "Brand and design system", goalId: "1", tasks: 3, completed: 1 },
  { id: "2", name: "MVP bug fixes", goalId: "1", tasks: 12, completed: 8 },
];

const mockRoutines = [
  { id: "1", name: "Morning workout", days: ["Mon", "Wed", "Fri"], duration: "1h" },
  { id: "2", name: "Weekly review", days: ["Sun"], duration: "30m" },
];

const mockAdminTasks = [
  { id: "1", name: "File Q4 taxes", priority: "high", dueDate: "Apr 15" },
  { id: "2", name: "Update insurance policy", priority: "medium" },
  { id: "3", name: "Schedule dentist appointment", priority: "low" },
];

const mockEvents = [
  { id: "1", name: "Team standup", date: "Oct 14", time: "10:00 AM" },
  { id: "2", name: "Client presentation", date: "Oct 15", time: "2:00 PM" },
];

export default function TimelineInventoryMockup() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-2xl text-gray-900 tracking-tight" style={{ fontFamily: "Lora, Georgia, serif" }}>
                Rori&apos;s Inventory
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span>⌘↑↓ views</span>
                <span>• ⌘←→ days</span>
                <span>• / chat</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-mono">
              <span className="text-gray-600">Mon, Oct 13</span>
              <span className="text-gray-600">11:31 AM</span>
            </div>
          </div>
        </header>

        {/* Inventory content */}
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
          {/* Goals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mono text-gray-900">Goals</h2>
              <button className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors">+ Add</button>
            </div>
            <div className="space-y-2">
              {mockGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`border-l-2 pl-4 py-2 cursor-pointer transition-colors ${
                    selectedGoalId === goal.id ? "border-gray-900" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      {goal.name}
                    </h3>
                    <span className="text-xs font-mono text-gray-500">{goal.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mono text-gray-900">Projects</h2>
              <button className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors">+ Add</button>
            </div>
            <div className="space-y-3">
              {mockProjects
                .filter((p) => !selectedGoalId || p.goalId === selectedGoalId)
                .map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        {project.name}
                      </h3>
                      <span className="text-xs font-mono text-gray-400">
                        {project.completed}/{project.tasks}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">
                        Goal: {mockGoals.find((g) => g.id === project.goalId)?.name}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Routines */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mono text-gray-900">Routines</h2>
              <button className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors">+ Add</button>
            </div>
            <div className="space-y-3">
              {mockRoutines.map((routine) => (
                <div key={routine.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base mb-2" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                        {routine.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span>{routine.days.join(", ")}</span>
                        <span>•</span>
                        <span>{routine.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Admin Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mono text-gray-900">Admin Tasks</h2>
              <button className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors">+ Add</button>
            </div>
            <div className="space-y-2">
              {mockAdminTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 py-2">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-4 h-4 border border-gray-300 rounded hover:border-gray-400 transition-colors cursor-pointer"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-gray-500">
                      <span className={`px-1.5 py-0.5 rounded ${task.priority === "high" ? "bg-red-50 text-red-600" : task.priority === "medium" ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-600"}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && <span>{task.dueDate}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-mono text-gray-900">Events</h2>
              <button className="text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors">+ Add</button>
            </div>
            <div className="space-y-3">
              {mockEvents.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <h3 className="text-base mb-2" style={{ fontFamily: "Lora, Georgia, serif", color: "#171717" }}>
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span>{event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Mockup info */}
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 px-4 py-3 shadow-lg rounded max-w-xs">
          <p className="text-xs font-mono text-gray-900 mb-2">
            <strong>Inventory View Mockup</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Lora serif for all item names</li>
            <li>• Mono for labels, metadata</li>
            <li>• Goals filter projects</li>
            <li>• Clean cards for projects/routines/events</li>
            <li>• Simple list for admin tasks</li>
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
