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
  type: 'start' | 'thinking' | 'tool_call' | 'tool_result' | 'evaluation' | 'complete' | 'error';
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
 * Pretty print a separator line
 */
function logSeparator(char: string = '─', length: number = 80) {
  console.log(char.repeat(length));
}

/**
 * Pretty print a section header
 */
function logHeader(title: string) {
  logSeparator('═');
  console.log(`║ ${title}`);
  logSeparator('═');
}

/**
 * Pretty print a subsection
 */
function logSubsection(title: string) {
  console.log(`\n┌${'─'.repeat(78)}┐`);
  console.log(`│ ${title.padEnd(76)} │`);
  console.log(`└${'─'.repeat(78)}┘`);
}

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

    console.log(`\n   🔍 PERPLEXITY SEARCH: "${query}"`);
    console.log(`      Type: ${infoType} | Recency: ${recency || 'last-year'}`);

    addLog('tool_call', `searchTopicInfo: "${query}"`, {
      tool: 'searchTopicInfo',
      infoType,
      recency
    }, turn);

    try {
      const searchStart = Date.now();
      const response = await provider.searchTopicInfo({
        query,
        infoType,
        recency: recency || 'last-year'
      });
      const searchDuration = ((Date.now() - searchStart) / 1000).toFixed(1);

      console.log(`   ✅ Search completed in ${searchDuration}s`);
      console.log(`      Content: ${response.content.length} chars | Citations: ${response.citations?.length || 0}`);

      // Show more of the search result
      console.log(`\n   ┌─ SEARCH RESULT PREVIEW ${'─'.repeat(52)}┐`);
      const previewLines = response.content.substring(0, 800).split('\n').slice(0, 12);
      previewLines.forEach(line => {
        if (line.trim()) {
          const truncated = line.length > 90 ? line.substring(0, 90) + '...' : line;
          console.log(`   │ ${truncated}`);
        }
      });
      if (response.content.length > 800) {
        console.log(`   │ ... (${response.content.length - 800} more chars)`);
      }
      console.log(`   └${'─'.repeat(75)}┘`);

      // Show citations
      if (response.citations && response.citations.length > 0) {
        console.log(`   📚 Citations: ${response.citations.slice(0, 5).join(', ')}${response.citations.length > 5 ? '...' : ''}`);
      }

      addLog('tool_result', `Search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`, {
        resultLength: response.content.length,
        citations: response.citations?.length || 0,
        durationSeconds: parseFloat(searchDuration)
      }, turn);

      // Return both content and citations
      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      console.log(`   ✗ Search failed: ${errorMsg}`);
      addLog('error', `searchTopicInfo failed: ${errorMsg}`, undefined, turn);
      return JSON.stringify({ error: true, message: errorMsg });
    }
  }

  if (toolName === 'searchExpertOpinions') {
    const { query, expertiseArea, sourceType } = toolInput;

    console.log(`\n   🎓 EXPERT SEARCH: "${query}"`);
    console.log(`      Expertise: ${expertiseArea} | Source: ${sourceType || 'any'}`);

    addLog('tool_call', `searchExpertOpinions: "${query}"`, {
      tool: 'searchExpertOpinions',
      expertiseArea,
      sourceType
    }, turn);

    try {
      const searchStart = Date.now();
      const response = await provider.searchExpertOpinions({
        query,
        expertiseArea,
        sourceType: sourceType || 'any'
      });
      const searchDuration = ((Date.now() - searchStart) / 1000).toFixed(1);

      console.log(`   ✅ Expert search completed in ${searchDuration}s`);
      console.log(`      Content: ${response.content.length} chars | Citations: ${response.citations?.length || 0}`);

      // Show more of the search result
      console.log(`\n   ┌─ EXPERT SEARCH RESULT PREVIEW ${'─'.repeat(45)}┐`);
      const previewLines = response.content.substring(0, 800).split('\n').slice(0, 12);
      previewLines.forEach(line => {
        if (line.trim()) {
          const truncated = line.length > 90 ? line.substring(0, 90) + '...' : line;
          console.log(`   │ ${truncated}`);
        }
      });
      if (response.content.length > 800) {
        console.log(`   │ ... (${response.content.length - 800} more chars)`);
      }
      console.log(`   └${'─'.repeat(75)}┘`);

      // Show citations
      if (response.citations && response.citations.length > 0) {
        console.log(`   📚 Citations: ${response.citations.slice(0, 5).join(', ')}${response.citations.length > 5 ? '...' : ''}`);
      }

      addLog('tool_result', `Expert search returned ${response.content.length} chars, ${response.citations?.length || 0} citations`, {
        resultLength: response.content.length,
        citations: response.citations?.length || 0,
        durationSeconds: parseFloat(searchDuration)
      }, turn);

      return JSON.stringify({
        content: response.content,
        citations: response.citations || []
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Search failed';
      console.log(`   ✗ Expert search failed: ${errorMsg}`);
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

    // Pretty print research start
    console.log('\n');
    logHeader('🔬 AGENTIC RESEARCH PHASE STARTED');
    console.log(`│ Topic: "${topic}"`);
    console.log(`│ Audience: ${audience || 'General'}`);
    console.log(`│ SEO Keywords: ${seoKeywords.length > 0 ? seoKeywords.join(', ') : 'None'}`);
    console.log(`│ Max Turns: ${MAX_TURNS}`);
    console.log(`│ Timeout: ${maxDuration}s`);
    logSeparator('─');

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

      logSubsection(`🔄 TURN ${turn} of ${MAX_TURNS}`);
      console.log(`\n   Calling Claude (claude-sonnet-4-20250514)...`);

      const turnStart = Date.now();

      // Call Claude
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,  // Increased to handle large research JSON output
        system: systemPrompt,
        tools: researchTools,
        messages
      });

      const turnDuration = ((Date.now() - turnStart) / 1000).toFixed(1);
      console.log(`   Claude responded in ${turnDuration}s | Stop reason: ${response.stop_reason}`);

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

        // Log Claude's thinking/reasoning - FULL OUTPUT
        if (textBlocks.length > 0) {
          const thinkingText = textBlocks.map(b => b.text).join('\n');
          if (thinkingText.length > 10) {
            console.log(`\n   ┌─────────────────────────────────────────────────────────────────────────┐`);
            console.log(`   │ 💭 CLAUDE'S THINKING & EVALUATION                                       │`);
            console.log(`   └─────────────────────────────────────────────────────────────────────────┘`);
            // Show full thinking, just wrap lines
            const lines = thinkingText.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                // Wrap long lines
                const wrapped = line.match(/.{1,100}/g) || [line];
                wrapped.forEach((segment, idx) => {
                  console.log(`   │ ${idx === 0 ? '' : '  '}${segment.trim()}`);
                });
              }
            });
            console.log(`   └${'─'.repeat(75)}┘`);

            addLog('thinking', thinkingText, undefined, turn);
          }
        }

        console.log(`\n   🛠️  TOOL CALLS (${toolUseBlocks.length}):`);

        // Execute each tool and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          totalToolCalls++;
          console.log(`\n   [${totalToolCalls}] ${toolUse.name}`);

          // Log the tool input
          const inputStr = JSON.stringify(toolUse.input, null, 2);
          const inputLines = inputStr.split('\n');
          inputLines.forEach(line => console.log(`       ${line}`));

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

      } else if (response.stop_reason === 'end_turn' || response.stop_reason === 'max_tokens') {
        // Claude is done or hit token limit - extract final response
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );

        finalResponse = textBlocks.map(b => b.text).join('\n');

        if (response.stop_reason === 'max_tokens') {
          console.log(`\n   ⚠️  CLAUDE HIT MAX_TOKENS LIMIT`);
          console.log(`      Response may be truncated. Length: ${finalResponse.length} chars`);
          addLog('error', 'Hit max_tokens limit - response may be truncated', {
            responseLength: finalResponse.length,
            turn
          });
        } else {
          console.log(`\n   ✅ CLAUDE FINISHED RESEARCHING`);
          console.log(`      Final response length: ${finalResponse.length} chars`);
        }

        addLog('complete', 'Research complete', {
          totalTurns: turn,
          toolCalls: totalToolCalls,
          durationSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
          stopReason: response.stop_reason
        });

        break;
      } else {
        // Unexpected stop reason
        console.log(`\n   ⚠️  Unexpected stop reason: ${response.stop_reason}`);
        addLog('error', `Unexpected stop reason: ${response.stop_reason}`, undefined, turn);
        break;
      }
    }

    if (turn >= MAX_TURNS) {
      console.log(`\n   ⚠️  Reached maximum turns (${MAX_TURNS})`);
      addLog('error', `Reached maximum turns (${MAX_TURNS})`, undefined, turn);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Parse the final result
    let researchData: ResearchResult | null = null;
    try {
      researchData = cleanAndParseJSON(finalResponse);
    } catch (parseError) {
      console.log(`\n   ⚠️  Failed to parse JSON response, attempting extraction...`);
      // Try to extract JSON from the response
      const jsonMatch = finalResponse.match(/\{[\s\S]*"researchComplete"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          researchData = JSON.parse(jsonMatch[0]);
          console.log(`   ✓ Successfully extracted JSON`);
        } catch (e) {
          console.log(`   ✗ Failed to extract JSON from response`);
        }
      }
    }

    // Print final summary
    logSubsection('📊 RESEARCH SUMMARY');

    if (!researchData || !researchData.researchComplete) {
      console.log(`\n   ⚠️  Research did not complete successfully`);
      console.log(`      Duration: ${duration}s | Turns: ${turn} | Tool Calls: ${totalToolCalls}`);

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

    // Log research results - FULL DETAILS
    console.log('\n');
    logHeader('✅ RESEARCH COMPLETED SUCCESSFULLY');
    console.log(`│ Duration: ${duration}s | Turns: ${turn} | Tool Calls: ${totalToolCalls}`);
    console.log(`│ Confidence Level: ${researchData.confidenceLevel?.toUpperCase() || 'UNKNOWN'}`);
    logSeparator('─');

    // Summary
    if (researchData.summary) {
      console.log(`\n┌─ 📝 RESEARCH SUMMARY ${'─'.repeat(56)}┐`);
      const summaryLines = researchData.summary.match(/.{1,76}/g) || [researchData.summary];
      summaryLines.forEach(line => console.log(`│ ${line.padEnd(76)} │`));
      console.log(`└${'─'.repeat(78)}┘`);
    }

    // ALL Statistics
    console.log(`\n┌─ 📊 STATISTICS FOUND (${researchData.statistics?.length || 0}) ${'─'.repeat(50)}┐`);
    if (researchData.statistics && researchData.statistics.length > 0) {
      researchData.statistics.forEach((stat, i) => {
        console.log(`│`);
        console.log(`│ ${i + 1}. FACT: ${stat.fact || 'N/A'}`);
        console.log(`│    SOURCE: ${stat.source || 'Unknown'}${stat.year ? ` (${stat.year})` : ''}`);
        if (stat.sourceUrl) console.log(`│    URL: ${stat.sourceUrl}`);
        if (stat.relevance) console.log(`│    RELEVANCE: ${stat.relevance}`);
      });
    } else {
      console.log(`│ No statistics found`);
    }
    console.log(`└${'─'.repeat(78)}┘`);

    // ALL Expert Quotes
    console.log(`\n┌─ 💬 EXPERT QUOTES (${researchData.expertQuotes?.length || 0}) ${'─'.repeat(53)}┐`);
    if (researchData.expertQuotes && researchData.expertQuotes.length > 0) {
      researchData.expertQuotes.forEach((quote, i) => {
        console.log(`│`);
        console.log(`│ ${i + 1}. "${quote.quote || 'N/A'}"`);
        console.log(`│    — ${quote.expert || 'Unknown'}${quote.title ? `, ${quote.title}` : ''}${quote.organization ? ` at ${quote.organization}` : ''}`);
        if (quote.sourceUrl) console.log(`│    URL: ${quote.sourceUrl}`);
      });
    } else {
      console.log(`│ No expert quotes found`);
    }
    console.log(`└${'─'.repeat(78)}┘`);

    // ALL Trends
    console.log(`\n┌─ 📈 TRENDS (${researchData.trends?.length || 0}) ${'─'.repeat(60)}┐`);
    if (researchData.trends && researchData.trends.length > 0) {
      researchData.trends.forEach((trend, i) => {
        console.log(`│`);
        console.log(`│ ${i + 1}. ${trend.trend || 'N/A'}`);
        console.log(`│    Source: ${trend.source || 'Unknown'}`);
        if (trend.sourceUrl) console.log(`│    URL: ${trend.sourceUrl}`);
      });
    } else {
      console.log(`│ No trends found`);
    }
    console.log(`└${'─'.repeat(78)}┘`);

    // ALL Key Points
    console.log(`\n┌─ 🎯 KEY POINTS FOR BLOG (${researchData.keyPoints?.length || 0}) ${'─'.repeat(47)}┐`);
    if (researchData.keyPoints && researchData.keyPoints.length > 0) {
      researchData.keyPoints.forEach((point, i) => {
        console.log(`│ ${i + 1}. ${point}`);
      });
    } else {
      console.log(`│ No key points identified`);
    }
    console.log(`└${'─'.repeat(78)}┘`);

    console.log('\n');
    logSeparator('═');
    console.log(`║ 🔬 RESEARCH PHASE COMPLETE - Ready for content generation`);
    logSeparator('═');
    console.log('\n');

    // Add metadata to research
    const enrichedResearch = {
      ...researchData,
      _metadata: {
        provider: 'claude-orchestrated',
        model: 'claude-sonnet-4-5-20250929',
        searchProvider: 'perplexity-sonar-pro',
        timestamp: new Date().toISOString(),
        totalTurns: turn,
        toolCalls: totalToolCalls,
        durationSeconds: parseFloat(duration)
      }
    };

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
    console.log(`\n   ❌ RESEARCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logSeparator('═');

    return NextResponse.json({
      success: false,
      error: 'Failed to conduct research',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
