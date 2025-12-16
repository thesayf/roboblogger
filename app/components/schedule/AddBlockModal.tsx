import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, Clock, Zap } from 'lucide-react';

interface Block {
  id: string;
  time: string;
  title: string;
  type: 'deep-work' | 'meeting' | 'break' | 'admin';
  duration: number;
  tasks?: any[];
  energy?: 'high' | 'medium' | 'low';
}

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (block: Partial<Block>) => void;
  suggestedTime?: string;
  existingBlocks: Block[];
  currentBlockIndex?: number;
}

export default function AddBlockModal({
  isOpen,
  onClose,
  onAdd,
  suggestedTime,
  existingBlocks,
  currentBlockIndex = -1,
}: AddBlockModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Block['type']>('deep-work');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [energy, setEnergy] = useState<Block['energy']>('medium');
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Calculate smart time suggestion
  const calculateSmartTime = () => {
    if (suggestedTime) return suggestedTime;
    
    // If we have a current block position
    if (currentBlockIndex >= 0 && currentBlockIndex < existingBlocks.length) {
      const currentBlock = existingBlocks[currentBlockIndex];
      const [hour, min] = currentBlock.time.split(':').map(Number);
      const endMinutes = hour * 60 + min + currentBlock.duration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      // Check if there's a next block
      const nextBlock = existingBlocks[currentBlockIndex + 1];
      if (nextBlock) {
        // If there's a gap, use it
        const nextStart = nextBlock.time;
        const suggestedTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        
        // Calculate max duration that fits in the gap
        const [nextHour, nextMin] = nextStart.split(':').map(Number);
        const gapMinutes = (nextHour * 60 + nextMin) - endMinutes;
        
        if (gapMinutes > 0) {
          setDuration(Math.min(duration, gapMinutes));
          return suggestedTime;
        }
      }
      
      // No gap or no next block, add after current
      return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    }
    
    // Default to 9 AM if no context
    return '09:00';
  };

  // Set defaults based on type
  useEffect(() => {
    const defaults = {
      'deep-work': { duration: 90, energy: 'high' as const },
      'meeting': { duration: 30, energy: 'medium' as const },
      'break': { duration: 15, energy: 'low' as const },
      'admin': { duration: 45, energy: 'medium' as const },
    };
    
    const selected = defaults[type];
    setDuration(selected.duration);
    setEnergy(selected.energy);
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      setStartTime(calculateSmartTime());
      titleInputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAdd({
      title,
      type,
      time: startTime,
      duration,
      energy,
      tasks: [],
    });
    
    // Reset form
    setTitle('');
    setType('deep-work');
    onClose();
  };

  // Keyboard shortcuts for quick type selection
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Quick type selection with number keys
      if (e.key === '1') setType('deep-work');
      if (e.key === '2') setType('meeting');
      if (e.key === '3') setType('break');
      if (e.key === '4') setType('admin');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Block</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Title input */}
            <div className="mb-4">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            {/* Type selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type (press 1-4)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'deep-work', label: '1. Deep Work', color: 'purple' },
                  { value: 'meeting', label: '2. Meeting', color: 'blue' },
                  { value: 'break', label: '3. Break', color: 'green' },
                  { value: 'admin', label: '4. Admin', color: 'gray' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value as Block['type'])}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                      type === option.value
                        ? `bg-${option.color}-50 border-${option.color}-300 text-${option.color}-700`
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time and duration */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min="15"
                  max="240"
                  step="15"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Energy level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Zap className="inline h-3 w-3 mr-1" />
                Energy Required
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergy(level)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                      energy === level
                        ? level === 'high' ? "bg-red-50 border-red-300 text-red-700"
                        : level === 'medium' ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                        : "bg-green-50 border-green-300 text-green-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
            >
              Add Block
            </button>
          </div>
        </form>
      </div>
    </>
  );
}