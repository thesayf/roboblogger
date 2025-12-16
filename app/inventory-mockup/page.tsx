"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function InventoryMockup() {
  const [cursorPosition, setCursorPosition] = useState<string>('goal-0');
  const [isTyping, setIsTyping] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<number>(0);

  // Sample data with hierarchy - Goals at top, everything else assigned to goals
  const goals = [
    {
      id: 'goal-0',
      text: "Make more money",
      completed: false,
      projects: [
        { text: "Complete freelance website", completed: false },
        { text: "Launch SaaS product", completed: false }
      ],
      events: [
        { text: "Client meeting @ 2pm", completed: false },
        { text: "Investor pitch Thursday", completed: false }
      ],
      routines: [
        { text: "Daily cold outreach (30min)", completed: false },
        { text: "Weekly revenue review", completed: false }
      ]
    },
    {
      id: 'goal-1',
      text: "Improve personal relationships",
      completed: false,
      projects: [
        { text: "Plan surprise for partner", completed: true },
        { text: "Organize family reunion", completed: false }
      ],
      events: [
        { text: "Dinner with friends Friday", completed: false },
        { text: "Mom's birthday next week", completed: false }
      ],
      routines: [
        { text: "Weekly date night", completed: false },
        { text: "Call parents Sunday", completed: true }
      ]
    },
    {
      id: 'goal-2',
      text: "Lose 12 lbs",
      completed: false,
      projects: [
        { text: "Set up home gym", completed: false },
        { text: "Meal prep system", completed: false }
      ],
      events: [
        { text: "Doctor checkup Monday", completed: false },
        { text: "5K run next month", completed: false }
      ],
      routines: [
        { text: "Morning workout (45min)", completed: false },
        { text: "Track calories daily", completed: false }
      ]
    }
  ];

  // Navigation positions
  const navigationOrder = [
    'goal-0', 'goal-0-projects', 'goal-0-events', 'goal-0-routines',
    'goal-1', 'goal-1-projects', 'goal-1-events', 'goal-1-routines',
    'goal-2', 'goal-2-projects', 'goal-2-events', 'goal-2-routines'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Handle arrow key navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = navigationOrder.indexOf(cursorPosition);
        if (currentIndex < navigationOrder.length - 1) {
          setCursorPosition(navigationOrder[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = navigationOrder.indexOf(cursorPosition);
        if (currentIndex > 0) {
          setCursorPosition(navigationOrder[currentIndex - 1]);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab enters/expands the section
        if (cursorPosition.startsWith('goal-') && !cursorPosition.includes('-')) {
          const goalIndex = parseInt(cursorPosition.split('-')[1]);
          setSelectedGoal(goalIndex);
          setCursorPosition(`goal-${goalIndex}-projects`);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isTyping) {
          setIsTyping(false);
          setCommandInput('');
        } else if (cursorPosition.includes('-projects') || cursorPosition.includes('-events') || cursorPosition.includes('-routines')) {
          // Exit from subsection to goal
          const goalId = cursorPosition.split('-').slice(0, 2).join('-');
          setCursorPosition(goalId);
        }
      } else if (e.key === '/') {
        e.preventDefault();
        setIsTyping(true);
        setCommandInput('/');
      } else if (e.key === 'Backspace' && isTyping) {
        e.preventDefault();
        setCommandInput(prev => prev.slice(0, -1));
        if (commandInput.length <= 1) {
          setIsTyping(false);
        }
      } else if (isTyping && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCommandInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorPosition, isTyping, commandInput]);

  // Get current date/time
  const getCurrentDateTime = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${day}, ${month} ${date} ${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - matches timeline */}
      <div className="text-center py-4">
        <h1 className="text-gray-700 text-sm font-mono">Rori's Inventory</h1>
      </div>
      <div className="text-right px-8 text-gray-500 text-xs font-mono">
        {getCurrentDateTime()}
      </div>

      {/* Main content - no boxes, just like timeline */}
      <div className="max-w-4xl mx-auto px-8 py-4">
        {goals.map((goal, goalIndex) => (
          <div key={goal.id} className="mb-8">
            {/* Goal - Top level hierarchy */}
            <div className={`flex items-start mb-3 ${
              cursorPosition === goal.id ? 'bg-blue-50' : ''
            }`}>
              <span className="text-gray-400 text-xs font-mono mr-4 mt-0.5">
                GOAL {(goalIndex + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1">
                <div className="flex items-center">
                  {cursorPosition === goal.id && !isTyping && (
                    <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] mr-2" />
                  )}
                  <span className={`font-mono text-sm ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {goal.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Show subsections if this goal is selected or we're in its subsections */}
            {(selectedGoal === goalIndex || cursorPosition.startsWith(goal.id)) && (
              <div className="ml-16">
                {/* Projects */}
                <div className={`mb-3 ${
                  cursorPosition === `${goal.id}-projects` ? 'bg-blue-50' : ''
                }`}>
                  <div className="flex items-center mb-1">
                    {cursorPosition === `${goal.id}-projects` && !isTyping && (
                      <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] mr-2" />
                    )}
                    <span className="text-gray-600 text-xs font-mono">Projects</span>
                    <span className="text-gray-400 text-xs font-mono ml-2">({goal.projects.length})</span>
                  </div>
                  <div className="ml-4">
                    {goal.projects.map((project, idx) => (
                      <div key={idx} className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                        <Check className={`w-3 h-3 mr-2 ${project.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={project.completed ? 'line-through text-gray-400' : ''}>
                          {project.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events */}
                <div className={`mb-3 ${
                  cursorPosition === `${goal.id}-events` ? 'bg-blue-50' : ''
                }`}>
                  <div className="flex items-center mb-1">
                    {cursorPosition === `${goal.id}-events` && !isTyping && (
                      <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] mr-2" />
                    )}
                    <span className="text-gray-600 text-xs font-mono">Events</span>
                    <span className="text-gray-400 text-xs font-mono ml-2">({goal.events.length})</span>
                  </div>
                  <div className="ml-4">
                    {goal.events.map((event, idx) => (
                      <div key={idx} className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                        <Check className={`w-3 h-3 mr-2 ${event.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={event.completed ? 'line-through text-gray-400' : ''}>
                          {event.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routines */}
                <div className={`mb-3 ${
                  cursorPosition === `${goal.id}-routines` ? 'bg-blue-50' : ''
                }`}>
                  <div className="flex items-center mb-1">
                    {cursorPosition === `${goal.id}-routines` && !isTyping && (
                      <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] mr-2" />
                    )}
                    <span className="text-gray-600 text-xs font-mono">Routines</span>
                    <span className="text-gray-400 text-xs font-mono ml-2">({goal.routines.length})</span>
                  </div>
                  <div className="ml-4">
                    {goal.routines.map((routine, idx) => (
                      <div key={idx} className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                        <Check className={`w-3 h-3 mr-2 ${routine.completed ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={routine.completed ? 'line-through text-gray-400' : ''}>
                          {routine.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Command line at bottom - matches timeline */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-8 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center text-xs font-mono text-gray-400">
            {isTyping ? (
              <>
                <span className="text-gray-800">{commandInput}</span>
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] ml-0.5" />
              </>
            ) : (
              <>
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite] mr-2" />
                <span>/ for menu • Tab to expand • Escape to collapse • Arrow keys to navigate</span>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}