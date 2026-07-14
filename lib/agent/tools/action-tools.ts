import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolContext, ToolCallInfo } from '../types';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import BrandSettings from '@/models/BrandSettings';
import BlogPost from '@/models/BlogPost';
import BlogComponent from '@/models/BlogComponent';
import {
  generateImageWithGPTImage,
  uploadImageToImageKit,
  buildImageStylePrompt,
  analyzeReferenceImages,
} from '@/lib/generation/image-utils';
import { generationModeToProvider } from '@/lib/generation/generation-mode';
import { resolveContentStructure } from '@/lib/content-structure';
import { assignContentStructure } from '@/lib/content-strategy-service';

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
        tone: z.string().optional().describe('Writing tone (e.g., "professional", "casual but authoritative", "technical")'),
        length: z.string().optional().describe('Post length (e.g., short, medium, long, "2000-3000 words")'),
        priority: z.enum(['low', 'medium', 'high']).optional().describe('Generation priority (default: medium)'),
        primaryKeyword: z.string().optional().describe('Primary SEO keyword'),
        secondaryKeywords: z.array(z.string()).optional().describe('Secondary SEO keywords'),
        searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional().describe('Search intent for SEO'),
        tags: z.array(z.string()).optional().describe('Tags for organization'),
        scheduledAt: z.string().optional().describe('ISO date string for scheduled generation'),
        additionalRequirements: z.string().optional().describe('Additional instructions for content generation'),
        imageContext: z.string().optional().describe('Image style description for generated images (e.g., "Modern minimalist with blue corporate tones", "Warm watercolor illustrations")'),
        referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library to guide image generation style'),
        internalLinks: z.array(z.object({
          postId: z.string().describe('Blog post ID to link to'),
          slug: z.string().describe('Post slug for the link URL'),
          title: z.string().describe('Post title'),
          description: z.string().optional().describe('Context hint for how to reference this post'),
        })).optional().describe('Pre-planned internal links to include in the generated post'),
        researchMode: z.enum(['guided', 'exploratory']).optional().describe('Research mode: "guided" (default) researches a specific topic, "exploratory" discovers the best angle and recommends a title — use exploratory when the user wants to find what\'s interesting in a broad area'),
        generationMode: z.enum(['efficient', 'premium']).optional().describe('Generation mode: "efficient" uses DeepSeek V4 Pro with Claude fallback; "premium" uses Claude Opus 4.6'),
        clusterId: z.string().nullable().optional().describe('Topic cluster ID, or null for no cluster'),
        seriesId: z.string().nullable().optional().describe('Content series ID, or null for no series'),
      }),
      run: wrapTool(ctx, 'create_topic', async (input) => {
        await dbConnect();

        const structure = await resolveContentStructure({
          ownerId: ctx.userId,
          clusterId: input.clusterId,
          seriesId: input.seriesId,
        });

        const topic = await Topic.create({
          topic: input.topic,
          audience: input.audience,
          tone: input.tone,
          length: input.length,
          priority: input.priority || 'medium',
          researchMode: input.researchMode,
          generationProvider: generationModeToProvider(input.generationMode),
          source: 'individual',
          owner: ctx.userId,
          tags: input.tags,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          additionalRequirements: input.additionalRequirements,
          imageContext: input.imageContext,
          referenceImages: input.referenceImages,
          internalLinks: input.internalLinks,
          clusterId: structure.clusterId,
          seriesId: structure.seriesId,
          seo: (input.primaryKeyword || input.secondaryKeywords || input.searchIntent) ? {
            primaryKeyword: input.primaryKeyword,
            secondaryKeywords: input.secondaryKeywords,
            searchIntent: input.searchIntent,
          } : undefined,
        });

        ctx.dataChanged.push('topics');
        if (structure.clusterId || structure.seriesId) ctx.dataChanged.push('strategy');

        return JSON.stringify({
          success: true,
          topicId: topic._id.toString(),
          message: `Topic "${input.topic}" added to the generation queue in ${input.generationMode || 'efficient'} mode with ${input.priority || 'medium'} priority.`,
        });
      }),
    }),

    betaZodTool({
      name: 'create_topics_bulk',
      description: 'Add multiple topics to the generation queue in a single fast operation (up to 20). ALWAYS use this instead of calling create_topic multiple times — it is much faster and avoids timeouts. Use this whenever adding 2 or more topics.',
      inputSchema: z.object({
        topics: z.array(z.object({
          topic: z.string().describe('The blog topic/title'),
          audience: z.string().optional().describe('Target audience for this post'),
          tone: z.string().optional().describe('Writing tone (e.g., "professional", "casual but authoritative")'),
          length: z.string().optional().describe('Post length (e.g., short, medium, long, "2000-3000 words")'),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          primaryKeyword: z.string().optional(),
          secondaryKeywords: z.array(z.string()).optional().describe('Secondary SEO keywords'),
          searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional().describe('Search intent for SEO'),
          tags: z.array(z.string()).optional(),
          scheduledAt: z.string().optional().describe('ISO date string for scheduled generation'),
          additionalRequirements: z.string().optional().describe('Additional instructions for content generation'),
          imageContext: z.string().optional().describe('Image style description for generated images'),
          referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library'),
          internalLinks: z.array(z.object({
            postId: z.string(),
            slug: z.string(),
            title: z.string(),
            description: z.string().optional(),
          })).optional().describe('Pre-planned internal links'),
          researchMode: z.enum(['guided', 'exploratory']).optional().describe('Research mode: "guided" or "exploratory"'),
          generationMode: z.enum(['efficient', 'premium']).optional().describe('Generation mode: "efficient" or "premium"'),
          clusterId: z.string().nullable().optional(),
          seriesId: z.string().nullable().optional(),
        })).max(20).describe('Array of topics to add (max 20)'),
      }),
      run: wrapTool(ctx, 'create_topics_bulk', async (input) => {
        await dbConnect();

        const docs = await Promise.all(input.topics.map(async (t: any) => {
          const structure = await resolveContentStructure({
            ownerId: ctx.userId,
            clusterId: t.clusterId,
            seriesId: t.seriesId,
          });
          return {
            topic: t.topic,
            audience: t.audience,
            tone: t.tone,
            length: t.length,
            priority: t.priority || 'medium',
            researchMode: t.researchMode,
            generationProvider: generationModeToProvider(t.generationMode),
            source: 'bulk' as const,
            owner: ctx.userId,
            tags: t.tags,
            scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : undefined,
            additionalRequirements: t.additionalRequirements,
            imageContext: t.imageContext,
            referenceImages: t.referenceImages,
            internalLinks: t.internalLinks,
            clusterId: structure.clusterId,
            seriesId: structure.seriesId,
            seo: (t.primaryKeyword || t.secondaryKeywords || t.searchIntent) ? {
              primaryKeyword: t.primaryKeyword,
              secondaryKeywords: t.secondaryKeywords,
              searchIntent: t.searchIntent,
            } : undefined,
          };
        }));

        const created = await Topic.insertMany(docs);
        ctx.dataChanged.push('topics');
        if (input.topics.some((topic: any) => topic.clusterId || topic.seriesId)) {
          ctx.dataChanged.push('strategy');
        }

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
        tone: z.string().optional().describe('Writing tone (e.g., "professional", "casual but authoritative")'),
        length: z.string().optional().describe('Post length (e.g., short, medium, long, "2000-3000 words")'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        scheduledAt: z.string().optional().describe('New scheduled date (ISO string)'),
        primaryKeyword: z.string().optional(),
        secondaryKeywords: z.array(z.string()).optional(),
        searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional(),
        tags: z.array(z.string()).optional(),
        additionalRequirements: z.string().optional().describe('Specific writing instructions: key points, angle, structure'),
        imageContext: z.string().optional().describe('Image style description for generated images (e.g., "Modern minimalist with blue corporate tones")'),
        referenceImages: z.array(z.string()).optional().describe('URLs of reference images from the media library to guide image generation style'),
        internalLinks: z.array(z.object({
          postId: z.string().describe('Blog post ID to link to'),
          slug: z.string().describe('Post slug for the link URL'),
          title: z.string().describe('Post title'),
          description: z.string().optional().describe('Context hint for how to reference this post'),
        })).optional().describe('Pre-planned internal links to include in the generated post'),
        generationMode: z.enum(['efficient', 'premium']).optional().describe('Change generation mode: "efficient" uses DeepSeek V4 Pro with Claude fallback; "premium" uses Claude Opus 4.6'),
        clusterId: z.string().nullable().optional(),
        seriesId: z.string().nullable().optional(),
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
        if (input.internalLinks) update.internalLinks = input.internalLinks;
        if (input.generationMode) update.generationProvider = generationModeToProvider(input.generationMode);
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

        if (input.clusterId !== undefined || input.seriesId !== undefined) {
          await assignContentStructure(ctx.userId, {
            contentType: 'topic',
            contentId: topic._id.toString(),
            clusterId: input.clusterId !== undefined ? input.clusterId : topic.clusterId?.toString(),
            seriesId: input.seriesId !== undefined ? input.seriesId : topic.seriesId?.toString(),
          });
        }

        ctx.dataChanged.push('topics');
        if (input.clusterId !== undefined || input.seriesId !== undefined) {
          ctx.dataChanged.push('strategy');
        }

        return JSON.stringify({
          success: true,
          message: `Topic "${topic.topic}" updated${input.generationMode ? ` to ${input.generationMode} mode` : ''}.`,
        });
      }),
    }),

    betaZodTool({
      name: 'update_topics_bulk',
      description: 'Update multiple topics in a single operation (up to 20). ALWAYS use this instead of calling update_topic multiple times — it is much faster and avoids timeouts. Use this whenever updating 2 or more topics.',
      inputSchema: z.object({
        updates: z.array(z.object({
          topicId: z.string().describe('The topic ID to update'),
          audience: z.string().optional(),
          tone: z.string().optional(),
          length: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          scheduledAt: z.string().optional().describe('ISO date string'),
          primaryKeyword: z.string().optional(),
          secondaryKeywords: z.array(z.string()).optional(),
          searchIntent: z.enum(['informational', 'commercial', 'navigational', 'transactional']).optional(),
          tags: z.array(z.string()).optional(),
          additionalRequirements: z.string().optional(),
          imageContext: z.string().optional(),
          referenceImages: z.array(z.string()).optional(),
          internalLinks: z.array(z.object({
            postId: z.string(),
            slug: z.string(),
            title: z.string(),
            description: z.string().optional(),
          })).optional(),
          generationMode: z.enum(['efficient', 'premium']).optional().describe('Generation mode: "efficient" or "premium"'),
          clusterId: z.string().nullable().optional(),
          seriesId: z.string().nullable().optional(),
        })).max(20).describe('Array of topic updates (max 20)'),
      }),
      run: wrapTool(ctx, 'update_topics_bulk', async (input) => {
        await dbConnect();

        const results: { topicId: string; success: boolean; error?: string }[] = [];

        await Promise.all(input.updates.map(async (t: any) => {
          try {
            const update: any = {};
            if (t.audience) update.audience = t.audience;
            if (t.tone) update.tone = t.tone;
            if (t.length) update.length = t.length;
            if (t.priority) update.priority = t.priority;
            if (t.scheduledAt) update.scheduledAt = new Date(t.scheduledAt);
            if (t.tags) update.tags = t.tags;
            if (t.additionalRequirements) update.additionalRequirements = t.additionalRequirements;
            if (t.imageContext) update.imageContext = t.imageContext;
            if (t.referenceImages) update.referenceImages = t.referenceImages;
            if (t.internalLinks) update.internalLinks = t.internalLinks;
            if (t.generationMode) update.generationProvider = generationModeToProvider(t.generationMode);
            if (t.primaryKeyword || t.secondaryKeywords || t.searchIntent) {
              if (t.primaryKeyword) update['seo.primaryKeyword'] = t.primaryKeyword;
              if (t.secondaryKeywords) update['seo.secondaryKeywords'] = t.secondaryKeywords;
              if (t.searchIntent) update['seo.searchIntent'] = t.searchIntent;
            }

            const topic = await Topic.findOneAndUpdate(
              { _id: t.topicId, owner: ctx.userId },
              { $set: update },
              { new: true }
            );

            if (!topic) {
              results.push({ topicId: t.topicId, success: false, error: 'Not found' });
            } else {
              if (t.clusterId !== undefined || t.seriesId !== undefined) {
                await assignContentStructure(ctx.userId, {
                  contentType: 'topic',
                  contentId: topic._id.toString(),
                  clusterId: t.clusterId !== undefined ? t.clusterId : topic.clusterId?.toString(),
                  seriesId: t.seriesId !== undefined ? t.seriesId : topic.seriesId?.toString(),
                });
              }
              results.push({ topicId: t.topicId, success: true });
            }
          } catch (err: any) {
            results.push({ topicId: t.topicId, success: false, error: err.message });
          }
        }));

        ctx.dataChanged.push('topics');
        if (input.updates.some((update: any) => update.clusterId !== undefined || update.seriesId !== undefined)) {
          ctx.dataChanged.push('strategy');
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        return JSON.stringify({
          success: failed.length === 0,
          updated: succeeded,
          failed: failed.length > 0 ? failed : undefined,
          message: `${succeeded}/${input.updates.length} topics updated.`,
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

    betaZodTool({
      name: 'edit_posts_bulk',
      description: 'Edit multiple blog posts and/or their components in a single operation (up to 20 edits). ALWAYS use this instead of calling edit_post or edit_post_component multiple times — it is much faster and avoids timeouts. Perfect for bulk updates like adding internal links across posts, updating descriptions, or fixing SEO data.',
      inputSchema: z.object({
        edits: z.array(z.object({
          postId: z.string().describe('The blog post ID to edit'),
          // Post-level fields (optional)
          title: z.string().optional().describe('New post title'),
          description: z.string().optional().describe('New post description'),
          seoTitle: z.string().optional().describe('New SEO title'),
          seoDescription: z.string().optional().describe('New SEO meta description'),
          tags: z.array(z.string()).optional().describe('New tags array'),
          category: z.string().optional().describe('New category'),
          featuredImage: z.string().optional().describe('New featured image URL'),
          featuredImageThumbnail: z.string().optional().describe('New featured image thumbnail URL'),
          // Component edits (optional)
          components: z.array(z.object({
            componentId: z.string().describe('The component ID to edit'),
            content: z.string().optional(),
            url: z.string().optional(),
            alt: z.string().optional(),
            caption: z.string().optional(),
            variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
            title: z.string().optional(),
            author: z.string().optional(),
            citation: z.string().optional(),
            text: z.string().optional(),
            link: z.string().optional(),
            style: z.enum(['primary', 'secondary', 'outline']).optional(),
            data: z.any().optional(),
          })).optional().describe('Component-level edits for this post'),
        })).max(20).describe('Array of post edits (max 20)'),
      }),
      run: wrapTool(ctx, 'edit_posts_bulk', async (input) => {
        await dbConnect();

        const results: { postId: string; success: boolean; componentsUpdated?: number; error?: string }[] = [];

        await Promise.all(input.edits.map(async (edit: any) => {
          try {
            // Verify user owns the post
            const post = await BlogPost.findOne({ _id: edit.postId, owner: ctx.userId }).select('_id title').lean();
            if (!post) {
              results.push({ postId: edit.postId, success: false, error: 'Not found' });
              return;
            }

            // Apply post-level updates
            const postUpdate: any = {};
            if (edit.title) postUpdate.title = edit.title;
            if (edit.description) postUpdate.description = edit.description;
            if (edit.seoTitle) postUpdate.seoTitle = edit.seoTitle;
            if (edit.seoDescription) postUpdate.seoDescription = edit.seoDescription;
            if (edit.tags) postUpdate.tags = edit.tags;
            if (edit.category) postUpdate.category = edit.category;
            if (edit.featuredImage) postUpdate.featuredImage = edit.featuredImage;
            if (edit.featuredImageThumbnail) postUpdate.featuredImageThumbnail = edit.featuredImageThumbnail;

            if (Object.keys(postUpdate).length > 0) {
              await BlogPost.findByIdAndUpdate(edit.postId, { $set: postUpdate });
            }

            // Apply component-level updates
            let componentsUpdated = 0;
            if (edit.components?.length > 0) {
              await Promise.all(edit.components.map(async (comp: any) => {
                const compUpdate: any = {};
                if (comp.content !== undefined) compUpdate.content = comp.content;
                if (comp.url !== undefined) compUpdate.url = comp.url;
                if (comp.alt !== undefined) compUpdate.alt = comp.alt;
                if (comp.caption !== undefined) compUpdate.caption = comp.caption;
                if (comp.variant !== undefined) compUpdate.variant = comp.variant;
                if (comp.title !== undefined) compUpdate.title = comp.title;
                if (comp.author !== undefined) compUpdate.author = comp.author;
                if (comp.citation !== undefined) compUpdate.citation = comp.citation;
                if (comp.text !== undefined) compUpdate.text = comp.text;
                if (comp.link !== undefined) compUpdate.link = comp.link;
                if (comp.style !== undefined) compUpdate.style = comp.style;
                if (comp.data !== undefined) compUpdate.data = comp.data;

                const result = await BlogComponent.findOneAndUpdate(
                  { _id: comp.componentId, blogPost: edit.postId },
                  { $set: compUpdate }
                );
                if (result) componentsUpdated++;
              }));
            }

            results.push({ postId: edit.postId, success: true, componentsUpdated });
          } catch (err: any) {
            results.push({ postId: edit.postId, success: false, error: err.message });
          }
        }));

        ctx.dataChanged.push('posts');

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        return JSON.stringify({
          success: failed.length === 0,
          updated: succeeded,
          results,
          failed: failed.length > 0 ? failed : undefined,
          message: `${succeeded}/${input.edits.length} posts updated.`,
        });
      }),
    }),

    betaZodTool({
      name: 'update_brand_settings',
      description: 'Update the user\'s brand settings. Use get_brand_settings first to see current values. All fields are optional — only provided fields will be updated.',
      inputSchema: z.object({
        blogName: z.string().optional().describe('Blog name/title'),
        blogDescription: z.string().optional().describe('Blog description'),
        targetAudience: z.string().optional().describe('Description of the target audience'),
        tone: z.enum(['professional', 'casual', 'technical', 'conversational', 'authoritative', 'friendly', 'custom']).optional().describe('Writing tone/voice'),
        customTone: z.string().optional().describe('Custom tone description (used when tone is "custom")'),
        styleGuidelines: z.string().optional().describe('Writing style guidelines'),
        topicsWeCover: z.string().optional().describe('Topics the blog covers'),
        thingsToAvoid: z.string().optional().describe('Content to avoid'),
        exampleContent: z.string().optional().describe('Sample posts or writing examples for voice matching'),
        industryNiche: z.string().optional().describe('Industry/niche for SEO research context'),
      }),
      run: wrapTool(ctx, 'update_brand_settings', async (input) => {
        await dbConnect();

        const update: any = {};
        if (input.blogName !== undefined) update.blogName = input.blogName;
        if (input.blogDescription !== undefined) update.blogDescription = input.blogDescription;
        if (input.targetAudience !== undefined) update.targetAudience = input.targetAudience;
        if (input.tone !== undefined) update.tone = input.tone;
        if (input.customTone !== undefined) update.customTone = input.customTone;
        if (input.styleGuidelines !== undefined) update.styleGuidelines = input.styleGuidelines;
        if (input.topicsWeCover !== undefined) update.topicsWeCover = input.topicsWeCover;
        if (input.thingsToAvoid !== undefined) update.thingsToAvoid = input.thingsToAvoid;
        if (input.exampleContent !== undefined) update.exampleContent = input.exampleContent;
        if (input.industryNiche !== undefined) update.industryNiche = input.industryNiche;

        const settings = await BrandSettings.findOneAndUpdate(
          { userId: ctx.clerkId },
          { $set: update },
          { new: true, upsert: true }
        );

        ctx.dataChanged.push('brand');

        return JSON.stringify({
          success: true,
          message: 'Brand settings updated.',
          settings: {
            blogName: settings.blogName,
            blogDescription: settings.blogDescription,
            targetAudience: settings.targetAudience,
            tone: settings.tone,
            customTone: settings.customTone,
            styleGuidelines: settings.styleGuidelines,
            topicsWeCover: settings.topicsWeCover,
            thingsToAvoid: settings.thingsToAvoid,
            industryNiche: settings.industryNiche,
          },
        });
      }),
    }),

    // ========================================================================
    // IMAGE GENERATION TOOLS
    // ========================================================================

    betaZodTool({
      name: 'generate_image',
      description: 'Generate an AI image from a description and upload it to the media library. Returns the image URL. Use edit_post or edit_post_component to apply it to a post, or use regenerate_post_image to do both in one step.',
      inputSchema: z.object({
        description: z.string().describe('Detailed visual scene description — subjects, environment, mood, colors, composition'),
        imageContext: z.string().optional().describe('Style/brand context (e.g., "modern editorial photography with dramatic lighting")'),
        referenceImageUrls: z.array(z.string()).optional().describe('Reference image URLs to match the visual style of'),
      }),
      run: wrapTool(ctx, 'generate_image', async (input) => {
        await dbConnect();

        // Get reference images: use provided ones, or fall back to brand settings
        let refImages = input.referenceImageUrls || [];
        if (refImages.length === 0) {
          const brand = await BrandSettings.findOne({ userId: ctx.clerkId }).lean() as any;
          refImages = brand?.referenceImages || [];
        }

        // Analyze reference images for style
        const referenceAnalysis = refImages.length > 0
          ? await analyzeReferenceImages(refImages)
          : '';

        const stylePrompt = buildImageStylePrompt(input.imageContext || '', referenceAnalysis);

        // Generate the image
        const imageUrl = await generateImageWithGPTImage(
          input.description,
          stylePrompt,
          referenceAnalysis,
        );

        if (!imageUrl) {
          return JSON.stringify({ error: 'Image generation failed. Check that OPENAI_API_KEY is configured.' });
        }

        // Upload to ImageKit
        const fileName = `agent-gen-${Date.now()}.png`;
        const uploaded = await uploadImageToImageKit(imageUrl, fileName, ctx.userId);

        if (!uploaded) {
          return JSON.stringify({ error: 'Image was generated but upload to ImageKit failed.' });
        }

        return JSON.stringify({
          success: true,
          url: uploaded.url,
          thumbnailUrl: uploaded.thumbnailUrl,
          fileId: uploaded.fileId,
          width: uploaded.width,
          height: uploaded.height,
          message: 'Image generated and uploaded. Use edit_post (for featured image) or edit_post_component (for component image) to apply it to a post.',
        });
      }),
    }),

    betaZodTool({
      name: 'regenerate_post_image',
      description: 'Generate a new image and immediately update a blog post with it. For featured images, omit componentId. For component images, provide the componentId. Use get_post first to find component IDs.',
      inputSchema: z.object({
        postId: z.string().describe('Blog post ID to update'),
        componentId: z.string().optional().describe('Component ID to update (omit for featured image)'),
        description: z.string().describe('Detailed visual scene description for the new image'),
        imageContext: z.string().optional().describe('Style/brand context for the image'),
      }),
      run: wrapTool(ctx, 'regenerate_post_image', async (input) => {
        await dbConnect();

        // Verify post exists and belongs to user
        const post = await BlogPost.findOne({ _id: input.postId, owner: ctx.userId });
        if (!post) {
          return JSON.stringify({ error: 'Post not found or not owned by this user.' });
        }

        // If componentId provided, verify it belongs to this post
        if (input.componentId) {
          const component = await BlogComponent.findOne({ _id: input.componentId, blogPost: input.postId });
          if (!component) {
            return JSON.stringify({ error: 'Component not found in this post.' });
          }
        }

        // Get brand reference images for style
        const brand = await BrandSettings.findOne({ userId: ctx.clerkId }).lean() as any;
        const refImages = brand?.referenceImages || [];

        const referenceAnalysis = refImages.length > 0
          ? await analyzeReferenceImages(refImages)
          : '';

        const stylePrompt = buildImageStylePrompt(input.imageContext || '', referenceAnalysis);

        // Generate the image
        const imageUrl = await generateImageWithGPTImage(
          input.description,
          stylePrompt,
          referenceAnalysis,
        );

        if (!imageUrl) {
          return JSON.stringify({ error: 'Image generation failed.' });
        }

        // Upload to ImageKit
        const fileName = `regen-${Date.now()}.png`;
        const uploaded = await uploadImageToImageKit(imageUrl, fileName, ctx.userId);

        if (!uploaded) {
          return JSON.stringify({ error: 'Image generated but upload failed.' });
        }

        // Apply to post
        if (input.componentId) {
          // Update component image
          await BlogComponent.findByIdAndUpdate(input.componentId, {
            $set: {
              url: uploaded.url,
              thumbnailUrl: uploaded.thumbnailUrl,
              fileId: uploaded.fileId,
              width: uploaded.width,
              height: uploaded.height,
            },
          });
          ctx.dataChanged.push('posts');

          return JSON.stringify({
            success: true,
            target: 'component',
            componentId: input.componentId,
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl,
            message: `Component image regenerated and updated.`,
          });
        } else {
          // Update featured image
          await BlogPost.findByIdAndUpdate(input.postId, {
            $set: {
              featuredImage: uploaded.url,
              featuredImageThumbnail: uploaded.thumbnailUrl,
            },
          });
          ctx.dataChanged.push('posts');

          return JSON.stringify({
            success: true,
            target: 'featured',
            url: uploaded.url,
            thumbnailUrl: uploaded.thumbnailUrl,
            message: `Featured image regenerated and updated.`,
          });
        }
      }),
    }),
  ];
}
