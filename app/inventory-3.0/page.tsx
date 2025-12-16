"use client";

import React from "react";
import { Check } from "lucide-react";

export default function Inventory30() {
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
      {/* Header - exactly like timeline */}
      <div className="text-center py-4 border-b">
        <h1 className="text-gray-700 text-sm font-mono">Rori's Inventory</h1>
      </div>
      <div className="text-right px-4 py-2 text-gray-500 text-xs font-mono">
        {getCurrentDateTime()}
      </div>

      {/* Main content - exactly like timeline with blocks */}
      <div className="max-w-4xl mx-auto p-4">

        {/* Goal Block 1 - styled exactly like timeline blocks */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">GOAL 01</span>
                <span className="text-gray-700 font-mono text-sm">• Make more money</span>
                <span className="text-gray-400 text-xs font-mono ml-2">3/5</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">200m</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Complete freelance website</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Set up payment processing</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Launch SaaS product</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Create passive income streams</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Research market opportunities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Block 2 */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">GOAL 02</span>
                <span className="text-gray-700 font-mono text-sm">• Improve relationships</span>
                <span className="text-gray-400 text-xs font-mono ml-2">1/4</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">90m</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Plan surprise for partner</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Call parents</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Organize family reunion</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Weekly date nights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Block 3 */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">GOAL 03</span>
                <span className="text-gray-700 font-mono text-sm">• Lose 12 lbs</span>
                <span className="text-gray-400 text-xs font-mono ml-2">2/5</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">120m</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Set up home gym</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Create meal prep system</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Morning workout (45min)</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Track calories daily</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Weekly weigh-ins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Block */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">PROJECTS</span>
                <span className="text-gray-700 font-mono text-sm">• Standalone</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">60m</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Clean the garage</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Fix the backend API</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Learn Spanish basics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Events Block */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">EVENTS</span>
                <span className="text-gray-700 font-mono text-sm">• This Week</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">4 items</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Team meeting @ Mon 2pm</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Doctor appointment @ Wed 10am</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Dinner with friends @ Fri 7pm</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Mom's birthday @ Sunday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Routines Block */}
        <div className="mb-4">
          <div className="border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-gray-500 text-xs font-mono mr-3">ROUTINES</span>
                <span className="text-gray-700 font-mono text-sm">• Daily</span>
              </div>
              <span className="text-gray-400 text-xs font-mono">5 active</span>
            </div>

            <div className="pl-8">
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Morning meditation (15min)</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <Check className="w-3 h-3 mr-2 text-green-500" />
                <span className="line-through text-gray-400">Review daily priorities</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Evening journal (10min)</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Read before bed (30min)</span>
              </div>
              <div className="flex items-center text-gray-600 text-xs font-mono py-0.5">
                <span className="inline-block w-3 h-3 mr-2 border border-gray-300 rounded-sm" />
                <span>Weekly review @ Sunday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty block for adding new items */}
        <div className="py-3">
          <div className="py-1">
            <div className="relative">
              <div className="flex items-center">
                <span className="inline-block w-[2px] h-4 bg-gray-800 animate-[blink_1s_ease-in-out_infinite]" />
                <span className="ml-2 text-gray-400 text-xs font-mono">
                  / for menu • g add goal • p add project • e events • r routines
                </span>
              </div>
            </div>
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