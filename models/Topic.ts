import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  // Core generation parameters (from AI form)
  topic: string;
  audience?: string;
  tone?: string;
  length?: string;
  includeImages: boolean;
  includeCallouts: boolean;
  includeCTA: boolean;
  additionalRequirements?: string;
  imageContext?: string;
  referenceImages?: string[]; // base64 encoded images or file IDs
  
  // Brand context
  brandContext?: string;
  brandExamples?: string;
  
  // SEO Strategy
  seo?: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    longTailKeywords?: string[];
    lsiKeywords?: string[]; // Latent Semantic Indexing keywords
    keywordDensity?: number; // Target density percentage (e.g., 1.5)
    searchIntent?: 'informational' | 'commercial' | 'navigational' | 'transactional';
    
    // Meta data
    metaTitle?: string; // 60 chars max, for browser tabs and search results
    metaDescription?: string; // 155 chars max, for search result snippets
    openGraph?: {
      title?: string; // Can be different from meta title
      description?: string; // Can be different from meta description
      image?: string; // URL or reference to image
      type?: string; // article, website, etc.
    };
    schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'HowToArticle' | 'FAQPage';
    
    // URL optimization
    slug?: string; // SEO-friendly URL slug
    canonicalUrl?: string; // Canonical URL if needed
  };
  
  // Queue metadata
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generationPhase?: 'initializing' | 'searching' | 'writing_content' | 'generating_images' | 'saving'; // detailed phase
  priority: 'low' | 'medium' | 'high';
  source: 'individual' | 'bulk';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date; // for scheduled generation
  processingStartedAt?: Date; // when generation started (for timeout detection)
  lastProcessedAt?: Date; // last time this topic was processed
  lastFailedAt?: Date; // last time generation failed
  retryAfter?: Date; // when this topic can be retried next
  
  // Generation results
  generatedPostId?: string; // ObjectId reference to created BlogPost
  errorMessage?: string; // if generation failed
  failureReason?: string; // reason for failure (timeout, max retries, etc.)
  retryCount: number;
  
  // User and organization
  createdBy?: string; // user ID who created this topic
  tags?: string[]; // for organization and filtering
  notes?: string; // user notes about this topic
  
  // Estimated completion
  estimatedDuration?: number; // estimated generation time in minutes
}

const TopicSchema = new Schema<ITopic>({
  // Core generation parameters
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  audience: {
    type: String,
    trim: true,
    maxlength: 200
  },
  tone: {
    type: String,
    trim: true,
    maxlength: 100
  },
  length: {
    type: String,
    trim: true,
    maxlength: 100
  },
  includeImages: {
    type: Boolean,
    default: true
  },
  includeCallouts: {
    type: Boolean,
    default: true
  },
  includeCTA: {
    type: Boolean,
    default: true
  },
  additionalRequirements: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  imageContext: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  referenceImages: [{
    type: String, // base64 encoded images or file IDs
    maxlength: 10000000 // ~10MB for base64 images
  }],
  
  // Brand context
  brandContext: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  brandExamples: {
    type: String,
    trim: true,
    maxlength: 50000 // Allow for multiple example posts
  },
  
  // SEO Strategy
  seo: {
    primaryKeyword: {
      type: String,
      trim: true,
      maxlength: 100
    },
    secondaryKeywords: [{
      type: String,
      trim: true,
      maxlength: 100
    }],
    longTailKeywords: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    lsiKeywords: [{
      type: String,
      trim: true,
      maxlength: 100
    }],
    keywordDensity: {
      type: Number,
      min: 0.5,
      max: 3.0,
      default: 1.5
    },
    searchIntent: {
      type: String,
      enum: ['informational', 'commercial', 'navigational', 'transactional'],
      default: 'informational'
    },
    // Meta data
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 155
    },
    openGraph: {
      title: {
        type: String,
        trim: true,
        maxlength: 100
      },
      description: {
        type: String,
        trim: true,
        maxlength: 200
      },
      image: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        trim: true,
        default: 'article'
      }
    },
    schemaType: {
      type: String,
      default: 'BlogPosting'
      // No enum restriction - accept any schema.org type
    },
    // URL optimization
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: /^[a-z0-9-]+$/ // Only lowercase letters, numbers, and hyphens
    },
    canonicalUrl: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  
  // Queue metadata
  status: {
    type: String,
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending',
    required: true
  },
  generationPhase: {
    type: String,
    enum: ['initializing', 'searching', 'writing_content', 'generating_images', 'saving'],
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  },
  source: {
    type: String,
    enum: ['individual', 'bulk'],
    default: 'individual',
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  scheduledAt: {
    type: Date
  },
  processingStartedAt: {
    type: Date
  },
  lastProcessedAt: {
    type: Date
  },
  lastFailedAt: {
    type: Date
  },
  retryAfter: {
    type: Date
  },
  
  // Generation results
  generatedPostId: {
    type: String // BlogPost ObjectId as string
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  failureReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // User and organization
  createdBy: {
    type: String, // user ID
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  
  // Estimated completion
  estimatedDuration: {
    type: Number, // minutes
    min: 1,
    max: 60,
    default: 5
  }
}, {
  timestamps: true // This automatically manages createdAt and updatedAt
});

// Indexes for better query performance
TopicSchema.index({ status: 1, priority: -1, createdAt: 1 });
TopicSchema.index({ createdBy: 1, createdAt: -1 });
TopicSchema.index({ tags: 1 });
TopicSchema.index({ scheduledAt: 1 });
TopicSchema.index({ status: 1, scheduledAt: 1, retryAfter: 1 }); // For cron job queries
TopicSchema.index({ status: 1, processingStartedAt: 1 }); // For detecting stuck jobs
TopicSchema.index({ 'seo.slug': 1 }, { sparse: true }); // For unique slug validation

// Pre-save middleware to update the updatedAt field and validate slug
TopicSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Ensure slug is unique if provided
  if (this.seo?.slug && this.isModified('seo.slug')) {
    const existingTopic = await mongoose.models.Topic.findOne({
      'seo.slug': this.seo.slug,
      _id: { $ne: this._id }
    });
    
    if (existingTopic) {
      // Append a number to make it unique
      let counter = 1;
      let newSlug = `${this.seo.slug}-${counter}`;
      
      while (await mongoose.models.Topic.findOne({ 'seo.slug': newSlug })) {
        counter++;
        newSlug = `${this.seo.slug}-${counter}`;
      }
      
      this.seo.slug = newSlug;
    }
  }
  
  next();
});

// Virtual for getting generation parameters as object (useful for API calls)
TopicSchema.virtual('generationParams').get(function() {
  return {
    topic: this.topic,
    audience: this.audience,
    tone: this.tone,
    length: this.length,
    includeImages: this.includeImages,
    includeCallouts: this.includeCallouts,
    includeCTA: this.includeCTA,
    additionalRequirements: this.additionalRequirements,
    imageContext: this.imageContext,
    referenceImages: this.referenceImages,
    brandContext: this.brandContext,
    brandExamples: this.brandExamples
  };
});

// Instance method to mark as generating
TopicSchema.methods.markAsGenerating = function() {
  this.status = 'generating';
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to mark as completed
TopicSchema.methods.markAsCompleted = function(postId: string) {
  this.status = 'completed';
  this.generatedPostId = postId;
  this.errorMessage = undefined;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to mark as failed
TopicSchema.methods.markAsFailed = function(errorMessage: string) {
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  this.updatedAt = new Date();
  
  // If we haven't exceeded max retries, set status to pending with retry time
  if (this.retryCount < 3) {
    this.status = 'pending';
    // Exponential backoff: 5 min, 10 min, 20 min
    const retryDelayMinutes = Math.pow(2, this.retryCount - 1) * 5;
    this.retryAfter = new Date(Date.now() + retryDelayMinutes * 60 * 1000);
    console.log(`Topic ${this._id} will retry in ${retryDelayMinutes} minutes`);
  } else {
    // Max retries exceeded
    this.status = 'failed';
    this.failureReason = 'Maximum retry attempts exceeded';
  }
  
  return this.save();
};

// Static method to get queue statistics
TopicSchema.statics.getQueueStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get next pending topic by priority
TopicSchema.statics.getNextPending = function() {
  return this.findOne({ 
    status: 'pending',
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } }
    ]
  })
  .sort({ 
    priority: -1, // high=3, medium=2, low=1 (descending)
    createdAt: 1 // oldest first
  });
};

const Topic = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;