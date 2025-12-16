import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
  occupation?: string;
  location?: string;
  bio?: string;
  workHours?: string;
  commuteTime?: string;
  sleepSchedule?: string;
  idealSchedule?: string;
  days: mongoose.Types.ObjectId[];
  goals?: mongoose.Types.ObjectId[]; // Reference to user's goals
}

const UserSchema: Schema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    imageUrl: { type: String },
    occupation: { type: String },
    location: { type: String },
    bio: { type: String },
    workHours: { type: String },
    commuteTime: { type: String },
    sleepSchedule: { type: String },
    idealSchedule: { type: String },
    days: [{ type: Schema.Types.ObjectId, ref: "Day" }],
    goals: [{ type: Schema.Types.ObjectId, ref: "Goal" }], // Reference to user's goals
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
