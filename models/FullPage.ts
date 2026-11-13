import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
  post: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  draft: Schema.Types.Mixed,
  published: Schema.Types.Mixed,
  previousPublished: Schema.Types.Mixed,
  enabled: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.models.FullPage || mongoose.model('FullPage', schema);
