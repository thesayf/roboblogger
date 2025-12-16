import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

export const maxDuration = 60; // 60 seconds for the cron job

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In production, you should set CRON_SECRET in Vercel
      // For now, we'll allow requests in development
      if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'CRON_AUTH_FAILED: Invalid or missing CRON_SECRET bearer token' }, { status: 401 });
      }
    }

    await dbConnect();

    // Find topics that are due to be generated
    const now = new Date();
    console.log(`[Cron] Current time: ${now.toISOString()} (${now.toLocaleString()})`);
    
    const dueTopics = await Topic.find({
      scheduledAt: { $lte: now },
      status: 'pending',
      $or: [
        { retryAfter: { $exists: false } },
        { retryAfter: { $lte: now } }
      ]
    }).limit(10); // Process up to 10 topics per cron run

    console.log(`[Cron] Found ${dueTopics.length} topics due for generation`);
    
    // Log topic times for debugging
    if (dueTopics.length === 0) {
      const nextTopics = await Topic.find({
        status: 'pending',
        scheduledAt: { $exists: true }
      }).sort({ scheduledAt: 1 }).limit(3);
      
      console.log('[Cron] No due topics. Next scheduled topics:');
      nextTopics.forEach(t => {
        console.log(`  - ${t.topic}: scheduled for ${t.scheduledAt.toISOString()} (${t.scheduledAt > now ? 'future' : 'past'})`);
      });
    }

    const results: {
      processed: number;
      triggered: Array<{ id: string; topic: string }>;
      errors: Array<{ id: string; topic: string; error: string }>;
    } = {
      processed: 0,
      triggered: [],
      errors: []
    };

    // Trigger generation for each topic
    for (const topic of dueTopics) {
      try {
        // Mark topic as generating to prevent duplicate processing
        topic.status = 'generating';
        topic.processingStartedAt = new Date();
        await topic.save();

        // Trigger the generation endpoint
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000');
        
        const generateUrl = `${baseUrl}/api/blog/topics/${topic._id}/generate`;
        
        // Fire and forget - don't wait for completion
        fetch(generateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => {
          if (!response.ok) {
            console.error(`[Cron] Generation request failed for topic ${topic._id}: ${response.status} ${response.statusText}`);
          } else {
            console.log(`[Cron] Generation request sent successfully for topic ${topic._id}`);
          }
        })
        .catch(error => {
          console.error(`[Cron] Failed to trigger generation for topic ${topic._id}:`, error);
        });

        results.processed++;
        results.triggered.push({
          id: topic._id.toString(),
          topic: topic.topic
        });

        console.log(`[Cron] Triggered generation for topic: ${topic.topic}`);

      } catch (error) {
        console.error(`[Cron] Error processing topic ${topic._id}:`, error);
        
        // Reset topic status on error
        topic.status = 'pending';
        await topic.save();
        
        results.errors.push({
          id: topic._id.toString(),
          topic: topic.topic,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Also check for stuck "generating" topics (older than 10 minutes)
    const stuckTimeout = new Date(Date.now() - 10 * 60 * 1000);
    const stuckTopics = await Topic.find({
      status: 'generating',
      processingStartedAt: { $lt: stuckTimeout }
    });

    if (stuckTopics.length > 0) {
      console.log(`[Cron] Found ${stuckTopics.length} stuck topics, resetting them`);
      
      for (const topic of stuckTopics) {
        topic.status = 'pending';
        topic.retryCount = (topic.retryCount || 0) + 1;
        
        if (topic.retryCount >= 3) {
          topic.status = 'failed';
          topic.failureReason = 'Generation timeout - stuck in generating state';
        }
        
        await topic.save();
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      stuckTopicsReset: stuckTopics.length
    });

  } catch (error) {
    console.error('[Cron] Fatal error in process-scheduled-topics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}