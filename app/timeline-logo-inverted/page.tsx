"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Mock data for demonstration
const mockBlocks = [
  {
    id: '1',
    time: '10:00',
    duration: 30,
    title: 'Deep Work',
    type: 'deep',
    tasks: [
      { id: 't1', title: 'figure out a brand name and check for domain', completed: false, duration: 30 },
      { id: 't2', title: 'create a logo for the brand using chat gpt', completed: false, duration: 0 },
    ],
    completed: false,
  },
  {
    id: '2',
    time: '11:30',
    duration: 24,
    title: 'Deep Work',
    type: 'deep',
    tasks: [],
    completed: false,
  },
];

export default function TimelineLogoInverted() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);

  return (
    <>
      {/* Import Lora font from Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo - text-2xl (24px) - BIGGER */}
              <span
                className="text-2xl text-gray-900 tracking-tight"
                style={{ fontFamily: 'Lora, Georgia, serif' }}
              >
                Rori&apos;s Schedule
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span>⌘↑↓ views</span>
                <span>• ⌘←→ days</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm font-mono">
              <span className="text-gray-600">Mon, Oct 13</span>
              <span className="text-gray-600">11:31 AM</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="space-y-6">
            {mockBlocks.map((block, index) => (
              <div
                key={block.id}
                className={`border-l-2 pl-6 pb-8 ${
                  selectedBlockIndex === index
                    ? 'border-gray-900'
                    : 'border-gray-200'
                } cursor-pointer transition-colors`}
                onClick={() => setSelectedBlockIndex(index)}
              >
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-mono">
                  <span className="text-gray-900 font-medium">{block.time}</span>
                  <span>·</span>
                  <span>{block.duration}hr</span>
                </div>

                {/* Block title - text-xl (20px) - SMALLER than header */}
                <h2
                  className="text-xl font-normal text-gray-900 mb-4"
                  style={{ fontFamily: 'Lora, Georgia, serif' }}
                >
                  {block.title}
                </h2>

                {block.tasks.length > 0 && (
                  <div className="space-y-3">
                    {block.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 group">
                        <div className="mt-1 flex-shrink-0">
                          <div className={`w-4 h-4 border rounded ${
                            task.completed
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-400'
                          } transition-colors cursor-pointer`}>
                            {task.completed && (
                              <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-gray-700 leading-relaxed ${task.completed ? 'line-through text-gray-400' : ''}`}
                          style={{ fontFamily: 'Lora, Georgia, serif' }}
                        >
                          {task.title}
                        </p>
                        {task.duration > 0 && (
                          <span className="ml-auto text-xs text-gray-400 font-mono flex-shrink-0">
                            {task.duration}h
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {block.tasks.length === 0 && (
                  <p className="text-gray-400 italic" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                    No tasks scheduled
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Size label */}
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 px-4 py-2 shadow-lg rounded">
          <p className="text-xs font-mono text-gray-900">
            <strong>Inverted Hierarchy</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">Header: 24px / Blocks: 20px</p>
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
            <Link href="/timeline-logo-small" className="block text-xs text-blue-600 hover:text-blue-800">
              Small (20px header)
            </Link>
            <Link href="/timeline-logo-medium" className="block text-xs text-blue-600 hover:text-blue-800">
              Medium (24px header, 24px blocks)
            </Link>
            <Link href="/timeline-logo-large" className="block text-xs text-blue-600 hover:text-blue-800">
              Large (30px header)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
