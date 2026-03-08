import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import LinkedDocument from '@/models/LinkedDocument';
import GoogleIntegration from '@/models/GoogleIntegration';
import { deleteDocument } from '@/lib/google-docs';

export const dynamic = 'force-dynamic';

// GET - Get single document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const doc = await LinkedDocument.findOne({ _id: id, owner: user.mongoId }).lean() as any;
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      googleId: doc.googleId,
      googleUrl: doc.googleUrl,
      metadata: doc.metadata,
      lastAccessedAt: doc.lastAccessedAt,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

// PATCH - Update document name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    await dbConnect();

    const doc = await LinkedDocument.findOneAndUpdate(
      { _id: id, owner: user.mongoId },
      { $set: { name } },
      { new: true }
    );

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE - Remove linked document (and optionally from Drive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();

    const doc = await LinkedDocument.findOne({ _id: id, owner: user.mongoId }).lean() as any;
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only delete from Drive if the app created it (best-effort)
    try {
      const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
      if (integration?.refreshToken) {
        await deleteDocument(integration.refreshToken, doc.googleId);
      }
    } catch (driveError) {
      console.error('Failed to delete from Google Drive (continuing):', driveError);
    }

    await LinkedDocument.findOneAndDelete({ _id: id, owner: user.mongoId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
