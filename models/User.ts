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
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
