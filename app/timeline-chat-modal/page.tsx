"use client";

import React, { useState } from "react";
import Link from "next/link";

const mockBlocks = [
  {
    id: "1",
    time: "10:00",
    duration: 30,
    title: "Deep Work",
    tasks: [
      { id: "t1", title: "figure out a brand name and check for domain", completed: false },
      { id: "t2", title: "create a logo for the brand using chat gpt", completed: false },
    ],
  },
  {
    id: "2",
    time: "11:30",
    duration: 24,
    title: "Deep Work",
    tasks: [],
  },
];

const mockChatHistory = [
  {
    role: "user",
    message: "Add a 30 minute break at 2pm",
  },
  {
    role: "ai",
    message: "I've added a 30-minute break at 2:00 PM to your schedule.",
  },
  {
    role: "user",
    message: "Can you break down the logo task into smaller steps?",
  },
  {
    role: "ai",
    message: "Sure! I can break 'create a logo for the brand using chat gpt' into:\n\n1. Research logo styles and gather inspiration (15m)\n2. Write detailed prompt for ChatGPT (10m)\n3. Generate and review logo options (20m)\n4. Refine selected design (15m)\n\nWould you like me to add these as subtasks?",
  },
];

export default function TimelineChatModal() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [userInput, setUserInput] = useState("");

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-2xl text-gray-900 tracking-tight" style={{ fontFamily: "Lora, Georgia, serif" }}>
                Rori&apos;s Schedule
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

        {/* Timeline content */}
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
        </div>

        {/* Chat Modal - redesigned */}
        {chatOpen && (
            <div className="fixed bottom-6 right-6 w-[520px] bg-white border border-gray-200 shadow-xl rounded-lg flex flex-col max-h-[600px] z-50">
              {/* Header - minimal */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-mono text-gray-900">AI Assistant</span>
                <div className="flex items-center gap-4">
                  {mockChatHistory.length > 0 && (
                    <button className="text-xs font-mono text-gray-400 hover:text-gray-900 transition-colors">
                      Clear
                    </button>
                  )}
                  <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors text-lg leading-none">
                    ×
                  </button>
                </div>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[400px]">
                {mockChatHistory.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-mono text-gray-500">Try:</p>
                    <ul className="ml-4 space-y-2 text-sm text-gray-400" style={{ fontFamily: "Lora, Georgia, serif" }}>
                      <li>• Add deep work block at 2pm</li>
                      <li>• Add task &apos;Review PRs&apos; to current block</li>
                      <li>• Move meeting to 3pm</li>
                      <li>• Add 30min break</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockChatHistory.map((msg, i) => (
                      <div key={i} className={`${msg.role === "user" ? "text-right" : "text-left"}`}>
                        {msg.role === "user" ? (
                          <div className="inline-block max-w-[80%] text-left">
                            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg font-mono text-sm">
                              {msg.message}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 px-1 font-mono">You</div>
                          </div>
                        ) : (
                          <div className="inline-block max-w-[95%]">
                            <div className="bg-gray-50 text-gray-900 px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "Lora, Georgia, serif" }}>
                              {msg.message}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 px-1 font-mono">AI Assistant</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-200">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type a command..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  rows={2}
                  style={{ maxHeight: "120px" }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400 font-mono">↵ to send · Esc to close</span>
                  <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-mono rounded hover:bg-gray-800 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Mockup info */}
        <div className="fixed bottom-4 left-4 bg-white border border-gray-200 px-4 py-3 shadow-lg rounded max-w-xs">
          <p className="text-xs font-mono text-gray-900 mb-2">
            <strong>Redesigned Chat Modal</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Bottom-right popup (520px wide)</li>
            <li>• No background dimming</li>
            <li>• Lora serif for AI responses</li>
            <li>• Mono for user input</li>
            <li>• Clean, minimal header</li>
            <li>• Rounded corners (8px)</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Link href="/timeline-logo-medium" className="text-xs text-blue-600 hover:text-blue-800">
              ← Back to timeline-logo-medium
            </Link>
          </div>
        </div>

        {/* Toggle button when closed */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 px-4 py-2 bg-gray-900 text-white text-sm font-mono rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            Open Chat
          </button>
        )}
      </div>
    </>
  );
}
