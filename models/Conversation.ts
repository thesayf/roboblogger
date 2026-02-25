import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  owner: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD, unique per user per day
  title: string;
  creditsUsed: number;
  dataChanged: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: 200,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    dataChanged: [{
      type: String,
    }],
  },
  { timestamps: true }
);

ConversationSchema.index({ owner: 1, date: 1 }, { unique: true });
ConversationSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
