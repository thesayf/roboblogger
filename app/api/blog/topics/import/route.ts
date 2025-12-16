import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

// POST /api/blog/topics/import - Direct import of pre-formatted topics
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    const body = await request.json();
    const { topics } = body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { message: 'Topics array is required' },
        { status: 400 }
      );
    }

    // Limit to 50 topics per import for safety
    if (topics.length > 50) {
      return NextResponse.json(
        { message: 'Maximum 50 topics per import' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnect();

    // Process and validate each topic
    const processedTopics = topics.map((topic, index) => {
      return {
        // Required fields
        topic: topic.topic || `Untitled Topic ${index + 1}`,
        
        // Content settings with defaults
        audience: topic.audience || 'General audience',
        tone: topic.tone || 'professional',
        length: topic.length || 'Medium (800-1200 words)',
        includeImages: topic.includeImages !== false,
        includeCallouts: topic.includeCallouts !== false,
        includeCTA: topic.includeCTA !== false,
        additionalRequirements: topic.additionalRequirements || '',
        brandContext: topic.brandContext || '',
        
        // Metadata
        priority: topic.priority || 'medium',
        tags: Array.isArray(topic.tags) ? topic.tags : [],
        imageContext: topic.imageContext || '',
        referenceImages: Array.isArray(topic.referenceImages) ? topic.referenceImages : [],
        notes: topic.notes || '',
        estimatedDuration: topic.estimatedDuration || 5,
        
        // SEO settings
        seo: topic.seo ? {
          primaryKeyword: topic.seo.primaryKeyword || '',
          secondaryKeywords: Array.isArray(topic.seo.secondaryKeywords) ? topic.seo.secondaryKeywords : [],
          longTailKeywords: Array.isArray(topic.seo.longTailKeywords) ? topic.seo.longTailKeywords : [],
          lsiKeywords: Array.isArray(topic.seo.lsiKeywords) ? topic.seo.lsiKeywords : [],
          keywordDensity: topic.seo.keywordDensity || 1.5,
          searchIntent: topic.seo.searchIntent || 'informational',
          metaTitle: topic.seo.metaTitle || topic.topic.substring(0, 60),
          metaDescription: topic.seo.metaDescription || '',
          openGraph: topic.seo.openGraph || {
            title: topic.seo.metaTitle || topic.topic,
            description: topic.seo.metaDescription || '',
            type: 'article'
          },
          schemaType: topic.seo.schemaType || 'BlogPosting',
          slug: topic.seo.slug || topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          canonicalUrl: topic.seo.canonicalUrl || null
        } : null,
        
        // System fields
        status: 'pending',
        createdAt: new Date(),
        createdBy: userId || 'anonymous',
        scheduledAt: topic.scheduledAt ? new Date(topic.scheduledAt) : null
      };
    });

    // Insert all topics using Mongoose
    const createdTopics = await Topic.insertMany(processedTopics);

    return NextResponse.json({
      message: 'Topics imported successfully',
      created: createdTopics.length,
      topicIds: createdTopics.map(topic => topic._id)
    });

  } catch (error) {
    console.error('Error importing topics:', error);
    return NextResponse.json(
      { message: 'Failed to import topics', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}