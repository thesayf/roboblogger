// /app/api/generate-schedule/route.ts
import { NextRequest } from "next/server";

export const maxDuration = 300;

// Define the output JSON structure once.
const outputJsonFormat = `
Return ONLY a JSON object with this structure:
{
  "scheduleRationale": "Response to user explaining how their request was handled, any conflicts, suggestions, and clarifications.",
  "blocks": [
    {
      "name": "Clear context-appropriate name",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "blockDuration": number,
      "tasksDuration": number,
      "type": "deep-work" | "break" | "meeting" | "health" | "exercise" | "admin" | "personal",
      "routineId": "exact _id from routines or null",
      "tasks": [
        {
          "id": "existing-id-if-found or null",
          "name": "Task name",
          "duration": number,
          "projectId": "exact _id from projects or null",
          "routineId": "exact _id from routines or null",
          "eventId": "exact _id from events or null"
        }
      ]
    }
  ]
}`;

// Main endpoint
export async function POST(request: NextRequest) {
  // The client should send a "type" field along with all the common data.
  // For example, type can be "default", "update", or omitted for the base prompt.
  const {
    type, // "default", "update", or undefined (base prompt)
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
    return new Response(
      JSON.stringify({ message: "Missing Anthropic API key" }),
      { status: 500 }
    );
  }

  console.log("the type is ", type);

  let createSchedulePrompt = "";

  // Choose the proper prompt text based on the "type" field.
  switch (type) {
    case "default":
      console.log("default ran");
      createSchedulePrompt = `You are an expert scheduling assistant helping create a template schedule for a user who may have minimal saved data or vague requirements. Your goal is to create a well-structured day using evidence-based scheduling principles while keeping blocks and tasks generic enough to be easily customized.

AVAILABLE DATA:
Time Frame: ${startTime} to ${endTime}
User Request: "${userInput}"
Events (Must be honored): ${JSON.stringify(eventBlocks, null, 2)}
Routines: ${JSON.stringify(routineBlocks, null, 2)}
Standalone Tasks: ${JSON.stringify(tasks, null, 2)}
Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}

SCHEDULE CREATION PRIORITIES:
1. Fixed Commitments:
   - Place all events at their exact times; these cannot be moved.
   - Use only the provided routine IDs from the routines array; if a routine does not exist, set routineId to null.
   - Prioritize any tasks with urgent deadlines (e.g., due in the next 48 hours).
2. Context Analysis & Template Guidance:
   - Analyze the user input to determine the intended schedule type (e.g., study, work, exercise, personal).
   - If the user’s request is vague or minimal, choose one of the following template structures as a guide:
     • Study Template: Incorporate Planning/Review blocks (30–45 mins), Deep Focus blocks (45–60 mins), and Active Learning blocks (45–60 mins).  
       Example tasks: "Review upcoming deadlines", "Deep focus on primary subject", "Practice active recall techniques".
     • Work Template: Incorporate Planning blocks (30 mins), Deep Work blocks (60–90 mins), and Admin/Email blocks (30 mins).  
       Example tasks: "Plan the day", "Focused work on the main project", "Handle administrative tasks".
     • Exercise Template: Incorporate Preparation blocks (15–20 mins), Main Activity blocks (30–45 mins), and Recovery blocks (15–20 mins).  
       Example tasks: "Warm up and prepare", "Main workout session", "Cool down and recovery".
     • General Productivity Template: Incorporate Morning Setup (30 mins), Focus blocks (60 mins), and Review blocks (30 mins).  
       Example tasks: "Set daily objectives", "Work on priority items", "Review progress".
3. Time Integrity & Evidence-Based Scheduling:
   - Ensure there are no overlapping blocks and that start/end times are rounded to 30-minute intervals.
   - Block durations should align with the sum of their tasks’ durations.
   - Insert regular breaks (15–30 mins) after long work periods and add transition buffers (5–15 mins) where needed.
4. ID Management:
   - Use exact IDs from the input for events, routines, and projects.
   - For any new or placeholder items, set the corresponding IDs to null.
   - Validate all routineIds against the provided routineBlocks array.

${outputJsonFormat}`;
      break;

    case "update":
      console.log("Update ran");
      createSchedulePrompt = `You are an expert scheduling assistant helping to modify an existing schedule based on user requests. Your goal is to make targeted changes while preserving as much of the original schedule structure as possible.

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
   - Only modify blocks/tasks specifically mentioned in the user request.
   - Preserve all other blocks and their timing exactly as is.
   - Maintain original block and task IDs whenever possible.
   - Keep existing breaks and buffers unless directly affected.
2. User Request Analysis:
   - Identify specific modifications requested (e.g. time changes, duration adjustments, additions, removals).
   - Only apply changes explicitly mentioned, leaving all other schedule elements intact.
3. Schedule Integrity:
   - Ensure no overlapping blocks.
   - Round times to 30-minute intervals.
   - Block duration must equal the sum of task durations.
   - No gaps longer than 2 hours.
   - Include breaks after 2.5 hours of work.
4. ID Management:
   - Use exact IDs from input data.
   - Set IDs to null for new items.
   - Correctly match tasks to their project, routine, or event.

${outputJsonFormat}`;
      break;

    // The base prompt (if type is omitted or not recognized) uses the original prompt.
    default:
      console.log("Full backlog ran");
      createSchedulePrompt = `You are an expert scheduling assistant. Create a schedule based on the following data while respecting time constraints and task relationships.

AVAILABLE DATA:
Time Frame: ${startTime} to ${endTime}
User Request: "${userInput}"

Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}
Events: ${JSON.stringify(eventBlocks, null, 2)}
Routines: ${JSON.stringify(routineBlocks, null, 2)}
Standalone Tasks: ${JSON.stringify(tasks, null, 2)}

CRITICAL RULES:
1. Time Integrity
   - No overlapping blocks.
   - Block duration MUST equal the sum of task durations.
     * Calculate blockDuration as (endTime - startTime) in minutes.
     * Calculate tasksDuration as the sum of all tasks’ durations in that block.
     * **If the two values do not match, adjust task durations or block boundaries until they are identical.**
     * EXAMPLE: If a block runs from 10:00 to 11:30, then blockDuration = 90 minutes. Two tasks must sum exactly to 90 minutes (e.g., 50 and 40 minutes, not 60 and 60).
   - No gaps longer than 2 hours.
   - Include breaks after 2.5 hours of work.
2. Task Ordering
   - Process user requests first.
   - Place events at exact times.
   - Maintain project task sequence.
   - Group similar tasks when possible.
3. ID Management
   - Use exact IDs from input data.
   - Set IDs to null for new items.
   - Match tasks to the correct project/routine/event.

${outputJsonFormat}`;
  }

  console.log("Using prompt text:", createSchedulePrompt);

  try {
    // Send the request to Anthropic with the selected prompt.
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        temperature: 0.3,
        stream: true,
        messages: [
          {
            role: "user",
            content: createSchedulePrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create a TransformStream to process and forward the streaming response as SSE.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove the "data: " prefix
            if (data === "[DONE]") continue;
            try {
              const message = `data: ${data}\n\n`;
              controller.enqueue(encoder.encode(message));
            } catch (e) {
              console.error("Error processing chunk:", e);
              controller.error(e);
            }
          }
        }
      },
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return new Response(
      JSON.stringify({ message: "Error creating schedule" }),
      { status: 500 }
    );
  }
}

// import { NextRequest } from "next/server";

// export const maxDuration = 60;

// export async function POST(request: NextRequest) {
//   const {
//     currentSchedule,
//     eventBlocks,
//     routineBlocks,
//     tasks,
//     projects,
//     userInput,
//     startTime,
//     endTime,
//   } = await request.json();

//   const apiKey = process.env.ANTHROPIC_API_KEY;
//   if (!apiKey) {
//     return new Response(
//       JSON.stringify({ message: "Missing Anthropic API key" }),
//       { status: 500 }
//     );
//   }

//   const regenerateSchedulePrompt = `You are an expert scheduling assistant helping to modify an existing schedule based on user requests. Your goal is to make targeted changes while preserving as much of the original schedule structure as possible.

// AVAILABLE DATA:
// Time Frame: ${startTime} to ${endTime}
// Current Schedule: ${JSON.stringify(currentSchedule, null, 2)}
// User Request: "${userInput}"

// Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}
// Events: ${JSON.stringify(eventBlocks, null, 2)}
// Routines: ${JSON.stringify(routineBlocks, null, 2)}
// Standalone Tasks: ${JSON.stringify(tasks, null, 2)}

// MODIFICATION RULES:
// 1. Change Minimization:
//    - Only modify blocks/tasks specifically mentioned in the user request.
//    - Preserve all other blocks and their timing exactly as is.
//    - Maintain original block and task IDs whenever possible.
//    - Keep existing breaks and buffers unless directly affected.

// 2. User Request Analysis:
//    - Identify specific modifications requested (e.g. time changes, duration adjustments, additions, removals).
//    - Only apply changes explicitly mentioned, leaving all other schedule elements intact.

// 3. Schedule Integrity:
//    - Ensure no overlapping blocks.
//    - Round times to 30-minute intervals.
//    - Block duration must equal the sum of task durations.
//    - No gaps longer than 2 hours.
//    - Include breaks after 2.5 hours of work.

// 4. ID Management:
//    - Use exact IDs from input data.
//    - Set IDs to null for new items.
//    - Correctly match tasks to their project, routine, or event.

// Return ONLY a JSON object with this structure:
// {
//   "scheduleRationale": "Response to user explaining:\n - How their specific requests were handled\n - Any scheduling conflicts or issues\n - Suggestions for clearer future requests\n - What needs clarification",
//   "blocks": [
//     {
//       "name": "Clear context-appropriate name",
//       "startTime": "HH:MM",
//       "endTime": "HH:MM",
//       "type": "deep-work" | "break" | "meeting" | "health" | "exercise" | "admin" | "personal",
//       "routineId": "exact _id from routines or null",
//       "tasks": [
//         {
//           "id": "existing-id-if-found or null",
//           "name": "Task name",
//           "duration": number,
//           "projectId": "exact _id from projects or null",
//           "routineId": "exact _id from routines or null",
//           "eventId": "exact _id from events or null"
//         }
//       ]
//     }
//   ]
// }`;

//   try {
//     const response = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": apiKey,
//         "anthropic-version": "2023-06-01",
//         accept: "text/event-stream",
//       },
//       body: JSON.stringify({
//         model: "claude-3-sonnet-20240229",
//         max_tokens: 4096,
//         temperature: 0.3,
//         stream: true,
//         messages: [
//           {
//             role: "user",
//             content: regenerateSchedulePrompt,
//           },
//         ],
//       }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     // Set up a TransformStream to process and forward the streamed response
//     const encoder = new TextEncoder();
//     const decoder = new TextDecoder();

//     const transformStream = new TransformStream({
//       async transform(chunk, controller) {
//         const text = decoder.decode(chunk);
//         const lines = text.split("\n");

//         for (const line of lines) {
//           if (line.startsWith("data: ")) {
//             const data = line.slice(6); // Remove the "data: " prefix
//             if (data === "[DONE]") continue;

//             try {
//               // Forward each valid chunk as an event
//               const message = `data: ${data}\n\n`;
//               controller.enqueue(encoder.encode(message));
//             } catch (e) {
//               console.error("Error processing chunk:", e);
//               controller.error(e);
//             }
//           }
//         }
//       },
//     });

//     return new Response(response.body?.pipeThrough(transformStream), {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//     });
//   } catch (error) {
//     console.error("An error occurred:", error);
//     return new Response(
//       JSON.stringify({ message: "Error regenerating schedule" }),
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";

// export const maxDuration = 60;

// export async function POST(request: NextRequest) {
//   const {
//     currentSchedule,
//     eventBlocks,
//     routineBlocks,
//     tasks,
//     projects,
//     userInput,
//     startTime,
//     endTime,
//   } = await request.json();

//   const apiKey = process.env.ANTHROPIC_API_KEY;
//   if (!apiKey) {
//     return NextResponse.json(
//       { message: "Missing Anthropic API key" },
//       { status: 500 }
//     );
//   }

//   const regenerateSchedulePrompt = `You are an expert scheduling assistant helping to modify an existing schedule based on user requests. Your goal is to make targeted changes while preserving as much of the original schedule structure as possible.

// AVAILABLE DATA:
// Time Frame: ${startTime} to ${endTime}
// Current Schedule: ${JSON.stringify(currentSchedule, null, 2)}
// User Request: "${userInput}"

// Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}
// Events: ${JSON.stringify(eventBlocks, null, 2)}
// Routines: ${JSON.stringify(routineBlocks, null, 2)}
// Standalone Tasks: ${JSON.stringify(tasks, null, 2)}

// MODIFICATION RULES:

// 1. Change Minimization:
// - Only modify blocks/tasks specifically mentioned in user request
// - Preserve all other blocks and their timing exactly as is
// - Maintain original block and task IDs whenever possible
// - Keep existing breaks and buffers unless directly affected

// 2. User Request Analysis:
// - Parse user input for specific changes requested:
//   * Time changes ("move X to 2pm")
//   * Duration changes ("make X longer/shorter")
//   * Task additions ("add Y to afternoon")
//   * Task removals ("remove Z")
//   * Block modifications ("split this block")
// - Identify affected blocks and tasks precisely
// - Note any ambiguous references for explanation

// 3. Block Modification Rules:
// - When modifying a block:
//   * Preserve original blockId if structure remains similar
//   * Create new block(s) if substantial changes needed
//   * Maintain all unaffected tasks within block
//   * Update times of dependent blocks if needed
//   * Recalculate break placement around changes

// 4. Task Modification Rules:
// - When adding tasks:
//   * Use existing task IDs if found in backlog
//   * Create new tasks only if explicitly requested
//   * Verify duration fits in target block
//   * Maintain project task sequences
// - When removing tasks:
//   * Remove only specified tasks
//   * Adjust block duration if needed
//   * Preserve remaining task order
//   * Update break schedule if significant gap created

// 5. Conflict Resolution:
// - If requested change creates conflicts:
//   * Prioritize user's latest request
//   * Attempt to shift affected blocks minimally
//   * Maintain event times unless explicitly changed
//   * Document all conflict resolutions in rationale

// 6. Schedule Integrity:
// - After all modifications:
//   * Verify no block overlaps
//   * Ensure block durations match task totals
//   * Check project task sequences
//   * Validate routine structures
//   * Confirm break placement rules

// 7. Documentation Requirements:
// - In scheduleRationale, explain:
//   * What specific changes were made
//   * Why each change was made this way
//   * Any conflicts encountered and resolved
//   * Blocks/tasks that couldn't be modified as requested

// CRITICAL: Return ONLY a JSON object with this structure:
// {
//   "currentTime": "${new Date().toTimeString().slice(0, 5)}",
//   "scheduleRationale": "Explanation of modifications made",
//   "blocks": [
//     {
//       "name": "Block name",
//       "startTime": "HH:MM format",
//       "endTime": "HH:MM format",
//       "description": "Block purpose and modification rationale",
//       "isEvent": boolean,
//       "isRoutine": boolean,
//       "isStandaloneBlock": boolean,
//       "eventId": "original event ID or null",
//       "routineId": "original routine ID or null",
//       "blockType": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//       "tasks": [
//         {
//           "id": "original task ID or null",
//           "name": string,
//           "description": string,
//           "duration": number,
//           "priority": "High" | "Medium" | "Low",
//           "isRoutineTask": boolean,
//           "projectId": "original project ID or null",
//           "type": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//           "isUserSpecified": boolean
//         }
//       ]
//     }
//   ],
//   "modificationSummary": {
//     "blocksModified": ["List of modified block IDs"],
//     "tasksModified": ["List of modified task IDs"],
//     "newBlocksCreated": number,
//     "tasksRemoved": ["List of removed task IDs"],
//     "unresolvedRequests": ["List of changes that couldn't be made"]
//   }
// }`;

//   try {
//     const schedule = await getAnthropicResponse(
//       apiKey,
//       regenerateSchedulePrompt
//     );
//     return NextResponse.json(schedule);
//   } catch (error) {
//     console.error("An error occurred:", error);
//     return NextResponse.json(
//       { message: "Error regenerating schedule" },
//       { status: 500 }
//     );
//   }
// }

// async function getAnthropicResponse(apiKey: string, prompt: string) {
//   const response = await fetch("https://api.anthropic.com/v1/messages", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "x-api-key": apiKey,
//       "anthropic-version": "2023-06-01",
//     },
//     body: JSON.stringify({
//       model: "claude-3-sonnet-20240229",
//       max_tokens: 4096,
//       temperature: 0.3,
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`Anthropic API error: ${response.status}`, errorText);
//     throw new Error(`Anthropic API error: ${errorText}`);
//   }

//   const data = await response.json();
//   const content = data.content[0].text;

//   try {
//     return JSON.parse(content);
//   } catch (parseError) {
//     console.error("Error parsing JSON:", parseError);
//     console.error("Received content:", content);
//     throw new Error("Invalid JSON response from Anthropic API");
//   }
// }

//   const regenerateSchedulePrompt = `You are an expert scheduling assistant helping to modify an existing schedule based on user requests. Your goal is to make targeted changes while preserving as much of the original schedule structure as possible.

// AVAILABLE DATA:
// Time Frame: ${startTime} to ${endTime}
// Current Schedule: ${JSON.stringify(currentSchedule, null, 2)}
// User Request: "${userInput}"

// Projects and Their Tasks: ${JSON.stringify(projects, null, 2)}
// Events: ${JSON.stringify(eventBlocks, null, 2)}
// Routines: ${JSON.stringify(routineBlocks, null, 2)}
// Standalone Tasks: ${JSON.stringify(tasks, null, 2)}

// MODIFICATION RULES:

// 1. Change Minimization:
// - Only modify blocks/tasks specifically mentioned in user request
// - Preserve all other blocks and their timing exactly as is
// - Maintain original block and task IDs whenever possible
// - Keep existing breaks and buffers unless directly affected

// 2. User Request Analysis:
// - Parse user input for specific changes requested:
//   * Time changes ("move X to 2pm")
//   * Duration changes ("make X longer/shorter")
//   * Task additions ("add Y to afternoon")
//   * Task removals ("remove Z")
//   * Block modifications ("split this block")
// - Identify affected blocks and tasks precisely
// - Note any ambiguous references for explanation

// 3. Block Modification Rules:
// - When modifying a block:
//   * Preserve original blockId if structure remains similar
//   * Create new block(s) if substantial changes needed
//   * Maintain all unaffected tasks within block
//   * Update times of dependent blocks if needed
//   * Recalculate break placement around changes

// 4. Task Modification Rules:
// - When adding tasks:
//   * Use existing task IDs if found in backlog
//   * Create new tasks only if explicitly requested
//   * Verify duration fits in target block
//   * Maintain project task sequences
// - When removing tasks:
//   * Remove only specified tasks
//   * Adjust block duration if needed
//   * Preserve remaining task order
//   * Update break schedule if significant gap created

// 5. Conflict Resolution:
// - If requested change creates conflicts:
//   * Prioritize user's latest request
//   * Attempt to shift affected blocks minimally
//   * Maintain event times unless explicitly changed
//   * Document all conflict resolutions in rationale

// 6. Schedule Integrity:
// - After all modifications:
//   * Verify no block overlaps
//   * Ensure block durations match task totals
//   * Check project task sequences
//   * Validate routine structures
//   * Confirm break placement rules

// 7. Documentation Requirements:
// - In scheduleRationale, explain:
//   * What specific changes were made
//   * Why each change was made this way
//   * Any conflicts encountered and resolved
//   * Blocks/tasks that couldn't be modified as requested

// CRITICAL: Return ONLY a JSON object with this structure:
// {
//   "currentTime": "${new Date().toTimeString().slice(0, 5)}",
//   "scheduleRationale": "Explanation of modifications made",
//   "blocks": [
//     {
//       "name": "Block name",
//       "startTime": "HH:MM format",
//       "endTime": "HH:MM format",
//       "description": "Block purpose and modification rationale",
//       "isEvent": boolean,
//       "isRoutine": boolean,
//       "isStandaloneBlock": boolean,
//       "eventId": "original event ID or null",
//       "routineId": "original routine ID or null",
//       "blockType": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//       "tasks": [
//         {
//           "id": "original task ID or null",
//           "name": string,
//           "description": string,
//           "duration": number,
//           "priority": "High" | "Medium" | "Low",
//           "isRoutineTask": boolean,
//           "projectId": "original project ID or null",
//           "type": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//           "isUserSpecified": boolean
//         }
//       ]
//     }
//   ],
//   "modificationSummary": {
//     "blocksModified": ["List of modified block IDs"],
//     "tasksModified": ["List of modified task IDs"],
//     "newBlocksCreated": number,
//     "tasksRemoved": ["List of removed task IDs"],
//     "unresolvedRequests": ["List of changes that couldn't be made"]
//   }
// }`;
