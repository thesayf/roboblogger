import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import Day from "@/models/Day";
import User from "@/models/User";
import Project from "@/models/Project";
import Routine from "@/models/Routine";
import Task from "@/models/Task";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { userId: clerkId, range = "week" } = await request.json();

    if (!clerkId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mongoUserId = user._id;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Set to start of day

    switch (range) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "14":
        startDate.setDate(endDate.getDate() - 14);
        break;
      case "month":
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const formatDate = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    const completedProjects = await Project.countDocuments({
      userId: mongoUserId, // <-- CHANGED TO mongoUserId
      completed: true,
      completedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Get all days in the date range with blocks and tasks fully populated
    const days = await Day.find({
      user: mongoUserId,
      date: {
        $gte: formatDate(startDate),
        $lte: formatDate(endDate),
      },
    })
      .populate({
        path: "blocks",
        populate: {
          path: "tasks",
          // Get all task fields, not just a select few
        },
      })
      .sort({ date: -1 })
      .lean();

    // Process the days data for basic metrics
    let totalTasks = 0;
    let completedTasks = 0;
    let totalPerformanceScore = 0;
    let daysWithRating = 0;

    const processedDays = days.map((day) => {
      let dayTotalTasks = 0;
      let dayCompletedTasks = 0;
      let blocksCompleted = 0;
      let totalBlocks = day.blocks?.length || 0;

      day.blocks?.forEach((block: any) => {
        let blockCompleted = true;
        block.tasks?.forEach((task: any) => {
          dayTotalTasks++;
          totalTasks++;
          if (task.completed) {
            dayCompletedTasks++;
            completedTasks++;
          } else {
            blockCompleted = false;
          }
        });
        if (blockCompleted && block.tasks?.length > 0) {
          blocksCompleted++;
        }
      });

      // Include the performance rating if it exists
      if (day.performanceRating && day.performanceRating.score) {
        totalPerformanceScore += day.performanceRating.score;
        daysWithRating++;
      }

      return {
        date: day.date,
        tasksCompleted: dayCompletedTasks,
        totalTasks: dayTotalTasks,
        blocksCompleted,
        totalBlocks,
        performanceRating: day.performanceRating || null,
      };
    });

    // Calculate average performance rating only for days that have ratings

    // Use actual number of days found rather than the range
    const actualDaysCount = days.length;

    const routines = await Routine.find({
      userId: mongoUserId, // <-- CHANGED TO mongoUserId
    })
      .populate({
        path: "tasks",
        model: "Task",
      })
      .lean();

    // Generate an array of all dates in the range
    const dateRange: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create map of dates to their day records for fast lookup
    const daysByDate: { [key: string]: any } = {};
    days.forEach((day) => {
      daysByDate[day.date] = day;
    });

    // Inside the routinesWithTaskStats map function in your analytics API route
    const routinesWithTaskStats = routines.map((routine) => {
      // Convert routine._id to string for consistent comparison
      // Replace it with this (using type assertion):
      const routineId =
        typeof routine._id === "string"
          ? routine._id
          : (routine._id as mongoose.Types.ObjectId).toString();

      console.log(`Analyzing routine: ${routine.name} (ID: ${routineId})`);
      console.log(`Days of week this routine runs: ${routine.days.join(", ")}`);

      // Log start/end dates if available
      console.log(
        `Routine start date: ${routine.startDate || routine.createdAt}`
      );
      console.log(`Routine end date: ${routine.endDate || "No end date"}`);

      // Initialize task statistics for this routine
      const tasks = (routine.tasks || []).map((task: any) => {
        return {
          ...task,
          scheduledCount: 0, // How many times it was actually scheduled
          expectedCount: 0, // How many times it should have been scheduled based on routine days
          completedCount: 0, // How many times it was completed
          completionPercentage: 0, // Completion percentage
        };
      });

      console.log(`Routine has ${tasks.length} tasks`);
      tasks.forEach((task: { name: any; _id: any }) => {
        console.log(`  - Task: ${task.name} (ID: ${task._id})`);
      });

      // Map tasks by ID for quick lookup
      const tasksByIdMap = new Map();
      tasks.forEach((task: { _id: { toString: () => any } }) => {
        const taskId =
          typeof task._id === "string" ? task._id : task._id.toString();
        tasksByIdMap.set(taskId, task);
      });

      // Count days this routine should run in the date range
      const routineDays = routine.days || [];
      let expectedDaysCount = 0;
      const expectedDateStrings: string[] = [];

      console.log(
        `Checking days in range ${formatDate(startDate)} to ${formatDate(endDate)}`
      );
      dateRange.forEach((date) => {
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
        const dateString = formatDate(date);

        // Determine if we should count this day based on routine start/end dates
        const routineStartDate = routine.startDate
          ? new Date(routine.startDate)
          : new Date(routine.createdAt);
        routineStartDate.setHours(0, 0, 0, 0);

        const routineEndDate = routine.endDate
          ? new Date(routine.endDate)
          : null;
        if (routineEndDate) {
          routineEndDate.setHours(23, 59, 59, 999);
        }

        // Skip days outside of routine's active period
        if (date < routineStartDate) {
          console.log(
            `  Skipping ${dateString} (${weekday}) - before routine start date`
          );
          return;
        }

        if (routineEndDate && date > routineEndDate) {
          console.log(
            `  Skipping ${dateString} (${weekday}) - after routine end date`
          );
          return;
        }

        // If this routine should run on this day of the week
        if (routineDays.includes(weekday)) {
          console.log(
            `  ${dateString} (${weekday}) is an expected day for this routine`
          );
          expectedDaysCount++;
          expectedDateStrings.push(dateString);

          tasks.forEach((task: { expectedCount: number }) => {
            task.expectedCount++;
          });
        } else {
          console.log(
            `  ${dateString} (${weekday}) is not a day for this routine`
          );
        }
      });

      console.log(
        `This routine should have run on ${expectedDaysCount} days in the selected range`
      );
      console.log(`Expected dates: ${expectedDateStrings.join(", ")}`);

      // Now look at actual days to find completions
      console.log(`Now checking actual days for block completions`);
      let blocksFound = 0;

      days.forEach((day: any) => {
        const dateString = day.date;
        const date = new Date(dateString);
        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

        // Only consider days when this routine should run
        if (!routineDays.includes(weekday)) {
          return;
        }

        console.log(
          `Checking ${dateString} (${weekday}) for blocks from routine ${routine.name}`
        );

        // Fix: Ensure day.blocks is an array before using length or forEach
        const dayBlocks = Array.isArray(day.blocks) ? day.blocks : [];
        console.log(`  This day has ${dayBlocks.length} total blocks`);

        // Look for blocks of this routine
        dayBlocks.forEach(
          (block: {
            routineId?: string | { toString: () => string };
            _id: any;
            tasks?: any[];
          }) => {
            const blockRoutineId = block.routineId
              ? typeof block.routineId === "string"
                ? block.routineId
                : block.routineId.toString()
              : null;

            // Skip if not from this routine
            if (blockRoutineId !== routineId) {
              return;
            }

            blocksFound++;
            console.log(
              `  Found block from this routine! Block ID: ${block._id}`
            );

            // Fix: Ensure block.tasks is an array before using length or forEach
            const blockTasks = Array.isArray(block.tasks) ? block.tasks : [];
            console.log(`  Block has ${blockTasks.length} tasks`);

            // Process tasks in this block
            let tasksFound = 0;
            let tasksCompleted = 0;

            blockTasks.forEach(
              (task: {
                originalRoutineTaskId?: string | { toString: () => string };
                completed: any;
              }) => {
                const originalTaskId = task.originalRoutineTaskId
                  ? typeof task.originalRoutineTaskId === "string"
                    ? task.originalRoutineTaskId
                    : task.originalRoutineTaskId.toString()
                  : null;

                if (originalTaskId) {
                  console.log(
                    `    Task found with originalRoutineTaskId: ${originalTaskId}`
                  );
                  tasksFound++;

                  if (tasksByIdMap.has(originalTaskId)) {
                    const routineTask = tasksByIdMap.get(originalTaskId);
                    routineTask.scheduledCount++;
                    console.log(
                      `    Matched to routine task: ${routineTask.name}`
                    );

                    if (task.completed) {
                      routineTask.completedCount++;
                      tasksCompleted++;
                      console.log(`    Task was completed!`);
                    } else {
                      console.log(`    Task was NOT completed`);
                    }
                  } else {
                    console.log(
                      `    WARNING: Could not find matching routine task!`
                    );
                  }
                } else {
                  console.log(`    Task has no originalRoutineTaskId`);
                }
              }
            );

            console.log(
              `  Summary for this block: ${tasksCompleted}/${tasksFound} tasks completed`
            );
          }
        );
      });

      console.log(`Total blocks found for routine: ${blocksFound}`);

      // Calculate completion percentages
      let totalExpectedTasks = 0;
      let totalCompletedTasks = 0;

      tasks.forEach(
        (task: {
          name: any;
          expectedCount: number;
          scheduledCount: any;
          completedCount: number;
          completionPercentage: number;
        }) => {
          console.log(`Task completion summary for ${task.name}:`);
          console.log(`  Expected: ${task.expectedCount} occurrences`);
          console.log(`  Scheduled: ${task.scheduledCount} occurrences`);
          console.log(`  Completed: ${task.completedCount} occurrences`);

          totalExpectedTasks += task.expectedCount;
          totalCompletedTasks += task.completedCount;

          if (task.expectedCount > 0) {
            task.completionPercentage = Math.round(
              (task.completedCount / task.expectedCount) * 100
            );
          } else {
            task.completionPercentage = 0;
          }

          console.log(`  Completion percentage: ${task.completionPercentage}%`);
        }
      );

      // Calculate overall routine completion percentage
      const overallCompletionPercentage =
        totalExpectedTasks > 0
          ? Math.round((totalCompletedTasks / totalExpectedTasks) * 100)
          : 0;

      console.log(`Overall routine completion stats:`);
      console.log(`  Total expected task instances: ${totalExpectedTasks}`);
      console.log(`  Total completed task instances: ${totalCompletedTasks}`);
      console.log(
        `  Overall completion percentage: ${overallCompletionPercentage}%`
      );

      return {
        ...routine,
        tasks: tasks,
        expectedDays: expectedDaysCount,
        overallCompletionPercentage,
      };
    });

    // const projects = await Project.find({
    //   userId: clerkId,
    // })
    //   .populate("tasks") // Assuming Project has a 'tasks' field that references Task documents
    //   .lean();

    // UPDATED CODE
    const projects = await Project.find({
      userId: mongoUserId, // <-- CHANGED TO mongoUserId
    })
      .populate("tasks")
      .lean();

    // Calculate completion percentages for each project
    const projectsWithStats = projects.map((project) => {
      // Use the tasks directly from the populated project
      const projectTasks = project.tasks || [];

      const totalTaskCount = projectTasks.length;
      const completedTaskCount = projectTasks.filter(
        (task: { completed: any }) => task.completed
      ).length;

      // Calculate completion percentage
      const completionPercentage =
        totalTaskCount > 0
          ? Math.round((completedTaskCount / totalTaskCount) * 100)
          : 0;

      const dueDate = project.deadline ? new Date(project.deadline) : null;
      const isOverdue = dueDate ? dueDate < new Date() : false;

      return {
        ...project,
        tasks: undefined, // Remove the tasks array from the response to keep it clean
        totalTasks: totalTaskCount,
        completedTasks: completedTaskCount,
        completionPercentage,
        isOverdue,
        formattedDueDate: dueDate ? formatDate(dueDate) : null,
        daysRemaining: dueDate
          ? Math.ceil(
              (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
      };
    });

    const performanceByDate = processedDays
      .filter((day) => day.performanceRating && day.performanceRating.score)
      .map((day) => ({
        date: day.date,
        formattedDate: new Date(day.date).toLocaleDateString("en-US", {
          weekday: "short", // "Mon"
          month: "short", // "Jan"
          day: "numeric", // "1"
        }),
        score: day.performanceRating.score,
        level: day.performanceRating.level,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically

    const totalDaysInRange = dateRange.length; // Use all days in the range
    const averagePerformanceRating =
      totalDaysInRange > 0
        ? (totalPerformanceScore / totalDaysInRange).toFixed(1)
        : null;

    const response = {
      // Basic metrics
      averageTasksPerDay:
        actualDaysCount > 0
          ? (completedTasks / actualDaysCount).toFixed(1)
          : "0.0",
      completionRate:
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0",
      totalTasksCompleted: completedTasks,
      totalTasks: totalTasks,
      completedProjects,
      averagePerformanceRating,
      averagePerformanceRatingLoggedOnly:
        daysWithRating > 0
          ? (totalPerformanceScore / daysWithRating).toFixed(1)
          : null,
      daysWithRating,
      totalDays: actualDaysCount,
      recentDays: processedDays,
      allDays: days, // All days in range with all blocks and tasks populated
      routines: routinesWithTaskStats, // Enhanced routines with task completion stats
      projects: projectsWithStats, // Projects with completion stats
      performanceByDate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        error: "Error fetching analytics data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
