import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import BlogPost from '@/models/BlogPost';

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

export function buildActionTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'create_topic',
      description: 'Add a single topic to the blog generation queue. The topic will be researched and a blog post will be generated automatically.',
      inputSchema: z.object({
        topic: z.string().describe('The blog topic/title'),
        audience: z.string().optional().describe('Target audience for this post'),
        tone: z.string().optional().describe('Writing tone (e.g., professional, casual, technical)'),
        length: z.string().optional().describe('Post length (e.g., short, medium, long)'),
        priority: z.enum(['low', 'medium', 'high']).optional().describe('Generation priority (default: medium)'),
        primaryKeyword: z.string().optional().describe('Primary SEO keyword'),
        secondaryKeywords: z.array(z.string()).optional().describe('Secondary SEO keywords'),
        searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional().describe('Search intent for SEO'),
        tags: z.array(z.string()).optional().describe('Tags for organization'),
        scheduledAt: z.string().optional().describe('ISO date string for scheduled generation'),
        additionalRequirements: z.string().optional().describe('Additional instructions for content generation'),
      }),
      run: wrapTool(ctx, 'create_topic', async (input) => {
        await dbConnect();

        const topic = await Topic.create({
          topic: input.topic,
          audience: input.audience,
          tone: input.tone,
          length: input.length,
          priority: input.priority || 'medium',
          source: 'individual',
          owner: ctx.userId,
          tags: input.tags,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          additionalRequirements: input.additionalRequirements,
          seo: (input.primaryKeyword || input.secondaryKeywords || input.searchIntent) ? {
            primaryKeyword: input.primaryKeyword,
            secondaryKeywords: input.secondaryKeywords,
            searchIntent: input.searchIntent,
          } : undefined,
        });

        ctx.dataChanged.push('topics');

        return JSON.stringify({
          success: true,
          topicId: topic._id.toString(),
          message: `Topic "${input.topic}" added to the generation queue with ${input.priority || 'medium'} priority.`,
        });
      }),
    }),

    betaZodTool({
      name: 'create_topics_bulk',
      description: 'Add multiple topics to the generation queue at once (up to 20). Use this when building out a content calendar or batch-adding related topics.',
      inputSchema: z.object({
        topics: z.array(z.object({
          topic: z.string().describe('The blog topic/title'),
          audience: z.string().optional(),
          tone: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          primaryKeyword: z.string().optional(),
          secondaryKeywords: z.array(z.string()).optional().describe('Secondary SEO keywords'),
          searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional().describe('Search intent for SEO'),
          tags: z.array(z.string()).optional(),
          scheduledAt: z.string().optional(),
        })).max(20).describe('Array of topics to add (max 20)'),
      }),
      run: wrapTool(ctx, 'create_topics_bulk', async (input) => {
        await dbConnect();

        const docs = input.topics.map((t: any) => ({
          topic: t.topic,
          audience: t.audience,
          tone: t.tone,
          priority: t.priority || 'medium',
          source: 'bulk' as const,
          owner: ctx.userId,
          tags: t.tags,
          scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : undefined,
          seo: (t.primaryKeyword || t.secondaryKeywords || t.searchIntent) ? {
            primaryKeyword: t.primaryKeyword,
            secondaryKeywords: t.secondaryKeywords,
            searchIntent: t.searchIntent,
          } : undefined,
        }));

        const created = await Topic.insertMany(docs);
        ctx.dataChanged.push('topics');

        return JSON.stringify({
          success: true,
          count: created.length,
          topicIds: created.map((t: any) => t._id.toString()),
          message: `${created.length} topics added to the generation queue.`,
        });
      }),
    }),

    betaZodTool({
      name: 'update_topic',
      description: 'Update an existing topic in the queue. Can change priority, schedule, SEO data, or other properties.',
      inputSchema: z.object({
        topicId: z.string().describe('The topic ID to update'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        scheduledAt: z.string().optional().describe('New scheduled date (ISO string)'),
        primaryKeyword: z.string().optional(),
        secondaryKeywords: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        additionalRequirements: z.string().optional(),
      }),
      run: wrapTool(ctx, 'update_topic', async (input) => {
        await dbConnect();

        const update: any = {};
        if (input.priority) update.priority = input.priority;
        if (input.scheduledAt) update.scheduledAt = new Date(input.scheduledAt);
        if (input.tags) update.tags = input.tags;
        if (input.additionalRequirements) update.additionalRequirements = input.additionalRequirements;
        if (input.primaryKeyword || input.secondaryKeywords) {
          update['seo.primaryKeyword'] = input.primaryKeyword;
          if (input.secondaryKeywords) update['seo.secondaryKeywords'] = input.secondaryKeywords;
        }

        const topic = await Topic.findOneAndUpdate(
          { _id: input.topicId, owner: ctx.userId },
          { $set: update },
          { new: true }
        );

        if (!topic) {
          return JSON.stringify({ error: 'Topic not found or not owned by this user.' });
        }

        ctx.dataChanged.push('topics');

        return JSON.stringify({
          success: true,
          message: `Topic "${topic.topic}" updated.`,
        });
      }),
    }),

    betaZodTool({
      name: 'update_post_status',
      description: 'Change the status of a blog post (publish, archive, or set to draft).',
      inputSchema: z.object({
        postId: z.string().describe('The blog post ID to update'),
        status: z.enum(['draft', 'published', 'archived']).describe('New status'),
      }),
      run: wrapTool(ctx, 'update_post_status', async (input) => {
        await dbConnect();

        const update: any = { status: input.status };
        if (input.status === 'published') {
          update.publishedAt = new Date();
        }

        const post = await BlogPost.findOneAndUpdate(
          { _id: input.postId, owner: ctx.userId },
          { $set: update },
          { new: true }
        );

        if (!post) {
          return JSON.stringify({ error: 'Post not found or not owned by this user.' });
        }

        ctx.dataChanged.push('posts');

        return JSON.stringify({
          success: true,
          message: `Post "${post.title}" status changed to ${input.status}.`,
        });
      }),
    }),
  ];
}
