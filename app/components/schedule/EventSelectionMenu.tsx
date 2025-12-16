import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Video, MapPin } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  dueDate?: string;
  zoomLink?: string;
  location?: string;
  isRecurring?: boolean;
  recurringDays?: string[];
}

interface EventSelectionMenuProps {
  events: Event[];
  onSelect: (event: Event) => void;
  onCancel: () => void;
}

export default function EventSelectionMenu({ events, onSelect, onCancel }: EventSelectionMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Show all events (don't filter by date)
  console.log('[EventSelectionMenu] All events:', events);

  const displayEvents = events;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, displayEvents.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + Math.max(1, displayEvents.length)) % Math.max(1, displayEvents.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (displayEvents.length > 0) {
          onSelect(displayEvents[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayEvents, onSelect, onCancel]);

  if (displayEvents.length === 0) {
    return (
      <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-3 px-4 z-50 w-72" style={{ backgroundColor: 'white' }}>
        <div className="text-sm text-gray-500">No events available</div>
        <div className="text-xs text-gray-400 mt-1">Press Esc to go back</div>
      </div>
    );
  }

  return (
    <div className="absolute top-8 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl py-1 z-50 w-80" style={{ backgroundColor: 'white' }}>
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select Event</div>
      </div>
      {displayEvents.map((event, index) => {
        // Handle both direct properties and metadata nested properties
        const name = event.name || event.content || "Unnamed event";
        const startTime = event.startTime || event.metadata?.startTime;
        const endTime = event.endTime || event.metadata?.endTime;
        const zoomLink = event.zoomLink || event.metadata?.zoomLink;
        const location = event.location || event.metadata?.location;
        const isRecurring = event.isRecurring || event.metadata?.isRecurring;
        
        return (
          <div
            key={event._id || event.id}
            className={cn(
              "flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors",
              selectedIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(displayEvents[index])}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">{name}</div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {startTime && endTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{startTime} - {endTime}</span>
                  </div>
                )}
                {zoomLink && (
                  <div className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    <span>Zoom</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{location}</span>
                  </div>
                )}
                {isRecurring && (
                  <span className="text-blue-600">Recurring</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}