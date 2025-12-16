# AI Model Architecture & Data Sources

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI CHAT MODEL (Claude)                       │
│                                                                       │
│  System Prompt + User Message → TOOLS → Response → Schedule Actions  │
└───────────────┬─────────────────────────────────────┬───────────────┘
                │                                       │
                │         AVAILABLE TOOLS               │
                ▼                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────┐
│        SCHEDULE TOOLS              │   │        MEMORY TOOLS            │
├───────────────────────────────────┤   ├───────────────────────────────┤
│ • addBlock                         │   │ • searchConversations           │
│ • removeBlock                      │   │ • searchInsights (RAG)          │
│ • listBlocks                       │   │ • getRecentConversations        │
│ • addTask                          │   │                                 │
│ • removeTask                       │   │        (Coming Soon)            │
│ • moveBlock                        │   └───────────────────────────────┘
│ • modifyBlock                      │
└───────────────────────────────────┘

                ▼                                       ▼
┌───────────────────────────────────┐   ┌───────────────────────────────┐
│      USER PROFILE TOOLS           │   │      HISTORICAL TOOLS          │
├───────────────────────────────────┤   ├───────────────────────────────┤
│ • getUserProfile                   │   │ • getScheduleByDate             │
│ • getUserGoals                     │   │ • getLastNDaysSchedules        │
│ • getUserProjects                  │   │ • getSameDayOfWeekSchedules    │
│ • getUserRoutines                  │   │ • getSchedulePatterns           │
│ • getUserEvents                    │   │                                 │
│ • getStandaloneTasks              │   │        (Coming Soon)            │
│                                    │   └───────────────────────────────┘
│        (Coming Soon)               │
└───────────────────────────────────┘
```

## Complete Data Sources Architecture

```
                              ┌─────────────────┐
                              │   AI MODEL      │
                              │  (Anthropic)    │
                              └────────┬────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        │              │               │               │              │
┌───────▼──────┐ ┌────▼─────┐ ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼─────┐
│CURRENT STATE │ │  MEMORY  │ │USER CONTEXT  │ │  BACKLOG   │ │HISTORICAL │
│              │ │          │ │   (Profile)  │ │(Inventory) │ │   DATA    │
└───────┬──────┘ └────┬─────┘ └───────┬──────┘ └─────┬──────┘ └─────┬─────┘
        │              │               │               │              │
        │              │               │               │              │
┌───────▼──────────────▼───────────────▼───────────────▼──────────────▼─────┐
│                                                                             │
│                           MONGODB DATABASE                                  │
│                                                                             │
├─────────────┬─────────────┬──────────────┬────────────────┬───────────────┤
│   BLOCKS    │    CHAT     │     USER     │   INVENTORY    │     DAYS      │
│             │  HISTORY    │   PROFILE    │    BACKLOG     │   HISTORY     │
├─────────────┼─────────────┼──────────────┼────────────────┼───────────────┤
│• Time       │• User msgs  │• Name        │┌─────────────┐ │• Past blocks  │
│• Type       │• AI resp    │• Occupation  ││   GOALS     │ │• Completion % │
│• Duration   │• Timestamp  │• Bio         │├─────────────┤ │• Patterns     │
│• Tasks      │• DayId      │• Location    ││• Title      │ │• Analytics    │
│• Completed  │• Metadata   │• Preferences ││• Priority   │ │               │
│             │             │              ││• Deadline   │ │               │
│             │             │              │└──────┬──────┘ │               │
│             │             │              │       │        │               │
│             │             │              │┌──────▼──────┐ │               │
│             │             │              ││  PROJECTS   │ │               │
│             │             │              │├─────────────┤ │               │
│             │             │              ││• Title      │ │               │
│             │             │              ││• Goal ID    │ │               │
│             │             │              ││• Priority   │ │               │
│             │             │              ││• Tasks[]    │ │               │
│             │             │              │└─────────────┘ │               │
│             │             │              │                │               │
│             │             │              │┌─────────────┐ │               │
│             │             │              ││  ROUTINES   │ │               │
│             │             │              │├─────────────┤ │               │
│             │             │              ││• Title      │ │               │
│             │             │              ││• Time       │ │               │
│             │             │              ││• Days[]     │ │               │
│             │             │              ││• Duration   │ │               │
│             │             │              │└─────────────┘ │               │
│             │             │              │                │               │
│             │             │              │┌─────────────┐ │               │
│             │             │              ││   EVENTS    │ │               │
│             │             │              │├─────────────┤ │               │
│             │             │              ││• Title      │ │               │
│             │             │              ││• Date/Time  │ │               │
│             │             │              ││• Recurring  │ │               │
│             │             │              ││• Priority   │ │               │
│             │             │              │└─────────────┘ │               │
│             │             │              │                │               │
│             │             │              │┌─────────────┐ │               │
│             │             │              ││STANDALONE   │ │               │
│             │             │              ││   TASKS     │ │               │
│             │             │              │├─────────────┤ │               │
│             │             │              ││• Title      │ │               │
│             │             │              ││• Priority   │ │               │
│             │             │              ││• Category   │ │               │
│             │             │              ││• Estimate   │ │               │
│             │             │              │└─────────────┘ │               │
└─────────────┴─────────────┴──────────────┴────────────────┴───────────────┘
                                       │
                              ┌────────▼────────┐
                              │   RAG STORE     │
                              │  (Coming Soon)  │
                              ├─────────────────┤
                              │ • Embeddings    │
                              │ • Insights      │
                              │ • Patterns      │
                              │ • Preferences   │
                              └─────────────────┘
```

## Data Flow for Schedule Creation

```
User: "Create my schedule for today"
                    │
                    ▼
         ┌──────────────────┐
         │  AI ANALYZES     │
         └────────┬─────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┬──────────────┐
    ▼             ▼             ▼              ▼              ▼
FIXED ITEMS   FLEXIBLE      BACKLOG        PATTERNS      CONTEXT
    │            │             │               │              │
getEvents    getRoutines   getGoals      getLastNDays   getChatHistory
    │            │             │               │              │
    │            │         getProjects    getSameDay     searchInsights
    │            │             │          Schedules           │
    │            │             │               │              │
    │            │         getStandalone       │              │
    │            │            Tasks            │              │
    └─────────────┼─────────────┼──────────────┼──────────────┘
                  │             │              │
                  ▼             ▼              ▼
            ┌─────────────────────────────────────┐
            │     PRIORITY ALGORITHM              │
            ├─────────────────────────────────────┤
            │ 1. Events (fixed, non-negotiable)   │
            │ 2. Routines (regular, flexible)     │
            │ 3. High Priority Project Tasks     │
            │ 4. Goal-aligned Activities         │
            │ 5. Standalone Tasks by Priority    │
            │ 6. Buffer/Break Time              │
            └─────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ GENERATE SCHEDULE │
                    └──────────────────┘
```

## Inventory/Backlog Data Structure

### Goals (Top Level)
```javascript
{
  _id: "goal_123",
  userId: "user_123",
  title: "Launch my startup",
  description: "Build and launch SaaS product",
  priority: "high", // high, medium, low
  deadline: "2024-06-01",
  status: "active", // active, paused, completed
  projects: ["project_1", "project_2"], // linked projects
  metrics: {
    progress: 0.35, // 35% complete
    tasksTotal: 50,
    tasksCompleted: 17
  }
}
```

### Projects (Goal-linked)
```javascript
{
  _id: "project_1",
  userId: "user_123",
  goalId: "goal_123",
  title: "MVP Development",
  priority: 1, // numeric for sorting
  status: "in_progress",
  tasks: [
    {
      id: "task_1",
      title: "Setup authentication",
      estimate: 240, // minutes
      priority: "high",
      completed: false,
      dependencies: []
    },
    {
      id: "task_2", 
      title: "Build dashboard",
      estimate: 480,
      priority: "medium",
      completed: false,
      dependencies: ["task_1"]
    }
  ]
}
```

### Routines (Recurring)
```javascript
{
  _id: "routine_123",
  userId: "user_123",
  title: "Morning Workout",
  type: "personal", // personal, work, health
  time: "07:00",
  duration: 60,
  days: ["Monday", "Wednesday", "Friday"],
  active: true,
  completionRate: 0.75 // tracked over time
}
```

### Events (Calendar)
```javascript
{
  _id: "event_123",
  userId: "user_123",
  title: "Team Standup",
  date: "2024-01-15", // specific date or null for recurring
  time: "10:00",
  duration: 15,
  recurring: "weekdays", // null, daily, weekdays, weekly, monthly
  type: "meeting",
  mandatory: true,
  location: "Zoom",
  attendees: ["john@example.com"]
}
```

### Standalone Tasks (Not project-linked)
```javascript
{
  _id: "task_456",
  userId: "user_123",
  title: "Call dentist",
  category: "personal", // personal, work, admin, health
  priority: "medium",
  estimate: 15,
  deadline: "2024-01-20",
  completed: false,
  notes: "Schedule cleaning"
}
```

## How AI Accesses Backlog Data

When creating a schedule, the AI:

1. **Queries Events First** (non-negotiable)
   ```javascript
   const events = await getUserEvents({ date: "today" });
   // Must include: Team standup at 10:00
   ```

2. **Checks Routines** (flexible but important)
   ```javascript
   const routines = await getUserRoutines({ day: "Monday" });
   // Should include: Morning workout if it's Mon/Wed/Fri
   ```

3. **Pulls High-Priority Project Tasks**
   ```javascript
   const goals = await getUserGoals({ status: "active" });
   const projects = await getUserProjects({ goalId: goals[0].id });
   const urgentTasks = projects.flatMap(p => 
     p.tasks.filter(t => t.priority === "high" && !t.completed)
   );
   ```

4. **Fills with Standalone Tasks**
   ```javascript
   const tasks = await getStandaloneTasks({ 
     priority: ["high", "medium"],
     completed: false 
   });
   ```

## Current Implementation Status

### ✅ Implemented
- Chat History Storage
- Current Schedule (Blocks)
- Basic Block/Task Tools

### 🚧 Needs Connection
- Goals (model exists, needs tool)
- Projects (model exists, needs tool)
- Routines (model exists, needs tool)
- Events (model exists, needs tool)
- Standalone Tasks (model exists, needs tool)

### 📋 Not Yet Built
- RAG Insights Store
- Pattern Analysis
- Behavioral Tracking

The key insight: **The backlog/inventory is the SOURCE of what goes into the schedule**, while the current blocks are the RESULT of scheduling decisions.