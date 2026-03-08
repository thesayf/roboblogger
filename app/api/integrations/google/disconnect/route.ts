import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';
import LinkedDocument from '@/models/LinkedDocument';
import { revokeGoogleAccess } from '@/lib/google-docs';

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const integration = await GoogleIntegration.findOne({ userId }).lean() as any;
    if (integration?.refreshToken) {
      await revokeGoogleAccess(integration.refreshToken);
    }

    // Remove integration and all linked documents
    await GoogleIntegration.findOneAndDelete({ userId });
    await LinkedDocument.deleteMany({ ownerClerkId: userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
