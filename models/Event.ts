import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  userId: string;
  name: string;
  description?: string;
  dueDate?: Date; // Date for the event
  date?: Date; // Alternative date field for consistency
  startTime: string;
  endTime: string;
  location?: string; // Event location
  isRecurring?: boolean;
  recurringDays?: string[]; // Days of week for recurring
  zoomLink?: string; // Meeting link (legacy)
  completed: boolean;
  goalId?: string; // Reference to Goal
  order?: number; // For sorting
  metadata?: Record<string, any>; // Additional metadata
}

const EventSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    dueDate: { type: Date, required: false }, // Date for the event
    date: { type: Date, required: false }, // Alternative date field for consistency
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, required: false }, // Event location
    isRecurring: { type: Boolean, default: false },
    recurringDays: [String], // Days of week for recurring
    zoomLink: { type: String, required: false }, // Meeting link (legacy)
    completed: { type: Boolean, default: false },
    goalId: { type: String, default: null }, // Reference to Goal
    order: { type: Number, default: 9999 }, // For sorting
    metadata: { type: Schema.Types.Mixed, default: {} }, // Additional metadata
  },
  { timestamps: true }
);

if (mongoose.models.Event) {
  delete mongoose.models.Event;
}

const Event = mongoose.model<IEvent>("Event", EventSchema);

export default Event;
