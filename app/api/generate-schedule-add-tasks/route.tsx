import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const {
    generatedSchedule,
    userInput,
    startTime,
    endTime,
    projects,
    standaloneTasks,
  } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing OpenAI API key" },
      { status: 500 }
    );
  }

  const systemMessage = `You are an advanced scheduling assistant. Your goal is to optimize the user's schedule to promote momentum and achieve a state of flow. Build upon the existing schedule of events and routines, and integrate focused work blocks and standalone tasks to maximize productivity and goal achievement.`;

  const rules = `
1. Work with the existing schedule between ${startTime} to ${endTime}.
2. Add 2-4 focused work blocks of 60-90 minutes each:
   - These blocks should focus on high-priority project tasks.
   - They can include a single major task or a collection of related smaller tasks.
   - Place these during peak cognitive periods when possible.
3. Standalone Task Blocks:
   - Allocate specific blocks for standalone tasks.
   - Prioritize based on urgency and importance.
   - Carefully consider the context and timing requirements of each task:
     * Analyze the task name and description for timing clues.
     * Schedule tasks at appropriate times (e.g., don't schedule calls to businesses outside of typical business hours).
     * Consider any implicit deadlines or time-sensitive nature of the tasks.
4. Ensure no blocks overlap with existing events or routines.
5. Your response must be valid JSON. Do not include any explanatory text outside the JSON structure.`;
  const outputStructure = `
{
  "currentTime": "${new Date().toTimeString().slice(0, 5)}",
  "scheduleRationale": "Explanation of how the schedule promotes flow and momentum",
  "blocks": [
    {
      "name": string,
      "startTime": string,
      "endTime": string,
      "isEvent": boolean,
      "isRoutine": boolean,
      "isStandaloneBlock": boolean,
      "eventId": string or null,
      "routineId": string or null,
      "tasks": [
        {
          "id": string,
          "name": string,
          "description": string,
          "duration": number,
          "priority": string,
          "isRoutineTask": boolean
        }
      ]
    }
  ]
}`;

  const prompt = `
Optimize the following schedule to promote user momentum and flow:

Current Schedule (including events and routines):
${JSON.stringify(generatedSchedule, null, 2)}

Project Tasks to be integrated:
${JSON.stringify(projects, null, 2)}

Standalone Tasks to be scheduled:
${JSON.stringify(standaloneTasks, null, 2)}

Rules:
${rules}

Your task is to add focused work blocks and standalone task blocks to the existing schedule. The goal is to create a schedule that helps the user maintain momentum and achieve a state of flow, especially during high-priority project work.

Return ONLY the JSON object with this structure:
${outputStructure}

Ensure your entire response is valid JSON and follows all the rules. Provide a clear rationale for how the optimized schedule promotes flow and momentum.`;

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

      // Validate the parsed response structure
      if (!parsedResponse.blocks || !Array.isArray(parsedResponse.blocks)) {
        throw new Error(
          "Invalid response structure: 'blocks' array is missing"
        );
      }

      // Ensure currentTime and scheduleRationale are present
      if (!parsedResponse.currentTime) {
        parsedResponse.currentTime = new Date().toTimeString().slice(0, 5);
      }
      if (!parsedResponse.scheduleRationale) {
        parsedResponse.scheduleRationale =
          "Schedule optimized to promote user momentum and flow.";
      }
    } catch (parseError) {
      console.error("Error parsing or validating JSON:", parseError);
      console.error("Received content:", content);
      return NextResponse.json(
        { message: "Invalid or incomplete JSON response from OpenAI API" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("An error occurred:", error);
    return NextResponse.json(
      { message: "Error optimizing schedule" },
      { status: 500 }
    );
  }
}
