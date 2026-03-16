/**
 * Single-Turn Research Endpoint
 *
 * Handles exactly ONE turn of the agentic research loop.
 * Conversation state is persisted in MongoDB (topic.researchState)
 * so the Upstash Workflow can call this repeatedly, each time getting
 * a fresh 300s serverless invocation.
 *
 * Input: { topicId }
 * Output: { done: boolean, iteration: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PerplexityProvider } from '@/lib/ai-providers/perplexity-provider';
import { researchTools, ResearchResult } from '@/lib/research/research-tools';
import { generateResearchSystemPrompt, generateResearchUserPrompt } from '@/lib/research/research-prompts';
import { cleanAndParseJSON } from '@/lib/utils/clean-json';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

const getAnthropicClient = () => {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
};

const getPerplexityProvider = () => {
  return new PerplexityProvider({
    apiKey: process.env.PERPLEXITY_API_KEY!,
    model: 'sonar-pro',
  });
};

/**
 * Execute a research tool (Perplexity search) and return the result string
 */
async function executeResearchTool(
  toolName: string,
  toolInput: Record<string, any>
): Promise<string> {
  const provider = getPerplexityProvider();

  if (toolName === 'searchTopicInfo') {
    const { query, infoType, recency } = toolInput;
    console.log(`[research-turn] searchTopicInfo: "${query}" (${infoType})`);

    try {
      const response = await provider.searchTopicInfo({
        query,
        infoType,
        recency: recency || 'last-year'
      });
      console.log(`[research-turn] Search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`);
      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      console.log(`[research-turn] searchTopicInfo failed: ${errorMsg}`);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  if (toolName === 'searchExpertOpinions') {
    const { query, expertiseArea, sourceType } = toolInput;
    console.log(`[research-turn] searchExpertOpinions: "${query}" (${expertiseArea})`);

    try {
      const response = await provider.searchExpertOpinions({
        query,
        expertiseArea,
        sourceType: sourceType || 'any'
      });
      console.log(`[research-turn] Expert search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`);
      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      console.log(`[research-turn] searchExpertOpinions failed: ${errorMsg}`);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  return JSON.stringify({ error: true, message: `Unknown tool: ${toolName}` });
}

export async function POST(request: NextRequest) {
  const turnStart = Date.now();

  try {
    const body = await request.json();
    const { topicId } = body;

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY || !process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'Missing required API keys' }, { status: 500 });
    }

    await dbConnect();
    const topic = await Topic.findById(topicId);

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const anthropic = getAnthropicClient();

    let messages: Anthropic.MessageParam[];
    let systemPrompt: string;
    let iteration: number;

    if (!topic.researchState || !topic.researchState.messages) {
      // First turn — initialize conversation
      console.log(`[research-turn] First turn for topic ${topicId}: "${topic.topic}"`);

      const seoKeywords: string[] = [];
      if (topic.seo?.primaryKeyword) seoKeywords.push(topic.seo.primaryKeyword);
      if (topic.seo?.secondaryKeywords?.length) seoKeywords.push(...topic.seo.secondaryKeywords);

      systemPrompt = generateResearchSystemPrompt(
        topic.topic,
        topic.audience || '',
        seoKeywords
      );
      const userPrompt = generateResearchUserPrompt(topic.topic);
      messages = [{ role: 'user', content: userPrompt }];
      iteration = 1;
    } else {
      // Continuing turn — restore conversation state
      messages = topic.researchState.messages;
      systemPrompt = topic.researchState.systemPrompt;
      iteration = (topic.researchState.iteration || 0) + 1;
      console.log(`[research-turn] Continuing turn ${iteration} for topic ${topicId}`);
    }

    // Call Claude with the full conversation + tools
    console.log(`[research-turn] Calling Claude (turn ${iteration})...`);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      system: systemPrompt,
      tools: researchTools,
      messages
    });
    const claudeDuration = ((Date.now() - turnStart) / 1000).toFixed(1);
    console.log(`[research-turn] Claude responded in ${claudeDuration}s, stop_reason: ${response.stop_reason}`);

    if (response.stop_reason === 'tool_use') {
      // Claude wants to search — execute tools, save state, return done: false
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeResearchTool(
          toolUse.name,
          toolUse.input as Record<string, any>
        );
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result
        });
      }

      // Append assistant response + tool results to conversation
      const updatedMessages = [
        ...messages,
        { role: 'assistant' as const, content: response.content },
        { role: 'user' as const, content: toolResults }
      ];

      // Save conversation state to MongoDB
      await Topic.findByIdAndUpdate(topicId, {
        researchState: {
          messages: updatedMessages,
          systemPrompt,
          iteration,
          startedAt: topic.researchState?.startedAt || new Date()
        }
      });

      const totalDuration = ((Date.now() - turnStart) / 1000).toFixed(1);
      console.log(`[research-turn] Turn ${iteration} complete (${totalDuration}s), ${toolUseBlocks.length} tool calls executed, continuing...`);

      return NextResponse.json({
        done: false,
        iteration,
        toolCalls: toolUseBlocks.length
      });
    }

    // Claude is done (end_turn or max_tokens) — parse final response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const finalResponse = textBlocks.map(b => b.text).join('\n');

    let researchData: ResearchResult | null = null;
    try {
      researchData = cleanAndParseJSON(finalResponse);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = finalResponse.match(/\{[\s\S]*"researchComplete"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          researchData = JSON.parse(jsonMatch[0]);
        } catch {
          console.log(`[research-turn] Failed to extract JSON from final response`);
        }
      }
    }

    // Calculate total tool calls across all turns
    const totalToolCalls = messages.reduce((count, msg) => {
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        return count + msg.content.filter((block: any) => block.type === 'tool_result').length;
      }
      return count;
    }, 0);

    const totalDurationSeconds = topic.researchState?.startedAt
      ? (Date.now() - new Date(topic.researchState.startedAt).getTime()) / 1000
      : (Date.now() - turnStart) / 1000;

    // Enrich research data with metadata
    const enrichedResearch = researchData ? {
      ...researchData,
      _metadata: {
        provider: 'claude-orchestrated',
        model: 'claude-sonnet-4-5-20250929',
        searchProvider: 'perplexity-sonar-pro',
        timestamp: new Date().toISOString(),
        totalTurns: iteration,
        toolCalls: totalToolCalls,
        durationSeconds: Math.round(totalDurationSeconds)
      }
    } : null;

    // Save research data and clear researchState
    await Topic.findByIdAndUpdate(topicId, {
      researchData: enrichedResearch,
      researchedAt: new Date(),
      $unset: { researchState: 1 }
    });

    console.log(`[research-turn] Research complete after ${iteration} turns, confidence: ${researchData?.confidenceLevel || 'unknown'}`);

    return NextResponse.json({
      done: true,
      iteration,
      confidenceLevel: researchData?.confidenceLevel || 'unknown'
    });

  } catch (error) {
    console.error('[research-turn] Error:', error);
    return NextResponse.json(
      { error: 'Research turn failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
