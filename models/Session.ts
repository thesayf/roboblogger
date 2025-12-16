import mongoose, { Schema, Document } from 'mongoose';

// Session document interface
export interface ISession extends Document {
  userId: string;
  conversationId: string;
  sessionId: string;
  todos: Array<{
    id: string;
    action: string;
    description: string;
    params?: any;
    status: string;
    blockedBy?: string;
    planId?: string;
    result?: any;
  }>;
  pendingPlan?: {
    type: string;
    data: any;
    id?: string;
  };
  updatedAt: Date;
  expiresAt: Date;
}

// Session schema
const SessionSchema = new Schema<ISession>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  todos: {
    type: [{
      id: String,
      action: String,
      description: String,
      params: Schema.Types.Mixed,
      status: String,
      blockedBy: String,
      planId: String,
      result: Schema.Types.Mixed
    }],
    default: []
  },
  pendingPlan: {
    type: Schema.Types.Mixed,
    required: false,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  }
});

// Update the updatedAt timestamp on save
SessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index for efficient queries
SessionSchema.index({ userId: 1, conversationId: 1 });

const Session = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;