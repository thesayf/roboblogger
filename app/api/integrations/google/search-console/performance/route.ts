import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';
import {
  getSearchConsolePagePerformance,
  getSearchConsoleUrlPerformance,
} from '@/lib/search-console';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
  if (!integration?.refreshToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
  }
  if (!integration.searchConsoleSiteUrl) {
    return NextResponse.json({ error: 'No Search Console property selected' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get('days') || 28)));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));
  const url = searchParams.get('url');

  try {
    if (url) {
      const queries = await getSearchConsoleUrlPerformance({
        refreshToken: integration.refreshToken,
        siteUrl: integration.searchConsoleSiteUrl,
        url,
        days,
        limit,
      });
      return NextResponse.json({
        siteUrl: integration.searchConsoleSiteUrl,
        url,
        days,
        queries,
      });
    }

    const pages = await getSearchConsolePagePerformance({
      refreshToken: integration.refreshToken,
      siteUrl: integration.searchConsoleSiteUrl,
      days,
      limit,
    });

    return NextResponse.json({
      siteUrl: integration.searchConsoleSiteUrl,
      days,
      pages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load Search Console performance' },
      { status: error?.code || error?.response?.status || 500 }
    );
  }
}
