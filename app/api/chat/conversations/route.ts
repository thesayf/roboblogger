import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Chat from '@/models/Chat';
import Day from '@/models/Day';
import User from '@/models/User';

// GET - Retrieve chat history for a day
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const dayId = searchParams.get('dayId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!dayId || !userId) {
      return NextResponse.json(
        { error: 'Missing dayId or userId' },
        { status: 400 }
      );
    }
    
    // Get conversations for this day
    const conversations = await Chat.find({ 
      dayId,
      userId
    })
    .sort({ timestamp: 1 })
    .limit(limit);
    
    return NextResponse.json({ conversations });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Save a conversation
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { userId, dayId, conversations, date } = body;
    
    if (!userId || !dayId || !conversations || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Save each conversation message
    const savedChats = [];
    for (const conv of conversations) {
      const chat = new Chat({
        userId,
        dayId,
        date,
        role: conv.role,
        message: conv.message,
        timestamp: conv.timestamp || new Date(),
        metadata: conv.metadata || {}
      });
      
      const saved = await chat.save();
      savedChats.push(saved);
    }
    
    return NextResponse.json({ 
      success: true,
      saved: savedChats.length 
    });
    
  } catch (error) {
    console.error('Error saving conversations:', error);
    return NextResponse.json(
      { error: 'Failed to save conversations' },
      { status: 500 }
    );
  }
}

// DELETE - Clear chat history for a day
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const dayId = searchParams.get('dayId');
    const userId = searchParams.get('userId');
    
    if (!dayId || !userId) {
      return NextResponse.json(
        { error: 'Missing dayId or userId' },
        { status: 400 }
      );
    }
    
    await Chat.deleteMany({ dayId, userId });
    
    return NextResponse.json({ 
      success: true,
      message: 'Chat history cleared' 
    });
    
  } catch (error) {
    console.error('Error clearing conversations:', error);
    return NextResponse.json(
      { error: 'Failed to clear conversations' },
      { status: 500 }
    );
  }
}