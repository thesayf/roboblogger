import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';
import ChatMessage from '@/models/ChatMessage';

// GET /api/chat/conversations/[id] - Load conversation with messages
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const conv = await Conversation.findOne({
      _id: params.id,
      owner: user.mongoId,
    }).lean() as any;

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await ChatMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .select('role content toolCalls createdAt')
      .lean() as any[];

    return NextResponse.json({
      id: conv._id.toString(),
      date: conv.date,
      title: conv.title,
      creditsUsed: conv.creditsUsed,
      messages: messages.map((m: any) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt?.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const conv = await Conversation.findOneAndDelete({
      _id: params.id,
      owner: user.mongoId,
    });

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete all messages in the conversation
    await ChatMessage.deleteMany({ conversationId: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
