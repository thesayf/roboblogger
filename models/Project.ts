import mongoose, { Document, Schema } from "mongoose";

// Interface for the Project, extending Document
export interface IProject extends Document {
  userId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  order: number;
  goalId?: string; // Reference to Goal
  // Tasks are queried via Task.find({ projectId }) - no array needed
}

// Schema for the Project
const ProjectSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    dueDate: { type: Date, required: false },
    completed: { type: Boolean, required: true, default: false },
    completedAt: { type: Date, default: null },
    // Removed tasks array - query via Task.find({ projectId }) instead
    order: { type: Number, default: 9999 },
    goalId: { type: String, required: false },
  },
  { timestamps: true }
);

// Create and export the model
export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
