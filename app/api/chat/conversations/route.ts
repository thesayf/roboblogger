import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';

// GET /api/chat/conversations - List conversations
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const conversations = await Conversation.find({ owner: user.mongoId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('date title creditsUsed createdAt')
      .lean();

    return NextResponse.json({
      conversations: conversations.map((c: any) => ({
        id: c._id.toString(),
        date: c.date,
        title: c.title,
        creditsUsed: c.creditsUsed,
        createdAt: c.createdAt?.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { title } = await req.json().catch(() => ({ title: undefined }));
    const today = new Date().toISOString().split('T')[0];

    // Check if today's conversation already exists
    let conv = await Conversation.findOne({ owner: user.mongoId, date: today });
    if (conv) {
      return NextResponse.json({
        id: conv._id.toString(),
        date: conv.date,
        title: conv.title,
        isExisting: true,
      });
    }

    conv = await Conversation.create({
      owner: user.mongoId,
      date: today,
      title: title || 'New Conversation',
    });

    return NextResponse.json({
      id: conv._id.toString(),
      date: conv.date,
      title: conv.title,
      isExisting: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
