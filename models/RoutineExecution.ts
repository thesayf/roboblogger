import mongoose, { Document, Schema } from 'mongoose';

export interface IRoutineExecution extends Document {
  routine: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  ownerClerkId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failed';
  prompt: string;
  response: string;
  toolCalls: Array<{
    name: string;
    input: Record<string, any>;
    result?: string;
    success: boolean;
  }>;
  dataChanged: string[];
  creditsUsed: number;
  error?: string;
}

const RoutineExecutionSchema = new Schema<IRoutineExecution>({
  routine: {
    type: Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerClerkId: {
    type: String,
    required: true,
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['running', 'success', 'failed'],
    default: 'running',
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: '',
  },
  toolCalls: [{
    name: String,
    input: Schema.Types.Mixed,
    result: String,
    success: Boolean,
  }],
  dataChanged: [{
    type: String,
  }],
  creditsUsed: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

RoutineExecutionSchema.index({ routine: 1, createdAt: -1 });
RoutineExecutionSchema.index({ owner: 1, createdAt: -1 });
RoutineExecutionSchema.index({ status: 1 });

const RoutineExecution = mongoose.models.RoutineExecution || mongoose.model<IRoutineExecution>('RoutineExecution', RoutineExecutionSchema);

export default RoutineExecution;
