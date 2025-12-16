import mongoose, { Schema, Document } from "mongoose";

export interface IDay extends Document {
  user: mongoose.Types.ObjectId;
  date: string;
  completed: boolean;
  blocks: mongoose.Types.ObjectId[];
  completedTasksCount: number;
  performanceRating: {
    level: string;
    score: number;
    comment: string;
  };
  promptHistory?: Array<{
    prompt: string;
    timestamp: number;
  }>;
}

const DaySchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    blocks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Block",
      },
    ],
    completedTasksCount: {
      type: Number,
      default: 0,
    },
    performanceRating: {
      level: String,
      score: Number,
      comment: String,
    },
    promptHistory: [
      {
        prompt: { type: String, required: true },
        timestamp: { type: Number, default: () => Date.now() },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Day || mongoose.model<IDay>("Day", DaySchema);
