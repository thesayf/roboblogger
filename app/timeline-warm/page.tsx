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

export default function TimelineWarm() {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdfdf8' }}>
      {/* Header - matching blog navbar typography exactly */}
      <header className="border-b" style={{ borderColor: '#e7e5e4' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo size from blog - text-xl */}
            <span className="text-xl font-mono tracking-tight" style={{ color: '#1a1a1a' }}>
              Rori&apos;s Schedule
            </span>
            <div className="flex items-center gap-3 text-xs font-mono" style={{ color: '#a8a29e' }}>
              <span>⌘↑↓ views</span>
              <span>• ⌘←→ days</span>
            </div>
          </div>
          {/* Nav options size from blog - text-sm */}
          <div className="flex items-center gap-6 text-sm font-mono" style={{ color: '#6b6b6b' }}>
            <span>Mon, Oct 13</span>
            <span>11:31 AM</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Timeline blocks */}
        <div className="space-y-6">
          {mockBlocks.map((block, index) => (
            <div
              key={block.id}
              className="border-l-2 pl-6 pb-8 cursor-pointer transition-all duration-200"
              style={{
                borderColor: selectedBlockIndex === index ? '#7a8f7e' : '#e7e5e4',
                borderRadius: '0 0 0 8px',
              }}
              onClick={() => setSelectedBlockIndex(index)}
            >
              {/* Time and duration - monospace like blog metadata */}
              <div className="flex items-center gap-3 text-xs mb-3 font-mono" style={{ color: '#78716c' }}>
                <span className="font-medium" style={{ color: '#1a1a1a' }}>{block.time}</span>
                <span>·</span>
                <span>{block.duration}hr</span>
              </div>

              {/* Block title - serif like blog titles */}
              <h2
                className="text-2xl font-normal mb-4"
                style={{
                  fontFamily: 'Spectral, Georgia, serif',
                  color: '#1a1a1a'
                }}
              >
                {block.title}
              </h2>

              {/* Tasks - clean list */}
              {block.tasks.length > 0 && (
                <div className="space-y-3">
                  {block.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 group"
                    >
                      {/* Checkbox - slightly rounded */}
                      <div className="mt-1 flex-shrink-0">
                        <div
                          className="w-4 h-4 border transition-all duration-150 cursor-pointer"
                          style={{
                            backgroundColor: task.completed ? '#7a8f7e' : 'transparent',
                            borderColor: task.completed ? '#7a8f7e' : '#d6d3d1',
                            borderRadius: '3px',
                          }}
                          onMouseOver={(e) => {
                            if (!task.completed) {
                              e.currentTarget.style.borderColor = '#7a8f7e';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!task.completed) {
                              e.currentTarget.style.borderColor = '#d6d3d1';
                            }
                          }}
                        >
                          {task.completed && (
                            <svg
                              className="w-3 h-3 text-white mx-auto mt-0.5"
                              fill="none"
                              strokeWidth="2.5"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Task text - serif like blog body text */}
                      <p
                        className="leading-relaxed"
                        style={{
                          fontFamily: 'Spectral, Georgia, serif',
                          color: task.completed ? '#a8a29e' : '#44403c',
                          textDecoration: task.completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </p>

                      {/* Duration badge - monospace */}
                      {task.duration > 0 && (
                        <span className="ml-auto text-xs font-mono flex-shrink-0" style={{ color: '#a8a29e' }}>
                          {task.duration}h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Show placeholder for empty blocks */}
              {block.tasks.length === 0 && (
                <p
                  className="italic"
                  style={{
                    fontFamily: 'Spectral, Georgia, serif',
                    color: '#a8a29e'
                  }}
                >
                  No tasks scheduled
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add block button - minimal with hover state */}
        <div className="mt-8 pt-8" style={{ borderTop: '1px solid #e7e5e4' }}>
          <button
            className="text-sm font-mono transition-colors duration-150"
            style={{ color: '#78716c' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#1a1a1a'}
            onMouseOut={(e) => e.currentTarget.style.color = '#78716c'}
          >
            + Add block
          </button>
        </div>

        {/* Command hint - monospace */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid #e7e5e4' }}>
          <p className="text-xs font-mono text-center" style={{ color: '#a8a29e' }}>
            / for menu · d30 deep · w630 workout · e events · @ switch days
          </p>
        </div>
      </div>

      {/* Comparison note - remove this in production */}
      <div className="fixed bottom-4 right-4 bg-white border p-4 shadow-lg" style={{
        borderColor: '#e7e5e4',
        borderRadius: '8px',
        maxWidth: '320px'
      }}>
        <p className="text-xs font-mono mb-2" style={{ color: '#1a1a1a' }}>
          <strong>Warm Professional Design</strong>
        </p>
        <ul className="text-xs space-y-1" style={{ color: '#6b6b6b' }}>
          <li>• Warm white background (#fdfdf8)</li>
          <li>• Soft sage accent (#7a8f7e)</li>
          <li>• Spectral serif font</li>
          <li>• Subtle rounded corners (3-8px)</li>
          <li>• Warmer grays throughout</li>
        </ul>
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e7e5e4' }}>
          <Link href="/timeline-blog-draft" className="text-xs underline" style={{ color: '#7a8f7e' }}>
            ← Compare to original draft
          </Link>
        </div>
      </div>
    </div>
  );
}
