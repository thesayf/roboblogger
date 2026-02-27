/**
 * Upstash Workflow Orchestrator for Blog Generation
 *
 * Durable, multi-stage pipeline: research → content → images → save
 * Each stage runs as its own serverless invocation via context.call(),
 * so no stage competes with another for time.
 */

import { serve } from '@upstash/workflow/nextjs';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

const MAX_RESEARCH_TURNS = 15;

function getBaseUrl(): string {
  return (
    process.env.UPSTASH_WORKFLOW_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export const { POST } = serve<{ topicId: string }>(
  async (context) => {
    const { topicId } = context.requestPayload;
    const baseUrl = getBaseUrl();

    // Step 1: Load and validate topic
    const topic = await context.run('load-topic', async () => {
      await dbConnect();
      const t = await Topic.findById(topicId);
      if (!t) throw new Error(`Topic ${topicId} not found`);
      if (t.status === 'completed' && t.generatedPostId) {
        throw new Error(`Topic ${topicId} already completed (post ${t.generatedPostId})`);
      }
      // Return plain object (must be serializable)
      return {
        _id: t._id.toString(),
        topic: t.topic,
        audience: t.audience || '',
        tone: t.tone || 'Professional but approachable',
        length: t.length || 'Medium (800-1200 words)',
        includeImages: t.includeImages ?? true,
        includeCallouts: t.includeCallouts ?? true,
        includeCTA: t.includeCTA ?? true,
        additionalRequirements: t.additionalRequirements || '',
        imageContext: t.imageContext || '',
        referenceImages: t.referenceImages || [],
        brandContext: t.brandContext || '',
        brandExamples: t.brandExamples || '',
        seo: t.seo ? JSON.parse(JSON.stringify(t.seo)) : null,
        researchData: t.researchData ? JSON.parse(JSON.stringify(t.researchData)) : null,
        owner: t.owner.toString(),
      };
    });

    // Step 2: Mark as generating
    await context.run('mark-generating', async () => {
      await dbConnect();
      await Topic.findByIdAndUpdate(topicId, {
        status: 'generating',
        generationPhase: 'initializing',
        processingStartedAt: new Date(),
        // Clear any stale research state from a previous failed run
        $unset: { researchState: 1 },
      });
    });

    // Step 3: Research loop (up to MAX_RESEARCH_TURNS turns)
    let researchData = topic.researchData;
    const hasPerplexityKey = await context.run('check-perplexity-key', async () => {
      return !!process.env.PERPLEXITY_API_KEY;
    });

    if (hasPerplexityKey && !researchData) {
      await context.run('update-phase-research', async () => {
        await dbConnect();
        await Topic.findByIdAndUpdate(topicId, { generationPhase: 'researching' });
      });

      let researchDone = false;
      let iteration = 0;

      while (!researchDone && iteration < MAX_RESEARCH_TURNS) {
        const turnResult = await context.call<{
          done: boolean;
          iteration: number;
          error?: string;
        }>(`research-turn-${iteration}`, {
          url: `${baseUrl}/api/blog/research-turn`,
          method: 'POST',
          body: JSON.stringify({ topicId }),
          headers: { 'Content-Type': 'application/json' },
          retries: 1,
          timeout: '300s',
        });

        if (turnResult.status !== 200) {
          console.error(`[workflow] Research turn ${iteration} failed with status ${turnResult.status}`);
          // Don't fail the whole pipeline — continue without research
          break;
        }

        researchDone = turnResult.body.done;
        iteration = turnResult.body.iteration;
      }

      // Reload research data from the topic (research-turn saved it)
      researchData = await context.run('load-research-data', async () => {
        await dbConnect();
        const t = await Topic.findById(topicId);
        return t?.researchData ? JSON.parse(JSON.stringify(t.researchData)) : null;
      });
    }

    // Step 4: Content generation
    await context.run('update-phase-content', async () => {
      await dbConnect();
      await Topic.findByIdAndUpdate(topicId, { generationPhase: 'writing_content' });
    });

    const generateResult = await context.call<{
      success: boolean;
      data: any;
    }>('generate-content', {
      url: `${baseUrl}/api/blog/generate`,
      method: 'POST',
      body: JSON.stringify({
        topic: topic.topic,
        audience: topic.audience,
        tone: topic.tone,
        length: topic.length,
        includeImages: topic.includeImages,
        includeCallouts: topic.includeCallouts,
        includeCTA: topic.includeCTA,
        additionalRequirements: topic.additionalRequirements,
        imageContext: topic.imageContext,
        referenceImages: topic.referenceImages,
        brandContext: topic.brandContext,
        brandExamples: topic.brandExamples,
        seo: topic.seo,
        researchData,
        returnOnly: true,
      }),
      headers: { 'Content-Type': 'application/json' },
      retries: 1,
      timeout: '300s',
    });

    if (generateResult.status !== 200 || !generateResult.body?.success) {
      throw new Error(`Content generation failed (status ${generateResult.status})`);
    }

    let finalBlogData = generateResult.body.data;

    // Step 5: Image generation (if needed)
    if (finalBlogData._imageGenerationData?.requiresImageGeneration) {
      await context.run('update-phase-images', async () => {
        await dbConnect();
        await Topic.findByIdAndUpdate(topicId, { generationPhase: 'generating_images' });
      });

      // IMPORTANT: Do NOT wrap context.call() in try/catch — Upstash Workflow uses
      // internal WorkflowAbort exceptions for step tracking. Catching them breaks the
      // step sequence. Instead, check the response status after the call.
      const imageResult = await context.call<{
        featuredImage?: string;
        featuredImageThumbnail?: string;
        components?: any[];
        totalImages?: number;
      }>('generate-images', {
        url: `${baseUrl}/api/blog/generate-images`,
        method: 'POST',
        body: JSON.stringify({
          title: finalBlogData.blogPost.title,
          topic: topic.topic,
          imageContext: finalBlogData._imageGenerationData.imageContext,
          referenceImages: finalBlogData._imageGenerationData.referenceImages,
          components: finalBlogData.components || [],
          generateFeaturedImage: true,
          returnOnly: true,
        }),
        headers: { 'Content-Type': 'application/json' },
        retries: 1,
        timeout: '300s',
      });

      // Apply image results to blog data. IMPORTANT: We must return the updated
      // data from context.run() — side-effect mutations are lost on workflow replay
      // because each step causes a new invocation where previous steps return cached values.
      finalBlogData = await context.run('apply-images', async () => {
        if (imageResult.status === 200 && imageResult.body) {
          console.log(`[workflow] Image generation succeeded, ${imageResult.body.totalImages} images`);
          return {
            ...finalBlogData,
            blogPost: {
              ...finalBlogData.blogPost,
              ...(imageResult.body.featuredImage && {
                featuredImage: imageResult.body.featuredImage,
                featuredImageThumbnail: imageResult.body.featuredImageThumbnail,
              }),
            },
            components: imageResult.body.components || finalBlogData.components,
          };
        }
        console.warn(`[workflow] Image generation returned status ${imageResult.status}, continuing without images`);
        return finalBlogData;
      });
    }

    // Step 6: Save the blog post
    await context.run('update-phase-saving', async () => {
      await dbConnect();
      await Topic.findByIdAndUpdate(topicId, { generationPhase: 'saving' });
    });

    const slug = topic.seo?.slug || (
      finalBlogData.blogPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now()}`
    );

    const saveResult = await context.call<{ _id: string; title: string }>(
      'save-post',
      {
        url: `${baseUrl}/api/blog/posts?systemCall=true`,
        method: 'POST',
        body: JSON.stringify({
          ...finalBlogData.blogPost,
          slug,
          seoTitle: topic.seo?.metaTitle || finalBlogData.blogPost.seoTitle,
          seoDescription: topic.seo?.metaDescription || finalBlogData.blogPost.seoDescription,
          components: finalBlogData.components,
          status: 'published',
          publishedAt: new Date().toISOString(),
          createdBy: 'system',
          source: 'queue-generation',
          canonicalUrl: topic.seo?.canonicalUrl || null,
          openGraph: topic.seo?.openGraph || null,
          schemaType: topic.seo?.schemaType || 'BlogPosting',
          owner: topic.owner,
        }),
        headers: { 'Content-Type': 'application/json' },
        retries: 2,
        timeout: '60s',
      }
    );

    if (saveResult.status !== 200 && saveResult.status !== 201) {
      throw new Error(`Post creation failed (status ${saveResult.status})`);
    }

    const postId = saveResult.body._id;

    // Step 7: Mark topic as completed
    await context.run('mark-completed', async () => {
      await dbConnect();
      const t = await Topic.findById(topicId);
      if (t) {
        await t.markAsCompleted(postId);
      }
    });

    console.log(`[workflow] Pipeline complete for topic ${topicId}, post ${postId}`);
  },
  {
    // When QStash retries are exhausted, mark the topic as failed
    failureFunction: async ({ context, failStatus, failResponse }) => {
      console.error(`[workflow] Pipeline failed for topic. Status: ${failStatus}, Response: ${failResponse}`);
      try {
        const { topicId } = context.requestPayload;
        await dbConnect();
        const topic = await Topic.findById(topicId);
        if (topic && topic.status !== 'completed') {
          await topic.markAsFailed(`Workflow failed (status ${failStatus}): ${failResponse.substring(0, 200)}`);
        }
      } catch (err) {
        console.error('[workflow] Failed to mark topic as failed:', err);
      }
    },
  }
);
