import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Project {
  _id: string;
  name: string;
  content?: string;
  tasksCount?: number;
}

interface ProjectSelectionPopupProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onCancel: () => void;
}

export default function ProjectSelectionPopup({ projects, onSelect, onCancel }: ProjectSelectionPopupProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the selected item into view
  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    const container = containerRef.current;

    if (selectedElement && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();

      // Check if element is out of view
      if (elementRect.bottom > containerRect.bottom) {
        // Element is below visible area - scroll down
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (elementRect.top < containerRect.top) {
        // Element is above visible area - scroll up
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % projects.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + projects.length) % projects.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (projects[selectedIndex]) {
          onSelect(projects[selectedIndex]);
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onCancel();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Dismiss on any typing
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, projects, onSelect, onCancel]);

  if (projects.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-300 p-4 w-96 z-[100]">
        <div className="text-base text-gray-700" style={{ fontFamily: 'Lora, Georgia, serif' }}>
          No projects found
        </div>
        <div className="mt-3 text-xs font-mono text-gray-400">
          ESC to cancel
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 w-96 z-[100]">
      <div className="px-4 py-3 border-b-2 border-gray-200 bg-white">
        <div className="text-xs font-mono text-gray-500">Select a Project</div>
      </div>

      <div ref={containerRef} className="max-h-64 overflow-y-auto">
        {projects.map((project, index) => (
        <div
          key={project._id}
          ref={el => itemRefs.current[index] = el}
          className={cn(
            "px-4 py-3 cursor-pointer transition-colors flex gap-3 border-b border-gray-100",
            selectedIndex === index ? "bg-gray-200" : "hover:bg-gray-100"
          )}
          onClick={() => onSelect(project)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <div className="flex-1">
            <div className="text-base text-gray-900" style={{ fontFamily: 'Lora, Georgia, serif' }}>
              {project.name || project.content || 'Unnamed Project'}
            </div>
            {project.tasksCount !== undefined && (
              <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                {project.tasksCount} {project.tasksCount === 1 ? 'task' : 'tasks'}
              </div>
            )}
          </div>
        </div>
      ))}
      </div>

      <div className="border-t-2 border-gray-200 px-4 py-2 bg-white">
        <span className="text-xs font-mono text-gray-400">
          ↑↓ Navigate • Enter Select • ESC Cancel
        </span>
      </div>
    </div>
  );
}