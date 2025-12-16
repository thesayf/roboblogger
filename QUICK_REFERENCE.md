# Daybook - Quick Reference Guide

## What is Daybook?
A **keyboard-first AI-powered productivity scheduler** that helps users plan their day in plain text.

**Tagline**: "Plan your day in plain text"  
**Brand**: Daybook (formerly ScheduleGenius)  
**Type**: Full-stack Next.js SaaS  
**Target Users**: Keyboard-focused productivity professionals  

---

## Key Statistics

| Metric | Value |
|--------|-------|
| **Lines of Code** | Main app: 3,435 (app/app/page.tsx) |
| **Largest Component** | InventoryView: 456 KB |
| **Total API Endpoints** | 65+ |
| **Database Collections** | 9 (MongoDB) |
| **Custom React Hooks** | 7 |
| **UI Component Library** | Radix UI |
| **Development Branch** | 3.0 |
| **Latest Focus** | Keyboard navigation fixes |

---

## Core Components

### 1. Schedule View (Timeline)
**Files**: 
- `/app/app/page.tsx` - Main orchestrator (3435 lines)
- `/app/components/schedule/ScheduleView.tsx` - View container
- `/app/components/schedule/Block.tsx` - Individual blocks (42 KB)

**Features**:
- Visual timeline of daily blocks
- 7 block types: deep-work, admin, break, meeting, personal, event, routine
- Drag-and-drop reordering
- Task management within blocks

### 2. Inventory System
**Files**: 
- `/app/components/inventory/InventoryView.tsx` - Main container (456 KB)
- `/app/components/inventory/GoalsList.tsx` - Goals
- `/app/components/inventory/ProjectsList.tsx` - Projects
- `/app/components/inventory/EventsList.tsx` - Events (34 KB)
- `/app/components/inventory/RoutinesList.tsx` - Routines (28 KB)
- `/app/components/inventory/AdminTasksList.tsx` - Backlog (20 KB)

**Sections**:
1. **Goals** - Top-level objectives with deadlines
2. **Projects** - Goal-linked work items
3. **Admin Tasks** - Standalone backlog
4. **Routines** - Recurring activities
5. **Events** - Calendar events

### 3. AI Chat Panel
**Files**:
- `/app/components/schedule/AIChatPanel.tsx`
- `/app/lib/ai/chat-agent.ts`
- `/app/api/ai/chat/route.ts`

**Capabilities**:
- Natural language schedule generation
- Claude AI with tool definitions
- Context-aware suggestions
- Task creation from conversation

### 4. Mobile View
**Files**:
- `/app/components/mobile/MobileAppView.tsx`
- `/app/components/mobile/MobileScheduleView.tsx`
- `/app/components/inventory/MobileInventoryView.tsx`

---

## Data Model Hierarchy

```
User (Clerk Auth)
  ├─ Goals
  │   ├─ Projects
  │   │   └─ Tasks
  │   ├─ Events
  │   └─ Routines
  ├─ Admin Tasks (Standalone)
  ├─ Days (Schedule Container)
  │   ├─ Blocks
  │   │   ├─ Tasks
  │   │   └─ Metadata (eventId, routineId)
  │   ├─ Performance Rating
  │   └─ Prompt History
  └─ Chat History
```

**Database Models** (`/models/`):
- User.ts, Day.ts, Block.ts, Task.ts
- Goal.ts, Project.ts, Event.ts, Routine.ts
- Chat.ts, Session.ts

---

## Technology Stack

### Frontend
```
Next.js 14.2.5 + React 18
├─ TypeScript 5
├─ Tailwind CSS 3.4.1
├─ Radix UI (30+ components)
├─ dnd-kit (drag-drop)
├─ Framer Motion (animations)
├─ SWR (data fetching)
└─ Zod (validation)
```

### Backend
```
Next.js API Routes
├─ MongoDB 6.8.0
├─ Mongoose 8.5.2
├─ Clerk (Auth)
├─ Agenda (Scheduling)
└─ Node.js
```

### AI/LLM
```
Claude (Anthropic) [Primary]
├─ @anthropic-ai/sdk
├─ @ai-sdk/anthropic
└─ Tool-based agent architecture

OpenAI [Secondary]
├─ @ai-sdk/openai
└─ Vercel AI SDK
```

### Infrastructure
```
Vercel Deployment
├─ Upstash Redis
├─ ImageKit (Media)
└─ Clerk Authentication
```

---

## Keyboard Navigation

### Global Shortcuts
- **Cmd+K** - Open command palette
- **/** - Show slash commands
- **?** - Show keyboard shortcuts help

### Schedule View
- **Arrow Up/Down** - Navigate between blocks/gaps
- **Tab** - Navigate through inputs
- **Enter** - Select/confirm
- **Escape** - Exit edit mode

### Inventory View
- **Arrow Up/Down** - Navigate items
- **Arrow Left/Right** - Navigate sections
- **Tab** - Move through fields
- **Escape** - Cancel editing

---

## Design System

### Typography
- **Serif (Lora)**: Headings, branding, body text
- **Sans (Inter)**: UI elements, metadata
- **Mono (Inter)**: Keyboard shortcuts, code

### Color Palette
- **Primary**: Dark gray (#111827)
- **Background**: White/light gray
- **Accents**: Colorful gradients for goals
- **Borders**: Light gray (#E5E7EB)

### Aesthetic
- Terminal-inspired (Bloomberg terminal look)
- Minimal, clean interface
- Typography-focused design
- Keyboard-centric visual language

---

## Recent Development Work

### Latest Session (Nov 6, 2025)
1. ✅ **Smart scrolling for timeline cursor** - Added 200px bottom padding when navigating to TimelineView input positions (ScheduleView.tsx:232-285)
2. ✅ **Task move popup fixes** - Fixed Enter/Escape key handling using useRef for synchronous state tracking (InventoryView.tsx:254, 1252-1261, 8655, 8876)
3. ✅ **Paste-to-create-multiple-tasks** - Cmd+V creates multiple tasks from clipboard with optimistic UI updates (InventoryView.tsx:3198-3303)
   - Cleans bullet points and numbered lists automatically
   - Each line becomes a task with 30-min duration
   - Tasks inherit project due date
   - Maintains project context and sort order after creation
4. ✅ **Block time auto-suggestion fix** - Shows current time (rounded to 15min) when calculated time is in past (page.tsx:515-529, ScheduleView.tsx:164-199)

### Recent Fixes (Previous Weeks)
1. ✅ Arrow key navigation in all inventory sections
2. ✅ Event persistence with metadata
3. ✅ Input field positioning during editing
4. ✅ Tab key behavior prevention
5. ✅ Event/Routine location field additions

### Active Projects
1. **Navigation System Refactoring** - Unify state management
2. **Edit Mode Implementation** - Inline editing for blocks/tasks
3. **Component Modularization** - Split InventoryView (456KB)

### Known Issues
- InventoryView.tsx is too large (456KB) - needs splitting
- Error handling in optimistic updates (TODO comment in InventoryView)
- Navigation system has overlapping state variables

---

## API Architecture

### Main Endpoints
```
/api/you                    GET   User + Inventory
/api/get-today              GET   Today's Schedule
/api/get-day                GET   Specific Day
/api/days/[id]              *     Day CRUD
/api/blocks/*               *     Block CRUD
/api/events/*               *     Event CRUD
/api/admin-tasks            *     Task CRUD
/api/ai/chat                POST  Chat with Claude
/api/ai/schedule-plan       POST  Generate Schedule
/api/chat                   POST  Store Chat History
/api/cron/*                 POST  Scheduled Jobs
```

### AI Chat Flow
```
POST /api/ai/chat
  ├─ Authenticate (Clerk)
  ├─ Parse Message
  ├─ Call Claude with Tools
  ├─ Tools Access: Events, Routines, Goals, Projects, Tasks
  └─ Return Response + Optional Updates
```

---

## File Size Reference

| Component | Size | Purpose |
|-----------|------|---------|
| InventoryView.tsx | 456 KB | Main inventory (needs splitting) |
| page.tsx (main) | 3,435 lines | Main app orchestrator |
| Block.tsx | 42 KB | Schedule block rendering |
| EventsList.tsx | 34 KB | Events management |
| RoutinesList.tsx | 28 KB | Routines management |
| AdminTasksList.tsx | 20 KB | Backlog management |
| ProjectsList.tsx | 33 KB | Projects management |

---

## Common File Paths (Absolute)

### Core App
- `/Users/rorihinds/eb-todo-app-v2/app/app/page.tsx` - Main page
- `/Users/rorihinds/eb-todo-app-v2/app/layout.tsx` - Layout + theme
- `/Users/rorihinds/eb-todo-app-v2/app/context/AppContext.tsx` - State context

### Schedule
- `/Users/rorihinds/eb-todo-app-v2/app/components/schedule/ScheduleView.tsx`
- `/Users/rorihinds/eb-todo-app-v2/app/components/schedule/Block.tsx`

### Inventory
- `/Users/rorihinds/eb-todo-app-v2/app/components/inventory/InventoryView.tsx`

### AI
- `/Users/rorihinds/eb-todo-app-v2/app/lib/ai/chat-agent.ts`
- `/Users/rorihinds/eb-todo-app-v2/app/api/ai/chat/route.ts`

### Database
- `/Users/rorihinds/eb-todo-app-v2/models/` (12 schema files)

### Styling
- `/Users/rorihinds/eb-todo-app-v2/tailwind.config.ts`
- `/Users/rorihinds/eb-todo-app-v2/app/globals.css`

---

## Documentation Files

| File | Purpose |
|------|---------|
| CODEBASE_INVESTIGATION.md | This comprehensive overview |
| HOMEPAGE_VISION.md | Landing page design vision |
| AI_MODEL_ARCHITECTURE.md | AI system architecture |
| NAVIGATION_REFACTOR.md | Navigation system improvements |
| EDIT_MODE_PROPOSAL.md | Inline editing design |
| DEPLOYMENT_CHECKLIST.md | Vercel deployment guide |

---

## Environment Setup

```bash
# Required Environment Variables
MONGODB_URI=                    # MongoDB connection
CLERK_SECRET_KEY=               # Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
ANTHROPIC_API_KEY=              # Claude API
OPENAI_API_KEY=                 # GPT4 (optional)
IMAGEKIT_PUBLIC_KEY=            # Media management
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

---

## Development Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## Key Insights

### Strengths
- ✅ Strong keyboard-first UX design
- ✅ Comprehensive AI integration with Claude
- ✅ Clean API architecture with clear endpoints
- ✅ TypeScript throughout (type-safe)
- ✅ Excellent documentation
- ✅ Optimistic UI updates for snappy feel

### Areas for Improvement
- ⚠️ InventoryView.tsx is monolithic (456KB)
- ⚠️ Navigation state could be more unified
- ⚠️ Error handling in some optimistic updates
- ⚠️ No visible test suite
- ⚠️ Mobile optimization ongoing

### Active Development
- 🔄 Keyboard navigation system refactoring
- 🔄 Edit mode implementation
- 🔄 Component modularization
- 🔄 Event/Routine persistence fixes

---

## Quick Start for Developers

1. **Understanding the Architecture**
   - Read: AI_MODEL_ARCHITECTURE.md
   - Read: NAVIGATION_REFACTOR.md
   
2. **Making Changes to Schedule**
   - Main logic: `/app/app/page.tsx`
   - Schedule view: `/app/components/schedule/ScheduleView.tsx`
   - Block component: `/app/components/schedule/Block.tsx`

3. **Making Changes to Inventory**
   - Main component: `/app/components/inventory/InventoryView.tsx`
   - Goal list: `/app/components/inventory/GoalsList.tsx`
   - Event list: `/app/components/inventory/EventsList.tsx`
   - Routine list: `/app/components/inventory/RoutinesList.tsx`

4. **Adding AI Capabilities**
   - Chat route: `/app/api/ai/chat/route.ts`
   - Chat agent: `/app/lib/ai/chat-agent.ts`
   - Tools: `/app/lib/ai/tools/`

5. **Database Changes**
   - Models: `/models/`
   - API routes: `/app/api/`

---

**Last Updated**: November 6, 2025
**Branch**: 3.0 (development)
**Latest Session**: Paste feature + Smart scrolling + Block time fixes
