import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { exchangeCodeForTokens } from '@/lib/google-docs';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/blog/admin?tab=documents&google=error`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      console.error('Google OAuth callback error:', error || 'missing code');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/blog/admin?tab=documents&google=error`
      );
    }

    const { refreshToken, email } = await exchangeCodeForTokens(code);

    await dbConnect();

    await GoogleIntegration.findOneAndUpdate(
      { userId },
      {
        userId,
        refreshToken,
        email,
        connectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/blog/admin?tab=documents&google=connected`
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/blog/admin?tab=documents&google=error`
    );
  }
}
