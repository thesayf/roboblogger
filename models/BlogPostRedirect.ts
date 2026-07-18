import mongoose, { Document, Schema } from "mongoose";

export type BlogPostRedirectReason =
  | "duplicate"
  | "consolidated"
  | "slug_change"
  | "manual";

export interface IBlogPostRedirect extends Document {
  owner: mongoose.Types.ObjectId;
  fromSlug: string;
  toSlug: string;
  reason: BlogPostRedirectReason;
  sourcePostId?: mongoose.Types.ObjectId;
  targetPostId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostRedirectSchema = new Schema<IBlogPostRedirect>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    toSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    reason: {
      type: String,
      enum: ["duplicate", "consolidated", "slug_change", "manual"],
      default: "manual",
      required: true,
    },
    sourcePostId: {
      type: Schema.Types.ObjectId,
      ref: "BlogPost",
    },
    targetPostId: {
      type: Schema.Types.ObjectId,
      ref: "BlogPost",
    },
  },
  { timestamps: true }
);

BlogPostRedirectSchema.index({ fromSlug: 1 }, { unique: true });
BlogPostRedirectSchema.index({ owner: 1, toSlug: 1 });

export default mongoose.models.BlogPostRedirect ||
  mongoose.model<IBlogPostRedirect>(
    "BlogPostRedirect",
    BlogPostRedirectSchema
  );
