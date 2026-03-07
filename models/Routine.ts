import mongoose, { Document, Schema } from 'mongoose';

export interface IRoutine extends Document {
  owner: mongoose.Types.ObjectId;
  ownerClerkId: string;
  name: string;
  prompt: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'once';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
  };
  enabled: boolean;
  nextRunAt: Date | null;
  lastRunAt?: Date;
  lastRunStatus?: 'success' | 'failed';
  maxCreditsPerRun: number;
  templateId?: string;
  totalRuns: number;
  successfulRuns: number;
  totalCreditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema<IRoutine>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerClerkId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  prompt: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'once'],
      required: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    minute: {
      type: Number,
      required: true,
      min: 0,
      max: 59,
    },
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  nextRunAt: {
    type: Date,
    default: null,
  },
  lastRunAt: {
    type: Date,
  },
  lastRunStatus: {
    type: String,
    enum: ['success', 'failed'],
  },
  maxCreditsPerRun: {
    type: Number,
    default: 1.0,
    min: 0.1,
    max: 10.0,
  },
  templateId: {
    type: String,
  },
  totalRuns: {
    type: Number,
    default: 0,
  },
  successfulRuns: {
    type: Number,
    default: 0,
  },
  totalCreditsUsed: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

RoutineSchema.index({ owner: 1, createdAt: -1 });
RoutineSchema.index({ enabled: 1, nextRunAt: 1 });
RoutineSchema.index({ ownerClerkId: 1 });

/**
 * Calculate the next run time for a routine.
 *
 * For 'once' routines: returns the next occurrence of the specified hour:minute.
 * Pass `afterCompletion: true` after a successful run to return null (disabling it).
 */
export function calculateNextRun(
  schedule: IRoutine['schedule'],
  from?: Date,
  afterCompletion?: boolean,
): Date | null {
  const now = from || new Date();

  if (schedule.frequency === 'once') {
    // After a "once" routine completes, return null so it won't run again
    if (afterCompletion) {
      return null;
    }
    // Before completion, schedule it for the specified time (today or tomorrow)
    const next = new Date(now);
    next.setUTCHours(schedule.hour, schedule.minute, 0, 0);
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next;
  }

  const next = new Date(now);
  next.setUTCHours(schedule.hour, schedule.minute, 0, 0);

  if (schedule.frequency === 'daily') {
    if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
  } else if (schedule.frequency === 'weekly') {
    const targetDay = schedule.dayOfWeek ?? 1;
    const currentDay = next.getUTCDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
      daysUntil += 7;
    }
    next.setUTCDate(next.getUTCDate() + daysUntil);
  } else if (schedule.frequency === 'monthly') {
    const targetDate = schedule.dayOfMonth ?? 1;
    next.setUTCDate(targetDate);
    if (next <= now) {
      next.setUTCMonth(next.getUTCMonth() + 1);
    }
  }

  return next;
}

const Routine = mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);

export default Routine;
