import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import LinkedDocument from '@/models/LinkedDocument';
import GoogleIntegration from '@/models/GoogleIntegration';
import {
  readGoogleDoc,
  writeGoogleDoc,
  readGoogleSheet,
  writeGoogleSheet,
} from '@/lib/google-docs';

export const dynamic = 'force-dynamic';

// GET - Read document content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || undefined;

    await dbConnect();

    const doc = await LinkedDocument.findOne({ _id: id, owner: user.mongoId }) as any;
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
    if (!integration) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
    }

    // Update last accessed
    doc.lastAccessedAt = new Date();
    await doc.save();

    if (doc.type === 'google_sheet') {
      const data = await readGoogleSheet(integration.refreshToken, doc.googleId, range);
      return NextResponse.json({
        type: 'google_sheet',
        name: doc.name,
        googleUrl: doc.googleUrl,
        ...data,
      });
    } else {
      const content = await readGoogleDoc(integration.refreshToken, doc.googleId);
      return NextResponse.json({
        type: 'google_doc',
        name: doc.name,
        googleUrl: doc.googleUrl,
        content,
      });
    }
  } catch (error) {
    console.error('Error reading document content:', error);
    return NextResponse.json({ error: 'Failed to read document' }, { status: 500 });
  }
}

// PUT - Write document content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    await dbConnect();

    const doc = await LinkedDocument.findOne({ _id: id, owner: user.mongoId }) as any;
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
    if (!integration) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
    }

    if (doc.type === 'google_sheet') {
      const { range, values } = body;
      if (!range || !values) {
        return NextResponse.json(
          { error: 'range and values are required for sheets' },
          { status: 400 }
        );
      }
      const result = await writeGoogleSheet(integration.refreshToken, doc.googleId, range, values);
      return NextResponse.json({ success: true, updatedCells: result.updatedCells });
    } else {
      const { content, append } = body;
      if (content === undefined) {
        return NextResponse.json({ error: 'content is required' }, { status: 400 });
      }

      let finalContent = content;
      if (append) {
        const existing = await readGoogleDoc(integration.refreshToken, doc.googleId);
        finalContent = existing + '\n' + content;
      }

      await writeGoogleDoc(integration.refreshToken, doc.googleId, finalContent);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error writing document content:', error);
    return NextResponse.json({ error: 'Failed to write document' }, { status: 500 });
  }
}
