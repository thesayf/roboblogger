# Modularization Plan for page.tsx

## Current State
The `app/schedule/strategy/page.tsx` file is currently 1,666 lines long and contains multiple responsibilities.

## Proposed Modularization Structure

### 1. Custom Hooks (Extract State & Logic)

#### `useAIChat.ts` ✅ Created
- AI chat state management
- Message sending/receiving logic
- Conversation history
- Database persistence

#### `useBlockEditing.ts`
- Block edit mode state
- Edit field management
- Time editing logic
- Block type editing

#### `useTaskEditing.ts`
- Task edit mode state
- Task input handling
- Duration editing
- Task field focus

#### `useCursorNavigation.ts`
- Cursor position state
- Navigation between blocks/tasks
- Keyboard navigation handlers
- Focus management

#### `useInventorySync.ts`
- Inventory refresh logic
- Data synchronization
- Property picker states
- Date/time picker management

### 2. Components (Extract UI)

#### `EventSelectionMenu.tsx` ✅ Created
- Event selection popup
- Today's events display

#### `AIChatPanel.tsx` ✅ Exists
- Chat UI panel
- Message display

#### `BlockEditPanel.tsx` (New)
- Block editing UI
- Type/time editors
- Edit mode display

#### `TaskEditPanel.tsx` (New)
- Task editing UI
- Name/duration editors
- Task edit display

#### `StatsBar.tsx` (New)
- Bottom stats display
- Task counts
- Time calculations

### 3. Utilities

#### `scheduleUtils.ts` ✅ Exists
- Time calculations
- Block sorting
- Duration parsing

#### `commandHandlers.ts` (New)
- Slash command logic
- Command processing
- Menu selection handlers

## Implementation Priority

1. **Phase 1 - High Impact** (Current)
   - ✅ Extract AI Chat logic
   - ✅ Create Event Selection Menu
   - Document modularization plan

2. **Phase 2 - State Management**
   - Extract cursor navigation to hook
   - Extract block editing to hook
   - Extract task editing to hook

3. **Phase 3 - UI Components**
   - Create BlockEditPanel component
   - Create TaskEditPanel component
   - Create StatsBar component

4. **Phase 4 - Utilities**
   - Extract command handlers
   - Consolidate keyboard shortcuts
   - Create inventory sync utilities

## Benefits
- **Improved maintainability**: Smaller, focused files
- **Better testability**: Isolated logic in hooks
- **Reusability**: Components can be used elsewhere
- **Performance**: Potential for better memoization
- **Developer experience**: Easier to understand and modify

## Considerations
- Many states are interconnected, requiring careful prop passing
- Some refactoring may require updating multiple files
- Testing should be done incrementally
- Consider using React Context for deeply nested state sharing

## Next Steps
1. Continue with Phase 2 - Extract navigation and editing hooks
2. Test each extraction thoroughly
3. Update imports and dependencies
4. Consider performance optimizations after modularization