import mongoose, { Document, Schema } from 'mongoose';

export interface IGoogleIntegration extends Document {
  userId: string; // Clerk user ID
  refreshToken: string;
  email: string;
  connectedAt: Date;
}

const GoogleIntegrationSchema = new Schema<IGoogleIntegration>(
  {
    userId: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    email: { type: String, required: true },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GoogleIntegrationSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.GoogleIntegration ||
  mongoose.model<IGoogleIntegration>('GoogleIntegration', GoogleIntegrationSchema);
