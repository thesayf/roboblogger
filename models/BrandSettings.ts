import mongoose, { Document, Schema } from 'mongoose';

export interface IBrandSettings extends Document {
  userId: string; // Clerk user ID for multi-tenancy

  // Blog Identity
  blogName: string;
  blogDescription: string;
  blogUrl?: string; // External blog URL for "View live" links

  // Target Audience
  targetAudience: string;

  // Voice & Style
  tone: 'professional' | 'casual' | 'technical' | 'conversational' | 'authoritative' | 'friendly' | 'custom';
  customTone?: string; // Used when tone is 'custom'
  styleGuidelines: string;

  // Content Guidelines
  topicsWeCover: string;
  thingsToAvoid: string;

  // Example Content
  exampleContent?: string; // Sample posts or writing examples

  // Industry/Niche (for SEO research)
  industryNiche?: string;

  // Brand Reference Images (used as fallback for image generation style)
  referenceImages?: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BrandSettingsSchema = new Schema<IBrandSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // One brand settings per user
      index: true,
    },

    // Blog Identity
    blogName: {
      type: String,
      default: '',
    },
    blogDescription: {
      type: String,
      default: '',
    },
    blogUrl: {
      type: String,
      default: '',
    },

    // Target Audience
    targetAudience: {
      type: String,
      default: '',
    },

    // Voice & Style
    tone: {
      type: String,
      enum: ['professional', 'casual', 'technical', 'conversational', 'authoritative', 'friendly', 'custom'],
      default: 'professional',
    },
    customTone: {
      type: String,
      default: '',
    },
    styleGuidelines: {
      type: String,
      default: '',
    },

    // Content Guidelines
    topicsWeCover: {
      type: String,
      default: '',
    },
    thingsToAvoid: {
      type: String,
      default: '',
    },

    // Example Content
    exampleContent: {
      type: String,
      default: '',
    },

    // Industry/Niche
    industryNiche: {
      type: String,
      default: '',
    },

    // Brand Reference Images
    referenceImages: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export default mongoose.models.BrandSettings || mongoose.model<IBrandSettings>('BrandSettings', BrandSettingsSchema);
