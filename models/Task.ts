import mongoose from "mongoose";

export interface ITask {
  _id?: string;
  userId?: string;
  title: string; // Changed from 'name' to match frontend
  duration: number; // Changed to number (minutes) from string
  completed: boolean;
  // Keep these for backward compatibility with other parts of the app
  description?: string;
  dueDate?: Date;
  projectId?: mongoose.Types.ObjectId;
  routineId?: mongoose.Types.ObjectId;
  goalId?: string;
  isScheduled?: boolean;
  order?: number;
}

const TaskSchema = new mongoose.Schema(
  {
    userId: { type: String },
    title: { type: String, required: true }, // Changed from 'name'
    duration: { type: Number, required: true }, // Changed to Number from String
    completed: {
      type: Boolean,
      default: false,
    },
    // Optional fields for backward compatibility
    description: { type: String },
    dueDate: { type: Date },
    goalId: { type: String, default: null },
    isScheduled: { type: Boolean, default: false },
    order: { type: Number, default: 9999 },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      default: null,
    },
  },
  { timestamps: true, strict: false }
);

// Delete the model if it's already defined
if (mongoose.models.Task) {
  delete mongoose.models.Task;
}

// Create and export the model
const Task = mongoose.model("Task", TaskSchema);
export default Task;
