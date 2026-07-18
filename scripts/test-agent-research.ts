import assert from 'node:assert/strict';
import type { ToolContext } from '../lib/agent/types';

process.env.DATAFORSEO_LOGIN = 'test-login';
process.env.DATAFORSEO_PASSWORD = 'test-password';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/roboblogger-test';

const originalFetch = global.fetch;
const calledUrls: string[] = [];

function okPayload(result: unknown) {
  return {
    status_code: 20000,
    status_message: 'Ok.',
    tasks_error: 0,
    tasks: [{ status_code: 20000, status_message: 'Ok.', result }],
  };
}

global.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  calledUrls.push(url);

  if (url.includes('/keywords_data/google_ads/search_volume/live')) {
    return new Response(JSON.stringify(okPayload([
      {
        keyword: 'startup seo',
        search_volume: 720,
        competition: 'HIGH',
        competition_index: 82,
        cpc: 6.4,
        monthly_searches: [
          { year: 2026, month: 6, search_volume: 900 },
          { year: 2026, month: 1, search_volume: 600 },
        ],
      },
    ])), { status: 200 });
  }

  if (url.includes('/dataforseo_labs/google/bulk_keyword_difficulty/live')) {
    return new Response(JSON.stringify(okPayload([{
      items: [
        { keyword: 'startup seo', keyword_difficulty: 47 },
        { keyword: 'founder marketing', keyword_difficulty: 31 },
      ],
    }])), { status: 200 });
  }

  if (url.includes('/dataforseo_labs/google/related_keywords/live')) {
    return new Response(JSON.stringify(okPayload([{
      items: [{
        depth: 1,
        keyword_data: {
          keyword: 'seo for startups',
          keyword_info: {
            search_volume: 390,
            competition: 0.42,
            competition_level: 'MEDIUM',
            cpc: 4.2,
            monthly_searches: [
              { year: 2026, month: 6, search_volume: 450 },
              { year: 2026, month: 1, search_volume: 350 },
            ],
          },
          keyword_properties: { keyword_difficulty: 38 },
          search_intent_info: { main_intent: 'commercial' },
        },
      }],
    }])), { status: 200 });
  }

  return new Response('Not found', { status: 404 });
}) as typeof fetch;

async function main() {
  try {
    const [{ buildTools }, longTask, executors] = await Promise.all([
      import('../lib/agent/tools'),
      import('../lib/agent/long-task'),
      import('../lib/seo-research/tool-executors'),
    ]);
    const { getTaskPlanCompletionIssue, requiresResearchPlan } = longTask;
    const { executeSearchKeywordData, executeSearchRelatedKeywords } = executors;

    const keywordResult = await executeSearchKeywordData({
      keywords: ['startup seo', 'founder marketing'],
      location: 'United Kingdom',
      language: 'en',
    });

    assert.equal(keywordResult.keywords[0].keywordDifficulty, 47);
    assert.equal(keywordResult.keywords[0].paidCompetition, 0.82);
    assert.equal(keywordResult.keywords[0].paidCompetitionLevel, 'high');
    assert.equal(keywordResult.keywords[0].trend, 'rising');
    assert.equal(keywordResult.keywords[1].searchVolume, null);
    assert.equal(keywordResult.keywords[1].keywordDifficulty, 31);
    assert.equal(keywordResult.keywords[1].dataAvailable, true);
    assert.match(keywordResult.metricDefinitions.keywordDifficulty, /Organic/);
    assert.match(keywordResult.metricDefinitions.cpc, /USD/);

    const relatedResult = await executeSearchRelatedKeywords({
      seedKeyword: 'startup seo',
      limit: 20,
      location: 'United Kingdom',
    });
    assert.equal(relatedResult.relatedKeywords[0].keywordDifficulty, 38);
    assert.equal(relatedResult.relatedKeywords[0].paidCompetition, 0.42);
    assert.equal(relatedResult.relatedKeywords[0].searchIntent, 'commercial');

    assert(calledUrls.some((url) => url.includes('/bulk_keyword_difficulty/live')));
    assert(calledUrls.some((url) => url.includes('/dataforseo_labs/google/related_keywords/live')));

    const successfulFetch = global.fetch;
    global.fetch = (async () => new Response(JSON.stringify({
      status_code: 20000,
      status_message: 'Ok.',
      tasks_error: 1,
      tasks: [{ status_code: 40501, status_message: 'Invalid task field.', result: null }],
    }), { status: 200 })) as typeof fetch;
    await assert.rejects(
      executeSearchKeywordData({ keywords: ['broken request'] }),
      /DataForSEO task failed/,
    );
    global.fetch = successfulFetch;

    const toolContext: ToolContext = {
      userId: 'test-user',
      clerkId: 'test-clerk',
      sendEvent: () => {},
      dataChanged: [],
      toolCalls: [],
    };
    const tools = buildTools(toolContext);
    const toolNames = tools.map((tool) => tool.name);
    assert(toolNames.includes('manage_task_plan'));
    assert(toolNames.includes('search_keyword_data'));
    assert(toolNames.includes('search_related_keywords'));
    assert(!toolNames.includes('start_deep_research'));

    const delegationEvents: Array<{ event: string; data: any }> = [];
    const delegationContext: ToolContext = {
      userId: 'test-user',
      clerkId: 'test-clerk',
      sendEvent: (event, data) => delegationEvents.push({ event, data }),
      dataChanged: [],
      toolCalls: [],
      deepResearch: {
        start: async (objective) => ({
          workflowRunId: 'workflow-1',
          conversationId: 'conversation-1',
          assistantMessageId: 'assistant-1',
          run: {
            id: 'research-1',
            objective,
            mode: 'premium',
            provider: 'anthropic',
            model: 'claude-sonnet-4-6',
            status: 'queued',
            phase: 'queued',
            phaseDetail: 'Research queued',
            progress: 0,
            creditsUsed: 0,
            createdAt: new Date().toISOString(),
          },
        }),
      },
    };
    const chatTools = buildTools(delegationContext);
    const startDeepResearch = chatTools.find((tool) => tool.name === 'start_deep_research') as any;
    assert(startDeepResearch);
    const delegationResult = JSON.parse(await startDeepResearch.run({
      objective: 'Research the UK startup SEO market with keyword and competitor evidence.',
    }));
    assert.equal(delegationResult.started, true);
    assert.equal(delegationContext.deepResearch?.startedRunId, 'research-1');
    assert.equal(
      delegationEvents.find((entry) => entry.event === 'deep_research_started')?.data.run.id,
      'research-1',
    );

    const repeatedDelegation = JSON.parse(await startDeepResearch.run({
      objective: 'Start the same comprehensive market research again.',
    }));
    assert.equal(repeatedDelegation.runId, 'research-1');
    assert.equal(delegationContext.toolCalls.length, 2);

    const manageTaskPlan = tools.find((tool) => tool.name === 'manage_task_plan') as any;
    const planResult = JSON.parse(await manageTaskPlan.run({
      objective: 'Complete a verified keyword opportunity report',
      overallStatus: 'in_progress',
      items: [
        { id: 'demand', task: 'Collect search demand data', status: 'in_progress' },
        { id: 'compare', task: 'Compare the opportunities', status: 'pending' },
      ],
    }));
    assert.equal(planResult.saved, true);
    assert.equal(toolContext.taskPlan?.items[0].id, 'demand');

    assert.equal(requiresResearchPlan('Research startup SEO.'), false);
    assert.equal(requiresResearchPlan(`Please complete a comprehensive market and keyword research project.
1. Analyse ten competitor sites.
2. Compare every category using search volume and keyword difficulty.
3. Produce a complete opportunity matrix with evidence and limitations.`), true);
    assert.match(getTaskPlanCompletionIssue(true) || '', /no task plan/i);
    assert.equal(getTaskPlanCompletionIssue(true, {
      objective: 'Complete the research brief',
      overallStatus: 'completed',
      items: [
        { id: 'one', task: 'Collect demand data', status: 'completed', evidence: 'Tool data collected' },
        { id: 'two', task: 'Compare opportunities', status: 'completed', evidence: 'Comparison completed' },
      ],
    }), null);

    console.log('Agent research tests passed.');
  } finally {
    global.fetch = originalFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
