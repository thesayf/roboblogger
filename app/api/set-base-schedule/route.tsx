import { NextRequest, NextResponse } from "next/server";

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

  const userComments = `
    I want to move my Evening Workout routine to start at 17:00 today. 
    Also, can you add a new task for "Review project proposal" that should take about 45 minutes? 
    I need to work on my "Prepare presentation for team meeting" task today as well. 
    Oh, and please schedule a new 30-minute call with John at 14:00.
  `;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing OpenAI API key" },
      { status: 500 }
    );
  }

  const updateSchedulePrompt = `
You are a scheduling assistant. Your task is to create a schedule based ONLY on the user's direct requests.

User Input: ${userInput}
Schedule Time Range: ${startTime} to ${endTime}

Available Data:
Event Blocks: ${JSON.stringify(eventBlocks, null, 2)}
Routine Blocks: ${JSON.stringify(routineBlocks, null, 2)}
Tasks: ${JSON.stringify(tasks, null, 2)}
Projects (with tasks): ${JSON.stringify(projects, null, 2)}

Rules:
1. ONLY create blocks that the user explicitly requests in their input
2. When user mentions something:
   - First check if it exists in the provided data
   - If it doesn't exist, create a new block with reasonable defaults
   - For new tasks, estimate duration based on similar tasks or user hints
   - For new events, create 30-minute blocks unless duration is specified
3. All blocks must:
   - Be within the ${startTime} to ${endTime} range
   - Not overlap with other blocks
   - Have clear start and end times
4. Do not add any blocks that weren't specifically mentioned by the user
5. If user's request is unclear (no time specified, etc), make reasonable assumptions

Return ONLY a valid JSON object with this structure:
{
  "blocks": [
    {
      "name": string,
      "startTime": string,
      "endTime": string,
      "isEventBlock": boolean,
      "isRoutineBlock": boolean,
      "eventId": string or null,
      "routineId": string or null,
      "tasks": [
        {
          "id": string or null,
          "name": string,
          "description": string,
          "duration": number or null
        }
      ]
    }
  ],
  "scheduleRationale": string
}
`;

  try {
    const updatedSchedule = await getOpenAIResponse(
      apiKey,
      updateSchedulePrompt
    );
    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("An error occurred:", error);
    return NextResponse.json(
      { message: "Error updating schedule" },
      { status: 500 }
    );
  }
}

async function getOpenAIResponse(apiKey: string, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful scheduling assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status}`, errorText);
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
    console.error("Received content:", content);
    throw new Error("Invalid JSON response from OpenAI API");
  }
}
