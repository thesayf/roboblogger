import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import LinkedDocument from '@/models/LinkedDocument';
import GoogleIntegration from '@/models/GoogleIntegration';
import {
  createGoogleDoc,
  createGoogleSheet,
  shareDocument,
  writeGoogleDoc,
} from '@/lib/google-docs';

export const dynamic = 'force-dynamic';

const MAX_DOCUMENTS_PER_USER = 20;

// GET - List all documents for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const documents = await LinkedDocument.find({ owner: user.mongoId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      documents: documents.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        type: d.type,
        googleId: d.googleId,
        googleUrl: d.googleUrl,
        metadata: d.metadata,
        lastAccessedAt: d.lastAccessedAt,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST - Create new doc/sheet
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Check Google integration
    const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
    if (!integration) {
      return NextResponse.json(
        { error: 'Google not connected. Connect your Google account first.' },
        { status: 400 }
      );
    }

    // Check document limit
    const count = await LinkedDocument.countDocuments({ owner: user.mongoId });
    if (count >= MAX_DOCUMENTS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_DOCUMENTS_PER_USER} documents allowed.` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, type: createType, content } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let googleId: string;
    let googleUrl: string;
    const docType: 'google_doc' | 'google_sheet' = createType === 'google_sheet' ? 'google_sheet' : 'google_doc';

    if (docType === 'google_sheet') {
      const result = await createGoogleSheet(integration.refreshToken, name);
      googleId = result.sheetId;
      googleUrl = result.sheetUrl;
    } else {
      const result = await createGoogleDoc(integration.refreshToken, name);
      googleId = result.docId;
      googleUrl = result.docUrl;

      if (content) {
        await writeGoogleDoc(integration.refreshToken, googleId, content);
      }
    }

    // Share as anyone with link can edit
    await shareDocument(integration.refreshToken, googleId);

    const metadata = { title: name };

    const doc = new LinkedDocument({
      owner: user.mongoId,
      ownerClerkId: user.clerkId,
      name,
      type: docType,
      googleId,
      googleUrl,
      metadata,
    });
    await doc.save();

    return NextResponse.json({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      googleId,
      googleUrl,
      metadata,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
