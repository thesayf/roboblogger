import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';
import User from '@/models/User';
import { authenticateApiRequest, optionsResponse, withCors } from '@/lib/api/v1-helpers';
import { getSearchConsoleUrlPerformance } from '@/lib/search-console';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'search-console:read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return withCors(NextResponse.json({ error: 'url query parameter is required' }, { status: 400 }));
  }

  await dbConnect();
  const user = await User.findById(auth.validation.ownerId).lean() as any;
  if (!user?.clerkId) {
    return withCors(NextResponse.json({ error: 'Owner not found' }, { status: 404 }));
  }

  const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
  if (!integration?.refreshToken) {
    return withCors(NextResponse.json({ error: 'Google not connected' }, { status: 400 }));
  }
  if (!integration.searchConsoleSiteUrl) {
    return withCors(NextResponse.json({ error: 'No Search Console property selected' }, { status: 400 }));
  }

  const days = Math.min(90, Math.max(7, Number(searchParams.get('days') || 28)));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));

  const queries = await getSearchConsoleUrlPerformance({
    refreshToken: integration.refreshToken,
    siteUrl: integration.searchConsoleSiteUrl,
    url,
    days,
    limit,
  });

  return withCors(NextResponse.json({
    siteUrl: integration.searchConsoleSiteUrl,
    url,
    days,
    queries,
  }));
}

export async function OPTIONS() {
  return optionsResponse();
}
