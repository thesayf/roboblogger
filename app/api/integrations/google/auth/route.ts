import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getGoogleAuthUrl } from '@/lib/google-docs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = getGoogleAuthUrl(userId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/blog/admin?tab=documents&google=error`
    );
  }
}
