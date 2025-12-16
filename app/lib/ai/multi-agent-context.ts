// Multi-Agent System Context Collection
// This file handles collecting all context variables needed for the agent

import dbConnect from "@/lib/mongo";
import User from "@/models/User";
import Day from "@/models/Day";
import Chat from "@/models/Chat";

export interface AgentContext {
  userName: string;
  occupation?: string;
  bio?: string;
  daysOnApp: number;
  yesterdaysChat?: string;
  yesterdayScheduleSummary?: string;
}

/**
 * Generate a summary of yesterday's schedule
 */
async function generateYesterdayScheduleSummary(userId: string, userObjectId: string): Promise<string | undefined> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayDay = await Day.findOne({
      user: userObjectId,
      date: yesterdayDateStr
    }).populate('blocks');
    
    if (!yesterdayDay || !yesterdayDay.blocks || yesterdayDay.blocks.length === 0) {
      return undefined;
    }
    
    // Calculate totals
    const totalBlocks = yesterdayDay.blocks.length;
    const totalTasks = yesterdayDay.blocks.reduce((acc: number, block: any) => 
      acc + (block.tasks?.length || 0), 0);
    const completedTasks = yesterdayDay.blocks.reduce((acc: number, block: any) => 
      acc + (block.tasks?.filter((t: any) => t.completed).length || 0), 0);
    
    // Create a concise summary of blocks and tasks
    const blockDetails = yesterdayDay.blocks
      .map((block: any) => {
        const taskCount = block.tasks?.length || 0;
        const completedCount = block.tasks?.filter((t: any) => t.completed).length || 0;
        const taskNames = block.tasks
          ?.slice(0, 3) // Show first 3 task names
          ?.map((t: any) => `${t.title}${t.completed ? '✓' : ''}`)
          ?.join(', ');
        
        return `${block.time} ${block.title}: ${completedCount}/${taskCount} tasks${taskNames ? ` (${taskNames})` : ''}`;
      })
      .join('; ');
    
    return `Completed ${completedTasks}/${totalTasks} tasks across ${totalBlocks} blocks. ${blockDetails}`;
  } catch (error) {
    console.error('Error generating yesterday schedule summary:', error);
    return undefined;
  }
}

/**
 * Get yesterday's chat summary
 */
async function getYesterdaysChatSummary(userId: string, userObjectId: string): Promise<string | undefined> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayChats = await Chat.find({
      userId: userObjectId,
      date: yesterdayDateStr
    }).sort({ timestamp: 1 });
    
    if (!yesterdayChats || yesterdayChats.length === 0) {
      return undefined;
    }
    
    // Get key user messages to understand what was discussed
    const userMessages = yesterdayChats
      .filter(chat => chat.role === 'user')
      .slice(0, 5) // Get first 5 user messages
      .map(chat => {
        // Truncate long messages
        const msg = chat.message.length > 50 
          ? chat.message.substring(0, 50) + '...'
          : chat.message;
        return msg;
      });
    
    if (userMessages.length === 0) {
      return undefined;
    }
    
    return `Previous topics: ${userMessages.join('; ')}`;
  } catch (error) {
    console.error('Error getting yesterday chat summary:', error);
    return undefined;
  }
}

/**
 * Collect all context variables needed for the multi-agent system
 */
export async function collectAgentContext(userId: string): Promise<AgentContext> {
  await dbConnect();
  
  // Get user data
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    throw new Error('User not found');
  }
  
  // Calculate days on app from user creation date
  const accountCreatedDate = new Date(user.createdAt);
  const today = new Date();
  const daysOnApp = Math.floor((today.getTime() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to count today
  
  // Get yesterday's chat summary (only if user has been on app more than 1 day)
  let yesterdaysChat: string | undefined;
  if (daysOnApp > 1) {
    yesterdaysChat = await getYesterdaysChatSummary(userId, user._id);
  }
  
  // Get yesterday's schedule summary (only if user has been on app more than 1 day)
  let yesterdayScheduleSummary: string | undefined;
  if (daysOnApp > 1) {
    yesterdayScheduleSummary = await generateYesterdayScheduleSummary(userId, user._id);
  }
  
  return {
    userName: user.name || 'User',
    occupation: user.occupation,
    bio: user.bio,
    daysOnApp,
    yesterdaysChat,
    yesterdayScheduleSummary
  };
}