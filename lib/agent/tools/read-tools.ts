import mongoose from 'mongoose';
import Anthropic from '@anthropic-ai/sdk';
import ImageKit from 'imagekit';
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
import User from '@/models/User';

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
            { $match: { owner: new mongoose.Types.ObjectId(ctx.userId) } },
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
            id: p._id.toString(),
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
        const settings = await BrandSettings.findOne({ userId: ctx.clerkId }).lean();

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
          referenceImages: (settings as any).referenceImages || [],
        });
      }),
    }),

    betaZodTool({
      name: 'get_topics_queue',
      description: 'Get the current topic generation queue with statuses, priorities, and scheduling info. Supports pagination via offset — use offset to page through large queues (e.g., offset=0 for first batch, offset=50 for next 50).',
      inputSchema: z.object({
        status: z.enum(['pending', 'generating', 'completed', 'failed', 'all']).optional().describe('Filter by status (default: all)'),
        limit: z.number().optional().describe('Max results per page (default 50)'),
        offset: z.number().optional().describe('Number of topics to skip for pagination (default 0)'),
      }),
      run: wrapTool(ctx, 'get_topics_queue', async (input) => {
        await dbConnect();
        const filter: any = { owner: ctx.userId };
        if (input.status && input.status !== 'all') {
          filter.status = input.status;
        }

        const limit = input.limit || 50;
        const offset = input.offset || 0;

        const [topics, total] = await Promise.all([
          Topic.find(filter)
            .sort({ priority: -1, createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .select('topic status priority scheduledAt seo.primaryKeyword tags createdAt')
            .lean(),
          Topic.countDocuments(filter),
        ]);

        return JSON.stringify({
          total,
          count: topics.length,
          offset,
          hasMore: offset + topics.length < total,
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
        const imagekit = new ImageKit({
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
        });

        await dbConnect();
        const userRecord = await User.findById(ctx.userId).lean() as any;
        const allUserRecords = userRecord?.email
          ? await User.find({ email: userRecord.email }).select('_id').lean()
          : [{ _id: ctx.userId }];
        const mongoIds = allUserRecords.map((u: any) => u._id.toString());

        const lim = input.limit || 20;
        const folderPaths = mongoIds.map((id: string) => `/blog-images/${id}`);

        const allResults = await Promise.all(
          folderPaths.map((path) =>
            imagekit.listFiles({ limit: lim, skip: input.skip || 0, sort: 'DESC_CREATED', path })
          )
        );

        const seen = new Set<string>();
        const files: any[] = [];
        for (const results of allResults) {
          for (const item of results) {
            if (item.type === 'file' && !seen.has((item as any).fileId)) {
              seen.add((item as any).fileId);
              files.push(item);
            }
          }
        }
        files.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const limited = files.slice(0, lim);
        return JSON.stringify({
          total: files.length,
          images: limited.map((img: any) => ({
            name: img.name,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || img.url,
            width: img.width || 0,
            height: img.height || 0,
            format: img.fileType?.split('/')[1] || 'unknown',
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
      name: 'get_internal_link_map',
      description: 'Get a compact overview of ALL published posts with their titles, slugs, descriptions, keywords, tags, and which other posts they currently link to. Use this to plan internal linking strategy without reading every post individually. Returns enough context to identify linking opportunities across the whole blog.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'get_internal_link_map', async () => {
        await dbConnect();

        // Get all published posts with metadata
        const posts = await BlogPost.find({ owner: ctx.userId, status: { $in: ['published', 'draft'] } })
          .sort({ publishedAt: -1 })
          .select('title slug description tags category seoTitle seoDescription status publishedAt')
          .lean() as any[];

        // For each post, get text components and extract existing internal links
        const postIds = posts.map((p: any) => p._id);
        const allComponents = await BlogComponent.find({
          blogPost: { $in: postIds },
          type: 'text',
        })
          .select('blogPost content')
          .lean() as any[];

        // Group components by post
        const componentsByPost = new Map<string, string[]>();
        for (const comp of allComponents) {
          const pid = comp.blogPost.toString();
          if (!componentsByPost.has(pid)) componentsByPost.set(pid, []);
          componentsByPost.get(pid)!.push(comp.content || '');
        }

        const linkMap = posts.map((p: any) => {
          const pid = p._id.toString();
          const textBlocks = componentsByPost.get(pid) || [];
          const fullText = textBlocks.join(' ');

          // Extract internal links — both HTML href and markdown [text](/blog/slug) formats
          const existingLinks: string[] = [];
          let match;
          const htmlLinkRegex = /href=["'](?:https?:\/\/[^"']*)?\/blog\/([a-z0-9-]+)["']/gi;
          while ((match = htmlLinkRegex.exec(fullText)) !== null) {
            existingLinks.push(match[1]);
          }
          const mdLinkRegex = /\]\((?:https?:\/\/[^)]*)?\/blog\/([a-z0-9-]+(?:-[a-z0-9]+)*)[^)]*\)/gi;
          while ((match = mdLinkRegex.exec(fullText)) !== null) {
            existingLinks.push(match[1]);
          }

          return {
            id: pid,
            title: p.title,
            slug: p.slug,
            description: p.description?.substring(0, 200),
            tags: p.tags,
            category: p.category,
            seoKeyword: p.seoTitle,
            status: p.status,
            publishedAt: p.publishedAt,
            linksTo: Array.from(new Set(existingLinks)),
          };
        });

        return JSON.stringify({
          totalPosts: linkMap.length,
          posts: linkMap,
        });
      }),
    }),

    betaZodTool({
      name: 'get_post',
      description: 'Read a single blog post with all its components. Use this before editing a post to see its full content and component IDs. Accepts either a post ID or slug.',
      inputSchema: z.object({
        postId: z.string().optional().describe('The blog post ID to read'),
        slug: z.string().optional().describe('The blog post slug to read (alternative to postId)'),
      }),
      run: wrapTool(ctx, 'get_post', async (input) => {
        if (!input.postId && !input.slug) {
          return JSON.stringify({ error: 'Either postId or slug is required.' });
        }
        await dbConnect();

        const query: any = { owner: ctx.userId };
        if (input.postId) query._id = input.postId;
        else query.slug = input.slug;

        const post = await BlogPost.findOne(query)
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

    betaZodTool({
      name: 'audit_content',
      description: 'Audit published blog posts for SEO and quality issues. Checks for missing meta descriptions, thin content, missing featured images, missing alt text, no internal links, and more. Returns a prioritized list of issues to fix.',
      inputSchema: z.object({
        limit: z.number().optional().describe('Number of posts to audit (default 10, max 20)'),
      }),
      run: wrapTool(ctx, 'audit_content', async (input) => {
        await dbConnect();

        const posts = await BlogPost.find({ owner: ctx.userId, status: 'published' })
          .sort({ publishedAt: -1 })
          .limit(Math.min(input.limit || 10, 20))
          .select('title slug description seoTitle seoDescription featuredImage tags readTime publishedAt')
          .lean();

        const components = await BlogComponent.find({
          blogPost: { $in: posts.map((p: any) => p._id) },
        })
          .select('blogPost type content url alt')
          .lean();

        const componentsByPost = new Map<string, any[]>();
        for (const c of components) {
          const postId = (c as any).blogPost.toString();
          if (!componentsByPost.has(postId)) componentsByPost.set(postId, []);
          componentsByPost.get(postId)!.push(c);
        }

        const audits = posts.map((post: any) => {
          const postComponents = componentsByPost.get(post._id.toString()) || [];
          const textComponents = postComponents.filter((c: any) => c.type === 'text' || c.type === 'paragraph');
          const imageComponents = postComponents.filter((c: any) => c.type === 'image');
          const totalWordCount = textComponents.reduce((sum: number, c: any) => {
            return sum + (c.content ? c.content.split(/\s+/).length : 0);
          }, 0);

          const hasInternalLinks = textComponents.some((c: any) =>
            c.content && /\[.*?\]\(\/blog\//.test(c.content)
          );

          const issues: string[] = [];

          if (!post.seoDescription && !post.description) issues.push('Missing meta description');
          if (!post.seoTitle) issues.push('Missing SEO title');
          if (!post.featuredImage) issues.push('Missing featured image');
          if (!post.tags || post.tags.length === 0) issues.push('No tags');
          if (totalWordCount < 300) issues.push(`Thin content (${totalWordCount} words)`);
          if (imageComponents.length === 0) issues.push('No images in content');
          const missingAlt = imageComponents.filter((c: any) => !c.alt).length;
          if (missingAlt > 0) issues.push(`${missingAlt} image(s) missing alt text`);
          if (!hasInternalLinks) issues.push('No internal links detected');

          return {
            id: post._id.toString(),
            title: post.title,
            slug: post.slug,
            publishedAt: post.publishedAt?.toISOString(),
            wordCount: totalWordCount,
            componentCount: postComponents.length,
            imageCount: imageComponents.length,
            issues,
            score: Math.max(0, 100 - issues.length * 12),
          };
        });

        const totalIssues = audits.reduce((sum, a) => sum + a.issues.length, 0);
        const avgScore = audits.length > 0
          ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length)
          : 0;

        return JSON.stringify({
          summary: `Audited ${audits.length} posts: ${totalIssues} issues found, average score ${avgScore}/100`,
          averageScore: avgScore,
          posts: audits.sort((a, b) => a.score - b.score),
        });
      }),
    }),

    betaZodTool({
      name: 'check_keyword_cannibalization',
      description: 'Find posts that may be competing for the same keywords (keyword cannibalization). This hurts SEO because Google doesn\'t know which page to rank. Returns groups of posts targeting similar keywords.',
      inputSchema: z.object({}),
      run: wrapTool(ctx, 'check_keyword_cannibalization', async () => {
        await dbConnect();

        const posts = await BlogPost.find({ owner: ctx.userId, status: 'published' })
          .select('title slug tags seoTitle seoDescription')
          .lean();

        const topics = await Topic.find({ owner: ctx.userId, status: 'completed' })
          .select('topic seo.primaryKeyword seo.secondaryKeywords generatedPostId')
          .lean();

        // Build keyword-to-post mapping
        const keywordMap = new Map<string, Array<{ title: string; slug: string; postId: string; source: string }>>();

        for (const post of posts) {
          const postId = (post as any)._id.toString();
          const keywords: string[] = [];

          if ((post as any).tags) keywords.push(...(post as any).tags);
          if ((post as any).seoTitle) {
            keywords.push(...(post as any).seoTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
          }

          // Find matching topic for primary keyword
          const matchingTopic = topics.find((t: any) => t.generatedPostId === postId);
          if (matchingTopic) {
            const seo = (matchingTopic as any).seo;
            if (seo?.primaryKeyword) keywords.push(seo.primaryKeyword.toLowerCase());
            if (seo?.secondaryKeywords) keywords.push(...seo.secondaryKeywords.map((k: string) => k.toLowerCase()));
          }

          const normalized = Array.from(new Set(keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 3)));
          for (const kw of normalized) {
            if (!keywordMap.has(kw)) keywordMap.set(kw, []);
            keywordMap.get(kw)!.push({
              title: (post as any).title,
              slug: (post as any).slug,
              postId,
              source: matchingTopic ? 'keyword' : 'tag',
            });
          }
        }

        // Find cannibalization: keywords mapped to 2+ posts
        const conflicts = Array.from(keywordMap.entries())
          .filter(([, posts]) => posts.length >= 2)
          .map(([keyword, posts]) => ({ keyword, posts, count: posts.length }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        return JSON.stringify({
          summary: `Found ${conflicts.length} keywords targeted by multiple posts`,
          totalPostsAnalyzed: posts.length,
          conflicts,
        });
      }),
    }),

    betaZodTool({
      name: 'check_post_rankings',
      description: 'Check where blog posts rank in Google search results for their target keywords using DataForSEO SERP API. Returns current ranking position for each post/keyword combination.',
      inputSchema: z.object({
        postIds: z.array(z.string()).max(5).optional().describe('Specific post IDs to check (default: 5 most recent published posts)'),
        domain: z.string().describe('Your blog domain (e.g., "yourblog.com") to search for in results'),
        location: z.string().optional().describe('Location for search data (default: "United States")'),
      }),
      run: wrapTool(ctx, 'check_post_rankings', async (input) => {
        await dbConnect();

        let posts;
        if (input.postIds && input.postIds.length > 0) {
          posts = await BlogPost.find({
            _id: { $in: input.postIds },
            owner: ctx.userId,
          }).select('title slug seoTitle tags').lean();
        } else {
          posts = await BlogPost.find({ owner: ctx.userId, status: 'published' })
            .sort({ publishedAt: -1 })
            .limit(5)
            .select('title slug seoTitle tags')
            .lean();
        }

        if (posts.length === 0) {
          return JSON.stringify({ error: 'No published posts found' });
        }

        // Get primary keywords from topics
        const postIds = posts.map((p: any) => p._id.toString());
        const topics = await Topic.find({
          owner: ctx.userId,
          generatedPostId: { $in: postIds },
        }).select('generatedPostId seo.primaryKeyword').lean();

        const topicMap = new Map(
          topics.map((t: any) => [t.generatedPostId, t.seo?.primaryKeyword])
        );

        // Check rankings via DataForSEO SERP API
        const login = process.env.DATAFORSEO_LOGIN;
        const password = process.env.DATAFORSEO_PASSWORD;

        if (!login || !password) {
          return JSON.stringify({ error: 'DataForSEO credentials not configured' });
        }

        const authString = Buffer.from(`${login}:${password}`).toString('base64');
        const locationCodes: Record<string, number> = {
          'United States': 2840, 'United Kingdom': 2826, 'Canada': 2124,
          'Australia': 2036, 'Germany': 2276, 'India': 2356,
        };
        const locationCode = locationCodes[input.location || 'United States'] || 2840;

        const rankings: Array<{
          postTitle: string;
          slug: string;
          keyword: string;
          position: number | null;
          url: string | null;
          title: string | null;
        }> = [];

        for (const post of posts) {
          const postId = (post as any)._id.toString();
          const keyword = topicMap.get(postId) || (post as any).tags?.[0];
          if (!keyword) continue;

          try {
            const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{
                keyword,
                location_code: locationCode,
                language_code: 'en',
                depth: 100,
              }]),
            });

            if (!response.ok) {
              rankings.push({
                postTitle: (post as any).title,
                slug: (post as any).slug,
                keyword,
                position: null,
                url: null,
                title: null,
              });
              continue;
            }

            const data = await response.json();
            const items = data.tasks?.[0]?.result?.[0]?.items || [];
            const domain = input.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const match = items.find((item: any) =>
              item.type === 'organic' && item.url?.includes(domain)
            );

            rankings.push({
              postTitle: (post as any).title,
              slug: (post as any).slug,
              keyword,
              position: match?.rank_group || null,
              url: match?.url || null,
              title: match?.title || null,
            });
          } catch (error: any) {
            rankings.push({
              postTitle: (post as any).title,
              slug: (post as any).slug,
              keyword,
              position: null,
              url: null,
              title: `Error: ${error.message}`,
            });
          }
        }

        const ranked = rankings.filter(r => r.position !== null);
        const avgPosition = ranked.length > 0
          ? Math.round(ranked.reduce((sum, r) => sum + (r.position || 0), 0) / ranked.length)
          : null;

        return JSON.stringify({
          summary: `Checked ${rankings.length} posts: ${ranked.length} found in top 100, average position ${avgPosition || 'N/A'}`,
          domain: input.domain,
          rankings,
        });
      }),
    }),
  ];
}
