# Comprehensive Codebase Investigation: eb-todo-app-v2

## Executive Summary

**eb-todo-app-v2** (branded as **"Daybook"**) is a sophisticated AI-powered productivity scheduling application built with modern web technologies. It's a full-stack Next.js application that combines calendar/schedule management with an inventory system for goals, projects, routines, and events, enhanced with Claude AI integration for intelligent schedule planning.

---

## 1. PROJECT OVERVIEW & BUSINESS GOALS

### Core Purpose
Daybook is a keyboard-first productivity tool that helps users plan their day in plain text. The application enables users to:
- Create and manage daily schedules with time-blocked activities
- Organize goals, projects, routines, and events in a centralized inventory
- Use AI-powered chat to generate optimized schedules
- Track task completion and performance metrics

### Target Users
- Productivity-focused professionals and entrepreneurs
- Knowledge workers who prefer keyboard-driven interfaces
- Users comfortable with terminal/command-palette paradigms
- Teams/individuals managing complex project portfolios

### Key Marketing/Vision Points (from HOMEPAGE_VISION.md)
- **Tagline**: "Plan your day in plain text"
- **Core Differentiation**: Keyboard-first, minimal UI (Bloomberg terminal aesthetic)
- **Design Philosophy**: "Command palette" style interaction
- **Primary Features Highlighted**:
  1. Timeline - Schedule deep work blocks with visual clarity
  2. Inventory - Track goals, projects, routines in one organized view
  3. Command - Type, don't click; every action is a keystroke away

---

## 2. FEATURES & FUNCTIONALITY

### 2.1 Core Features

#### Schedule Management (Timeline View)
- **File**: /Users/rorihinds/eb-todo-app-v2/app/app/page.tsx (3435 lines)
- **Components**: ScheduleView, TimelineView, Block, BlockTimeMenu
- **Capabilities**:
  - Visual timeline display of daily blocks
  - Time-blocking with drag-and-drop reordering
  - Block types: deep-work, admin, break, meeting, personal, event, routine
  - Real-time task management within blocks
  - Task completion tracking

#### Inventory System
- **Components**: InventoryView, GoalsList, ProjectsList, EventsList, RoutinesList, AdminTasksList
- **Main File**: /Users/rorihinds/eb-todo-app-v2/app/components/inventory/InventoryView.tsx (456KB - massive component)
- **Sections**:
  1. **Goals** - Top-level objectives with deadlines and color-coding
  2. **Projects** - Goal-linked projects with sub-tasks
  3. **Admin Tasks** - Standalone backlog items (personal, work, health)
  4. **Routines** - Recurring activities with day/time specifications
  5. **Events** - Calendar events (recurring or one-time)

#### AI Chat Panel
- **File**: /Users/rorihinds/eb-todo-app-v2/app/components/schedule/AIChatPanel.tsx
- **Capabilities**:
  - Natural language interaction with Claude AI
  - Schedule generation from user requests
  - Block and task management via chat
  - Context-aware suggestions based on user profile and patterns

#### Mobile Support
- **Components**: MobileAppView, MobileInventoryView, MobileScheduleView
- **Features**:
  - Touch-optimized interface for mobile devices
  - Responsive layout adaptation
  - Mobile-specific navigation patterns

### 2.2 Data Model Relationships

```
User (Clerk Auth)
├── Profile (name, email, occupation, work hours, sleep schedule)
├── Goals (multiple)
│   ├── Projects (multiple per goal)
│   │   └── Tasks (multiple per project)
│   ├── Events (linked to goal or standalone)
│   └── Routines (linked to goal or standalone)
│
├── Events (calendar events)
│   ├── Properties: name, startTime, endTime, isRecurring, recurringDays
│   ├── Linked to Blocks via metadata.eventId
│   └── Can be included in daily schedules
│
├── Routines (recurring activities)
│   ├── Properties: name, days[], startTime, duration, startDate, endDate
│   ├── Tasks (associated with routine)
│   └── Linked to Blocks via metadata.routineId
│
├── Admin Tasks (standalone backlog)
│   └── Category-based organization (personal, work, admin, health)
│
├── Days (daily schedule container)
│   ├── date (YYYY-MM-DD string)
│   ├── Blocks (ordered list)
│   │   ├── title, time, duration, type
│   │   ├── Tasks (nested)
│   │   ├── metadata (zoom link, location, eventId, routineId)
│   │   └── note (reflection/notes on block)
│   ├── performanceRating (score, comment)
│   └── promptHistory (AI interactions for that day)
│
└── Chat History (per day)
    ├── Messages (user and AI)
    └── Metadata (actions, entities, tools used)
```

**Data Files**: /Users/rorihinds/eb-todo-app-v2/models/
- Block.ts - Schedule blocks (with type enum, duration, tasks)
- Event.ts - Calendar events (with recurring options)
- Goal.ts - Goals with deadlines and color gradients
- Project.ts - Goal-linked projects with task arrays
- Routine.ts - Recurring activities
- Task.ts - Individual tasks (with title, duration, completion)
- Day.ts - Daily schedule container
- Chat.ts - Chat history with metadata and indexing
- User.ts - User profile with preferences
- Session.ts - Session management

---

## 3. UX/UI DESIGN

### 3.1 Frontend Framework
- **Framework**: Next.js 14.2.5
- **UI Library**: React 18
- **Component Library**: Radix UI (headless, accessible components)
- **Icons**: Lucide React
- **Drag & Drop**: dnd-kit (with Sortable and modifiers)
- **Animations**: Framer Motion

### 3.2 Navigation Structure

#### Main Navigation
1. **Schedule View** (Timeline)
   - Primary daily schedule interface
   - Block-focused navigation
   - Task management within blocks
   
2. **Inventory View** (The "You" section)
   - Goals, Projects, Events, Routines, Admin Tasks
   - Tabbed or sectioned interface
   - Inline editing for quick updates

3. **AI Chat Panel** (Side panel or modal)
   - Natural language input
   - Schedule generation
   - Task suggestions

#### Keyboard Navigation System
- **Arrow Keys**: Navigate between blocks and "between" positions (gaps)
- **Tab**: Move through inputs and task fields
- **Enter**: Select/confirm, open blocks for task management
- **Escape**: Exit edit mode, cancel typing
- **Command Palette** (Cmd+K): Global command access
- **Slash Commands** (/): Context-aware command shortcuts

**Navigation Management Files**:
- /Users/rorihinds/eb-todo-app-v2/app/hooks/useCommandSystem.ts
- /Users/rorihinds/eb-todo-app-v2/app/core/commands/CommandContextManager.ts
- NAVIGATION_REFACTOR.md - Documents ongoing navigation improvements

### 3.3 UI Components Architecture

#### Schedule Components
- **ScheduleView.tsx** - Main schedule container (props for blocks, selection, handlers)
- **Block.tsx** (42KB) - Individual block rendering with extensive keyboard handling
- **TimelineView.tsx** - Visual timeline display
- **BlockTimeMenu.tsx** - Time selection popup
- **BlockTypeMenu.tsx** - Block type selector

#### Inventory Components
- **InventoryView.tsx** - Main inventory container (456KB - monolithic)
- **GoalsList.tsx** - Goals section with CRUD operations
- **ProjectsList.tsx** - Projects with task management
- **EventsList.tsx** - Calendar events (34KB)
- **RoutinesList.tsx** - Recurring activities (28KB)
- **AdminTasksList.tsx** - Backlog tasks (20KB)

#### Input/Popup Components
- **TaskCreationPopup.tsx** - Task input modal
- **DeadlinePickerPopup.tsx** - Date selection
- **TimeRangePopup.tsx** - Start/end time picker
- **DurationPickerPopup.tsx** - Duration selector
- **EditTextPopup.tsx** - Inline text editing

#### AI Chat Components
- **AIChatPanel.tsx** - Chat interface
- **AIChat.tsx** - Chat logic
- **AIChatInterface.tsx** - Message display and input
- **CudChatDisplay.tsx** - Chat message formatting

### 3.4 Styling Approach

#### Typography System
**Fonts** (from layout.tsx):
- **Primary**: Inter (sans-serif) - body text, UI elements
- **Secondary**: Lora (serif) - headings, branding

**Configuration**: /Users/rorihinds/eb-todo-app-v2/app/layout.tsx
```typescript
const inter = Inter({ subsets: ["latin"] });
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lora"
});
```

#### Styling Technology
- **Tailwind CSS** (utility-first)
- **Custom CSS** with CSS variables for theming
- **Class Variance Authority** (CVA) for component variants
- **Tailwind Merge** for class combination

#### Design System/Color Scheme
From globals.css and tailwind.config.ts:
- **Primary Colors**: Dark gray (gray-900, #111827)
- **Backgrounds**: White/light gray (bg-gray-50, #FFFFFF)
- **Accent Colors**: Multiple gradients for goal color-coding
  - Pink, rose, purple, blue, green, orange, indigo
- **Border Color**: Light gray (#E5E7EB)
- **Text Colors**: Gray-900 (headings), Gray-700 (body), Gray-600 (secondary)

#### Tailwind Configuration
- **File**: /Users/rorihinds/eb-todo-app-v2/tailwind.config.ts
- **Custom Variables**: Lora font family, color system
- **Safelist**: Dynamic class list for color-coded goals
- **Animations**: Accordion transitions, custom pulse animations

---

## 4. BRANDING & VISUAL IDENTITY

### 4.1 Application Name
- **Primary Brand**: "Daybook"
- **Secondary References**: "ScheduleGenius" (legacy references), "Daybook" (current)

### 4.2 Branding Elements

#### Logo & Assets
- Logo files: /Users/rorihinds/eb-todo-app-v2/public/
  - D (1024 x 1024 px).png (Primary logo)
  - daybookicon.png (Icon version)
  - Logo-02.svg, Logo-04.svg (Alternative versions)
  - favicon.png, favicon40x40.png (Browser icons)

#### Color Palette
- **Primary**: Dark gray (#111827 / gray-900)
- **Secondary**: Light backgrounds (white, gray-50)
- **Accent Gradients**: For goal color-coding
  - from-pink-100 to-rose-100
  - from-purple-100 to-indigo-100
  - from-blue-100 to-cyan-100
  - etc.

#### Typography Identity
- **Serif (Lora)**: Used for:
  - Hero title on homepage ("Daybook")
  - Feature descriptions
  - Body text in cards
- **Mono (Inter)**: Used for:
  - Keyboard shortcuts display
  - Metadata and timestamps
  - Command palette hints

#### Design Aesthetic
- **Terminal-inspired**: Bloomberg terminal aesthetic
- **Minimal**: Clean, uncluttered interface
- **Keyboard-centric**: Visual emphasis on keyboard shortcuts
- **Typography-focused**: Type as the primary design element

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Frontend Stack
- **Framework**: Next.js 14.2.5 (React 18)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React Context API + useState hooks
- **HTTP Client**: SWR 2.2.5 (for data fetching)
- **Data Validation**: Zod 3.25.76

### 5.2 Backend Stack
- **Runtime**: Node.js (Next.js API routes)
- **Database**: MongoDB 6.8.0
- **ORM**: Mongoose 8.5.2
- **Authentication**: Clerk (auth management)
- **Job Scheduling**: Agenda 5.0.0 (for cron jobs)

### 5.3 AI/LLM Integration
- **Primary Model**: Claude (Anthropic) via @anthropic-ai/sdk
- **Secondary**: OpenAI (via @ai-sdk/openai)
- **AI SDK**: Vercel AI SDK (@ai-sdk/anthropic, @ai-sdk/openai)
- **Tool Integration**: Claude has access to custom tools for:
  - Schedule manipulation (add/remove/modify blocks)
  - Inventory access (read goals, projects, events, routines)
  - Chat history search
  - User profile context

### 5.4 Database Schema

**Connection**: MongoDB via Mongoose
**Collections**:

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| users | User profiles | clerkId, name, email, occupation, workHours, sleepSchedule |
| days | Daily schedules | user, date, blocks[], performanceRating, promptHistory |
| blocks | Schedule time blocks | dayId, title, time, duration, type, tasks[], metadata |
| tasks | Individual tasks | title, duration, completed, projectId, routineId |
| goals | Top-level objectives | userId, content, deadline, color, order |
| projects | Goal-linked projects | userId, goalId, name, tasks[], deadline |
| routines | Recurring activities | userId, name, days[], startTime, duration, startDate, endDate |
| events | Calendar events | userId, name, startTime, endTime, isRecurring, recurringDays |
| chats | Chat history | userId, dayId, role, message, metadata |

**Indexes**: Optimized for:
- userId queries
- date range queries
- text search on messages
- timestamp-based sorting

### 5.5 API Architecture

#### API Routes Location
`/Users/rorihinds/eb-todo-app-v2/app/api/`

#### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/you | GET | Fetch user profile and inventory (Goals, Projects, Events, Routines, Admin Tasks) |
| /api/get-today | GET | Get today's schedule |
| /api/get-day | GET | Get specific day's schedule |
| /api/days/[id] | GET/PUT/DELETE | Day CRUD operations |
| /api/blocks/* | GET/POST/PUT/DELETE | Block management |
| /api/events/* | GET/POST/PUT/DELETE | Event management |
| /api/events/recurring | GET | Fetch recurring events for date |
| /api/admin-tasks | GET/POST/DELETE | Admin task management |
| /api/ai/chat | POST | AI chat endpoint (tool-based agent) |
| /api/ai/schedule-plan | POST | AI schedule generation |
| /api/ai/tools/* | POST | Individual AI tool endpoints |
| /api/chat | POST | Chat history storage |
| /api/cron/* | POST | Scheduled job endpoints |

#### AI Chat Agent Architecture
**File**: /Users/rorihinds/eb-todo-app-v2/app/api/ai/chat/route.ts

1. **Chat Endpoint** receives user message
2. **chatAgent.processMessage()** (from chat-agent.ts) is called
3. Chat agent uses Claude with tool definitions:
   - Schedule manipulation tools
   - Inventory read tools
   - User profile tools
   - Historical data tools
4. Returns structured response with text and optional data updates

### 5.6 State Management

#### Context-Based State
**AppContext.tsx** manages:
- Blocks and block operations
- Selected block/task indices
- Day data (today/tomorrow)
- Goals, Events, Routines, Projects
- Inventory refresh triggers

#### Hook-Based State Management
**Custom Hooks**:
- `useBlockManagement()` - Block CRUD and drag-drop
- `useCommandSystem()` - Command palette and keyboard navigation
- `useDayDataLoader()` - Data fetching and day switching
- `useAIChat()` - Chat message management
- `useKeyboardCommands()` - Keyboard event handling
- `useAutoSave()` - Debounced persistence

#### Component-Level State
- Local state in ScheduleView, InventoryView
- Input states (taskInput, commandInput)
- Editing states (isEditingBlock, isEditingTask)
- Popup/modal visibility states

### 5.7 Data Flow

#### Schedule Creation Flow (from AI_MODEL_ARCHITECTURE.md)
```
User → AI Chat → Claude with Tools
         ↓
    Calls Schedule Tools
         ↓
    [getEvents + getRoutines + getGoals + getProjects + getTasks]
         ↓
    Applies Priority Algorithm:
    1. Fixed events (non-negotiable)
    2. Flexible routines
    3. High-priority project tasks
    4. Goal-aligned activities
    5. Standalone tasks
    6. Buffers/breaks
         ↓
    Generates/Updates Day.blocks
         ↓
    Returns to Frontend → UI Update
```

#### Data Persistence Flow
1. **Optimistic Updates**: UI updates immediately
2. **API Call**: Send to backend (/api/blocks, /api/events, etc.)
3. **Database Update**: MongoDB stores changes
4. **Confirmation**: Returns updated document
5. **Error Handling**: Revert UI on failure

---

## 6. CURRENT ISSUES & RECENT WORK

### 6.1 Recent Commits (Last 30)

**Branch**: 3.0
**Recent Focus**: Keyboard navigation fixes and input handling

| Commit | Date | Description |
|--------|------|-------------|
| 9e97ffd | Nov 5 | Fix: prevent arrow keys from moving input in all sections (Projects, Admin Tasks, Routines, Events) |
| 5a51fe9 | Oct 30 | Fix: handle intermediate input positions when navigating with arrows in Goals |
| ddfbcaf | Oct 30 | Fix: prevent arrow keys from moving input position while typing in Goals |
| cdde816 | Oct 30 | Fix: prevent Tab key from bubbling to browser at task levels |
| f5df7c9 | Oct 30 | Fix: remove stale metadata spread that was overwriting correct event values |
| a93051d | Oct 30 | Fix: update event fields at top level in local state for proper persistence |
| c03fdb7 | Oct 28 | Fix: add missing location field to Event model schema |
| e5689c9 | Oct 28 | Fix: event persistence - update local state without triggering parent refresh |
| 0fca453 | Oct 28 | Fix: trigger parent data reload after event save |

**Pattern**: Heavy focus on keyboard navigation, input handling, and event persistence issues.

### 6.2 Known Issues/TODOs

**File References**:
- /Users/rorihinds/eb-todo-app-v2/app/components/inventory/InventoryView.tsx:
  - Line reference (TODO): Show error to user and optionally revert optimistic update

### 6.3 Work in Progress

#### Navigation System Refactoring
**Documentation**: NAVIGATION_REFACTOR.md
- Current: Multiple overlapping state variables
- Proposed: Single unified navigation state
- Benefit: Cleaner state management, easier testing

#### Edit Mode Implementation
**Documentation**: EDIT_MODE_PROPOSAL.md
- Status: Design phase
- Approach: Inline editing for blocks and tasks
- Keyboard shortcuts for quick edits (Shift+T for time, Shift+D for duration)

#### Inventory Management
**Current State**: Monolithic InventoryView component (456KB)
**Issues**:
- Difficult to maintain and test
- Complex keyboard navigation in each section
- Recently fixed: Arrow key navigation in Goals, Projects, Routines, Events
- Recently fixed: Event persistence issues with metadata

### 6.4 Performance Considerations

**Large Component**: InventoryView.tsx (456KB)
- Handles Goals, Projects, Events, Routines, Admin Tasks
- Contains extensive keyboard navigation logic
- Manages inline editing and popups
- Recent optimization: Separated into logical sections with individual state management

**Data Loading**: useDayDataLoader hook
- Fetches today/tomorrow data on mount
- Implements caching to prevent concurrent fetches
- Uses refs to prevent race conditions

**API Patterns**:
- SWR for data fetching with caching
- Optimistic UI updates
- Debounced saves for input fields
- Batch operations where possible

---

## 7. DEPLOYMENT & INFRASTRUCTURE

### 7.1 Deployment Platform
- **Host**: Vercel (Next.js native)
- **Configuration**: vercel.json in root
- **Environment**: Production branch deployment

### 7.2 Environment Variables
**Required** (from .env.example):
- MONGODB_URI
- CLERK_SECRET_KEY
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ANTHROPIC_API_KEY
- OPENAI_API_KEY (optional)
- PRISMIC_ACCESS_TOKEN (optional)
- BLOG_ADMIN_PASSWORD (optional)

**Special Notes**:
- Agenda.js handles scheduling automatically
- No separate cron setup needed

### 7.3 Notable Features
- Vercel KV (Redis) via @upstash/redis for caching
- Feedback system via @upstash/feedback
- ImageKit integration for image management/optimization

---

## 8. DIRECTORY STRUCTURE SUMMARY

```
/Users/rorihinds/eb-todo-app-v2/
├── /app
│   ├── /app/                    # Main app route (3435 lines)
│   ├── /api                     # API routes (65 endpoints)
│   ├── /components
│   │   ├── /schedule/           # Schedule/timeline components
│   │   ├── /inventory/          # Inventory section components (29 files)
│   │   ├── /mobile/             # Mobile-specific components
│   │   └── /CommandPaletteModal/
│   ├── /context                 # React Context (AppContext)
│   ├── /core/commands/          # Command system
│   ├── /hooks/                  # Custom React hooks (7 files)
│   ├── /lib
│   │   ├── /ai/                 # AI integration (chat-agent, tools)
│   │   ├── /auth/               # Authentication utilities
│   │   └── [db utilities]
│   ├── /utils                   # Utility functions
│   └── globals.css
│
├── /models                      # MongoDB schemas (12 files)
├── /lib                         # Server-side utilities
├── /public                      # Static assets (logos, icons, og-image)
├── /slices                      # Prismic CMS content slices
├── /prompts                     # AI system prompts
├── /dialog                      # Dialog/modal templates
├── /helpers                     # Helper functions
├── /types                       # TypeScript type definitions
│
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies
│
└── [Documentation]
    ├── README.md
    ├── HOMEPAGE_VISION.md       # Design vision for landing page
    ├── AI_MODEL_ARCHITECTURE.md # AI integration details
    ├── NAVIGATION_REFACTOR.md   # Navigation system improvements
    ├── EDIT_MODE_PROPOSAL.md    # Keyboard editing proposal
    └── [Other planning docs]
```

---

## 9. CODE METRICS & STATISTICS

| Metric | Value |
|--------|-------|
| Main App File | 3,435 lines (app/app/page.tsx) |
| Inventory Component | 456 KB (largest single component) |
| Total API Endpoints | 65+ |
| Database Collections | 9 |
| Custom Hooks | 7 |
| UI Component Library | Radix UI (30+ components) |
| Git Branch | 3.0 (development branch) |
| Recent Commits | Focused on keyboard navigation |

---

## 10. KEY TECHNOLOGIES AT A GLANCE

### Frontend
- Next.js 14.2.5, React 18, TypeScript 5
- Tailwind CSS, Radix UI, Framer Motion
- dnd-kit (drag-drop), SWR (data fetching)

### Backend
- Node.js/Next.js API routes
- MongoDB + Mongoose
- Clerk authentication

### AI/ML
- Claude (Anthropic) primary model
- OpenAI secondary
- Tool-based agent architecture

### Infrastructure
- Vercel deployment
- Redis (Upstash) for caching
- ImageKit for image management

### Development
- TypeScript for type safety
- ESLint for code quality
- Clerk SDK for authentication

---

## 11. COMPREHENSIVE FEATURE MAP

### User-Facing Features
1. **Daily Schedule Management**
   - Visual timeline with time blocks
   - Drag-and-drop reordering
   - Block type selection (7 types)
   - Task management within blocks
   
2. **Inventory Organization**
   - Goals with deadlines and progress
   - Projects (goal-linked) with tasks
   - Routines (recurring activities)
   - Events (calendar integration)
   - Admin tasks (backlog)

3. **AI-Powered Features**
   - Schedule generation from natural language
   - Intelligent task suggestions
   - Context-aware recommendations
   - Chat history with metadata

4. **Keyboard-First Interface**
   - Command palette (Cmd+K)
   - Arrow key navigation
   - Tab navigation through inputs
   - Slash commands for quick actions
   - Keyboard shortcuts display

5. **Analytics & Tracking**
   - Daily performance rating
   - Task completion metrics
   - Historical schedule patterns
   - Prompt history per day

### Technical Features
1. **Authentication**
   - Clerk-based user authentication
   - Secure API access
   
2. **Data Persistence**
   - MongoDB for persistent storage
   - Optimistic UI updates
   - Automatic debounced saving
   
3. **Mobile Support**
   - Responsive design
   - Touch-optimized components
   - Mobile-specific navigation
   
4. **Real-time Updates**
   - WebSocket ready (not yet implemented)
   - Polling via SWR
   - Optimistic updates for snappy UX

---

## 12. IMPORTANT FILE REFERENCES FOR KEY CONCEPTS

### Core Application Logic
- **Main Page**: /Users/rorihinds/eb-todo-app-v2/app/app/page.tsx
- **App Context**: /Users/rorihinds/eb-todo-app-v2/app/context/AppContext.tsx
- **Layout**: /Users/rorihinds/eb-todo-app-v2/app/layout.tsx

### Schedule Management
- **ScheduleView**: /Users/rorihinds/eb-todo-app-v2/app/components/schedule/ScheduleView.tsx
- **Block Component**: /Users/rorihinds/eb-todo-app-v2/app/components/schedule/Block.tsx
- **Block Model**: /Users/rorihinds/eb-todo-app-v2/models/Block.ts

### Inventory System
- **InventoryView**: /Users/rorihinds/eb-todo-app-v2/app/components/inventory/InventoryView.tsx
- **Goal Management**: /Users/rorihinds/eb-todo-app-v2/app/components/inventory/GoalsList.tsx
- **Event Management**: /Users/rorihinds/eb-todo-app-v2/app/components/inventory/EventsList.tsx
- **Routine Management**: /Users/rorihinds/eb-todo-app-v2/app/components/inventory/RoutinesList.tsx

### AI Integration
- **Chat Agent**: /Users/rorihinds/eb-todo-app-v2/app/lib/ai/chat-agent.ts
- **Chat Route**: /Users/rorihinds/eb-todo-app-v2/app/api/ai/chat/route.ts
- **AI Tools**: /Users/rorihinds/eb-todo-app-v2/app/lib/ai/tools/
- **Architecture Doc**: /Users/rorihinds/eb-todo-app-v2/AI_MODEL_ARCHITECTURE.md

### Keyboard Navigation
- **Command System**: /Users/rorihinds/eb-todo-app-v2/app/core/commands/
- **useCommandSystem Hook**: /Users/rorihinds/eb-todo-app-v2/app/hooks/useCommandSystem.ts
- **useKeyboardCommands Hook**: /Users/rorihinds/eb-todo-app-v2/app/hooks/useKeyboardCommands.ts
- **Navigation Docs**: /Users/rorihinds/eb-todo-app-v2/NAVIGATION_REFACTOR.md

### Styling
- **Tailwind Config**: /Users/rorihinds/eb-todo-app-v2/tailwind.config.ts
- **Global Styles**: /Users/rorihinds/eb-todo-app-v2/app/globals.css
- **Component Library**: Radix UI (via npm)

### Database
- **Models**: /Users/rorihinds/eb-todo-app-v2/models/ (12 TypeScript files)
- **MongoDB Connection**: /Users/rorihinds/eb-todo-app-v2/lib/mongo.ts

---

## 13. DEVELOPMENT NOTES

### Current Development Branch
- **Branch Name**: 3.0
- **Status**: Active development
- **Focus**: Keyboard navigation improvements, event/routine persistence

### Code Quality Observations
1. **Strong Points**:
   - TypeScript throughout (type-safe)
   - Consistent API patterns
   - Clear separation of concerns (models, components, utils)
   - Comprehensive keyboard handling
   
2. **Areas for Improvement**:
   - InventoryView.tsx is monolithic (456KB) - could be split
   - Some TODO comments for error handling
   - Navigation system undergoing refactoring
   - Multiple state variables that could be unified

### Testing Status
- No test files visible in directory structure
- Deployment checklist suggests manual testing

### Documentation Quality
- Excellent architecture documentation (AI_MODEL_ARCHITECTURE.md)
- Design vision well articulated (HOMEPAGE_VISION.md)
- Deployment guide provided (DEPLOYMENT_CHECKLIST.md)
- Navigation refactoring proposal documented

---

## CONCLUSION

**Daybook** is a sophisticated, full-featured productivity application that successfully combines:
- A polished, modern UI using Next.js and React
- Keyboard-first interaction design inspired by terminal interfaces
- MongoDB for flexible data modeling
- Claude AI for intelligent schedule generation and interaction
- A comprehensive inventory system for goals, projects, events, and routines

The application demonstrates good architectural decisions with clear separation between frontend components, backend API routes, and database models. Recent work has focused on improving keyboard navigation and fixing event persistence issues, indicating active development and refinement of the core user experience.

The codebase shows maturity in its API design, state management patterns, and UI component organization, though some components (notably InventoryView) could benefit from further modularization.
