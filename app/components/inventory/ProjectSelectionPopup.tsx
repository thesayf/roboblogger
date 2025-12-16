import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FolderKanban, X } from 'lucide-react';

interface Project {
  id: string;
  name?: string;
  content?: string;
}

interface ProjectSelectionPopupProps {
  projects: Project[];
  onSelect: (projectId: string | null) => void;
  onCancel: () => void;
  initialProjectId?: string | null;
  selectedTaskCount?: number; // For showing "Move X tasks to..."
}

export default function ProjectSelectionPopup({
  projects,
  onSelect,
  onCancel,
  initialProjectId = null,
  selectedTaskCount = 1
}: ProjectSelectionPopupProps) {
  // Add "None" option at the beginning
  const options = [
    { id: null, name: 'None', content: 'Remove from project' },
    ...projects
  ];

  // Find the index of the initial project, but default to first project (not "None")
  const initialIndex = initialProjectId
    ? options.findIndex(opt => opt.id === initialProjectId)
    : 1; // Start at first project instead of "None"
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 1);
  const popupRef = useRef<HTMLDivElement>(null);

  // Scroll entire popup into view when it first mounts
  useEffect(() => {
    if (popupRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        popupRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 10);
    }
  }, []); // Only run once on mount

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(options[selectedIndex].id);
      } else if (e.key === 'Escape') {
        console.log('[ProjectSelectionPopup] Escape pressed - calling onCancel');
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        console.log('[ProjectSelectionPopup] After onCancel, stopPropagation called');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        // Tab can also move through options
        setSelectedIndex(prev => (prev + 1) % options.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [selectedIndex, onSelect, onCancel, options]);

  return (
    <div ref={popupRef} className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      {/* Header showing what action is being performed */}
      {selectedTaskCount > 1 && (
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500">
            Move {selectedTaskCount} tasks to:
          </div>
        </div>
      )}

      {options.map((option, index) => (
        <div
          key={option.id || 'none'}
          className={cn(
            "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
            selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
          )}
          onClick={() => onSelect(option.id)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {option.id === null ? (
            <X className="h-4 w-4 text-gray-500" />
          ) : (
            <FolderKanban className="h-4 w-4 text-gray-500" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium">
              {option.name || option.content || 'Unnamed Project'}
            </div>
            {option.id === null && (
              <div className="text-xs text-gray-500">Remove from project</div>
            )}
          </div>
        </div>
      ))}

      {/* Bottom hint */}
      <div className="border-t border-gray-200 mt-1 px-3 py-2">
        <div className="text-xs text-gray-400 font-semibold">ESC to cancel</div>
      </div>
    </div>
  );
}
