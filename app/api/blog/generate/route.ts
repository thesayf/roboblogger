import { NextRequest } from "next/server";
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { isLegacyResearchFormat } from '@/lib/research/research-tools';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

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
      "caption": "Optional caption providing context or attribution",
      "imageDescription": "Detailed visual scene description — describe subjects, actions, environment, mood, colors, and composition. Be specific enough for image generation. Example: 'Professional working at laptop in bright modern office, natural sunlight from large windows, minimalist desk with coffee cup and small potted plant, clean aesthetic, shallow depth of field focusing on person'"
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

// Format research data for injection into the content generation prompt
// Handles both legacy format (stats/quotes/trends) and new brief format
function formatResearchDataForPrompt(researchData: any): string {
  if (!researchData) return '';

  // New brief format — has angle, thesis, briefNarrative
  if (researchData.briefNarrative || researchData.angle) {
    let section = `PRE-RESEARCHED INFORMATION:
A research team has prepared the following editorial brief. This is your primary guide for writing the article.

## Editorial Direction
${researchData.angle ? `**Angle:** ${researchData.angle}\n` : ''}${researchData.thesis ? `**Thesis:** ${researchData.thesis}\n` : ''}${researchData.whyNow ? `**Why Now:** ${researchData.whyNow}\n` : ''}${researchData.gapInCoverage ? `**Gap in Coverage:** ${researchData.gapInCoverage}\n` : ''}
## Research Brief
${researchData.briefNarrative}

`;

    if (researchData.evidence && researchData.evidence.length > 0) {
      // Group evidence by type
      const grouped: Record<string, any[]> = {};
      for (const e of researchData.evidence) {
        const type = e.type || 'finding';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(e);
      }

      const typeLabels: Record<string, string> = {
        statistic: 'Statistics & Data',
        quote: 'Expert Quotes',
        finding: 'Key Findings',
        example: 'Examples & Case Studies',
        data_point: 'Data Points',
      };

      for (const [type, items] of Object.entries(grouped)) {
        section += `## ${typeLabels[type] || type}\n`;
        for (const item of items) {
          section += `- ${item.claim}`;
          if (item.attribution) section += ` (${item.attribution})`;
          if (item.source?.url) section += `\n  Source: ${item.source.title || item.source.url} — ${item.source.url}`;
          section += '\n';
        }
        section += '\n';
      }
    }

    section += `RESEARCH USAGE REQUIREMENTS:
- The research brief above provides your editorial direction — follow the angle and thesis
- Cite evidence with full attribution and source URLs where possible
- Use the brief narrative to frame your article structure
- The research confidence level is "${researchData.confidenceLevel || 'medium'}" - ${researchData.confidenceLevel === 'high' ? 'rely heavily on this data' : researchData.confidenceLevel === 'medium' ? 'use this data while supplementing with general knowledge' : 'use this data sparingly and rely more on established facts'}

`;
    return section;
  }

  // Legacy format — has statistics, expertQuotes, trends arrays
  if (isLegacyResearchFormat(researchData)) {
    let section = `PRE-RESEARCHED INFORMATION:
The following research has been gathered using real-time web search. This is HIGH-QUALITY, VERIFIED data - USE IT!

`;
    if (researchData.narrativeSummary) {
      section += `## The Big Picture\n${researchData.narrativeSummary}\n\n`;
    } else if (researchData.summary) {
      section += `## Research Summary\n${researchData.summary}\n\n`;
    }

    if (researchData.keyInsights && researchData.keyInsights.length > 0) {
      section += `## Key Insights\n${researchData.keyInsights.map((i: any) => `- INSIGHT: ${i.insight}${i.supportingEvidence ? `\n  Evidence: ${i.supportingEvidence}` : ''}${i.articleAngle ? `\n  Use in article: ${i.articleAngle}` : ''}`).join('\n\n')}\n\n`;
    }

    if (researchData.statistics.length > 0) {
      section += `## Statistics\n${researchData.statistics.map((s: any) => `- ${s.fact} (Source: ${s.source}${s.year ? `, ${s.year}` : ''})${s.context ? `\n  Why it matters: ${s.context}` : ''}`).join('\n')}\n\n`;
    }

    if (researchData.expertQuotes.length > 0) {
      section += `## Expert Quotes\n${researchData.expertQuotes.map((q: any) => `- "${q.quote}" — ${q.expert}${q.title ? `, ${q.title}` : ''}${q.organization ? ` at ${q.organization}` : ''}${q.context ? `\n  Context: ${q.context}` : ''}`).join('\n')}\n\n`;
    }

    if (researchData.trends && researchData.trends.length > 0) {
      section += `## Current Trends\n${researchData.trends.map((t: any) => `- ${t.trend}${t.source ? ` (${t.source})` : ''}${t.implication ? `\n  Implication: ${t.implication}` : ''}`).join('\n')}\n\n`;
    }

    if (researchData.counterpoints && researchData.counterpoints.length > 0) {
      section += `## Nuances & Counterpoints\n${researchData.counterpoints.map((c: any) => `- ${c.point}${c.context ? `\n  Context: ${c.context}` : ''}`).join('\n')}\n\n`;
    }

    if (researchData.keyPoints && researchData.keyPoints.length > 0) {
      section += `## Key Points to Cover\n${researchData.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n\n`;
    }

    section += `CRITICAL RESEARCH USAGE REQUIREMENTS:
- ALWAYS cite statistics with attribution
- Use expert quotes with full attribution (name, title, organization)
- Include counterpoints for nuance - don't oversimplify
- The research confidence level is "${researchData.confidenceLevel}" - ${researchData.confidenceLevel === 'high' ? 'rely heavily on this data' : researchData.confidenceLevel === 'medium' ? 'use this data while supplementing with general knowledge' : 'use this data sparingly and rely more on established facts'}

`;
    return section;
  }

  return '';
}

// Helper functions for web search (writer agent)
async function searchWebWithExa(query: string, numResults: number = 3) {
  try {
    if (!process.env.EXA_API_KEY) return { error: 'Exa search unavailable — EXA_API_KEY not configured' };
    const { ExaProvider } = await import('@/lib/ai-providers/exa-provider');
    const exa = new ExaProvider({ apiKey: process.env.EXA_API_KEY });
    const response = await exa.searchContent({ query, numResults: Math.min(numResults, 5) });
    return response.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.highlights?.join(' ') || r.text?.substring(0, 300) || '',
      publishedDate: r.publishedDate,
    }));
  } catch (error) {
    console.error('Error in searchWebWithExa:', error);
    return { error: 'Web search failed' };
  }
}

async function findSimilarWebContent(url: string, numResults: number = 3) {
  try {
    if (!process.env.EXA_API_KEY) return { error: 'Exa search unavailable — EXA_API_KEY not configured' };
    const { ExaProvider } = await import('@/lib/ai-providers/exa-provider');
    const exa = new ExaProvider({ apiKey: process.env.EXA_API_KEY });
    const response = await exa.findSimilar({ url, numResults: Math.min(numResults, 5) });
    return response.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.highlights?.join(' ') || r.text?.substring(0, 300) || '',
    }));
  } catch (error) {
    console.error('Error in findSimilarWebContent:', error);
    return { error: 'Similar content search failed' };
  }
}

async function quickWebSearch(query: string) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) return { error: 'Perplexity unavailable — PERPLEXITY_API_KEY not configured' };
    const { PerplexityProvider } = await import('@/lib/ai-providers/perplexity-provider');
    const perplexity = new PerplexityProvider({ apiKey: process.env.PERPLEXITY_API_KEY, model: 'sonar' });
    const response = await perplexity.generateCompletion({ prompt: query, maxTokens: 1000, temperature: 0.1 });
    return {
      answer: response.content,
      citations: (response as any).citations || [],
    };
  } catch (error) {
    console.error('Error in quickWebSearch:', error);
    return { error: 'Quick web search failed' };
  }
}

// Helper functions for internal linking
async function searchBlogsByKeywords(keywords: string[], limit: number = 5) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
    researchData, // Pre-researched data from agentic research phase
    internalLinks, // Pre-planned internal links
    returnOnly = false // New parameter to control whether to save or just return
  } = body;

  console.log('[blog/generate] Topic:', topic);
  console.log('[blog/generate] Length:', length);
  console.log('[blog/generate] Include Images:', includeImages);
  console.log('[blog/generate] SEO Keywords:', seo?.primaryKeyword || 'none');
  console.log('[blog/generate] Has research data:', !!researchData);
  if (researchData) {
    console.log('[blog/generate] Research confidence:', researchData.confidenceLevel);
    console.log('[blog/generate] Research stats:', researchData.statistics?.length || 0, 'statistics,', researchData.expertQuotes?.length || 0, 'quotes');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ message: "Missing Anthropic API key" }),
      { status: 500 }
    );
  }

  // Check credits before generation
  const currentUser = await getCurrentUser();
  let userForCredits: any = null;

  if (currentUser) {
    await dbConnect();
    userForCredits = await User.findOne({ clerkId: currentUser.clerkId });

    if (userForCredits) {
      // Check if user has active subscription
      const hasActiveSubscription = userForCredits.subscriptionStatus === 'active' ||
                                    userForCredits.subscriptionStatus === 'trialing';

      if (!hasActiveSubscription) {
        console.log('[blog/generate] User does not have active subscription');
        return new Response(
          JSON.stringify({
            message: "Subscription required",
            error: "SUBSCRIPTION_REQUIRED",
            subscriptionStatus: userForCredits.subscriptionStatus
          }),
          { status: 402 }
        );
      }

      // Check if user has credits
      if (userForCredits.credits < 1) {
        console.log('[blog/generate] User has insufficient credits:', userForCredits.credits);
        return new Response(
          JSON.stringify({
            message: "Insufficient credits",
            error: "INSUFFICIENT_CREDITS",
            credits: userForCredits.credits
          }),
          { status: 402 }
        );
      }

      console.log('[blog/generate] User credits check passed:', userForCredits.credits);
    }
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

` : ''}${researchData ? formatResearchDataForPrompt(researchData) : ''}USER REQUIREMENTS:
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
   - Choose the best component type for each piece of content:
     * Data with numbers → bar_chart, line_chart, or pie_chart
     * Feature comparisons → comparison_table or pros_cons
     * Processes or history → timeline, flowchart, or step_by_step
     * Visual concepts, scenes, products → image
     * Explanatory content → rich_text with formatting

3. Visual Components:
   - bar_chart: For comparing metrics, survey results, market data
   - line_chart: For showing trends, growth patterns over time
   - pie_chart: For market share, demographics, percentage breakdowns
   - comparison_table: For side-by-side feature/pricing/product comparisons
   - pros_cons: For two-column advantages/disadvantages analysis
   - timeline: For project phases, company history, chronological processes
   - flowchart: For decision trees, user journeys, simple workflows
   - step_by_step: For numbered process guides with progress tracking

4. Image Guidelines:
   - Include images when they add visual value: hero shots, product visuals, concept illustrations, real-world examples, before/after comparisons
   - The number of images should match the content's needs — a design post might use several, a technical post might use none
   - Provide detailed imageDescription for each image: describe the visual scene with specifics about subjects, actions, environment, mood, colors, and composition
   - Write meaningful alt text for accessibility
   - Captions are optional — include them when they add context or attribution
   - Good example: "Modern home office with person working on laptop, bright natural lighting, minimalist desk setup with plants, warm afternoon light"

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
${internalLinks && internalLinks.length > 0 ? `   The following posts have been pre-selected for internal linking. Weave 2-4 of these links naturally into your content where they add value for readers.
   Format links as: [anchor text](/blog/slug)

   Posts to link to:
${internalLinks.map((link: any) => `   - "${link.title}" (/blog/${link.slug})${link.description ? ` — ${link.description}` : ''}`).join('\n')}

   IMPORTANT: Do NOT use search tools. Links have already been selected for you.` : `   - BEFORE writing the blog content, search for related posts using the available tools
   - Call searchRelatedBlogs with your main topic to find relevant content
   - Call searchBlogsByKeywords with key terms from your topic
   - Use the results to include 2-4 strategic internal links naturally in your content
   - Format internal links as: [anchor text](/blog/slug)
   - Only link to posts that genuinely add value for readers
   - IMPORTANT: You MUST use the search tools before generating content`}

11. Component Ordering:
   - Order components logically for content flow
   - Use incremental numbers (0, 1, 2, 3, etc.)
   - Ensure smooth transitions between components
   - Place CTA components strategically (usually near end)

12. Web Search for Enhancement:
   - You have web search tools (searchWeb, quickFactCheck, findSimilarContent) to enhance your writing
   - Use searchWeb to find specific examples, case studies, or data points to strengthen your content
   - Use quickFactCheck to verify any claims or statistics you're uncertain about
   - Do NOT re-research the topic from scratch — the pre-researched data above is comprehensive
   - Limit web searches to 2-4 targeted queries maximum — be surgical, not exploratory
   - If research data is already provided and confidence is "high", you may skip web searches entirely

IMPORTANT NOTES:
- For image descriptions, be specific and detailed - these will be used for AI image generation
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

  // When internal links are pre-planned, skip search tools entirely
  const hasPrePlannedLinks = internalLinks && internalLinks.length > 0;

  try {
    console.log("Sending blog generation request to Anthropic API");
    console.log("[blog/generate] Pre-planned internal links:", hasPrePlannedLinks ? internalLinks.length : 'none (will use search tools)');

    // Internal blog search tools (for internal linking)
    const blogSearchTools = [
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
        ];

    // Web search tools (for fact-checking and enrichment)
    const webSearchTools = [
      {
        name: "searchWeb",
        description: "Search the web for current information, examples, data, or details to enhance your content. Use for verification, finding specific examples, or discovering relevant content. Do NOT use this to redo the pre-researched information — use it to supplement and verify.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for web content"
            },
            numResults: {
              type: "number",
              description: "Number of results to return (default: 3, max: 5)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "findSimilarContent",
        description: "Find web content similar to a given URL. Useful when you find a good source and want to discover related resources.",
        input_schema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to find similar content for"
            },
            numResults: {
              type: "number",
              description: "Number of results to return (default: 3)"
            }
          },
          required: ["url"]
        }
      },
      {
        name: "quickFactCheck",
        description: "Quick fact verification using web search. Use for verifying specific claims, statistics, or checking if information is current. Returns a concise answer with citations.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The claim or question to verify"
            }
          },
          required: ["query"]
        }
      }
    ];

    // Combine tools: always include web search, add blog search if no pre-planned links
    const allTools = hasPrePlannedLinks
      ? webSearchTools
      : [...blogSearchTools, ...webSearchTools];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 16384,
        temperature: 0.7,
        tools: allTools,
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
    
    // Continue conversation until we get final blog content (max 15 iterations)
    for (let iteration = 0; iteration < 15; iteration++) {
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
                // Internal blog search tools
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
                // Web search tools
                case 'searchWeb':
                  toolResult = await searchWebWithExa(toolUse.input.query, toolUse.input.numResults);
                  break;
                case 'findSimilarContent':
                  toolResult = await findSimilarWebContent(toolUse.input.url, toolUse.input.numResults);
                  break;
                case 'quickFactCheck':
                  toolResult = await quickWebSearch(toolUse.input.query);
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
              model: "claude-opus-4-6",
              max_tokens: 16384,
              temperature: 0.7,
              tools: allTools,
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

    // Deduct credit on successful generation
    if (userForCredits) {
      userForCredits.credits -= 1;
      userForCredits.lifetimeCreditsUsed += 1;
      await userForCredits.save();
      console.log('[blog/generate] Deducted 1 credit. Remaining:', userForCredits.credits);
    }

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