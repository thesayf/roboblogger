import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import {
  CHAT_IMAGE_MAX_COUNT,
  type ChatImageAttachment,
  validateChatImageFile,
} from '@/lib/chat/attachments';

export const runtime = 'nodejs';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const files = data.getAll('files').filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Choose at least one image.' }, { status: 400 });
    }

    if (files.length > CHAT_IMAGE_MAX_COUNT) {
      return NextResponse.json(
        { error: `You can attach up to ${CHAT_IMAGE_MAX_COUNT} images.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      const validationError = validateChatImageFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const folder = `/chat-images/${user.mongoId}`;
    const attachments: ChatImageAttachment[] = [];

    try {
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const result = await imagekit.upload({
          file: Buffer.from(bytes),
          fileName: `${Date.now()}-${sanitizedName}`,
          folder,
          tags: ['chat', 'attachment'],
        });

        attachments.push({
          type: 'image',
          fileId: result.fileId,
          name: file.name,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          mimeType: file.type,
          size: result.size,
          width: result.width,
          height: result.height,
        });
      }
    } catch (error) {
      await Promise.allSettled(
        attachments.map((attachment) => imagekit.deleteFile(attachment.fileId))
      );
      throw error;
    }

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('[Chat Attachments] Upload failed:', error);
    return NextResponse.json(
      { error: 'Image upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
