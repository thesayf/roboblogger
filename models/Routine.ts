import mongoose from "mongoose";

const RoutineSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    days: { type: [String], default: [] }, // Days of week for routine (e.g., ["Monday", "Wednesday"])
    startTime: { type: String, required: true }, // Fixed start time (e.g., "06:30")
    duration: { type: Number, required: true }, // Duration in minutes
    startDate: { type: String, required: true }, // Routine active from
    endDate: { type: String, required: true }, // Routine active until
    // Removed tasks array - query via Task.find({ routineId }) instead
    goalId: { type: String, default: null }, // Reference to Goal
    order: { type: Number, default: 9999 }, // For sorting
  },
  { timestamps: true }
);

export default mongoose.models.Routine ||
  mongoose.model("Routine", RoutineSchema);
