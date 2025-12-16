import { NextRequest } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const {
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

  console.log("Enhanced streaming schedule request initiated.");
  console.log("Routine Blocks:", routineBlocks);
  console.log("Event Blocks:", eventBlocks);
  console.log("Tasks:", tasks);
  console.log("Projects:", projects);
  console.log("User Input:", userInput);

  const createSchedulePrompt = `You are an expert scheduling assistant helping create a template schedule for a user who may have minimal saved data or vague requirements. Your goal is to create a well-structured day using evidence-based scheduling principles while keeping blocks and tasks generic enough to be easily customized.

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

Return ONLY a JSON object with this structure:
{
  "scheduleRationale": "Response to user explaining how their requests were handled, any conflicts, and suggestions for improvement.",
  "blocks": [
    {
      "name": "Clear context-appropriate name",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
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

  try {
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

    // Create a TransformStream to process and forward the streamed data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === "[DONE]") continue;

            try {
              // Forward the data as an SSE message to the client
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

// import { NextRequest, NextResponse } from "next/server";

// export const maxDuration = 60;

// export async function POST(request: NextRequest) {
//   const {
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

//   const createSchedulePrompt = `You are an expert scheduling assistant helping create a template schedule for a user who may have minimal saved data. Your goal is to create a well-structured day using evidence-based scheduling principles while keeping blocks and tasks generic enough to be easily customized.

// AVAILABLE DATA:
// Time Frame: ${startTime} to ${endTime}
// User Request: "${userInput}"
// Events (Must be honored): ${JSON.stringify(eventBlocks, null, 2)}
// Routines: ${JSON.stringify(routineBlocks, null, 2)}
// Tasks: ${JSON.stringify(tasks, null, 2)}
// Projects: ${JSON.stringify(projects, null, 2)}

// SCHEDULE CREATION PRIORITIES:
// 1. Fixed Commitments (Highest Priority):
//    - Place all events for today's date first - these cannot be moved
//    - Identify and prioritize any tasks with due dates in the next 48 hours
//    - Honor any existing routines the user has created
//    - For routines, ONLY use routineId values that exist in the provided routineBlocks array, otherwise use null

// 2. Context Analysis:
//    - Determine schedule type from user input (study, work, exercise, personal, etc.)
//    - Keep block names generic but contextually appropriate (e.g., "Morning Deep Work Block" not "Mathematics Study Block")
//    - Use time blocks appropriate for the schedule type
//    - Create placeholder tasks that guide without being overly specific

// 3. Template Block Structures:
//    Study Template:
//    - Planning/Review blocks (30-45 mins)
//    - Deep Focus blocks (45-60 mins)
//    - Active Learning blocks (45-60 mins)
//    - Example tasks: "Review upcoming deadlines", "Deep focus work on primary subject", "Practice active recall techniques"

//    Work Template:
//    - Planning blocks (30 mins)
//    - Deep Work blocks (60-90 mins)
//    - Admin/Email blocks (30 mins)
//    - Example tasks: "Process inbox and plan day", "Focused work on main project", "Handle administrative tasks"

//    Exercise Template:
//    - Preparation blocks (15-20 mins)
//    - Main Activity blocks (30-45 mins)
//    - Recovery blocks (15-20 mins)
//    - Example tasks: "Prepare equipment and warm up", "Complete main workout", "Cool down and recovery"

//    General Productivity Template:
//    - Morning Setup (30 mins)
//    - Focus blocks (60 mins)
//    - Review blocks (30 mins)
//    - Example tasks: "Plan daily objectives", "Work on priority items", "Review progress and adjust plan"

// 4. Evidence-Based Block Structure:
//    - Align with natural energy cycles (high energy for deep work)
//    - Include regular breaks (15-30 mins) between major blocks
//    - Add transition buffers (5-15 mins)
//    - Group similar activities
//    - Alternate intensity levels

// 5. Task Creation Guidelines:
//    - Create generic but actionable placeholder tasks
//    - Use format: "[Action Word] + [Generic Subject/Activity]"
//    - Include clear "[Add specific detail here]" placeholders
//    - Make tasks demonstrate the intended use of each block
//    - Keep tasks flexible enough for easy customization

// ROUTINE ID RULES:
// - The routineId field in blocks MUST either:
//   1. Match an existing id from the routineBlocks array provided above, OR
//   2. Be set to null
// - NEVER create new or fictional routine IDs
// - When creating a new block that doesn't match an existing routine, always set routineId to null
// - Before setting a routineId, verify it exists in the routineBlocks array

// RESPONSE FORMAT:
// Return ONLY a JSON object with this structure:
// {
//   "currentTime": "${new Date().toTimeString().slice(0, 5)}",
//   "scheduleRationale": "Explain how the template provides structure while remaining customizable",
//   "userStartTime": "${startTime}",
//   "userEndTime": "${endTime}",
//   "blocks": [
//     {
//       "name": "Generic but context-appropriate name (e.g., 'Morning Deep Work Block')",
//       "startTime": "HH:MM",
//       "endTime": "HH:MM",
//       "description": "Block purpose and evidence-based placement rationale",
//       "isEvent": boolean,
//       "isRoutine": boolean,
//       "isStandaloneBlock": boolean,
//       "eventId": "MUST use exact _id from input Event when isRoutine is true or null",
//       "routineId": "MUST use exact _id from input Routine when isRoutine is trueor null",
//       "blockType": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//       "energyLevel": "high" | "medium" | "low",
//       "tasks": [
//         {
//           "id": "existing-id-if-found or null",
//           "name": "Generic but actionable task name",
//           "description": "Clear purpose with customization guidance",
//           "duration": number,
//           "priority": "High" | "Medium" | "Low",
//           "type": "deep-work" | "planning" | "break" | "admin" | "collaboration",
//           "isRoutineTask": boolean
//         }
//       ]
//     }
//   ]
// }

// ADDITIONAL GUIDELINES:
// 1. Prioritize existing events and urgent tasks
// 2. Keep all block names and tasks generic but purposeful
// 3. Create realistic template schedules
// 4. Include proper transitions and breaks
// 5. Consider energy management
// 6. Make blocks and tasks customizable
// 7. Ensure logical flow
// 8. Include buffer time
// 9. Balance focus and renewal
// 10. Create tasks that guide without restricting
// 11. Validate all routineIds against provided routineBlocks`;

//   try {
//     const schedule = await getAnthropicResponse(apiKey, createSchedulePrompt);

//     return NextResponse.json(schedule);
//   } catch (error) {
//     console.error("An error occurred:", error);
//     return NextResponse.json(
//       { message: "Error creating schedule" },
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
