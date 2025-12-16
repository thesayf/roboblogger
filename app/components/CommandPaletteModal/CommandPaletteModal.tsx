"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'logout',
      label: 'Logout',
      shortcut: 'l',
      action: () => {
        signOut(() => router.push('/'));
      },
    },
    // Add more commands here as needed
  ];

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        commands[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, commands, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full max-w-xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Command list */}
          <div className="bg-[#1e1e2e] rounded-lg shadow-2xl overflow-hidden font-mono">
            <div className="p-4 space-y-1">
              {commands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left rounded transition-colors ${
                    selectedIndex === index
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  <span>{command.label}</span>
                  {command.shortcut && (
                    <span className="text-xs text-gray-500">{command.shortcut}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Footer hints */}
            <div className="border-t border-gray-700 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
              <span>↑↓ or j/k to navigate</span>
              <span>↵ to select • esc to close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
