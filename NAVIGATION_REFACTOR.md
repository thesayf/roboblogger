# Navigation System Refactor Proposal

## Current State Analysis
The navigation code works but has become complex with multiple overlapping state variables that need manual synchronization.

## Proposed Improvements

### 1. Unified Navigation State
Replace multiple state variables with a single navigation state:

```typescript
type NavigationState = 
  | { level: 'view'; type: 'between'; afterBlockIndex: number }
  | { level: 'view'; type: 'block'; blockIndex: number }
  | { level: 'task'; blockIndex: number; type: 'input'; position: number } // -1 = before first
  | { level: 'task'; blockIndex: number; type: 'task'; taskIndex: number };

const [navState, setNavState] = useState<NavigationState>({ 
  level: 'view', 
  type: 'between', 
  afterBlockIndex: -1 
});
```

### 2. Navigation Helper Functions
Create pure functions to handle navigation logic:

```typescript
const navigateDown = (state: NavigationState, blocks: Block[]): NavigationState => {
  switch (state.level) {
    case 'view':
      if (state.type === 'between') {
        const nextBlock = state.afterBlockIndex + 1;
        if (nextBlock < blocks.length) {
          return { level: 'view', type: 'block', blockIndex: nextBlock };
        }
      } else {
        return { level: 'view', type: 'between', afterBlockIndex: state.blockIndex };
      }
      break;
    case 'task':
      // Handle task navigation
      break;
  }
  return state;
};
```

### 3. Remove Magic Numbers
Use constants or enums:

```typescript
const POSITION = {
  NOT_IN_BLOCK: null,
  BEFORE_FIRST_TASK: -1,
} as const;
```

### 4. Simplify Conditionals
The navigation handler becomes cleaner:

```typescript
if (e.key === 'ArrowDown' && !isTyping) {
  e.preventDefault();
  const newState = navigateDown(navState, blocks);
  setNavState(newState);
  updateLegacyStates(newState); // For backward compatibility
}
```

## Benefits
1. **Single source of truth** for navigation position
2. **Easier to test** - pure functions for navigation logic
3. **More maintainable** - clear state transitions
4. **Less error-prone** - no manual state synchronization

## Migration Strategy
1. Keep existing state variables temporarily
2. Add new unified state alongside
3. Update navigation handlers to use new state
4. Map new state to old state variables for components
5. Gradually update components to use new state
6. Remove old state variables

## Current Working Features to Preserve
- Tab navigation through task inputs
- Arrow key alternation between blocks and "between" positions
- Enter key to select blocks or exit to view level
- Task insertion at correct positions
- Escape key to cancel typing or exit levels