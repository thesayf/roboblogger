"use client";

import BlockDesign from '@/app/components/schedule/BlockDesign';

export default function BlockDesignPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Block Design System</h1>
        <p className="text-sm text-gray-600 mb-8">
          Bloomberg terminal inspired design: minimal, functional, keyboard-first
        </p>
        
        <BlockDesign 
          time="09:00"
          endTime="10:30"
          title="Deep Work"
          type="deep-work"
          duration={90}
          tasks={[
            { id: '1', title: 'Review PR comments', duration: 30, completed: false },
            { id: '2', title: 'Implement auth flow', duration: 45, completed: false },
            { id: '3', title: 'Write tests', duration: 15, completed: true },
          ]}
        />
      </div>
    </div>
  );
}