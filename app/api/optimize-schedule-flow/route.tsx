import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Adjust as needed

export async function POST(request: NextRequest) {
  const { currentSchedule, userPreferences } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Missing OpenAI API key" },
      { status: 500 }
    );
  }

  const currentTime = new Date().toTimeString().split(" ")[0].slice(0, 5); // Format: HH:MM

  const systemMessage = `You are an AI assistant specialized in optimizing schedules for maximum productivity and flow states. Your task is to refine the given schedule based on principles of behavioral science and cognitive performance. You must return your response ONLY in the specified JSON format, without any additional text or explanations outside the JSON structure.`;

  const prompt = `
Review and optimize the following schedule to enhance overall balance, productivity, and flow states. Focus on these key principles:

1. Strategic Break Placement: Add 15-20 minute breaks between work blocks where needed. Mark these as 'isBreak: true'.
2. Schedule Balance: Ensure a good mix of high-focus work, routine tasks, and breaks throughout the day.
3. Flow State Promotion: Arrange tasks to minimize context switching and promote sustained focus.
4. Goal Achievement: Prioritize tasks that align with the user's main goals and objectives.
5. Logical Sequencing: Reorganize tasks or blocks if their current placement doesn't make logical sense.
6. Energy Management: Consider the natural energy fluctuations throughout the day when placing tasks.

Important:
- You can add breaks and reorganize existing blocks, but do not remove any tasks or events.
- Ensure any changes made improve the overall flow and productivity of the schedule.
- Provide a clear rationale for significant changes in the scheduleRationale.

Current Schedule:
${JSON.stringify(currentSchedule, null, 2)}

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Return ONLY a JSON object in this exact format:

{
  "currentTime": "${currentTime}",
  "scheduleRationale": "Explanation of key changes and how they improve flow and productivity",
  "blocks": [
    {
      "name": string,
      "startTime": string,
      "endTime": string,
      "isEvent": boolean,
      "isRoutine": boolean,
      "isBreak": boolean,
      "eventId": string or null,
      "routineId": string or null,
      "tasks": [
        {
          "id": string,
          "name": string,
          "description": string,
          "status": string,
          "priority": string,
          "duration": number,
          "projectId": string or null,
          "isRoutineTask": boolean
        }
      ]
    }
  ]
}

Ensure your response is a valid JSON object and includes only the specified fields.`;
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
        temperature: 0.7,
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

    console.log("Raw AI response:", content);

    let optimizedSchedule;
    try {
      optimizedSchedule = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.error("Received content:", content);
      return NextResponse.json(
        { message: "Invalid JSON response from OpenAI API" },
        { status: 500 }
      );
    }

    // Validate the structure of the optimized schedule
    if (
      !optimizedSchedule.currentTime ||
      !optimizedSchedule.scheduleRationale ||
      !Array.isArray(optimizedSchedule.blocks)
    ) {
      console.error("Invalid schedule structure:", optimizedSchedule);
      return NextResponse.json(
        { message: "Invalid schedule structure in AI response" },
        { status: 500 }
      );
    }

    return NextResponse.json(optimizedSchedule);
  } catch (error) {
    console.error("An error occurred:", error);
    return NextResponse.json(
      { message: "Error optimizing schedule" },
      { status: 500 }
    );
  }
}
