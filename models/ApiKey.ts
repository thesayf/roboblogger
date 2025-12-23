import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  // Key identification
  keyHash: string; // SHA-256 hash of the actual key (we never store the raw key)
  keyPrefix: string; // First 8 chars for display (e.g., "rb_live_a1b2...")

  // Ownership
  owner: mongoose.Types.ObjectId;

  // Metadata
  name: string; // User-given name like "Production", "Development"

  // Permissions & limits
  permissions: ('read' | 'write')[];
  rateLimit: number; // Requests per hour

  // Usage tracking
  requestCount: number; // Total requests made
  lastUsedAt?: Date;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  keyHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keyPrefix: {
    type: String,
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  permissions: [{
    type: String,
    enum: ['read', 'write'],
    default: ['read']
  }],
  rateLimit: {
    type: Number,
    default: 1000, // 1000 requests per hour
    min: 100,
    max: 10000
  },
  requestCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ApiKeySchema.index({ owner: 1, isActive: 1 });
ApiKeySchema.index({ keyHash: 1 });

/**
 * Generate a new API key
 * Returns both the raw key (to show user once) and the hash (to store)
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  // Generate 32 random bytes and encode as base64url
  const randomBytes = crypto.randomBytes(32);
  const rawKey = `rb_live_${randomBytes.toString('base64url')}`;

  // Hash the key for storage
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Keep prefix for display
  const keyPrefix = rawKey.substring(0, 16) + '...';

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash a raw API key for lookup
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;
