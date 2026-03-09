import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// GET - Return a short-lived access token for the Google Picker
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
    if (!integration) {
      return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_DOCS_CLIENT_ID,
      process.env.GOOGLE_DOCS_CLIENT_SECRET,
    );
    client.setCredentials({ refresh_token: integration.refreshToken });

    const { token } = await client.getAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }

    return NextResponse.json({ accessToken: token });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
  }
}
