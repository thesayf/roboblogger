import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import { blogApi } from '@/lib/blogApi';

export const maxDuration = 300;

// POST /api/blog/topics/[id]/generate - Generate blog post from topic
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // This is an internal tool - no user auth needed
    const userId = 'system';

    // Find the topic
    const topic = await Topic.findById(params.id);

    if (!topic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic has already been completed (but allow generating status since Agenda.js handles this)
    if (topic.status === 'completed' && topic.generatedPostId) {
      return NextResponse.json(
        { message: 'Topic has already been generated. Blog post ID: ' + topic.generatedPostId },
        { status: 400 }
      );
    }

    // Only mark as generating if not already generating (Agenda.js may have already set this)
    if (topic.status !== 'generating') {
      await topic.markAsGenerating();
    }

    // Create abort controller for the pipeline - actually cancels in-flight requests on timeout
    // (unlike Promise.race which lets background work continue and create orphan posts)
    const pipelineAbort = new AbortController();
    const pipelineTimeoutHandle = setTimeout(() => {
      pipelineAbort.abort();
    }, 280000); // 280s, leaving margin before Vercel's 300s maxDuration

    try {
      const generateProcess = async () => {
        // Update phase to initializing
      await Topic.findByIdAndUpdate(topic._id, { generationPhase: 'initializing' });
      
      // Determine base URL for internal API calls
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                     'http://localhost:3000');

      // ════════════════════════════════════════════════════════════════════════════════
      // BLOG GENERATION PIPELINE STARTED
      // ════════════════════════════════════════════════════════════════════════════════
      console.log('\n');
      console.log('═'.repeat(80));
      console.log('║ 🚀 BLOG GENERATION PIPELINE STARTED');
      console.log('═'.repeat(80));
      console.log(`│ Topic ID: ${topic._id}`);
      console.log(`│ Topic: "${topic.topic}"`);
      console.log(`│ Audience: ${topic.audience || 'General'}`);
      console.log(`│ Tone: ${topic.tone || 'Professional but approachable'}`);
      console.log(`│ Length: ${topic.length || 'Medium'}`);
      console.log(`│ SEO Keyword: ${topic.seo?.primaryKeyword || 'None'}`);
      console.log(`│ Base URL: ${baseUrl}`);
      console.log('─'.repeat(80));

      // ════════════════════════════════════════════════════════════════════════════════
      // STEP 1: AGENTIC RESEARCH PHASE
      // ════════════════════════════════════════════════════════════════════════════════
      console.log('\n┌' + '─'.repeat(78) + '┐');
      console.log('│ STEP 1: AGENTIC RESEARCH PHASE'.padEnd(78) + ' │');
      console.log('└' + '─'.repeat(78) + '┘');

      // Update phase to researching
      await Topic.findByIdAndUpdate(topic._id, { generationPhase: 'researching' });

      let researchData = null;
      const researchStartTime = Date.now();

      // Check if Perplexity API key is available for research
      if (process.env.PERPLEXITY_API_KEY) {
        console.log(`\n   📡 Calling research API...`);
        console.log(`   Topic: "${topic.topic}"`);

        // Research gets a 60s abort - prevents it from eating the whole time budget
        const researchAbort = new AbortController();
        const researchTimeoutHandle = setTimeout(() => researchAbort.abort(), 60000);
        pipelineAbort.signal.addEventListener('abort', () => researchAbort.abort());

        try {
          // Prepare SEO keywords for research
          const seoKeywords: string[] = [];
          if (topic.seo?.primaryKeyword) {
            seoKeywords.push(topic.seo.primaryKeyword);
            console.log(`   SEO Keywords: ${seoKeywords.join(', ')}`);
          }
          if (topic.seo?.secondaryKeywords?.length) {
            seoKeywords.push(...topic.seo.secondaryKeywords);
          }

          const researchResponse = await fetch(`${baseUrl}/api/blog/research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: topic.topic,
              audience: topic.audience || '',
              seoKeywords
            }),
            signal: researchAbort.signal
          });
          clearTimeout(researchTimeoutHandle);

          const researchDuration = ((Date.now() - researchStartTime) / 1000).toFixed(1);

          if (researchResponse.ok) {
            const researchResult = await researchResponse.json();
            if (researchResult.success && researchResult.research) {
              researchData = researchResult.research;

              console.log(`\n   ✅ RESEARCH PHASE COMPLETED (${researchDuration}s)`);
              console.log(`   ┌${'─'.repeat(50)}┐`);
              console.log(`   │ Statistics:    ${String(researchData.statistics?.length || 0).padStart(3)} found`.padEnd(51) + '│');
              console.log(`   │ Expert Quotes: ${String(researchData.expertQuotes?.length || 0).padStart(3)} found`.padEnd(51) + '│');
              console.log(`   │ Trends:        ${String(researchData.trends?.length || 0).padStart(3)} found`.padEnd(51) + '│');
              console.log(`   │ Key Points:    ${String(researchData.keyPoints?.length || 0).padStart(3)} found`.padEnd(51) + '│');
              console.log(`   │ Confidence:    ${(researchData.confidenceLevel || 'unknown').toUpperCase().padEnd(10)}`.padEnd(51) + '│');
              console.log(`   │ Turns:         ${String(researchResult.metadata?.turns || '?').padStart(3)}`.padEnd(51) + '│');
              console.log(`   │ Tool Calls:    ${String(researchResult.metadata?.toolCalls || '?').padStart(3)}`.padEnd(51) + '│');
              console.log(`   └${'─'.repeat(50)}┘`);

              // Save research data to topic
              await Topic.findByIdAndUpdate(topic._id, {
                researchData,
                researchedAt: new Date()
              });
              console.log(`   💾 Research data saved to topic`);
            } else {
              console.log(`\n   ⚠️  Research returned but incomplete (${researchDuration}s)`);
              console.log(`   Continuing without research data...`);
            }
          } else {
            const errorText = await researchResponse.text();
            console.log(`\n   ⚠️  Research API returned ${researchResponse.status} (${researchDuration}s)`);
            console.log(`   Error: ${errorText.substring(0, 200)}`);
            console.log(`   Continuing generation without research data...`);
          }
        } catch (researchError) {
          clearTimeout(researchTimeoutHandle);
          const researchDuration = ((Date.now() - researchStartTime) / 1000).toFixed(1);
          const isAbort = researchError instanceof Error && researchError.name === 'AbortError';
          console.log(`\n   ${isAbort ? '⏰' : '❌'} Research ${isAbort ? 'timed out' : 'failed'} after ${researchDuration}s`);
          console.log(`   Error: ${researchError instanceof Error ? researchError.message : 'Unknown error'}`);
          console.log(`   Continuing generation without research data...`);
        }
      } else {
        console.log(`\n   ⚠️  PERPLEXITY_API_KEY not configured`);
        console.log(`   Skipping research phase - blog will be generated without real-time data`);
      }

      // Check if pipeline was aborted during research
      if (pipelineAbort.signal.aborted) {
        throw new Error('Generation timeout - pipeline exceeded time limit');
      }

      // ============================================
      // STEP 2: CONTENT GENERATION PHASE
      // ============================================
      // Prepare generation parameters from topic
      const generationParams = {
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
        researchData, // Include research data for content generation
        returnOnly: true // New flag to get content without saving
      };

      console.log(`[Generate] Starting content generation for topic ${topic._id}: ${topic.topic}`);
      console.log(`[Generate] Generation params:`, JSON.stringify(generationParams, null, 2));

      // Call the existing blog generation API route
      const generateRequest = new Request(`${baseUrl}/api/blog/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationParams)
      });

      console.log(`[Generate] Calling blog generation API for topic ${topic._id}`);
      console.log(`[Generate] Generation URL: ${generateRequest.url}`);
      
      // Update phase to writing_content
      await Topic.findByIdAndUpdate(topic._id, { generationPhase: 'writing_content' });
      
      const generateStartTime = Date.now();
      const generateResponse = await fetch(generateRequest.url, {
        method: generateRequest.method,
        headers: Object.fromEntries(generateRequest.headers.entries()),
        body: generateRequest.body,
        redirect: 'follow',
        signal: pipelineAbort.signal,
        duplex: 'half'
      } as any);
      const generateDuration = Date.now() - generateStartTime;
      
      console.log(`[Generate] Blog generation API response received after ${generateDuration}ms`);
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error(`[Generate] Blog generation API failed for topic ${topic._id}: ${generateResponse.status} - ${errorText}`);
        throw new Error(`Blog generation API failed (${generateResponse.status}): ${errorText.substring(0, 200)}`);
      }
      
      console.log(`[Generate] Blog generation API succeeded for topic ${topic._id}`);

      const generatedResponse = await generateResponse.json();
      
      // Check if we got the new response format
      if (!generatedResponse.success || !generatedResponse.data) {
        throw new Error('Unexpected response format from blog generation API');
      }
      
      const generatedBlog = generatedResponse.data;
      
      console.log(`[Generate] Content generation complete, preparing for image generation`);

      // Now generate images if needed (synchronous call)
      let finalBlogData = generatedBlog;
      
      if (generatedBlog._imageGenerationData?.requiresImageGeneration) {
        console.log(`[Generate] ✓ Image generation required for blog post`);
        console.log(`[Generate] Image components found: ${generatedBlog.components?.filter((c: any) => c.type === 'image' || c.needsImageGeneration).length || 0}`);
        
        // Update phase to generating_images
        await Topic.findByIdAndUpdate(topic._id, { generationPhase: 'generating_images' });
        
        // Prepare image generation request
        const imageGenRequest = {
          title: generatedBlog.blogPost.title,
          topic: topic.topic,
          imageContext: generatedBlog._imageGenerationData.imageContext,
          referenceImages: generatedBlog._imageGenerationData.referenceImages,
          components: generatedBlog.components || [],
          generateFeaturedImage: true,
          returnOnly: true // Get images without saving
        };
        
        console.log(`[Generate] Calling image generation API: ${baseUrl}/api/blog/generate-images`);
        
        const imageGenStartTime = Date.now();
        const imageGenResponse = await fetch(`${baseUrl}/api/blog/generate-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageGenRequest),
          signal: pipelineAbort.signal
        });
        
        const imageGenDuration = Date.now() - imageGenStartTime;
        console.log(`[Generate] Image generation API response received after ${imageGenDuration}ms`);
        
        if (!imageGenResponse.ok) {
          const errorText = await imageGenResponse.text();
          console.error(`[Generate] Image generation failed: ${imageGenResponse.status} - ${errorText}`);
          // Continue without images rather than failing completely
        } else {
          const imageResult = await imageGenResponse.json();
          console.log(`[Generate] ✓ Image generation succeeded, generated ${imageResult.totalImages} images`);
          
          // Update blog data with generated images
          if (imageResult.featuredImage) {
            finalBlogData.blogPost.featuredImage = imageResult.featuredImage;
            finalBlogData.blogPost.featuredImageThumbnail = imageResult.featuredImageThumbnail;
          }
          
          if (imageResult.components) {
            finalBlogData.components = imageResult.components;
          }
        }
      } else {
        console.log(`[Generate] ✗ No image generation needed`);
      }
      
      // Now save the complete blog post with all images
      console.log(`[Generate] Creating blog post with all content and images`);
      
      // Update phase to saving
      await Topic.findByIdAndUpdate(topic._id, { generationPhase: 'saving' });
      
      const createPostResponse = await fetch(`${baseUrl}/api/blog/posts?systemCall=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: pipelineAbort.signal,
        body: JSON.stringify({
          ...finalBlogData.blogPost,
          slug: topic.seo?.slug || (finalBlogData.blogPost.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + `-${Date.now()}`),
          seoTitle: topic.seo?.metaTitle || finalBlogData.blogPost.seoTitle,
          seoDescription: topic.seo?.metaDescription || finalBlogData.blogPost.seoDescription,
          components: finalBlogData.components,
          status: 'published',
          publishedAt: new Date(),
          createdBy: userId || 'system',
          source: 'queue-generation',
          canonicalUrl: topic.seo?.canonicalUrl || null,
          openGraph: topic.seo?.openGraph || null,
          schemaType: topic.seo?.schemaType || 'BlogPosting',
          owner: topic.owner // Pass the topic owner for system calls
        })
      });

      if (!createPostResponse.ok) {
        const errorText = await createPostResponse.text();
        console.error(`[Generate] Blog post creation failed for topic ${topic._id}: ${createPostResponse.status} - ${errorText}`);
        throw new Error(`Blog post creation failed: ${createPostResponse.status} - ${errorText}`);
      }
      
      console.log(`[Generate] Blog post created successfully for topic ${topic._id}`);

      const savedBlogPost = await createPostResponse.json();

      // Mark topic as completed with the generated post ID
      await topic.markAsCompleted(savedBlogPost._id.toString());

      console.log(`[Generate] Successfully completed entire generation process for topic ${topic._id}`);
      console.log(`[Generate] Blog post ID: ${savedBlogPost._id}, Title: ${savedBlogPost.title}`);

      return {
        message: 'Blog post generated successfully',
        topic: {
          id: topic._id,
          status: 'completed',
          generatedPostId: savedBlogPost._id
        },
        blogPost: savedBlogPost,
        generationData: generatedBlog,
        imageGenerationTriggered: generatedBlog._imageGenerationData?.requiresImageGeneration || false
      };
      }; // End of generateProcess function

      const result = await generateProcess();
      clearTimeout(pipelineTimeoutHandle);

      return NextResponse.json(result, { status: 201 });

    } catch (generationError) {
      clearTimeout(pipelineTimeoutHandle);

      console.error('[Generate] Blog generation failed for topic:', topic._id);
      console.error('[Generate] Error details:', generationError);
      console.error('[Generate] Error stack:', generationError instanceof Error ? generationError.stack : 'No stack trace');

      const errorMessage = generationError instanceof Error ? generationError.message : String(generationError);
      const isAbortError = generationError instanceof Error && generationError.name === 'AbortError';
      const displayError = isAbortError ? 'Generation timeout - pipeline exceeded time limit' : errorMessage;

      // Before marking as failed, re-check topic status in case a post was already created
      // (handles edge case where post creation completed server-side but our fetch was aborted)
      try {
        const freshTopic = await Topic.findById(topic._id);
        if (freshTopic?.status === 'completed' && freshTopic?.generatedPostId) {
          console.log(`[Generate] Topic ${topic._id} already completed (post ${freshTopic.generatedPostId}), skipping markAsFailed`);
          return NextResponse.json({
            message: 'Blog post was already generated',
            topic: {
              id: topic._id,
              status: 'completed',
              generatedPostId: freshTopic.generatedPostId
            }
          });
        }
      } catch (checkError) {
        console.warn('[Generate] Failed to check topic status before marking as failed:', checkError);
      }

      await topic.markAsFailed(displayError);

      return NextResponse.json({
        message: 'Blog generation failed',
        error: displayError,
        topic: {
          id: topic._id,
          status: 'failed',
          errorMessage: displayError,
          retryCount: topic.retryCount
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in topic generation:', error);
    return NextResponse.json(
      { message: 'Failed to generate from topic', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/blog/topics/[id]/generate - Get generation status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const topic = await Topic.findById(params.id);

    if (!topic) {
      return NextResponse.json(
        { message: 'Topic not found' },
        { status: 404 }
      );
    }

    // If completed, also fetch the generated blog post details
    let blogPost = null;
    if (topic.status === 'completed' && topic.generatedPostId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000');
        const getPostResponse = await fetch(`${baseUrl}/api/blog/posts/${topic.generatedPostId}`);
        if (getPostResponse.ok) {
          blogPost = await getPostResponse.json();
        }
      } catch (error) {
        console.warn('Could not fetch generated blog post:', error);
      }
    }

    return NextResponse.json({
      topic: {
        id: topic._id,
        status: topic.status,
        errorMessage: topic.errorMessage,
        retryCount: topic.retryCount,
        generatedPostId: topic.generatedPostId,
        updatedAt: topic.updatedAt
      },
      blogPost
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch generation status', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}