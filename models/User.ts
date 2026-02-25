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
  // Stripe & Billing
  stripeCustomerId?: string;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  subscriptionId?: string;
  subscriptionPriceId?: string;
  subscriptionCurrentPeriodEnd?: Date;
  trialEndsAt?: Date;
  // Credits/Wallet
  credits: number;
  freeCreditsUsed: boolean;
  lifetimeCreditsUsed: number;
  lifetimeCreditsPurchased: number;
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
    // Stripe & Billing
    stripeCustomerId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'],
      default: 'none'
    },
    subscriptionId: { type: String },
    subscriptionPriceId: { type: String },
    subscriptionCurrentPeriodEnd: { type: Date },
    trialEndsAt: { type: Date },
    // Credits/Wallet
    credits: { type: Number, default: 0 },
    freeCreditsUsed: { type: Boolean, default: false },
    lifetimeCreditsUsed: { type: Number, default: 0 },
    lifetimeCreditsPurchased: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
