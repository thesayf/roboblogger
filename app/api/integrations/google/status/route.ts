import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const integration = await GoogleIntegration.findOne({ userId })
      .select('email connectedAt')
      .lean() as any;

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: integration.email,
      connectedAt: integration.connectedAt,
    });
  } catch (error) {
    console.error('Error checking Google status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
