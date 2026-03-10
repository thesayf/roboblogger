import mongoose from 'mongoose';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import Topic from '@/models/Topic';
import BrandSettings from '@/models/BrandSettings';
import ChatMessage from '@/models/ChatMessage';
import { AgentContext } from './types';
import { createMemoryClient, searchMemories, formatMemoriesForPrompt } from './memory';
import { CurrentUser } from '@/lib/auth/getCurrentUser';

export async function loadAgentContext(
  user: CurrentUser,
  currentMessage: string
): Promise<AgentContext> {
  await dbConnect();

  // Run all queries in parallel
  const [brandSettings, recentPosts, queueStatsRaw, chatHistory, memories] = await Promise.all([
    loadBrandSettings(user.clerkId),
    loadRecentPosts(user.mongoId),
    loadQueueStats(user.mongoId),
    load7DayChatHistory(user.mongoId),
    loadMem0Memories(user.clerkId, currentMessage),
  ]);

  const queueStats = {
    pending: queueStatsRaw['pending'] || 0,
    generating: queueStatsRaw['generating'] || 0,
    completed: queueStatsRaw['completed'] || 0,
    failed: queueStatsRaw['failed'] || 0,
  };

  return {
    userId: user.clerkId,
    mongoId: user.mongoId,
    brandSettings,
    recentPosts,
    queueStats,
    credits: user.credits,
    chatHistory,
    memories,
  };
}

async function loadBrandSettings(clerkId: string) {
  const settings = await BrandSettings.findOne({ userId: clerkId }).lean() as any;
  if (!settings) return null;

  return {
    blogName: settings.blogName,
    blogDescription: settings.blogDescription,
    targetAudience: settings.targetAudience,
    tone: settings.tone,
    customTone: settings.customTone,
    styleGuidelines: settings.styleGuidelines,
    topicsWeCover: settings.topicsWeCover,
    thingsToAvoid: settings.thingsToAvoid,
    industryNiche: settings.industryNiche,
  };
}

async function loadRecentPosts(mongoId: string) {
  const posts = await BlogPost.find({ owner: mongoId, status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(5)
    .select('title slug publishedAt status')
    .lean() as any[];

  return posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    publishedAt: p.publishedAt?.toISOString(),
    status: p.status,
  }));
}

async function loadQueueStats(mongoId: string): Promise<Record<string, number>> {
  const stats = await Topic.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(mongoId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const map: Record<string, number> = {};
  stats.forEach((s: any) => { map[s._id] = s.count; });
  return map;
}

async function load7DayChatHistory(mongoId: string): Promise<string> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  try {
    const recentChats = await ChatMessage.find({
      owner: mongoId,
      date: { $gte: sevenDaysAgoStr },
    })
      .sort({ date: 1, createdAt: 1 })
      .select('date role content')
      .limit(200) // Cap to avoid context overflow
      .lean() as any[];

    if (recentChats.length === 0) return '';

    // Group by date
    const chatsByDate = new Map<string, any[]>();
    recentChats.forEach((chat: any) => {
      if (!chatsByDate.has(chat.date)) {
        chatsByDate.set(chat.date, []);
      }
      chatsByDate.get(chat.date)!.push(chat);
    });

    let history = '\n[RECENT CONVERSATIONS]\n';

    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    for (const [date, chats] of Array.from(chatsByDate.entries())) {
      const label = date === today ? 'Today' : date === yesterdayStr ? 'Yesterday' : date;
      history += `\n${label} (${date}):\n`;
      chats.forEach((chat: any) => {
        const role = chat.role === 'user' ? 'User' : 'Assistant';
        // Truncate long messages in history
        const content = chat.content.length > 300 ? chat.content.slice(0, 300) + '...' : chat.content;
        history += `${role}: ${content}\n`;
      });
    }

    history += '\n[END CONVERSATIONS]\n\n';
    return history;
  } catch (error) {
    console.error('[ContextLoader] Failed to load chat history:', error);
    return '';
  }
}

async function loadMem0Memories(clerkId: string, query: string): Promise<string> {
  try {
    const client = createMemoryClient();
    if (!client) return '';

    const memories = await searchMemories(client, clerkId, query, 5);
    return formatMemoriesForPrompt(memories);
  } catch (error) {
    console.error('[ContextLoader] Failed to load Mem0 memories:', error);
    return '';
  }
}
