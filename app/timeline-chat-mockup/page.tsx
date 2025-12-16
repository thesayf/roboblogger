"use client";

import React, { useState } from "react";
import Link from "next/link";

const mockBlocks = [
  {
    id: "1",
    time: "10:00",
    duration: 30,
    title: "Deep Work",
    type: "deep",
    tasks: [
      { id: "t1", title: "figure out a brand name and check for domain", completed: false, duration: 30 },
      { id: "t2", title: "create a logo for the brand using chat gpt", completed: false, duration: 0 },
    ],
    completed: false,
  },
  {
    id: "2",
    time: "11:30",
    duration: 24,
    title: "Deep Work",
    type: "deep",
    tasks: [],
    completed: false,
  },
  {
    id: "3",
    time: "14:00",
    duration: 60,
    title: "Personal",
    type: "personal",
    tasks: [
      { id: "t3", title: "Lunch break", completed: false, duration: 60 },
    ],
    completed: false,
  },
];

const mockChatHistory = [
  {
    id: 1,
    role: "user",
    content: "What should I focus on today?",
    timestamp: "11:25 AM",
  },
  {
    id: 2,
    role: "assistant",
    content: "Based on your schedule, you have two Deep Work blocks scheduled. I recommend focusing on your brand work in the first block, as it requires creative thinking and is best done in the morning.",
    timestamp: "11:25 AM",
  },
  {
    id: 3,
    role: "user",
    content: "Can you break down the logo task into smaller steps?",
    timestamp: "11:26 AM",
  },
  {
    id: 4,
    role: "assistant",
    content: "Sure! I can break \"create a logo for the brand using chat gpt\" into:\n\n1. Research logo styles and gather inspiration (15m)\n2. Write detailed prompt for ChatGPT (10m)\n3. Generate and review logo options (20m)\n4. Refine selected design (15m)\n\nWould you like me to add these as subtasks?",
    timestamp: "11:26 AM",
  },
];

export default function TimelineChatMockup() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [userInput, setUserInput] = useState("");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white flex">
        <div className="flex-1 flex flex-col">
          <header className="border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-2xl text-gray-900 tracking-tight" style={{ fontFamily: "Lora, Georgia, serif" }}>
                  Rori&apos;s Schedule
                </span>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                  <span>⌘↑↓ views</span>
                  <span>• ⌘←→ days</span>
                  <span>• ⌘J chat</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm font-mono">
                <span className="text-gray-600">Mon, Oct 13</span>
                <span className="text-gray-600">11:31 AM</span>
                {!chatOpen && (
                  <button onClick={() => setChatOpen(true)} className="text-gray-600 hover:text-gray-900 transition-colors">
                    Chat →
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-8">
              <div className="space-y-6">
                {mockBlocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`border-l-2 pl-6 pb-8 ${selectedBlockIndex === index ? "border-gray-900" : "border-gray-200"} cursor-pointer transition-colors`}
                    onClick={() => setSelectedBlockIndex(index)}
                  >
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-mono">
                      <span className="text-gray-900 font-medium">{block.time}</span>
                      <span>·</span>
                      <span>{block.duration}hr</span>
                    </div>

                    <h2 className="text-2xl font-normal text-gray-900 mb-4" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      {block.title}
                    </h2>

                    {block.tasks.length > 0 && (
                      <div className="space-y-3">
                        {block.tasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 group">
                            <div className="mt-1 flex-shrink-0">
                              <div className={`w-4 h-4 border rounded ${task.completed ? "bg-gray-900 border-gray-900" : "border-gray-300 hover:border-gray-400"} transition-colors cursor-pointer`}>
                                {task.completed && (
                                  <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <p className={`text-gray-700 leading-relaxed ${task.completed ? "line-through text-gray-400" : ""}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                              {task.title}
                            </p>
                            {task.duration > 0 && <span className="ml-auto text-xs text-gray-400 font-mono flex-shrink-0">{task.duration}h</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {block.tasks.length === 0 && (
                      <p className="text-gray-400 italic" style={{ fontFamily: "Lora, Georgia, serif" }}>
                        No tasks scheduled
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <button className="text-sm text-gray-500 hover:text-gray-900 font-mono transition-colors">+ Add block</button>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-xs text-gray-400 font-mono text-center">/ for menu · d30 deep · w630 workout · e events · @ switch days</p>
              </div>
            </div>
          </div>
        </div>

        {chatOpen && (
          <div className="w-96 flex flex-col bg-white border-l border-gray-200">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {mockChatHistory.map((message) => (
                <div key={message.id} className={`${message.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[85%] ${message.role === "user" ? "text-left" : ""}`}>
                    <div className={`px-4 py-2 rounded-lg ${message.role === "user" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: message.role === "assistant" ? "Lora, Georgia, serif" : "Inter, sans-serif" }}>
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1 px-1">{message.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask your assistant..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded resize-none font-mono text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  rows={2}
                  style={{ maxHeight: "120px" }}
                />
                <button className="px-4 py-2 bg-gray-900 text-white text-sm font-mono rounded hover:bg-gray-800 transition-colors">Send</button>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-2">⌘↵ to send · ⌘J to toggle chat</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-4 bg-white border border-gray-200 px-4 py-3 shadow-lg rounded max-w-xs">
        <p className="text-xs font-mono text-gray-900 mb-2">
          <strong>Chat Panel Mockup v3</strong>
        </p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Chat is full-height column (top to bottom)</li>
          <li>• No chat header - messages start from top</li>
          <li>• Timeline has its own header</li>
          <li>• No dimming, timeline stays visible</li>
          <li>• AI responses in Lora serif</li>
          <li>• 384px width</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Link href="/timeline-logo-medium" className="text-xs text-blue-600 hover:text-blue-800">
            ← Back to timeline-logo-medium
          </Link>
        </div>
      </div>
    </>
  );
}
