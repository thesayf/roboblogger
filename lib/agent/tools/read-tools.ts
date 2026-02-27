import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import { executeSearchExistingContent } from '@/lib/seo-research/tool-executors';
import { searchChatsByEmbedding } from '../embeddings';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import BlogComponent from '@/models/BlogComponent';
import Topic from '@/models/Topic';
import BrandSettings from '@/models/BrandSettings';

function wrapTool(ctx: ToolContext, toolName: string, fn: (input: any) => Promise<string>) {
  return async (input: any): Promise<string> => {
    const callInfo: ToolCallInfo = { name: toolName, input, success: false };
    ctx.toolCalls.push(callInfo);
    ctx.sendEvent('tool_start', { toolName, toolInput: input });

    try {
      const result = await fn(input);
      callInfo.result = result;
      callInfo.success = true;
      ctx.sendEvent('tool_end', { toolName, success: true });
      return result;
    } catch (error: any) {
      callInfo.success = false;
      ctx.sendEvent('tool_end', { toolName, success: false });
      return JSON.stringify({ error: error.message });
    }
  };
}

export function buildReadTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'get_existing_posts',
      description: 'Search existing blog posts and queued topics using semantic search. Use this to check if similar content already exists before suggesting new topics.',
      inputSchema: z.object({
        query: z.string().describe('Search query to find similar existing content'),
        limit: z.number().optional().describe('Max results (default 10)'),
        includeQueued: z.boolean().optional().describe('Include queued topics in results (default true)'),
      }),
      run: wrapTool(ctx, 'get_existing_posts', async (input) => {
        const result = await executeSearchExistingContent(input, ctx.userId);
        return JSON.stringify(result);
      }),
    }),

    betaZodTool({
      name: 'get_blog_stats',
      description: 'Get blog statistics including total posts, recent posts, and queue status. Use this to understand the current state of the blog.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'get_blog_stats', async () => {
        await dbConnect();

        const [
          totalPosts,
          publishedPosts,
          draftPosts,
          recentPosts,
          queueStats,
        ] = await Promise.all([
          BlogPost.countDocuments({ owner: ctx.userId }),
          BlogPost.countDocuments({ owner: ctx.userId, status: 'published' }),
          BlogPost.countDocuments({ owner: ctx.userId, status: 'draft' }),
          BlogPost.find({ owner: ctx.userId, status: 'published' })
            .sort({ publishedAt: -1 })
            .limit(5)
            .select('title slug publishedAt tags')
            .lean(),
          Topic.aggregate([
            { $match: { owner: { $exists: true } } },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ]).then((stats) => {
            const map: Record<string, number> = {};
            stats.forEach((s: any) => { map[s._id] = s.count; });
            return map;
          }),
        ]);

        return JSON.stringify({
          totalPosts,
          publishedPosts,
          draftPosts,
          recentPosts: recentPosts.map((p: any) => ({
            title: p.title,
            slug: p.slug,
            publishedAt: p.publishedAt?.toISOString(),
            tags: p.tags,
          })),
          queue: {
            pending: queueStats['pending'] || 0,
            generating: queueStats['generating'] || 0,
            completed: queueStats['completed'] || 0,
            failed: queueStats['failed'] || 0,
          },
        });
      }),
    }),

    betaZodTool({
      name: 'get_brand_settings',
      description: 'Get the user\'s brand settings including blog name, target audience, tone, content guidelines, and industry niche.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'get_brand_settings', async () => {
        await dbConnect();
        const settings = await BrandSettings.findOne({ userId: ctx.userId }).lean();

        if (!settings) {
          return JSON.stringify({ error: 'No brand settings configured yet. Suggest the user set up their brand settings in the Brand tab.' });
        }

        return JSON.stringify({
          blogName: (settings as any).blogName,
          blogDescription: (settings as any).blogDescription,
          targetAudience: (settings as any).targetAudience,
          tone: (settings as any).tone,
          customTone: (settings as any).customTone,
          styleGuidelines: (settings as any).styleGuidelines,
          topicsWeCover: (settings as any).topicsWeCover,
          thingsToAvoid: (settings as any).thingsToAvoid,
          industryNiche: (settings as any).industryNiche,
        });
      }),
    }),

    betaZodTool({
      name: 'get_topics_queue',
      description: 'Get the current topic generation queue with statuses, priorities, and scheduling info.',
      inputSchema: z.object({
        status: z.enum(['pending', 'generating', 'completed', 'failed', 'all']).optional().describe('Filter by status (default: all)'),
        limit: z.number().optional().describe('Max results (default 20)'),
      }),
      run: wrapTool(ctx, 'get_topics_queue', async (input) => {
        await dbConnect();
        const filter: any = { owner: ctx.userId };
        if (input.status && input.status !== 'all') {
          filter.status = input.status;
        }

        const topics = await Topic.find(filter)
          .sort({ priority: -1, createdAt: -1 })
          .limit(input.limit || 20)
          .select('topic status priority scheduledAt seo.primaryKeyword tags createdAt')
          .lean();

        return JSON.stringify({
          count: topics.length,
          topics: topics.map((t: any) => ({
            id: t._id.toString(),
            topic: t.topic,
            status: t.status,
            priority: t.priority,
            scheduledAt: t.scheduledAt?.toISOString(),
            primaryKeyword: t.seo?.primaryKeyword,
            tags: t.tags,
            createdAt: t.createdAt?.toISOString(),
          })),
        });
      }),
    }),

    betaZodTool({
      name: 'search_chat_history',
      description: 'Search past conversations semantically. Use this to recall what was discussed previously, find past decisions, or reference earlier research.',
      inputSchema: z.object({
        query: z.string().describe('What to search for in past conversations'),
        limit: z.number().optional().describe('Max results (default 10)'),
      }),
      run: wrapTool(ctx, 'search_chat_history', async (input) => {
        const results = await searchChatsByEmbedding(
          ctx.userId,
          input.query,
          input.limit || 10
        );

        if (results.length === 0) {
          return JSON.stringify({ message: 'No relevant past conversations found.' });
        }

        return JSON.stringify({
          results: results.map((r) => ({
            role: r.role,
            content: r.content.slice(0, 500),
            date: r.date,
            relevance: r.score,
          })),
        });
      }),
    }),

    betaZodTool({
      name: 'get_media_images',
      description: 'Browse images in the media library (ImageKit). Returns image URLs, names, and metadata. Use this to find existing images that could be used as reference images for topics.',
      inputSchema: z.object({
        limit: z.number().optional().describe('Max images to return (default 20)'),
        skip: z.number().optional().describe('Number of images to skip for pagination (default 0)'),
      }),
      run: wrapTool(ctx, 'get_media_images', async (input) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const params = new URLSearchParams();
        params.set('limit', String(input.limit || 20));
        params.set('skip', String(input.skip || 0));

        const response = await fetch(`${baseUrl}/api/images?${params.toString()}`);
        if (!response.ok) {
          return JSON.stringify({ error: 'Failed to fetch images from media library' });
        }

        const data = await response.json();
        return JSON.stringify({
          total: data.total,
          images: (data.images || []).map((img: any) => ({
            name: img.name,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            width: img.width,
            height: img.height,
            format: img.format,
            createdAt: img.createdAt,
          })),
        });
      }),
    }),

    betaZodTool({
      name: 'view_image',
      description: 'View and analyze an image by URL using vision. Fetches the image and returns a detailed visual description. Use after get_media_images to examine specific images closely.',
      inputSchema: z.object({
        url: z.string().describe('Image URL to view (from get_media_images results or any ImageKit URL)'),
        prompt: z.string().optional().describe('Optional specific question about the image (e.g., "describe the color palette", "what style is this"). Defaults to a comprehensive visual description.'),
      }),
      run: wrapTool(ctx, 'view_image', async (input) => {
        const { url, prompt } = input;

        // Fetch image and convert to base64
        const response = await fetch(url);
        if (!response.ok) {
          return JSON.stringify({ error: `Failed to fetch image: ${response.status} ${response.statusText}` });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const mediaType = contentType.split(';')[0].trim() as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // ~10MB base64 limit (roughly 7.5MB image)
        if (base64.length > 10_000_000) {
          return JSON.stringify({ error: 'Image is too large to analyze. Try a smaller image or a thumbnail URL.' });
        }

        const visionPrompt = prompt || 'Describe this image in detail. Include: the subject/content, color palette, visual style (photographic, illustration, abstract, etc.), mood/atmosphere, composition, and any notable elements. Be specific and concise.';

        const anthropic = new Anthropic();
        const visionResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: visionPrompt,
                },
              ],
            },
          ],
        });

        const description = visionResponse.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('\n');

        return JSON.stringify({ url, description });
      }),
    }),

    betaZodTool({
      name: 'get_post',
      description: 'Read a single blog post with all its components. Use this before editing a post to see its full content and component IDs.',
      inputSchema: z.object({
        postId: z.string().describe('The blog post ID to read'),
      }),
      run: wrapTool(ctx, 'get_post', async (input) => {
        await dbConnect();

        const post = await BlogPost.findOne({ _id: input.postId, owner: ctx.userId })
          .select('title description slug status tags category seoTitle seoDescription featuredImage featuredImageThumbnail readTime publishedAt createdAt')
          .lean();

        if (!post) {
          return JSON.stringify({ error: 'Post not found or not owned by this user.' });
        }

        const components = await BlogComponent.find({ blogPost: input.postId })
          .sort({ order: 1 })
          .lean();

        return JSON.stringify({
          id: (post as any)._id.toString(),
          title: (post as any).title,
          description: (post as any).description,
          slug: (post as any).slug,
          status: (post as any).status,
          tags: (post as any).tags,
          category: (post as any).category,
          seoTitle: (post as any).seoTitle,
          seoDescription: (post as any).seoDescription,
          featuredImage: (post as any).featuredImage,
          featuredImageThumbnail: (post as any).featuredImageThumbnail,
          readTime: (post as any).readTime,
          publishedAt: (post as any).publishedAt,
          createdAt: (post as any).createdAt,
          components: components.map((c: any) => {
            const base: any = {
              id: c._id.toString(),
              type: c.type,
              order: c.order,
            };
            // Include type-specific fields
            if (c.content) base.content = c.content;
            if (c.url) base.url = c.url;
            if (c.src) base.src = c.src;
            if (c.alt) base.alt = c.alt;
            if (c.caption) base.caption = c.caption;
            if (c.variant) base.variant = c.variant;
            if (c.title) base.title = c.title;
            if (c.author) base.author = c.author;
            if (c.citation) base.citation = c.citation;
            if (c.text) base.text = c.text;
            if (c.link) base.link = c.link;
            if (c.style) base.style = c.style;
            if (c.data) base.data = c.data;
            if (c.videoUrl) base.videoUrl = c.videoUrl;
            if (c.videoTitle) base.videoTitle = c.videoTitle;
            if (c.headers) base.headers = c.headers;
            if (c.rows) base.rows = c.rows;
            if (c.tableCaption) base.tableCaption = c.tableCaption;
            if (c.tableStyle) base.tableStyle = c.tableStyle;
            return base;
          }),
        });
      }),
    }),
  ];
}
