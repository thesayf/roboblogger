import mongoose, { Document, Schema } from 'mongoose';

export type TopicClusterStatus = 'draft' | 'active' | 'archived';

export interface ITopicCluster extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  slug: string;
  status: TopicClusterStatus;
  primaryPillarTopicId?: mongoose.Types.ObjectId;
  primaryPillarPostId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TopicClusterSchema = new Schema<ITopicCluster>(
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
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      required: true,
    },
    primaryPillarTopicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    primaryPillarPostId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
    },
  },
  { timestamps: true }
);

TopicClusterSchema.index({ owner: 1, slug: 1 }, { unique: true });
TopicClusterSchema.index({ owner: 1, status: 1, createdAt: -1 });
TopicClusterSchema.index(
  { owner: 1, primaryPillarTopicId: 1 },
  {
    unique: true,
    partialFilterExpression: { primaryPillarTopicId: { $type: 'objectId' } },
  }
);
TopicClusterSchema.index(
  { owner: 1, primaryPillarPostId: 1 },
  {
    unique: true,
    partialFilterExpression: { primaryPillarPostId: { $type: 'objectId' } },
  }
);

export default mongoose.models.TopicCluster ||
  mongoose.model<ITopicCluster>('TopicCluster', TopicClusterSchema);
