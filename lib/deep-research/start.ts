import { randomUUID } from 'crypto';
import { Client } from '@upstash/workflow';
import ChatMessage from '@/models/ChatMessage';
import DeepResearchRun from '@/models/DeepResearchRun';
import { buildAcceptanceCriteria } from './evaluation';
import { serializeDeepResearchRun } from './serialize';
import type { DeepResearchRunSnapshot } from './types';

export const MIN_DEEP_RESEARCH_CREDITS = 1;
export const MAX_DEEP_RESEARCH_OBJECTIVE_LENGTH = 12000;

export class DeepResearchStartError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DeepResearchStartError';
  }
}

export interface StartDeepResearchInput {
  ownerId: string;
  ownerClerkId: string;
  conversationId: string;
  date: string;
  objective: string;
  availableCredits: number;
  createUserMessage?: boolean;
  onAssistantCreated?: (assistantMessageId: string) => void;
}

export interface StartDeepResearchResult {
  workflowRunId: string;
  conversationId: string;
  assistantMessageId: string;
  run: DeepResearchRunSnapshot;
}

function getWorkflowBaseUrl(): string {
  return (
    process.env.UPSTASH_WORKFLOW_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function validateDeepResearchStart(objective: string, availableCredits: number) {
  if (objective.length < 15) {
    throw new DeepResearchStartError('Describe the research question in at least 15 characters.', 400);
  }
  if (objective.length > MAX_DEEP_RESEARCH_OBJECTIVE_LENGTH) {
    throw new DeepResearchStartError(
      `Research request is limited to ${MAX_DEEP_RESEARCH_OBJECTIVE_LENGTH} characters.`,
      400,
    );
  }
  if (availableCredits < MIN_DEEP_RESEARCH_CREDITS) {
    throw new DeepResearchStartError(
      `Thorough research requires at least ${MIN_DEEP_RESEARCH_CREDITS} available credit.`,
      402,
      'INSUFFICIENT_CREDITS',
    );
  }
  if (!process.env.QSTASH_TOKEN) {
    throw new DeepResearchStartError('The research workflow is not configured.', 503);
  }
}

export async function startDeepResearchRun(
  input: StartDeepResearchInput,
): Promise<StartDeepResearchResult> {
  const objective = input.objective.trim();
  validateDeepResearchStart(objective, input.availableCredits);

  if (input.createUserMessage) {
    await ChatMessage.create({
      conversationId: input.conversationId,
      owner: input.ownerId,
      date: input.date,
      role: 'user',
      content: objective,
    });
  }

  const workflowToken = randomUUID();
  const run = await DeepResearchRun.create({
    owner: input.ownerId,
    ownerClerkId: input.ownerClerkId,
    conversationId: input.conversationId,
    objective,
    acceptanceCriteria: buildAcceptanceCriteria(objective),
    workflowToken,
    liveLog: [{
      timestamp: new Date(),
      type: 'phase',
      message: 'Research queued',
    }],
  });

  const assistantMessage = await ChatMessage.create({
    conversationId: input.conversationId,
    owner: input.ownerId,
    date: input.date,
    role: 'assistant',
    content: '',
    deepResearchRunId: run._id,
  });
  run.assistantMessageId = assistantMessage._id;
  await run.save();
  input.onAssistantCreated?.(assistantMessage._id.toString());

  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN! });
    const { workflowRunId } = await client.trigger({
      url: `${getWorkflowBaseUrl()}/api/workflow/deep-research`,
      body: JSON.stringify({
        runId: run._id.toString(),
        workflowToken,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      workflowRunId,
      conversationId: input.conversationId,
      assistantMessageId: assistantMessage._id.toString(),
      run: serializeDeepResearchRun(run.toObject()),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start the research workflow.';
    await DeepResearchRun.findByIdAndUpdate(run._id, {
      $set: {
        status: 'failed',
        phase: 'failed',
        phaseDetail: 'Unable to start workflow',
        error: message,
        completedAt: new Date(),
      },
    });
    await ChatMessage.findByIdAndUpdate(assistantMessage._id, {
      $set: { content: `Research could not be started: ${message}` },
    });
    throw new DeepResearchStartError(message, 502);
  }
}
