import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Embeddings] OPENAI_API_KEY not found - embeddings disabled');
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export async function generateChatEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const cleanText = text.trim().slice(0, 30000);
    if (!cleanText) return null;

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Embeddings] Failed to generate embedding:', error);
    return null;
  }
}

export async function searchChatsByEmbedding(
  userId: string,
  queryText: string,
  limit: number = 10
): Promise<Array<{
  content: string;
  role: string;
  date: string;
  score: number;
}>> {
  const queryEmbedding = await generateChatEmbedding(queryText);
  if (!queryEmbedding) return [];

  try {
    const { default: ChatMessage } = await import('@/models/ChatMessage');
    const mongoose = await import('mongoose');

    const results = await ChatMessage.aggregate([
      {
        $vectorSearch: {
          index: 'chat_message_embedding_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
          filter: {
            owner: new mongoose.default.Types.ObjectId(userId),
          },
        },
      },
      {
        $project: {
          content: 1,
          role: 1,
          date: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]);

    return results;
  } catch (error) {
    console.error('[Embeddings] Vector search failed, trying text search:', error);
    return searchChatsByText(userId, queryText, limit);
  }
}

async function searchChatsByText(
  userId: string,
  queryText: string,
  limit: number
): Promise<Array<{
  content: string;
  role: string;
  date: string;
  score: number;
}>> {
  try {
    const { default: ChatMessage } = await import('@/models/ChatMessage');

    const results = await ChatMessage.find(
      { owner: userId, $text: { $search: queryText } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('content role date createdAt')
      .lean();

    return results.map((r: any) => ({
      content: r.content,
      role: r.role,
      date: r.date,
      score: r.score || 0.5,
    }));
  } catch (error) {
    console.error('[Embeddings] Text search also failed:', error);
    return [];
  }
}
