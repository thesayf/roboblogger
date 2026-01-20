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
  generateTopicResearchSystemPrompt,
  generateTopicResearchUserPrompt,
  TopicResearchConfig,
} from '@/lib/seo-research/topic-research-prompts';

export const maxDuration = 300;

const MAX_RESEARCH_TURNS = 15;

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
 * Handle agentic SEO research with tool use
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

  const systemPrompt = generateTopicResearchSystemPrompt();
  const userPrompt = generateTopicResearchUserPrompt(researchConfig);

  // Initialize conversation
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt }
  ];

  let turn = 0;
  let finalResponse: any = null;

  console.log(`\n${'═'.repeat(80)}`);
  console.log('TOPIC RESEARCH AGENTIC LOOP');
  console.log(`${'═'.repeat(80)}`);
  console.log(`Topics requested: ${numberOfTopics}`);
  console.log(`Industry: ${researchConfig.industryNiche || 'Not specified'}`);
  console.log(`Seed keywords: ${researchConfig.seedKeywords?.join(', ') || 'None'}`);

  while (turn < MAX_RESEARCH_TURNS) {
    turn++;
    console.log(`\n--- Turn ${turn}/${MAX_RESEARCH_TURNS} ---`);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        system: systemPrompt,
        tools: topicResearchTools,
        messages,
      });

      console.log(`Stop reason: ${response.stop_reason}`);

      // Check if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Also capture any text thinking
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        if (textBlocks.length > 0) {
          console.log(`Claude's thinking: ${textBlocks[0].text.substring(0, 200)}...`);
        }

        // Add assistant's response to conversation
        messages.push({ role: 'assistant', content: response.content });

        // Execute all tools and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`\n🔧 Tool: ${toolUse.name}`);
          console.log(`   Input: ${JSON.stringify(toolUse.input).substring(0, 100)}...`);

          try {
            const result = await executeTopicResearchTool(
              toolUse.name,
              toolUse.input as Record<string, any>,
              userId
            );

            console.log(`   Result length: ${result.length} chars`);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
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

        // Add tool results to conversation
        messages.push({ role: 'user', content: toolResults });

      } else if (response.stop_reason === 'end_turn') {
        // Claude is done - extract final response
        console.log('\n✅ Research complete - extracting final response');

        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        if (textBlock) {
          try {
            // Try to parse JSON from the response
            let cleanJson = textBlock.text
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();

            // Try direct parse first
            try {
              finalResponse = JSON.parse(cleanJson);
            } catch {
              // If direct parse fails, try to extract JSON from the text
              // Look for JSON object pattern - find first { and last }
              const firstBrace = cleanJson.indexOf('{');
              const lastBrace = cleanJson.lastIndexOf('}');

              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const extractedJson = cleanJson.substring(firstBrace, lastBrace + 1);
                console.log('Attempting to parse extracted JSON...');
                finalResponse = JSON.parse(extractedJson);
              } else {
                throw new Error('No valid JSON object found in response');
              }
            }

            console.log(`Parsed ${finalResponse.topics?.length || 0} topics from research`);
          } catch (parseError) {
            console.error('Failed to parse final response as JSON:', parseError);
            console.log('Raw response:', textBlock.text.substring(0, 500));

            // Try to extract topics anyway
            finalResponse = {
              topics: [],
              error: 'Failed to parse research results',
              rawResponse: textBlock.text,
            };
          }
        }
        break;
      } else {
        console.log(`Unexpected stop reason: ${response.stop_reason}`);
        break;
      }
    } catch (apiError) {
      console.error(`API error on turn ${turn}:`, apiError);
      break;
    }
  }

  if (turn >= MAX_RESEARCH_TURNS) {
    console.log('⚠️ Max turns reached');
  }

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
