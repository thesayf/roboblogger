// Multi-Agent System Tools Implementation
// Tool stubs for the multi-agent chat system

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import dbConnect from '@/lib/mongo';

// ==================== SYSTEM PROMPTS ====================

const GOAL_PLAN_SYSTEM_PROMPT = `You are a strategic planning assistant for ScheduleGenius. Create comprehensive plans to achieve long-term goals.

## Your Role:
When a user describes a goal they want to achieve (lose weight, learn a skill, launch a product), create a complete plan using goals, projects, tasks, routines, and events.

## Planning Principles:
1. Break down big goals into manageable projects
2. Create routines for consistent habits
3. Set realistic deadlines based on the timeframe
4. Add check-in events for accountability
5. Include both action items (tasks) and habits (routines)

## Important Guidelines:
- Calculate realistic time requirements
- Space out deadlines to avoid overwhelm
- Create routines that fit morning/evening schedules
- Include preparation tasks at the beginning
- Add review/assessment events throughout

## Output Format:
Return a JSON object:
{
  "plan": {
    "title": "Clear title of the plan",
    "duration": "X weeks/months",
    "description": "Brief overview of the approach",

    "goal": {
      "content": "The main goal",
      "deadline": "YYYY-MM-DD",
      "color": "from-COLOR-100 to-COLOR-200"
    },

    "projects": [
      {
        "name": "Project Name",
        "dueDate": "YYYY-MM-DD",
        "tasks": [
          {"title": "Task", "duration": minutes, "dueDate": "YYYY-MM-DD"}
        ]
      }
    ],

    "routines": [
      {
        "name": "Routine Name",
        "days": ["Monday", "Wednesday", "Friday"],
        "startTime": "HH:MM",
        "duration": minutes,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "tasks": [
          {"title": "Task", "duration": minutes}
        ]
      }
    ],

    "tasks": [
      {"title": "Standalone task", "duration": minutes, "dueDate": "YYYY-MM-DD"}
    ],

    "events": [
      {
        "name": "Event Name",
        "date": "YYYY-MM-DD",
        "time": "HH:MM",
        "duration": minutes
      }
    ]
  },

  "summary": "One sentence summary of what was created",

  "stats": {
    "totalItems": number,
    "goals": 1,
    "projects": number,
    "projectTasks": number,
    "routines": number,
    "standaloneTasks": number,
    "events": number
  }
}`;

// ==================== TOOL DEFINITIONS ====================

/**
 * 1. GET APP INFO TOOL
 * Provides information about ScheduleGenius features and capabilities
 */
export async function getAppInfo(topic?: string) {
  // This could query from a knowledge base or return structured app info
  const appInfo = {
    features: {
      scheduling: "AI-powered daily schedule generation with time blocks",
      goals: "Goal setting and tracking with deadline management",
      projects: "Project organization and task breakdown",
      inventory: "Central hub for all unscheduled tasks and items",
      routines: "Recurring task templates for daily/weekly activities",
      events: "Calendar integration for meetings and appointments"
    },
    models: [
      "User", "Day", "Block", "Task", "Goal", "Project", "Event", "Routine"
    ],
    commands: {
      schedule: "Generate or modify daily schedules",
      tasks: "Create, update, or delete tasks",
      goals: "Set and track long-term objectives"
    }
  };

  if (topic && appInfo[topic as keyof typeof appInfo]) {
    return {
      success: true,
      data: appInfo[topic as keyof typeof appInfo],
      message: `Information about ${topic}`
    };
  }

  return {
    success: true,
    data: appInfo,
    message: "ScheduleGenius capabilities and features overview"
  };
}

/**
 * 2. MANAGE TODOS TOOL
 * Internal todo management for multi-step operations
 * 
 * IMPORTANT: This tool manages todos within a single turn.
 * The todos must be passed from the frontend and returned to maintain state.
 */
export interface Todo {
  id: string;
  action: 'planCUD' | 'planSchedule' | 'planGoal' | 'execute' | 'read' | 'updateTodo' | 'manageTodos';
  description: string;
  params?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  blockedBy?: 'confirmation' | 'dependency';
  planId?: string; // Links execute steps to their plans
  result?: any; // Store tool execution results
  priority?: number;
  originalOrder?: number;
  reorderedReason?: string;
}

export interface TodoOperation {
  action: 'create' | 'update' | 'complete' | 'skip' | 'list' | 'clear' | 'reorder' | 'processNext';
  todos?: Todo[] | string[] | any[];
  currentTodos?: Todo[]; // The existing todos from context
  confirmationFor?: string; // Plan ID being confirmed
}

export async function manageTodos(
  operation: TodoOperation | string,
  data?: any
) {
  // Handle both old and new call signatures
  const action = typeof operation === 'string' ? operation : operation.action;
  const currentTodos = typeof operation === 'object' ? operation.currentTodos || [] : [];
  const todos = typeof operation === 'object' ? operation.todos : data;
  const confirmationFor = typeof operation === 'object' ? operation.confirmationFor : undefined;
  
  let updatedTodos = [...currentTodos];
  
  switch (action) {
    case 'create':
      // Create new todos with proper action types
      if (todos && Array.isArray(todos)) {
        updatedTodos = todos.map((todo, index) => {
          // If todo is already structured, use it
          if (typeof todo === 'object' && todo.action) {
            return {
              ...todo,
              id: todo.id || `todo-${Date.now()}-${index}`,
              status: todo.status || 'pending',
              originalOrder: index + 1
            };
          }
          
          // Otherwise parse from string (legacy support)
          const todoStr = typeof todo === 'string' ? todo : todo.description;
          const todoLower = todoStr.toLowerCase();
          
          // Determine action type from description
          let action: Todo['action'] = 'read';
          let blockedBy = undefined;
          
          if (todoLower.includes('plan') && (todoLower.includes('delete') || todoLower.includes('create') || todoLower.includes('update'))) {
            action = 'planCUD';
          } else if (todoLower.includes('plan') && todoLower.includes('schedule')) {
            action = 'planSchedule';
          } else if (todoLower.includes('plan') && todoLower.includes('goal')) {
            action = 'planGoal';
          } else if (todoLower.includes('execute')) {
            action = 'execute';
            blockedBy = 'confirmation' as const;
          } else if (todoLower.includes('update todo') || todoLower.includes('mark')) {
            action = 'updateTodo';
          } else if (todoLower.includes('manage todo')) {
            action = 'manageTodos';
          }
          
          return {
            id: `todo-${Date.now()}-${index}`,
            action,
            description: todoStr,
            status: 'pending' as const,
            blockedBy,
            originalOrder: index + 1,
            params: todo.params
          };
        });
      }
      break;
      
    case 'reorder':
      // Reorder todos: DELETE first, UPDATE second, CREATE third, READ last
      if (updatedTodos.length > 0) {
        const deletes: Todo[] = [];
        const updates: Todo[] = [];
        const creates: Todo[] = [];
        const reads: Todo[] = [];
        
        updatedTodos.forEach(todo => {
          const desc = todo.description.toLowerCase();
          if (desc.includes('delete') || desc.includes('remove')) {
            deletes.push(todo);
          } else if (desc.includes('update') || desc.includes('modify')) {
            updates.push(todo);
          } else if (desc.includes('create') || desc.includes('add') || desc.includes('generate')) {
            creates.push(todo);
          } else {
            reads.push(todo);
          }
        });
        
        // Reorder with proper interleaving of plan/execute pairs
        updatedTodos = [...deletes, ...updates, ...creates, ...reads].map((todo, index) => ({
          ...todo,
          reorderedReason: deletes.includes(todo) ? 'delete-first' : 
                          updates.includes(todo) ? 'update-second' :
                          creates.includes(todo) ? 'create-third' : 'read-last'
        }));
      }
      break;

    case 'update':
      // Mark specific todo as in_progress
      if (todos && Array.isArray(todos)) {
        const todoId = todos[0]; // Expecting single ID
        updatedTodos = updatedTodos.map(t => 
          t.id === todoId ? { ...t, status: 'in_progress' as const } : t
        );
      }
      break;

    case 'complete':
      // Mark specific todo as completed and unblock dependent execute steps
      if (todos && Array.isArray(todos)) {
        const todoId = todos[0];
        updatedTodos = updatedTodos.map(t => {
          if (t.id === todoId) {
            return { ...t, status: 'completed' as const };
          }
          // If this was a plan, unblock its execute step
          if (t.planId === todoId && t.blockedBy === 'confirmation') {
            return { ...t, blockedBy: undefined };
          }
          return t;
        });
      }
      break;
      
    case 'processNext':
      // Process the next available todo
      const nextTodo = updatedTodos.find(t => 
        t.status === 'pending' && !t.blockedBy
      );
      
      if (nextTodo) {
        // If user confirmed, unblock matching execute steps
        if (confirmationFor) {
          updatedTodos = updatedTodos.map(t => 
            t.planId === confirmationFor ? { ...t, blockedBy: undefined } : t
          );
        }
        
        return {
          success: true,
          nextTodo,
          todos: updatedTodos,
          shouldStop: nextTodo.action.startsWith('plan'), // Stop after plan tools
          requiresConfirmation: nextTodo.action === 'execute'
        };
      }
      break;
      
    case 'updateTodo':
      // Update a specific todo's status (for self-tracking)
      if (todos && typeof todos === 'object' && todos.todoId && todos.status) {
        updatedTodos = updatedTodos.map(t => 
          t.id === todos.todoId ? { ...t, status: todos.status } : t
        );
      }
      break;

    case 'skip':
      // Mark specific todo as skipped
      if (todos && Array.isArray(todos)) {
        const todoId = todos[0];
        updatedTodos = updatedTodos.map(t => 
          t.id === todoId ? { ...t, status: 'skipped' as const } : t
        );
      }
      break;
      
    case 'clear':
      // Clear all todos (user rejected the plan)
      updatedTodos = [];
      console.log('🗑️ Cleared all todos');
      break;
      
    case 'modify':
      // Modify the todo list based on user's changed requirements
      if (todos && Array.isArray(todos)) {
        // Each todo in the array can have:
        // { id: 'existing-id', keep: true/false }
        // { action: 'new', ...newTodoData }
        const newTodos: Todo[] = [];
        
        todos.forEach((instruction: any) => {
          if (instruction.id && instruction.keep) {
            // Keep existing todo
            const existing = updatedTodos.find(t => t.id === instruction.id);
            if (existing) newTodos.push(existing);
          } else if (instruction.action && !instruction.id) {
            // Add new todo
            newTodos.push({
              id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              action: instruction.action,
              description: instruction.description,
              params: instruction.params,
              status: 'pending',
              blockedBy: instruction.blockedBy
            });
          }
        });
        
        updatedTodos = newTodos;
        console.log(`🔄 Modified todo list: ${updatedTodos.length} items`);
      }
      break;

    case 'clear':
      updatedTodos = [];
      break;

    case 'list':
    default:
      // Just return current todos
      break;
  }

  // Calculate summary
  const summary = {
    total: updatedTodos.length,
    pending: updatedTodos.filter(t => t.status === 'pending').length,
    in_progress: updatedTodos.filter(t => t.status === 'in_progress').length,
    completed: updatedTodos.filter(t => t.status === 'completed').length,
    skipped: updatedTodos.filter(t => t.status === 'skipped').length,
    nextTodo: updatedTodos.find(t => t.status === 'pending')
  };

  return {
    success: true,
    todos: updatedTodos,
    summary,
    hasMore: summary.pending > 0 || summary.in_progress > 0
  };
}

/**
 * 3. PLAN SCHEDULE TOOL (New Version)
 * Generates schedule proposals
 *
 * REQUIRED PARAMETERS (boss agent must provide):
 * - targetDate: string in YYYY-MM-DD format (e.g., '2025-10-11')
 * - planningStartTime: string in HH:MM format (e.g., '14:30', '07:00')
 *
 * OPTIONAL PARAMETERS:
 * - mode: 'create' (default) or 'update'
 * - existingPlan: the current plan (required if mode is 'update')
 * - userChanges: description of what user wants to change (required if mode is 'update')
 */
export async function planScheduleMultiAgent(userId: string, params?: any) {
  console.log('📅 [planScheduleMultiAgent] Called with userId:', userId);
  console.log('📅 [planScheduleMultiAgent] Params:', params);

  try {
    // Validate required parameters
    if (!params?.targetDate) {
      throw new Error('Missing required parameter: targetDate (must be YYYY-MM-DD format)');
    }
    if (!params?.planningStartTime) {
      throw new Error('Missing required parameter: planningStartTime (must be HH:MM format)');
    }

    const targetDate = params.targetDate;
    const planningStartTime = params.planningStartTime;
    const mode = params.mode || 'create'; // default to create mode
    const existingPlan = params.existingPlan;
    const userChanges = params.userChanges;

    console.log('📅 Target date:', targetDate);
    console.log('📅 Planning start time:', planningStartTime);
    console.log('📅 Mode:', mode);

    // Validate update mode parameters
    if (mode === 'update') {
      if (!existingPlan) {
        throw new Error('Update mode requires existingPlan parameter');
      }
      if (!userChanges) {
        throw new Error('Update mode requires userChanges parameter');
      }
      console.log('📅 Updating existing plan based on user changes:', userChanges);
    }

    // Import the data preparation function
    const { prepareSchedulePlannerData } = await import('./schedule-planner-data');

    // Prepare the data slate
    const plannerData = await prepareSchedulePlannerData(
      userId,
      targetDate,
      planningStartTime,
      params?.messages || []
    );

    // Log the prepared data in a nice format
    console.log('\n📊 ==================== SCHEDULE PLANNER DATA ====================');
    console.log(JSON.stringify(plannerData, null, 2));
    console.log('📊 ================================================================\n');

    // Generate AI-powered schedule using Claude Sonnet 4.5
    const isUpdateMode = mode === 'update';

    const systemPrompt = isUpdateMode
      ? `You are an expert schedule planner. UPDATE an existing schedule based on the user's requested changes.

# UPDATE MODE - CRITICAL INSTRUCTIONS

**Your task**: Modify the EXISTING schedule to incorporate the user's requested changes.

**Rules**:
1. **Make ONLY the changes the user requested** - don't redesign the whole schedule
2. **Preserve everything else** - keep all other blocks, times, and tasks exactly as they are
3. **Maintain time integrity** - ensure no overlaps after changes
4. **Respect constraints** - don't modify past blocks, keep within workday hours
5. **Be precise** - if user says "move lunch to 1pm", only change lunch time

**Common change types**:
- Move a block to different time
- Add a new block/task
- Remove a block/task
- Adjust duration
- Swap order of tasks

# EXISTING SCHEDULE
You will receive the current schedule that needs to be updated.

# USER'S REQUESTED CHANGES
You will receive the specific changes the user wants.

# OUTPUT FORMAT
Return a JSON object with this EXACT structure:
{
  "blocks": [...],  // The UPDATED full schedule with changes applied
  "reasoning": "Brief explanation of what changed and why"
}

IMPORTANT:
- Return the COMPLETE updated schedule, not just the changed parts
- Use the same block IDs from the existing schedule
- Keep all the same formatting and structure`
      : `You are an expert schedule planner. Generate an optimized daily schedule based on the provided data.

# SCHEDULING RULES

## Time Constraints
- Only schedule for today or tomorrow
- NEVER modify past blocks (they are immutable)
- Tasks from past blocks can be rescheduled to future time slots
- Respect the planningFromTime - schedule only from that time onwards

## Priority Hierarchy (schedule in this order)
1. **Events** - Fixed time commitments (highest priority)
2. **Routines** - Recurring activities for this day of week
3. **Urgent Tasks** - Tasks due within 3 days
4. **Carried Over Tasks** - Incomplete tasks from yesterday
5. **Prioritized Project Tasks** - From top goals/projects in priority order
6. **Other Available Tasks** - Additional tasks as time allows

## Global Difficulty Ordering
**CRITICAL: Assess task difficulty from natural language and schedule hardest/most complex tasks EARLIEST in the day**
- Complex, challenging, cognitively demanding tasks → earliest available slots
- Simple, quick, easy tasks → later in the day
- This applies globally across the entire schedule, not just within individual blocks
- Examples:
  - "Write comprehensive report" = hard → schedule early
  - "Send quick email" = easy → schedule later
  - "Strategic planning session" = hard → schedule early
  - "File expense receipts" = easy → schedule later

## Task Sequencing
- Maintain project task order (tasks from the same project stay in sequence)
- Respect the isAlreadyScheduled flag - don't duplicate tasks
- Tasks marked isAlreadyScheduled: true are already placed, but you can reposition them if needed

## Block Types
Use these block types appropriately:
- 'routine' - for routine blocks
- 'deep-work' - for focused, complex work (90min recommended)
- 'break' - for breaks between work (15min recommended)
- 'admin' - for administrative tasks, emails, meetings
- 'personal' - for personal activities
- 'exercise' - for physical activity

## Best Practices
- Include breaks between deep work sessions
- Group similar tasks together when possible
- Aim for 90-minute deep work blocks for complex tasks
- Include 15-minute breaks after intensive work
- Respect existing future blocks from the schedule

# INPUT DATA STRUCTURE
You will receive:
- currentContext: date, time, planning parameters
- existingSchedule: current blocks (past and future), incomplete tasks
- fixedCommitments: events and routines for today
- recommendedTasks: categorized tasks by priority
- preferences: user's scheduling preferences
- metadata: user info

# OUTPUT FORMAT
Return a JSON object with this EXACT structure:
{
  "blocks": [
    {
      "id": "temp-1",
      "type": "deep-work",
      "title": "Morning Deep Work",
      "time": "08:00",
      "startTime": "08:00",
      "endTime": "09:30",
      "duration": 90,
      "tasks": [
        {
          "id": "task-id-123",
          "title": "Complete difficult analysis",
          "duration": 60,
          "completed": false
        }
      ]
    }
  ],
  "reasoning": "Brief explanation of scheduling decisions"
}

IMPORTANT:
- Use actual task IDs from the input data
- Calculate endTime from time + duration
- Ensure no time overlaps between blocks
- Schedule from planningFromTime onwards
- Don't modify existing past blocks
- Use temp-1, temp-2, etc. for new block IDs`;

    const userPrompt = isUpdateMode
      ? `UPDATE the following existing schedule based on the user's requested changes:

# EXISTING SCHEDULE
${JSON.stringify(existingPlan, null, 2)}

# USER'S REQUESTED CHANGES
${userChanges}

# AVAILABLE DATA (for reference if needed)
${JSON.stringify(plannerData, null, 2)}

Remember:
1. Make ONLY the changes the user requested
2. Keep everything else exactly the same
3. Ensure no time overlaps after changes
4. Don't modify past blocks (time < ${plannerData.currentContext.currentTime})
5. Use the same block IDs from the existing schedule`
      : `Generate an optimized schedule with the following data:

${JSON.stringify(plannerData, null, 2)}

Remember:
1. Schedule hardest tasks earliest in the day
2. Follow the priority hierarchy (events → routines → urgent → carried over → projects → other)
3. Include appropriate breaks
4. Don't duplicate tasks that are already scheduled (check isAlreadyScheduled flag)
5. Start scheduling from ${plannerData.currentContext.planningFromTime}`;

    const aiResponse = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
      maxTokens: 4000
    });

    console.log('🤖 AI Response received');

    // Parse AI response
    let generatedSchedule;
    try {
      const jsonMatch = aiResponse.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       aiResponse.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse.text;
      generatedSchedule = JSON.parse(jsonString);

      console.log('✅ AI schedule parsed successfully');
      console.log('📋 Generated blocks:', generatedSchedule.blocks?.length || 0);
      console.log('💭 Reasoning:', generatedSchedule.reasoning);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiResponse.text);

      // Return fallback empty schedule on parse error
      return {
        success: true,
        type: 'schedule',
        data: {
          date: targetDate,
          blocks: [],
          summary: {
            totalBlocks: 0,
            totalTasks: 0,
            totalDuration: 0
          }
        },
        message: "Error parsing AI schedule. Please try again."
      };
    }

    // Calculate summary stats
    const blocks = generatedSchedule.blocks || [];
    const totalTasks = blocks.reduce((sum: number, b: any) => sum + (b.tasks?.length || 0), 0);
    const totalDuration = blocks.reduce((sum: number, b: any) => sum + (b.duration || 0), 0);
    const startTime = blocks[0]?.time || planningStartTime;
    const endTime = blocks[blocks.length - 1]?.endTime || planningStartTime;

    return {
      success: true,
      type: 'schedule',
      data: {
        date: targetDate,
        blocks: blocks,
        summary: {
          totalBlocks: blocks.length,
          totalTasks,
          totalDuration,
          startTime,
          endTime
        }
      },
      message: `Here's your optimized schedule for ${plannerData.currentContext.isToday ? 'today' : 'tomorrow'}`
    };

  } catch (error) {
    console.error('📅 [planScheduleMultiAgent] Error:', error);

    // Return fallback mock on error
    return {
      success: true,
      type: 'schedule',
      data: {
        date: new Date().toISOString().split('T')[0],
        blocks: [],
        summary: {
          totalBlocks: 0,
          totalTasks: 0,
          totalDuration: 0
        }
      },
      message: "Error preparing schedule data. Check logs for details."
    };
  }
}

/**
 * 4. PLAN GOAL TOOL (New Version)
 * Creates strategic goal achievement plans
 *
 * REQUIRED PARAMETERS (boss agent must provide):
 * - goalDescription: string describing the user's goal
 *
 * OPTIONAL PARAMETERS:
 * - timeline: string (e.g., "12 months", "3 weeks")
 * - conversationHistory: array of recent messages for context
 */
export async function planGoalMultiAgent(userId: string, params?: any) {
  console.log('🎯 [planGoalMultiAgent] Called with userId:', userId);
  console.log('🎯 [planGoalMultiAgent] Params:', params);

  try {
    // Validate required parameters
    if (!params?.goalDescription && !params?.goal) {
      throw new Error('Missing required parameter: goalDescription or goal');
    }

    const goalDescription = params.goalDescription || params.goal;
    const timeline = params.timeline || 'appropriate timeframe';

    console.log('🎯 Goal description:', goalDescription);
    console.log('🎯 Timeline:', timeline);

    // Import context fetching function
    const { fetchContextForGoalPlan } = await import('@/app/api/ai/goal-plan/tools');

    // Fetch user's current commitments and available time
    console.log('🎯 Fetching user context...');
    const userContext = await fetchContextForGoalPlan(userId);

    // Build context prompt for AI
    const contextPrompt = `
USER'S GOAL REQUEST: "${goalDescription}"

TIMELINE: ${timeline}

CURRENT DATE: ${userContext.currentDate}

EXISTING COMMITMENTS:
- Active goals: ${userContext.existingCommitments.goalsCount}
- Active projects: ${userContext.existingCommitments.projectsCount}
- Active routines: ${userContext.existingCommitments.routinesCount}
- Weekly time commitment: ${userContext.existingCommitments.weeklyHours} hours

EXISTING ROUTINES (to avoid conflicts):
${userContext.existingRoutines.map((r: any) =>
  `- ${r.name}: ${r.days?.join(', ')} at ${r.startTime}`
).join('\n')}

SUGGESTED TIME SLOTS:
- Mornings: ${userContext.availableTimeSlots.mornings.join(', ')}
- Evenings: ${userContext.availableTimeSlots.evenings.join(', ')}
- Weekends: ${userContext.availableTimeSlots.weekends.join(', ')}

Create a comprehensive plan to achieve the user's goal. Include:
1. A main goal with appropriate deadline
2. 2-4 projects breaking down the work
3. Specific tasks within each project with deadlines
4. 1-3 routines for consistent habits
5. 2-4 milestone/check-in events
6. Any standalone tasks for preparation or review

Make deadlines realistic and space them appropriately.`;

    // Generate strategic plan with AI
    console.log('🎯 Generating strategic plan with AI...');

    const response = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: GOAL_PLAN_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: contextPrompt }
      ],
      temperature: 0.7, // Higher temperature for creative planning
      maxTokens: 2500,
    });

    console.log('🎯 AI Response received');

    // Parse the JSON response
    let goalPlan;
    try {
      const jsonMatch = response.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
      goalPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('🎯 Failed to parse AI response as JSON:', parseError);

      // Fallback response
      goalPlan = {
        plan: {
          title: "Goal Plan",
          duration: "4 weeks",
          description: "Unable to generate plan. Please try rephrasing your goal.",
          goal: {
            content: goalDescription,
            deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            color: "from-purple-100 to-blue-200"
          },
          projects: [],
          routines: [],
          tasks: [],
          events: []
        },
        summary: "Unable to generate a complete plan. Please try again.",
        stats: {
          totalItems: 0,
          goals: 1,
          projects: 0,
          projectTasks: 0,
          routines: 0,
          standaloneTasks: 0,
          events: 0
        }
      };
    }

    console.log('🎯 Goal plan generated successfully');
    console.log('🎯 Stats:', goalPlan.stats);

    // Return in multi-agent format
    return {
      success: true,
      type: 'goal_plan',
      data: goalPlan,
      message: `${goalPlan.summary}\n\nThis plan includes ${goalPlan.stats.projects} projects, ${goalPlan.stats.routines} routines, and ${goalPlan.stats.events} check-in events.\n\nShall I create this plan for you?`,
      requiresConfirmation: true
    };

  } catch (error) {
    console.error('🎯 [planGoalMultiAgent] Error:', error);

    // Return error response
    return {
      success: false,
      type: 'goal_plan',
      error: 'Failed to generate goal plan',
      message: 'An error occurred while creating your strategic plan. Please try again.'
    };
  }
}

/**
 * 5. PLAN CUD TOOL (Simplified Version - No Tools)
 * Plans Create/Update/Delete operations with simple data fetching
 */
export async function planCUDMultiAgent(userId: string, params?: any) {
  console.log('🔧 planCUDMultiAgent called with userId:', userId);
  console.log('🔧 Reason from boss:', params?.reason);
  console.log('🔧 Messages count:', params?.messages?.length || 0);

  try {
    // Convert Clerk userId to MongoDB user ID
    await dbConnect();
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId }).lean();

    if (!user) {
      console.error('🔧 User not found for Clerk ID:', userId);
      return {
        success: false,
        error: 'User not found',
        message: 'Unable to fetch user data'
      };
    }

    const mongoUserId = user._id.toString();
    console.log('🔧 Converted Clerk ID to MongoDB ID:', mongoUserId);

    // Import data fetching functions
    const { fetchInventoryForCUD, fetchScheduleForCUD } = await import('@/app/api/ai/basic-cud-plan/tools');

    const requestMessage = params?.reason || params?.request || 'Modify data';

    // Always fetch both inventory and schedule for maximum context
    console.log('🔧 Fetching inventory and schedule...');
    const [inventory, schedule] = await Promise.all([
      fetchInventoryForCUD(mongoUserId, userId, params),
      fetchScheduleForCUD(mongoUserId, params?.date || 'today')
    ]);

    // Build conversation context
    const conversationHistory = params?.messages ?
      params.messages.slice(-5).map((m: any) => `${m.role}: ${m.content || m.message}`).join('\n') :
      'No conversation history';

    // Build context prompt for AI
    let contextPrompt = `USER REQUEST: "${requestMessage}"

CONVERSATION HISTORY:
${conversationHistory}
`;

    // Add inventory data if fetched
    if (inventory) {
      contextPrompt += `

CURRENT INVENTORY:

Goals (${inventory.goals?.length || 0}):
${inventory.goals?.map((g: any) => `- ${g.content} (ID: ${g.id})`).join('\n') || '- None'}

Projects (${inventory.projects?.length || 0}):
${inventory.projects?.map((p: any) => `- ${p.name} (ID: ${p.id}, Tasks: ${p.tasks?.length || 0})`).join('\n') || '- None'}

Standalone Tasks (${inventory.tasks?.length || 0}):
${inventory.tasks?.map((t: any) => `- ${t.title} (ID: ${t.id}, Duration: ${t.duration}m)`).join('\n') || '- None'}

Routines (${inventory.routines?.length || 0}):
${inventory.routines?.map((r: any) => `- ${r.name} (ID: ${r.id}, Days: ${r.days?.join(', ')}, Time: ${r.startTime})`).join('\n') || '- None'}

Upcoming Events (${inventory.events?.length || 0}):
${inventory.events?.map((e: any) => `- ${e.name} (ID: ${e.id}, Date: ${new Date(e.date).toLocaleDateString()}, Time: ${e.time})`).join('\n') || '- None'}`;
    }

    // Add schedule data if fetched
    if (schedule && schedule.blocks) {
      contextPrompt += `

CURRENT SCHEDULE (${schedule.date}):

Blocks (${schedule.blocks.length}):
${schedule.blocks.map((b: any) => `- ${b.time} - ${b.title} (ID: ${b.id}, Duration: ${b.duration}m, Type: ${b.type}, Tasks: ${b.tasks?.length || 0})`).join('\n') || '- None'}`;
    }

    contextPrompt += `

Analyze the request and generate a CUD operation proposal.
For updates/deletes, find the exact item ID from the data above.
For creates, suggest smart defaults based on context.`;

    // System prompt
    const systemPrompt = `You are an assistant for ScheduleGenius that handles Create, Update, and Delete operations for both inventory items and timeline blocks.

## Models you can operate on:

### INVENTORY (unscheduled items):
- Goals (high-level objectives with deadlines)
- Projects (collections of tasks under goals)
- Tasks (individual work items, can be standalone or in projects)
- Events (scheduled appointments with specific date/time)
- Routines (recurring activities with tasks, on specific days)

### TIMELINE (scheduled items):
- Blocks (time-boxed periods in the daily schedule with tasks)
  - Each block has: id, time, duration, title, type, tasks

## Your job:
1. Analyze the user's request and conversation history
2. Identify what operation they want (create/update/delete)
3. Determine if they're modifying INVENTORY or TIMELINE
4. Find the specific item if it's an update/delete
5. Generate a clear proposal in JSON format

## Important rules:
- For UPDATE/DELETE: Use exact IDs from the provided data
- For CREATE: Suggest smart defaults based on context
- If multiple items match a description, ask for clarification
- Include all details the user mentioned
- For block time changes: ensure no overlaps, maintain proper chronological order
- For block modifications: preserve task IDs when moving tasks between blocks

## Output Format:
Return a JSON object with ALL changes organized by operation type:
{
  "changes": {
    "create": {
      "goals": [],
      "projects": [{"name": "...", "goalId": "...", "tasks": [{"title": "...", "duration": 30}]}],
      "tasks": [{"title": "...", "duration": 30}],
      "events": [{"name": "...", "date": "...", "time": "..."}],
      "routines": [{"name": "...", "days": [...], "startTime": "...", "tasks": [{"title": "...", "duration": 30}]}],
      "blocks": [{"time": "09:00", "duration": 90, "title": "...", "type": "deep-work", "tasks": [...]}]
    },
    "update": {
      "goals": [{"id": "goal_id", "name": "current name", "changes": {"field": "new value"}}],
      "projects": [{"id": "project_id", "name": "current name", "changes": {...}}],
      "tasks": [{"id": "task_id", "name": "current name", "changes": {...}}],
      "events": [{"id": "event_id", "name": "current name", "changes": {...}}],
      "routines": [{"id": "routine_id", "name": "current name", "changes": {...}}],
      "blocks": [{"id": "block_id", "title": "current title", "changes": {"time": "13:00", "duration": 60}}]
    },
    "delete": {
      "goals": [{"id": "goal_id", "name": "Goal Name"}],
      "projects": [{"id": "project_id", "name": "Project Name"}],
      "tasks": [{"id": "task_id", "name": "Task Name"}],
      "events": [{"id": "event_id", "name": "Event Name"}],
      "routines": [{"id": "routine_id", "name": "Routine Name"}],
      "blocks": [{"id": "block_id", "title": "Block Title"}]
    }
  },
  "summary": "Clear description of all changes",
  "stats": {
    "totalChanges": 0,
    "creating": 0,
    "updating": 0,
    "deleting": 0
  },
  "needsClarification": false,
  "clarificationMessage": "only if needsClarification is true"
}`;

    // Generate CUD plan with AI
    console.log('🔧 Generating CUD plan with AI...');

    const response = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: [{ role: 'user', content: contextPrompt }],
      temperature: 0.2,
      maxTokens: 1500
    });

    console.log('🔧 AI Response received');

    // Parse the JSON response
    let cudPlan;
    try {
      const jsonMatch = response.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
      cudPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('🔧 Failed to parse AI response as JSON:', parseError);
      console.log('🔧 Raw response:', response.text);

      // Fallback response
      cudPlan = {
        changes: {
          create: { goals: [], projects: [], tasks: [], events: [], routines: [], blocks: [] },
          update: { goals: [], projects: [], tasks: [], events: [], routines: [], blocks: [] },
          delete: { goals: [], projects: [], tasks: [], events: [], routines: [], blocks: [] }
        },
        summary: "I couldn't understand your request. Could you please clarify what you'd like to do?",
        stats: { totalChanges: 0, creating: 0, updating: 0, deleting: 0 },
        needsClarification: true
      };
    }

    console.log('🔧 CUD plan generated successfully');

    // Calculate stats if not provided
    if (!cudPlan.stats) {
      const creating = Object.values(cudPlan.changes.create).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);
      const updating = Object.values(cudPlan.changes.update).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);
      const deleting = Object.values(cudPlan.changes.delete).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);

      cudPlan.stats = {
        totalChanges: creating + updating + deleting,
        creating,
        updating,
        deleting
      };
    }

    // Format the response message
    let responseMessage = cudPlan.summary;

    if (cudPlan.needsClarification) {
      responseMessage = cudPlan.clarificationMessage || cudPlan.summary;
    } else if (cudPlan.stats.deleting > 0) {
      responseMessage = `${cudPlan.summary}\n\n⚠️ Deletions cannot be undone.`;
    }

    return {
      success: true,
      type: 'cud',
      data: cudPlan,
      message: cudPlan.needsClarification ? responseMessage : `${responseMessage}\n\nShall I proceed?`,
      requiresConfirmation: !cudPlan.needsClarification,
      needsClarification: cudPlan.needsClarification
    };

  } catch (error) {
    console.error('🔧 Error in planCUDMultiAgent:', error);
    return {
      success: false,
      error: 'Failed to generate CUD plan',
      message: 'An error occurred while planning the operation'
    };
  }
}

/**
 * 6. EXECUTE TOOL (Agentic Version)
 * Executes confirmed plans using AI agent with type-specific strategies
 */
export async function executeMultiAgent(userId: string, params: any) {
  console.log('\n🚀 === EXECUTE MULTI-AGENT ===');
  console.log('🚀 userId:', userId);
  console.log('🚀 plan type:', params?.plan?.type);

  const plan = params.plan;
  const chatContext = params.messages || [];

  if (!plan || !plan.type) {
    return {
      success: false,
      error: 'No valid plan provided to execute'
    };
  }

  // Route to type-specific execution
  switch (plan.type) {
    case 'schedule':
      return executeSchedulePlanAgentic(userId, plan, chatContext);
    case 'goal_plan':
      return executeGoalPlanAgentic(userId, plan, chatContext);
    case 'cud':
      return executeCUDPlanAgentic(userId, plan, chatContext);
    default:
      return {
        success: false,
        error: `Unknown plan type: ${plan.type}`
      };
  }
}

// ==================== SCHEDULE EXECUTION ====================

async function executeSchedulePlanAgentic(userId: string, plan: any, chatContext: any[]) {
  console.log('📅 Executing schedule plan (simple pattern - no AI SDK tools)...');

  try {
    // Import tools
    const tools = await import('@/app/api/ai/tools/individualTools');

    // Get current schedule for comparison
    const currentSchedule = await readSchedule(userId, plan.data.date);
    const currentBlocks = currentSchedule.data?.blocks || [];

    console.log('📅 Current blocks:', currentBlocks.length);
    console.log('📅 Planned blocks:', plan.data.blocks?.length || 0);

    // Build context for AI
    const systemPrompt = `You are a schedule execution agent for ScheduleGenius.

YOUR JOB: Analyze the planned schedule and generate a list of operations to execute.

CONTEXT:
- You have the PLANNED schedule (what it should be)
- You have the CURRENT schedule (what it is now)
- You need to generate a clear execution plan

STRATEGY:
1. Compare current blocks with planned blocks
2. For blocks with real IDs (not temp-X): UPDATE the existing block
3. For blocks with temp-X IDs: CREATE new blocks
4. For current blocks NOT in the plan: DELETE them

IMPORTANT RULES:
- Preserve block IDs when updating (don't create duplicates)
- Preserve task completion status when updating
- If a planned block has same time/title as current block, it's an UPDATE not a CREATE
- Don't delete past blocks (user already completed them)
- Max 30 operations total

FUNCTION NAMES:
- addBlock: Create a new block with {date, time, duration, title, type, tasks}
- updateBlock: Update existing block with {blockId, changes}
- deleteBlock: Delete block with {blockId}

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "operations": [
    {
      "type": "create" | "update" | "delete",
      "function": "addBlock" | "updateBlock" | "deleteBlock",
      "params": { /* function parameters */ },
      "description": "Human-readable description of this operation"
    }
  ],
  "summary": "Overall summary of what will be done"
}`;

    const userPrompt = `PLANNED SCHEDULE:
${JSON.stringify(plan.data.blocks, null, 2)}

CURRENT SCHEDULE:
${JSON.stringify(currentBlocks, null, 2)}

CHAT CONTEXT (for understanding intent):
${chatContext.slice(-3).map((m: any) => `${m.role}: ${m.content || m.message}`).join('\n')}

Generate the execution plan to make current schedule match the planned schedule.`;

    // Get execution plan from AI
    const response = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.2,
      maxTokens: 3000
    });

    console.log('📅 AI Response received');

    // Parse the JSON response
    let executionPlan;
    try {
      const jsonMatch = response.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
      executionPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('📅 Failed to parse AI response as JSON:', parseError);
      console.log('📅 Raw response:', response.text);

      return {
        success: false,
        error: 'Failed to parse execution plan',
        details: 'AI response could not be parsed as JSON'
      };
    }

    console.log('📅 Execution plan parsed successfully');
    console.log('📅 Total operations:', executionPlan.operations?.length || 0);

    // Execute operations manually
    const operations = executionPlan.operations || [];
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const op of operations) {
      try {
        console.log(`📅 Executing ${op.type}: ${op.description}`);

        let result;
        switch (op.function) {
          case 'addBlock':
          case 'createBlock': // Alias
            result = await tools.addBlock(userId, op.params);
            break;
          case 'updateBlock':
            result = await tools.updateBlock(userId, op.params);
            break;
          case 'deleteBlock':
            result = await tools.deleteBlock(userId, op.params);
            break;
          default:
            console.warn(`⚠️ Unknown function: ${op.function}`);
            result = { success: false, error: `Unknown function: ${op.function}` };
        }

        results.push({
          operation: op.description,
          success: result?.success !== false,
          result
        });

        if (result?.success !== false) {
          successCount++;
          console.log(`✅ Success: ${op.description}`);
        } else {
          errorCount++;
          console.log(`❌ Error: ${op.description}`, result);
        }

      } catch (opError) {
        errorCount++;
        console.error(`❌ Error executing ${op.function}:`, opError);
        results.push({
          operation: op.description,
          success: false,
          error: opError instanceof Error ? opError.message : String(opError)
        });
      }
    }

    console.log('📅 Execution complete');
    console.log(`📅 Results: ${successCount} succeeded, ${errorCount} failed`);

    let summaryMessage = executionPlan.summary || 'Schedule updated';
    summaryMessage += `\n\n✅ ${successCount} operations succeeded`;
    if (errorCount > 0) {
      summaryMessage += `\n❌ ${errorCount} operations failed`;
    }

    return {
      success: errorCount === 0,
      executed: true,
      type: 'schedule',
      result: {
        message: summaryMessage,
        operations: operations.length,
        successCount,
        errorCount,
        details: results
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('📅 Schedule execution error:', error);
    return {
      success: false,
      error: 'Failed to execute schedule plan',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

// ==================== GOAL PLAN EXECUTION ====================

async function executeGoalPlanAgentic(userId: string, plan: any, chatContext: any[]) {
  console.log('🎯 Executing goal plan (simple pattern - no AI SDK tools)...');

  try {
    // Import tools
    const tools = await import('@/app/api/ai/tools/individualTools');

    // Get current inventory to avoid duplicates
    const inventory = await readInventory(userId, 'all');

    const systemPrompt = `You are a goal plan execution agent for ScheduleGenius.

YOUR JOB: Analyze the goal plan and generate a list of operations to execute.

CONTEXT:
- You have a GOAL PLAN with: 1 goal, multiple projects, routines, tasks, and events
- You need to create everything in the right order (dependencies matter!)
- ALL items (projects, routines, events, tasks) should be linked to the goal

STRATEGY (EXECUTE IN THIS ORDER):
1. Create the GOAL first (you need its ID for everything else)
2. Create PROJECTS (link them to the goal using goalId, include tasks inline)
3. Create ROUTINES (link them to the goal using goalId, include tasks inline)
4. Create EVENTS (link them to the goal using goalId)
5. Create standalone TASKS (link them to the goal using goalId)

IMPORTANT RULES:
- Create goal FIRST - everything needs the goalId
- ALWAYS link items to the goal: projects, routines, events, AND tasks all can have goalId
- Don't create duplicate goals (check if similar goal exists)
- Don't create routines that conflict with existing ones (same days/time)
- Include tasks when creating projects/routines (use inline tasks parameter)
- Max 25 operations total
- Store the goalId from step 1 and use it in all subsequent operations

FUNCTION NAMES:
- createGoal: {content, deadline, color}
- createProject: {name, goalId, dueDate, tasks: [{title, duration, dueDate}]}
- createRoutine: {name, days, startTime, duration, goalId, tasks: [{title, duration}]}
- createEvent: {name, date, time, duration, goalId}
- createTask: {title, duration, dueDate, goalId}

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "operations": [
    {
      "type": "create",
      "entity": "goal" | "project" | "routine" | "event" | "task",
      "function": "createGoal" | "createProject" | "createRoutine" | "createEvent" | "createTask",
      "params": { /* function parameters */ },
      "description": "Human-readable description",
      "useGoalId": true  // if this operation needs goalId from first operation
    }
  ],
  "summary": "Overall summary of what will be created"
}

Order operations properly: goal first, then everything else.`;

    const userPrompt = `GOAL PLAN TO CREATE:
${JSON.stringify(plan.data.plan, null, 2)}

EXISTING INVENTORY (to avoid duplicates):
Goals: ${inventory.data?.goals?.length || 0}
${inventory.data?.goals?.map((g: any) => `- ${g.content}`).join('\n') || 'None'}

Routines: ${inventory.data?.routines?.length || 0}
${inventory.data?.routines?.map((r: any) => `- ${r.name} (${r.days?.join(', ')} at ${r.time})`).join('\n') || 'None'}

CHAT CONTEXT:
${chatContext.slice(-3).map((m: any) => `${m.role}: ${m.content || m.message}`).join('\n')}

Generate the execution plan. Remember: GOAL first, then projects, then routines, then events, then tasks.`;

    // Get execution plan from AI
    const response = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.2,
      maxTokens: 2500
    });

    console.log('🎯 AI Response received');

    // Parse the JSON response
    let executionPlan;
    try {
      const jsonMatch = response.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
      executionPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('🎯 Failed to parse AI response as JSON:', parseError);
      console.log('🎯 Raw response:', response.text);

      return {
        success: false,
        error: 'Failed to parse execution plan',
        details: 'AI response could not be parsed as JSON'
      };
    }

    console.log('🎯 Execution plan parsed successfully');
    console.log('🎯 Total operations:', executionPlan.operations?.length || 0);

    // Execute operations manually
    const operations = executionPlan.operations || [];
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    let createdGoalId: string | null = null;

    for (const op of operations) {
      try {
        console.log(`🎯 Executing ${op.entity}: ${op.description}`);

        // If this operation needs goalId, inject it
        if (op.useGoalId && createdGoalId && op.params) {
          op.params.goalId = createdGoalId;
        }

        let result;
        switch (op.function) {
          case 'createGoal':
            result = await tools.createGoal(userId, op.params);
            // Store the created goalId for use in subsequent operations
            if (result?.data?.goalId) {
              createdGoalId = result.data.goalId;
              console.log(`✅ Goal created with ID: ${createdGoalId}`);
            }
            break;
          case 'createProject':
            result = await tools.createProject(userId, op.params);
            break;
          case 'createRoutine':
            result = await tools.createRoutine(userId, op.params);
            break;
          case 'createEvent':
            result = await tools.createEvent(userId, op.params);
            break;
          case 'createTask':
            result = await tools.createTask(userId, op.params);
            break;
          default:
            console.warn(`⚠️ Unknown function: ${op.function}`);
            result = { success: false, error: `Unknown function: ${op.function}` };
        }

        results.push({
          operation: op.description,
          success: result?.success !== false,
          result
        });

        if (result?.success !== false) {
          successCount++;
          console.log(`✅ Success: ${op.description}`);
        } else {
          errorCount++;
          console.log(`❌ Error: ${op.description}`, result);
        }

      } catch (opError) {
        errorCount++;
        console.error(`❌ Error executing ${op.function}:`, opError);
        results.push({
          operation: op.description,
          success: false,
          error: opError instanceof Error ? opError.message : String(opError)
        });
      }
    }

    console.log('🎯 Execution complete');
    console.log(`🎯 Results: ${successCount} succeeded, ${errorCount} failed`);

    let summaryMessage = executionPlan.summary || 'Goal plan created';
    summaryMessage += `\n\n✅ ${successCount} operations succeeded`;
    if (errorCount > 0) {
      summaryMessage += `\n❌ ${errorCount} operations failed`;
    }

    return {
      success: errorCount === 0,
      executed: true,
      type: 'goal_plan',
      result: {
        message: summaryMessage,
        operations: operations.length,
        successCount,
        errorCount,
        details: results
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('🎯 Goal plan execution error:', error);
    return {
      success: false,
      error: 'Failed to execute goal plan',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

// ==================== CUD EXECUTION ====================

async function executeCUDPlanAgentic(userId: string, plan: any, chatContext: any[]) {
  console.log('🔧 Executing CUD plan (simple pattern - no AI SDK tools)...');

  try {
    // Import tools
    const tools = await import('@/app/api/ai/tools/individualTools');

    // Get current state for verification
    const [inventory, schedule] = await Promise.all([
      readInventory(userId, 'all'),
      readSchedule(userId, plan.data.date || 'today')
    ]);

    const systemPrompt = `You are a CUD (Create/Update/Delete) execution agent for ScheduleGenius.

YOUR JOB: Analyze the CUD plan and generate a list of operations to execute.

CONTEXT:
- You have a CUD PLAN with operations organized by type (create/update/delete)
- You have current database state to verify IDs exist
- You need to generate a clear execution order

STRATEGY (EXECUTE IN THIS ORDER):
1. DELETE operations first (clear space)
2. UPDATE operations second (modify existing)
3. CREATE operations last (add new)

IMPORTANT RULES:
- For DELETE/UPDATE: Verify the ID exists in the current state
- For CREATE: Note if similar items already exist
- Generate a clear list of operations with details
- Max 30 operations total

FUNCTION NAMES (use these exact names):
Goals: createGoal, updateGoal, deleteGoal
Projects: createProject, updateProject, deleteProject
Tasks: createTask, updateTask, deleteTask
Events: createEvent, updateEvent, deleteEvent
Routines: createRoutine, updateRoutine, deleteRoutine
Blocks: addBlock, updateBlock, deleteBlock (NOTE: use "addBlock" not "createBlock")

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "operations": [
    {
      "type": "delete" | "update" | "create",
      "entity": "goal" | "project" | "task" | "event" | "routine" | "block",
      "function": "deleteGoal" | "updateProject" | "createTask" | etc,
      "params": { /* function parameters */ },
      "description": "Human-readable description of this operation"
    }
  ],
  "summary": "Overall summary of what will be done",
  "warnings": ["Any warnings about missing IDs or conflicts"]
}

Order operations properly: all deletes, then updates, then creates.`;

    const userPrompt = `CUD PLAN TO EXECUTE:
${JSON.stringify(plan.data.changes, null, 2)}

CURRENT STATE:
Inventory:
- Goals: ${inventory.data?.goals?.length || 0}
${inventory.data?.goals?.map((g: any) => `  - ${g.content} (ID: ${g.id})`).join('\n') || ''}
- Projects: ${inventory.data?.projects?.length || 0}
${inventory.data?.projects?.map((p: any) => `  - ${p.name} (ID: ${p.id})`).join('\n') || ''}
- Tasks: ${inventory.data?.tasks?.length || 0}
${inventory.data?.tasks?.map((t: any) => `  - ${t.title} (ID: ${t.id})`).join('\n') || ''}
- Routines: ${inventory.data?.routines?.length || 0}
${inventory.data?.routines?.map((r: any) => `  - ${r.name} (ID: ${r.id})`).join('\n') || ''}
- Events: ${inventory.data?.events?.length || 0}
${inventory.data?.events?.map((e: any) => `  - ${e.name} (ID: ${e.id})`).join('\n') || ''}

Schedule (${plan.data.date || 'today'}):
- Blocks: ${schedule.data?.blocks?.length || 0}
${schedule.data?.blocks?.map((b: any) => `  - ${b.title} (ID: ${b.id}, Time: ${b.time})`).join('\n') || ''}

CHAT CONTEXT:
${chatContext.slice(-3).map((m: any) => `${m.role}: ${m.content || m.message}`).join('\n')}

Generate the execution plan. Remember: DELETE first, UPDATE second, CREATE last.`;

    // Get execution plan from AI
    const response = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.2,
      maxTokens: 2000
    });

    console.log('🔧 AI Response received');

    // Parse the JSON response
    let executionPlan;
    try {
      const jsonMatch = response.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.text;
      executionPlan = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('🔧 Failed to parse AI response as JSON:', parseError);
      console.log('🔧 Raw response:', response.text);

      return {
        success: false,
        error: 'Failed to parse execution plan',
        details: 'AI response could not be parsed as JSON'
      };
    }

    console.log('🔧 Execution plan parsed successfully');
    console.log('🔧 Total operations:', executionPlan.operations?.length || 0);

    // Log warnings if any
    if (executionPlan.warnings && executionPlan.warnings.length > 0) {
      console.log('⚠️ Warnings:', executionPlan.warnings);
    }

    // Execute operations manually
    const operations = executionPlan.operations || [];
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const op of operations) {
      try {
        console.log(`🔧 Executing ${op.type} ${op.entity}: ${op.description}`);

        // Call the appropriate function
        let result;
        switch (op.function) {
          // Goal operations
          case 'createGoal':
            result = await tools.createGoal(userId, op.params);
            break;
          case 'updateGoal':
            result = await tools.updateGoal(userId, op.params);
            break;
          case 'deleteGoal':
            result = await tools.deleteGoal(userId, op.params);
            break;

          // Project operations
          case 'createProject':
            result = await tools.createProject(userId, op.params);
            break;
          case 'updateProject':
            result = await tools.updateProject(userId, op.params);
            break;
          case 'deleteProject':
            result = await tools.deleteProject(userId, op.params);
            break;

          // Task operations
          case 'createTask':
            result = await tools.createTask(userId, op.params);
            break;
          case 'updateTask':
            result = await tools.updateTask(userId, op.params);
            break;
          case 'deleteTask':
            result = await tools.deleteTask(userId, op.params);
            break;

          // Event operations
          case 'createEvent':
            result = await tools.createEvent(userId, op.params);
            break;
          case 'updateEvent':
            result = await tools.updateEvent(userId, op.params);
            break;
          case 'deleteEvent':
            result = await tools.deleteEvent(userId, op.params);
            break;

          // Routine operations
          case 'createRoutine':
            result = await tools.createRoutine(userId, op.params);
            break;
          case 'updateRoutine':
            result = await tools.updateRoutine(userId, op.params);
            break;
          case 'deleteRoutine':
            result = await tools.deleteRoutine(userId, op.params);
            break;

          // Block operations
          case 'addBlock':
          case 'createBlock': // Alias for addBlock
            result = await tools.addBlock(userId, op.params);
            break;
          case 'updateBlock':
            result = await tools.updateBlock(userId, op.params);
            break;
          case 'deleteBlock':
            result = await tools.deleteBlock(userId, op.params);
            break;

          default:
            console.warn(`⚠️ Unknown function: ${op.function}`);
            result = { success: false, error: `Unknown function: ${op.function}` };
        }

        results.push({
          operation: op.description,
          success: result?.success !== false,
          result
        });

        if (result?.success !== false) {
          successCount++;
          console.log(`✅ Success: ${op.description}`);
        } else {
          errorCount++;
          console.log(`❌ Error: ${op.description}`, result);
        }

      } catch (opError) {
        errorCount++;
        console.error(`❌ Error executing ${op.function}:`, opError);
        results.push({
          operation: op.description,
          success: false,
          error: opError instanceof Error ? opError.message : String(opError)
        });
      }
    }

    console.log('🔧 Execution complete');
    console.log(`🔧 Results: ${successCount} succeeded, ${errorCount} failed`);

    // Build summary message
    let summaryMessage = executionPlan.summary || 'Operations executed';
    if (executionPlan.warnings && executionPlan.warnings.length > 0) {
      summaryMessage += '\n\n⚠️ Warnings:\n' + executionPlan.warnings.map((w: string) => `- ${w}`).join('\n');
    }
    summaryMessage += `\n\n✅ ${successCount} operations succeeded`;
    if (errorCount > 0) {
      summaryMessage += `\n❌ ${errorCount} operations failed`;
    }

    return {
      success: errorCount === 0,
      executed: true,
      type: 'cud',
      result: {
        message: summaryMessage,
        operations: operations.length,
        successCount,
        errorCount,
        details: results
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('🔧 CUD execution error:', error);
    return {
      success: false,
      error: 'Failed to execute CUD plan',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

// ==================== READ TOOLS (Stubs for future implementation) ====================

/**
 * Read current or past schedules
 */
export async function readSchedule(userId: string, date?: string) {
  console.log('📅 readSchedule called with userId:', userId, 'date:', date);
  try {
    await dbConnect();
    
    // Parse date - handle 'today', 'yesterday', or specific dates
    let targetDate: string;
    const today = new Date();
    
    if (!date || date === 'today') {
      targetDate = today.toISOString().split('T')[0];
    } else if (date === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split('T')[0];
    } else {
      targetDate = date; // Assume it's already in YYYY-MM-DD format
    }
    
    // Get user's MongoDB ID
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId }).lean();
    console.log('🔍 Found user:', user ? `MongoDB ID: ${user._id}` : 'NOT FOUND');
    
    if (!user) {
      return {
        success: false,
        data: null,
        message: 'User not found'
      };
    }
    
    // Fetch the day with populated blocks and tasks
    const Day = (await import('@/models/Day')).default;
    const Block = (await import('@/models/Block')).default;
    const Task = (await import('@/models/Task')).default;
    
    const day = await Day.findOne({ 
      user: user._id, 
      date: targetDate 
    })
    .populate({
      path: 'blocks',
      model: Block,
      populate: {
        path: 'tasks',
        model: Task
      }
    })
    .lean();
    
    if (!day || !day.blocks || day.blocks.length === 0) {
      console.log('📆 No schedule found for date:', targetDate);
      return {
        success: true,
        data: {
          date: targetDate,
          blocks: [],
          summary: {
            totalBlocks: 0,
            totalTasks: 0,
            totalDuration: 0,
            completedTasks: 0
          }
        },
        message: `No schedule found for ${targetDate}`
      };
    }
    
    // Format the schedule data
    const blocks = day.blocks.map((block: any) => ({
      id: block._id.toString(),
      title: block.title,
      time: block.time,
      duration: block.duration,
      type: block.type,
      completed: block.completed || false,
      tasks: (block.tasks || []).map((task: any) => ({
        id: task._id.toString(),
        title: task.title,
        duration: task.duration || 30,
        completed: task.completed || false
      })),
      metadata: block.metadata || {}
    }));
    
    // Calculate summary stats
    const totalTasks = blocks.reduce((sum: number, b: any) => sum + b.tasks.length, 0);
    const completedTasks = blocks.reduce((sum: number, b: any) => 
      sum + b.tasks.filter((t: any) => t.completed).length, 0);
    const totalDuration = blocks.reduce((sum: number, b: any) => sum + b.duration, 0);
    
    console.log('🎯 Schedule found:', { date: targetDate, blocks: blocks.length, tasks: totalTasks });
    return {
      success: true,
      data: {
        date: targetDate,
        dayId: day._id.toString(),
        blocks,
        summary: {
          totalBlocks: blocks.length,
          totalTasks,
          completedTasks,
          totalDuration,
          startTime: blocks[0]?.time || 'N/A',
          endTime: blocks[blocks.length - 1]?.time || 'N/A',
          utilization: Math.round((totalDuration / 480) * 100) // Assuming 8hr workday
        }
      },
      message: `Retrieved schedule for ${targetDate}: ${blocks.length} blocks, ${totalTasks} tasks`
    };
    
  } catch (error) {
    console.error('Error reading schedule:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to read schedule',
      message: 'Error fetching schedule data'
    };
  }
}

/**
 * Read user's inventory (goals, projects, tasks, events, routines)
 */
export async function readInventory(userId: string, type?: string) {
  console.log('📚 readInventory called with userId:', userId, 'type:', type);
  try {
    await dbConnect();
    
    const inventory: any = {};
    
    // Fetch based on type or all
    if (!type || type === 'all' || type.includes('goal')) {
      const Goal = (await import('@/models/Goal')).default;
      const goals = await Goal.find({ userId }).sort({ order: 1 }).lean();
      inventory.goals = goals.map((g: any) => ({
        id: g._id.toString(),
        content: g.content,
        color: g.color || 'purple',
        deadline: g.deadline,
        order: g.order
      }));
    }
    
    if (!type || type === 'all' || type.includes('project')) {
      const Project = (await import('@/models/Project')).default;
      const Task = (await import('@/models/Task')).default;

      const projects = await Project.find({
        userId,
        isDeleted: { $ne: true },
        completed: { $ne: true }
      })
      .sort({ order: 1 })
      .lean();

      // Fetch all tasks for these projects in one query
      const projectIds = projects.map(p => p._id);
      const allTasks = await Task.find({
        projectId: { $in: projectIds },
        completed: { $ne: true }
      }).lean();

      // Group tasks by projectId
      const tasksByProject = new Map();
      allTasks.forEach((task: any) => {
        const pid = task.projectId.toString();
        if (!tasksByProject.has(pid)) {
          tasksByProject.set(pid, []);
        }
        tasksByProject.get(pid).push(task);
      });

      inventory.projects = projects.map((p: any) => {
        const projectId = p._id.toString();
        const tasks = tasksByProject.get(projectId) || [];

        return {
          id: projectId,
          name: p.name,
          description: p.description,
          tasksCount: tasks.length,
          tasks: tasks.map((t: any) => ({
            id: t._id?.toString(),
            title: t.title || t.name,
            duration: t.duration || 30,
            completed: t.completed || false
          })),
          goalId: p.goalId,
          dueDate: p.dueDate
        };
      });
    }
    
    if (!type || type === 'all' || type.includes('task')) {
      const Task = (await import('@/models/Task')).default;
      const tasks = await Task.find({ 
        userId,
        completed: { $ne: true },
        projectId: { $exists: false } // Standalone tasks only
      })
      .sort({ createdAt: -1 })
      .lean();
      
      inventory.tasks = tasks.map((t: any) => ({
        id: t._id.toString(),
        title: t.title,
        duration: t.duration || 30,
        priority: t.priority,
        dueDate: t.dueDate
      }));
    }
    
    if (!type || type === 'all' || type.includes('event')) {
      const Event = (await import('@/models/Event')).default;
      const events = await Event.find({ userId })
        .sort({ date: 1 })
        .lean();
      
      inventory.events = events.map((e: any) => ({
        id: e._id.toString(),
        name: e.name,
        date: e.date || e.dueDate,
        startTime: e.startTime,
        endTime: e.endTime,
        location: e.location,
        isRecurring: e.isRecurring,
        recurringDays: e.recurringDays
      }));
    }
    
    if (!type || type === 'all' || type.includes('routine')) {
      const Routine = (await import('@/models/Routine')).default;
      const routines = await Routine.find({ userId })
        .sort({ time: 1 })
        .lean();
      
      inventory.routines = routines.map((r: any) => ({
        id: r._id.toString(),
        name: r.name,
        time: r.time,
        duration: r.duration || 60,
        days: r.days || [],
        tasks: r.tasks || []
      }));
    }
    
    // Add summary stats
    const stats = {
      totalGoals: inventory.goals?.length || 0,
      totalProjects: inventory.projects?.length || 0,
      totalTasks: inventory.tasks?.length || 0,
      totalEvents: inventory.events?.length || 0,
      totalRoutines: inventory.routines?.length || 0
    };
    
    console.log('📦 Inventory found:', stats);
    return { 
      success: true, 
      data: inventory,
      stats,
      message: `Retrieved ${stats.totalGoals} goals, ${stats.totalProjects} projects, ${stats.totalTasks} tasks, ${stats.totalEvents} events, ${stats.totalRoutines} routines`
    };
    
  } catch (error) {
    console.error('Error reading inventory:', error);
    return { 
      success: false, 
      error: 'Failed to read inventory',
      data: {},
      message: 'Error fetching inventory data'
    };
  }
}

/**
 * Read conversation history
 */
export async function readConversations(userId: string, options?: { 
  dayId?: string; 
  date?: string;
  limit?: number;
  searchTerm?: string;
}) {
  try {
    await dbConnect();
    
    // Get user's MongoDB ID
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ clerkId: userId }).lean();
    console.log('🔍 Found user:', user ? `MongoDB ID: ${user._id}` : 'NOT FOUND');
    
    if (!user) {
      return {
        success: false,
        data: null,
        message: 'User not found'
      };
    }
    
    const Chat = (await import('@/models/Chat')).default;
    
    // Build query
    const query: any = { userId: user._id };
    
    if (options?.dayId) {
      query.dayId = options.dayId;
    }
    
    if (options?.date) {
      // Handle date-based filtering
      let targetDate: string;
      const today = new Date();
      
      if (options.date === 'today') {
        targetDate = today.toISOString().split('T')[0];
      } else if (options.date === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        targetDate = yesterday.toISOString().split('T')[0];
      } else {
        targetDate = options.date;
      }
      
      query.date = targetDate;
    }
    
    if (options?.searchTerm) {
      query.$text = { $search: options.searchTerm };
    }
    
    // Fetch conversations
    const limit = options?.limit || 50; // Default to last 50 messages
    const conversations = await Chat.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    // Reverse to get chronological order
    conversations.reverse();
    
    // Format conversations
    const formattedConversations = conversations.map((chat: any) => ({
      id: chat._id.toString(),
      role: chat.role,
      message: chat.message,
      timestamp: chat.timestamp,
      date: chat.date,
      metadata: chat.metadata || {}
    }));
    
    // Group by date if multiple dates
    const groupedByDate = formattedConversations.reduce((acc: any, chat: any) => {
      if (!acc[chat.date]) {
        acc[chat.date] = [];
      }
      acc[chat.date].push(chat);
      return acc;
    }, {});
    
    // Calculate summary
    const userMessages = formattedConversations.filter(c => c.role === 'user').length;
    const aiMessages = formattedConversations.filter(c => c.role === 'ai').length;
    
    return {
      success: true,
      data: {
        conversations: formattedConversations,
        groupedByDate,
        count: formattedConversations.length,
        summary: {
          totalMessages: formattedConversations.length,
          userMessages,
          aiMessages,
          dates: Object.keys(groupedByDate),
          firstMessage: formattedConversations[0]?.timestamp,
          lastMessage: formattedConversations[formattedConversations.length - 1]?.timestamp
        }
      },
      message: `Retrieved ${formattedConversations.length} messages from ${Object.keys(groupedByDate).length} day(s)`
    };
    
  } catch (error) {
    console.error('Error reading conversations:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to read conversations',
      message: 'Error fetching conversation history'
    };
  }
}