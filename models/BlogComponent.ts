import mongoose, { Schema, Document } from "mongoose";

export type ComponentType =
  | "rich_text"
  | "image"
  | "callout"
  | "quote"
  | "cta"
  | "video"
  | "table"
  | "bar_chart"
  | "line_chart"
  | "pie_chart"
  | "comparison_table"
  | "pros_cons"
  | "timeline"
  | "flowchart"
  | "step_by_step"
  | "code_block";
export type CalloutVariant = "info" | "success" | "warning" | "error";
export type CTAStyle = "primary" | "secondary" | "outline";

export interface IBlogComponent extends Document {
  blogPost: mongoose.Types.ObjectId;
  type: ComponentType;
  order: number;

  // Rich Text Component
  content?: string;

  // Image Component
  src?: string; // Legacy field for backwards compatibility
  url?: string; // New primary image URL from ImageKit
  alt?: string;
  caption?: string;
  // Direct ImageKit fields (from auto-upload)
  fileId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  // Legacy ImageKit metadata
  imageKit?: {
    fileId?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };

  // Callout Component
  variant?: CalloutVariant;
  title?: string;

  // Quote Component
  author?: string;
  citation?: string;

  // CTA Component
  text?: string;
  link?: string;
  style?: CTAStyle;

  // Video Component
  videoUrl?: string;
  thumbnail?: string;
  videoTitle?: string;

  // Table Component
  headers?: string[];
  rows?: string[][];
  tableCaption?: string;
  tableStyle?: "comparison" | "data" | "pricing";

  // General data field for new component types (charts, timelines, etc.)
  data?: any;

  createdAt: Date;
  updatedAt: Date;
}

const BlogComponentSchema: Schema = new Schema(
  {
    blogPost: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true },
    type: {
      type: String,
      enum: ["rich_text", "image", "callout", "quote", "cta", "video", "table", "bar_chart", "line_chart", "pie_chart", "comparison_table", "pros_cons", "timeline", "flowchart", "step_by_step", "code_block"],
      required: true,
    },
    order: { type: Number, required: true },

    // Rich Text Component
    content: { type: String },

    // Image Component
    src: { type: String }, // Legacy field for backwards compatibility
    url: { type: String }, // New primary image URL from ImageKit
    alt: { type: String },
    caption: { type: String },
    // Direct ImageKit fields (from auto-upload)
    fileId: { type: String },
    thumbnailUrl: { type: String },
    width: { type: Number },
    height: { type: Number },
    // Legacy ImageKit metadata
    imageKit: {
      fileId: { type: String },
      thumbnailUrl: { type: String },
      width: { type: Number },
      height: { type: Number },
      format: { type: String },
      size: { type: Number },
    },

    // Callout Component
    variant: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    title: { type: String },

    // Quote Component
    author: { type: String },
    citation: { type: String },

    // CTA Component
    text: { type: String },
    link: { type: String },
    style: {
      type: String,
      enum: ["primary", "secondary", "outline"],
      default: "primary",
    },

    // Video Component
    videoUrl: { type: String },
    thumbnail: { type: String },
    videoTitle: { type: String },

    // Table Component
    headers: [{ type: String }],
    rows: [[{ type: String }]],
    tableCaption: { type: String },
    tableStyle: {
      type: String,
      enum: ["comparison", "data", "pricing"],
      default: "data",
    },

    // General data field for new component types
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Add indexes for better performance
BlogComponentSchema.index({ blogPost: 1, order: 1 });
BlogComponentSchema.index({ type: 1 });

export default mongoose.models.BlogComponent ||
  mongoose.model<IBlogComponent>("BlogComponent", BlogComponentSchema);
