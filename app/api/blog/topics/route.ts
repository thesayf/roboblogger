import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

export const maxDuration = 300;

// GET /api/blog/topics - Get all topics with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');

    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (source) filter.source = source;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    if (search) {
      filter.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { additionalRequirements: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get topics with pagination
    const topics = await Topic.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Topic.countDocuments(filter);

    // Get queue statistics
    const stats = await (Topic as any).getQueueStats();
    const queueStats = stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    return NextResponse.json({
      topics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: queueStats
    });

  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch topics', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/blog/topics - Create a new topic or bulk import topics
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    await dbConnect();

    const body = await request.json();
    
    // Check if this is a bulk import (has topics array)
    if (body.topics && Array.isArray(body.topics)) {
      // Bulk import
      if (body.topics.length === 0) {
        return NextResponse.json(
          { message: 'Topics array cannot be empty' },
          { status: 400 }
        );
      }

      // Validate each topic
      for (const topic of body.topics) {
        if (!topic.topic) {
          return NextResponse.json(
            { message: 'Each topic must have a topic field' },
            { status: 400 }
          );
        }
      }

      // Create topic data for bulk insert with validation
      const topicsData = body.topics.map((topic: any) => {
        const sanitizedTopic = { ...topic };
        
        // Sanitize SEO fields to prevent validation errors
        if (sanitizedTopic.seo) {
          if (sanitizedTopic.seo.metaTitle && sanitizedTopic.seo.metaTitle.length > 60) {
            sanitizedTopic.seo.metaTitle = sanitizedTopic.seo.metaTitle.substring(0, 60);
          }
          if (sanitizedTopic.seo.metaDescription && sanitizedTopic.seo.metaDescription.length > 155) {
            sanitizedTopic.seo.metaDescription = sanitizedTopic.seo.metaDescription.substring(0, 155);
          }
          if (sanitizedTopic.seo.openGraph?.title && sanitizedTopic.seo.openGraph.title.length > 100) {
            sanitizedTopic.seo.openGraph.title = sanitizedTopic.seo.openGraph.title.substring(0, 100);
          }
          if (sanitizedTopic.seo.openGraph?.description && sanitizedTopic.seo.openGraph.description.length > 200) {
            sanitizedTopic.seo.openGraph.description = sanitizedTopic.seo.openGraph.description.substring(0, 200);
          }
        }
        
        return {
          ...sanitizedTopic,
          createdBy: userId || 'anonymous',
          status: 'pending',
          retryCount: 0,
          source: topic.source || 'bulk',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Bulk insert
      const createdTopics = await Topic.insertMany(topicsData);

      // Schedule jobs for topics with scheduled dates
      for (const topic of createdTopics) {
        if (topic.scheduledAt && topic.scheduledAt > new Date()) {
          // Vercel Cron will handle scheduled generation
          // No need to schedule with Agenda anymore
          console.log(`Topic scheduled for ${topic.scheduledAt} - will be processed by Vercel Cron`);
        }
      }

      return NextResponse.json({
        message: `Successfully created ${createdTopics.length} topics`,
        topics: createdTopics,
        count: createdTopics.length
      }, { status: 201 });

    } else {
      // Single topic creation
      if (!body.topic) {
        return NextResponse.json(
          { message: 'Topic is required' },
          { status: 400 }
        );
      }

      // Create new topic with user ID and validation
      const sanitizedBody = { ...body };
      
      // Sanitize SEO fields to prevent validation errors
      if (sanitizedBody.seo) {
        if (sanitizedBody.seo.metaTitle && sanitizedBody.seo.metaTitle.length > 60) {
          sanitizedBody.seo.metaTitle = sanitizedBody.seo.metaTitle.substring(0, 60);
        }
        if (sanitizedBody.seo.metaDescription && sanitizedBody.seo.metaDescription.length > 155) {
          sanitizedBody.seo.metaDescription = sanitizedBody.seo.metaDescription.substring(0, 155);
        }
        if (sanitizedBody.seo.openGraph?.title && sanitizedBody.seo.openGraph.title.length > 100) {
          sanitizedBody.seo.openGraph.title = sanitizedBody.seo.openGraph.title.substring(0, 100);
        }
        if (sanitizedBody.seo.openGraph?.description && sanitizedBody.seo.openGraph.description.length > 200) {
          sanitizedBody.seo.openGraph.description = sanitizedBody.seo.openGraph.description.substring(0, 200);
        }
      }
      
      const topicData = {
        ...sanitizedBody,
        createdBy: userId || 'anonymous',
        status: 'pending',
        retryCount: 0,
        source: body.source || 'individual'
      };

      const topic = new Topic(topicData);
      await topic.save();

      // Schedule job if topic has a scheduled date
      if (topic.scheduledAt && topic.scheduledAt > new Date()) {
        // Vercel Cron will handle scheduled generation
        // No need to schedule with Agenda anymore
        console.log(`Topic scheduled for ${topic.scheduledAt} - will be processed by Vercel Cron`);
      }

      return NextResponse.json(topic, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { message: 'Failed to create topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/blog/topics - Update multiple topics (for bulk operations)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'Topic IDs array is required' },
        { status: 400 }
      );
    }

    // Update multiple topics
    const result = await Topic.updateMany(
      { _id: { $in: ids } },
      { 
        ...updates,
        updatedAt: new Date()
      }
    );

    return NextResponse.json({
      message: `Updated ${result.modifiedCount} topics`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating topics:', error);
    return NextResponse.json(
      { message: 'Failed to update topics', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/topics - Delete multiple topics
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(
        { message: 'Topic IDs are required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',');

    // Delete topics (only allow deleting pending or failed topics to prevent data loss)
    const result = await Topic.deleteMany({
      _id: { $in: ids },
      status: { $in: ['pending', 'failed'] }
    });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} topics`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting topics:', error);
    return NextResponse.json(
      { message: 'Failed to delete topics', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}