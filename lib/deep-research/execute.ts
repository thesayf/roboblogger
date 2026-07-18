import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import dbConnect from '@/lib/mongo';
import DeepResearchRun from '@/models/DeepResearchRun';
import ChatMessage from '@/models/ChatMessage';
import Conversation from '@/models/Conversation';
import { loadAgentContext } from '@/lib/agent/context-loader';
import { buildResearchTools } from '@/lib/agent/tools/research-tools';
import { buildReadTools } from '@/lib/agent/tools/read-tools';
import type { CurrentUser } from '@/lib/auth/getCurrentUser';
import type { ToolCallInfo, ToolContext } from '@/lib/agent/types';
import { AGENT_COMPACTION_PROMPT, MAX_AGENT_ITERATIONS } from '@/lib/agent/long-task';
import { calculateChatCredits, deductCredits } from '@/lib/billing/credit-service';
import { normalizeChatMode } from '@/lib/chat/chat-mode';
import {
  createAgentClient,
  executeManualToolCalls,
  getAgentProviderConfig,
  toManualApiTools,
  type AgentProviderConfig,
} from '@/lib/agent/provider';
import {
  extractSourceUrls,
  runDeterministicEvaluation,
} from './evaluation';
import type {
  DeepResearchEvaluation,
  DeepResearchPhase,
  DeepResearchPlan,
  DeepResearchToolCall,
  ResearchPlanItem,
} from './types';

const MAX_RESEARCH_CORRECTIONS = 3;

function asPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function getRunProviderConfig(run: { mode?: unknown; modelName?: string }): AgentProviderConfig {
  const config = getAgentProviderConfig(normalizeChatMode(run.mode));
  return run.modelName ? { ...config, model: run.modelName } : config;
}
function extractJsonObject(text: string): Record<string, any> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Model did not return a JSON object.');
  return JSON.parse(trimmed.slice(start, end + 1));
}

function slugifyId(value: string, index: number): string {
  const slug = value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || `workstream-${index + 1}`;
}

function fallbackPlan(objective: string): DeepResearchPlan {
  const normalized = objective.toLocaleLowerCase();
  const items: Array<Omit<ResearchPlanItem, 'status' | 'summary' | 'evidence' | 'sourceUrls'>> = [
    {
      id: 'brand-and-baseline',
      title: 'Brand and current baseline',
      objective: 'Inspect the real brand, audience, current content, and performance context that should constrain the answer.',
      requiredEvidence: ['Current brand or product context', 'Existing content or performance baseline'],
      suggestedTools: ['get_brand_settings', 'get_blog_stats', 'get_existing_posts', 'get_content_strategy'],
    },
    {
      id: 'market-demand',
      title: 'Market demand and audience questions',
      objective: 'Find current audience needs, recurring questions, and evidence of demand across multiple sources.',
      requiredEvidence: ['Current market sources', 'Audience problems or questions', 'Demand signals'],
      suggestedTools: ['web_search', 'search_trending_topics', 'search_content_gaps'],
    },
    {
      id: 'competitive-landscape',
      title: 'Competitive landscape',
      objective: 'Identify how credible alternatives address the problem and where meaningful gaps remain.',
      requiredEvidence: ['Named competitors or alternatives', 'Observed positioning or content patterns', 'Defensible gaps'],
      suggestedTools: ['search_competitor_content', 'web_search'],
    },
  ];

  if (/\b(keyword|seo|search|rank|content)\b/.test(normalized)) {
    items.push({
      id: 'keyword-evidence',
      title: 'Keyword and search evidence',
      objective: 'Build and validate a broad keyword set with volume, organic difficulty, intent, and related-query evidence.',
      requiredEvidence: ['At least 20 measured keywords', 'Organic keyword difficulty kept separate from paid competition', 'Search intent and topic groupings'],
      suggestedTools: ['search_related_keywords', 'search_keyword_data'],
    });
  }

  items.push({
    id: 'decision-synthesis',
    title: 'Decision synthesis',
    objective: 'Compare the collected evidence, identify trade-offs, and turn it into prioritized recommendations.',
    requiredEvidence: ['Prioritized opportunities', 'Risks and limitations', 'Concrete next actions'],
    suggestedTools: ['web_search'],
  });

  return {
    title: 'Deep research plan',
    summary: objective,
    queryStrategy: [
      'Start with the user and product baseline.',
      'Expand into market, competitor, and audience evidence.',
      'Validate important claims with measured SEO data and traceable sources.',
      'Resolve contradictions before producing recommendations.',
    ],
    items: items.map((item) => ({
      ...item,
      status: 'pending',
      evidence: [],
      sourceUrls: [],
    })),
  };
}

function normalizePlan(candidate: Record<string, any>, objective: string): DeepResearchPlan {
  if (!Array.isArray(candidate.items) || candidate.items.length < 3) return fallbackPlan(objective);

  const ids = new Set<string>();
  const items = candidate.items.slice(0, 8).map((item: any, index: number): ResearchPlanItem => {
    let id = slugifyId(String(item.id || item.title || ''), index);
    while (ids.has(id)) id = `${id}-${index + 1}`.slice(0, 40);
    ids.add(id);

    return {
      id,
      title: String(item.title || `Workstream ${index + 1}`).slice(0, 120),
      objective: String(item.objective || item.goal || '').slice(0, 1000),
      requiredEvidence: Array.isArray(item.requiredEvidence)
        ? item.requiredEvidence.map(String).filter(Boolean).slice(0, 8)
        : ['Evidence sufficient to answer this workstream'],
      suggestedTools: Array.isArray(item.suggestedTools)
        ? item.suggestedTools.map(String).filter(Boolean).slice(0, 8)
        : [],
      status: 'pending',
      evidence: [],
      sourceUrls: [],
    };
  });

  return {
    title: String(candidate.title || 'Deep research plan').slice(0, 180),
    summary: String(candidate.summary || objective).slice(0, 2000),
    queryStrategy: Array.isArray(candidate.queryStrategy)
      ? candidate.queryStrategy.map(String).filter(Boolean).slice(0, 12)
      : [],
    items,
  };
}

async function setPhase(
  runId: string,
  phase: DeepResearchPhase,
  phaseDetail: string,
  progress: number,
) {
  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      status: ['completed', 'failed', 'cancelled'].includes(phase) ? phase : 'running',
      phase,
      phaseDetail,
      progress,
      ...(phase === 'planning' ? { startedAt: new Date() } : {}),
    },
    $push: {
      liveLog: {
        timestamp: new Date(),
        type: phase === 'failed' ? 'error' : 'phase',
        message: phaseDetail,
      },
    },
  });
}

async function addUsage(runId: string, inputTokens: number, outputTokens: number) {
  await DeepResearchRun.findByIdAndUpdate(runId, {
    $inc: {
      'tokenUsage.inputTokens': inputTokens || 0,
      'tokenUsage.outputTokens': outputTokens || 0,
    },
  });
}

function brandContext(context: Awaited<ReturnType<typeof loadAgentContext>>): string {
  const brand = context.brandSettings;
  if (!brand) return 'No saved brand profile is available. Identify missing assumptions explicitly.';
  return [
    `Brand: ${brand.blogName || 'Unnamed'}`,
    `Description: ${brand.blogDescription || 'Not provided'}`,
    `Audience: ${brand.targetAudience || 'Not provided'}`,
    `Niche: ${brand.industryNiche || 'Not provided'}`,
    `Topics: ${brand.topicsWeCover || 'Not provided'}`,
  ].join('\n');
}

export async function planDeepResearch(runId: string, user: CurrentUser) {
  await dbConnect();
  const run = await DeepResearchRun.findById(runId);
  if (!run) throw new Error('Deep research run not found.');
  if (run.status === 'cancelled') throw new Error('Deep research run was cancelled.');
  if (run.plan?.items?.length) return { plan: asPlain(run.plan) };

  await setPhase(runId, 'planning', 'Defining the research questions and evidence requirements...', 8);
  const context = await loadAgentContext(user, run.objective, { includeChatHistory: false });
  const providerConfig = getRunProviderConfig(run);
  const client = createAgentClient(providerConfig);

  let plan: DeepResearchPlan;
  try {
    const response = await client.messages.create({
      model: providerConfig.model,
      max_tokens: 5000,
      ...(providerConfig.provider === 'anthropic' ? { temperature: 0.1 } : {}),
      system: `You are the planning stage of a durable deep-research system. Design a decision-grade plan before any research begins. Preserve the user's full objective, make workstreams mutually useful, and require real evidence rather than generic opinions. Return JSON only.`,
      messages: [{
        role: 'user',
        content: `OBJECTIVE\n${run.objective}\n\nBRAND CONTEXT\n${brandContext(context)}\n\nReturn this JSON shape:\n{\n  "title": "...",\n  "summary": "...",\n  "queryStrategy": ["..."],\n  "items": [\n    {\n      "id": "stable-short-id",\n      "title": "...",\n      "objective": "...",\n      "requiredEvidence": ["..."],\n      "suggestedTools": ["search_keyword_data", "search_related_keywords", "search_competitor_content", "search_content_gaps", "search_trending_topics", "web_search", "get_existing_posts", "get_blog_stats", "get_content_strategy"]\n    }\n  ]\n}\n\nCreate 4-8 workstreams. Include current-site evidence when the request concerns this user's content, measured keyword evidence for SEO questions, competitor evidence for competitive questions, and a synthesis workstream.`,
      }],
    });
    const text = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
    plan = normalizePlan(extractJsonObject(text), run.objective);
    await addUsage(runId, response.usage.input_tokens, response.usage.output_tokens);
  } catch (error) {
    console.error('[DeepResearch] Plan generation failed, using safe fallback:', error);
    plan = fallbackPlan(run.objective);
  }

  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      plan,
      phaseDetail: `Research plan ready: ${plan.items.length} workstreams`,
      progress: 15,
    },
    $push: {
      liveLog: {
        timestamp: new Date(),
        type: 'phase',
        message: `Research plan created with ${plan.items.length} workstreams`,
      },
    },
  });

  return { plan };
}

function buildWorkstreamTool(input: {
  runId: string;
  plan: DeepResearchPlan;
  toolCtx: ToolContext;
}) {
  const { runId, plan, toolCtx } = input;

  return betaZodTool({
    name: 'record_research_workstream',
    description: 'Mark one planned research workstream complete or blocked and persist its evidence. Call this after finishing every workstream. Completed items require concrete evidence; blocked items require a specific limitation.',
    inputSchema: z.object({
      itemId: z.string(),
      status: z.enum(['completed', 'blocked']),
      summary: z.string().min(20).max(3000),
      evidence: z.array(z.string().min(5).max(1000)).min(1).max(20),
      sourceUrls: z.array(z.string().url()).max(30).default([]),
    }),
    run: async (toolInput): Promise<string> => {
      const callInfo: ToolCallInfo = { name: 'record_research_workstream', input: toolInput, success: false };
      toolCtx.toolCalls.push(callInfo);
      toolCtx.sendEvent('tool_start', { toolName: callInfo.name, toolInput });

      const current = await DeepResearchRun.findById(runId).select('status');
      if (!current || current.status === 'cancelled') throw new Error('Deep research run was cancelled.');

      const item = plan.items.find((candidate) => candidate.id === toolInput.itemId);
      if (!item) {
        const result = JSON.stringify({ error: `Unknown workstream ${toolInput.itemId}` });
        callInfo.result = result;
        toolCtx.sendEvent('tool_end', { toolName: callInfo.name, success: false });
        return result;
      }

      item.status = toolInput.status;
      item.summary = toolInput.summary;
      item.evidence = Array.from(new Set([...(item.evidence || []), ...toolInput.evidence]));
      item.sourceUrls = Array.from(new Set([...(item.sourceUrls || []), ...toolInput.sourceUrls]));

      const resolved = plan.items.filter((candidate) => ['completed', 'blocked'].includes(candidate.status)).length;
      const progress = Math.min(68, 18 + Math.round((resolved / plan.items.length) * 50));
      const result = JSON.stringify({ saved: true, itemId: item.id, status: item.status, resolved, total: plan.items.length });
      callInfo.result = result;
      callInfo.success = true;

      await DeepResearchRun.findByIdAndUpdate(runId, {
        $set: {
          plan,
          progress,
          phaseDetail: `Researching evidence: ${resolved} of ${plan.items.length} workstreams resolved`,
        },
        $push: {
          liveLog: {
            timestamp: new Date(),
            type: 'tool',
            message: `${item.title}: ${item.status}`,
          },
        },
      });
      toolCtx.sendEvent('tool_end', { toolName: callInfo.name, success: true });
      return result;
    },
  });
}

function summarizeExistingEvidence(toolCalls: DeepResearchToolCall[]): string {
  if (toolCalls.length === 0) return 'No evidence has been collected yet.';
  return toolCalls.slice(-30).map((call) => {
    const result = call.result?.slice(0, 1400) || '';
    return `- ${call.name} (${call.success ? 'success' : 'failed'}) input=${JSON.stringify(call.input).slice(0, 500)} result=${result}`;
  }).join('\n');
}

export async function collectDeepResearch(
  runId: string,
  user: CurrentUser,
  options: { revisionFeedback?: string[] } = {},
) {
  await dbConnect();
  const run = await DeepResearchRun.findById(runId);
  if (!run) throw new Error('Deep research run not found.');
  if (run.status === 'cancelled') throw new Error('Deep research run was cancelled.');
  if (!run.plan?.items?.length) throw new Error('Deep research plan has not been created.');
  if (run.researchMemo && !options.revisionFeedback?.length) return { researchMemo: run.researchMemo };

  const plan = asPlain(run.plan) as DeepResearchPlan;
  if (options.revisionFeedback?.length) {
    const revisionId = `evaluation-revision-${run.revisionCount + 1}`;
    if (!plan.items.some((item) => item.id === revisionId)) {
      plan.items.push({
        id: revisionId,
        title: 'Resolve evaluation gaps',
        objective: options.revisionFeedback.join(' '),
        requiredEvidence: options.revisionFeedback,
        suggestedTools: ['web_search', 'search_keyword_data', 'search_competitor_content'],
        status: 'pending',
        evidence: [],
        sourceUrls: [],
      });
    }
    await DeepResearchRun.findByIdAndUpdate(runId, {
      $set: { plan, evaluation: null },
      $inc: { revisionCount: 1 },
    });
  }

  await setPhase(
    runId,
    options.revisionFeedback?.length ? 'revising' : 'researching',
    options.revisionFeedback?.length ? 'Collecting the missing evidence identified by evaluation...' : 'Collecting and triangulating evidence...',
    options.revisionFeedback?.length ? 76 : 18,
  );

  const context = await loadAgentContext(user, run.objective, { includeChatHistory: false });
  const dataChanged: string[] = [];
  const toolCalls: ToolCallInfo[] = [];
  const toolCtx: ToolContext = {
    userId: user.mongoId,
    clerkId: user.clerkId,
    sendEvent: () => {},
    dataChanged,
    toolCalls,
  };
  const tools = [
    buildWorkstreamTool({ runId, plan, toolCtx }),
    ...buildResearchTools(toolCtx),
    ...buildReadTools(toolCtx),
  ];

  const providerConfig = getRunProviderConfig(run);
  const client = createAgentClient(providerConfig);
  const systemPrompt = `You are the evidence-collection stage of a durable deep-research system for Vibeblogger. Work methodically until every workstream is resolved. Use tools for real data; do not answer from memory when a tool can verify it. Triangulate important claims. Preserve organic keyword difficulty separately from paid competition. Never invent URLs, metrics, competitor findings, or completed work.\n\nAfter each workstream, call record_research_workstream with concrete evidence and source URLs. Only after every workstream is completed or honestly blocked should you write a detailed evidence memo. The memo must be at least 1,800 characters and include: findings by workstream, numeric evidence, contradictions, source index, limitations, and implications for the user's decision. It is an internal memo, not the polished final answer.\n\n${brandContext(context)}`;
  const userPrompt = `OBJECTIVE\n${run.objective}\n\nRESEARCH PLAN\n${JSON.stringify(plan, null, 2)}\n\nACCEPTANCE CRITERIA\n${JSON.stringify(run.acceptanceCriteria, null, 2)}\n\nEVIDENCE FROM EARLIER ATTEMPTS\n${summarizeExistingEvidence(asPlain(run.toolCalls || []))}\n\n${options.revisionFeedback?.length ? `EVALUATION GAPS TO FIX\n${options.revisionFeedback.map((item) => `- ${item}`).join('\n')}\n\n` : ''}Complete the unresolved workstreams with tools, persist each result, then return the evidence memo.`;

  let persistedCallCount = 0;
  let corrections = 0;
  let memo = '';
  let lastStopReason: string | null = null;

  const persistNewCalls = async () => {
    const newCalls = toolCalls.slice(persistedCallCount).map((call): DeepResearchToolCall => ({
      name: call.name,
      input: call.input,
      result: call.result?.slice(0, 12000),
      success: call.success,
      createdAt: new Date(),
    }));
    persistedCallCount = toolCalls.length;

    if (newCalls.length > 0) {
      await DeepResearchRun.findByIdAndUpdate(runId, {
        $push: { toolCalls: { $each: newCalls } },
      });
    }
  };

  const processMessage = async (message: any) => {
    lastStopReason = message.stop_reason;
    await addUsage(runId, message.usage.input_tokens, message.usage.output_tokens);
    await persistNewCalls();
    const text = message.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')
      .trim();
    return text;
  };

  const getCompletionIssue = (text: string) => {
    const unresolved = plan.items.filter((item) => item.status === 'pending' || item.status === 'in_progress');
    return unresolved.length > 0
      ? `Unresolved workstreams: ${unresolved.map((item) => `${item.id}: ${item.title}`).join('; ')}`
      : text.length < 1800
        ? `The evidence memo is only ${text.length} characters; it must be at least 1,800 characters and preserve the collected evidence.`
        : null;
  };

  const correctionPrompt = (completionIssue: string) =>
    `The research phase cannot finish yet. ${completionIssue}. Continue using tools, update every workstream with record_research_workstream, and then return the complete evidence memo.`;

  if (providerConfig.provider === 'deepseek') {
    const messages: any[] = [{ role: 'user', content: userPrompt }];
    const apiTools = toManualApiTools(tools);

    for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration++) {
      const message = await client.messages.create({
        model: providerConfig.model,
        max_tokens: 16000,
        system: systemPrompt,
        tools: apiTools as any,
        messages,
      });
      const text = await processMessage(message);
      const toolUseBlocks = message.content.filter((block: any) => block.type === 'tool_use');
      messages.push({ role: 'assistant', content: message.content });

      if (toolUseBlocks.length > 0) {
        const toolResults = await executeManualToolCalls(tools, toolUseBlocks);
        await persistNewCalls();
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      const completionIssue = getCompletionIssue(text);
      if (completionIssue && corrections < MAX_RESEARCH_CORRECTIONS) {
        corrections += 1;
        messages.push({ role: 'user', content: correctionPrompt(completionIssue) });
        continue;
      }
      if (completionIssue) throw new Error(`Research collection incomplete: ${completionIssue}`);
      memo = text;
      break;
    }
  } else {
    const runner = client.beta.messages.toolRunner({
      model: providerConfig.model,
      max_tokens: 16000,
      temperature: 0.15,
      system: systemPrompt,
      tools,
      messages: [{ role: 'user', content: userPrompt }],
      stream: false,
      max_iterations: MAX_AGENT_ITERATIONS,
      compactionControl: {
        enabled: true,
        contextTokenThreshold: 100000,
        summaryPrompt: AGENT_COMPACTION_PROMPT,
      },
    });

    for await (const message of runner) {
      const text = await processMessage(message);
      if (message.stop_reason === 'tool_use') continue;

      const completionIssue = getCompletionIssue(text);
      if (completionIssue && corrections < MAX_RESEARCH_CORRECTIONS) {
        corrections += 1;
        runner.pushMessages({ role: 'user', content: correctionPrompt(completionIssue) });
        continue;
      }
      if (completionIssue) throw new Error(`Research collection incomplete: ${completionIssue}`);
      memo = text;
    }
  }

  if (lastStopReason === 'tool_use') {
    throw new Error(`Research reached the ${MAX_AGENT_ITERATIONS}-iteration safety limit.`);
  }
  if (!memo) throw new Error('Research completed without an evidence memo.');

  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      plan,
      researchMemo: memo,
      phaseDetail: 'Evidence collection complete; preparing evaluation',
      progress: 70,
    },
  });

  return { researchMemo: memo };
}

export async function evaluateDeepResearch(runId: string) {
  await dbConnect();
  const run = await DeepResearchRun.findById(runId);
  if (!run) throw new Error('Deep research run not found.');
  if (run.status === 'cancelled') throw new Error('Deep research run was cancelled.');
  if (!run.researchMemo) throw new Error('Research memo is missing.');

  await setPhase(runId, 'evaluating', 'Checking coverage, source quality, and decision usefulness...', 74);
  const deterministic = runDeterministicEvaluation({
    plan: asPlain(run.plan),
    criteria: asPlain(run.acceptanceCriteria),
    toolCalls: asPlain(run.toolCalls || []),
    researchMemo: run.researchMemo,
  });

  const sourceUrls = extractSourceUrls(asPlain(run.toolCalls || []));
  const providerConfig = getRunProviderConfig(run);
  const client = createAgentClient(providerConfig);
  let modelPassed = false;
  let modelScore = 0;
  let modelFeedback: string[] = [];

  try {
    const response = await client.messages.create({
      model: providerConfig.model,
      max_tokens: 4000,
      ...(providerConfig.provider === 'anthropic' ? { temperature: 0 } : {}),
      system: `You are an independent research-quality evaluator. Judge only the supplied evidence. Do not repair the work, infer missing sources, or reward polished prose over substantiation. Return JSON only.`,
      messages: [{
        role: 'user',
        content: `OBJECTIVE\n${run.objective}\n\nPLAN\n${JSON.stringify(run.plan, null, 2)}\n\nDETERMINISTIC CHECKS\n${JSON.stringify(deterministic, null, 2)}\n\nTRACEABLE SOURCES\n${sourceUrls.join('\n')}\n\nRESEARCH MEMO\n${run.researchMemo.slice(0, 30000)}\n\nReturn {"passed": boolean, "score": 0-100, "feedback": ["specific missing or weak evidence"], "reasoning": "brief verdict"}. Pass only if the memo answers the objective, distinguishes evidence from inference, represents limitations honestly, and supports important claims with the supplied evidence.`,
      }],
    });
    await addUsage(runId, response.usage.input_tokens, response.usage.output_tokens);
    const text = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('\n');
    const parsed = extractJsonObject(text);
    modelScore = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    modelPassed = parsed.passed === true && modelScore >= 75;
    modelFeedback = Array.isArray(parsed.feedback) ? parsed.feedback.map(String).filter(Boolean).slice(0, 12) : [];
  } catch (error) {
    console.error('[DeepResearch] Model evaluation failed:', error);
    modelFeedback = ['The independent model evaluation could not be completed and must be retried.'];
  }

  const evaluation: DeepResearchEvaluation = {
    passed: deterministic.passed && modelPassed,
    score: Math.round((deterministic.score + modelScore) / 2),
    checks: [
      ...deterministic.checks,
      {
        id: 'independent-evaluator',
        label: 'Independent evidence review',
        passed: modelPassed,
        actual: modelScore,
        required: 75,
        detail: modelPassed ? 'The independent evaluator accepted the evidence memo.' : 'The independent evaluator found material evidence or reasoning gaps.',
      },
    ],
    feedback: Array.from(new Set([...deterministic.feedback, ...modelFeedback])),
    evaluatedAt: new Date(),
    deterministicPassed: deterministic.passed,
    modelPassed,
  };

  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      evaluation,
      phaseDetail: evaluation.passed ? 'Research passed evaluation' : 'Evaluation found gaps that need another research pass',
      progress: evaluation.passed ? 86 : 78,
    },
    $push: {
      liveLog: {
        timestamp: new Date(),
        type: 'evaluation',
        message: `Evaluation ${evaluation.passed ? 'passed' : 'failed'} with score ${evaluation.score}`,
      },
    },
  });

  return evaluation;
}

async function billDeepResearch(runId: string, userId: string) {
  const run = await DeepResearchRun.findById(runId);
  if (!run) throw new Error('Deep research run not found during billing.');
  if (run.billedAt) return run.creditsUsed;

  const billing = calculateChatCredits({
    model: run.modelName || getRunProviderConfig(run).model,
    inputTokens: run.tokenUsage?.inputTokens || 0,
    outputTokens: run.tokenUsage?.outputTokens || 0,
    toolCalls: (run.toolCalls || []).map((call: any) => ({ name: call.name })),
    pricing: getRunProviderConfig(run).pricing,
  });
  const claimed = await DeepResearchRun.findOneAndUpdate(
    { _id: runId, $or: [{ billedAt: { $exists: false } }, { billedAt: null }] },
    { $set: { billedAt: new Date(), creditsUsed: billing.credits } },
    { new: true },
  );
  if (!claimed) return (await DeepResearchRun.findById(runId))?.creditsUsed || 0;

  const deduction = await deductCredits(
    userId,
    billing.credits,
    'chat',
    'Deep research run',
    {
      deepResearchRunId: runId,
      mode: run.mode,
      provider: run.provider,
      model: run.modelName,
      inputTokens: run.tokenUsage?.inputTokens || 0,
      outputTokens: run.tokenUsage?.outputTokens || 0,
      toolCalls: (run.toolCalls || []).map((call: any) => call.name),
      totalApiCost: billing.totalApiCost,
    },
  );
  if (!deduction.success) {
    await DeepResearchRun.findByIdAndUpdate(runId, { $unset: { billedAt: 1 }, $set: { creditsUsed: 0 } });
    throw new Error(`Insufficient credits to complete deep research. Required ${deduction.required}, available ${deduction.available}.`);
  }

  await Conversation.findByIdAndUpdate(run.conversationId, { $inc: { creditsUsed: billing.credits } });
  return billing.credits;
}

export async function synthesizeDeepResearch(runId: string, user: CurrentUser) {
  await dbConnect();
  let run = await DeepResearchRun.findById(runId);
  if (!run) throw new Error('Deep research run not found.');
  if (run.status === 'cancelled') throw new Error('Deep research run was cancelled.');
  if (run.report && ['completed', 'partial'].includes(run.status)) {
    if (!run.billedAt) await billDeepResearch(runId, user.mongoId);
    return { report: run.report, status: run.status };
  }
  if (!run.researchMemo || !run.evaluation) throw new Error('Research has not been evaluated.');

  await setPhase(runId, 'synthesizing', 'Turning the verified evidence into a decision-ready report...', 90);
  const sourceUrls = extractSourceUrls(asPlain(run.toolCalls || []));
  const providerConfig = getRunProviderConfig(run);
  const client = createAgentClient(providerConfig);
  const response = await client.messages.create({
    model: providerConfig.model,
    max_tokens: 18000,
    ...(providerConfig.provider === 'anthropic' ? { temperature: 0.2 } : {}),
    system: `You are the final synthesis stage of Vibeblogger Deep Research. Produce a clear, decision-ready Markdown report from the supplied evidence only. Lead with the answer, then show the evidence, implications, prioritized actions, and limitations. Cite traceable sources as Markdown links near the claims they support. Never invent a citation or metric. If evaluation did not pass, state the limitations plainly and do not present the report as complete.`,
    messages: [{
      role: 'user',
      content: `OBJECTIVE\n${run.objective}\n\nPLAN AND WORKSTREAM EVIDENCE\n${JSON.stringify(run.plan, null, 2)}\n\nEVALUATION\n${JSON.stringify(run.evaluation, null, 2)}\n\nALLOWED SOURCE URLS\n${sourceUrls.join('\n')}\n\nEVIDENCE MEMO\n${run.researchMemo.slice(0, 50000)}\n\nWrite the final report. Include an executive answer, key findings, evidence-backed opportunities, recommendations in priority order, risks/limitations, and next actions.`,
    }],
  });
  await addUsage(runId, response.usage.input_tokens, response.usage.output_tokens);
  const report = response.content.filter((block) => block.type === 'text').map((block) => block.text).join('\n').trim();
  if (report.length < 800) throw new Error('Final deep-research report was unexpectedly short.');

  run = await DeepResearchRun.findById(runId);
  if (!run || run.status === 'cancelled') throw new Error('Deep research run was cancelled.');
  const finalStatus = run.evaluation?.passed ? 'completed' : 'partial';
  const creditsUsed = await billDeepResearch(runId, user.mongoId);

  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      report,
      status: finalStatus,
      phase: 'completed',
      phaseDetail: finalStatus === 'completed' ? 'Deep research complete' : 'Report completed with unresolved evidence limitations',
      progress: 100,
      creditsUsed,
      completedAt: new Date(),
    },
    $push: {
      liveLog: {
        timestamp: new Date(),
        type: 'phase',
        message: finalStatus === 'completed' ? 'Final report completed' : 'Final report completed with limitations',
      },
    },
  });

  if (run.assistantMessageId) {
    await ChatMessage.findByIdAndUpdate(run.assistantMessageId, { $set: { content: report } });
  }

  return { report, status: finalStatus, creditsUsed };
}

export async function markDeepResearchFailed(runId: string, error: string) {
  await dbConnect();
  const run = await DeepResearchRun.findById(runId);
  if (!run || ['completed', 'partial', 'cancelled'].includes(run.status)) return;

  await DeepResearchRun.findByIdAndUpdate(runId, {
    $set: {
      status: 'failed',
      phase: 'failed',
      phaseDetail: 'Deep research failed',
      error,
      completedAt: new Date(),
    },
    $push: { liveLog: { timestamp: new Date(), type: 'error', message: error } },
  });
  if (run.assistantMessageId) {
    await ChatMessage.findByIdAndUpdate(run.assistantMessageId, {
      $set: { content: `Deep research could not be completed: ${error}` },
    });
  }
}
