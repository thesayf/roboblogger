import mongoose, { Document, Schema } from 'mongoose';
import type { ChatImageAttachment } from '@/lib/chat/attachments';

export interface IChatMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatImageAttachment[];
  toolCalls?: Array<{
    name: string;
    input: Record<string, any>;
    result?: string;
  }>;
  embedding?: number[];
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    attachments: [{
      _id: false,
      type: { type: String, enum: ['image'], required: true },
      fileId: { type: String, required: true },
      name: { type: String, required: true },
      url: { type: String, required: true },
      thumbnailUrl: String,
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      width: Number,
      height: Number,
    }],
    toolCalls: [{
      name: String,
      input: Schema.Types.Mixed,
      result: String,
    }],
    embedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ owner: 1, date: 1 });
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ content: 'text' });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
