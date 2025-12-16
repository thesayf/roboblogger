import mongoose, { Schema, Document } from "mongoose";

export interface IBlock extends Document {
  dayId: mongoose.Types.ObjectId;
  title: string; // Changed from 'name'
  time: string; // Changed from 'startTime'
  duration: number; // In minutes - calculated from start/end times
  type: "deep-work" | "admin" | "break" | "meeting" | "personal" | "event" | "routine"; // Changed from 'blockType', removed health/exercise
  tasks: mongoose.Types.ObjectId[];
  completed?: boolean; // Optional completion status
  note?: string; // Optional note/reflection for the block
  index?: number; // For ordering blocks
  metadata?: {
    zoomLink?: string;
    location?: string;
    isRecurring?: boolean;
    eventId?: mongoose.Types.ObjectId; // Reference to the Event model
    routineId?: mongoose.Types.ObjectId; // Reference to the Routine model
  };
}

const BlockSchema: Schema = new Schema(
  {
    dayId: {
      type: Schema.Types.ObjectId,
      ref: "Day",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["deep-work", "admin", "break", "meeting", "personal", "event", "routine"],
      required: true,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    completed: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: '',
    },
    index: {
      type: Number,
      default: 0
    },
    metadata: {
      zoomLink: { type: String },
      location: { type: String },
      isRecurring: { type: Boolean },
      eventId: { 
        type: Schema.Types.ObjectId,
        ref: "Event"
      },
      routineId: {
        type: Schema.Types.ObjectId,
        ref: "Routine"
      }
    },
  },
  { timestamps: true }
);

const Block =
  mongoose.models.Block || mongoose.model<IBlock>("Block", BlockSchema);

export default Block;
