import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import Routine, { calculateNextRun } from '@/models/Routine';
import RoutineExecution from '@/models/RoutineExecution';

export const maxDuration = 60;

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

    // Also check for stuck "generating" topics (older than 20 minutes)
    // Workflow pipelines can legitimately take longer since each stage gets its own 300s
    const stuckTimeout = new Date(Date.now() - 20 * 60 * 1000);
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

    // ── ROUTINES ──────────────────────────────────────────
    console.log(`[Cron] ── Checking routines ──`);
    const dueRoutines = await Routine.find({
      enabled: true,
      nextRunAt: { $lte: now },
    }).limit(5);

    console.log(`[Cron] Found ${dueRoutines.length} due routines`);
    if (dueRoutines.length === 0) {
      // Log next scheduled routines for debugging
      const nextRoutines = await Routine.find({ enabled: true, nextRunAt: { $exists: true } })
        .sort({ nextRunAt: 1 })
        .limit(3)
        .lean() as any[];
      if (nextRoutines.length > 0) {
        console.log(`[Cron] Next scheduled routines:`);
        for (const r of nextRoutines) {
          const diff = r.nextRunAt ? Math.round((new Date(r.nextRunAt).getTime() - now.getTime()) / 60000) : '?';
          console.log(`[Cron]   "${r.name}" → ${r.nextRunAt?.toISOString()} (in ${diff} min)`);
        }
      }
    }

    const routineResults: Array<{ id: string; name: string }> = [];

    for (const routine of dueRoutines) {
      const rtag = `[Cron:Routine:${routine._id.toString().slice(-6)}]`;
      try {
        console.log(`${rtag} Processing: "${routine.name}"`);
        console.log(`${rtag}   Schedule: ${routine.schedule.frequency} at ${routine.schedule.hour}:${String(routine.schedule.minute).padStart(2, '0')} UTC`);
        console.log(`${rtag}   Was due at: ${routine.nextRunAt?.toISOString()}`);

        // Immediately update nextRunAt to prevent double-fire
        const oldNextRun = routine.nextRunAt;
        // For 'once' routines, set to null so they can't fire again from cron
        // (the workflow will disable them after completion)
        routine.nextRunAt = routine.schedule.frequency === 'once'
          ? null
          : calculateNextRun(routine.schedule);
        await routine.save();
        console.log(`${rtag}   nextRunAt updated: ${oldNextRun?.toISOString()} → ${routine.nextRunAt?.toISOString() || 'null'}`);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const triggerUrl = `${baseUrl}/api/blog/routines/${routine._id}/execute`;
        console.log(`${rtag}   Triggering: ${triggerUrl}`);

        try {
          const triggerStart = Date.now();
          const res = await fetch(triggerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const triggerElapsed = Date.now() - triggerStart;

          if (!res.ok) {
            const errBody = await res.text().catch(() => 'no body');
            console.error(`${rtag}   TRIGGER FAILED: HTTP ${res.status} (${triggerElapsed}ms)`);
            console.error(`${rtag}   Response: ${errBody.slice(0, 300)}`);
          } else {
            const result = await res.json();
            console.log(`${rtag}   TRIGGER OK (${triggerElapsed}ms)`);
            console.log(`${rtag}   executionId: ${result.executionId}`);
            console.log(`${rtag}   workflowRunId: ${result.workflowRunId}`);
          }
        } catch (error: any) {
          console.error(`${rtag}   TRIGGER NETWORK ERROR: ${error.message}`);
          if (error.cause) console.error(`${rtag}   Cause: ${error.cause}`);
        }

        routineResults.push({ id: routine._id.toString(), name: routine.name });
      } catch (error: any) {
        console.error(`${rtag}   PROCESSING ERROR: ${error.message}`);
        if (error.stack) console.error(`${rtag}   Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
      }
    }

    if (dueRoutines.length > 0) {
      console.log(`[Cron] ── Routines summary: ${routineResults.length}/${dueRoutines.length} triggered ──`);
    }

    // ── STUCK EXECUTION CLEANUP ──────────────────────────
    const stuckExecutionTimeout = new Date(Date.now() - 15 * 60 * 1000);
    const stuckExecutions = await RoutineExecution.find({
      status: 'running',
      startedAt: { $lt: stuckExecutionTimeout },
    });

    if (stuckExecutions.length > 0) {
      console.warn(`[Cron] ── Stuck execution cleanup: ${stuckExecutions.length} found ──`);
      for (const exec of stuckExecutions) {
        const stuckFor = Math.round((Date.now() - new Date(exec.startedAt).getTime()) / 60000);
        console.warn(`[Cron]   Execution ${exec._id} stuck for ${stuckFor}min (routine: ${exec.routine})`);
        exec.status = 'failed';
        exec.phase = 'failed';
        exec.completedAt = new Date();
        exec.error = 'Execution timed out (stuck for over 15 minutes)';
        exec.liveLog.push({
          timestamp: new Date(),
          type: 'error',
          message: `Execution timed out after ${stuckFor} minutes — marked as failed by system cleanup`,
        });
        await exec.save();
        console.warn(`[Cron]   → Marked as failed`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      stuckTopicsReset: stuckTopics.length,
      routinesTriggered: routineResults.length,
      routines: routineResults,
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