# Daybook - Architecture Overview

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                        (React 18 + TS)                          │
├──────────────────────┬──────────────────┬──────────────────────┤
│                      │                  │                      │
│   SCHEDULE VIEW      │  INVENTORY VIEW  │   AI CHAT PANEL     │
│   ────────────────   │  ──────────────  │   ──────────────    │
│   • Timeline         │  • Goals         │   • Messages        │
│   • Blocks (7 types) │  • Projects      │   • Chat Input      │
│   • Tasks in blocks  │  • Events        │   • Suggestions     │
│   • Drag-drop        │  • Routines      │                     │
│   • Keyboard nav     │  • Admin Tasks   │                     │
│                      │  • Inline edit   │                     │
└──────────────────────┴──────────────────┴──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  State Management  │
                    │  (React Context +  │
                    │   Custom Hooks)    │
                    ├────────────────────┤
                    │ • AppContext       │
                    │ • useBlockMgmt     │
                    │ • useCommandSys    │
                    │ • useDayDataLoader │
                    │ • useKeyboardCmd   │
                    │ • useAIChat        │
                    └────────┬───────────┘
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                      API LAYER                                 │
│                  (Next.js Routes)                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  GET   /api/you               ──► Fetch User Profile + Inv  │
│  GET   /api/get-today         ──► Fetch Today's Schedule    │
│  GET   /api/get-day           ──► Fetch Specific Day        │
│  CRUD  /api/blocks/*          ──► Block Management          │
│  CRUD  /api/events/*          ──► Event Management          │
│  CRUD  /api/days/[id]         ──► Day CRUD                  │
│  CRUD  /api/admin-tasks       ──► Task Management           │
│  POST  /api/ai/chat           ──► Claude Chat Agent         │
│  POST  /api/chat              ──► Store Chat History        │
│                                                               │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   DATABASE   │  │  AI AGENT    │  │  EXTERNAL    │
│   (MongoDB)  │  │  (Claude)    │  │  SERVICES    │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ • Users      │  │ • Tools:     │  │ • Clerk Auth │
│ • Days       │  │   - Blocks   │  │ • ImageKit   │
│ • Blocks     │  │   - Tasks    │  │ • Upstash    │
│ • Tasks      │  │   - Goals    │  │   Redis      │
│ • Goals      │  │   - Events   │  │ • OpenAI     │
│ • Projects   │  │   - Routines │  │   (fallback) │
│ • Events     │  │   - Profile  │  │              │
│ • Routines   │  │ • System     │  │              │
│ • Chat       │  │   Prompt     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Client-Side Component Architecture

```
app/page.tsx (3435 lines)
│
├─── <ScheduleView>
│    │
│    ├─── <TimelineView>
│    │    └─── Visual timeline rendering
│    │
│    ├─── <Block> (42KB - complex)
│    │    ├─── Block rendering
│    │    ├─── Task management within block
│    │    ├─── Keyboard navigation
│    │    ├─── Drag-drop handling
│    │    └─── Time/type editing
│    │
│    ├─── <BlockTimeMenu>
│    ├─── <BlockTypeMenu>
│    ├─── <EventSelectionMenu>
│    └─── <RoutineSelectionMenu>
│
├─── <InventoryView> (456KB)
│    │
│    ├─── <GoalsList>
│    │    ├─── Goal rendering
│    │    ├─── Add/edit/delete goals
│    │    ├─── Color picking
│    │    └─── Deadline setting
│    │
│    ├─── <ProjectsList>
│    │    ├─── Project rendering
│    │    ├─── Project-level CRUD
│    │    ├─── Task display
│    │    └─── Goal linking
│    │
│    ├─── <EventsList>
│    │    ├─── Event rendering
│    │    ├─── Recurring config
│    │    ├─── Time/date setting
│    │    └─── Location/link management
│    │
│    ├─── <RoutinesList>
│    │    ├─── Routine rendering
│    │    ├─── Day selection
│    │    ├─── Time/duration
│    │    └─── Task association
│    │
│    ├─── <AdminTasksList>
│    │    ├─── Task rendering
│    │    ├─── Category display
│    │    ├─── Priority management
│    │    └─── Estimation
│    │
│    └─── Various Popup Components
│         ├─── DeadlinePickerPopup
│         ├─── TimeRangePopup
│         ├─── DurationPickerPopup
│         ├─── TaskCreationPopup
│         └─── EditTextPopup
│
├─── <AIChatPanel>
│    ├─── Message display
│    ├─── User input
│    └─── Suggestion rendering
│
├─── <SharedNavbar>
│    └─── Navigation between views
│
└─── <CommandPaletteModal>
     └─── Global command access
```

---

## Data Flow Diagrams

### Schedule View Data Flow

```
User Actions
    │
    ├─ Arrow Keys ─► Command Handler ─┐
    ├─ Type Text ──► Input Handler    ├─► Block State Updates
    ├─ Enter ──────► Selection Handler ┤
    ├─ Tab ────────► Nav Handler      │
    └─ Escape ─────► Cancel Handler ──┘
                         │
                         ▼
                  State Mutations
                  (selectedBlock, 
                   selectedTask, etc)
                         │
                         ▼
                    UI Re-render
                    (ScheduleView)
                         │
                         ├─ Optimistic Update
                         │  (immediate UI change)
                         │
                         ▼
                    API Call
                    /api/blocks/*
                         │
                         ├─ Success ─► Confirm
                         └─ Fail ────► Revert + Error
```

### Inventory Data Flow

```
User Types / Selects
    │
    ├─ In Input ──────────────► Debounce
    ├─ Select Option ─────────► Handler
    └─ Submit ────────────────► Validation
                                   │
                                   ▼
                            Optimistic Update
                            (Local State)
                                   │
                                   ▼
                            API Request
                    /api/goals|events|routines
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                    Success              Failure
                         │                   │
                         ▼                   ▼
                    Store Result      Rollback +
                    Update Local      Error Message
```

### AI Chat Flow

```
User Message
    │
    ▼
POST /api/ai/chat
    │
    ├─ Authenticate (Clerk)
    ├─ Add to message history
    │
    ▼
Chat Agent (chat-agent.ts)
    │
    ├─ Parse message
    ├─ Build context (user profile, today's schedule)
    │
    ▼
Claude API (with Tools)
    │
    ├─ System Prompt + Message
    ├─ Available Tools:
    │  ├─ getEvents()
    │  ├─ getRoutines()
    │  ├─ getGoals()
    │  ├─ getProjects()
    │  ├─ getStandaloneTasks()
    │  ├─ addBlock()
    │  ├─ removeBlock()
    │  ├─ modifyBlock()
    │  └─ searchConversations()
    │
    ▼
Claude Response
    │
    ├─ Text Response ──────────► UI Display
    ├─ Tool Calls ──────────────► Execute & Apply
    ├─ Schedule Changes ────────► Update UI + Persist
    │
    ▼
Return to Frontend
    │
    └─► Message Component
        + Optional Schedule Updates
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│  clerkId | name | email | occupation | workHours | bio     │
├────────────────┬────────────────────┬────────────────────────┤
                 │                    │
        ┌────────▼────────┐   ┌───────▼────────┐
        │      DAYS       │   │     GOALS      │
        │  date | blocks[]│   │  content |     │
        │  perf | history │   │  deadline|     │
        └────────┬────────┘   │  color  | userId
                 │            └───────┬────────┘
        ┌────────▼────────┐            │
        │     BLOCKS      │     ┌──────▼──────┐
        │  title | time   │     │  PROJECTS   │
        │  type | duration│     │  name |goalId
        │  tasks[]        │     │  deadline   │
        │  metadata       │     └──────┬──────┘
        └────────┬────────┘            │
                 │            ┌────────▼────────┐
        ┌────────▼────────┐   │     TASKS      │
        │     TASKS       │   │  title |proj   │
        │  title |duration│   │  duration      │
        │  completed |goal │   │  completed     │
        └─────────────────┘   └────────────────┘

        ┌─────────────────────────────────────┐
        │      OTHER COLLECTIONS              │
        ├─────────────────────────────────────┤
        │ EVENTS (userId, startTime, endTime) │
        │ ROUTINES (userId, days[], time)     │
        │ CHAT (userId, dayId, messages)      │
        │ SESSION (userId, auth data)         │
        └─────────────────────────────────────┘
```

---

## Keyboard Navigation State Machine

```
┌──────────────────────┐
│    VIEW LEVEL        │
│  (Top-level focus)   │
└────────────┬─────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
   Between        Block
   Position       Selected
   (gaps)         (focus)
      │             │
      │      ┌──────┴──────┐
      │      ▼             ▼
      │     Block      Enter/Down
      │     Render    (for tasks)
      │      │             │
      │      │     ┌───────▼──────┐
      │      │     ▼              ▼
      │      │   Task         Task Edit
      │      │   Input         Mode
      │      │    List           │
      │      │     │      ┌──────┴──────┐
      │      │     │      ▼             ▼
      │      │     │   Name         Duration
      │      │     │    Edit         Edit
      │      │     │
      └──────┴─────┴─ Escape ──► VIEW LEVEL
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────┐
│            Clerk Authentication                     │
│  (Managed by @clerk/nextjs)                         │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Login/Signup    │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ User Created    │
        │ in Clerk        │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Sync to MongoDB │
        │ (create User    │
        │  document)      │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ User Can Access │
        │ /app routes     │
        └────────┬────────┘
                 │
        ┌────────▼────────────┐
        │ Every API call uses │
        │ auth() from Clerk   │
        │ to get userId       │
        └─────────────────────┘
```

---

## Component Communication Patterns

### Props Drilling (Schedule View)
```
page.tsx (App State)
  │
  ├─► ScheduleView (blocks, handlers)
  │   │
  │   ├─► Block (single block, handlers)
  │   │   │
  │   │   └─► Task (task in block, toggle)
  │   │
  │   └─► BlockTimeMenu (time selection)
  │
  └─► AIChatPanel (chat state)
```

### Context API (Inventory View)
```
AppContext.tsx
  │
  ├─ Provides: blocks, goals, events, etc.
  ├─ Methods: addBlock, updateEvent, etc.
  │
  └─► InventoryView (useContext)
      │
      ├─► GoalsList (useContext)
      ├─► ProjectsList (useContext)
      ├─► EventsList (useContext)
      └─► RoutinesList (useContext)
```

### Custom Hooks
```
page.tsx
  │
  ├─ useBlockManagement()
  │  └─ Returns: blocks, selectedIndex, handlers
  │
  ├─ useCommandSystem()
  │  └─ Returns: command context, execution
  │
  ├─ useDayDataLoader()
  │  └─ Returns: day data, refresh methods
  │
  └─ useKeyboardCommands()
     └─ Returns: keyboard event handling
```

---

## Performance Considerations

```
RENDERING OPTIMIZATION
├─ Memoization
│  ├─ Block components memoized
│  └─ List items optimized
│
├─ Virtual Scrolling
│  └─ Not currently used
│     (could improve large inventories)
│
└─ Code Splitting
   ├─ Dynamic imports for heavy components
   └─ Mobile components lazy loaded

STATE MANAGEMENT OPTIMIZATION
├─ Local State for UI (popups, inputs)
├─ Context for shared data
├─ Optimistic Updates
│  ├─ UI changes immediately
│  └─ Rollback on API failure
│
└─ Caching
   ├─ SWR for data fetching
   ├─ Prevent concurrent requests
   └─ Refs for loading states

API OPTIMIZATION
├─ Single Data Fetch (/api/you)
│  └─ Gets all user data at once
│
├─ Batch Operations
│  └─ Add multiple tasks at once
│
├─ Debounced Saves
│  └─ Reduce API calls on typing
│
└─ Lazy Loading
   └─ Load future days on demand
```

---

## File Organization Best Practices

```
/app
  /app          ← Main application entry (3435 lines)
  /api          ← Backend API routes (65+ endpoints)
  /components
    /schedule   ← Schedule/timeline specific
    /inventory  ← Inventory/backlog specific
    /mobile     ← Mobile-only components
    /[shared]   ← Shared components
  /context      ← React Context definitions
  /core         ← Business logic
    /commands   ← Command system
  /hooks        ← Custom React hooks
  /lib          ← Utilities & helpers
  /utils        ← Helper functions

/models         ← MongoDB Mongoose schemas
/lib            ← Server-only utilities
/public         ← Static assets
```

---

## Development Workflow

```
Make Changes
    │
    ├─► TypeScript Compilation
    │   (catches type errors)
    │
    ├─► ESLint Check
    │   (code quality)
    │
    └─► Development Server (npm run dev)
        │
        └─► Hot Reload
            (instant feedback)

When Ready to Deploy
    │
    ├─► npm run build
    │   (Next.js build process)
    │
    ├─► Push to Git (branch 3.0)
    │
    └─► Vercel Auto-Deploy
        (on push to main)
```

---

## Deployment Architecture

```
┌─────────────────────────────────────┐
│         GitHub (Source)             │
└────────────────┬────────────────────┘
                 │
                 │ (Push to main)
                 │
        ┌────────▼────────┐
        │   Vercel Build  │
        │   • npm run build│
        │   • Compile TS  │
        └────────┬────────┘
                 │
        ┌────────▼────────────────┐
        │  Vercel Functions       │
        │  • API routes deployed  │
        │  • Cron jobs enabled    │
        └────────┬────────────────┘
                 │
        ┌────────▼──────────────┐
        │  MongoDB (Cloud)      │
        │  • Data persistence   │
        │  • Indexes enabled    │
        └───────────────────────┘

External Services (via env vars)
├─ Clerk (Auth)
├─ Upstash (Redis)
├─ ImageKit (Media)
├─ Anthropic API (Claude)
└─ OpenAI API (Fallback)
```

---

**Note**: This architecture is current as of November 2025, branch 3.0 (development).
