import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface RoutineTaskDurationPopupProps {
  taskName: string;
  onSelect: (duration: number) => void;
  onCancel: () => void;
  initialDuration?: number;
}

export default function RoutineTaskDurationPopup({ taskName, onSelect, onCancel, initialDuration }: RoutineTaskDurationPopupProps) {
  // Common duration presets in minutes
  const DURATION_PRESETS = [
    { label: '5m', value: 5, key: '1' },
    { label: '10m', value: 10, key: '2' },
    { label: '15m', value: 15, key: '3' },
    { label: '20m', value: 20, key: '4' },
    { label: '30m', value: 30, key: '5' },
    { label: '45m', value: 45, key: '6' },
    { label: '1h', value: 60, key: '7' },
    { label: '1.5h', value: 90, key: '8' },
    { label: '2h', value: 120, key: '9' },
    { label: 'Custom', value: -1, key: '0' }
  ];

  // Find preset index for initial duration or use custom
  const findPresetIndex = (durationValue?: number) => {
    if (!durationValue) return 4; // Default to 30m
    const presetIdx = DURATION_PRESETS.findIndex(p => p.value === durationValue);
    return presetIdx >= 0 ? presetIdx : 9; // If not found, use custom
  };

  const initialPresetIndex = findPresetIndex(initialDuration);
  const isInitialCustom = initialDuration && !DURATION_PRESETS.some(p => p.value === initialDuration);

  const [duration, setDuration] = useState(isInitialCustom ? initialDuration.toString() : '');
  const [presetIndex, setPresetIndex] = useState(initialPresetIndex);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>(isInitialCustom ? 'custom' : 'preset');
  const [isReady, setIsReady] = useState(false);

  const selectPreset = (preset: typeof DURATION_PRESETS[0]) => {
    if (preset.value === -1) {
      // Switch to custom input
      setInputMode('custom');
      setDuration('');
    } else {
      // Select preset and confirm
      onSelect(preset.value);
    }
  };

  // Set component as ready after mount with a small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log('[DurationPopup] Component ready to receive input');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle events when ready
      if (!isReady) {
        console.log('[DurationPopup] Not ready yet, ignoring key:', e.key);
        return;
      }

      console.log('[DurationPopup] Key pressed:', e.key, 'Mode:', inputMode, 'PresetIndex:', presetIndex);

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        return;
      }

      // Preset mode
      if (inputMode === 'preset') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          setPresetIndex((prev) => (prev + 1) % DURATION_PRESETS.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          setPresetIndex((prev) => (prev - 1 + DURATION_PRESETS.length) % DURATION_PRESETS.length);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          console.log('[DurationPopup] Enter pressed, selecting preset at index:', presetIndex);
          selectPreset(DURATION_PRESETS[presetIndex]);
        } else if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          e.stopPropagation();
          const preset = DURATION_PRESETS.find(p => p.key === e.key);
          if (preset) {
            setPresetIndex(DURATION_PRESETS.indexOf(preset));
            selectPreset(preset);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          setInputMode('custom');
        }
        return;
      }

      // Custom input mode
      if (inputMode === 'custom') {
        if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          setInputMode('preset');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const durationValue = parseInt(duration);
          if (durationValue && durationValue > 0) {
            onSelect(durationValue);
          }
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          setDuration(duration.slice(0, -1));
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          // Only allow numbers
          if (/\d/.test(e.key)) {
            // Limit to 3 digits (max 999 minutes)
            if (duration.length < 3) {
              setDuration(duration + e.key);
            }
          }
        }
      }
    };

    // Use capture phase to ensure we handle the event first
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [duration, presetIndex, inputMode, onSelect, onCancel, isReady]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-72" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Set Duration</h3>
      </div>

      {/* Task name */}
      <div className="mb-3 px-3 py-2 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-500 mb-1">TASK</div>
        <div className="text-sm font-medium text-gray-900 truncate">{taskName}</div>
      </div>

      {/* Duration Presets */}
      <div className="mb-3">
        <label className="text-xs text-gray-500 font-medium mb-2 block">QUICK SELECT</label>
        <div className="grid grid-cols-3 gap-1.5">
          {DURATION_PRESETS.slice(0, 9).map((preset, index) => (
            <div
              key={preset.key}
              className={cn(
                "px-2 py-2 text-sm rounded-md transition-colors cursor-pointer border-2",
                inputMode === 'preset' && presetIndex === index
                  ? "bg-blue-100 border-blue-400 font-medium"
                  : "border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => {
                setInputMode('preset');
                setPresetIndex(index);
                selectPreset(preset);
              }}
            >
              <div className="flex justify-between items-center">
                <span>{preset.label}</span>
                <span className="text-xs text-gray-400">{preset.key}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mb-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 border-2 rounded-md transition-colors",
          inputMode === 'custom' ? "border-blue-400 bg-blue-50" : "border-gray-200",
          inputMode === 'preset' && presetIndex === 9 ? "border-blue-300" : ""
        )}
        onClick={() => {
          setInputMode('custom');
          setPresetIndex(9);
        }}
        >
          <Timer className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={duration}
            placeholder="Custom (minutes)"
            className="flex-1 bg-transparent outline-none text-sm font-mono"
            readOnly
          />
          {duration && <span className="text-xs text-gray-500">min</span>}
          {inputMode === 'custom' && (
            <span className="inline-block w-[2px] h-4 bg-blue-400 animate-[blink_1s_ease-in-out_infinite]" />
          )}
          <span className="text-xs text-gray-400">0</span>
        </div>
      </div>

      {/* Hints */}
      <div className="border-t border-gray-200 pt-3">
        <div className="text-xs text-gray-400 space-y-1">
          <div>↑↓ navigate • 0-9 for quick select</div>
          <div>Tab for custom • Enter to confirm</div>
          <div>ESC to cancel</div>
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