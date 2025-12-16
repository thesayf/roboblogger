"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

export default function Component() {
  const [thoughts, setThoughts] = useState([""]);
  const [selectedDate, setSelectedDate] = React.useState("today");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { setPromptText, setSelectedDay, setPreviewSchedule } = useAppContext();
  const router = useRouter();
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const newThoughts = [...thoughts];
      newThoughts.splice(index + 1, 0, "");
      setThoughts(newThoughts);
      setTimeout(() => {
        if (inputRefs.current[index + 1]) {
          inputRefs.current[index + 1]?.focus();
        }
      }, 0);
    } else if (
      e.key === "Backspace" &&
      thoughts[index] === "" &&
      thoughts.length > 1
    ) {
      e.preventDefault();
      const newThoughts = thoughts.filter((_, i) => i !== index);
      setThoughts(newThoughts);
      setTimeout(() => {
        const prevInput = inputRefs.current[Math.max(0, index - 1)];
        if (prevInput) {
          prevInput.focus();
        }
      }, 0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const newThoughts = [...thoughts];
    newThoughts[index] = e.target.value;
    setThoughts(newThoughts);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const handleGenerateSchedule = () => {
    const cleanThoughts = thoughts
      .filter((thought) => thought.trim() !== "")
      .join("\n");

    setPreviewSchedule(null);
    setPromptText(cleanThoughts);

    const todayString = today.toDateString();
    const selectedDateObj = selectedDate === "today" ? today : tomorrow;
    const selectedDateString = selectedDateObj.toDateString();

    localStorage.setItem(
      "scheduleDayType",
      selectedDateString === todayString ? "today" : "tomorrow"
    );

    router.push("/app");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-sm">
        <div className="max-w-[900px] mx-auto px-8 py-6 flex items-center justify-between">
          <h1 className="text-sm font-light tracking-[0.3em] text-gray-900">
            SCHEDULEGENIUS
          </h1>

          <nav className="flex items-center gap-8">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Menu
            </button>
          </nav>
        </div>
      </header>

      {/* Side menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform z-40 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-8">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="mb-8 text-gray-500 hover:text-gray-900"
          >
            ✕
          </button>

          <nav className="space-y-6">
            <a href="/" className="block text-gray-700 hover:text-gray-900">Home</a>
            <a href="/blog" className="block text-gray-700 hover:text-gray-900">Blog</a>
            <div className="pt-6 space-y-4 border-t">
              <SignUpButton mode="modal">
                <button className="block w-full text-left text-gray-700 hover:text-gray-900">
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="block w-full text-left text-gray-700 hover:text-gray-900">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content - Paper area */}
      <main className="flex-1 flex items-center justify-center px-8 pt-24 pb-12">
        <div className="w-full max-w-[700px]">
          {/* Date selector - minimal */}
          <div className="mb-12 flex gap-8">
            <button
              onClick={() => setSelectedDate("today")}
              className={`text-sm tracking-wide transition-all ${
                selectedDate === "today"
                  ? "text-gray-900 border-b border-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate("tomorrow")}
              className={`text-sm tracking-wide transition-all ${
                selectedDate === "tomorrow"
                  ? "text-gray-900 border-b border-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Paper writing area */}
          <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-12">
            <div className="space-y-4">
              {thoughts.map((thought, index) => (
                <div key={index} className="relative">
                  <span className="absolute left-0 top-[6px] text-gray-300 select-none">
                    {(index + 1).toString().padStart(2, '0')}.
                  </span>
                  <textarea
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    value={thought}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    placeholder={
                      index === 0
                        ? `What would you like to accomplish ${selectedDate}?`
                        : "Continue..."
                    }
                    className="w-full pl-8 text-gray-800 placeholder:text-gray-300 focus:outline-none resize-none leading-relaxed font-light"
                    rows={1}
                    style={{
                      minHeight: '24px',
                      fontFamily: 'Georgia, serif',
                      fontSize: '16px',
                      lineHeight: '28px'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Generate button - minimal */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <button
                onClick={handleGenerateSchedule}
                disabled={!thoughts.some(t => t.trim())}
                className="text-sm tracking-wide text-gray-900 hover:text-gray-600 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Generate Schedule →
              </button>
            </div>
          </div>

          {/* Quick templates - minimal text links */}
          <div className="mt-8 flex gap-6 justify-center">
            <button
              onClick={() => setThoughts([
                "Deep focus work in the morning",
                "Important meetings to schedule",
                "Exercise and wellness time",
                "Evening for learning"
              ])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Balanced Day
            </button>
            <button
              onClick={() => setThoughts([
                "Study sessions with Pomodoro technique",
                "Review and practice problems",
                "Breaks for movement",
                "Evening summary"
              ])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Study Day
            </button>
            <button
              onClick={() => setThoughts([
                "Morning deep work block",
                "Admin tasks and emails",
                "Afternoon meetings",
                "End of day review"
              ])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Work Day
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}