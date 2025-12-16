# Edit Mode Proposal - Keyboard-Only Block & Task Editing

## Overview
Enable keyboard-only editing of blocks and tasks with minimal UI changes, maintaining the Bloomberg terminal aesthetic.

## Design Principles
1. **Inline editing** - Edit in place, no modals
2. **Keyboard-only** - No mouse required
3. **Visual clarity** - Clear indication of what's being edited
4. **Minimal UI** - Maintain clean terminal look

## Block Editing

### Trigger
- Press `e` when block is selected to enter edit mode
- Or press specific keys: `t` for time, `y` for type

### Display
```
┌─────────────────────────────────────────────┐
│ [09:00] DEEP WORK BLOCK          [EDIT MODE]│
│ ────────────────────────────────────────────│
│ > Type: [deep-work ▼]  (↑↓ to change)       │
│ > Time: [09:00____]    (type or ↑↓)         │
│                                              │
│ Press Enter to save, Esc to cancel          │
└─────────────────────────────────────────────┘
```

### Implementation
```typescript
// When in edit mode, show editable fields
{isEditingBlock && (
  <div className="border-l-2 border-yellow-500 pl-4 space-y-2">
    <div className="flex items-center gap-4">
      <span className="text-gray-600">Type:</span>
      <select 
        value={editBlockType} 
        className="bg-transparent border-b border-gray-400 focus:border-blue-500"
      >
        <option>deep-work</option>
        <option>admin</option>
        <option>break</option>
        <option>meeting</option>
      </select>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-gray-600">Time:</span>
      <input 
        value={editBlockTime}
        className="bg-transparent border-b border-gray-400 w-20"
        placeholder="HH:MM"
      />
    </div>
  </div>
)}
```

## Task Editing

### Trigger
- Press `e` when task is selected
- Or press specific keys: `n` for name, `d` for duration

### Display - Option A: Inline Replace
```
Tasks:
  ✓ Review PR comments
  → [Edit task name___________] [30m ▼]  <- Selected task becomes input
  ○ Update documentation
```

### Display - Option B: Edit Below
```
Tasks:
  ✓ Review PR comments
  → Write unit tests             <- Keep original visible
  ┌─ EDITING ──────────────────┐
  │ Name: [Write unit tests___]│
  │ Duration: [30m ▼]          │
  └────────────────────────────┘
  ○ Update documentation
```

### Display - Option C: Compact Inline (Recommended)
```
Tasks:
  ✓ Review PR comments
  → Write unit tests [EDIT]
    └─ [Write unit tests___] • [30m]
  ○ Update documentation
```

## Navigation in Edit Mode

### Block Edit Mode
- `Tab` - Move between Type and Time fields
- `↑↓` - Change values (for type dropdown or time)
- `Enter` - Save and exit edit mode
- `Esc` - Cancel and exit edit mode

### Task Edit Mode
- `Tab` - Move between Name and Duration
- `↑↓` - Quick duration changes (15m increments)
- `Enter` - Save and exit edit mode
- `Esc` - Cancel and exit edit mode

## Quick Edit Shortcuts (from normal mode)

### Block Level
- `Shift+T` - Quick edit time (shows time picker inline)
- `Shift+Y` - Quick cycle through block types

### Task Level
- `Shift+D` - Quick duration picker popup
- `Shift+N` or just start typing - Edit task name

## Visual Indicators

### Edit Mode Active
```css
/* Yellow border for edit mode */
.edit-mode {
  border-left: 2px solid #EAB308;
  background: rgba(234, 179, 8, 0.05);
}

/* Pulsing cursor for active field */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## State Management

```typescript
// Additional state for edit mode
const [editMode, setEditMode] = useState<'none' | 'block' | 'task'>('none');
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
const [editValues, setEditValues] = useState({
  blockType: '',
  blockTime: '',
  taskName: '',
  taskDuration: ''
});
```

## Keyboard Handler Update

```typescript
// Add to keyboard handler
if (e.key === 'e' && !isTypingTask && !isTypingCommand) {
  if (selectedTaskIndex !== null) {
    // Enter task edit mode
    setEditMode('task');
    setEditingTaskId(tasks[selectedTaskIndex].id);
    setEditValues({
      taskName: tasks[selectedTaskIndex].title,
      taskDuration: tasks[selectedTaskIndex].duration
    });
  } else if (selectedBlockIndex >= 0) {
    // Enter block edit mode
    setEditMode('block');
    setEditingBlockId(blocks[selectedBlockIndex].id);
    setEditValues({
      blockType: blocks[selectedBlockIndex].type,
      blockTime: blocks[selectedBlockIndex].time
    });
  }
}
```

## Recommendation

I recommend **Option C (Compact Inline)** for task editing because:
1. Maintains context by showing original value
2. Minimal visual disruption
3. Clear indication of edit mode
4. Fits the terminal aesthetic

For blocks, the dedicated edit section works well since there are only 2 fields to edit.

The key is making it feel native to the keyboard-first, terminal-style interface while being immediately intuitive.