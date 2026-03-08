import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface ILinkedDocument extends MongoDocument {
  owner: mongoose.Types.ObjectId;
  ownerClerkId: string;
  name: string;
  type: 'google_doc' | 'google_sheet';
  googleId: string; // The Google Doc/Sheet ID extracted from URL
  googleUrl: string; // Full URL to the document
  metadata?: {
    title?: string;
    sheetNames?: string[];
  };
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LinkedDocumentSchema = new Schema<ILinkedDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerClerkId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['google_doc', 'google_sheet'],
      required: true,
    },
    googleId: {
      type: String,
      required: true,
    },
    googleUrl: {
      type: String,
      required: true,
    },
    metadata: {
      title: String,
      sheetNames: [String],
    },
    lastAccessedAt: Date,
  },
  { timestamps: true }
);

LinkedDocumentSchema.index({ owner: 1, createdAt: -1 });
LinkedDocumentSchema.index({ ownerClerkId: 1 });

export default mongoose.models.LinkedDocument ||
  mongoose.model<ILinkedDocument>('LinkedDocument', LinkedDocumentSchema);
