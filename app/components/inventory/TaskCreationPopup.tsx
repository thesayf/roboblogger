import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface TaskCreationPopupProps {
  onSubmit: (taskData: { title: string; duration: number; dueDate?: string | null }) => void;
  onCancel: () => void;
  projectName?: string;
  taskName?: string; // Task name already entered
}

export default function TaskCreationPopup({ onSubmit, onCancel, projectName, taskName }: TaskCreationPopupProps) {
  const [step, setStep] = useState<'duration' | 'dueDate'>('duration');
  const [taskDuration, setTaskDuration] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [showDueDateOptions, setShowDueDateOptions] = useState(false);
  const [selectedDueDateIndex, setSelectedDueDateIndex] = useState(0);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(1); // Default to 30 minutes

  const durationOptions = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: 'Custom', value: 'custom' },
  ];

  const dueDateOptions = [
    { label: 'No due date (optional)', value: null },
    { label: 'Today', value: new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    { label: 'Next week', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
    { label: 'Custom date', value: 'custom' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'duration') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedDurationIndex(prev => (prev + 1) % durationOptions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedDurationIndex(prev => (prev - 1 + durationOptions.length) % durationOptions.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedOption = durationOptions[selectedDurationIndex];
          if (selectedOption.value === 'custom') {
            // Start custom duration input
            setTaskDuration('');
          } else {
            setTaskDuration(String(selectedOption.value));
            setStep('dueDate');
            setShowDueDateOptions(true);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          // Start typing custom duration
          setTaskDuration(e.key);
          setSelectedDurationIndex(-1); // Deselect options
        } else if (taskDuration !== '' && e.key === 'Backspace') {
          e.preventDefault();
          setTaskDuration(prev => prev.slice(0, -1));
        } else if (taskDuration !== '' && /^[0-9]$/.test(e.key)) {
          e.preventDefault();
          setTaskDuration(prev => prev + e.key);
        } else if (taskDuration !== '' && e.key === 'Enter') {
          e.preventDefault();
          const duration = parseInt(taskDuration);
          if (!isNaN(duration) && duration > 0) {
            setStep('dueDate');
            setShowDueDateOptions(true);
          }
        }

        // Quick select shortcuts
        if (e.key >= '1' && e.key <= '6' && taskDuration === '') {
          e.preventDefault();
          const quickDurations: { [key: string]: number } = {
            '1': 15,
            '2': 30,
            '3': 45,
            '4': 60,
            '5': 90,
            '6': 120,
          };
          setTaskDuration(String(quickDurations[e.key]));
          setStep('dueDate');
          setShowDueDateOptions(true);
        }
      } else if (step === 'dueDate') {
        if (showDueDateOptions) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedDueDateIndex(prev => (prev + 1) % dueDateOptions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedDueDateIndex(prev => (prev - 1 + dueDateOptions.length) % dueDateOptions.length);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const selectedOption = dueDateOptions[selectedDueDateIndex];
            if (selectedOption.value === 'custom') {
              setShowDueDateOptions(false);
              setTaskDueDate('');
            } else {
              const duration = parseInt(taskDuration);
              onSubmit({
                title: taskName || '',
                duration: !isNaN(duration) ? duration : 30,
                dueDate: selectedOption.value
              });
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            // Skip due date and submit without it
            const duration = parseInt(taskDuration);
            onSubmit({
              title: taskName || '',
              duration: !isNaN(duration) ? duration : 30,
              dueDate: null
            });
          }
        } else {
          // Custom date input
          if (e.key === 'Enter') {
            e.preventDefault();
            const duration = parseInt(taskDuration);
            onSubmit({
              title: taskName || '',
              duration: !isNaN(duration) ? duration : 30,
              dueDate: taskDueDate || null
            });
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowDueDateOptions(true);
            setTaskDueDate('');
          } else if (e.key === 'Backspace') {
            e.preventDefault();
            setTaskDueDate(prev => prev.slice(0, -1));
          } else if (/^[0-9/\-]$/.test(e.key)) {
            e.preventDefault();
            setTaskDueDate(prev => {
              let newInput = prev + e.key;
              // Auto-format as user types
              if (prev.length === 2 && !prev.includes('/')) {
                newInput = prev + '/' + e.key;
              } else if (prev.length === 5 && prev.split('/').length === 2) {
                newInput = prev + '/' + e.key;
              }
              return newInput;
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, taskDuration, taskDueDate, selectedDurationIndex, selectedDueDateIndex, showDueDateOptions, onSubmit, onCancel, taskName]);

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-50 w-96" style={{ backgroundColor: 'white' }}>
      <div className="space-y-3">
        {/* Header */}
        <div className="text-sm font-semibold text-gray-700">
          Task: {taskName}
        </div>

        {/* Step 1: Duration */}
        {step === 'duration' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase">Duration (required)</div>
            {taskDuration !== '' && selectedDurationIndex === -1 ? (
              // Custom duration input
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={`${taskDuration} minutes`}
                  readOnly
                  className="flex-1 px-2 py-1 text-sm bg-gray-50 rounded outline-none"
                />
                <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
              </div>
            ) : (
              // Duration options
              <div className="space-y-1">
                {durationOptions.map((option, index) => (
                  <div
                    key={option.label}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer transition-colors",
                      selectedDurationIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                    onMouseEnter={() => setSelectedDurationIndex(index)}
                    onClick={() => {
                      if (option.value === 'custom') {
                        setTaskDuration('');
                        setSelectedDurationIndex(-1);
                      } else {
                        setTaskDuration(String(option.value));
                        setStep('dueDate');
                        setShowDueDateOptions(true);
                      }
                    }}
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    {option.label}
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400">
              Quick select: 1=15m, 2=30m, 3=45m, 4=1h, 5=1.5h, 6=2h • Or type custom minutes
            </div>
          </div>
        )}

        {/* Step 2: Due Date (Optional) */}
        {step === 'dueDate' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 uppercase">Due Date (optional - press ESC to skip)</div>
            {showDueDateOptions ? (
              <div className="space-y-1">
                {dueDateOptions.map((option, index) => (
                  <div
                    key={option.label}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer transition-colors",
                      selectedDueDateIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                    onMouseEnter={() => setSelectedDueDateIndex(index)}
                    onClick={() => {
                      if (option.value === 'custom') {
                        setShowDueDateOptions(false);
                        setTaskDueDate('');
                      } else {
                        const duration = parseInt(taskDuration);
                        onSubmit({
                          title: taskName || '',
                          duration: !isNaN(duration) ? duration : 30,
                          dueDate: option.value
                        });
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {option.label}
                    {option.value && option.value !== 'custom' && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(option.value).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Custom date input
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={taskDueDate}
                  readOnly
                  className="flex-1 px-2 py-1 text-sm bg-gray-50 rounded outline-none"
                  placeholder="MM/DD/YYYY"
                />
                <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
              </div>
            )}
          </div>
        )}

        {/* Bottom hints */}
        <div className="border-t border-gray-200 pt-2 mt-3">
          <div className="text-xs text-gray-400 font-semibold">
            {step === 'duration' && 'Select or enter duration • Press Enter to continue'}
            {step === 'dueDate' && 'Select due date • ESC to skip • Enter to confirm'}
          </div>
        </div>
      </div>
    </div>
  );
}