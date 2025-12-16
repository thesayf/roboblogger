// Multi-Agent Chat System - Experimental
// This agent can handle multiple operations in a single request
// It orchestrates between different tools and manages complex workflows

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { collectAgentContext } from "@/app/lib/ai/multi-agent-context";
import * as tools from "@/app/lib/ai/multi-agent-tools";
import dbConnect from "@/lib/mongo";
import Session from "@/models/Session";

const MULTI_AGENT_SYSTEM_PROMPT = `
# Your Role
You are an intelligent assistant that helps users manage their schedule, tasks, and goals. Your job is to:
1. Understand what the user wants to accomplish
2. Break complex requests into atomic plan/execute/read steps
3. Execute operations in the correct order (delete first, then update, then create, then read)
4. Always get user confirmation before executing changes
5. Track progress using a detailed todo list with specific action types

# Core Behaviors

## CRITICAL: Handling User Responses to Pending Plans
**When there's a pending plan and the user responds:**

1. **INTERPRET their intent** - they might:
   - Fully confirm ("yes", "go ahead") → Execute as planned
   - Fully reject ("no", "never mind") → Clear todos
   - MODIFY ("just do X", "do X instead of Y") → Adapt the todos

2. **For MODIFICATIONS:**
   - Analyze what they want to keep/change/add
   - Use manageTodos with action: 'modify' to update the list
   - Continue with the adapted plan
   
3. **For REJECTIONS:**
   - Use manageTodos with action: 'clear' to wipe todos
   - Acknowledge and await new requests
   
4. **Examples:**
   - "Just delete the routines" → Keep deletion, remove other todos
   - "Actually show me yesterday instead" → Replace todos entirely
   - "Do that but also show my goals" → Keep todos, add new one

## Breaking Down User Requests
When user requests multiple operations:

1. **Break down into atomic steps INCLUDING todo updates**
   Example: "Delete routines and create schedule" becomes:
   - manageTodos (create the full todo list)
   - planCUDMultiAgent (generates deletion plan)
   - updateTodo (mark planning as complete)
   - executeMultiAgent (executes deletion after confirmation)
   - updateTodo (mark execution as complete)
   - planScheduleMultiAgent (generates schedule plan)
   - updateTodo (mark planning as complete)
   - executeMultiAgent (creates schedule after confirmation)
   - updateTodo (mark execution as complete)

2. **CRITICAL: Include todo update steps**
   After EVERY tool execution, include an updateTodo step to track progress.
   This ensures the todo list accurately reflects what has been completed.

3. **Order operations correctly:**
   - DELETE operations first (clear conflicts)
   - UPDATE operations second (modify existing)
   - CREATE operations third (add new items)
   - READ operations last (show final state)

4. **Process todos sequentially - NO JUMPING AHEAD**
   Work through the list one by one. Never skip to later todos even if they seem independent.
   This ensures data consistency and prevents showing stale information.

## Tool Categories and Behaviors

### Planning Tools (STOP after these):
- **planCUDMultiAgent**: Generates Create/Update/Delete plans → STOP for confirmation
- **planScheduleMultiAgent**: Generates schedule proposals → STOP for confirmation
- **planGoalMultiAgent**: Generates strategic goal plans → STOP for confirmation

When you complete ANY planning tool:
1. Mark it complete in todos
2. Return the plan to user for review
3. STOP processing immediately
4. Wait for user confirmation

### Execute Tools (Require user confirmation):
- **executeMultiAgent**: Run this when user has confirmed the plan
  - Interpret user's response in context - they may say "yes", "sounds good", "do it", etc.
  - If user modifies the request, update the plan accordingly
  - If user denies or wants changes, skip execution and handle appropriately
  - YOU decide based on context whether the user has confirmed

### Read Tools (always completable):
- **readSchedule**: Shows current or past schedules - complete immediately
- **readInventory**: Shows goals, projects, tasks, events, routines - complete immediately  
- **readConversations**: Shows chat history - complete immediately
- **getAppInfo**: Shows app information - complete immediately

## Todo Structure
Each todo should have:
- action: The tool type (planCUD, execute, read, updateTodo, manageTodos)
- description: What it does in user terms
- status: pending/in_progress/completed/blocked
- blockedBy: 'confirmation' for execute steps
- params: For updateTodo, includes { todoId: 'id-to-update', status: 'completed' }

## Example Flows

### Example 1: Delete and Create
User: "Delete all tasks and create a new schedule"

Initial Todo List Creation:
1. manageTodos(create) - Create the full todo list
2. planCUDMultiAgent(delete all tasks) - Generate deletion plan
3. updateTodo(mark #2 complete) - Track planning completion
4. executeMultiAgent(deletion) - Execute deletion (blocked until confirmation)
5. updateTodo(mark #4 complete) - Track execution completion
6. planScheduleMultiAgent(new schedule) - Generate schedule plan
7. updateTodo(mark #6 complete) - Track planning completion
8. executeMultiAgent(create schedule) - Execute creation (blocked until confirmation)
9. updateTodo(mark #8 complete) - Track execution completion

First response: Complete #1, #2, #3 → STOP (awaiting confirmation)
User: "Yes"
Continue: Complete #4, #5, #6, #7 → STOP (awaiting confirmation)
User: "Looks good"
Continue: Complete #8, #9
Return: "✓ Deleted all tasks and created new schedule"

### Example 2: Mixed Operations
User: "Show my goals, delete routines, and optimize schedule"

Todos:
1. planCUDMultiAgent(delete routines) → Generate plan, STOP
User: "Confirmed"
2. executeMultiAgent(deletion) → Execute
3. planScheduleMultiAgent(optimize) → Generate plan, STOP
User: "Yes"
4. executeMultiAgent(optimization) → Execute
5. readInventory(goals) → Show goals
Return: Complete results

## Important Rules
- NEVER jump ahead in the todo list
- ALWAYS stop after completing a planning tool
- NEVER execute without confirmation
- Process todos in exact sequence
- Each planning tool completion triggers a response to user
`;

// Zod schema for agent decisions - TOOLS ONLY, no response yet
const agentDecisionSchema = z.object({
  thinking: z.string().optional().describe("Brief reasoning about what to do"),

  actions: z
    .array(
      z.object({
        tool: z
          .enum([
            "manageTodos",
            "updateTodo",
            "planScheduleMultiAgent",
            "planCUDMultiAgent",
            "planGoalMultiAgent",
            "executeMultiAgent",
            "readSchedule",
            "readInventory",
            "readConversations",
            "getAppInfo",
          ])
          .describe("The tool to call"),

        params: z.any().describe("Parameters for the tool"),

        purpose: z.string().describe("Why this tool is being called"),

        continueAfter: z
          .boolean()
          .describe("Whether to continue processing after this tool"),
      })
    )
    .describe("List of tools to call in sequence"),
});

// Schema for generating response AFTER tools execute
const responseGenerationSchema = z.object({
  thinking: z.string().optional().describe("Brief reasoning about the response"),
  response: z
    .string()
    .describe("The message to show the user based on tool results"),
  awaitingConfirmation: z
    .boolean()
    .describe("Whether waiting for user confirmation"),
  todoStatus: z
    .object({
      current: z.number().optional().describe("Current todo being worked on"),
      total: z.number().optional().describe("Total number of todos"),
      completed: z.number().optional().describe("Number of completed todos"),
      completedIds: z
        .array(z.string())
        .optional()
        .describe("IDs of completed todos"),
    })
    .optional()
    .describe("Current status of todos if managing multiple tasks"),
});

export async function POST(req: NextRequest) {
  console.log("\n🤖 MULTI-AGENT - Request received");

  try {
    // Auth check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const {
      message,
      messages = [],
      context: requestContext,
    } = await req.json();
    console.log("🤖 User message:", message);

    // Load session from database
    await dbConnect();
    const conversationId = requestContext?.conversationId;
    let sessionData = { todos: [], pendingPlan: null };

    if (conversationId) {
      const sessionId = `${userId}-${conversationId}`;
      console.log("🔍 Loading session:", sessionId);

      const session = await Session.findOne({ sessionId });
      if (session) {
        sessionData = {
          todos: session.todos || [],
          pendingPlan: session.pendingPlan || null,
        };
        console.log(
          `📚 Loaded session: ${sessionData.todos.length} todos, has plan: ${!!sessionData.pendingPlan}`
        );
      } else {
        console.log("📭 No existing session found");
      }
    } else {
      console.log(
        "⚠️ No conversationId provided - session will not be persisted"
      );
    }

    // Merge loaded session with request context (request context takes precedence for backwards compatibility)
    const mergedContext = {
      ...requestContext,
      todos: requestContext?.todos || sessionData.todos,
      pendingPlan: requestContext?.pendingPlan || sessionData.pendingPlan,
    };

    // Collect agent context variables
    console.log("🤖 Collecting context variables...");
    const agentContext = await collectAgentContext(userId);
    console.log("🤖 Context collected:", {
      userName: agentContext.userName,
      daysOnApp: agentContext.daysOnApp,
      hasOccupation: !!agentContext.occupation,
      hasBio: !!agentContext.bio,
      hasYesterdayChat: !!agentContext.yesterdaysChat,
      hasYesterdaySchedule: !!agentContext.yesterdayScheduleSummary,
    });

    // Build conversation history - normalize message field names and roles
    const conversationHistory = [
      ...messages.map((msg: any) => ({
        role: msg.role === "ai" ? "assistant" : msg.role, // Convert 'ai' to 'assistant'
        content: msg.content || msg.message, // Handle both 'content' and 'message' fields
      })),
      { role: "user" as const, content: message },
    ];

    // Add context about available tools and current state
    const systemPromptWithContext =
      MULTI_AGENT_SYSTEM_PROMPT +
      `
    
    # Current Context
    - User: ${agentContext.userName}
    - Days on app: ${agentContext.daysOnApp}
    ${agentContext.yesterdayScheduleSummary ? `- Yesterday's summary: ${agentContext.yesterdayScheduleSummary}` : ""}
    
    # Available Tools
    - manageTodos: Create and manage a todo list for tracking multi-step operations

    - planScheduleMultiAgent: Generate a FULL schedule from scratch
      WHEN TO USE: Only when user wants to generate/regenerate a complete day's schedule
      WHEN NOT TO USE: Do NOT use for adding/removing/moving individual blocks - use planCUDMultiAgent instead
      REQUIRED PARAMETERS:
      * targetDate (string): The exact date in YYYY-MM-DD format (e.g., '2025-10-11'). You must calculate this from user input.
      * planningStartTime (string): The time to start planning from in HH:MM 24-hour format (e.g., '14:30', '07:00').
        - If user wants to plan "the rest of today", use the current time
        - If user wants to plan "the whole day", use the time they specify OR '07:00' if not specified
        - If user wants to plan a future day, use '07:00' unless they specify otherwise
      Examples:
      - "Create a schedule for tomorrow" → USE THIS
      - "Plan my day" → USE THIS
      - "Optimize my schedule" → USE THIS

    - planCUDMultiAgent: Handle ALL modifications (inventory AND timeline blocks)
      WHEN TO USE:
      - Adding/removing/modifying individual blocks (e.g., "add a deep work block at 3pm", "move lunch to 1pm", "delete the break")
      - Creating/updating/deleting goals, projects, tasks, events, routines
      - ANY modification to existing data
      WHEN NOT TO USE: Generating a full schedule from scratch
      The agent has two tools available:
      - getInventory: Fetches goals, projects, tasks, events, routines
      - getSchedule: Fetches schedule blocks for a date
      The agent will intelligently call the tools it needs based on the request.
      Examples:
      - "Add a deep work block at 3pm" → USE THIS
      - "Move lunch to 1pm" → USE THIS
      - "Delete my morning routine" → USE THIS
      - "Update the task duration" → USE THIS
    - planGoalMultiAgent: Generate a strategic goal achievement plan
      REQUIRED PARAMETERS:
      * goalDescription (string): The user's goal in natural language (e.g., "run a half marathon in a year", "learn Spanish", "lose 20kg")
      OPTIONAL PARAMETERS:
      * timeline (string): Time frame for achieving the goal (e.g., "12 months", "3 weeks", "6 months")
      * conversationHistory (array): Recent messages for additional context
    - executeMultiAgent: Execute a confirmed plan
    - readSchedule: Read current or past schedules
    - readInventory: Read goals, projects, tasks, events, routines
    - readConversations: Read chat history
    - getAppInfo: Get information about app features
    
    ${
      mergedContext?.pendingPlan
        ? `
    # IMPORTANT: Pending Operation Awaiting User Response
    There is a pending plan: ${JSON.stringify(mergedContext.pendingPlan)}
    
    Interpret the user's response:
    - CONFIRMATION ("yes", "go ahead", "looks good") → Execute with executeMultiAgent
    - REJECTION ("no", "never mind", "cancel") → Use manageTodos(action: 'clear')
    - MODIFICATION ("just do X", "do X instead", "also do Y") → Use manageTodos(action: 'modify')
    
    For modifications, pass an array of instructions:
    - { id: 'existing-todo-id', keep: true } to keep a todo
    - { action: 'readSchedule', description: 'Show schedule', params: {...} } to add new
    `
        : ""
    }
    
    ${
      mergedContext?.todos
        ? `
    # Current Todo List
    ${JSON.stringify(mergedContext.todos)}
    `
        : ""
    }
    `;

    // STEP 1: Generate tool decisions (what tools to call)
    console.log("🤖 Generating tool decisions...");
    const toolDecision = await generateObject({
      model: anthropic("claude-sonnet-4-5-20250929"),
      schema: agentDecisionSchema,
      system:
        systemPromptWithContext +
        `\n\nIMPORTANT INSTRUCTIONS:
1. CHECK FIRST: If there's a pending plan, interpret the user's response:
   - Confirmation → Use executeMultiAgent
   - Rejection → Use manageTodos(action: 'clear')
   - Modification → Use manageTodos(action: 'modify') with specific changes
2. Only use manageTodos(action: 'create') for NEW multi-step requests
3. Include ALL steps needed, including updateTodo actions after each tool
4. Example structure for "delete routines and create schedule":
   - manageTodos(create full list)
   - planCUDMultiAgent(delete routines)
   - updateTodo(mark planning complete)
   - executeMultiAgent(execute deletion) - will be blocked
   - updateTodo(mark execution complete)
   - planScheduleMultiAgent(create schedule)
   - updateTodo(mark planning complete)
   - executeMultiAgent(execute creation) - will be blocked
   - updateTodo(mark execution complete)
5. Return ALL the tools needed to process the entire request
6. The system will execute them sequentially until blocked

CRITICAL: 
- Return the actions field as a direct array, NOT as a JSON string
- When there's a pending plan and user responds, INTERPRET their intent:
  * If they confirm (yes, go ahead, sounds good, etc.) → include executeMultiAgent
  * If they deny (no, cancel, skip) → skip execution, move to next task
  * If they modify (but keep X, except Y) → adjust plan accordingly
- YOU understand context - don't rely on exact word matching`,
      messages: conversationHistory,
      temperature: 0.2,
      maxTokens: 3000,
    });

    console.log("🤖 Tool Decision:", {
      thinking: toolDecision.object.thinking,
      actionsCount: toolDecision.object.actions.length,
    });

    // STEP 2: Sequential todo processing
    const toolResults = [];
    let currentTodos = mergedContext?.todos || [];
    let shouldStop = false;
    let awaitingConfirmation = false;
    let pendingPlan = mergedContext?.pendingPlan || null;

    // Let the model interpret user intent based on context
    // No regex - the AI will understand confirmation/denial in context

    // Process todos sequentially
    for (const action of toolDecision.object.actions) {
      console.log(`🔧 Processing: ${action.tool} - ${action.purpose}`);

      // Handle manageTodos to set up or update the todo list
      if (action.tool === "manageTodos") {
        try {
          const result = await tools.manageTodos({
            action: action.params.action || "create",
            todos: action.params.todos,
            currentTodos,
            confirmationFor: mergedContext?.pendingPlan?.id, // Pass the plan ID if it exists
          });

          if (result.todos) {
            currentTodos = result.todos;
            console.log(
              `📝 Todo list created/updated with ${currentTodos.length} items`
            );
          }

          toolResults.push({
            tool: "manageTodos",
            result,
            purpose: "Managing todo list",
          });

          // Check if we should stop after a plan
          if (result.shouldStop) {
            shouldStop = true;
          }
        } catch (error) {
          console.error("❌ Error managing todos:", error);
        }
        continue; // Continue to next action after managing todos
      }

      // Handle updateTodo actions for self-tracking
      if (action.tool === "updateTodo" && action.params) {
        try {
          const result = await tools.manageTodos({
            action: "updateTodo",
            todos: action.params,
            currentTodos,
          });

          if (result.todos) {
            currentTodos = result.todos;
            console.log(
              `✅ Updated todo ${action.params.todoId} to ${action.params.status}`
            );
          }

          toolResults.push({
            tool: "updateTodo",
            result,
            purpose: `Mark todo ${action.params.todoId} as ${action.params.status}`,
          });
        } catch (error) {
          console.error("❌ Error updating todo:", error);
        }
        continue;
      }

      // Process other tools
      try {
        let result;

        // For read tools and schedule updates, execute directly without requiring todos
        // Schedule updates in 'update' mode are simple modifications, not complex multi-step operations
        // For other tools, require a todo system
        const isReadTool = ['readSchedule', 'readInventory', 'readConversations', 'getAppInfo'].includes(action.tool);
        const isScheduleUpdate = action.tool === 'planScheduleMultiAgent' && action.params?.mode === 'update';

        if (!isReadTool && !isScheduleUpdate) {
          // Find next pending todo that isn't blocked
          const nextTodo = currentTodos.find(
            (t) => t.status === "pending" && !t.blockedBy
          );

          if (!nextTodo) {
            console.log("⏸️ No unblocked todos to process");
            break;
          }

          // Mark todo as in progress
          currentTodos = currentTodos.map((t) =>
            t.id === nextTodo.id ? { ...t, status: "in_progress" as const } : t
          );
        }

        // Execute the appropriate tool
        switch (action.tool) {
          case "planScheduleMultiAgent":
            result = await tools.planScheduleMultiAgent(userId, {
              ...action.params,
              reason: action.purpose,
              messages: messages,
            });
            pendingPlan = result;
            awaitingConfirmation = true;
            shouldStop = true; // Always stop after plans
            break;
          case "planCUDMultiAgent":
            result = await tools.planCUDMultiAgent(userId, {
              ...action.params,
              reason: action.purpose, // The boss's explanation of why this tool was called
              messages: messages, // Full conversation history for context
            });
            pendingPlan = result;
            awaitingConfirmation = true;
            shouldStop = true; // Always stop after plans
            break;
          case "planGoalMultiAgent":
            result = await tools.planGoalMultiAgent(userId, {
              ...action.params,
              reason: action.purpose,
              messages: messages,
            });
            pendingPlan = result;
            awaitingConfirmation = true;
            shouldStop = true; // Always stop after plans
            break;
          case "executeMultiAgent":
            // The model should only call this if it's ready to execute
            // It knows from context whether user has confirmed
            if (pendingPlan || mergedContext?.pendingPlan) {
              result = await tools.executeMultiAgent(
                userId,
                {
                  plan: pendingPlan || mergedContext.pendingPlan,
                  messages: messages // Pass conversation context for agentic execution
                }
              );
              pendingPlan = null; // Clear after execution
            } else {
              console.log("⏸️ Execute blocked - no plan to execute");
              shouldStop = true;
              break;
            }
            break;
          case "readSchedule":
            result = await tools.readSchedule(userId, action.params?.date);
            break;
          case "readInventory":
            result = await tools.readInventory(userId, action.params?.type);
            break;
          case "readConversations":
            result = await tools.readConversations(
              userId,
              action.params?.dayId
            );
            break;
          case "getAppInfo":
            result = await tools.getAppInfo(action.params?.topic);
            break;
          default:
            result = { success: false, error: `Unknown tool: ${action.tool}` };
        }

        // Mark todo as completed (only for non-read tools and non-update schedule tools that have todos)
        if (!isReadTool && !isScheduleUpdate && currentTodos.length > 0) {
          const nextTodo = currentTodos.find(
            (t) => t.status === "in_progress"
          );
          if (nextTodo) {
            currentTodos = currentTodos.map((t) =>
              t.id === nextTodo.id
                ? { ...t, status: "completed" as const, result }
                : t
            );
          }
        }

        toolResults.push({
          tool: action.tool,
          result,
          purpose: action.purpose,
        });

        // Stop if we hit a plan tool
        if (shouldStop) {
          console.log("🛑 Stopping after plan tool");
          break;
        }
      } catch (error) {
        console.error(`❌ Error executing tool ${action.tool}:`, error);
        toolResults.push({
          tool: action.tool,
          error: error instanceof Error ? error.message : "Unknown error",
          purpose: action.purpose,
        });
        break; // Stop on error
      }
    }

    // STEP 3: Generate response based on tool results
    console.log("🤖 Generating response based on tool results...");

    // Build a summary of tool results for the model to use
    const toolResultsSummary = toolResults.map((r) => ({
      tool: r.tool,
      purpose: r.purpose,
      result: r.result || r.error,
    }));

    const responsePrompt = `
    Based on the following tool execution results, generate an appropriate response to the user.
    
    Tool Results:
    ${JSON.stringify(toolResultsSummary, null, 2)}
    
    Current Todos:
    ${JSON.stringify(currentTodos, null, 2)}
    
    Important:
    - If there's a CUD plan in the results, present it clearly and ask for confirmation
    - If there's a schedule plan, show the schedule and ask for confirmation
    - If reading data, present the data clearly
    - If managing todos, show the current todo list status
    - Be specific and use the actual data from the tool results
    `;

    const responseGeneration = await generateObject({
      model: anthropic("claude-sonnet-4-5-20250929"),
      schema: responseGenerationSchema,
      system: systemPromptWithContext + responsePrompt,
      messages: [
        ...conversationHistory,
        {
          role: "assistant" as const,
          content: `Tools executed: ${toolResults.map((r) => r.tool).join(", ")}`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    });

    console.log("🤖 Response generated:", {
      responseLength: responseGeneration.object.response.length,
      awaitingConfirmation: responseGeneration.object.awaitingConfirmation,
    });

    // Save session to database if we have a conversationId
    if (conversationId) {
      const sessionId = `${userId}-${conversationId}`;
      try {
        await Session.findOneAndUpdate(
          { sessionId },
          {
            userId,
            conversationId,
            sessionId,
            todos: currentTodos,
            pendingPlan: pendingPlan,
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          { upsert: true, new: true }
        );
        console.log(
          `💾 Session saved: ${sessionId}, todos: ${currentTodos.length}, has plan: ${!!pendingPlan}`
        );
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    } else {
      console.log("⚠️ Session not saved - no conversationId");
    }

    // Return the response with tool results
    return NextResponse.json({
      success: true,
      response: responseGeneration.object.response,
      awaitingConfirmation:
        awaitingConfirmation || responseGeneration.object.awaitingConfirmation,

      // Always return current todos for state management
      todos: currentTodos,
      todoStatus: {
        completed: currentTodos.filter((t) => t.status === "completed").length,
        total: currentTodos.length,
        pending: currentTodos.filter((t) => t.status === "pending").length,
        blocked: currentTodos.filter((t) => t.status === "blocked").length,
      },

      // Include the pending plan if one was generated
      pendingPlan:
        pendingPlan ||
        toolResults.find(
          (r) =>
            r.result?.type === "schedule" ||
            r.result?.type === "cud" ||
            r.result?.type === "goal_plan"
        )?.result,

      // Tool execution details
      toolResults,

      debug: {
        thinking: toolDecision.object.thinking,
        responseThinking: responseGeneration.object.thinking,
        actionsExecuted: toolResults.length,
        userName: agentContext.userName,
        todosCount: currentTodos.length,
        todosCompleted: currentTodos.filter((t) => t.status === "completed")
          .length,
      },
    });
  } catch (error) {
    console.error("🤖 Error in MULTI-AGENT:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
