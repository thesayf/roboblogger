/**
 * Tools for the unified blog generation agent
 * Each tool uses betaZodTool from the Anthropic SDK
 */

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import BlogComponent from '@/models/BlogComponent';
import Topic from '@/models/Topic';
import TopicCluster from '@/models/TopicCluster';
import { PerplexityProvider } from '@/lib/ai-providers/perplexity-provider';
import { ExaProvider } from '@/lib/ai-providers/exa-provider';
import {
  generateImageWithGPTImage,
  uploadImageToImageKit,
  buildImageStylePrompt,
  analyzeReferenceImages,
} from './image-utils';

export interface GenerationToolContext {
  ownerId: string;
  ownerClerkId: string;
  topicId: string;
  imageContext: string;
  referenceImages: string[];
  deferFailureStatus?: boolean;
  // Cached after first image tool call
  _referenceAnalysis?: string;
  _stylePrompt?: string;
}

// Lazy-initialized providers
let perplexityProvider: PerplexityProvider | null = null;
let exaProvider: ExaProvider | null = null;

function getPerplexity(): PerplexityProvider | null {
  if (!process.env.PERPLEXITY_API_KEY) return null;
  if (!perplexityProvider) {
    perplexityProvider = new PerplexityProvider({ apiKey: process.env.PERPLEXITY_API_KEY, model: 'sonar-pro' });
  }
  return perplexityProvider;
}

function getExa(): ExaProvider | null {
  if (!process.env.EXA_API_KEY) return null;
  if (!exaProvider) {
    exaProvider = new ExaProvider({ apiKey: process.env.EXA_API_KEY });
  }
  return exaProvider;
}

export function buildGenerationTools(ctx: GenerationToolContext) {
  return [
    // ========================================================================
    // RESEARCH TOOLS
    // ========================================================================

    betaZodTool({
      name: 'searchTopicInfo',
      description: 'Search for factual information using real-time web search. Find statistics, trends, news, and data.',
      inputSchema: z.object({
        query: z.string().describe('Specific search query'),
        infoType: z.enum(['statistics', 'trends', 'news', 'how-to', 'general']).describe('Type of information'),
        recency: z.enum(['last-week', 'last-month', 'last-year', 'any']).optional().describe('How recent'),
      }),
      run: async (input) => {
        const provider = getPerplexity();
        if (!provider) return JSON.stringify({ error: 'Perplexity not configured' });
        try {
          const response = await provider.searchTopicInfo({
            query: input.query,
            infoType: input.infoType,
            recency: input.recency || 'last-year',
          });
          return JSON.stringify({ content: response.content, citations: response.citations || [] });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' });
        }
      },
    }),

    betaZodTool({
      name: 'searchExpertOpinions',
      description: 'Search for expert opinions, quotes, research studies, and industry reports.',
      inputSchema: z.object({
        query: z.string().describe('Search query for expert insights'),
        expertiseArea: z.string().describe('Field of expertise'),
        sourceType: z.enum(['academic', 'industry', 'practitioner', 'any']).optional(),
      }),
      run: async (input) => {
        const provider = getPerplexity();
        if (!provider) return JSON.stringify({ error: 'Perplexity not configured' });
        try {
          const response = await provider.searchExpertOpinions({
            query: input.query,
            expertiseArea: input.expertiseArea,
            sourceType: input.sourceType || 'any',
          });
          return JSON.stringify({ content: response.content, citations: response.citations || [] });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' });
        }
      },
    }),

    betaZodTool({
      name: 'searchWithExa',
      description: 'Neural search for high-quality source documents, articles, and research papers. Returns actual URLs with content excerpts.',
      inputSchema: z.object({
        query: z.string().describe('Search query — natural language or topic description'),
        numResults: z.number().optional().describe('Results to return (default 5, max 10)'),
        category: z.enum(['research paper', 'news', 'company', 'personal site']).optional(),
        includeDomains: z.array(z.string()).optional().describe('Only search these domains'),
        startDate: z.string().optional().describe('Only results after this date (ISO format)'),
      }),
      run: async (input) => {
        const provider = getExa();
        if (!provider) return JSON.stringify({ error: 'Exa not configured' });
        try {
          const response = await provider.searchContent({
            query: input.query,
            numResults: Math.min(input.numResults || 5, 10),
            category: input.category,
            includeDomains: input.includeDomains,
            startPublishedDate: input.startDate,
          });
          return JSON.stringify({
            results: response.results.map(r => ({
              title: r.title, url: r.url,
              highlights: r.highlights,
              text: r.text?.substring(0, 2000),
              publishedDate: r.publishedDate, author: r.author,
            }))
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Exa search failed' });
        }
      },
    }),

    betaZodTool({
      name: 'findSimilarContent',
      description: 'Find web pages semantically similar to a given URL. Great for discovering related articles.',
      inputSchema: z.object({
        url: z.string().describe('URL to find similar content for'),
        numResults: z.number().optional().describe('Number of results (default 5)'),
      }),
      run: async (input) => {
        const provider = getExa();
        if (!provider) return JSON.stringify({ error: 'Exa not configured' });
        try {
          const response = await provider.findSimilar({ url: input.url, numResults: input.numResults || 5 });
          return JSON.stringify({
            results: response.results.map(r => ({
              title: r.title, url: r.url,
              highlights: r.highlights,
              text: r.text?.substring(0, 2000),
            }))
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'FindSimilar failed' });
        }
      },
    }),

    betaZodTool({
      name: 'getFullContent',
      description: 'Retrieve full text of specific web pages. Use after finding a source via search to read it in detail.',
      inputSchema: z.object({
        urls: z.array(z.string()).max(3).describe('URLs to retrieve (max 3)'),
      }),
      run: async (input) => {
        const provider = getExa();
        if (!provider) return JSON.stringify({ error: 'Exa not configured' });
        try {
          const response = await provider.getContents({ urls: input.urls });
          return JSON.stringify({
            results: response.results.map(r => ({
              title: r.title, url: r.url,
              text: r.text?.substring(0, 5000),
              author: r.author,
            }))
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'GetContents failed' });
        }
      },
    }),

    // ========================================================================
    // INTERNAL LINKING
    // ========================================================================

    betaZodTool({
      name: 'searchInternalPosts',
      description: 'Search existing published blog posts for internal linking. Returns titles and slugs you can link to.',
      inputSchema: z.object({
        query: z.string().describe('Topic or keywords to search for'),
        limit: z.number().optional().describe('Max results (default 5)'),
      }),
      run: async (input) => {
        try {
          await dbConnect();
          const keywords = input.query.split(/\s+/).filter((w: string) => w.length > 2);
          const regexes = keywords.map((k: string) => new RegExp(k, 'i'));

          const posts = await BlogPost.find({
            owner: ctx.ownerId,
            status: 'published',
            $or: regexes.flatMap(r => [
              { title: { $regex: r } },
              { description: { $regex: r } },
              { tags: { $regex: r } },
            ]),
          })
            .select('title slug description category tags')
            .sort({ createdAt: -1 })
            .limit(input.limit || 5)
            .lean();

          return JSON.stringify(posts.map((p: any) => ({
            title: p.title,
            slug: p.slug,
            description: p.description,
            category: p.category,
          })));
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' });
        }
      },
    }),

    // ========================================================================
    // IMAGE TOOLS
    // ========================================================================

    betaZodTool({
      name: 'generateImage',
      description: 'Generate an image from a description and upload it. Returns the image URL. Use for featured images and in-content images.',
      inputSchema: z.object({
        description: z.string().describe('Detailed visual scene description for image generation'),
        fileName: z.string().optional().describe('File name hint (default: auto-generated)'),
      }),
      run: async (input) => {
        try {
          // Lazy-init style analysis
          if (ctx._stylePrompt === undefined) {
            const analysis = ctx.referenceImages.length > 0
              ? await analyzeReferenceImages(ctx.referenceImages)
              : '';
            ctx._referenceAnalysis = analysis;
            ctx._stylePrompt = buildImageStylePrompt(ctx.imageContext, analysis);
          }

          const imageUrl = await generateImageWithGPTImage(
            input.description,
            ctx._stylePrompt || '',
            ctx._referenceAnalysis || '',
          );

          if (!imageUrl) {
            return JSON.stringify({ error: 'Image generation failed' });
          }

          const fileName = input.fileName || `gen-${Date.now()}.png`;
          const uploaded = await uploadImageToImageKit(imageUrl, fileName, ctx.ownerId);

          if (!uploaded) {
            return JSON.stringify({ error: 'Image upload failed' });
          }

          return JSON.stringify({
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl,
            fileId: uploaded.fileId,
            width: uploaded.width,
            height: uploaded.height,
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Image generation failed' });
        }
      },
    }),

    betaZodTool({
      name: 'viewImage',
      description: 'Evaluate a generated image using vision. Use to check if an image matches the intended description and brand style.',
      inputSchema: z.object({
        imageUrl: z.string().describe('URL of the image to evaluate'),
        intendedDescription: z.string().describe('What the image was supposed to depict'),
        brandGuidelines: z.string().optional().describe('Brand style criteria to evaluate against'),
      }),
      run: async (input) => {
        try {
          const client = new Anthropic();
          const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'url', url: input.imageUrl },
                },
                {
                  type: 'text',
                  text: `Evaluate this image:\n\nIntended description: "${input.intendedDescription}"\n${input.brandGuidelines ? `Brand guidelines: ${input.brandGuidelines}\n` : ''}\nRate 1-10 for:\n1. Accuracy to description\n2. Visual quality\n3. Brand fit\n\nBriefly explain any issues. Should this be regenerated? (yes/no)`,
                },
              ],
            }],
          });

          const text = response.content.find((b: any) => b.type === 'text');
          return (text as any)?.text || 'Unable to evaluate image';
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Vision evaluation failed' });
        }
      },
    }),

    // ========================================================================
    // SAVE AND STATUS TOOLS
    // ========================================================================

    betaZodTool({
      name: 'saveBlogPost',
      description: 'Save the complete blog post to the database. Call this with the full blog post JSON including image URLs. Returns the saved post ID.',
      inputSchema: z.object({
        blogPost: z.object({
          title: z.string(),
          description: z.string(),
          slug: z.string(),
          category: z.string().optional(),
          readTime: z.number().optional(),
          seoTitle: z.string().optional(),
          seoDescription: z.string().optional(),
          tags: z.array(z.string()).optional(),
          featuredImage: z.string().optional(),
          featuredImageThumbnail: z.string().optional(),
        }),
        components: z.array(z.object({
          type: z.string(),
          order: z.number(),
        }).passthrough()),
      }),
      run: async (input) => {
        try {
          await dbConnect();

          // A provider fallback may retry after the first provider already saved.
          // Return that post instead of publishing a duplicate.
          const topic = await Topic.findById(ctx.topicId)
            .select('generatedPostId clusterId seriesId')
            .lean() as any;
          if (topic?.generatedPostId) {
            const savedPost = await BlogPost.findOne({
              _id: topic.generatedPostId,
              owner: ctx.ownerId,
            }).select('_id slug components').lean() as any;

            if (savedPost) {
              return JSON.stringify({
                success: true,
                alreadySaved: true,
                postId: savedPost._id.toString(),
                slug: savedPost.slug,
                componentsCount: savedPost.components?.length || 0,
              });
            }
          }

          // Check slug uniqueness
          const existing = await BlogPost.findOne({ slug: input.blogPost.slug });
          if (existing) {
            // Auto-append timestamp to make unique
            input.blogPost.slug = `${input.blogPost.slug}-${Date.now()}`;
          }

          // Create BlogPost
          const blogPost = new BlogPost({
            ...input.blogPost,
            owner: ctx.ownerId,
            author: ctx.ownerId,
            sourceTopicId: ctx.topicId,
            clusterId: topic?.clusterId,
            seriesId: topic?.seriesId,
            status: 'published',
            publishedAt: new Date(),
            createdBy: 'system',
            source: 'queue-generation',
          });
          await blogPost.save();

          await TopicCluster.findOneAndUpdate(
            { owner: ctx.ownerId, primaryPillarTopicId: ctx.topicId },
            { $set: { primaryPillarPostId: blogPost._id } }
          );

          // Create BlogComponents
          if (input.components && input.components.length > 0) {
            const componentPromises = input.components.map((comp: any, index: number) => {
              const component = new BlogComponent({
                blogPost: blogPost._id,
                type: comp.type,
                order: index,
                ...comp,
              });
              return component.save();
            });

            const savedComponents = await Promise.all(componentPromises);
            blogPost.components = savedComponents.map((c: any) => c._id);
            await blogPost.save();
          }

          // Update topic with generated post ID
          await Topic.findByIdAndUpdate(ctx.topicId, {
            generatedPostId: blogPost._id.toString(),
          });

          console.log(`[generation] Blog post saved: ${blogPost._id} "${input.blogPost.title}"`);

          return JSON.stringify({
            success: true,
            postId: blogPost._id.toString(),
            slug: input.blogPost.slug,
            componentsCount: input.components?.length || 0,
          });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Save failed' });
        }
      },
    }),

    betaZodTool({
      name: 'updateTopicStatus',
      description: 'Mark the topic as completed or failed. Call this as the final step after saving the blog post.',
      inputSchema: z.object({
        status: z.enum(['completed', 'failed']).describe('Final status'),
        errorMessage: z.string().optional().describe('Error message if failed'),
      }),
      run: async (input) => {
        try {
          await dbConnect();
          const topic = await Topic.findById(ctx.topicId);
          if (!topic) return JSON.stringify({ error: 'Topic not found' });

          if (input.status === 'completed') {
            if (!topic.generatedPostId) {
              return JSON.stringify({ error: 'Cannot mark completed — no post has been saved yet. Call saveBlogPost first.' });
            }
            await topic.markAsCompleted(topic.generatedPostId);
            console.log(`[generation] Topic ${ctx.topicId} marked completed`);
          } else {
            if (ctx.deferFailureStatus) {
              return JSON.stringify({
                success: false,
                deferred: true,
                message: 'The generation runner will handle failure and provider fallback.',
              });
            }
            await topic.markAsFailed(input.errorMessage || 'Generation failed');
            console.log(`[generation] Topic ${ctx.topicId} marked failed: ${input.errorMessage}`);
          }

          return JSON.stringify({ success: true, status: input.status });
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Status update failed' });
        }
      },
    }),
  ];
}
