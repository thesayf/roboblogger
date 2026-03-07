import mongoose, { Document, Schema } from 'mongoose';

export interface IRoutineExecution extends Document {
  routine: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  ownerClerkId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failed';
  phase: 'queued' | 'loading_context' | 'thinking' | 'calling_tool' | 'completed' | 'failed';
  phaseDetail?: string;
  liveLog: Array<{
    timestamp: Date;
    type: 'phase' | 'tool_start' | 'tool_end' | 'text' | 'error';
    message: string;
  }>;
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
  phase: {
    type: String,
    enum: ['queued', 'loading_context', 'thinking', 'calling_tool', 'completed', 'failed'],
    default: 'queued',
  },
  phaseDetail: {
    type: String,
  },
  liveLog: [{
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['phase', 'tool_start', 'tool_end', 'text', 'error'] },
    message: String,
  }],
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
