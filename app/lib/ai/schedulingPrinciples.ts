/**
 * Evidence-Based Scheduling Principles for AI Assistant
 * These principles guide the AI when generating optimal schedules
 */

export const SCHEDULING_PRINCIPLES = {
  // 1. SCHEDULING HIERARCHY (non-negotiable priority order)
  priorityHierarchy: [
    { level: 1, type: "events", rule: "Absolute priority, cannot be moved" },
    { level: 2, type: "routines", rule: "Scheduled at preferred times unless conflict with urgent deadline" },
    { level: 3, type: "deadline_tasks", rule: "Tasks due today/tomorrow get priority" },
    { level: 4, type: "deep_work", rule: "Based on goal priority ranking" },
    { level: 5, type: "admin_work", rule: "Fill remaining gaps" }
  ],

  // 2. CONFLICT RESOLUTION
  conflictRules: [
    "No two blocks can overlap - ever",
    "Tasks must be inside blocks, not floating independently",
    "Events override everything else",
    "If routine conflicts with urgent deadline, reschedule the routine",
    "Start scheduling from user's current time unless specified otherwise"
  ],

  // 3. DAILY LIMITS (evidence-based capacity)
  dailyLimits: {
    hardThings: {
      optimal: 2,
      maximum: 3,
      evidence: "Baumeister's Willpower research: Decision fatigue after 2-3 major decisions/day",
      implementation: "Schedule hardest tasks in first 3 hours after waking"
    },
    deepWorkBlocks: {
      durationMin: 90,  // minutes
      durationMax: 120, // minutes
      maxBlocksPerDay: 2,
      maxTotalHours: 3.5,
      evidence: "Ericsson's Deliberate Practice: Elite performers average 3.5 hrs/day maximum",
      breakAfterBlock: 15 // minutes minimum
    },
    totalFocusTime: {
      sustainableHours: "4-6 hours/day",
      evidence: "Newport's Deep Work: Knowledge workers average only 1-2 hours actual deep work",
      principle: "Remaining time for admin, breaks, and personal tasks"
    }
  },

  // 4. PROJECT PRIORITIZATION
  projectSelection: [
    { step: 1, action: "Check for critical deadlines (today/tomorrow)", rule: "Schedule first" },
    { step: 2, action: "Look at goal priority (1-3 ranking)", rule: "Higher priority first" },
    { step: 3, action: "If tied priority", rule: "Ask user: 'Both X and Y are important. Which would you prefer today?'" },
    { step: 4, action: "Default selection", rule: "Choose project with least recent progress" }
  ],

  // 5. TIME SLOT OPTIMIZATION
  optimalTimeSlots: {
    deepWork: {
      bestTimes: [
        { slot: "08:00-11:00", quality: "peak performance" },
        { slot: "15:00-17:00", quality: "good performance" }
      ],
      requirements: "Uninterrupted block, preferably after routine or coffee",
      avoid: [
        { slot: "13:00-15:00", reason: "post-lunch energy dip" },
        { slot: "21:00-23:00", reason: "late evening fatigue" }
      ]
    },
    routines: {
      morning: "Fixed time daily for consistency",
      exercise: [
        { time: "06:00-08:00", benefit: "energy boost for the day" },
        { time: "17:00-19:00", benefit: "stress relief after work" }
      ],
      evening: "90 minutes before bed for wind-down"
    },
    adminTasks: {
      bestTimes: [
        { slot: "11:00-12:00", reason: "pre-lunch lower energy" },
        { slot: "14:00-15:00", reason: "post-lunch low focus period" },
        { slot: "16:30-17:30", reason: "end of day wrap-up" }
      ],
      strategy: "Batch similar tasks together to minimize context switching"
    }
  },

  // 6. BUFFER REQUIREMENTS
  buffers: {
    betweenBlocks: 15,        // minutes minimum
    beforeMeetings: 15,       // minutes for prep
    afterMeetings: 15,        // minutes for notes/recovery
    dailyFlexPercent: 20,     // keep 20% of day unscheduled
    principle: "Buffers prevent cascade failures when things run over"
  },

  // 7. SCIENTIFIC EVIDENCE
  evidence: {
    willpower: {
      source: "Baumeister & Tierney - Willpower (2011)",
      finding: "Willpower is finite resource that depletes throughout the day",
      application: "Maximum 2-3 hard decisions/tasks per day"
    },
    ultradianRhythms: {
      source: "Kleitman - Basic Rest Activity Cycle",
      finding: "90-120 minute cycles of high/low alertness",
      application: "Deep work blocks should match biological rhythm"
    },
    deliberatePractice: {
      source: "Ericsson - Peak Performance (1993)",
      finding: "Elite performers: 3.5 hours focused practice/day maximum",
      application: "Total focus time including meetings: 4-6 hours"
    },
    attentionResidue: {
      source: "Sophie Leroy - Attention Residue (2009)",
      finding: "Task switching leaves residue, reduces performance by 40%",
      application: "Batch similar tasks, minimize context switches"
    }
  }
};

/**
 * Quick validation functions for the AI to use
 */

export function isWithinDailyLimits(schedule: any[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Count deep work blocks
  const deepWorkBlocks = schedule.filter(b => b.type === 'deep-work');
  if (deepWorkBlocks.length > SCHEDULING_PRINCIPLES.dailyLimits.deepWorkBlocks.maxBlocksPerDay) {
    issues.push(`Too many deep work blocks: ${deepWorkBlocks.length} (max: 2)`);
  }
  
  // Calculate total deep work hours
  const deepWorkMinutes = deepWorkBlocks.reduce((sum, b) => sum + b.duration, 0);
  const deepWorkHours = deepWorkMinutes / 60;
  if (deepWorkHours > SCHEDULING_PRINCIPLES.dailyLimits.deepWorkBlocks.maxTotalHours) {
    issues.push(`Too much deep work: ${deepWorkHours.toFixed(1)} hours (max: 3.5)`);
  }
  
  // Count hard things
  const hardThings = schedule.filter(b => 
    b.type === 'deep-work' || b.priority === 'high' || b.difficulty === 'hard'
  );
  if (hardThings.length > SCHEDULING_PRINCIPLES.dailyLimits.hardThings.maximum) {
    issues.push(`Too many hard things: ${hardThings.length} (max: 3)`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export function isOptimalTimeSlot(blockType: string, time: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  
  if (blockType === 'deep-work') {
    // Check if in peak hours
    return (hour >= 8 && hour < 11) || (hour >= 15 && hour < 17);
  }
  
  if (blockType === 'admin') {
    // Check if in admin-friendly hours
    return (hour >= 11 && hour < 12) || (hour >= 14 && hour < 15) || (hour >= 16 && hour < 18);
  }
  
  return true; // Other types can go anywhere
}

export function hasConflicts(blocks: any[]): { hasConflict: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const block1 = blocks[i];
      const block2 = blocks[j];
      
      // Convert times to minutes for comparison
      const start1 = timeToMinutes(block1.time);
      const end1 = start1 + block1.duration;
      const start2 = timeToMinutes(block2.time);
      const end2 = start2 + block2.duration;
      
      if (start1 < end2 && end1 > start2) {
        conflicts.push(`"${block1.title}" overlaps with "${block2.title}"`);
      }
    }
  }
  
  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Main function for AI to get scheduling guidance
 */
export function getSchedulingGuidance(): string {
  return `
SCHEDULING PRINCIPLES TO FOLLOW:

1. PRIORITY ORDER (non-negotiable):
   - Events (fixed, cannot move)
   - Routines (preferred times)
   - Deadline tasks (today/tomorrow)
   - Deep work (by goal priority)
   - Admin work (fill gaps)

2. DAILY LIMITS:
   - Max 3 hard things per day (optimal: 2)
   - Max 2 deep work blocks (90-120 min each)
   - Max 3.5 hours total deep work
   - Keep 20% of day unscheduled as buffer

3. OPTIMAL TIMING:
   - Deep work: 8-11am OR 3-5pm (peak hours)
   - Admin tasks: 11am-12pm, 2-3pm, 4:30-5:30pm
   - Avoid deep work: 1-3pm (post-lunch), after 9pm

4. REQUIREMENTS:
   - 15 min buffer between all blocks
   - No overlapping blocks ever
   - Tasks must be inside blocks
   - Batch similar tasks together

5. EVIDENCE BASE:
   - Willpower depletes (max 3 hard things)
   - Ultradian rhythms (90-120 min cycles)
   - Elite performers max 3.5 hrs deep work
   - Task switching reduces performance 40%

When creating a schedule:
1. Place fixed events first
2. Add routines at their preferred times
3. Schedule deadline tasks by urgency
4. Add deep work in peak hours
5. Fill remaining gaps with admin
6. Verify no conflicts or limit violations
`;
}