import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Conversation from '@/models/Conversation';
import ChatMessage from '@/models/ChatMessage';
import ImageKit from 'imagekit';

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
      .select('role content attachments toolCalls createdAt')
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
        attachments: m.attachments || [],
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

    const messagesWithAttachments = await ChatMessage.find({ conversationId: params.id })
      .select('attachments.fileId')
      .lean() as any[];
    const attachmentFileIds = messagesWithAttachments.flatMap((message) =>
      (message.attachments || [])
        .map((attachment: { fileId?: string }) => attachment.fileId)
        .filter((fileId: string | undefined): fileId is string => Boolean(fileId))
    );

    // Delete all messages in the conversation
    await ChatMessage.deleteMany({ conversationId: params.id });

    if (attachmentFileIds.length > 0) {
      const imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
      });
      await Promise.allSettled(attachmentFileIds.map((fileId) => imagekit.deleteFile(fileId)));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
