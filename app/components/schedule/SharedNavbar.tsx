"use client";

import React from 'react';

interface SharedNavbarProps {
  title?: string;
  user?: any;
  currentDay?: 'today' | 'tomorrow';
  currentTime?: Date;
  viewMode?: 'schedule' | 'you';
}

export default function SharedNavbar({
  title,
  user,
  currentDay = 'today',
  currentTime = new Date(),
  viewMode = 'schedule'
}: SharedNavbarProps) {
  // Use the same title for both views to prevent movement
  const displayTitle = title || (user?.firstName ? `${user.firstName}'s Schedule` : 'Schedule');

  // Calculate display date
  const displayDate = currentDay === 'today'
    ? new Date()
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span
            className="text-2xl text-gray-900 tracking-tight font-lora"
          >
            {displayTitle}
          </span>
          <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
            <span>⌘↑↓ views</span>
            {viewMode === 'schedule' && (
              <>
                <span>• ⌘←→ days</span>
                <span>• / chat</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono">
          <span className="text-gray-600">
            {displayDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          <span className="text-gray-600">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </header>
  );
}