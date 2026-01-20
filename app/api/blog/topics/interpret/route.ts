import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/mongo';
import BrandSettings from '@/models/BrandSettings';
import Topic from '@/models/Topic';
import { topicResearchTools } from '@/lib/seo-research/topic-research-tools';
import { executeTopicResearchTool } from '@/lib/seo-research/tool-executors';
import {
  generateResearchPhaseSystemPrompt,
  generateResearchPhaseUserPrompt,
  generateSummarizePhasePrompt,
  generateTopicsPhasePrompt,
  TopicResearchConfig,
} from '@/lib/seo-research/topic-research-prompts';

export const maxDuration = 300;

const MAX_RESEARCH_TURNS = 8; // Reduced since we now have separate phases

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Interface for SEO research config from frontend
interface SEOResearchConfig {
  enabled: boolean;
  industryNiche?: string;
  seedKeywords?: string[];
  competitorUrls?: string[];
  searchIntents?: string[];
  contentGoals?: string[];
}

// POST /api/blog/topics/interpret - Use AI to interpret free-form input into structured JSON
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const {
      input,
      brandContext,
      brandExamples,
      inputType = 'text',
      availableImages = [],
      uploadedImages = [],
      seoResearch,
    } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { message: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    // Fetch saved brand settings if user is authenticated
    let savedBrandSettings: any = null;
    if (userId) {
      try {
        await dbConnect();
        savedBrandSettings = await BrandSettings.findOne({ userId }).lean();
      } catch (dbError) {
        console.error('Error fetching brand settings:', dbError);
      }
    }

    // Check if SEO research is enabled
    const seoConfig = seoResearch as SEOResearchConfig | undefined;
    if (seoConfig?.enabled) {
      console.log('=== SEO RESEARCH ENABLED - Starting Agentic Loop ===');
      return await handleAgenticResearch(
        input,
        seoConfig,
        savedBrandSettings,
        brandContext,
        currentUser?.mongoId?.toString() || userId || 'anonymous'
      );
    }

    // Fallback to original single-shot interpretation
    console.log('=== SEO Research disabled - Using single-shot interpretation ===');
    return await handleSingleShotInterpretation(
      input,
      brandContext,
      brandExamples,
      savedBrandSettings,
      availableImages,
      uploadedImages
    );

  } catch (error) {
    console.error('Error in topic interpretation:', error);
    return NextResponse.json(
      { message: 'Failed to interpret input', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle SEO research with three-phase approach:
 * Phase 1: Research (agentic loop with tools)
 * Phase 2: Summarize (condense findings)
 * Phase 3: Generate (create final topics)
 */
async function handleAgenticResearch(
  input: string,
  seoConfig: SEOResearchConfig,
  brandSettings: any,
  perRequestBrandContext: string | undefined,
  userId: string
): Promise<NextResponse> {
  // Parse the input to extract number of topics
  const topicCountMatch = input.match(/(\d+)\s*(?:blog\s*)?topics?/i);
  const numberOfTopics = topicCountMatch ? parseInt(topicCountMatch[1]) : 5;

  // Build research config
  const researchConfig: TopicResearchConfig = {
    numberOfTopics,
    topicDescription: input,
    industryNiche: seoConfig.industryNiche || brandSettings?.industryNiche,
    seedKeywords: seoConfig.seedKeywords,
    competitorUrls: seoConfig.competitorUrls,
    searchIntents: seoConfig.searchIntents,
    contentGoals: seoConfig.contentGoals,
    brandContext: brandSettings ? {
      blogName: brandSettings.blogName,
      blogDescription: brandSettings.blogDescription,
      targetAudience: brandSettings.targetAudience,
      tone: brandSettings.tone === 'custom' ? brandSettings.customTone : brandSettings.tone,
      styleGuidelines: brandSettings.styleGuidelines,
      topicsWeCover: brandSettings.topicsWeCover,
      thingsToAvoid: brandSettings.thingsToAvoid,
    } : undefined,
  };

  console.log(`\n${'═'.repeat(80)}`);
  console.log('SEO TOPIC RESEARCH - THREE PHASE APPROACH');
  console.log(`${'═'.repeat(80)}`);
  console.log(`Topics requested: ${numberOfTopics}`);
  console.log(`Industry: ${researchConfig.industryNiche || 'Not specified'}`);
  console.log(`Seed keywords: ${researchConfig.seedKeywords?.join(', ') || 'None'}`);

  // =========================================================================
  // PHASE 1: RESEARCH - Gather data with tools
  // =========================================================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log('PHASE 1: RESEARCH');
  console.log(`${'─'.repeat(40)}`);

  const researchSystemPrompt = generateResearchPhaseSystemPrompt();
  const researchUserPrompt = generateResearchPhaseUserPrompt(researchConfig);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: researchUserPrompt }
  ];

  // Collect all tool results for Phase 2
  const allToolResults: string[] = [];
  let turn = 0;
  let researchComplete = false;

  while (turn < MAX_RESEARCH_TURNS && !researchComplete) {
    turn++;
    console.log(`\n--- Research Turn ${turn}/${MAX_RESEARCH_TURNS} ---`);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: researchSystemPrompt,
        tools: topicResearchTools,
        messages,
      });

      console.log(`Stop reason: ${response.stop_reason}`);

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        messages.push({ role: 'assistant', content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`🔧 Tool: ${toolUse.name}`);

          try {
            let result = await executeTopicResearchTool(
              toolUse.name,
              toolUse.input as Record<string, any>,
              userId
            );

            // Truncate individual tool results to prevent context overflow
            const MAX_TOOL_RESULT_CHARS = 25000;
            if (result.length > MAX_TOOL_RESULT_CHARS) {
              console.log(`   ⚠️ Truncating ${toolUse.name} result from ${result.length} to ${MAX_TOOL_RESULT_CHARS} chars`);
              result = result.slice(0, MAX_TOOL_RESULT_CHARS) + '\n... [truncated]';
            }

            console.log(`   Result length: ${result.length} chars`);

            // Store for Phase 2
            allToolResults.push(`[${toolUse.name}]\n${result}`);

            // For Phase 1 context, use shorter version to keep context manageable
            const MAX_PHASE1_RESULT_CHARS = 8000;
            const phase1Result = result.length > MAX_PHASE1_RESULT_CHARS
              ? result.slice(0, MAX_PHASE1_RESULT_CHARS) + '\n... [see full data in summary phase]'
              : result;

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: phase1Result,
            });
          } catch (toolError) {
            console.error(`   Tool error: ${toolError}`);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ error: String(toolError) }),
              is_error: true,
            });
          }
        }

        messages.push({ role: 'user', content: toolResults });

      } else if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        if (textBlock?.text.includes('RESEARCH_COMPLETE')) {
          console.log('✅ Phase 1 complete - research gathered');
          researchComplete = true;
        } else {
          // Claude finished without the marker, consider it done
          console.log('✅ Phase 1 complete (end_turn)');
          researchComplete = true;
        }
      }
    } catch (apiError) {
      console.error(`API error on turn ${turn}:`, apiError);
      throw apiError;
    }
  }

  if (allToolResults.length === 0) {
    return NextResponse.json(
      { message: 'Research phase did not gather any data' },
      { status: 500 }
    );
  }

  console.log(`\nPhase 1 collected ${allToolResults.length} tool results`);

  // =========================================================================
  // PHASE 2: SUMMARIZE - Condense research into key insights
  // =========================================================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log('PHASE 2: SUMMARIZE');
  console.log(`${'─'.repeat(40)}`);

  let rawResearch = allToolResults.join('\n\n---\n\n');
  console.log(`Raw research size: ${rawResearch.length} chars`);

  // Truncate if too large (120k chars ≈ 30k tokens, leaves room for prompt)
  const MAX_RESEARCH_CHARS = 120000;
  if (rawResearch.length > MAX_RESEARCH_CHARS) {
    console.log(`⚠️ Truncating research from ${rawResearch.length} to ${MAX_RESEARCH_CHARS} chars`);
    rawResearch = rawResearch.slice(0, MAX_RESEARCH_CHARS) + '\n\n[... additional research data truncated for processing ...]';
  }

  const summarizePrompt = generateSummarizePhasePrompt(rawResearch, researchConfig);

  let researchSummary: string;
  try {
    const summarizeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: summarizePrompt }],
    });

    const summaryBlock = summarizeResponse.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!summaryBlock) {
      throw new Error('No summary generated');
    }

    researchSummary = summaryBlock.text;
    console.log(`✅ Phase 2 complete - summary: ${researchSummary.length} chars`);
  } catch (summarizeError) {
    console.error('Phase 2 error:', summarizeError);
    throw summarizeError;
  }

  // =========================================================================
  // PHASE 3: GENERATE - Create final topics from summary
  // =========================================================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log('PHASE 3: GENERATE');
  console.log(`${'─'.repeat(40)}`);

  const generatePrompt = generateTopicsPhasePrompt(researchSummary, researchConfig);

  let finalResponse: any;
  try {
    const generateResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      messages: [{ role: 'user', content: generatePrompt }],
    });

    const generateBlock = generateResponse.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!generateBlock) {
      throw new Error('No topics generated');
    }

    // Parse the JSON response
    let cleanJson = generateBlock.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      finalResponse = JSON.parse(cleanJson);
    } catch {
      // Try to extract JSON from surrounding text
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extractedJson = cleanJson.substring(firstBrace, lastBrace + 1);
        finalResponse = JSON.parse(extractedJson);
      } else {
        throw new Error('No valid JSON in response');
      }
    }

    console.log(`✅ Phase 3 complete - generated ${finalResponse.topics?.length || 0} topics`);
  } catch (generateError) {
    console.error('Phase 3 error:', generateError);
    throw generateError;
  }

  console.log(`\n${'═'.repeat(80)}`);
  console.log('ALL PHASES COMPLETE');
  console.log(`${'═'.repeat(80)}`)

  // Transform research results to match expected topic format
  if (finalResponse?.topics) {
    const transformedTopics = finalResponse.topics.map((topic: any) => ({
      topic: topic.topic,
      audience: topic.audience || researchConfig.brandContext?.targetAudience || 'General audience',
      tone: topic.tone || researchConfig.brandContext?.tone || 'professional',
      length: topic.length || 'Medium (800-1200 words)',
      includeImages: topic.includeImages ?? true,
      includeCallouts: topic.includeCallouts ?? true,
      includeCTA: topic.includeCTA ?? true,
      additionalRequirements: topic.additionalRequirements || topic.contentAngle || '',
      priority: topic.estimatedPotential === 'high' ? 'high' : topic.estimatedPotential === 'low' ? 'low' : 'medium',
      imageContext: topic.imageContext || '',
      tags: topic.tags || topic.secondaryKeywords || [],
      seo: {
        primaryKeyword: topic.primaryKeyword || '',
        secondaryKeywords: topic.secondaryKeywords || [],
        longTailKeywords: topic.longTailKeywords || [],
        lsiKeywords: topic.lsiKeywords || [],
        keywordDensity: topic.keywordDensity || 1.5,
        searchIntent: topic.searchIntent || 'informational',
        searchVolume: topic.searchVolume,
        competition: topic.competition,
        metaTitle: topic.metaTitle || topic.topic.substring(0, 60),
        metaDescription: topic.metaDescription || '',
        openGraph: topic.openGraph || {
          title: topic.topic,
          description: '',
          type: 'article',
        },
        schemaType: topic.schemaType || 'BlogPosting',
        slug: topic.slug || topic.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        canonicalUrl: null,
      },
      // Include research rationale
      researchRationale: topic.rationale,
      estimatedDifficulty: topic.estimatedDifficulty,
      estimatedPotential: topic.estimatedPotential,
    }));

    return NextResponse.json({
      message: 'Topics generated with SEO research',
      interpretedData: {
        topics: transformedTopics,
        researchSummary: finalResponse.researchSummary,
        researchInsights: finalResponse.researchInsights,
      },
      originalInput: input,
      inputType: 'seo-research',
      researchTurns: turn,
    });
  }

  // Fallback if research didn't produce results
  return NextResponse.json(
    { message: 'SEO research did not produce valid topics', error: finalResponse?.error },
    { status: 500 }
  );
}

/**
 * Original single-shot interpretation (when SEO research is disabled)
 */
async function handleSingleShotInterpretation(
  input: string,
  brandContext: string | undefined,
  brandExamples: string | undefined,
  brandSettings: any,
  availableImages: any[],
  uploadedImages: any[]
): Promise<NextResponse> {
  // Build saved brand context string
  let savedBrandContext = '';
  let savedExampleContent = '';

  if (brandSettings) {
    const parts: string[] = [];

    if (brandSettings.blogName) parts.push(`Blog/Brand Name: ${brandSettings.blogName}`);
    if (brandSettings.blogDescription) parts.push(`Blog Description: ${brandSettings.blogDescription}`);
    if (brandSettings.industryNiche) parts.push(`Industry/Niche: ${brandSettings.industryNiche}`);
    if (brandSettings.targetAudience) parts.push(`Target Audience: ${brandSettings.targetAudience}`);
    if (brandSettings.tone) {
      const toneValue = brandSettings.tone === 'custom' && brandSettings.customTone
        ? brandSettings.customTone
        : brandSettings.tone;
      parts.push(`Brand Tone: ${toneValue}`);
    }
    if (brandSettings.styleGuidelines) parts.push(`Style Guidelines: ${brandSettings.styleGuidelines}`);
    if (brandSettings.topicsWeCover) parts.push(`Topics We Cover: ${brandSettings.topicsWeCover}`);
    if (brandSettings.thingsToAvoid) parts.push(`Things to Avoid: ${brandSettings.thingsToAvoid}`);

    if (parts.length > 0) {
      savedBrandContext = `SAVED BRAND SETTINGS:\n${parts.join('\n\n')}\n\nUse these brand settings to ensure all generated topics align with the brand voice, target audience, and content guidelines.\n\n`;
    }

    if (brandSettings.exampleContent && !brandExamples) {
      savedExampleContent = brandSettings.exampleContent;
    }
  }

  const effectiveBrandExamples = brandExamples || savedExampleContent;

  // Build image context
  const imageContext = availableImages.length > 0 || uploadedImages.length > 0 ? `

BRAND VISUAL CONTEXT:
The user has provided ${availableImages.length + uploadedImages.length} brand images to help you understand their visual style and aesthetic preferences.

${availableImages.length > 0 ? `Brand Images from Library:\n${availableImages.map((img: any) => `- ${img.name} (${img.width}x${img.height})`).join('\n')}` : ''}
${uploadedImages.length > 0 ? `Uploaded Brand Images:\n${uploadedImages.map((img: any) => `- ${img}`).join('\n')}` : ''}` : '';

  const prompt = buildSingleShotPrompt(
    input,
    savedBrandContext,
    brandContext,
    effectiveBrandExamples,
    imageContext
  );

  // Call Anthropic API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse JSON response
  let interpretedData;
  try {
    const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    interpretedData = JSON.parse(cleanJson);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    return NextResponse.json(
      { message: 'Failed to interpret input - invalid JSON response from AI' },
      { status: 500 }
    );
  }

  // Validate structure
  if (!interpretedData.topics || !Array.isArray(interpretedData.topics)) {
    return NextResponse.json(
      { message: 'Invalid interpretation - missing topics array' },
      { status: 500 }
    );
  }

  // Limit and filter topics
  if (interpretedData.topics.length > 50) {
    interpretedData.topics = interpretedData.topics.slice(0, 50);
  }

  interpretedData.topics = interpretedData.topics.filter((topic: any) =>
    topic.topic && typeof topic.topic === 'string' && topic.topic.trim().length > 0
  );

  return NextResponse.json({
    message: 'Input interpreted successfully',
    interpretedData,
    originalInput: input,
    inputType: 'text'
  });
}

/**
 * Build the single-shot prompt (original implementation)
 */
function buildSingleShotPrompt(
  input: string,
  savedBrandContext: string,
  brandContext: string | undefined,
  brandExamples: string | undefined,
  imageContext: string
): string {
  return `You are a content strategy assistant. Convert the following raw input into a structured JSON format for blog topic creation.

${savedBrandContext}${brandContext ? `ADDITIONAL BRAND CONTEXT (per-request):
${brandContext}

Use this additional context along with the saved brand settings above.

` : ''}${brandExamples ? `BRAND WRITING EXAMPLES:
The following are examples of the brand's previous content. Analyze the writing style, tone, vocabulary, sentence structure, and overall voice to match this style in your generated topics:

${brandExamples}

IMPORTANT: Use these examples to understand the brand's authentic voice and writing patterns. Match the tone, complexity level, and communication style demonstrated in these examples.

` : ''}${imageContext}

INPUT TO INTERPRET:
${input}

Please convert this input into a JSON object with the following structure:
{
  "topics": [
    {
      "topic": "string - SEO-optimized blog post title that captures search intent",
      "audience": "string - specific target audience for this topic",
      "tone": "string - optimal tone for this specific topic and audience",
      "length": "string - optimal length: Short (400-600 words), Medium (800-1200 words), Long (1200-1500 words), Comprehensive (2000+ words)",
      "includeImages": boolean,
      "includeCallouts": boolean,
      "includeCTA": boolean,
      "additionalRequirements": "string - specific requirements tailored to this topic",
      "priority": "string - MUST be lowercase: low, medium, or high",
      "imageContext": "string - specific image style/aesthetic",
      "tags": ["array of SEO-relevant tags"],
      "scheduledAt": "ISO date string if scheduling info provided",
      "seo": {
        "primaryKeyword": "string - main target keyword (2-4 words)",
        "secondaryKeywords": ["array of 3-5 related keywords"],
        "longTailKeywords": ["array of 2-3 longer search phrases"],
        "lsiKeywords": ["array of 3-5 semantically related terms"],
        "keywordDensity": number,
        "searchIntent": "informational|commercial|navigational|transactional",
        "metaTitle": "string - 50-60 characters",
        "metaDescription": "string - MAXIMUM 155 characters",
        "openGraph": {
          "title": "string",
          "description": "string",
          "type": "article"
        },
        "schemaType": "Article|BlogPosting|NewsArticle|HowToArticle|FAQPage",
        "slug": "string - SEO-friendly URL slug",
        "canonicalUrl": null
      }
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Extract as many distinct blog topics as possible from the input
2. Create SEO-optimized topic titles that target specific search intent
3. CUSTOMIZE EACH TOPIC INDIVIDUALLY
4. ALWAYS use lowercase for priority and searchIntent
5. CURRENT DATE/TIME: ${new Date().toISOString()}
6. Return ONLY the JSON object, no additional text

Generate the JSON now:`;
}
