/**
 * Blog Research API Endpoint
 *
 * Uses an agentic loop with Claude as orchestrator and Perplexity for web search.
 * Claude evaluates results, refines searches, and returns high-quality research.
 *
 * Agentic loop pattern:
 * 1. Send message + tools to Claude
 * 2. If Claude responds with tool_use, execute the tools via Perplexity
 * 3. Send tool_result back to Claude
 * 4. Repeat until Claude gives final answer (max 15 iterations)
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PerplexityProvider } from '@/lib/ai-providers/perplexity-provider';
import { researchTools, ResearchResult } from '@/lib/research/research-tools';
import { generateResearchSystemPrompt, generateResearchUserPrompt } from '@/lib/research/research-prompts';
import { cleanAndParseJSON } from '@/lib/utils/clean-json';

export const maxDuration = 120; // 2 minutes for research phase

const MAX_TURNS = 15;

// Debug log entry type
interface DebugLogEntry {
  timestamp: string;
  type: 'start' | 'thinking' | 'tool_call' | 'tool_result' | 'complete' | 'error';
  turn?: number;
  content: string;
  details?: Record<string, any>;
}

// Initialize providers
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
 * Execute a research tool and return the result
 */
async function executeResearchTool(
  toolName: string,
  toolInput: Record<string, any>,
  addLog: (type: DebugLogEntry['type'], content: string, details?: Record<string, any>, turn?: number) => void,
  turn: number
): Promise<string> {
  const provider = getPerplexityProvider();

  if (toolName === 'searchTopicInfo') {
    const { query, infoType, recency } = toolInput;

    addLog('tool_call', `searchTopicInfo: "${query}"`, {
      tool: 'searchTopicInfo',
      infoType,
      recency
    }, turn);

    try {
      const response = await provider.searchTopicInfo({
        query,
        infoType,
        recency: recency || 'last-year'
      });

      addLog('tool_result', `Search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`, {
        resultLength: response.content.length,
        citations: response.citations?.length || 0
      }, turn);

      // Return both content and citations
      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      addLog('error', `searchTopicInfo failed: ${errorMsg}`, undefined, turn);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  if (toolName === 'searchExpertOpinions') {
    const { query, expertiseArea, sourceType } = toolInput;

    addLog('tool_call', `searchExpertOpinions: "${query}"`, {
      tool: 'searchExpertOpinions',
      expertiseArea,
      sourceType
    }, turn);

    try {
      const response = await provider.searchExpertOpinions({
        query,
        expertiseArea,
        sourceType: sourceType || 'any'
      });

      addLog('tool_result', `Expert search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`, {
        resultLength: response.content.length,
        citations: response.citations?.length || 0
      }, turn);

      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      addLog('error', `searchExpertOpinions failed: ${errorMsg}`, undefined, turn);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  return JSON.stringify({ error: true, message: `Unknown tool: ${toolName}` });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { topic, audience, seoKeywords = [], additionalContext } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Check for required API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Research] Missing ANTHROPIC_API_KEY');
      return NextResponse.json({ error: 'Missing Anthropic API key' }, { status: 500 });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('[Research] Missing PERPLEXITY_API_KEY');
      return NextResponse.json({
        error: 'Missing Perplexity API key',
        message: 'Research requires PERPLEXITY_API_KEY to be configured'
      }, { status: 500 });
    }

    console.log('[Research] Starting research for topic:', topic);
    console.log('[Research] Audience:', audience);
    console.log('[Research] SEO Keywords:', seoKeywords);

    // Debug logs collection
    const debugLogs: DebugLogEntry[] = [];
    const addLog = (type: DebugLogEntry['type'], content: string, details?: Record<string, any>, turn?: number) => {
      const entry: DebugLogEntry = {
        timestamp: new Date().toISOString(),
        type,
        content,
        ...(details && { details }),
        ...(turn !== undefined && { turn })
      };
      debugLogs.push(entry);
      console.log(`[Research ${type.toUpperCase()}]`, content, details ? JSON.stringify(details).slice(0, 200) : '');
    };

    addLog('start', `Beginning research for topic: "${topic}"`, {
      audience,
      seoKeywords
    });

    // Initialize Anthropic client
    const anthropic = getAnthropicClient();

    // Generate prompts
    const systemPrompt = generateResearchSystemPrompt(topic, audience || '', seoKeywords);
    const userPrompt = generateResearchUserPrompt(topic);

    // Build initial messages
    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userPrompt }
    ];

    let turn = 0;
    let totalToolCalls = 0;
    let finalResponse = '';

    // Agentic loop - keep going until Claude gives a final answer without tool calls
    while (turn < MAX_TURNS) {
      turn++;
      console.log(`[Research] Turn ${turn}...`);

      // Call Claude
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        tools: researchTools,
        messages
      });

      console.log(`[Research] Turn ${turn} stop_reason: ${response.stop_reason}`);

      // Check if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        // Process tool calls
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Also capture any text Claude included (thinking)
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        if (textBlocks.length > 0) {
          const thinkingText = textBlocks.map(b => b.text).join('\n');
          if (thinkingText.length > 20) {
            addLog('thinking', thinkingText.slice(0, 500) + (thinkingText.length > 500 ? '...' : ''), undefined, turn);
          }
        }

        // Execute each tool and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          totalToolCalls++;
          const result = await executeResearchTool(
            toolUse.name,
            toolUse.input as Record<string, any>,
            addLog,
            turn
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          });
        }

        // Add assistant message and tool results to conversation
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });

      } else if (response.stop_reason === 'end_turn') {
        // Claude is done - extract final response
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        finalResponse = textBlocks.map(b => b.text).join('\n');

        addLog('complete', 'Research complete', {
          totalTurns: turn,
          toolCalls: totalToolCalls,
          durationSeconds: ((Date.now() - startTime) / 1000).toFixed(1)
        });

        break;
      } else {
        // Unexpected stop reason
        console.error('[Research] Unexpected stop reason:', response.stop_reason);
        addLog('error', `Unexpected stop reason: ${response.stop_reason}`, undefined, turn);
        break;
      }
    }

    if (turn >= MAX_TURNS) {
      addLog('error', `Reached maximum turns (${MAX_TURNS})`, undefined, turn);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Research] Research complete in ${duration}s, ${turn} turns, ${totalToolCalls} tool calls`);

    // Parse the final result
    let researchData: ResearchResult | null = null;
    try {
      researchData = cleanAndParseJSON(finalResponse);
    } catch (parseError) {
      console.error('[Research] Failed to parse JSON response:', parseError);
      // Try to extract JSON from the response
      const jsonMatch = finalResponse.match(/\{[\s\S]*"researchComplete"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          researchData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('[Research] Failed to extract JSON from response');
        }
      }
    }

    if (!researchData || !researchData.researchComplete) {
      console.error('[Research] Invalid research output');
      addLog('error', 'Failed to parse final response as valid research JSON', {
        responseLength: finalResponse.length
      });

      // Return a minimal research result so generation can continue
      return NextResponse.json({
        success: false,
        error: 'Research did not complete successfully',
        research: {
          researchComplete: false,
          summary: 'Research was attempted but did not return valid results.',
          statistics: [],
          expertQuotes: [],
          trends: [],
          keyPoints: [],
          searchIterations: turn,
          confidenceLevel: 'low' as const
        },
        metadata: {
          turns: turn,
          toolCalls: totalToolCalls,
          durationSeconds: parseFloat(duration),
          timestamp: new Date().toISOString()
        },
        debugLogs
      });
    }

    // Add metadata to research
    const enrichedResearch = {
      ...researchData,
      _metadata: {
        provider: 'claude-orchestrated',
        model: 'claude-sonnet-4-20250514',
        searchProvider: 'perplexity-sonar-pro',
        timestamp: new Date().toISOString(),
        totalTurns: turn,
        toolCalls: totalToolCalls,
        durationSeconds: parseFloat(duration)
      }
    };

    console.log('[Research] Research complete, statistics:', researchData.statistics?.length || 0);
    console.log('[Research] Research complete, expertQuotes:', researchData.expertQuotes?.length || 0);
    console.log('[Research] Research complete, trends:', researchData.trends?.length || 0);

    return NextResponse.json({
      success: true,
      research: enrichedResearch,
      metadata: {
        turns: turn,
        toolCalls: totalToolCalls,
        durationSeconds: parseFloat(duration),
        timestamp: new Date().toISOString()
      },
      debugLogs
    });

  } catch (error) {
    console.error('[Research] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to conduct research',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
