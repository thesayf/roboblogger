import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const {
    currentSchedule,
    eventBlocks,
    routineBlocks,
    tasks,
    projects,
    userInput,
    startTime,
    endTime,
  } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing Anthropic API key" },
      { status: 500 }
    );
  }

  console.log("Regenerating schedule...");
  console.log("Current Schedule:", currentSchedule);
  console.log("Events:", eventBlocks);
  console.log("Routines:", routineBlocks);
  console.log("Tasks:", tasks);
  console.log("Projects:", projects);
  console.log("User Input:", userInput);

  const regenerateSchedulePrompt = `You are an expert scheduling assistant helping to modify an existing schedule based on user requests. Your goal is to make targeted changes while preserving as much of the original schedule structure as possible.

AVAILABLE DATA:
Time Frame: ${startTime} to ${endTime}
Current Schedule: ${JSON.stringify(currentSchedule, null, 2)}
User Request: "${userInput}"

Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}
Events: ${JSON.stringify(eventBlocks, null, 2)}
Routines: ${JSON.stringify(routineBlocks, null, 2)}
Standalone Tasks: ${JSON.stringify(tasks, null, 2)}

MODIFICATION RULES:

1. Change Minimization:
- Only modify blocks/tasks specifically mentioned in user request
- Preserve all other blocks and their timing exactly as is
- Maintain original block and task IDs whenever possible
- Keep existing breaks and buffers unless directly affected

2. User Request Analysis:
- Parse user input for specific changes requested:
  * Time changes ("move X to 2pm")
  * Duration changes ("make X longer/shorter")
  * Task additions ("add Y to afternoon")
  * Task removals ("remove Z")
  * Block modifications ("split this block")
- Identify affected blocks and tasks precisely
- Note any ambiguous references for explanation

3. Block Modification Rules:
- When modifying a block:
  * Preserve original blockId if structure remains similar
  * Create new block(s) if substantial changes needed
  * Maintain all unaffected tasks within block
  * Update times of dependent blocks if needed
  * Recalculate break placement around changes

4. Task Modification Rules:
- When adding tasks:
  * Use existing task IDs if found in backlog
  * Create new tasks only if explicitly requested
  * Verify duration fits in target block
  * Maintain project task sequences
- When removing tasks:
  * Remove only specified tasks
  * Adjust block duration if needed
  * Preserve remaining task order
  * Update break schedule if significant gap created

5. Conflict Resolution:
- If requested change creates conflicts:
  * Prioritize user's latest request
  * Attempt to shift affected blocks minimally
  * Maintain event times unless explicitly changed
  * Document all conflict resolutions in rationale

6. Schedule Integrity:
- After all modifications:
  * Verify no block overlaps
  * Ensure block durations match task totals
  * Check project task sequences
  * Validate routine structures
  * Confirm break placement rules

7. Documentation Requirements:
- In scheduleRationale, explain:
  * What specific changes were made
  * Why each change was made this way
  * Any conflicts encountered and resolved
  * Blocks/tasks that couldn't be modified as requested

CRITICAL: Return ONLY a JSON object with this structure:
{
  "currentTime": "${new Date().toTimeString().slice(0, 5)}",
  "scheduleRationale": "Explanation of modifications made",
  "blocks": [
    {
      "name": "Block name",
      "startTime": "HH:MM format",
      "endTime": "HH:MM format",
      "description": "Block purpose and modification rationale",
      "isEvent": boolean,
      "isRoutine": boolean,
      "isStandaloneBlock": boolean,
      "eventId": "original event ID or null",
      "routineId": "original routine ID or null",
      "blockType": "deep-work" | "planning" | "break" | "admin" | "collaboration",
      "tasks": [
        {
          "id": "original task ID or null",
          "name": string,
          "description": string,
          "duration": number,
          "priority": "High" | "Medium" | "Low",
          "isRoutineTask": boolean,
          "projectId": "original project ID or null",
          "type": "deep-work" | "planning" | "break" | "admin" | "collaboration",
          "isUserSpecified": boolean
        }
      ]
    }
  ],
  "modificationSummary": {
    "blocksModified": ["List of modified block IDs"],
    "tasksModified": ["List of modified task IDs"],
    "newBlocksCreated": number,
    "tasksRemoved": ["List of removed task IDs"],
    "unresolvedRequests": ["List of changes that couldn't be made"]
  }
}`;

  try {
    const schedule = await getAnthropicResponse(
      apiKey,
      regenerateSchedulePrompt
    );
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("An error occurred:", error);
    return NextResponse.json(
      { message: "Error regenerating schedule" },
      { status: 500 }
    );
  }
}

async function getAnthropicResponse(apiKey: string, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Anthropic API error: ${response.status}`, errorText);
    throw new Error(`Anthropic API error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
    console.error("Received content:", content);
    throw new Error("Invalid JSON response from Anthropic API");
  }
}
