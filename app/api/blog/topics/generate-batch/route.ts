import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongo';
import Topic from '@/models/Topic';

export const maxDuration = 300; // 5 minutes max for Vercel Pro plan

// POST /api/blog/topics/generate-batch - Generate blog posts from multiple topics
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    await connectDB();

    const body = await request.json();
    const { topicIds, maxConcurrent = 3 } = body;

    // Validate input
    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json(
        { message: 'Topic IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (topicIds.length > 10) {
      return NextResponse.json(
        { message: 'Maximum 10 topics allowed per batch generation' },
        { status: 400 }
      );
    }

    // Find valid topics for generation
    const topics = await Topic.find({
      _id: { $in: topicIds },
      status: { $in: ['pending', 'failed'] } // Only process pending or failed topics
    });

    if (topics.length === 0) {
      return NextResponse.json(
        { message: 'No valid topics found for generation' },
        { status: 400 }
      );
    }

    const results = {
      total: topics.length,
      successful: 0,
      failed: 0,
      processing: 0,
      details: [] as any[]
    };

    // Process topics in batches to avoid overwhelming the system
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Function to generate a single topic
    const generateSingleTopic = async (topicId: string) => {
      try {
        const response = await fetch(`${baseUrl}/api/blog/topics/${topicId}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          results.successful++;
          results.details.push({
            topicId,
            status: 'success',
            blogPostId: result.blogPost?._id,
            message: 'Generated successfully'
          });
        } else {
          const errorResult = await response.json();
          results.failed++;
          results.details.push({
            topicId,
            status: 'failed',
            error: errorResult.message || 'Unknown error'
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          topicId,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    // Process topics in concurrent batches
    const topicChunks = [];
    for (let i = 0; i < topics.length; i += maxConcurrent) {
      topicChunks.push(topics.slice(i, i + maxConcurrent));
    }

    console.log(`Starting batch generation for ${topics.length} topics in ${topicChunks.length} chunks`);

    // Process each chunk sequentially, but topics within chunk concurrently
    for (const chunk of topicChunks) {
      results.processing = chunk.length;
      
      const chunkPromises = chunk.map(topic => 
        generateSingleTopic(topic._id.toString())
      );
      
      await Promise.all(chunkPromises);
      results.processing = 0;
    }

    const statusCode = results.successful > 0 ? 200 : 500;

    return NextResponse.json({
      message: `Batch generation completed. ${results.successful} successful, ${results.failed} failed.`,
      results
    }, { status: statusCode });

  } catch (error) {
    console.error('Error in batch topic generation:', error);
    return NextResponse.json(
      { message: 'Failed to process batch generation', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/blog/topics/generate-batch - Get batch generation status and queue info
export async function GET() {
  try {
    await connectDB();

    // Get queue statistics
    const stats = await (Topic as any).getQueueStats();
    const queueStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get next pending topics
    const nextTopics = await Topic.find({ status: 'pending' })
      .sort({ priority: -1, createdAt: 1 })
      .limit(10)
      .select('_id topic priority createdAt estimatedDuration');

    // Get currently generating topics
    const generatingTopics = await Topic.find({ status: 'generating' })
      .select('_id topic createdAt updatedAt')
      .sort({ updatedAt: 1 });

    return NextResponse.json({
      queueStats,
      nextTopics,
      generatingTopics,
      recommendations: {
        maxConcurrent: 3,
        estimatedTimePerTopic: 5, // minutes
        totalEstimatedTime: nextTopics.reduce((acc, topic) => acc + (topic.estimatedDuration || 5), 0)
      }
    });

  } catch (error) {
    console.error('Error fetching batch generation status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch batch generation status', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}