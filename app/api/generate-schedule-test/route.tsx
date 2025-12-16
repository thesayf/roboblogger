import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const {
    baseSchedulejson,
    userInput,
    startTime,
    endTime,
    eventBlocks,
    routineBlocks,
  } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing OpenAI API key" },
      { status: 500 }
    );
  }

  const systemMessage = `You are a scheduling assistant. Your task is to integrate today's events and routines into an existing schedule while preserving all user-requested blocks. Ensure your response is ONLY valid JSON.`;

  const rules = `
1. Schedule must be between ${startTime} and ${endTime}.
2. HIGHEST PRIORITY: Preserve all blocks in the existing schedule exactly as they are
   - Do not modify their times
   - Do not remove them
   - Do not add tasks to them
3. Add today's events that aren't already in the schedule:
   - Use exact times provided
   - Set isEvent to true
   - Skip if conflicts with existing blocks
4. Add today's routines that aren't already in the schedule:
   - Use preferred time if available
   - If preferred time conflicts, find nearest available time
   - Set isRoutine to true
   - Skip if no suitable time found
5. Blocks must not overlap
6. Your response must be valid JSON with no additional text
7. Include explanation of what was added/skipped in scheduleRationale`;

  const prompt = `
Current Schedule (MUST BE PRESERVED EXACTLY):
${JSON.stringify(baseSchedulejson, null, 2)}

Today's Events to Add (if possible):
${JSON.stringify(eventBlocks, null, 2)}

Today's Routines to Add (if possible):
${JSON.stringify(routineBlocks, null, 2)}

Rules:
${rules}

Return ONLY a valid JSON object with this structure:
{
  "blocks": [
    {
      "name": string,
      "startTime": string,
      "endTime": string,
      "isEvent": boolean,
      "isRoutine": boolean,
      "eventId": string or null,
      "routineId": string or null,
      "tasks": [
        {
          "id": string,
          "name": string,
          "description": string,
          "duration": number,
          "isRoutineTask": boolean
        }
      ]
    }
  ],
  "scheduleRationale": string
}`;

  console.log("Sending request to OpenAI API");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      return NextResponse.json(
        { message: `OpenAI API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("Raw API response:", content);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.error("Received content:", content);
      return NextResponse.json(
        { message: "Invalid JSON response from OpenAI API" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("An error occurred:", error);
    return NextResponse.json(
      { message: "Error generating schedule" },
      { status: 500 }
    );
  }
}
