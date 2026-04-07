/**
 * Unified Blog Generation Agent
 *
 * Single agent that handles the entire blog post lifecycle:
 * research → write → generate images → review images → save → complete
 *
 * Replaces the multi-stage Upstash Workflow pipeline.
 */

import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import User from '@/models/User';
import BrandSettings from '@/models/BrandSettings';
import { buildGenerationTools, GenerationToolContext } from './generation-tools';
import { outputJsonFormat } from './output-format';
import {
  generateResearchSystemPrompt,
  generateResearchUserPrompt,
  generateExploratorySystemPrompt,
  generateExploratoryUserPrompt,
} from '@/lib/research/research-prompts';

const MAX_TURNS = 50;

export interface GenerationResult {
  success: boolean;
  postId?: string;
  error?: string;
  turns?: number;
  toolCalls?: number;
}

export async function executeGenerationAgent(options: {
  topicId: string;
  ownerId: string;
}): Promise<GenerationResult> {
  const { topicId, ownerId } = options;
  const tag = `[Gen:${topicId.slice(-6)}]`;
  const startTime = Date.now();

  console.log(`${tag} ── START ──────────────────────────────────`);

  try {
    await dbConnect();

    // Load topic
    const topic = await Topic.findById(topicId);
    if (!topic) throw new Error(`Topic ${topicId} not found`);
    if (topic.status === 'completed' && topic.generatedPostId) {
      throw new Error(`Topic already completed (post ${topic.generatedPostId})`);
    }

    // Load user for clerk ID
    const user = await User.findById(ownerId).lean() as any;
    if (!user?.clerkId) throw new Error(`User ${ownerId} not found or missing clerkId`);

    // Load brand settings
    const brand = await BrandSettings.findOne({ userId: user.clerkId }).lean() as any;

    // Mark as generating
    await Topic.findByIdAndUpdate(topicId, {
      status: 'generating',
      generationPhase: 'initializing',
      processingStartedAt: new Date(),
    });

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(topic, brand);
    const userMessage = buildUserMessage(topic);

    console.log(`${tag} Topic: "${topic.topic}"`);
    console.log(`${tag} Mode: ${topic.researchMode || 'guided'}`);
    console.log(`${tag} System prompt: ${systemPrompt.length} chars`);

    // Build tools
    const toolCtx: GenerationToolContext = {
      ownerId,
      ownerClerkId: user.clerkId,
      topicId,
      imageContext: topic.imageContext || '',
      referenceImages: topic.referenceImages?.length > 0
        ? topic.referenceImages
        : (brand?.referenceImages || []),
    };

    const tools = buildGenerationTools(toolCtx);

    // Create the agent runner
    const client = new Anthropic({ maxRetries: 5 });
    const runner = client.beta.messages.toolRunner({
      model: 'claude-opus-4-6',
      max_tokens: 16384,
      system: systemPrompt,
      tools,
      messages: [{ role: 'user', content: userMessage }],
      stream: false,
    });

    // Run the agent loop
    let turnNumber = 0;
    let postSaved = false;

    for await (const messageStream of runner) {
      turnNumber++;

      const toolUseBlocks = messageStream.content.filter((b: any) => b.type === 'tool_use');
      const textBlocks = messageStream.content.filter((b: any) => b.type === 'text');

      // Log tool calls
      for (const block of toolUseBlocks) {
        const tb = block as any;
        console.log(`${tag} Turn ${turnNumber}: ${tb.name}`);

        // Track phase based on tool usage
        if (['searchTopicInfo', 'searchExpertOpinions', 'searchWithExa', 'findSimilarContent', 'getFullContent'].includes(tb.name)) {
          await Topic.findByIdAndUpdate(topicId, { generationPhase: 'researching' }).catch(() => {});
        } else if (tb.name === 'generateImage' || tb.name === 'viewImage') {
          await Topic.findByIdAndUpdate(topicId, { generationPhase: 'generating_images' }).catch(() => {});
        } else if (tb.name === 'saveBlogPost') {
          await Topic.findByIdAndUpdate(topicId, { generationPhase: 'saving' }).catch(() => {});
          postSaved = true;
        } else if (tb.name === 'searchInternalPosts') {
          await Topic.findByIdAndUpdate(topicId, { generationPhase: 'writing_content' }).catch(() => {});
        }
      }

      // Log text output
      for (const block of textBlocks) {
        const text = (block as any).text;
        if (text.length > 0) {
          console.log(`${tag} Turn ${turnNumber} text (${text.length} chars): ${text.slice(0, 200)}...`);
        }
      }

      if (turnNumber >= MAX_TURNS) {
        console.log(`${tag} Hit max turns (${MAX_TURNS}), stopping`);
        break;
      }
    }

    // Check if the post was saved
    const updatedTopic = await Topic.findById(topicId);
    const finalPostId = updatedTopic?.generatedPostId;

    if (!finalPostId && !postSaved) {
      console.error(`${tag} Agent finished without saving a post`);
      await updatedTopic?.markAsFailed('Agent completed without saving a blog post');
      return { success: false, error: 'Agent did not save a post', turns: turnNumber };
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`${tag} ── DONE ── ${turnNumber} turns, ${elapsed}s ──────`);

    return {
      success: true,
      postId: finalPostId?.toString(),
      turns: turnNumber,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`${tag} FATAL ERROR:`, errorMsg);

    // Mark topic as failed
    try {
      await dbConnect();
      const topic = await Topic.findById(topicId);
      if (topic && topic.status !== 'completed') {
        await topic.markAsFailed(errorMsg.substring(0, 500));
      }
    } catch (markError) {
      console.error(`${tag} Failed to mark topic as failed:`, markError);
    }

    return {
      success: false,
      error: errorMsg,
      turns: 0,
    };
  }
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildSystemPrompt(topic: any, brand: any): string {
  const researchMode = topic.researchMode || 'guided';
  const seoKeywords: string[] = [];
  if (topic.seo?.primaryKeyword) seoKeywords.push(topic.seo.primaryKeyword);
  if (topic.seo?.secondaryKeywords?.length) seoKeywords.push(...topic.seo.secondaryKeywords);

  let prompt = `You are an expert blog content generation agent. You will research a topic, write a complete blog post, generate and review images, and save the result. You have tools for every step.

`;

  // Brand identity
  if (brand) {
    prompt += `## BRAND IDENTITY\n`;
    if (brand.blogName) prompt += `Blog: ${brand.blogName}\n`;
    if (brand.blogDescription) prompt += `Description: ${brand.blogDescription}\n`;
    if (brand.targetAudience) prompt += `Target Audience: ${brand.targetAudience}\n`;
    if (brand.tone) prompt += `Tone: ${brand.tone === 'custom' ? brand.customTone : brand.tone}\n`;
    if (brand.styleGuidelines) prompt += `Style Guidelines: ${brand.styleGuidelines}\n`;
    if (brand.topicsWeCover) prompt += `Topics We Cover: ${brand.topicsWeCover}\n`;
    if (brand.thingsToAvoid) prompt += `Things to Avoid: ${brand.thingsToAvoid}\n`;
    if (brand.exampleContent) prompt += `\nWriting Examples (match this voice):\n${brand.exampleContent}\n`;
    prompt += '\n';
  }

  // Phase 1: Research
  prompt += `## PHASE 1: RESEARCH\n\n`;
  if (researchMode === 'exploratory') {
    // Use the exploratory prompt content (adapted for inline use)
    prompt += `You are exploring a broad topic area to discover the most compelling angle.
Research thoroughly using ALL available search tools (searchTopicInfo, searchExpertOpinions, searchWithExa, findSimilarContent, getFullContent).
Conduct at least 8-12 searches. Your goal is to find:
- What's being written about in this space right now
- Gaps in existing coverage
- Emerging trends or recent developments
- Contrarian or underreported angles
- Strong evidence (statistics, expert quotes, case studies)

Do NOT settle for the obvious take. Dig deeper.\n\n`;
  } else {
    prompt += `Research the topic "${topic.topic}" thoroughly.
Use ALL available search tools (searchTopicInfo, searchExpertOpinions, searchWithExa, findSimilarContent, getFullContent).
Conduct at least 5-10 searches to gather:
- Statistics and data points with sources
- Expert quotes with attribution
- Current trends and developments
- Counterpoints and nuances
- Real examples and case studies\n\n`;
  }

  // Phase 2: Research brief
  prompt += `## PHASE 2: WRITE YOUR RESEARCH BRIEF

After researching, synthesize your findings into a research brief IN YOUR TEXT RESPONSE. This is your editorial plan before writing. Include:
- **Angle**: The specific angle that makes this piece different
- **Thesis**: One-sentence thesis statement
- **Why Now**: The timeliness hook
- **Key Evidence**: The strongest supporting evidence you found
- **Narrative Arc**: How you'll structure the story
${researchMode === 'exploratory' ? '- **Recommended Title**: A compelling, specific title based on your research\n' : ''}
This brief is your checkpoint. Get this right before moving to Phase 3.

`;

  // Phase 3: Write the blog post
  prompt += `## PHASE 3: WRITE THE BLOG POST

Write the complete blog post and save it using the saveBlogPost tool.

Before writing, use searchInternalPosts to find related published posts for internal linking. Include 2-4 internal links naturally in your content as [anchor text](/blog/slug).

The saveBlogPost tool expects this JSON structure:
${outputJsonFormat}

CONTENT GUIDELINES:
- NEVER include the main H1 title in content — it's displayed separately
- Use ## and ### for section headers, never #
- Choose the best component type for each section (rich_text, image, chart, table, timeline, etc.)
- Include images where they add visual value — use the generateImage tool for each one
- Cite sources with attribution throughout
- Match the brand tone and style guidelines
- Structure for easy scanning: headers, lists, short paragraphs

`;

  // SEO instructions
  if (topic.seo?.primaryKeyword) {
    prompt += `SEO REQUIREMENTS:
- Primary keyword: "${topic.seo.primaryKeyword}" — use in title, first paragraph, and at least one header
${topic.seo.secondaryKeywords?.length ? `- Secondary keywords: ${topic.seo.secondaryKeywords.join(', ')}\n` : ''}${topic.seo.searchIntent ? `- Search intent: ${topic.seo.searchIntent}\n` : ''}
`;
  }

  // Phase 4: Images
  prompt += `## PHASE 4: GENERATE AND REVIEW IMAGES

For each image component in your blog post, call generateImage with a detailed visual description BEFORE calling saveBlogPost. Include the returned URLs in the image components.

Also generate a featured image for the blog post header.

After generating key images, use viewImage to evaluate them. If an image doesn't meet quality standards, regenerate it with a refined description.

`;

  // Phase 5: Save and complete
  prompt += `## PHASE 5: SAVE AND COMPLETE

1. Call saveBlogPost with the complete blog post JSON, including all image URLs
2. Call updateTopicStatus with status "completed"

CRITICAL CONSTRAINTS:
- You MUST complete all phases
- You MUST generate images BEFORE calling saveBlogPost (so URLs are included)
- You MUST call saveBlogPost BEFORE calling updateTopicStatus
- If anything fails critically, call updateTopicStatus with status "failed" and explain the error
`;

  return prompt;
}

function buildUserMessage(topic: any): string {
  const researchMode = topic.researchMode || 'guided';

  let message = `Generate a blog post:\n\n`;
  message += `Topic: "${topic.topic}"\n`;
  if (topic.audience) message += `Audience: ${topic.audience}\n`;
  if (topic.tone) message += `Tone: ${topic.tone}\n`;
  if (topic.length) message += `Length: ${topic.length}\n`;
  message += `Research Mode: ${researchMode}\n`;
  message += `Include Images: ${topic.includeImages ?? true}\n`;
  message += `Include Callouts: ${topic.includeCallouts ?? true}\n`;
  message += `Include CTA: ${topic.includeCTA ?? true}\n`;

  if (topic.additionalRequirements) {
    message += `\nAdditional Requirements: ${topic.additionalRequirements}\n`;
  }

  if (topic.imageContext) {
    message += `\nImage Style: ${topic.imageContext}\n`;
  }

  if (topic.seo) {
    message += `\nSEO Strategy:\n`;
    if (topic.seo.primaryKeyword) message += `  Primary Keyword: ${topic.seo.primaryKeyword}\n`;
    if (topic.seo.secondaryKeywords?.length) message += `  Secondary: ${topic.seo.secondaryKeywords.join(', ')}\n`;
    if (topic.seo.searchIntent) message += `  Search Intent: ${topic.seo.searchIntent}\n`;
    if (topic.seo.metaTitle) message += `  Meta Title: ${topic.seo.metaTitle}\n`;
    if (topic.seo.metaDescription) message += `  Meta Description: ${topic.seo.metaDescription}\n`;
    if (topic.seo.slug) message += `  Slug: ${topic.seo.slug}\n`;
  }

  if (topic.internalLinks?.length > 0) {
    message += `\nPre-planned Internal Links (use these, skip searchInternalPosts):\n`;
    for (const link of topic.internalLinks) {
      message += `  - "${link.title}" (/blog/${link.slug})\n`;
    }
  }

  if (topic.brandContext) {
    message += `\nBrand Context: ${topic.brandContext}\n`;
  }

  if (topic.brandExamples) {
    message += `\nBrand Writing Examples:\n${topic.brandExamples}\n`;
  }

  return message;
}
