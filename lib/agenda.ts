import Agenda from 'agenda';
import dbConnect from './mongo';
import Topic from '@/models/Topic';

let agenda: Agenda | null = null;

export async function getAgenda(): Promise<Agenda> {
  if (agenda) {
    return agenda;
  }

  // Connect to MongoDB first
  await dbConnect();
  
  // Initialize Agenda with MongoDB connection
  agenda = new Agenda({
    db: {
      address: process.env.MONGODB_URI!,
      collection: 'agendaJobs',
      options: {},
    },
    processEvery: '1 minute', // Check for jobs every minute
    maxConcurrency: 3, // Max 3 concurrent blog generations
    defaultConcurrency: 1, // Default 1 job at a time per job type
    defaultLockLifetime: 30 * 60 * 1000, // 30 minutes lock lifetime
  });

  // Define job handlers
  agenda.define('generate blog post', async (job: any) => {
    const { topicId } = job.attrs.data;
    
    console.log(`Starting blog generation for topic: ${topicId}`);
    
    try {
      // Update topic status to generating
      await Topic.findByIdAndUpdate(topicId, {
        status: 'generating',
        processingStartedAt: new Date(),
        lastProcessedAt: new Date()
      });

      // Generate the blog post
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/blog/topics/${topicId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Agenda-Scheduler/1.0'
        }
      });

      if (response.ok) {
        console.log(`✅ Blog generation completed for topic: ${topicId}`);
        // Topic status will be updated by the generate endpoint
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }

    } catch (error) {
      console.error(`❌ Blog generation failed for topic: ${topicId}`, error);
      
      // Update topic with failure info
      const topic = await Topic.findById(topicId);
      if (topic) {
        const retryCount = (topic.retryCount || 0) + 1;
        
        if (retryCount >= 3) {
          // Mark as permanently failed
          await Topic.findByIdAndUpdate(topicId, {
            status: 'failed',
            retryCount,
            lastFailedAt: new Date(),
            failureReason: 'Maximum retry attempts exceeded',
            errorMessage: error instanceof Error ? error.message : String(error)
          });
        } else {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, retryCount - 1) * 5 * 60 * 1000; // 5min, 10min, 20min
          const retryAt = new Date(Date.now() + retryDelay);
          
          await Topic.findByIdAndUpdate(topicId, {
            status: 'pending',
            retryCount,
            retryAfter: retryAt,
            lastFailedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error)
          });

          // Schedule retry job
          await scheduleTopicGeneration(topicId, retryAt);
        }
      }
      
      throw error; // Re-throw so Agenda marks job as failed
    }
  });

  // Graceful shutdown handling
  async function graceful() {
    console.log('Agenda: Gracefully shutting down...');
    await agenda?.stop();
    process.exit(0);
  }

  process.on('SIGTERM', graceful);
  process.on('SIGINT', graceful);

  // Start Agenda
  await agenda.start();
  console.log('📅 Agenda scheduler started');

  return agenda;
}

// Helper function to schedule a topic for generation
export async function scheduleTopicGeneration(topicId: string, scheduledAt: Date): Promise<void> {
  const agenda = await getAgenda();
  
  // Cancel any existing jobs for this topic
  await agenda.cancel({ 'data.topicId': topicId });
  
  // Schedule new job
  const job = agenda.create('generate blog post', { topicId });
  job.schedule(scheduledAt);
  job.unique({ 'data.topicId': topicId }); // Ensure only one job per topic
  
  await job.save();
  
  console.log(`📅 Scheduled blog generation for topic ${topicId} at ${scheduledAt.toISOString()}`);
}

// Helper function to cancel a scheduled topic
export async function cancelTopicGeneration(topicId: string): Promise<void> {
  const agenda = await getAgenda();
  
  const numRemoved = await agenda.cancel({ 'data.topicId': topicId });
  
  if (numRemoved && numRemoved > 0) {
    console.log(`🗑️ Cancelled ${numRemoved} scheduled job(s) for topic ${topicId}`);
  }
}

// Helper function to get job status for a topic
export async function getTopicJobStatus(topicId: string): Promise<any> {
  const agenda = await getAgenda();
  
  const jobs = await agenda.jobs({ 'data.topicId': topicId });
  
  return jobs.length > 0 ? {
    scheduled: true,
    nextRunAt: jobs[0].attrs.nextRunAt,
    lastRunAt: jobs[0].attrs.lastRunAt,
    failCount: jobs[0].attrs.failCount,
    failReason: jobs[0].attrs.failReason
  } : {
    scheduled: false
  };
}

export default agenda;