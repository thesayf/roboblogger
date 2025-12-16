'use client';

import React from 'react';
import GoalSelectionPopup from './GoalSelectionPopup';
import RecurringSelectionPopup from './RecurringSelectionPopup';
import DaySelectionPopup from './DaySelectionPopup';
import SimpleDateInput from './SimpleDateInput';
import TimeRangePopup from './TimeRangePopup';
import AddLinkPopup from './AddLinkPopup';
import EditTextPopup from './EditTextPopup';

interface Event {
  id: string;
  name?: string;
  content?: string; // API returns content, not name
  date?: string;
  location?: string;
  metadata?: {
    dueDate?: string;
    startTime?: string;
    [key: string]: any;
  };
}

interface Goal {
  id: string;
  title: string;
  deadline?: string;
  completed?: boolean;
  isExpanded?: boolean;
}

interface EventsListProps {
  eventViewMode?: 'upcoming' | 'passed';
  events: Event[];
  isAtEventLevel: boolean;
  eventLevelPosition: number;
  grabbedEventIndex: number | null;
  isEditingEvent: boolean;
  editingEventIndex: number | null;
  editingEventId?: string | null;
  editEventName: string;
  editEventGoalId?: string | null;
  editEventIsRecurring?: boolean;
  editEventRecurringDays?: string[];
  editEventDate: string;
  editEventStartTime?: string;
  editEventEndTime?: string;
  editEventLink?: string;
  editEventLocation?: string;
  editFieldFocus: 'name' | 'goal' | 'recurring' | 'days' | 'date' | 'time' | 'link' | 'location';
  isTypingEvent: boolean;
  eventInput: string;
  inputStep: 'name' | 'date' | null;
  tempEventName: string;
  tempEventGoalId?: string | null;
  tempEventIsRecurring?: boolean;
  tempEventRecurringDays?: string[] | null;
  tempEventDate?: string;
  tempEventStartTime?: string | null;
  tempEventEndTime?: string | null;
  // Popup related props
  showGoalPopup?: boolean;
  showRecurringPopup?: boolean;
  showDaySelectionPopup?: boolean;
  showDatePopup?: boolean;
  showTimeRangePopup?: boolean;
  showAddLinkPopup?: boolean;
  // Edit popup related props
  showEditGoalPopup?: boolean;
  showEditRecurringPopup?: boolean;
  showEditDaysPopup?: boolean;
  showEditDatePopup?: boolean;
  showEditTimePopup?: boolean;
  showEditLinkPopup?: boolean;
  isEditingNameInline?: boolean;
  showEditLocationPopup?: boolean;
  goals?: Goal[];
  onGoalSelect?: (goalId: string | null) => void;
  onGoalCancel?: () => void;
  onRecurringSelect?: (isRecurring: boolean) => void;
  onRecurringCancel?: () => void;
  onDaySelect?: (days: string[]) => void;
  onDayCancel?: () => void;
  onDateSelect?: (date: string | null) => void;
  onDateCancel?: () => void;
  onTimeRangeSelect?: (startTime: string, endTime: string) => void;
  onTimeRangeCancel?: () => void;
  onAddLinkSelect?: (link: string | null) => void;
  onAddLinkCancel?: () => void;
  // Edit popup handlers
  onEditGoalSelect?: (goalId: string | null) => void;
  onEditGoalCancel?: () => void;
  onEditRecurringSelect?: (isRecurring: boolean) => void;
  onEditRecurringCancel?: () => void;
  onEditDaysSelect?: (days: string[]) => void;
  onEditDaysCancel?: () => void;
  onEditDateSelect?: (date: string | null) => void;
  onEditDateCancel?: () => void;
  onEditTimeSelect?: (startTime: string, endTime: string) => void;
  onEditTimeCancel?: () => void;
  onEditLinkSelect?: (link: string | null) => void;
  onEditLinkCancel?: () => void;
  onEditLocationSelect?: (location: string) => void;
  onEditLocationCancel?: () => void;
}

export default function EventsList({
  eventViewMode = 'upcoming',
  events,
  isAtEventLevel,
  eventLevelPosition,
  grabbedEventIndex,
  isEditingEvent,
  editingEventIndex,
  editingEventId,
  editEventName,
  editEventGoalId,
  editEventIsRecurring,
  editEventRecurringDays,
  editEventDate,
  editEventStartTime,
  editEventEndTime,
  editEventLink,
  editEventLocation,
  editFieldFocus,
  isTypingEvent,
  eventInput,
  inputStep,
  tempEventName,
  tempEventGoalId,
  tempEventIsRecurring,
  tempEventRecurringDays,
  tempEventDate,
  tempEventStartTime,
  tempEventEndTime,
  showGoalPopup = false,
  showRecurringPopup = false,
  showDaySelectionPopup = false,
  showDatePopup = false,
  showTimeRangePopup = false,
  showAddLinkPopup = false,
  showEditGoalPopup = false,
  showEditRecurringPopup = false,
  showEditDaysPopup = false,
  showEditDatePopup = false,
  showEditTimePopup = false,
  showEditLinkPopup = false,
  isEditingNameInline = false,
  showEditLocationPopup = false,
  goals = [],
  onGoalSelect,
  onGoalCancel,
  onRecurringSelect,
  onRecurringCancel,
  onDaySelect,
  onDayCancel,
  onDateSelect,
  onDateCancel,
  onTimeRangeSelect,
  onTimeRangeCancel,
  onAddLinkSelect,
  onAddLinkCancel,
  onEditGoalSelect,
  onEditGoalCancel,
  onEditRecurringSelect,
  onEditRecurringCancel,
  onEditDaysSelect,
  onEditDaysCancel,
  onEditDateSelect,
  onEditDateCancel,
  onEditTimeSelect,
  onEditTimeCancel,
  onEditLinkSelect,
  onEditLinkCancel,
  onEditLocationSelect,
  onEditLocationCancel,
}: EventsListProps) {

  // Helper function to render input field
  const renderInputField = (label: string, className: string = '') => {
    // Find goal name if tempEventGoalId is set
    const selectedGoal = tempEventGoalId ? goals.find(g => g.id === tempEventGoalId) : null;

    return (
      <div className={`flex items-center gap-3 py-2 ${className}`}>
        {/* Event Icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1" style={{ fontFamily: "Lora, Georgia, serif" }}>
          {showGoalPopup ? (
            // Stage 1: Selecting goal
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName || eventInput}</span>
              <span className="text-gray-400 ml-2 text-xs italic">← selecting goal...</span>
            </span>
          ) : showRecurringPopup ? (
            // Stage 2: Selecting recurring
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              {selectedGoal && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-500 text-xs">{selectedGoal.title}</span>
                </>
              )}
              <span className="text-gray-400 ml-2 text-xs italic">← recurring?</span>
            </span>
          ) : showDaySelectionPopup ? (
            // Stage 3: Selecting days
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              {selectedGoal && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-500 text-xs">{selectedGoal.title}</span>
                </>
              )}
              {tempEventIsRecurring !== undefined && (
                <>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-xs">{tempEventIsRecurring ? 'recurring' : 'one-time'}</span>
                </>
              )}
              <span className="text-gray-400 ml-2 text-xs italic">← selecting days...</span>
            </span>
          ) : showDatePopup ? (
            // Stage 4: Selecting date
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              {selectedGoal && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-500 text-xs">{selectedGoal.title}</span>
                </>
              )}
              {tempEventRecurringDays && tempEventRecurringDays.length > 0 && (
                <>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-xs">{tempEventRecurringDays.join(', ')}</span>
                </>
              )}
              <span className="text-gray-400 ml-2 text-xs italic">← selecting date...</span>
            </span>
          ) : showTimeRangePopup ? (
            // Stage 5: Selecting time
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              {selectedGoal && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-500 text-xs">{selectedGoal.title}</span>
                </>
              )}
              {tempEventDate && (
                <>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-xs">{new Date(tempEventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </>
              )}
              <span className="text-gray-400 ml-2 text-xs italic">← selecting time...</span>
            </span>
          ) : showAddLinkPopup ? (
            // Stage 6: Adding link
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              {selectedGoal && (
                <>
                  <span className="text-gray-400 mx-2">→</span>
                  <span className="text-gray-500 text-xs">{selectedGoal.title}</span>
                </>
              )}
              {tempEventStartTime && tempEventEndTime && (
                <>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-xs">{tempEventStartTime} - {tempEventEndTime}</span>
                </>
              )}
              <span className="text-gray-400 ml-2 text-xs italic">← adding link...</span>
            </span>
          ) : inputStep === 'name' ? (
            // Typing name
            <>
              <span className="text-gray-700">{eventInput}</span>
              <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            </>
          ) : inputStep === 'date' ? (
            // Typing date
            <span className="flex items-center">
              <span className="text-gray-600">{tempEventName}</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-gray-500 text-xs mr-1">date:</span>
              <span className="text-gray-700">{eventInput}</span>
              <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
              {eventInput.length === 0 && (
                <span className="ml-1 text-gray-400 text-xs">MM/DD/YYYY</span>
              )}
            </span>
          ) : (
            // Default
            <>
              <span className="text-gray-700">{eventInput}</span>
              <span className="inline-block w-[2px] h-4 bg-gray-400 animate-[blink_1s_ease-in-out_infinite]" />
            </>
          )}
        </span>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className="py-2">
        {eventViewMode === 'passed' ? (
          <div className="text-gray-400 text-sm font-mono">
            No past events yet
          </div>
        ) : isAtEventLevel ? (
          <div className="relative">
            {renderInputField('EVENT 01')}
            {/* Popups positioned relative to input */}
            {showGoalPopup && onGoalSelect && onGoalCancel && (
              <GoalSelectionPopup
                goals={goals}
                onSelect={onGoalSelect}
                onCancel={onGoalCancel}
                initialGoalId={tempEventGoalId}
              />
            )}
            {showRecurringPopup && onRecurringSelect && onRecurringCancel && (
              <RecurringSelectionPopup
                onSelect={onRecurringSelect}
                onCancel={onRecurringCancel}
              />
            )}
            {showDaySelectionPopup && onDaySelect && onDayCancel && (
              <DaySelectionPopup
                onSelect={onDaySelect}
                onCancel={onDayCancel}
              />
            )}
            {showDatePopup && onDateSelect && onDateCancel && (
              <SimpleDateInput
                onSelect={onDateSelect}
                onCancel={onDateCancel}
              />
            )}
            {showTimeRangePopup && onTimeRangeSelect && onTimeRangeCancel && (
              <TimeRangePopup
                onSelect={onTimeRangeSelect}
                onCancel={onTimeRangeCancel}
              />
            )}
            {showAddLinkPopup && onAddLinkSelect && onAddLinkCancel && (
              <AddLinkPopup
                onSelect={onAddLinkSelect}
                onCancel={onAddLinkCancel}
              />
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No events yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers
  let displayOffset = 0;
  if (isAtEventLevel && eventLevelPosition === -2) {
    displayOffset = 1;
  }

  return (
    <div className="space-y-2">
      {/* Top input for new event */}
      {isAtEventLevel && eventLevelPosition === -2 && eventViewMode !== 'passed' && (
        <div className="relative">
          {renderInputField('EVENT 01')}
          {/* Popups positioned relative to top input */}
          {showGoalPopup && onGoalSelect && onGoalCancel && (
            <GoalSelectionPopup
              goals={goals}
              onSelect={onGoalSelect}
              onCancel={onGoalCancel}
              initialGoalId={tempEventGoalId}
            />
          )}
          {showRecurringPopup && onRecurringSelect && onRecurringCancel && (
            <RecurringSelectionPopup
              onSelect={onRecurringSelect}
              onCancel={onRecurringCancel}
            />
          )}
          {showDaySelectionPopup && onDaySelect && onDayCancel && (
            <DaySelectionPopup
              onSelect={onDaySelect}
              onCancel={onDayCancel}
            />
          )}
          {showDatePopup && onDateSelect && onDateCancel && (
            <SimpleDateInput
              onSelect={onDateSelect}
              onCancel={onDateCancel}
            />
          )}
          {showTimeRangePopup && onTimeRangeSelect && onTimeRangeCancel && (
            <TimeRangePopup
              onSelect={onTimeRangeSelect}
              onCancel={onTimeRangeCancel}
            />
          )}
          {showAddLinkPopup && onAddLinkSelect && onAddLinkCancel && (
            <AddLinkPopup
              onSelect={onAddLinkSelect}
              onCancel={onAddLinkCancel}
            />
          )}
        </div>
      )}

      {/* Render existing events */}
      {events.map((event, index) => {
        const hasInsertAfter = isAtEventLevel && eventLevelPosition === -(index + 3) && eventViewMode !== 'passed';
        let displayNumber = index + 1;

        if (eventViewMode !== 'passed') {
          if (isAtEventLevel && eventLevelPosition === -2) {
            displayNumber = index + 2;
          } else if (isAtEventLevel && eventLevelPosition < -2) {
            const insertPosition = Math.abs(eventLevelPosition) - 3;
            if (insertPosition < index) {
              displayNumber = index + 2;
            }
          }
        }

        return (
          <React.Fragment key={event.id}>
          <div data-event-index={index}>
            <div className={`flex gap-3 transition-all ${
              grabbedEventIndex === index
                ? 'opacity-75 bg-gray-100 py-2'
                : isEditingEvent && editingEventId && event.id === editingEventId
                ? 'py-3'
                : isAtEventLevel && eventLevelPosition === index
                ? 'bg-gray-50 py-2'
                : 'py-2'
            }`}>
              {/* Event Icon */}
              {eventViewMode === 'passed' ? (
                <span className="w-4 h-4 text-gray-400 flex-shrink-0 text-center text-sm font-medium mt-0.5" style={{ fontFamily: "monospace" }}>
                  ✓
                </span>
              ) : (
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}

              <div className="flex-1">

              {isEditingEvent && editingEventId && event.id === editingEventId ? (
                <div className="flex flex-col gap-2.5">
                  {/* Name field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'name' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>name</span>
                      <span className={`flex-1 ${editFieldFocus === 'name' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventName}
                        {isEditingNameInline && (
                          <span className="inline-block w-[1px] h-4 bg-gray-900 animate-[blink_1s_ease-in-out_infinite] ml-1" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Goal field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'goal' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>goal</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'goal' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventGoalId
                          ? (goals.find(g => g.id === editEventGoalId)?.title ||
                             (goals.find(g => g.id === editEventGoalId) as any)?.name ||
                             (goals.find(g => g.id === editEventGoalId) as any)?.content ||
                             'Selected')
                          : 'none'}
                      </span>
                    </div>
                    {showEditGoalPopup && onEditGoalSelect && onEditGoalCancel && (
                      <GoalSelectionPopup
                        goals={goals}
                        onSelect={onEditGoalSelect}
                        onCancel={onEditGoalCancel}
                        initialGoalId={editEventGoalId}
                      />
                    )}
                  </div>

                  {/* Recurring field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'recurring' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>recurring</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'recurring' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventIsRecurring ? 'yes' : 'no'}
                      </span>
                    </div>
                    {showEditRecurringPopup && onEditRecurringSelect && onEditRecurringCancel && (
                      <RecurringSelectionPopup
                        onSelect={onEditRecurringSelect}
                        onCancel={onEditRecurringCancel}
                        initialIsRecurring={editEventIsRecurring}
                      />
                    )}
                  </div>

                  {/* Days field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'days' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>days</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'days' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventRecurringDays && editEventRecurringDays.length > 0 ? editEventRecurringDays.join(', ') : 'none'}
                      </span>
                    </div>
                    {showEditDaysPopup && onEditDaysSelect && onEditDaysCancel && (
                      <DaySelectionPopup
                        selectedDays={editEventRecurringDays}
                        onSelect={onEditDaysSelect}
                        onCancel={onEditDaysCancel}
                      />
                    )}
                  </div>

                  {/* Date field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'date' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>date</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'date' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventDate || '—'}
                      </span>
                    </div>
                    {showEditDatePopup && onEditDateSelect && onEditDateCancel && (
                      <SimpleDateInput
                        onSelect={onEditDateSelect}
                        onCancel={onEditDateCancel}
                      />
                    )}
                  </div>

                  {/* Time field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'time' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>time</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'time' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventStartTime || editEventEndTime
                          ? `${editEventStartTime || '__:__'} – ${editEventEndTime || '__:__'}`
                          : '—'}
                      </span>
                    </div>
                    {showEditTimePopup && onEditTimeSelect && onEditTimeCancel && (
                      <TimeRangePopup
                        initialStartTime={editEventStartTime}
                        initialEndTime={editEventEndTime}
                        onSelect={onEditTimeSelect}
                        onCancel={onEditTimeCancel}
                      />
                    )}
                  </div>

                  {/* Link field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'link' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>link</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'link' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventLink || '—'}
                      </span>
                    </div>
                    {showEditLinkPopup && onEditLinkSelect && onEditLinkCancel && (
                      <AddLinkPopup
                        onSelect={onEditLinkSelect}
                        onCancel={onEditLinkCancel}
                        initialLink={editEventLink}
                      />
                    )}
                  </div>

                  {/* Location field */}
                  <div className="relative">
                    <div className={`flex items-baseline gap-3 px-2 py-1 rounded transition-colors ${editFieldFocus === 'location' ? 'bg-gray-50' : ''}`}>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0" style={{ fontFamily: "Lora, Georgia, serif" }}>location</span>
                      <span className={`flex-1 text-sm ${editFieldFocus === 'location' ? 'text-gray-900' : 'text-gray-500'}`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                        {editEventLocation || '—'}
                      </span>
                    </div>
                    {showEditLocationPopup && onEditLocationSelect && onEditLocationCancel && (
                      <EditTextPopup
                        label="Edit Location"
                        placeholder="Enter location..."
                        initialValue={editEventLocation || ''}
                        onSelect={onEditLocationSelect}
                        onCancel={onEditLocationCancel}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <span className={`text-gray-700 leading-relaxed ${
                    grabbedEventIndex === index ? '' : ''
                  }`} style={{ fontFamily: "Lora, Georgia, serif" }}>
                    {/* EVENT GRAB MODE DISABLED: {grabbedEventIndex === index && '⇅ '} */}
                    {event.name || event.content || ''}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {/* Date */}
                    {(event.date || event.metadata?.dueDate) && (
                      (() => {
                        const dateStr = event.date || event.metadata?.dueDate || '';
                        try {
                          const date = new Date(dateStr);
                          const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          });
                          return (
                            <span className="text-xs font-mono text-gray-500">
                              {formattedDate}
                            </span>
                          );
                        } catch {
                          return (
                            <span className="text-xs font-mono text-gray-500">
                              {dateStr}
                            </span>
                          );
                        }
                      })()
                    )}

                    {/* Time */}
                    {(event.metadata?.startTime || event.metadata?.endTime) && (
                      <span className="text-xs font-mono text-gray-500">
                        {event.metadata?.startTime || ''}
                        {event.metadata?.endTime && ` - ${event.metadata?.endTime}`}
                      </span>
                    )}

                    {/* Meeting Link */}
                    {event.metadata?.link && (
                      <a
                        href={event.metadata.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-gray-500 hover:text-gray-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Link
                      </a>
                    )}

                    {/* Recurring days */}
                    {event.metadata?.isRecurring && event.metadata?.recurringDays && (
                      <span className="text-xs font-mono text-gray-500">
                        {event.metadata.recurringDays.join(', ')}
                      </span>
                    )}

                    {/* Goal badge */}
                    {event.metadata?.goalId && (() => {
                      const goal = goals.find(g => g.id === event.metadata?.goalId);
                      if (goal) {
                        const goalName = goal.title || goal.name || goal.content || '';
                        return (
                          <span className="text-xs text-gray-400" style={{ fontFamily: "Lora, Georgia, serif" }}>
                            → {goalName}
                          </span>
                        );
                      }
                      return null;
                    })()}

                    {/* Location */}
                    {event.location && (
                      <span className="text-xs font-mono text-gray-500">
                        {event.location}
                      </span>
                    )}
                  </div>
                </>
              )}
              </div>
            </div>

            {/* Show popups for current event position during edit flow */}
            {!hasInsertAfter && !isEditingEvent && eventLevelPosition === index && (showGoalPopup || showRecurringPopup || showDaySelectionPopup || showDatePopup || showTimeRangePopup || showAddLinkPopup) && (
              <div className="relative">
                {showGoalPopup && onGoalSelect && onGoalCancel && (
                  <GoalSelectionPopup
                    goals={goals}
                    onSelect={onGoalSelect}
                    onCancel={onGoalCancel}
                    initialGoalId={tempEventGoalId}
                  />
                )}
                {showRecurringPopup && onRecurringSelect && onRecurringCancel && (
                  <RecurringSelectionPopup
                    onSelect={onRecurringSelect}
                    onCancel={onRecurringCancel}
                  />
                )}
                {showDaySelectionPopup && onDaySelect && onDayCancel && (
                  <DaySelectionPopup
                    onSelect={onDaySelect}
                    onCancel={onDayCancel}
                  />
                )}
                {showDatePopup && onDateSelect && onDateCancel && (
                  <SimpleDateInput
                    onSelect={onDateSelect}
                    onCancel={onDateCancel}
                  />
                )}
                {showTimeRangePopup && onTimeRangeSelect && onTimeRangeCancel && (
                  <TimeRangePopup
                    onSelect={onTimeRangeSelect}
                    onCancel={onTimeRangeCancel}
                  />
                )}
                {showAddLinkPopup && onAddLinkSelect && onAddLinkCancel && (
                  <AddLinkPopup
                    onSelect={onAddLinkSelect}
                    onCancel={onAddLinkCancel}
                  />
                )}
              </div>
            )}

          </div>

          {/* Insert input after this event */}
          {hasInsertAfter && (
            <div className="relative">
              {renderInputField(`EVENT ${String(displayNumber + 1).padStart(2, '0')}`)}
              {/* Popups positioned relative to inline input */}
              {showGoalPopup && onGoalSelect && onGoalCancel && (
                <GoalSelectionPopup
                  goals={goals}
                  onSelect={onGoalSelect}
                  onCancel={onGoalCancel}
                  initialGoalId={tempEventGoalId}
                />
              )}
              {showRecurringPopup && onRecurringSelect && onRecurringCancel && (
                <RecurringSelectionPopup
                  onSelect={onRecurringSelect}
                  onCancel={onRecurringCancel}
                />
              )}
              {showDaySelectionPopup && onDaySelect && onDayCancel && (
                <DaySelectionPopup
                  onSelect={onDaySelect}
                  onCancel={onDayCancel}
                />
              )}
              {showDatePopup && onDateSelect && onDateCancel && (
                <SimpleDateInput
                  onSelect={onDateSelect}
                  onCancel={onDateCancel}
                />
              )}
              {showTimeRangePopup && onTimeRangeSelect && onTimeRangeCancel && (
                <TimeRangePopup
                  onSelect={onTimeRangeSelect}
                  onCancel={onTimeRangeCancel}
                />
              )}
              {showAddLinkPopup && onAddLinkSelect && onAddLinkCancel && (
                <AddLinkPopup
                  onSelect={onAddLinkSelect}
                  onCancel={onAddLinkCancel}
                />
              )}
            </div>
          )}
          </React.Fragment>
        );
      })}

      {/* Bottom input for new event */}
      {isAtEventLevel && eventLevelPosition === -1 && eventViewMode !== 'passed' && (
        <div className="relative">
          {renderInputField(`EVENT ${String(events.length + 1).padStart(2, '0')}`)}
          {/* Popups positioned relative to bottom input */}
          {showGoalPopup && onGoalSelect && onGoalCancel && (
            <GoalSelectionPopup
              goals={goals}
              onSelect={onGoalSelect}
              onCancel={onGoalCancel}
              initialGoalId={tempEventGoalId}
            />
          )}
          {showRecurringPopup && onRecurringSelect && onRecurringCancel && (
            <RecurringSelectionPopup
              onSelect={onRecurringSelect}
              onCancel={onRecurringCancel}
            />
          )}
          {showDaySelectionPopup && onDaySelect && onDayCancel && (
            <DaySelectionPopup
              onSelect={onDaySelect}
              onCancel={onDayCancel}
            />
          )}
          {showDatePopup && onDateSelect && onDateCancel && (
            <SimpleDateInput
              onSelect={onDateSelect}
              onCancel={onDateCancel}
            />
          )}
          {showTimeRangePopup && onTimeRangeSelect && onTimeRangeCancel && (
            <TimeRangePopup
              onSelect={onTimeRangeSelect}
              onCancel={onTimeRangeCancel}
            />
          )}
          {showAddLinkPopup && onAddLinkSelect && onAddLinkCancel && (
            <AddLinkPopup
              onSelect={onAddLinkSelect}
              onCancel={onAddLinkCancel}
            />
          )}
        </div>
      )}
    </div>
  );
}