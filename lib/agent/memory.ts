// @ts-ignore - mem0ai doesn't ship TS declarations
import { MemoryClient } from 'mem0ai';

type Mem0Client = any;

export function createMemoryClient(): Mem0Client | null {
  if (!process.env.MEM0_API_KEY) {
    console.warn('[Mem0] MEM0_API_KEY not found - memory features disabled');
    return null;
  }

  try {
    const client = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY,
    });
    return client;
  } catch (error) {
    console.error('[Mem0] Failed to initialize:', error);
    return null;
  }
}

export async function addMemory(
  client: Mem0Client | null,
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  if (!client) return;

  try {
    await client.add(
      [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantResponse },
      ],
      { user_id: userId }
    );
  } catch (error) {
    console.error('[Mem0] Failed to store memory:', error);
  }
}

export async function searchMemories(
  client: Mem0Client | null,
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!client) return [];

  try {
    const results = await client.search(query, {
      user_id: userId,
      limit,
    });

    return results.map((r: any) => r.memory || r.text || '').filter(Boolean);
  } catch (error) {
    console.error('[Mem0] Failed to search memories:', error);
    return [];
  }
}

export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) return '';

  let context = '\n[RELEVANT MEMORIES ABOUT THIS USER]\n';
  memories.forEach((m) => {
    context += `- ${m}\n`;
  });
  context += '[END MEMORIES]\n\n';

  return context;
}
