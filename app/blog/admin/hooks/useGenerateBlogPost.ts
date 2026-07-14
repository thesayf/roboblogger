"use client";

import { useState, useCallback } from 'react';

export type GenerationPhase =
  | 'idle'
  | 'researching'
  | 'writing_content'
  | 'generating_images'
  | 'saving'
  | 'completed'
  | 'failed';

interface GenerationState {
  phase: GenerationPhase;
  progress: number; // 0-100
  error?: string;
}

interface TopicData {
  _id: string;
  topic: string;
  audience?: string;
  tone?: string;
  length?: string;
  includeImages: boolean;
  includeCallouts: boolean;
  includeCTA: boolean;
  additionalRequirements?: string;
  imageContext?: string;
  referenceImages?: string[];
  brandContext?: string;
  brandExamples?: string;
  owner: string;
  seo?: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    openGraph?: {
      title?: string;
      description?: string;
      image?: string;
      type?: string;
    };
    schemaType?: string;
  };
}

interface GenerateResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export function useGenerateBlogPost() {
  const [state, setState] = useState<GenerationState>({ phase: 'idle', progress: 0 });
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null);

  const generate = useCallback(async (topic: TopicData): Promise<GenerateResult> => {
    setGeneratingTopicId(topic._id);
    setState({ phase: 'researching', progress: 5 });

    try {
      // Mark topic as generating
      await fetch(`/api/blog/topics/${topic._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'generating', generationPhase: 'researching' })
      });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 1: RESEARCH PHASE (~25% of progress)
      // ═══════════════════════════════════════════════════════════════════════
      console.log('[ClientOrchestrator] Starting research phase...');

      let researchData = null;
      try {
        const researchResponse = await fetch('/api/blog/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.topic,
            audience: topic.audience || 'general audience',
            seoKeywords: topic.seo?.primaryKeyword
              ? [topic.seo.primaryKeyword, ...(topic.seo.secondaryKeywords || [])]
              : []
          })
        });

        if (researchResponse.ok) {
          const result = await researchResponse.json();
          researchData = result.research;
          console.log('[ClientOrchestrator] Research completed successfully');

          // Save research to topic
          await fetch(`/api/blog/topics/${topic._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ researchData, researchedAt: new Date().toISOString() })
          });
        } else {
          console.warn('[ClientOrchestrator] Research failed, continuing without');
        }
      } catch (e) {
        console.warn('[ClientOrchestrator] Research error, continuing without:', e);
      }

      setState({ phase: 'researching', progress: 25 });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 2: CONTENT GENERATION PHASE (~50% of progress)
      // ═══════════════════════════════════════════════════════════════════════
      console.log('[ClientOrchestrator] Starting content generation...');
      setState({ phase: 'writing_content', progress: 30 });

      await fetch(`/api/blog/topics/${topic._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationPhase: 'writing_content' })
      });

      const contentResponse = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.topic,
          audience: topic.audience || '',
          tone: topic.tone || 'Professional but approachable',
          length: topic.length || 'Medium (800-1200 words)',
          includeImages: topic.includeImages ?? true,
          includeCallouts: topic.includeCallouts ?? true,
          includeCTA: topic.includeCTA ?? true,
          additionalRequirements: topic.additionalRequirements || '',
          imageContext: topic.imageContext || '',
          referenceImages: topic.referenceImages || [],
          brandContext: topic.brandContext || '',
          brandExamples: topic.brandExamples || '',
          seo: topic.seo || null,
          researchData,
          returnOnly: true // Don't save, just return content
        })
      });

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        throw new Error(`Content generation failed: ${errorText.substring(0, 200)}`);
      }

      const contentResult = await contentResponse.json();

      // Handle both old format (direct blogPost) and new format (success/data)
      const generatedBlog = contentResult.data || contentResult;

      if (!generatedBlog.blogPost) {
        throw new Error('No blog post data in response');
      }

      console.log('[ClientOrchestrator] Content generation completed');
      setState({ phase: 'writing_content', progress: 50 });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 3: IMAGE GENERATION PHASE (~75% of progress)
      // ═══════════════════════════════════════════════════════════════════════
      let finalBlogData = generatedBlog;

      if (generatedBlog._imageGenerationData?.requiresImageGeneration) {
        console.log('[ClientOrchestrator] Starting image generation...');
        setState({ phase: 'generating_images', progress: 55 });

        await fetch(`/api/blog/topics/${topic._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationPhase: 'generating_images' })
        });

        const imageResponse = await fetch('/api/blog/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generatedBlog.blogPost.title,
            topic: topic.topic,
            imageContext: generatedBlog._imageGenerationData.imageContext,
            referenceImages: generatedBlog._imageGenerationData.referenceImages,
            components: generatedBlog.components || [],
            generateFeaturedImage: true,
            returnOnly: true
          })
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          console.log(`[ClientOrchestrator] Generated ${imageResult.totalImages} images`);

          // Update blog data with generated images
          if (imageResult.featuredImage) {
            finalBlogData.blogPost.featuredImage = imageResult.featuredImage;
            finalBlogData.blogPost.featuredImageThumbnail = imageResult.featuredImageThumbnail;
          }

          if (imageResult.components) {
            finalBlogData.components = imageResult.components;
          }
        } else {
          console.warn('[ClientOrchestrator] Image generation failed, continuing without images');
        }
      } else {
        console.log('[ClientOrchestrator] No image generation needed');
      }

      setState({ phase: 'generating_images', progress: 75 });

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 4: SAVE PHASE (~100% of progress)
      // ═══════════════════════════════════════════════════════════════════════
      console.log('[ClientOrchestrator] Saving blog post...');
      setState({ phase: 'saving', progress: 80 });

      await fetch(`/api/blog/topics/${topic._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationPhase: 'saving' })
      });

      // Generate slug from title if not provided
      const slug = topic.seo?.slug || (finalBlogData.blogPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now()}`);

      const saveResponse = await fetch('/api/blog/posts?systemCall=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalBlogData.blogPost,
          slug,
          seoTitle: topic.seo?.metaTitle || finalBlogData.blogPost.seoTitle,
          seoDescription: topic.seo?.metaDescription || finalBlogData.blogPost.seoDescription,
          components: finalBlogData.components,
          status: 'published',
          publishedAt: new Date().toISOString(),
          createdBy: 'client-orchestrator',
          source: 'queue-generation',
          sourceTopicId: topic._id,
          canonicalUrl: topic.seo?.canonicalUrl || null,
          openGraph: topic.seo?.openGraph || null,
          schemaType: topic.seo?.schemaType || 'BlogPosting',
          owner: topic.owner,
          researchData
        })
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        throw new Error(`Failed to save blog post: ${errorText.substring(0, 200)}`);
      }

      const savedPost = await saveResponse.json();
      console.log(`[ClientOrchestrator] Blog post saved: ${savedPost._id}`);

      // Mark topic as completed using the complete endpoint
      const completeResponse = await fetch(`/api/blog/topics/${topic._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedPostId: savedPost._id
        })
      });

      if (!completeResponse.ok) {
        console.warn('[ClientOrchestrator] Failed to mark topic as complete, but post was saved');
      }

      setState({ phase: 'completed', progress: 100 });
      setGeneratingTopicId(null);

      console.log('[ClientOrchestrator] Generation complete!');
      return { success: true, postId: savedPost._id };

    } catch (error) {
      console.error('[ClientOrchestrator] Generation error:', error);

      // Mark topic as failed
      try {
        await fetch(`/api/blog/topics/${topic._id}/fail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
        });
      } catch (e) {
        console.error('[ClientOrchestrator] Failed to mark topic as failed:', e);
      }

      setState({
        phase: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setGeneratingTopicId(null);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ phase: 'idle', progress: 0 });
    setGeneratingTopicId(null);
  }, []);

  return {
    state,
    generatingTopicId,
    generate,
    reset,
    isGenerating: state.phase !== 'idle' && state.phase !== 'completed' && state.phase !== 'failed'
  };
}
