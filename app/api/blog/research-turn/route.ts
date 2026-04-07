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
import { ExaProvider } from '@/lib/ai-providers/exa-provider';
import { researchTools, ResearchResult, ResearchBrief } from '@/lib/research/research-tools';
import {
  generateResearchSystemPrompt,
  generateResearchUserPrompt,
  generateExploratorySystemPrompt,
  generateExploratoryUserPrompt,
} from '@/lib/research/research-prompts';
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

const getExaProvider = () => {
  if (!process.env.EXA_API_KEY) return null;
  return new ExaProvider({
    apiKey: process.env.EXA_API_KEY,
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

  // Exa tools
  if (toolName === 'searchWithExa') {
    const exaProvider = getExaProvider();
    if (!exaProvider) {
      return JSON.stringify({ error: true, message: 'EXA_API_KEY not configured — use searchTopicInfo instead' });
    }
    const { query, numResults, category, includeDomains, startDate } = toolInput;
    console.log(`[research-turn] searchWithExa: "${query}"`);

    try {
      const response = await exaProvider.searchContent({
        query,
        numResults: Math.min(numResults || 5, 10),
        category,
        includeDomains,
        startPublishedDate: startDate,
      });
      console.log(`[research-turn] Exa search returned ${response.results.length} results`);
      return JSON.stringify({
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          highlights: r.highlights,
          text: r.text?.substring(0, 2000),
          publishedDate: r.publishedDate,
          author: r.author,
        }))
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Exa search failed';
      console.log(`[research-turn] searchWithExa failed: ${errorMsg}`);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  if (toolName === 'findSimilarContent') {
    const exaProvider = getExaProvider();
    if (!exaProvider) {
      return JSON.stringify({ error: true, message: 'EXA_API_KEY not configured' });
    }
    const { url, numResults } = toolInput;
    console.log(`[research-turn] findSimilarContent: "${url}"`);

    try {
      const response = await exaProvider.findSimilar({
        url,
        numResults: numResults || 5,
      });
      console.log(`[research-turn] Exa findSimilar returned ${response.results.length} results`);
      return JSON.stringify({
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          highlights: r.highlights,
          text: r.text?.substring(0, 2000),
          publishedDate: r.publishedDate,
        }))
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Exa findSimilar failed';
      console.log(`[research-turn] findSimilarContent failed: ${errorMsg}`);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  if (toolName === 'getFullContent') {
    const exaProvider = getExaProvider();
    if (!exaProvider) {
      return JSON.stringify({ error: true, message: 'EXA_API_KEY not configured' });
    }
    const { urls } = toolInput;
    const limitedUrls = (urls as string[]).slice(0, 3); // Max 3 at a time
    console.log(`[research-turn] getFullContent: ${limitedUrls.length} URLs`);

    try {
      const response = await exaProvider.getContents({ urls: limitedUrls });
      console.log(`[research-turn] Exa getContents returned ${response.results.length} pages`);
      return JSON.stringify({
        results: response.results.map(r => ({
          title: r.title,
          url: r.url,
          text: r.text?.substring(0, 5000),
          publishedDate: r.publishedDate,
          author: r.author,
        }))
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Exa getContents failed';
      console.log(`[research-turn] getFullContent failed: ${errorMsg}`);
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
    let model: string;

    const researchMode = topic.researchMode || 'guided';

    if (!topic.researchState || !topic.researchState.messages) {
      // First turn — initialize conversation
      console.log(`[research-turn] First turn for topic ${topicId}: "${topic.topic}" (mode: ${researchMode})`);

      const seoKeywords: string[] = [];
      if (topic.seo?.primaryKeyword) seoKeywords.push(topic.seo.primaryKeyword);
      if (topic.seo?.secondaryKeywords?.length) seoKeywords.push(...topic.seo.secondaryKeywords);

      if (researchMode === 'exploratory') {
        systemPrompt = generateExploratorySystemPrompt(
          topic.topic,
          topic.audience || '',
          seoKeywords
        );
        const userPrompt = generateExploratoryUserPrompt(topic.topic);
        messages = [{ role: 'user', content: userPrompt }];
        model = 'claude-opus-4-6';
      } else {
        systemPrompt = generateResearchSystemPrompt(
          topic.topic,
          topic.audience || '',
          seoKeywords
        );
        const userPrompt = generateResearchUserPrompt(topic.topic);
        messages = [{ role: 'user', content: userPrompt }];
        model = 'claude-sonnet-4-5-20250929';
      }
      iteration = 1;
    } else {
      // Continuing turn — restore conversation state
      messages = topic.researchState.messages;
      systemPrompt = topic.researchState.systemPrompt;
      model = topic.researchState.model || 'claude-sonnet-4-5-20250929';
      iteration = (topic.researchState.iteration || 0) + 1;
      console.log(`[research-turn] Continuing turn ${iteration} for topic ${topicId} (model: ${model})`);
    }

    // Call Claude with the full conversation + tools
    console.log(`[research-turn] Calling Claude ${model} (turn ${iteration})...`);
    const response = await anthropic.messages.create({
      model,
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
          model,
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

    // Determine which search providers were used based on tool calls in conversation
    const searchProviders: string[] = ['perplexity-sonar-pro'];
    const hasExaCalls = messages.some((msg) => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        return msg.content.some((block: any) =>
          block.type === 'tool_use' && ['searchWithExa', 'findSimilarContent', 'getFullContent'].includes(block.name)
        );
      }
      return false;
    });
    if (hasExaCalls) searchProviders.push('exa');

    // Enrich research data with metadata
    const enrichedResearch = researchData ? {
      ...researchData,
      _metadata: {
        provider: 'claude-orchestrated',
        model,
        researchMode,
        searchProviders,
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
