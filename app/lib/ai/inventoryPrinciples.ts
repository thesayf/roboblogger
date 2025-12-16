/**
 * Evidence-Based Inventory Management Principles
 * Guidelines for optimal goal, project, routine, and task organization
 */

export const INVENTORY_PRINCIPLES = {
  // 1. GOAL MANAGEMENT
  goalManagement: {
    optimalNumber: {
      min: 1,
      max: 3,
      evidence: "Focus dilution - more than 3 active goals leads to zero progress on any",
      implementation: "Rank goals 1-3 for conflict resolution and priority decisions"
    },
    timeframes: {
      recommended: "Mix: 1 long-term (6-12 months), 1-2 short-term (1-3 months)",
      reasoning: "Balances ambition with quick wins for momentum"
    },
    hierarchy: {
      rule: "Every project, routine, event, and task should connect to a goal",
      benefit: "Maintains purpose and prevents random busy work"
    }
  },

  // 2. INVENTORY TYPE DECISION TREE
  inventoryDecisionTree: {
    scenarios: [
      { situation: "I want to get fit", solution: "Routine (daily exercise) + Events (gym classes)", type: "habit" },
      { situation: "I need to launch website", solution: "Project with tasks + deadline", type: "deliverable" },
      { situation: "I have a meeting", solution: "Event (one-time or recurring)", type: "appointment" },
      { situation: "I should read more", solution: "Routine (daily 20 min reading)", type: "habit" },
      { situation: "Random task idea", solution: "Backlog task (capture, organize later)", type: "capture" },
      { situation: "Learn new skill", solution: "Project (if course) or Routine (if practice)", type: "depends" },
      { situation: "Improve relationship", solution: "Routine (weekly date) + Events (special occasions)", type: "ongoing" }
    ]
  },

  // 3. PROJECT VS ROUTINE DISTINCTION
  projectVsRoutine: {
    coreDistinction: {
      project: "A finite campaign that CREATES or ACHIEVES something specific",
      routine: "A time-blocked ritual that MAINTAINS or PRACTICES something ongoing"
    },
    
    useProject: {
      definition: "A completable endeavor with a clear 'done' state and deliverable",
      when: [
        "Has a specific deliverable or outcome",
        "Can be permanently marked 'complete'",
        "Creates infrastructure for future use",
        "One-time setup or achievement",
        "Has defined success criteria"
      ],
      examples: [
        "Set up home gym → Equipment purchased and space ready",
        "Create meal plan system → Templates and recipes documented",
        "Research and choose fitness app → App selected and configured",
        "Build personal website → Site is live",
        "Organize home office → Space is functional",
        "Complete certification course → Certificate earned"
      ],
      goodTaskExamples: [
        "Research 5 gym equipment brands",
        "Compare 3 meal tracking apps",
        "Write week 1 workout plan",
        "Buy yoga mat and resistance bands",
        "Install pull-up bar in doorway",
        "Take baseline measurements and photos"
      ],
      badTaskExamples: [
        "❌ Track meals daily (ongoing, not completable)",
        "❌ Exercise 3x per week (repeating activity)",
        "❌ Review progress weekly (recurring task)",
        "❌ Maintain clean eating (too vague, ongoing)"
      ],
      structure: "Break into specific, completable tasks that build toward the deliverable"
    },
    
    useRoutine: {
      definition: "A time-blocked sequence of tasks performed regularly at the same time",
      when: [
        "Happens at a specific time of day",
        "Repeats on a schedule",
        "Building or maintaining a habit",
        "No 'completion' - only consistency",
        "Identity or behavior change"
      ],
      examples: [
        "Morning Routine (6:30-7:15am): Start day right",
        "Lunch Workout (12:00-12:45pm): Midday exercise",
        "Evening Review (9:00-9:20pm): Plan tomorrow",
        "Sunday Meal Prep (2:00-4:00pm): Prepare week's food",
        "After-Work Reset (5:30-6:00pm): Transition to evening"
      ],
      goodTaskExamples: [
        "Make coffee (5 min)",
        "10-minute meditation (10 min)",
        "Review today's priorities (5 min)",
        "Pack tomorrow's lunch (10 min)",
        "Log breakfast in app (3 min)",
        "20 pushups and planks (7 min)"
      ],
      badTaskExamples: [
        "❌ Track all meals throughout day (not time-bounded)",
        "❌ Stay hydrated (too vague, no specific action)",
        "❌ Exercise when possible (no specific time)",
        "❌ Eat healthy (abstract concept, not a task)"
      ],
      structure: "Fixed time window with sequential, time-bounded tasks"
    },
    
    timelineRelationship: {
      principle: "Projects BUILD the systems that Routines USE daily",
      pattern: "Research → Setup → Practice → Maintain",
      examples: [
        {
          scenario: "User wants to get fit",
          wrongApproach: {
            project: "Get Fit Project",
            tasks: [
              "Exercise daily",
              "Track all meals",
              "Drink more water",
              "Sleep 8 hours"
            ],
            problem: "These are ongoing behaviors, not completable tasks"
          },
          rightApproach: {
            project: "Fitness Setup Sprint (1 week)",
            projectTasks: [
              "Research local gyms and pricing",
              "Buy workout clothes and shoes",
              "Set up fitness tracking app",
              "Create 4-week workout plan",
              "Schedule fitness assessment"
            ],
            thenRoutine: "Morning Workout (6:00-7:00am)",
            routineTasks: [
              "Dynamic warm-up (10 min)",
              "Strength circuit (30 min)",
              "Cardio finisher (10 min)",
              "Stretch and log workout (10 min)"
            ]
          }
        },
        {
          scenario: "User wants to eat healthier",
          wrongApproach: {
            project: "Healthy Eating Project",
            tasks: [
              "Eat vegetables daily",
              "Cook at home more",
              "Avoid junk food",
              "Track calories"
            ],
            problem: "These are habits to build, not tasks to complete"
          },
          rightApproach: {
            project: "Nutrition System Setup (5 days)",
            projectTasks: [
              "Calculate daily calorie needs",
              "Research meal prep strategies",
              "Buy food scale and containers",
              "Create shopping list template",
              "Find 10 healthy recipes",
              "Clean out junk food from pantry"
            ],
            thenRoutine1: "Morning Nutrition (7:00-7:30am)",
            routine1Tasks: [
              "Prepare healthy breakfast (15 min)",
              "Pack lunch and snacks (10 min)",
              "Log meals in app (5 min)"
            ],
            thenRoutine2: "Sunday Meal Prep (2:00-4:00pm)",
            routine2Tasks: [
              "Plan week's meals (20 min)",
              "Shop for groceries (60 min)",
              "Prep and cook meals (50 min)",
              "Portion into containers (10 min)"
            ]
          }
        }
      ]
    },
    
    decisionFramework: {
      askYourself: [
        "Can this be marked 'done forever'? → Project",
        "Will I do this at the same time regularly? → Routine",
        "Am I creating something new? → Project",
        "Am I maintaining something? → Routine",
        "Is there a specific deliverable? → Project",
        "Is this about consistency? → Routine"
      ],
      redFlags: {
        inProjects: [
          "Words like: daily, weekly, regularly, maintain, track all",
          "No clear end state",
          "Can't define what 'done' looks like",
          "Tasks that repeat"
        ],
        inRoutines: [
          "One-time setup tasks",
          "Research or planning activities", 
          "Purchases or installations",
          "No specific time block"
        ]
      }
    }
  },

  // 4. INVENTORY LIMITS
  inventoryLimits: {
    activeProjects: {
      max: 7,
      optimal: "5-7 across all goals",
      evidence: "Project switching overhead increases exponentially beyond 7",
      rule: "If adding 8th project, complete or pause one first"
    },
    activeRoutines: {
      max: 5,
      optimal: "3-5 until established (6-8 weeks)",
      evidence: "Habit formation requires 66 days average (Lally et al., 2010)",
      rule: "Master current routines before adding new ones"
    },
    backlogTasks: {
      max: "Unlimited but review weekly",
      warning: "If >20 items, stop adding new goals",
      maintenance: "Weekly review: Do/Delegate/Delete/Defer"
    },
    events: {
      guidance: "As needed but batch similar ones",
      tip: "Recurring events for regular commitments"
    }
  },

  // 5. MAINTENANCE SCHEDULES
  maintenanceSchedules: {
    daily: {
      action: "Review tomorrow's commitments",
      time: "5 minutes before bed"
    },
    weekly: {
      action: "Review backlog, promote items or delete",
      time: "30 minutes Sunday planning",
      checklist: [
        "Archive completed projects",
        "Assess routine consistency",
        "Clear or organize backlog",
        "Plan next week's focus"
      ]
    },
    monthly: {
      action: "Archive completed projects, adjust routine timing",
      time: "1 hour first Sunday",
      checklist: [
        "Review goal progress",
        "Pause/stop failing routines",
        "Celebrate completions",
        "Adjust project deadlines"
      ]
    },
    quarterly: {
      action: "Full goal reassessment and pivot",
      time: "2-3 hours",
      checklist: [
        "Keep, kill, or complete goals",
        "Major project pruning",
        "Life season assessment",
        "Next quarter priorities"
      ]
    }
  },

  // 6. TASK SIZING
  taskSizing: {
    defaultDuration: 30, // minutes
    guidelines: {
      micro: { duration: "5-15 min", action: "Batch together in admin block" },
      standard: { duration: "30-45 min", action: "Single focused session" },
      deep: { duration: "60-90 min", action: "Deep work block" },
      project: { duration: ">2 hours", action: "Must split into subtasks" }
    },
    estimation: {
      rule: "Most things take 2x longer than expected",
      buffer: "Add 50% to initial estimate",
      learning: "Track actual vs estimated to improve"
    }
  },

  // 7. ROUTINE BUILDING SCIENCE
  routineBuilding: {
    habitFormation: {
      tinyStart: {
        principle: "2-minute version first week",
        evidence: "BJ Fogg's Tiny Habits - behavior = motivation + ability + trigger",
        example: "Want 30 min workout? Start with 2 pushups"
      },
      consistency: {
        principle: "Same time daily > duration",
        evidence: "Cue consistency drives habit formation more than repetition count",
        example: "5 min at 7am daily beats 30 min randomly"
      },
      stacking: {
        principle: "Attach new routine to existing anchor",
        evidence: "Implementation intentions increase success by 2-3x",
        example: "After morning coffee, I will meditate"
      },
      neverMissTwice: {
        principle: "If skip once, top priority next day",
        evidence: "Two misses begins new pattern formation",
        recovery: "Missed yesterday = half duration today to maintain chain"
      }
    },
    evolution: {
      week1: { action: "Just show up", duration: "2 minutes", focus: "Building cue" },
      week2_3: { action: "Increase to 25%", duration: "25% of target", focus: "Building consistency" },
      week4_6: { action: "Build to 50%", duration: "50% of target", focus: "Deepening practice" },
      week7_plus: { action: "Full routine", duration: "Target duration", focus: "Optimization and enjoyment" }
    },
    // NEW: Staged routine approach
    stagedCreation: {
      principle: "Create separate, time-boxed routine versions that replace each other",
      benefits: [
        "Clear progression path visible from day 1",
        "No ambiguity about what to do each week",
        "Each phase completion is a celebration",
        "Easy to track and measure success"
      ],
      implementation: {
        stage1: { name: "Micro", duration: 2, weeks: 1, suffix: "Starter" },
        stage2: { name: "Mini", duration: 5, weeks: 2, suffix: "Plus" },
        stage3: { name: "Half", duration: 15, weeks: 3, suffix: "Builder" },
        stage4: { name: "Full", duration: 30, weeks: "ongoing", suffix: "Complete" }
      },
      naming: "Use descriptive names showing progression (e.g., 'Morning Weigh-In' → 'Morning Movement' → 'Full Morning Routine')"
    }
  },

  // 8. BACKLOG MANAGEMENT
  backlogManagement: {
    capture: {
      rule: "Capture everything immediately, organize later",
      tools: "Quick add, voice notes, email to self",
      principle: "Open loops drain cognitive resources (Zeigarnik effect)"
    },
    weeklyReview: {
      sortInto: {
        do: "Can complete in <2 hours this week",
        project: "Needs planning and multiple steps",
        routine: "Should become regular practice",
        delete: "No longer relevant or important",
        someday: "Interesting but not now"
      }
    },
    overloadPrevention: {
      rule1: "If backlog >20 items, pause new goal creation",
      rule2: "Separate 'would be nice' from 'must do'",
      rule3: "Time-box backlog review to 30 minutes max"
    }
  },

  // 9. COMMON MISTAKES
  commonMistakes: {
    mistake1: {
      error: "Making everything a project",
      fix: "Use routines for habits and ongoing practices"
    },
    mistake2: {
      error: "Too many active goals",
      fix: "Maximum 3, ranked by priority"
    },
    mistake3: {
      error: "Projects without deadlines",
      fix: "Every project needs end date, even if arbitrary"
    },
    mistake4: {
      error: "Routines too ambitious",
      fix: "Start with 2-minute versions"
    },
    mistake5: {
      error: "Not connecting items to goals",
      fix: "Every item should ladder up to a goal"
    },
    mistake6: {
      error: "Ignoring energy cost",
      fix: "Events and meetings drain 2x more than solo tasks"
    },
    mistake7: {
      error: "No buffer time",
      fix: "Keep 20% of time unallocated"
    }
  },

  // 10. STRATEGIC QUESTIONS
  strategicQuestions: {
    forClassification: [
      "Is this a one-time thing (project) or ongoing (routine)?",
      "Does this have a clear end state?",
      "Will I know when this is 'done'?"
    ],
    forPrioritization: [
      "Which of my 3 goals does this support?",
      "What happens if I don't do this?",
      "Is this urgent AND important, or just urgent?"
    ],
    forPlanning: [
      "When does this absolutely need to be done?",
      "What's the real consequence of missing this deadline?",
      "Who else is depending on this?"
    ],
    forEstimation: [
      "How much focused time will this really take?",
      "When have I done something similar before?",
      "What could make this take longer?"
    ],
    forSimplification: [
      "What's the smallest version I could start with?",
      "Can this be delegated or automated?",
      "Is perfect necessary or is good enough fine?"
    ]
  },

  // 11. CONVERSATIONAL GOAL DISCOVERY
  conversationalGoalDiscovery: {
    maxQuestionsPerRound: 3,
    maxTotalQuestions: 10,
    
    questionBank: {
      // Initial context questions (pick 1)
      context: [
        "What specific area of your life are you looking to improve?",
        "What's the main challenge you're facing right now?",
        "What would success look like for you in this area?",
        "What's motivating this change right now?"
      ],
      
      // Time and availability (pick 1-2)
      timing: [
        "How much time can you realistically dedicate to this daily?",
        "What time of day typically works best for you?",
        "Are there specific days that are better than others?",
        "Do you have a deadline or target date in mind?"
      ],
      
      // Current state (pick 1)
      currentState: [
        "What's your starting point with this?",
        "Have you tried something similar before? What happened?",
        "On a scale of 1-10, where are you now vs where you want to be?",
        "What's your current routine like in this area?"
      ],
      
      // Constraints (pick 1-2 if relevant)
      constraints: [
        "Any limitations I should be aware of?",
        "What's your budget for this?",
        "What resources do you have available?",
        "What usually gets in your way with things like this?"
      ],
      
      // Preferences (pick 1)
      preferences: [
        "Do you prefer structured plans or flexible approaches?",
        "Would you rather start slow and build, or jump in fully?",
        "Do you work better solo or with accountability?",
        "What type of activities do you actually enjoy?"
      ]
    },
    
    conversationFlows: {
      fitness: {
        round1: ["What specific fitness goal - strength, cardio, weight loss, or general health?", "What's your current activity level?"],
        round2: ["How much time daily?", "Morning or evening person?", "Any injuries or limitations?"],
        round3: ["Home or gym?", "What exercise have you enjoyed before?"],
        proposal: "Based on your answers, I'll create a setup project and progressive routine..."
      },
      
      productivity: {
        round1: ["What area - work, personal projects, or daily tasks?", "What's the main productivity challenge?"],
        round2: ["When is your best focus time?", "Remote or office?", "How many hours to work with?"],
        round3: ["What tools do you currently use?", "What would 'productive' look like to you?"],
        proposal: "I'll set up systems to minimize interruptions and maximize your peak hours..."
      },
      
      learning: {
        round1: ["What do you want to learn and why?", "Complete beginner or some experience?"],
        round2: ["How do you learn best - reading, videos, practice?", "How much time daily?"],
        round3: ["Any deadline or specific goal?", "Will you use this professionally or personally?"],
        proposal: "Let's create a structured learning plan with daily practice..."
      },
      
      habit: {
        round1: ["What habit are you trying to build?", "Why is this important to you now?"],
        round2: ["What's your current routine like?", "Best time of day for this?"],
        round3: ["What's stopped you before?", "What could you stack this onto?"],
        proposal: "We'll start tiny and build gradually using habit stacking..."
      }
    },
    
    smartDefaults: {
      time: "20-30 minutes daily",
      experience: "Beginner-friendly with progression",
      schedule: "Flexible with morning preference",
      approach: "Start small, build gradually",
      duration: "6-week progression to full routine"
    },
    
    userControlPhrases: {
      skipQuestions: ["Just set something up", "That's enough questions", "Let's start"],
      unclear: ["I'm not sure", "I don't know", "Maybe"],
      impatient: ["Skip the questions", "Just do it", "Whatever works"]
    },
    
    responseToSkipping: {
      polite: "No problem! Let me set up a flexible starting point we can adjust as we go...",
      understanding: "Got it! I'll create something adaptable based on common patterns...",
      reassuring: "That's fine! We'll figure out the details as you get started..."
    }
  },

  // 12. LIFE SITUATION PATTERNS
  situationPatterns: {
    newJob: {
      context: "Starting new position",
      goals: ["Excel at work", "Maintain health", "Build relationships"],
      projects: [
        { name: "Learn systems", duration: "30 days" },
        { name: "Build key relationships", duration: "60 days" },
        { name: "Quick win project", duration: "90 days" }
      ],
      routines: ["Morning prep", "Evening decompress", "Weekly 1-on-1 prep"],
      events: ["1-on-1s", "Team meetings", "Coffee chats"]
    },
    studentFinals: {
      context: "Exam preparation period",
      goals: ["Ace exams", "Maintain sanity"],
      projects: [
        { name: "Study plan per subject", duration: "Per exam" },
        { name: "Practice problem sets", duration: "Daily" }
      ],
      routines: ["Morning review", "Evening practice", "Pomodoro blocks"],
      events: ["Exam times", "Study groups", "Office hours"]
    },
    newParent: {
      context: "First 6 months with baby",
      goals: ["Baby thriving", "Parental sanity", "Relationship health"],
      projects: [
        { name: "Sleep training", duration: "2-4 weeks" },
        { name: "Childcare setup", duration: "1 month" },
        { name: "Home baby-proofing", duration: "Ongoing" }
      ],
      routines: ["Morning baby care", "Partner handoff", "Evening wind-down"],
      events: ["Pediatrician visits", "Personal time blocks", "Date attempts"]
    },
    sideProject: {
      context: "Building something alongside day job",
      goals: ["Launch MVP", "Keep day job performance", "Stay healthy"],
      projects: [
        { name: "Build core features", duration: "3 months" },
        { name: "Find first users", duration: "1 month" },
        { name: "Setup business basics", duration: "2 weeks" }
      ],
      routines: ["5-7am deep work", "Lunch break progress", "Weekend sprint"],
      events: ["User interviews", "Mentor calls", "Ship deadlines"]
    }
  }
};

/**
 * Helper functions for inventory management
 */

export function getInventoryGuidance(): string {
  return `
INVENTORY MANAGEMENT PRINCIPLES:

1. GOAL LIMITS:
   - Maximum 3 active goals
   - Rank them 1-3 for priority
   - Mix: 1 long-term (6-12mo), 1-2 short (1-3mo)

2. TYPE SELECTION:
   - PROJECT: Has end state, deadline, deliverable
   - ROUTINE: Building habit, ongoing, no end
   - EVENT: Scheduled appointment or meeting
   - TASK: Standalone item <2 hours

3. ACTIVE LIMITS:
   - Projects: 5-7 maximum
   - Routines: 3-5 until established
   - Backlog: Review if >20 items

4. ROUTINE BUILDING:
   - Week 1: 2-minute version
   - Week 2-3: 25% of target
   - Week 4-6: 50% of target
   - Week 7+: Full routine

5. TASK SIZING:
   - Default: 30 minutes
   - If >2 hours: Break into subtasks
   - Reality: Everything takes 2x longer

6. MAINTENANCE:
   - Daily: 5 min review tomorrow
   - Weekly: 30 min backlog review
   - Monthly: 1 hour project/routine audit
   - Quarterly: 2-3 hour goal reassessment

Remember: Every item should connect to a goal!
`;
}

export function validateInventoryHealth(inventory: any): {
  healthy: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check goal count
  if (inventory.goals?.length > 3) {
    issues.push(`Too many active goals: ${inventory.goals.length} (max: 3)`);
    suggestions.push("Archive or complete goals beyond top 3 priorities");
  }
  
  // Check project count
  if (inventory.projects?.length > 7) {
    issues.push(`Too many active projects: ${inventory.projects.length} (max: 7)`);
    suggestions.push("Complete or pause projects before adding new ones");
  }
  
  // Check routine count
  const newRoutines = inventory.routines?.filter((r: any) => {
    const startDate = new Date(r.startDate);
    const weeksSinceStart = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    return weeksSinceStart < 8;
  });
  
  if (newRoutines?.length > 5) {
    issues.push(`Too many new routines: ${newRoutines.length} (max: 5 until established)`);
    suggestions.push("Focus on establishing current routines for 8 weeks before adding more");
  }
  
  // Check for orphaned items (not connected to goals)
  const orphanedProjects = inventory.projects?.filter((p: any) => !p.goalId)?.length || 0;
  const orphanedRoutines = inventory.routines?.filter((r: any) => !r.goalId)?.length || 0;
  
  if (orphanedProjects > 0 || orphanedRoutines > 0) {
    issues.push(`Items not connected to goals: ${orphanedProjects} projects, ${orphanedRoutines} routines`);
    suggestions.push("Connect all projects and routines to goals for clarity of purpose");
  }
  
  // Check backlog size
  if (inventory.backlogTasks?.length > 20) {
    issues.push(`Backlog overload: ${inventory.backlogTasks.length} items (warning: >20)`);
    suggestions.push("Review backlog: Do, Delegate, Delete, or convert to Projects");
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    suggestions
  };
}

export function determineInventoryType(description: string): {
  type: 'project' | 'routine' | 'event' | 'task';
  reasoning: string;
} {
  const desc = description.toLowerCase();
  
  // Check for routine indicators
  const routineKeywords = ['daily', 'weekly', 'every', 'habit', 'always', 'regularly', 'maintain', 'ongoing'];
  if (routineKeywords.some(keyword => desc.includes(keyword))) {
    return {
      type: 'routine',
      reasoning: 'This appears to be an ongoing habit or regular practice'
    };
  }
  
  // Check for project indicators
  const projectKeywords = ['launch', 'build', 'complete', 'finish', 'deliver', 'create', 'develop', 'plan'];
  if (projectKeywords.some(keyword => desc.includes(keyword))) {
    return {
      type: 'project',
      reasoning: 'This has a clear deliverable and end state'
    };
  }
  
  // Check for event indicators
  const eventKeywords = ['meeting', 'appointment', 'call', 'interview', 'presentation', 'class', 'session'];
  if (eventKeywords.some(keyword => desc.includes(keyword))) {
    return {
      type: 'event',
      reasoning: 'This is a scheduled appointment or time-specific commitment'
    };
  }
  
  // Default to task for simple items
  return {
    type: 'task',
    reasoning: 'This appears to be a standalone task'
  };
}

export function suggestRoutineProgression(
  routineName: string,
  targetDuration: number,
  currentWeek: number
): {
  duration: number;
  focus: string;
  advice: string;
} {
  const progressions = [
    { week: 1, percent: 0.1, focus: "Building cue", advice: "Just show up, 2 minutes is enough" },
    { week: 2, percent: 0.25, focus: "Consistency", advice: "Same time every day matters most" },
    { week: 3, percent: 0.25, focus: "Consistency", advice: "Keep the time, slowly increase duration" },
    { week: 4, percent: 0.5, focus: "Deepening", advice: "Half way there, focus on quality" },
    { week: 5, percent: 0.5, focus: "Deepening", advice: "Make it enjoyable, not just bearable" },
    { week: 6, percent: 0.5, focus: "Deepening", advice: "Notice the benefits, celebrate small wins" },
    { week: 7, percent: 0.75, focus: "Approaching target", advice: "Almost there, don't rush" },
    { week: 8, percent: 1.0, focus: "Full routine", advice: "Congratulations! Now optimize for enjoyment" }
  ];
  
  const progression = progressions.find(p => p.week >= currentWeek) || progressions[progressions.length - 1];
  
  return {
    duration: Math.max(2, Math.round(targetDuration * progression.percent)),
    focus: progression.focus,
    advice: progression.advice
  };
}

/**
 * Generate staged routine versions for progressive habit building
 */
export function generateStagedRoutines(
  baseName: string,
  targetDuration: number,
  tasks: Array<{ title: string; duration: number }>,
  startDate: Date,
  timeWindow?: { start: string; end: string }
): Array<{
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  tasks: Array<{ title: string; duration: number }>;
  earliestStartTime?: string;
  latestEndTime?: string;
  stage: number;
  replaces?: string;
}> {
  const stages = INVENTORY_PRINCIPLES.routineBuilding.stagedCreation.implementation;
  const routines = [];
  let currentDate = new Date(startDate);
  
  // Stage 1: Micro (2 minutes, 1 week)
  const stage1Tasks = tasks.slice(0, 1).map(t => ({ ...t, duration: 2 }));
  const stage1EndDate = new Date(currentDate);
  stage1EndDate.setDate(stage1EndDate.getDate() + 6);
  
  routines.push({
    name: `${baseName} - Starter`,
    startDate: currentDate.toISOString().split('T')[0],
    endDate: stage1EndDate.toISOString().split('T')[0],
    duration: 2,
    tasks: stage1Tasks,
    earliestStartTime: timeWindow?.start,
    latestEndTime: timeWindow?.end,
    stage: 1
  });
  
  // Stage 2: Mini (5 minutes, 2 weeks)
  currentDate = new Date(stage1EndDate);
  currentDate.setDate(currentDate.getDate() + 1);
  const stage2Tasks = tasks.slice(0, 2).map((t, i) => ({ 
    ...t, 
    duration: i === 0 ? 2 : 3 
  }));
  const stage2EndDate = new Date(currentDate);
  stage2EndDate.setDate(stage2EndDate.getDate() + 13);
  
  routines.push({
    name: `${baseName} - Plus`,
    startDate: currentDate.toISOString().split('T')[0],
    endDate: stage2EndDate.toISOString().split('T')[0],
    duration: 5,
    tasks: stage2Tasks,
    earliestStartTime: timeWindow?.start,
    latestEndTime: timeWindow?.end,
    stage: 2,
    replaces: routines[0].name
  });
  
  // Stage 3: Half (15 minutes, 3 weeks)
  currentDate = new Date(stage2EndDate);
  currentDate.setDate(currentDate.getDate() + 1);
  const stage3Tasks = tasks.slice(0, Math.ceil(tasks.length * 0.6)).map((t, i) => ({
    ...t,
    duration: Math.round(t.duration * 0.5)
  }));
  const stage3EndDate = new Date(currentDate);
  stage3EndDate.setDate(stage3EndDate.getDate() + 20);
  
  routines.push({
    name: `${baseName} - Builder`,
    startDate: currentDate.toISOString().split('T')[0],
    endDate: stage3EndDate.toISOString().split('T')[0],
    duration: 15,
    tasks: stage3Tasks,
    earliestStartTime: timeWindow?.start,
    latestEndTime: timeWindow?.end,
    stage: 3,
    replaces: routines[1].name
  });
  
  // Stage 4: Full (target duration, ongoing)
  currentDate = new Date(stage3EndDate);
  currentDate.setDate(currentDate.getDate() + 1);
  const stage4EndDate = new Date(currentDate);
  stage4EndDate.setMonth(stage4EndDate.getMonth() + 6); // 6 months for ongoing
  
  routines.push({
    name: `${baseName} - Complete`,
    startDate: currentDate.toISOString().split('T')[0],
    endDate: stage4EndDate.toISOString().split('T')[0],
    duration: targetDuration,
    tasks: tasks,
    earliestStartTime: timeWindow?.start,
    latestEndTime: timeWindow?.end,
    stage: 4,
    replaces: routines[2].name
  });
  
  return routines;
}