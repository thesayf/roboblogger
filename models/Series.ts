import mongoose, { Document, Schema } from 'mongoose';

export type SeriesStatus = 'draft' | 'active' | 'archived';

export interface ISeries extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  slug: string;
  clusterId?: mongoose.Types.ObjectId;
  status: SeriesStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema = new Schema<ISeries>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    clusterId: {
      type: Schema.Types.ObjectId,
      ref: 'TopicCluster',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      required: true,
    },
  },
  { timestamps: true }
);

SeriesSchema.index({ owner: 1, slug: 1 }, { unique: true });
SeriesSchema.index({ owner: 1, clusterId: 1, status: 1, createdAt: -1 });
SeriesSchema.index({ owner: 1, status: 1, createdAt: -1 });

export default mongoose.models.Series ||
  mongoose.model<ISeries>('Series', SeriesSchema);
