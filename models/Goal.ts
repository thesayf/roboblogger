import mongoose, { Document, Schema } from "mongoose";

export interface IGoal extends Document {
  userId: string;
  content: string;
  color: string; // Gradient class like "from-pink-100 to-rose-100"
  deadline: Date; // Required deadline for goal
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    content: { type: String, required: true },
    color: { 
      type: String, 
      required: true,
      default: "from-gray-100 to-gray-200"
    },
    deadline: { type: Date, required: true }, // Required deadline
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for efficient queries
GoalSchema.index({ userId: 1, order: 1 });

export default mongoose.models.Goal ||
  mongoose.model<IGoal>("Goal", GoalSchema);