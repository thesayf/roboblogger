import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// POST /api/blog/topics/interpret - Use AI to interpret free-form input into structured JSON
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    const body = await request.json();
    const { input, brandContext, brandExamples, inputType = 'text', availableImages = [], uploadedImages = [] } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { message: 'Input is required and must be a string' },
        { status: 400 }
      );
    }

    // Construct the AI prompt
    const imageContext = availableImages.length > 0 || uploadedImages.length > 0 ? `

BRAND VISUAL CONTEXT:
The user has provided ${availableImages.length + uploadedImages.length} brand images to help you understand their visual style and aesthetic preferences. Use this visual context to inform the imageContext and overall tone of the generated topics, but do not reference specific images in the topics unless they are directly relevant to the content.

${availableImages.length > 0 ? `Brand Images from Library:
${availableImages.map((img: any) => `- ${img.name} (${img.width}x${img.height})`).join('\n')}` : ''}

${uploadedImages.length > 0 ? `Uploaded Brand Images:
${uploadedImages.map((img: any) => `- ${img}`).join('\n')}` : ''}` : '';

    const prompt = `You are a content strategy assistant. Convert the following raw input into a structured JSON format for blog topic creation.

${brandContext ? `BRAND CONTEXT:
${brandContext}

Use this brand context to inform the tone, audience, and style of the generated topics.

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
      "length": "string - optimal length based on topic complexity and search intent: Short (400-600 words), Medium (800-1200 words), Long (1200-1500 words), Comprehensive (2000+ words)",
      "includeImages": boolean - true if visuals would enhance this specific topic,
      "includeCallouts": boolean - true if tips/highlights would benefit this topic,
      "includeCTA": boolean - true if this topic naturally leads to action/conversion,
      "additionalRequirements": "string - specific requirements tailored to this topic",
      "priority": "string - MUST be lowercase: low, medium, or high based on business impact and search volume",
      "imageContext": "string - specific image style/aesthetic that would work best for this topic",
      "tags": ["array of SEO-relevant tags specific to this topic"],
      "scheduledAt": "ISO date string if scheduling info provided",
      "seo": {
        "primaryKeyword": "string - main target keyword for this topic (2-4 words)",
        "secondaryKeywords": ["array of 3-5 related keywords"],
        "longTailKeywords": ["array of 2-3 longer, specific search phrases"],
        "lsiKeywords": ["array of 3-5 semantically related terms"],
        "keywordDensity": number - target density percentage (1.0-2.5),
        "searchIntent": "string - informational, commercial, navigational, or transactional",
        "metaTitle": "string - SEO title (50-60 characters including primary keyword)",
        "metaDescription": "string - compelling meta description (MAXIMUM 155 characters - STRICT LIMIT)",
        "openGraph": {
          "title": "string - social media optimized title (can differ from meta title)",
          "description": "string - social media description (can differ from meta description)",
          "type": "article"
        },
        "schemaType": "string - Article, BlogPosting, NewsArticle, HowToArticle, or FAQPage",
        "slug": "string - SEO-friendly URL slug (lowercase, hyphens, no special chars)",
        "canonicalUrl": null
      }
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. Extract as many distinct blog topics as possible from the input
2. Create SEO-optimized topic titles that target specific search intent and keywords
3. CUSTOMIZE EACH TOPIC INDIVIDUALLY - Don't use generic settings:
   - Tailor audience to the specific topic (e.g., "beginner entrepreneurs" vs "experienced marketers")
   - Optimize tone for the topic type (e.g., "authoritative" for guides, "encouraging" for how-tos)
   - Set length based on topic complexity and search behavior for that subject
   - Choose includeImages/includeCallouts/includeCTA based on what would best serve readers for that specific topic
4. Prioritize based on business impact, search volume potential, and evergreen value
5. Create topic-specific tags that target relevant SEO keywords and categories
6. Write additionalRequirements that are uniquely tailored to each topic's needs
7. Design imageContext specific to each topic's visual requirements
8. ALWAYS use lowercase for priority: "low", "medium", or "high"
9. If brand context is provided, ensure all settings align with the brand voice while still optimizing for each topic
10. If brand images are provided, use them to inform topic-specific imageContext descriptions

11. **SEO STRATEGY REQUIREMENTS** - Generate comprehensive SEO data for each topic:
    - **Primary Keyword**: Choose the most valuable 2-4 word target keyword with good search volume and relevance
    - **Secondary Keywords**: Select 3-5 related keywords that complement the primary keyword
    - **Long-tail Keywords**: Create 2-3 specific, longer search phrases (5+ words) that target niche searches
    - **LSI Keywords**: Include 3-5 semantically related terms that Google associates with your topic
    - **Keyword Density**: Set realistic target density (1.0-2.5%) based on keyword competition
    - **Search Intent**: Determine if users are seeking information, comparing products, navigating to resources, or ready to take action
    - **Meta Title**: Craft compelling 50-60 character titles that include primary keyword and encourage clicks
    - **Meta Description**: Write persuasive descriptions that include primary keyword and clear value proposition (MAXIMUM 155 characters - count carefully and do not exceed this limit)
    - **Open Graph**: Create social-media optimized titles and descriptions that may differ from meta tags for better engagement
    - **Schema Type**: Choose the most appropriate structured data type (BlogPosting for most blog content, HowToArticle for tutorials, FAQPage for Q&A format, etc.)
    - **Slug**: Generate clean, SEO-friendly URL slugs using primary keyword and topic focus
    - **Canonical URL**: Leave as null unless duplicate content is expected

12. Handle scheduling information carefully:
    - Include "scheduledAt" field ONLY when specific dates/times are mentioned in the input
    - Format dates as ISO strings (e.g., "2025-07-03T15:30:00")
    - Parse relative dates (e.g., "next Monday", "in 2 weeks") to specific dates
    - CURRENT DATE/TIME: ${new Date().toISOString()} - Use this as the reference point for all relative scheduling
    - When parsing "20 minutes from now", "30 minutes from now", etc., calculate from the current time above
    - If only a date is given without time, use 09:00:00 as default time
    - If time ranges are given, use the start time

13. Make topics actionable and engaging
14. Focus on content strategy rather than specific image assignments
15. CRITICAL: All enum values MUST be lowercase (priority: "low"/"medium"/"high", searchIntent: "informational"/"commercial"/"navigational"/"transactional")
16. Return ONLY the JSON object, no additional text

EXAMPLE of individualized topic optimization with complete SEO data:
{
  "topics": [
    {
      "topic": "Complete Guide to Email Marketing Automation for Small Businesses",
      "audience": "small business owners with basic email marketing experience",
      "tone": "instructional and encouraging",
      "length": "Long (1200-1500 words)",
      "includeImages": true,
      "includeCallouts": true,
      "includeCTA": true,
      "additionalRequirements": "Include specific tool recommendations, automation workflow examples, and ROI calculation methods",
      "priority": "high",
      "imageContext": "email dashboard screenshots, workflow diagrams, and professional business settings",
      "tags": ["email marketing", "automation", "small business", "lead nurturing", "conversion"],
      "seo": {
        "primaryKeyword": "email marketing automation",
        "secondaryKeywords": ["email automation", "small business marketing", "email workflows", "marketing automation"],
        "longTailKeywords": ["email marketing automation for small businesses", "how to automate email marketing campaigns"],
        "lsiKeywords": ["email sequences", "drip campaigns", "customer journey", "lead scoring", "email segmentation"],
        "keywordDensity": 1.8,
        "searchIntent": "informational",
        "metaTitle": "Email Marketing Automation Guide for Small Business Success",
        "metaDescription": "Master email marketing automation for your small business. Learn workflows, tools, and strategies to increase conversions and save time.",
        "openGraph": {
          "title": "Transform Your Small Business with Email Marketing Automation",
          "description": "Discover powerful email automation strategies that convert prospects into customers automatically.",
          "type": "article"
        },
        "schemaType": "HowToArticle",
        "slug": "email-marketing-automation-small-business-guide",
        "canonicalUrl": null
      }
    },
    {
      "topic": "5 Quick SEO Wins You Can Implement Today",
      "audience": "busy entrepreneurs seeking immediate results",
      "tone": "urgent and actionable",
      "length": "Short (400-600 words)",
      "includeImages": false,
      "includeCallouts": true,
      "includeCTA": true,
      "additionalRequirements": "Focus on quick wins that take under 30 minutes each, include before/after examples",
      "priority": "medium",
      "imageContext": "not applicable",
      "tags": ["SEO", "quick wins", "website optimization", "search ranking"],
      "seo": {
        "primaryKeyword": "quick SEO wins",
        "secondaryKeywords": ["SEO tips", "website optimization", "search ranking", "SEO strategies"],
        "longTailKeywords": ["quick SEO improvements you can make today", "fast SEO wins for small business"],
        "lsiKeywords": ["search engine optimization", "organic traffic", "SERP ranking", "website performance", "SEO audit"],
        "keywordDensity": 2.1,
        "searchIntent": "informational",
        "metaTitle": "5 Quick SEO Wins You Can Implement in 30 Minutes Today",
        "metaDescription": "Boost your search rankings fast! Discover 5 proven SEO tactics that take under 30 minutes each and deliver immediate results.",
        "openGraph": {
          "title": "Get Fast SEO Results: 5 Quick Wins for Instant Rankings",
          "description": "Stop waiting for SEO results. These 5 quick wins boost your rankings today.",
          "type": "article"
        },
        "schemaType": "Article",
        "slug": "5-quick-seo-wins-implement-today",
        "canonicalUrl": null
      }
    }
  ]
}

Generate the JSON now:`;

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Try to parse the AI response as JSON
    let interpretedData;
    try {
      // Remove any potential markdown formatting
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Log the raw response for debugging
      console.log('Raw AI response:', aiResponse);
      console.log('Cleaned JSON:', cleanJson);
      console.log('First 500 chars:', cleanJson.substring(0, 500));
      console.log('Character at position 333:', cleanJson.charAt(333));
      console.log('Characters around position 333:', cleanJson.substring(330, 340));
      
      interpretedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error('Parse error details:', {
        message: errorMessage,
        position: errorMessage.match(/position (\d+)/)?.[1]
      });
      console.error('Raw response length:', aiResponse.length);
      console.error('Raw response:', aiResponse);
      
      // If we can identify the position, show what's around it
      const errorPos = errorMessage.match(/position (\d+)/)?.[1];
      if (errorPos) {
        const pos = parseInt(errorPos);
        console.error(`Characters around position ${pos}:`, {
          before: aiResponse.substring(pos - 20, pos),
          at: aiResponse.charAt(pos),
          after: aiResponse.substring(pos, pos + 20)
        });
      }
      return NextResponse.json(
        { message: 'Failed to interpret input - invalid JSON response from AI' },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!interpretedData.topics || !Array.isArray(interpretedData.topics)) {
      return NextResponse.json(
        { message: 'Invalid interpretation - missing topics array' },
        { status: 500 }
      );
    }

    // Limit topics to 50 for safety
    if (interpretedData.topics.length > 50) {
      interpretedData.topics = interpretedData.topics.slice(0, 50);
    }

    // Ensure all topics have required fields
    interpretedData.topics = interpretedData.topics.filter((topic: any) => 
      topic.topic && typeof topic.topic === 'string' && topic.topic.trim().length > 0
    );

    return NextResponse.json({
      message: 'Input interpreted successfully',
      interpretedData,
      originalInput: input,
      inputType
    });

  } catch (error) {
    console.error('Error in topic interpretation:', error);
    return NextResponse.json(
      { message: 'Failed to interpret input', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}