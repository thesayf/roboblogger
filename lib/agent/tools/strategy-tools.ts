import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { ToolCallInfo, ToolContext } from '../types';
import dbConnect from '@/lib/mongo';
import {
  assignContentStructure,
  assignContentStructureBulk,
  createContentSeries,
  createTopicCluster,
  deleteContentSeries,
  deleteTopicCluster,
  getContentStrategy,
  setClusterPillar,
  updateContentSeries,
  updateTopicCluster,
} from '@/lib/content-strategy-service';

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
      const result = JSON.stringify({ error: error.message });
      callInfo.result = result;
      ctx.sendEvent('tool_end', { toolName, success: false });
      return result;
    }
  };
}

const statusSchema = z.enum(['draft', 'active', 'archived']);
const contentTypeSchema = z.enum(['topic', 'post']);

export function buildStrategyTools(ctx: ToolContext) {
  return [
    betaZodTool({
      name: 'get_content_strategy',
      description: 'Read the complete content strategy: clusters, pillars, series, supporting content, standalone series, and unassigned content. Use before planning or reorganizing content.',
      inputSchema: z.object({
        clusterId: z.string().optional().describe('Optional cluster ID to return in detail'),
      }),
      run: wrapTool(ctx, 'get_content_strategy', async (input) => {
        await dbConnect();
        const strategy = await getContentStrategy(ctx.userId);
        if (!input.clusterId) return JSON.stringify(strategy);
        const cluster = strategy.clusters.find((entry: any) => entry._id === input.clusterId);
        return JSON.stringify(cluster || { error: 'Topic cluster not found' });
      }),
    }),

    betaZodTool({
      name: 'create_topic_cluster',
      description: 'Create a content topic cluster. A cluster can later be given one primary pillar and multiple series or supporting posts.',
      inputSchema: z.object({
        name: z.string(),
        description: z.string().optional(),
        status: statusSchema.optional(),
      }),
      run: wrapTool(ctx, 'create_topic_cluster', async (input) => {
        await dbConnect();
        const cluster = await createTopicCluster(ctx.userId, input);
        ctx.dataChanged.push('strategy');
        return JSON.stringify({
          success: true,
          cluster: { id: cluster._id.toString(), name: cluster.name, status: cluster.status },
        });
      }),
    }),

    betaZodTool({
      name: 'update_topic_cluster',
      description: 'Rename, describe, activate, archive, or otherwise update a topic cluster. Use set_cluster_pillar for its pillar.',
      inputSchema: z.object({
        clusterId: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        status: statusSchema.optional(),
      }),
      run: wrapTool(ctx, 'update_topic_cluster', async (input) => {
        await dbConnect();
        const { clusterId, ...updates } = input;
        const cluster = await updateTopicCluster(ctx.userId, clusterId, updates);
        ctx.dataChanged.push('strategy');
        return JSON.stringify({ success: true, clusterId: cluster._id.toString(), name: cluster.name, status: cluster.status });
      }),
    }),

    betaZodTool({
      name: 'delete_topic_cluster',
      description: 'Permanently delete a topic cluster while preserving its posts and topics as unassigned content. Only use when the user explicitly asks to delete it.',
      inputSchema: z.object({ clusterId: z.string() }),
      run: wrapTool(ctx, 'delete_topic_cluster', async (input) => {
        await dbConnect();
        const result = await deleteTopicCluster(ctx.userId, input.clusterId);
        ctx.dataChanged.push('strategy', 'topics', 'posts');
        return JSON.stringify({ success: true, ...result });
      }),
    }),

    betaZodTool({
      name: 'create_content_series',
      description: 'Create an editorial series inside a topic cluster or as a standalone series.',
      inputSchema: z.object({
        name: z.string(),
        description: z.string().optional(),
        clusterId: z.string().nullable().optional().describe('Cluster ID, or null for a standalone series'),
        status: statusSchema.optional(),
      }),
      run: wrapTool(ctx, 'create_content_series', async (input) => {
        await dbConnect();
        const series = await createContentSeries(ctx.userId, input);
        ctx.dataChanged.push('strategy');
        return JSON.stringify({ success: true, series: { id: series._id.toString(), name: series.name, clusterId: series.clusterId?.toString(), status: series.status } });
      }),
    }),

    betaZodTool({
      name: 'update_content_series',
      description: 'Rename, describe, activate, archive, move, or detach a content series. Setting clusterId to null makes it standalone and updates its content.',
      inputSchema: z.object({
        seriesId: z.string(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        clusterId: z.string().nullable().optional(),
        status: statusSchema.optional(),
      }),
      run: wrapTool(ctx, 'update_content_series', async (input) => {
        await dbConnect();
        const { seriesId, ...updates } = input;
        const series = await updateContentSeries(ctx.userId, seriesId, updates);
        ctx.dataChanged.push('strategy', 'topics', 'posts');
        return JSON.stringify({ success: true, seriesId: series._id.toString(), name: series.name, clusterId: series.clusterId?.toString(), status: series.status });
      }),
    }),

    betaZodTool({
      name: 'delete_content_series',
      description: 'Permanently delete a series while preserving its posts and topics. Only use when the user explicitly asks to delete it.',
      inputSchema: z.object({ seriesId: z.string() }),
      run: wrapTool(ctx, 'delete_content_series', async (input) => {
        await dbConnect();
        const result = await deleteContentSeries(ctx.userId, input.seriesId);
        ctx.dataChanged.push('strategy', 'topics', 'posts');
        return JSON.stringify({ success: true, ...result });
      }),
    }),

    betaZodTool({
      name: 'set_cluster_pillar',
      description: 'Set, replace, or clear the single primary pillar of a cluster. The pillar may be an existing post or a planned topic and is removed from any series.',
      inputSchema: z.object({
        clusterId: z.string(),
        contentType: contentTypeSchema.optional(),
        contentId: z.string().nullable().optional().describe('Post/topic ID, or null to clear the pillar'),
      }),
      run: wrapTool(ctx, 'set_cluster_pillar', async (input) => {
        await dbConnect();
        await setClusterPillar(ctx.userId, input.clusterId, {
          contentType: input.contentType,
          contentId: input.contentId,
        });
        ctx.dataChanged.push('strategy', 'topics', 'posts');
        return JSON.stringify({ success: true, clusterId: input.clusterId, cleared: !input.contentId });
      }),
    }),

    betaZodTool({
      name: 'assign_content_structure',
      description: 'Assign, move, or unassign one post or queued topic. A series inside a cluster automatically determines the cluster. Use null for both IDs to unassign.',
      inputSchema: z.object({
        contentType: contentTypeSchema,
        contentId: z.string(),
        clusterId: z.string().nullable().optional(),
        seriesId: z.string().nullable().optional(),
      }),
      run: wrapTool(ctx, 'assign_content_structure', async (input) => {
        await dbConnect();
        await assignContentStructure(ctx.userId, input);
        ctx.dataChanged.push('strategy', input.contentType === 'topic' ? 'topics' : 'posts');
        return JSON.stringify({ success: true, contentId: input.contentId });
      }),
    }),

    betaZodTool({
      name: 'assign_content_structure_bulk',
      description: 'Assign, move, or unassign up to 20 posts or topics in one operation. Prefer this whenever changing two or more items.',
      inputSchema: z.object({
        assignments: z.array(z.object({
          contentType: contentTypeSchema,
          contentId: z.string(),
          clusterId: z.string().nullable().optional(),
          seriesId: z.string().nullable().optional(),
        })).min(1).max(20),
      }),
      run: wrapTool(ctx, 'assign_content_structure_bulk', async (input) => {
        await dbConnect();
        const results = await assignContentStructureBulk(ctx.userId, input.assignments);
        ctx.dataChanged.push('strategy', 'topics', 'posts');
        return JSON.stringify({
          success: results.every((result) => result.success),
          updated: results.filter((result) => result.success).length,
          results,
        });
      }),
    }),
  ];
}
