import { NextRequest, NextResponse } from "next/server";

interface Task {
  completed: boolean;
  priority: string;
  projectId?: string;
  isRoutineTask: boolean;
  duration?: string;
}

interface Block {
  event: string | null;
  tasks: Task[];
  status: string;
}

// Adjusted thresholds for completed blocks only
const scoreThresholds = {
  10: 400, // Perfect day
  9: 350, // Exceptional day
  8: 300, // Excellent day
  7: 250, // Very good day
  6: 200, // Good day
  5: 150, // Average day
  4: 100, // Below average
  3: 75, // Struggling
  2: 50, // Minimal progress
  1: 25, // Very little done
  0: 0, // Nothing completed
};

export async function POST(request: NextRequest) {
  const { updatedDay } = await request.json();
  console.log("trial 6");

  console.log(updatedDay);

  try {
    if (!updatedDay?.blocks || !Array.isArray(updatedDay.blocks)) {
      return NextResponse.json(
        { message: "Invalid day object" },
        { status: 400 }
      );
    }

    // Only process completed blocks
    const completedBlocks = updatedDay.blocks.filter(
      (block: Block) => block.status === "complete"
    );
    const totalBlocks = updatedDay.blocks.length;

    console.log("completed BLOCKS", completedBlocks);

    // If no blocks are completed, return a base rating
    if (completedBlocks.length === 0) {
      return NextResponse.json({
        level: "Getting Started",
        score: 0,
        comment: "Complete your scheduled blocks to start earning points!",
        points: 0,
        metrics: {
          completedHighPriorityTasks: 0,
          totalHighPriorityTasks: 0,
          completedRoutineTasks: 0,
          totalRoutineTasks: 0,
          completedProjectTasks: 0,
          completedBlocks: 0,
          totalBlocks,
        },
      });
    }

    let totalPoints = 0;
    let completedHighPriorityTasks = 0;
    let totalHighPriorityTasks = 0;
    let completedRoutineTasks = 0;
    let totalRoutineTasks = 0;
    let completedProjectTasks = 0;

    // Calculate points only for completed blocks
    completedBlocks.forEach((block: Block) => {
      // Base points for completing a block
      totalPoints += 5;

      // Event block bonus
      if (block.event) {
        totalPoints += 8;
      }

      // Perfect block bonus (all tasks in block completed)
      if (
        block.tasks.length > 0 &&
        block.tasks.every((task) => task.completed)
      ) {
        totalPoints += Math.min(10, block.tasks.length * 2);
      }

      // Process tasks within completed blocks
      block.tasks.forEach((task: Task) => {
        if (task.completed) {
          totalPoints += 8; // Base points for task completion

          // Priority bonuses
          switch (task.priority) {
            case "High":
              totalPoints += 10;
              completedHighPriorityTasks++;
              break;
            case "Medium":
              totalPoints += 5;
              break;
            case "Low":
              totalPoints += 2;
              break;
          }

          // Project task bonus
          if (task.projectId) {
            totalPoints += 8;
            completedProjectTasks++;
          }

          // Track routine tasks
          if (task.isRoutineTask) {
            completedRoutineTasks++;
          }
        }

        // Track totals (only for tasks in completed blocks)
        if (task.priority === "High") totalHighPriorityTasks++;
        if (task.isRoutineTask) totalRoutineTasks++;
      });
    });

    // Completion rate bonuses (based only on tasks in completed blocks)
    if (totalRoutineTasks > 0) {
      const routineCompletionRate = completedRoutineTasks / totalRoutineTasks;
      if (routineCompletionRate >= 0.8) {
        totalPoints += 20;
      }
    }

    if (totalHighPriorityTasks > 0) {
      const highPriorityCompletionRate =
        completedHighPriorityTasks / totalHighPriorityTasks;
      if (highPriorityCompletionRate >= 0.8) {
        totalPoints += 25;
      }
    }

    // Block completion bonus
    const blockCompletionRate = completedBlocks.length / totalBlocks;
    if (blockCompletionRate >= 0.8) {
      totalPoints += 30; // Bonus for completing most blocks
    }

    // Calculate score
    let score = 0;
    const thresholdEntries = Object.entries(scoreThresholds).sort(
      (a, b) => Number(b[0]) - Number(a[0])
    );

    for (const [scoreValue, threshold] of thresholdEntries) {
      if (totalPoints >= threshold) {
        score = Number(scoreValue);
        break;
      }
    }

    // Determine level
    let level: string;
    if (score >= 9) level = "Outstanding";
    else if (score >= 7) level = "Excelling";
    else if (score >= 5) level = "On Track";
    else if (score >= 3) level = "Making Progress";
    else level = "Getting Started";

    // Generate comment with block completion context
    let comment = `You've earned ${totalPoints} points today! `;

    // Add block completion status
    comment += `Completed ${completedBlocks.length}/${totalBlocks} blocks. `;

    // Add task completion details if there are completed tasks
    if (completedHighPriorityTasks > 0) {
      const highPriorityPercent = Math.round(
        (completedHighPriorityTasks / totalHighPriorityTasks) * 100
      );
      comment += `Finished ${completedHighPriorityTasks}/${totalHighPriorityTasks} (${highPriorityPercent}%) high-priority tasks. `;
    }

    if (completedProjectTasks > 0) {
      comment += `Advanced ${completedProjectTasks} project tasks. `;
    }

    // Add encouragement based on block completion
    if (blockCompletionRate < 0.3) {
      comment += "Focus on completing your scheduled blocks!";
    } else if (blockCompletionRate < 0.7) {
      comment += "Keep completing those blocks!";
    } else {
      comment += "Great progress on your schedule!";
    }

    return NextResponse.json({
      level,
      score,
      comment,
      points: totalPoints,
      metrics: {
        completedHighPriorityTasks,
        totalHighPriorityTasks,
        completedRoutineTasks,
        totalRoutineTasks,
        completedProjectTasks,
        completedBlocks: completedBlocks.length,
        totalBlocks,
      },
    });
  } catch (error) {
    console.error("Error calculating performance rating:", error);
    return NextResponse.json(
      { message: "Error calculating performance rating" },
      { status: 500 }
    );
  }
}
// export async function POST(request: NextRequest) {
//   const { updatedDay } = await request.json();
//   console.log(updatedDay);

//   if (!updatedDay || !updatedDay.blocks || !Array.isArray(updatedDay.blocks)) {
//     return NextResponse.json(
//       { message: "Invalid day object" },
//       { status: 400 }
//     );
//   }

//   const currentTime = new Date().toISOString();

//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     return NextResponse.json(
//       { message: "Missing OpenAI API key" },
//       { status: 500 }
//     );
//   }

//   try {
//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: "gpt-4",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a precise and analytical productivity assistant. Your role is to evaluate user performance based on task completion, focusing primarily on completed tasks. Always respond with a valid JSON object.",
//           },
//           {
//             role: "user",
//             content: `
// Evaluate the user's daily performance based on the following data:

// Current time: ${currentTime}
// Day schedule: ${JSON.stringify(updatedDay, null, 2)}

// Analyze each completed task in the blocks, considering:
// 1. Task completion status (only count tasks marked as completed)
// 2. Task difficulty (estimate based on description and duration)
// 3. Task benefit (estimate based on description and potential impact)
// 4. Task priority

// Provide a weighted score that factors in the difficulty, benefit, and priority of completed tasks only. Do not penalize for incomplete tasks, but rather focus on what has been accomplished.

// Guidelines for scoring:
// - The score should primarily reflect completed tasks
// - Completed high-priority, high-difficulty, high-benefit tasks should significantly boost the score
// - Consider the current time in relation to the schedule (e.g., completing morning tasks early in the day should be viewed positively)
// - The overall score should be on a scale of 0 to 10, with decimals allowed for precision
// - A score of 5 should represent completing about half of the day's important tasks, or a mix of less important tasks

// Respond with a JSON object in this format:
// {
//   "level": "Getting Started" | "Making Progress" | "On Track" | "Excelling" | "Outstanding",
//   "score": A number between 0 and 10,
//   "comment": "A brief, constructive comment about the user's performance, focusing on completed tasks and offering encouragement"
// }

// Guidelines for levels:
// - "Getting Started": 0-2 (Few tasks completed, regardless of their importance)
// - "Making Progress": 2-4 (Some tasks completed, including a few important ones)
// - "On Track": 4-6 (Good progress on important tasks)
// - "Excelling": 6-8 (Most important tasks completed, along with some others)
// - "Outstanding": 8-10 (All or nearly all important tasks completed, possibly ahead of schedule)

// Ensure your response is a valid JSON object with no additional text or formatting.
//               `,
//           },
//         ],
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to get performance rating");
//     }

//     const data = await response.json();
//     const ratingString = data.choices[0].message.content.trim();
//     const rating = JSON.parse(ratingString);

//     return NextResponse.json(rating);
//   } catch (error) {
//     console.error("Error getting performance rating:", error);
//     return NextResponse.json(
//       { message: "Error getting performance rating" },
//       { status: 500 }
//     );
//   }
// }
