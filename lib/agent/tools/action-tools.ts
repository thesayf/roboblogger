import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import BlogPost from '@/models/BlogPost';
import BlogComponent from '@/models/BlogComponent';

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
        imageContext: z.string().optional().describe('Image style description for generated images (e.g., "Modern minimalist with blue corporate tones", "Warm watercolor illustrations")'),
        referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library to guide image generation style'),
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
          imageContext: input.imageContext,
          referenceImages: input.referenceImages,
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
          audience: z.string().optional().describe('Target audience for this post'),
          tone: z.string().optional().describe('Writing tone (e.g., professional, casual, technical)'),
          length: z.string().optional().describe('Post length (e.g., short, medium, long)'),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          primaryKeyword: z.string().optional(),
          secondaryKeywords: z.array(z.string()).optional().describe('Secondary SEO keywords'),
          searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional().describe('Search intent for SEO'),
          tags: z.array(z.string()).optional(),
          scheduledAt: z.string().optional().describe('ISO date string for scheduled generation'),
          additionalRequirements: z.string().optional().describe('Additional instructions for content generation'),
          imageContext: z.string().optional().describe('Image style description for generated images'),
          referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library'),
        })).max(20).describe('Array of topics to add (max 20)'),
      }),
      run: wrapTool(ctx, 'create_topics_bulk', async (input) => {
        await dbConnect();

        const docs = input.topics.map((t: any) => ({
          topic: t.topic,
          audience: t.audience,
          tone: t.tone,
          length: t.length,
          priority: t.priority || 'medium',
          source: 'bulk' as const,
          owner: ctx.userId,
          tags: t.tags,
          scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : undefined,
          additionalRequirements: t.additionalRequirements,
          imageContext: t.imageContext,
          referenceImages: t.referenceImages,
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
        audience: z.string().optional().describe('Target audience for this post'),
        tone: z.string().optional().describe('Writing tone (e.g., professional, casual, technical)'),
        length: z.string().optional().describe('Post length (e.g., short, medium, long)'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        scheduledAt: z.string().optional().describe('New scheduled date (ISO string)'),
        primaryKeyword: z.string().optional(),
        secondaryKeywords: z.array(z.string()).optional(),
        searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional(),
        tags: z.array(z.string()).optional(),
        additionalRequirements: z.string().optional().describe('Specific writing instructions: key points, angle, structure'),
        imageContext: z.string().optional().describe('Image style description for generated images (e.g., "Modern minimalist with blue corporate tones")'),
        referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library to guide image generation style'),
      }),
      run: wrapTool(ctx, 'update_topic', async (input) => {
        await dbConnect();

        const update: any = {};
        if (input.audience) update.audience = input.audience;
        if (input.tone) update.tone = input.tone;
        if (input.length) update.length = input.length;
        if (input.priority) update.priority = input.priority;
        if (input.scheduledAt) update.scheduledAt = new Date(input.scheduledAt);
        if (input.tags) update.tags = input.tags;
        if (input.additionalRequirements) update.additionalRequirements = input.additionalRequirements;
        if (input.imageContext) update.imageContext = input.imageContext;
        if (input.referenceImages) update.referenceImages = input.referenceImages;
        if (input.primaryKeyword || input.secondaryKeywords || input.searchIntent) {
          if (input.primaryKeyword) update['seo.primaryKeyword'] = input.primaryKeyword;
          if (input.secondaryKeywords) update['seo.secondaryKeywords'] = input.secondaryKeywords;
          if (input.searchIntent) update['seo.searchIntent'] = input.searchIntent;
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

    betaZodTool({
      name: 'edit_post',
      description: 'Edit a blog post\'s top-level fields (title, description, SEO data, tags, featured image). Use get_post first to see current values.',
      inputSchema: z.object({
        postId: z.string().describe('The blog post ID to edit'),
        title: z.string().optional().describe('New post title'),
        description: z.string().optional().describe('New post description'),
        seoTitle: z.string().optional().describe('New SEO title (50-60 characters)'),
        seoDescription: z.string().optional().describe('New SEO meta description (150-160 characters)'),
        tags: z.array(z.string()).optional().describe('New tags array'),
        category: z.string().optional().describe('New category'),
        featuredImage: z.string().optional().describe('New featured image URL'),
        featuredImageThumbnail: z.string().optional().describe('New featured image thumbnail URL'),
      }),
      run: wrapTool(ctx, 'edit_post', async (input) => {
        await dbConnect();

        const update: any = {};
        if (input.title) update.title = input.title;
        if (input.description) update.description = input.description;
        if (input.seoTitle) update.seoTitle = input.seoTitle;
        if (input.seoDescription) update.seoDescription = input.seoDescription;
        if (input.tags) update.tags = input.tags;
        if (input.category) update.category = input.category;
        if (input.featuredImage) update.featuredImage = input.featuredImage;
        if (input.featuredImageThumbnail) update.featuredImageThumbnail = input.featuredImageThumbnail;

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
          message: `Post "${post.title}" updated.`,
        });
      }),
    }),

    betaZodTool({
      name: 'edit_post_component',
      description: 'Edit a single component within a blog post. Use get_post first to see component IDs and current content.',
      inputSchema: z.object({
        postId: z.string().describe('The blog post ID that owns this component'),
        componentId: z.string().describe('The component ID to edit'),
        content: z.string().optional().describe('New content (for rich_text, code_block)'),
        url: z.string().optional().describe('New image URL (for image components)'),
        alt: z.string().optional().describe('New alt text (for image components)'),
        caption: z.string().optional().describe('New caption (for image components)'),
        variant: z.enum(['info', 'success', 'warning', 'error']).optional().describe('New variant (for callout components)'),
        title: z.string().optional().describe('New title (for callout components)'),
        author: z.string().optional().describe('New author (for quote components)'),
        citation: z.string().optional().describe('New citation (for quote components)'),
        text: z.string().optional().describe('New text (for CTA components)'),
        link: z.string().optional().describe('New link (for CTA components)'),
        style: z.enum(['primary', 'secondary', 'outline']).optional().describe('New style (for CTA components)'),
        data: z.any().optional().describe('New data (for chart, timeline, and other data-driven components)'),
      }),
      run: wrapTool(ctx, 'edit_post_component', async (input) => {
        await dbConnect();

        // Verify user owns the post
        const post = await BlogPost.findOne({ _id: input.postId, owner: ctx.userId }).select('_id').lean();
        if (!post) {
          return JSON.stringify({ error: 'Post not found or not owned by this user.' });
        }

        // Verify component belongs to this post
        const component = await BlogComponent.findOne({ _id: input.componentId, blogPost: input.postId }).lean();
        if (!component) {
          return JSON.stringify({ error: 'Component not found or does not belong to this post.' });
        }

        const update: any = {};
        if (input.content !== undefined) update.content = input.content;
        if (input.url !== undefined) update.url = input.url;
        if (input.alt !== undefined) update.alt = input.alt;
        if (input.caption !== undefined) update.caption = input.caption;
        if (input.variant !== undefined) update.variant = input.variant;
        if (input.title !== undefined) update.title = input.title;
        if (input.author !== undefined) update.author = input.author;
        if (input.citation !== undefined) update.citation = input.citation;
        if (input.text !== undefined) update.text = input.text;
        if (input.link !== undefined) update.link = input.link;
        if (input.style !== undefined) update.style = input.style;
        if (input.data !== undefined) update.data = input.data;

        await BlogComponent.findByIdAndUpdate(
          input.componentId,
          { $set: update },
          { new: true }
        );

        ctx.dataChanged.push('posts');

        return JSON.stringify({
          success: true,
          message: `Component ${input.componentId} updated.`,
        });
      }),
    }),
  ];
}
