import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Session from '@/models/Session';

// GET - Retrieve session
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const dayId = searchParams.get('dayId');
    
    if (!dayId) {
      return NextResponse.json({ error: 'dayId required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const sessionId = `${userId}-${dayId}`;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return NextResponse.json({ 
        todos: [], 
        pendingPlan: null 
      });
    }
    
    return NextResponse.json({
      todos: session.todos,
      pendingPlan: session.pendingPlan,
      updatedAt: session.updatedAt
    });
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// POST - Create or update session
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { dayId, todos, pendingPlan } = await req.json();
    
    if (!dayId) {
      return NextResponse.json({ error: 'dayId required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const sessionId = `${userId}-${dayId}`;
    
    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        userId,
        dayId,
        sessionId,
        todos: todos || [],
        pendingPlan: pendingPlan || null,
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Reset expiry
      },
      {
        new: true,
        upsert: true
      }
    );
    
    console.log(`📝 Session saved: ${sessionId}, todos: ${session.todos.length}`);
    
    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      todosCount: session.todos.length
    });
    
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}

// DELETE - Clear session
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const dayId = searchParams.get('dayId');
    
    if (!dayId) {
      return NextResponse.json({ error: 'dayId required' }, { status: 400 });
    }
    
    await dbConnect();
    
    const sessionId = `${userId}-${dayId}`;
    await Session.deleteOne({ sessionId });
    
    console.log(`🗑️ Session cleared: ${sessionId}`);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}