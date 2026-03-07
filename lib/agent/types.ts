export interface AgentContext {
  userId: string;
  mongoId: string;
  brandSettings: {
    blogName?: string;
    blogDescription?: string;
    targetAudience?: string;
    tone?: string;
    customTone?: string;
    styleGuidelines?: string;
    topicsWeCover?: string;
    thingsToAvoid?: string;
    industryNiche?: string;
  } | null;
  recentPosts: Array<{
    title: string;
    slug: string;
    publishedAt?: string;
    status: string;
  }>;
  queueStats: {
    pending: number;
    generating: number;
    completed: number;
    failed: number;
  };
  credits: number;
  chatHistory: string;
  memories: string;
}

export interface ToolCallInfo {
  name: string;
  input: Record<string, any>;
  result?: string;
  success: boolean;
}

export interface ToolContext {
  userId: string;
  clerkId: string;
  sendEvent: (event: string, data: any) => void;
  dataChanged: string[];
  toolCalls: ToolCallInfo[];
}

export type SSEEventType = 'text_delta' | 'tool_start' | 'tool_end' | 'done' | 'error';
