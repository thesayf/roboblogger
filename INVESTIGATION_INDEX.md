# Daybook Codebase Investigation - Document Index

A comprehensive investigation of the **eb-todo-app-v2** (Daybook) productivity application codebase has been completed. This index guides you to the most relevant documentation for your needs.

## Documents Generated

### 1. **CODEBASE_INVESTIGATION.md** (752 lines, 27KB)
**The Complete Reference** - Most Comprehensive

Start here if you need:
- Complete project overview and business goals
- Detailed feature explanations
- Full data model documentation
- UX/UI design system details
- Branding and visual identity
- Technical architecture breakdown
- Recent development history
- Known issues and work in progress
- Important file references with line numbers

**Best for**: Onboarding, architectural understanding, decision-making

---

### 2. **QUICK_REFERENCE.md** (378 lines, 9.9KB)
**The Quick Lookup** - Fast Navigation

Start here if you need:
- Quick facts and statistics
- Technology stack overview
- Core components summary
- Data model hierarchy
- Keyboard navigation shortcuts
- API endpoint listing
- File size reference
- Environment setup
- Key insights and recommendations

**Best for**: Quick lookups, finding specific info fast, getting oriented

---

### 3. **ARCHITECTURE_OVERVIEW.md** (551 lines, 21KB)
**Visual Diagrams & Flows** - System Design

Start here if you need:
- High-level system architecture
- Component hierarchy diagrams
- Data flow visualizations
- State machine diagrams
- Authentication flow
- Component communication patterns
- Performance considerations
- File organization
- Deployment architecture

**Best for**: Understanding system design, debugging issues, onboarding architects

---

## Quick Decision Tree

**"I'm new to this codebase. Where do I start?"**
→ Read: QUICK_REFERENCE.md first (10 min)
→ Then: ARCHITECTURE_OVERVIEW.md (20 min)
→ Then: CODEBASE_INVESTIGATION.md for deep dives

**"I need to make changes to [feature]. Where do I look?"**
→ Schedule View → CODEBASE_INVESTIGATION.md: Section 2.1 + Section 12
→ Inventory → CODEBASE_INVESTIGATION.md: Section 2.1 + Section 3.3
→ AI Chat → CODEBASE_INVESTIGATION.md: Section 5.3 + Section 12
→ Database → QUICK_REFERENCE.md: Data Model + ARCHITECTURE_OVERVIEW.md: Database Schema

**"I need to understand the tech stack."**
→ QUICK_REFERENCE.md: Technology Stack section
→ ARCHITECTURE_OVERVIEW.md: High-Level System Architecture
→ CODEBASE_INVESTIGATION.md: Section 5 (Technical Architecture)

**"What are the current issues and what's being worked on?"**
→ CODEBASE_INVESTIGATION.md: Section 6
→ QUICK_REFERENCE.md: Recent Development Work

**"Where's [specific file/component]?"**
→ CODEBASE_INVESTIGATION.md: Section 12 (Important File References)
→ QUICK_REFERENCE.md: Common File Paths (Absolute)

---

## Project At A Glance

| Aspect | Detail |
|--------|--------|
| **Name** | Daybook (formerly ScheduleGenius) |
| **Type** | Full-stack AI-powered productivity scheduler |
| **Tagline** | "Plan your day in plain text" |
| **Stack** | Next.js 14 + React 18 + MongoDB + Claude AI |
| **Deployment** | Vercel (auto-deploy from main branch) |
| **Branch** | 3.0 (development/active) |
| **Status** | Active development |
| **Team Size** | Solo (Rori Hinds) |

---

## Key Statistics

- **Main App**: 3,435 lines (app/app/page.tsx)
- **Largest Component**: 456 KB (InventoryView.tsx)
- **API Endpoints**: 65+
- **Database Collections**: 9
- **Custom Hooks**: 7
- **Documentation Files**: 15+ (including new investigation docs)

---

## Core Features

1. **Schedule Management** - Visual timeline with time-blocked activities
2. **Inventory System** - Goals, Projects, Events, Routines, Admin Tasks
3. **AI Chat** - Claude AI integration for schedule generation
4. **Keyboard-First UX** - Command palette, arrow key navigation, keyboard shortcuts
5. **Mobile Support** - Responsive design with touch optimization

---

## Recent Work (Last 2 Weeks)

**Focus**: Keyboard navigation and event persistence fixes

Latest commits:
1. Fix arrow keys in all inventory sections
2. Handle event persistence with metadata
3. Prevent Tab key from bubbling
4. Add location field to Event model
5. Fix input positioning during editing

---

## Current Issues to Be Aware Of

1. **InventoryView.tsx is huge** (456KB) - needs modularization
2. **Navigation state** could be unified for better maintainability
3. **Error handling** in optimistic updates has TODOs
4. **No visible test suite** - relies on manual testing
5. **Mobile optimization** still ongoing

---

## Important Paths (Absolute)

### Entry Points
- Main App: `/Users/rorihinds/eb-todo-app-v2/app/app/page.tsx`
- Home Page: `/Users/rorihinds/eb-todo-app-v2/app/page.tsx`

### Key Directories
- Components: `/Users/rorihinds/eb-todo-app-v2/app/components/`
- Database Models: `/Users/rorihinds/eb-todo-app-v2/models/`
- API Routes: `/Users/rorihinds/eb-todo-app-v2/app/api/`
- Custom Hooks: `/Users/rorihinds/eb-todo-app-v2/app/hooks/`
- AI Integration: `/Users/rorihinds/eb-todo-app-v2/app/lib/ai/`

### Config Files
- Tailwind: `/Users/rorihinds/eb-todo-app-v2/tailwind.config.ts`
- Next.js: `/Users/rorihinds/eb-todo-app-v2/next.config.mjs`
- TypeScript: `/Users/rorihinds/eb-todo-app-v2/tsconfig.json`

---

## Documentation Hierarchy

```
INVESTIGATION_INDEX.md (This file)
├── Quick navigation guide
└── Pointer to detailed docs

QUICK_REFERENCE.md (Start here for quick lookups)
├── Key statistics
├── Core components
├── Technology stack
├── Keyboard navigation
├── API endpoints
└── File paths

ARCHITECTURE_OVERVIEW.md (For system understanding)
├── System architecture diagrams
├── Component hierarchy
├── Data flows
├── State machines
└── Deployment architecture

CODEBASE_INVESTIGATION.md (For comprehensive reference)
├── Complete project overview
├── All features with file refs
├── Data models with relationships
├── UX/UI design system
├── Technical architecture
├── Recent history
├── Known issues
└── File references with line numbers
```

---

## How to Use This Investigation

### For Quick Answers (5 minutes)
1. Check the Quick Decision Tree above
2. Use QUICK_REFERENCE.md sections as lookup tables
3. Use ARCHITECTURE_OVERVIEW.md diagrams for visual understanding

### For Learning (30-60 minutes)
1. Read QUICK_REFERENCE.md completely
2. Read ARCHITECTURE_OVERVIEW.md for visual understanding
3. Scan CODEBASE_INVESTIGATION.md sections relevant to your area

### For Deep Dives (2+ hours)
1. Start with CODEBASE_INVESTIGATION.md Section 1-3 (Overview, Features, Data Model)
2. Read ARCHITECTURE_OVERVIEW.md to understand relationships
3. Read specific sections in CODEBASE_INVESTIGATION.md for your area
4. Cross-reference with actual code files using provided file paths

### For Making Changes
1. Find your area in QUICK_REFERENCE.md
2. Get file paths from CODEBASE_INVESTIGATION.md Section 12
3. Read ARCHITECTURE_OVERVIEW.md to understand data flows
4. Follow component communication patterns in ARCHITECTURE_OVERVIEW.md
5. Check recent commits in CODEBASE_INVESTIGATION.md Section 6 for similar changes

---

## Key Takeaways

### Strengths of This Codebase
- Strong keyboard-first UX design philosophy
- Clean API architecture with clear endpoints
- Comprehensive AI integration with Claude tools
- TypeScript throughout for type safety
- Optimistic UI updates for snappy feel
- Excellent inline documentation in planning docs

### Areas Needing Improvement
- InventoryView.tsx component is too large
- Navigation state management could be unified
- No automated test suite visible
- Error handling in some edge cases needs work

### Development Culture
- Active, ongoing development (commits every few days)
- Focus on keyboard navigation and UX
- Thoughtful documentation of design decisions
- Iterative refinement approach (lots of small focused commits)

---

## Environment Setup

```bash
# Install dependencies
npm install

# Create .env.local with:
MONGODB_URI=<your-mongodb-uri>
CLERK_SECRET_KEY=<from-clerk-dashboard>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from-clerk-dashboard>
ANTHROPIC_API_KEY=<from-anthropic>
OPENAI_API_KEY=<optional-fallback>
IMAGEKIT_PUBLIC_KEY=<from-imagekit>
IMAGEKIT_PRIVATE_KEY=<from-imagekit>
IMAGEKIT_URL_ENDPOINT=<from-imagekit>

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## Getting Help

### For Architecture Questions
→ ARCHITECTURE_OVERVIEW.md (visual diagrams)

### For Feature Details
→ CODEBASE_INVESTIGATION.md (comprehensive reference)

### For Quick Facts
→ QUICK_REFERENCE.md (lookup tables)

### For Specific File Locations
→ CODEBASE_INVESTIGATION.md Section 12 (Important File References)

### For Git History Context
→ CODEBASE_INVESTIGATION.md Section 6 (Current Issues & Recent Work)

---

## Document Statistics

| Document | Lines | Size | Focus |
|----------|-------|------|-------|
| CODEBASE_INVESTIGATION.md | 752 | 27 KB | Comprehensive |
| ARCHITECTURE_OVERVIEW.md | 551 | 21 KB | Visual/Diagrams |
| QUICK_REFERENCE.md | 378 | 9.9 KB | Quick Lookup |
| **TOTAL** | **1,681** | **~58 KB** | Complete Coverage |

---

## About This Investigation

**Investigation Date**: November 5, 2025  
**Git Branch**: 3.0 (development)  
**Scope**: Complete codebase exploration  
**Depth**: Extensive (all major components covered)  
**File References**: Absolute paths provided  
**Code Samples**: TypeScript interfaces and key patterns included  

---

**Next Step**: Choose your document based on your need:
- Quick answers? → **QUICK_REFERENCE.md**
- System design? → **ARCHITECTURE_OVERVIEW.md**
- Everything? → **CODEBASE_INVESTIGATION.md**

---

*Generated with thorough code analysis, git history examination, and documentation review.*
