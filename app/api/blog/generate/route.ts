import { NextRequest } from "next/server";

export const maxDuration = 300;

// Image generation functions have been moved to /api/blog/generate-images/route.ts
// This keeps the blog generation route focused on content creation only

const outputJsonFormat = `
CRITICAL: Return ONLY valid JSON. No explanatory text before or after. No markdown code blocks. No trailing commas.

{
  "blogPost": {
    "title": "Compelling, SEO-optimized blog post title",
    "description": "Engaging 1-2 sentence description for SEO and social sharing",
    "category": "Appropriate category (e.g., Productivity, Technology, Health, etc.)",
    "readTime": 8,
    "seoTitle": "SEO optimized title (50-60 characters)",
    "seoDescription": "SEO meta description (150-160 characters)",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "components": [
    {
      "type": "rich_text",
      "order": 0,
      "content": "markdown content here - can include headers (## or ###), lists, bold, italic, etc. IMPORTANT: Do not include the main title (# H1) in content as it's displayed separately. Do not include code blocks - use the code_block component type instead. Start content with ## H2 headings or regular paragraphs."
    },
    {
      "type": "image",
      "order": 1,
      "alt": "descriptive alt text for accessibility",
      "caption": "",
      "imageDescription": "DETAILED visual scene description (NO TEXT IN IMAGE) - describe what should be shown, not written. Be specific about subjects, actions, environment, mood, colors, composition. Example: 'Professional working at laptop in bright modern office, natural sunlight from large windows, minimalist desk with coffee cup and small potted plant, clean aesthetic, shallow depth of field focusing on person'"
    },
    {
      "type": "callout",
      "order": 2,
      "variant": "info" | "success" | "warning" | "error",
      "title": "Callout title",
      "content": "markdown content for the callout body"
    },
    {
      "type": "quote",
      "order": 3,
      "content": "The quote text in markdown",
      "author": "Author name",
      "citation": "Book title, publication, etc. (optional)"
    },
    {
      "type": "cta",
      "order": 4,
      "title": "CTA section title",
      "content": "markdown content describing the CTA",
      "text": "Button text",
      "link": "URL or relative path",
      "style": "primary" | "secondary" | "outline"
    },
    {
      "type": "table",
      "order": 5,
      "headers": ["Column 1", "Column 2", "Column 3"],
      "rows": [
        ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
      ],
      "tableCaption": "Description of what the table shows",
      "tableStyle": "comparison" | "data" | "pricing"
    },
    {
      "type": "video",
      "order": 6,
      "videoUrl": "YouTube or Vimeo URL if relevant to content",
      "videoTitle": "Descriptive title for the video",
      "thumbnail": "optional thumbnail URL"
    },
    {
      "type": "bar_chart",
      "order": 7,
      "data": {
        "title": "Chart Title",
        "description": "Brief description of what the chart shows",
        "chartData": [
          {"name": "Category 1", "value": 100},
          {"name": "Category 2", "value": 150}
        ],
        "xAxisLabel": "X-axis label",
        "yAxisLabel": "Y-axis label",
        "color": "#3b82f6"
      }
    },
    {
      "type": "line_chart",
      "order": 8,
      "data": {
        "title": "Trend Chart Title",
        "description": "Description of trend",
        "chartData": [
          {"name": "Jan", "value": 100},
          {"name": "Feb", "value": 120}
        ],
        "xAxisLabel": "Time Period",
        "yAxisLabel": "Value",
        "color": "#10b981"
      }
    },
    {
      "type": "pie_chart",
      "order": 9,
      "data": {
        "title": "Distribution Title",
        "description": "Description of data",
        "chartData": [
          {"name": "Segment 1", "value": 60},
          {"name": "Segment 2", "value": 40}
        ],
        "showLabels": true,
        "showLegend": true
      }
    },
    {
      "type": "comparison_table",
      "order": 10,
      "data": {
        "title": "Comparison Title",
        "description": "What is being compared",
        "columns": [
          {"name": "Feature", "subtitle": "Optional subtitle"},
          {"name": "Option A"},
          {"name": "Option B"}
        ],
        "rows": [
          ["Feature 1", "Yes", "No"],
          ["Feature 2", true, false],
          ["Price", "$10", "$20"]
        ],
        "highlightColumn": 1
      }
    },
    {
      "type": "pros_cons",
      "order": 11,
      "data": {
        "title": "REST vs GraphQL Comparison",
        "description": "Detailed comparison of two approaches",
        "comparison": [
          {
            "name": "REST",
            "subtitle": "Traditional API architecture",
            "pros": ["Simple and intuitive", "Cacheable responses", "Stateless"],
            "cons": ["Over-fetching", "Multiple requests needed", "Limited query flexibility"]
          },
          {
            "name": "GraphQL", 
            "subtitle": "Modern query language",
            "pros": ["Single endpoint", "Precise data fetching", "Strong typing"],
            "cons": ["Complex caching", "Learning curve", "Potential for complex queries"]
          }
        ]
      }
    },
    {
      "type": "timeline",
      "order": 12,
      "data": {
        "title": "Timeline Title",
        "description": "Description of process or history",
        "orientation": "vertical",
        "events": [
          {
            "title": "Event 1",
            "description": "Event description",
            "date": "2024",
            "completed": true,
            "duration": "1 month"
          }
        ]
      }
    },
    {
      "type": "flowchart",
      "order": 13,
      "data": {
        "title": "Process Flow",
        "description": "Description of workflow",
        "layout": "vertical",
        "nodes": [
          {"id": "start", "type": "start", "title": "Start", "description": "Begin process"},
          {"id": "process1", "type": "process", "title": "Step 1", "description": "First action"},
          {"id": "decision", "type": "decision", "title": "Decision?", "description": "Choose path"},
          {"id": "end", "type": "end", "title": "End", "description": "Complete"}
        ],
        "connections": [
          {"label": "Next"}
        ]
      }
    },
    {
      "type": "step_by_step",
      "order": 14,
      "data": {
        "title": "Step-by-Step Guide",
        "description": "Detailed process guide",
        "layout": "vertical",
        "showProgress": true,
        "steps": [
          {
            "title": "Step 1",
            "description": "First step description",
            "duration": "5 minutes",
            "completed": false,
            "type": "info",
            "tips": "Helpful tip",
            "substeps": ["Sub-step 1", "Sub-step 2"]
          }
        ]
      }
    },
    {
      "type": "code_block",
      "order": 15,
      "content": "// JavaScript code example\nconst apiEndpoint = '/api/users';\n\nfunction fetchUsers() {\n  return fetch(apiEndpoint)\n    .then(response => response.json())\n    .catch(error => console.error('Error:', error));\n}",
      "metadata": {
        "language": "javascript",
        "title": "Optional code block title",
        "description": "Optional description of what this code does"
      }
    }
  ],
  "rationale": "Brief explanation of the content structure, target audience, and key takeaways"
}`;

// Helper functions for internal linking
async function searchBlogsByKeywords(keywords: string[], limit: number = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/blog/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'searchByKeywords', keywords, limit })
    });
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching blogs by keywords:', error);
    return [];
  }
}

async function searchBlogsByCategory(category: string, limit: number = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/blog/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'searchByCategory', category, limit })
    });
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching blogs by category:', error);
    return [];
  }
}

async function searchRelatedBlogs(topic: string, limit: number = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/blog/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'searchRelatedBlogs', topic, limit })
    });
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching related blogs:', error);
    return [];
  }
}

async function getBlogsByTags(tags: string[], limit: number = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/blog/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getBlogsByTags', tags, limit })
    });
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching blogs by tags:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  console.log('[blog/generate] ========== BLOG GENERATION STARTED ==========');
  console.log('[blog/generate] Timestamp:', new Date().toISOString());
  
  const body = await request.json();
  const {
    topic,
    audience,
    tone,
    length,
    includeImages,
    includeCallouts,
    includeCTA,
    additionalRequirements,
    imageContext,
    referenceImages,
    brandContext,
    brandExamples,
    seo,
    returnOnly = false // New parameter to control whether to save or just return
  } = body;
  
  console.log('[blog/generate] Topic:', topic);
  console.log('[blog/generate] Length:', length);
  console.log('[blog/generate] Include Images:', includeImages);
  console.log('[blog/generate] SEO Keywords:', seo?.primaryKeyword || 'none');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "Missing Anthropic API key" }),
      { status: 500 }
    );
  }

  const blogGenerationPrompt = `You are an expert content creator and blog writer. Create a comprehensive, engaging blog post based on the user's requirements. Your goal is to produce high-quality, well-structured content that provides real value to readers.

IMPORTANT: BEFORE generating the blog content, you MUST use the available search tools to find related existing blog posts for internal linking. This is required for SEO and user experience.

${brandContext ? `BRAND VOICE & GUIDELINES:
${brandContext}

You must ensure that all content follows these brand guidelines, maintaining consistency in tone, style, and messaging throughout the blog post.

` : ''}${brandExamples ? `BRAND WRITING EXAMPLES:
The following are examples of the brand's previous content. Analyze and match the writing style, tone, vocabulary, sentence structure, and overall voice:

${brandExamples}

CRITICAL: Study these examples carefully and write in the same authentic voice. Match the complexity level, terminology usage, and communication patterns demonstrated in these examples.

` : ''}${seo ? `SEO STRATEGY & REQUIREMENTS:
${seo.primaryKeyword ? `Primary Keyword: "${seo.primaryKeyword}" - Use this keyword naturally throughout the content, especially in the title, first paragraph, and headers. Target keyword density: ${seo.keywordDensity || 1.5}%` : ''}
${seo.secondaryKeywords && seo.secondaryKeywords.length > 0 ? `Secondary Keywords: ${seo.secondaryKeywords.map((k: string) => `"${k}"`).join(', ')} - Integrate these naturally throughout the content` : ''}
${seo.longTailKeywords && seo.longTailKeywords.length > 0 ? `Long-tail Keywords: ${seo.longTailKeywords.map((k: string) => `"${k}"`).join(', ')} - Use these for more specific targeting` : ''}
${seo.lsiKeywords && seo.lsiKeywords.length > 0 ? `LSI Keywords: ${seo.lsiKeywords.map((k: string) => `"${k}"`).join(', ')} - Include these related terms to improve semantic relevance` : ''}
${seo.searchIntent ? `Search Intent: ${seo.searchIntent} - Ensure the content matches this search intent (informational: provide education/answers, commercial: help with buying decisions, navigational: guide to specific resources, transactional: facilitate actions/conversions)` : ''}
${seo.metaTitle ? `Meta Title Target: "${seo.metaTitle}" - Use this as inspiration for your blog post title, ensuring it's compelling and includes the primary keyword` : ''}
${seo.metaDescription ? `Meta Description Target: "${seo.metaDescription}" - Ensure your blog post summary/description aligns with this SEO-optimized meta description` : ''}
${seo.schemaType ? `Schema Type: ${seo.schemaType} - Structure your content to be compatible with this schema type (Article: general articles, BlogPosting: blog posts, NewsArticle: news content, HowToArticle: step-by-step guides, FAQPage: question-answer format)` : ''}

CRITICAL SEO REQUIREMENTS:
- Naturally incorporate the primary keyword in the title, meta description, first paragraph, and at least one header
- Use secondary and LSI keywords throughout the content to improve semantic relevance
- Structure content to match the specified search intent
- Ensure content provides comprehensive value that satisfies user search queries
- Include relevant internal links to related content (using search tools)

` : ''}USER REQUIREMENTS:
Topic: "${topic}"
Target Audience: ${audience || "General audience interested in the topic"}
Tone: ${tone || "Professional but approachable"}${brandContext || brandExamples ? ' (adjusted to match brand voice)' : ''}
Length: ${
    length === 'short' ? 'Short (400-600 words, 5-7 components)' :
    length === 'medium' ? 'Medium (800-1200 words, 8-12 components)' :
    length === 'long' ? 'Long (1500-2500 words, 12-18 components)' :
    length === 'comprehensive' ? 'Comprehensive (2500-3500 words, 15-20 components max)' :
    'Medium (800-1200 words, 8-12 components)'
  }
Include Images: ${includeImages ? "Yes" : "No"}
Include Callouts: ${includeCallouts ? "Yes" : "No"}
Include CTA: ${includeCTA ? "Yes" : "No"}
Additional Requirements: ${additionalRequirements || "None"}

CONTENT CREATION GUIDELINES:

1. Blog Post Structure:
   - Create an engaging, SEO-optimized title that captures attention${seo?.primaryKeyword ? ` and includes the primary keyword "${seo.primaryKeyword}"` : ''}
   - Write a compelling description that makes readers want to continue${seo?.metaDescription ? ` and aligns with the target meta description` : ''}
   - Choose an appropriate category that fits your content
   - Estimate realistic read time based on content length
   - Generate relevant tags for discoverability${seo?.primaryKeyword || (seo?.secondaryKeywords && seo.secondaryKeywords.length > 0) ? `, including SEO keywords as tags when appropriate` : ''}

2. Component Strategy:
   - Start with rich_text for introduction and main content sections
   - NEVER repeat the blog title in content components - it's displayed separately
   - Use headers (## ### only - NOT #) to structure content logically within components
   - Include bullet points and numbered lists for easy scanning
   - Add bold and italic text for emphasis where appropriate
   - PRIORITIZE visual components over images when possible:
     * Use bar_chart, line_chart, or pie_chart for data visualization
     * Use comparison_table for feature/pricing comparisons
     * Use pros_cons for advantages/disadvantages
     * Use timeline for processes, history, or step-by-step guides
     * Use flowchart for decision trees and workflows
     * Use step_by_step for detailed process guides

3. Visual Components (PREFERRED over images):
   - bar_chart: For comparing metrics, survey results, market data
   - line_chart: For showing trends, growth patterns over time
   - pie_chart: For market share, demographics, percentage breakdowns
   - comparison_table: For side-by-side feature/pricing/product comparisons
   - pros_cons: For two-column advantages/disadvantages analysis
   - timeline: For project phases, company history, chronological processes
   - flowchart: For decision trees, user journeys, simple workflows
   - step_by_step: For numbered process guides with progress tracking

4. Image Guidelines (use sparingly, only when truly beneficial):
   - Only include images when they provide unique value that visual components cannot
   - Prioritize: hero images, product screenshots, before/after photos, or concept illustrations
   - Avoid: generic stock photos, decorative images, infographic-style images
   - IMPORTANT: Always leave the caption field empty ("") unless the user explicitly requests image captions in additionalRequirements
   - When including images, provide detailed descriptions for image generation:
     * Describe the visual scene without any text overlays
     * Focus on subjects, actions, environment, and mood
     * Professional photography style and composition
     * CRITICAL: Never include instructions for text in the image description
   - Good example: "Modern home office with person working on laptop, bright natural lighting, minimalist desk setup with plants"
   - Bad example: "Professional remote work text overlay on office scene" (NO TEXT IN IMAGES)

5. Table Usage:
   - Use tables strategically when data comparison or structured information enhances understanding
   - Include tables for: feature comparisons, pricing breakdowns, specifications, pros/cons, step-by-step processes, before/after scenarios
   - Choose appropriate tableStyle: "comparison" for side-by-side comparisons, "data" for informational tables, "pricing" for cost breakdowns
   - Keep headers clear and descriptive
   - Ensure data is accurate and relevant to the surrounding content
   - Add helpful tableCaption to explain what the table shows

6. Callout Usage (if requested):
   - Use "info" for helpful tips and additional information
   - Use "success" for positive outcomes and achievements
   - Use "warning" for important considerations or potential pitfalls
   - Use "error" for common mistakes to avoid
   - Keep callout content concise but valuable

7. Quote Integration:
   - Include relevant quotes from experts, studies, or notable figures
   - Ensure quotes directly support your main points
   - Provide proper attribution with author and source

8. CTA Strategy (if requested):
   - Make CTAs relevant to the blog content
   - Use action-oriented language
   - Provide clear value proposition
   - Choose appropriate button style based on importance

9. Content Quality Standards:
   - Provide actionable, practical advice
   - Include specific examples and case studies when relevant
   - Ensure content is well-researched and accurate
   - Use conversational tone while maintaining professionalism
   - Structure content for easy scanning (headers, lists, short paragraphs)
   - AVOID duplicating the main blog title anywhere in component content

10. Internal Linking Strategy:
   - BEFORE writing the blog content, search for related posts using the available tools
   - Call searchRelatedBlogs with your main topic to find relevant content
   - Call searchBlogsByKeywords with key terms from your topic
   - Use the results to include 2-4 strategic internal links naturally in your content
   - Format internal links as: [anchor text](/blog/slug)
   - Only link to posts that genuinely add value for readers
   - IMPORTANT: You MUST use the search tools before generating content

11. Component Ordering:
   - Order components logically for content flow
   - Use incremental numbers (0, 1, 2, 3, etc.)
   - Ensure smooth transitions between components
   - Place CTA components strategically (usually near end)

IMPORTANT NOTES:
- For image descriptions, be extremely specific - this will be used to generate images with DALL-E
- All markdown content should be properly formatted and escape special characters
- Ensure component orders are sequential starting from 0
- Focus on providing genuine value to readers
- Tailor content complexity to the specified audience
- Match the requested tone throughout all components

CRITICAL JSON FORMATTING RULES:
- Return ONLY the JSON object, nothing else
- No trailing commas anywhere in the JSON
- All strings must use double quotes, never single quotes
- Escape all special characters in strings (quotes, newlines, etc.)
- Test your JSON mentally before returning it

RESPONSE LENGTH LIMITS:
- Keep the total response under 30,000 characters to avoid truncation
- For longer content (comprehensive posts), limit to 15-20 components maximum
- Each rich_text component should be 200-800 words
- Prioritize quality over quantity - better to have complete, well-written components than risk truncation

${outputJsonFormat}`;

  try {
    console.log("Sending blog generation request to Anthropic API");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 8192, // Increased for longer blog posts
        temperature: 0.7, // Slightly higher for creative content
        tools: [
          {
            name: "searchBlogsByKeywords",
            description: "Search for existing blog posts using keywords. Use this to find related content for internal linking.",
            input_schema: {
              type: "object",
              properties: {
                keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of keywords to search for"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5
                }
              },
              required: ["keywords"]
            }
          },
          {
            name: "searchBlogsByCategory",
            description: "Search for existing blog posts by category. Use this to find related content in the same category.",
            input_schema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Category name to search for"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5
                }
              },
              required: ["category"]
            }
          },
          {
            name: "searchRelatedBlogs",
            description: "Search for blog posts related to a specific topic. Use this to find content similar to what you're writing about.",
            input_schema: {
              type: "object",
              properties: {
                topic: {
                  type: "string",
                  description: "Topic or theme to find related content for"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5
                }
              },
              required: ["topic"]
            }
          },
          {
            name: "getBlogsByTags",
            description: "Search for existing blog posts by tags. Use this to find content with specific tags for internal linking.",
            input_schema: {
              type: "object",
              properties: {
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of tags to search for"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return (default: 5)",
                  default: 5
                }
              },
              required: ["tags"]
            }
          }
        ],
        messages: [
          {
            role: "user",
            content: blogGenerationPrompt,
          },
        ],
      }),
    });

    console.log("Anthropic API response status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Anthropic API error! Status: ${response.status}`, errorBody);
      throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
    }

    const result = await response.json();
    
    // Handle tool use and conversation with Claude
    let messages = [
      {
        role: "user",
        content: blogGenerationPrompt,
      }
    ];
    
    let finalContent = '';
    let currentResult = result;
    
    // Continue conversation until we get final blog content (max 10 iterations)
    for (let iteration = 0; iteration < 10; iteration++) {
      console.log(`Iteration ${iteration + 1}: Processing response...`);
      
      if (currentResult.content) {
        console.log(`Response content blocks: ${currentResult.content.length}`);
        
        // Check if there are any tool use blocks
        const toolUseBlocks = currentResult.content.filter((c: any) => c.type === 'tool_use');
        const textBlocks = currentResult.content.filter((c: any) => c.type === 'text');
        
        if (toolUseBlocks.length > 0) {
          // Handle tool use - process all tool use blocks
          console.log(`Tool use detected: ${toolUseBlocks.length} tools to execute`);
          
          messages.push({
            role: "assistant",
            content: currentResult.content
          });
          
          // Execute all tools
          const toolResults = [];
          for (const toolUse of toolUseBlocks) {
            console.log(`Executing tool: ${toolUse.name}`);
            let toolResult;
            try {
              switch (toolUse.name) {
                case 'searchBlogsByKeywords':
                  toolResult = await searchBlogsByKeywords(toolUse.input.keywords, toolUse.input.limit);
                  break;
                case 'searchBlogsByCategory':
                  toolResult = await searchBlogsByCategory(toolUse.input.category, toolUse.input.limit);
                  break;
                case 'searchRelatedBlogs':
                  toolResult = await searchRelatedBlogs(toolUse.input.topic, toolUse.input.limit);
                  break;
                case 'getBlogsByTags':
                  toolResult = await getBlogsByTags(toolUse.input.tags, toolUse.input.limit);
                  break;
                default:
                  toolResult = { error: 'Unknown tool' };
              }
              console.log(`Tool ${toolUse.name} returned ${Array.isArray(toolResult) ? toolResult.length : 'non-array'} results`);
            } catch (error) {
              console.error(`Error executing tool ${toolUse.name}:`, error);
              toolResult = { error: 'Tool execution failed' };
            }
            
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult)
            });
          }
          
          // Add all tool results to conversation
          messages.push({
            role: "user",
            content: toolResults as any
          });
          
          // Continue conversation with Claude
          const nextResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-7-sonnet-20250219",
              max_tokens: 8192,
              temperature: 0.7,
              tools: [
                {
                  name: "searchBlogsByKeywords",
                  description: "Search for existing blog posts using keywords. Use this to find related content for internal linking.",
                  input_schema: {
                    type: "object",
                    properties: {
                      keywords: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of keywords to search for"
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of results to return (default: 5)",
                        default: 5
                      }
                    },
                    required: ["keywords"]
                  }
                },
                {
                  name: "searchBlogsByCategory",
                  description: "Search for existing blog posts by category. Use this to find related content in the same category.",
                  input_schema: {
                    type: "object",
                    properties: {
                      category: {
                        type: "string",
                        description: "Category name to search for"
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of results to return (default: 5)",
                        default: 5
                      }
                    },
                    required: ["category"]
                  }
                },
                {
                  name: "searchRelatedBlogs",
                  description: "Search for blog posts related to a specific topic. Use this to find content similar to what you're writing about.",
                  input_schema: {
                    type: "object",
                    properties: {
                      topic: {
                        type: "string",
                        description: "Topic or theme to find related content for"
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of results to return (default: 5)",
                        default: 5
                      }
                    },
                    required: ["topic"]
                  }
                },
                {
                  name: "getBlogsByTags",
                  description: "Search for existing blog posts by tags. Use this to find content with specific tags for internal linking.",
                  input_schema: {
                    type: "object",
                    properties: {
                      tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of tags to search for"
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of results to return (default: 5)",
                        default: 5
                      }
                    },
                    required: ["tags"]
                  }
                }
              ],
              messages: messages,
            }),
          });
          
          if (!nextResponse.ok) {
            console.error('Error in follow-up API call:', nextResponse.status);
            break;
          }
          
          currentResult = await nextResponse.json();
        } else if (textBlocks.length > 0) {
          // We have the final text response
          finalContent = textBlocks.map((block: any) => block.text).join('\n');
          console.log(`Final content received: ${finalContent.length} characters`);
          break;
        } else {
          console.error('No text or tool use blocks found in response');
          break;
        }
      } else {
        console.error('Unexpected response format:', currentResult);
        break;
      }
    }
    
    if (!finalContent) {
      throw new Error('Failed to get final blog content from Claude');
    }
    
    const generatedContent = finalContent;

    // Parse the JSON response from Claude
    let blogData;
    try {
      console.log("Raw AI response (first 500 chars):", generatedContent.substring(0, 500));
      console.log("Raw AI response (last 500 chars):", generatedContent.substring(generatedContent.length - 500));
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log("Extracted JSON string length:", jsonString.length);
        
        // Try to fix common JSON issues (be conservative to avoid breaking valid JSON)
        let cleanedJson = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before closing brackets
          .replace(/```json\s*/g, '') // Remove markdown code block markers
          .replace(/```\s*/g, '') // Remove markdown code block end markers
        
        // Check if JSON is incomplete (common with token limits)
        const openBraces = (cleanedJson.match(/\{/g) || []).length;
        const closeBraces = (cleanedJson.match(/\}/g) || []).length;
        const openBrackets = (cleanedJson.match(/\[/g) || []).length;
        const closeBrackets = (cleanedJson.match(/\]/g) || []).length;
        
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          console.log("Detected incomplete JSON, attempting to fix...");
          console.log(`Braces: ${openBraces} open, ${closeBraces} closed`);
          console.log(`Brackets: ${openBrackets} open, ${closeBrackets} closed`);
          
          // More aggressive cleanup for incomplete JSON
          // Find the last complete component/object
          // Use a more careful regex that ensures we capture complete components
          const componentRegex = /\{\s*"type":\s*"[^"]+",\s*"order":\s*\d+(?:,\s*"[^"]+"\s*:\s*(?:"(?:[^"\\]|\\.)*"|true|false|null|\d+|\{[^}]*\}|\[[^\]]*\]))*\s*\}/g;
          const componentMatches = Array.from(cleanedJson.matchAll(componentRegex));
          if (componentMatches.length > 0) {
            const lastCompleteComponent = componentMatches[componentMatches.length - 1];
            const lastCompleteIndex = lastCompleteComponent.index + lastCompleteComponent[0].length;
            
            // Try to find the end of the components array after the last complete component
            const afterLastComponent = cleanedJson.substring(lastCompleteIndex);
            const endOfArrayMatch = afterLastComponent.match(/^\s*\]/);
            
            if (endOfArrayMatch) {
              // We have a complete components array, keep everything up to and including the ]
              cleanedJson = cleanedJson.substring(0, lastCompleteIndex + (endOfArrayMatch.index || 0) + endOfArrayMatch[0].length);
            } else {
              // Components array is incomplete, truncate after last complete component
              cleanedJson = cleanedJson.substring(0, lastCompleteIndex) + '\n    ]';
            }
            
            // Now we need to close the remaining structure
            // Count braces/brackets again after truncation
            const remainingOpenBraces = (cleanedJson.match(/\{/g) || []).length;
            const remainingCloseBraces = (cleanedJson.match(/\}/g) || []).length;
            const remainingOpenBrackets = (cleanedJson.match(/\[/g) || []).length;
            const remainingCloseBrackets = (cleanedJson.match(/\]/g) || []).length;
            
            // Add necessary closing brackets/braces
            for (let i = remainingCloseBrackets; i < remainingOpenBrackets; i++) {
              cleanedJson += ']';
            }
            for (let i = remainingCloseBraces; i < remainingOpenBraces; i++) {
              cleanedJson += '\n}';
            }
          } else {
            // Fallback to previous cleanup method if we can't find components
            cleanedJson = cleanedJson
              .replace(/,\s*"[^"]*":\s*"[^"]*$/g, '') // Remove incomplete key-value pairs
              .replace(/,\s*"[^"]*":\s*$/g, '') // Remove incomplete keys
              .replace(/,\s*\{[^}]*$/g, '') // Remove incomplete objects
              .replace(/,\s*\[[^\]]*$/g, '') // Remove incomplete arrays
              .replace(/,\s*$/g, '') // Remove trailing commas
              .replace(/"[^"]*$/g, ''); // Remove incomplete quoted strings
            
            // Close missing brackets/braces
            for (let i = closeBrackets; i < openBrackets; i++) {
              cleanedJson += ']';
            }
            for (let i = closeBraces; i < openBraces; i++) {
              cleanedJson += '}';
            }
          }
          
          console.log("Fixed JSON length:", cleanedJson.length);
        }
        
        blogData = JSON.parse(cleanedJson);
      } else {
        console.error("No JSON object found in AI response");
        throw new Error("No valid JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing blog generation response:", parseError);
      console.error("Parse error details:", {
        name: (parseError as any).name, 
        message: (parseError as any).message,
        stack: (parseError as any).stack
      });
      
      // Log the problematic JSON section around the error position
      if ((parseError as any).message?.includes("position")) {
        const positionMatch = (parseError as any).message.match(/position (\d+)/);
        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const start = Math.max(0, position - 200);
          const end = Math.min(generatedContent.length, position + 200);
          console.error("JSON context around error position:", {
            position,
            context: generatedContent.substring(start, end),
            before: generatedContent.substring(start, position),
            after: generatedContent.substring(position, end)
          });
        }
      }
      
      // If JSON parsing fails completely, try to create a minimal fallback blog post
      console.log("Attempting to create fallback blog post structure...");
      
      const fallbackBlogPost = {
        blogPost: {
          title: topic || "Generated Blog Post",
          description: "AI-generated blog post content", 
          category: "General",
          readTime: 5,
          seoTitle: (topic || "Generated Blog Post").substring(0, 60),
          seoDescription: "AI-generated blog post content",
          tags: ["ai-generated"]
        },
        components: [
          {
            type: "rich_text",
            order: 0,
            content: `# ${topic || "Generated Blog Post"}\n\nThis blog post content was generated but encountered formatting issues. Please try regenerating with different parameters.`
          }
        ],
        rationale: "Fallback blog post created due to AI response parsing issues. Consider regenerating for better results.",
        _parseError: true,
        _originalError: (parseError as any).message,
        _originalResponse: generatedContent.substring(0, 1000)
      };
      
      return new Response(JSON.stringify(fallbackBlogPost), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Skip image generation in this route - images will be generated separately
    // This allows the blog content to be created quickly without timeout issues
    
    // Mark components that need image generation
    if (includeImages && blogData.components) {
      for (let component of blogData.components) {
        if (component.type === "image" && component.imageDescription) {
          // Mark this component as needing image generation
          component.needsImageGeneration = true;
          // Keep the imageDescription for later processing
          component.alt = component.alt || "Image pending generation";
        }
      }
    }
    
    // Add metadata for image generation
    blogData._imageGenerationData = {
      requiresImageGeneration: includeImages,
      imageContext: imageContext || '',
      referenceImages: referenceImages || [],
      topic: topic,
      title: blogData.blogPost.title
    };

    console.log('[blog/generate] ========== BLOG GENERATION COMPLETED ==========');
    console.log('[blog/generate] Title:', blogData.blogPost.title);
    console.log('[blog/generate] Components:', blogData.components?.length || 0);
    console.log('[blog/generate] Will generate images:', includeImages);
    console.log('[blog/generate] Return only mode:', returnOnly);

    // If returnOnly is true, just return the generated content without saving
    if (returnOnly) {
      console.log('[blog/generate] Returning generated content without saving');
      return new Response(JSON.stringify({
        success: true,
        generated: true,
        saved: false,
        data: blogData
      }), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Otherwise, return as before (for backward compatibility)
    return new Response(JSON.stringify(blogData), {
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error("An error occurred:", error);
    return new Response(
      JSON.stringify({ 
        message: "Error generating blog content",
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
}