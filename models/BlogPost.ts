import mongoose, { Schema, Document } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  description?: string;
  slug: string;
  featuredImage?: string;
  featuredImageThumbnail?: string;
  category?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  readTime?: number;
  views: number;
  owner: mongoose.Types.ObjectId; // User who owns this post (for multi-tenancy)
  author: mongoose.Types.ObjectId;
  components: mongoose.Types.ObjectId[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: function(this: any) { return this.status === 'published'; } },
    slug: { type: String, required: true, unique: true },
    featuredImage: { type: String },
    featuredImageThumbnail: { type: String },
    category: { type: String },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    readTime: { type: Number },
    views: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    components: [{ type: Schema.Types.ObjectId, ref: "BlogComponent" }],
    tags: [{ type: String }],
    seoTitle: { type: String },
    seoDescription: { type: String },
  },
  { timestamps: true }
);

// Add indexes for better performance
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ publishedAt: -1 });
BlogPostSchema.index({ owner: 1 });
BlogPostSchema.index({ owner: 1, status: 1 });
BlogPostSchema.index({ author: 1 });

export default mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
