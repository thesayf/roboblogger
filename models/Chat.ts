import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  dayId: mongoose.Types.ObjectId;
  date: string;
  role: 'user' | 'ai';
  message: string;
  timestamp: Date;
  metadata?: {
    action?: string;
    entities?: Record<string, any>;
    confidence?: number;
    toolsUsed?: string[];
  };
}

const ChatSchema: Schema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    dayId: { 
      type: Schema.Types.ObjectId, 
      ref: "Day", 
      required: true 
    },
    date: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['user', 'ai'], 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    metadata: {
      action: String,
      entities: Schema.Types.Mixed,
      confidence: Number,
      toolsUsed: [String]
    }
  },
  { timestamps: true }
);

// Indexes for performance
ChatSchema.index({ userId: 1, timestamp: -1 });
ChatSchema.index({ userId: 1, date: 1 });
ChatSchema.index({ dayId: 1 });
ChatSchema.index({ message: 'text' }); // Full text search

export default mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);