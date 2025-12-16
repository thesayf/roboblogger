"use client";

import React, { useState } from "react";

// Type definitions (copied from original)
interface Goal {
  id: string;
  name: string;
  isExpanded: boolean;
  deadline?: string;
}

interface Task {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  content?: string;
  duration: number;
  dueDate?: string;
  completed?: boolean;
  order?: number;
}

interface Project {
  id: string;
  name: string;
  content?: string;
  isExpanded: boolean;
  deadline?: string;
  goalId?: string;
  tasks?: Task[];
  metadata?: {
    goalId?: string;
    dueDate?: string;
    [key: string]: any;
  };
}

interface Item {
  id: string;
  name?: string;
  content?: string;
  completed?: boolean;
  time?: string;
  frequency?: string;
  priority?: string;
  dueDate?: string;
  date?: string;
  location?: string;
  tasks?: Task[];
  metadata?: {
    startTime?: string;
    duration?: number;
    days?: string[];
    [key: string]: any;
  };
}

interface InventoryViewProps {
  currentTime: Date;
  user: any;
  commandInput: string;
  isTypingCommand: boolean;
  showSlashMenu: boolean;
  onSlashMenuSelect: (item: any) => void;
  onSlashMenuCancel: () => void;
  userData?: any;
  routinesData?: Item[];
  eventsData?: Item[];
  projectsData?: Item[];
  adminTasksData?: Item[];
  setProjectsData?: (projects: Item[]) => void;
  onTaskUpdate?: () => void;
}

export default function InventoryViewRedesigned({
  currentTime,
  user,
  commandInput,
  isTypingCommand,
  showSlashMenu,
  onSlashMenuSelect,
  onSlashMenuCancel,
  userData,
  routinesData,
  eventsData,
  projectsData,
  adminTasksData,
  setProjectsData,
  onTaskUpdate,
}: InventoryViewProps) {
  const [activeSection, setActiveSection] = useState<"user" | "goals" | "projects" | "routines" | "admin" | "events">("user");

  // Placeholder state - we'll port the real state management later
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Item[]>(projectsData || []);
  const [routines, setRoutines] = useState<Item[]>(routinesData || []);
  const [adminTasks, setAdminTasks] = useState<Item[]>(adminTasksData || []);
  const [events, setEvents] = useState<Item[]>(eventsData || []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="w-full px-6 py-8">
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
                  {userData?.bio || "Software engineer, who works for himself."}
                </p>
              </div>

              <div className="space-y-3">
                {userData?.occupation && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Occupation</span>
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>{userData.occupation}</span>
                  </div>
                )}
                {userData?.location && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Location</span>
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>{userData.location}</span>
                  </div>
                )}
                {userData?.email && (
                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 w-32 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Email</span>
                    <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>{userData.email}</span>
                  </div>
                )}
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
                {goals.length === 0 ? (
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>No goals yet</p>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="flex gap-3 py-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                      <div className="flex-1 flex items-baseline justify-between">
                        <span className="text-gray-700 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
                          {goal.name}
                        </span>
                        {goal.deadline && <span className="text-xs font-mono text-gray-500">{goal.deadline}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Projects Section - Placeholder */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "projects" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("projects")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Projects</h2>
              </div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Projects coming soon...</p>
            </section>

            {/* Routines Section - Placeholder */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "routines" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("routines")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Routines</h2>
              </div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Routines coming soon...</p>
            </section>

            {/* Admin Tasks Section - Placeholder */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "admin" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("admin")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Admin Tasks</h2>
              </div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Admin tasks coming soon...</p>
            </section>

            {/* Events Section - Placeholder */}
            <section
              className={`border-l-2 pl-6 pb-6 cursor-pointer transition-colors ${
                activeSection === "events" ? "border-gray-900" : "border-gray-200"
              }`}
              onClick={() => setActiveSection("events")}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>Events</h2>
              </div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "Lora, Georgia, serif" }}>Events coming soon...</p>
            </section>
          </div>
      </div>
    </>
  );
}
