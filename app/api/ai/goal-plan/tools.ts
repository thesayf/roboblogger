// Tools for the GOAL_PLAN layer - fetching context for strategic planning
import dbConnect from '@/lib/mongo';
import Goal from '@/models/Goal';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Routine from '@/models/Routine';
import Event from '@/models/Event';

export async function fetchContextForGoalPlan(userId: string) {
  console.log('\n🎯 === FETCHING CONTEXT FOR GOAL PLAN ===');
  
  try {
    await dbConnect();
    
    // Fetch existing data to understand user's current commitments
    const [existingGoals, existingProjects, existingRoutines] = await Promise.all([
      Goal.find({ userId })
        .sort({ order: 'asc' })
        .lean(),
      Project.find({ userId, completed: false })
        .lean(),
      Routine.find({ userId })
        .lean()
    ]);

    console.log('🎯 Current inventory:');
    console.log(`  - Existing Goals: ${existingGoals.length}`);
    console.log(`  - Active Projects: ${existingProjects.length}`);
    console.log(`  - Active Routines: ${existingRoutines.length}`);

    // Calculate current time commitments
    const routineHoursPerWeek = existingRoutines.reduce((total, routine) => {
      const daysPerWeek = routine.days?.length || 0;
      const hoursPerSession = (routine.duration || 30) / 60;
      return total + (daysPerWeek * hoursPerSession);
    }, 0);

    console.log(`🎯 Current weekly time commitment: ${routineHoursPerWeek.toFixed(1)} hours`);

    // Get today's date for planning
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Return context for AI
    return {
      currentDate: todayStr,
      existingCommitments: {
        goalsCount: existingGoals.length,
        projectsCount: existingProjects.length,
        routinesCount: existingRoutines.length,
        weeklyHours: routineHoursPerWeek.toFixed(1)
      },
      existingGoals: existingGoals.map(g => ({
        content: g.content,
        deadline: g.deadline
      })),
      existingRoutines: existingRoutines.map(r => ({
        name: r.name,
        days: r.days,
        startTime: r.startTime,
        duration: r.duration
      })),
      availableTimeSlots: {
        mornings: ["06:00", "06:30", "07:00", "07:30", "08:00"],
        evenings: ["18:00", "18:30", "19:00", "19:30", "20:00"],
        weekends: ["09:00", "10:00", "11:00", "14:00", "15:00"]
      }
    };
    
  } catch (error) {
    console.error('🎯 Error fetching context:', error);
    throw error;
  }
}