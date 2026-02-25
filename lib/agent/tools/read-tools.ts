import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import { executeSearchExistingContent } from '@/lib/seo-research/tool-executors';
import { searchChatsByEmbedding } from '../embeddings';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
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
  ];
}
