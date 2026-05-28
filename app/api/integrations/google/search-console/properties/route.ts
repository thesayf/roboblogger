import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import GoogleIntegration from '@/models/GoogleIntegration';
import { listSearchConsoleSites } from '@/lib/search-console';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const integration = await GoogleIntegration.findOne({ userId: user.clerkId }).lean() as any;
  if (!integration?.refreshToken) {
    return NextResponse.json({ connected: false, sites: [], selectedSiteUrl: null });
  }

  try {
    const sites = await listSearchConsoleSites(integration.refreshToken);
    return NextResponse.json({
      connected: true,
      email: integration.email,
      sites,
      selectedSiteUrl: integration.searchConsoleSiteUrl || null,
      selectedPermissionLevel: integration.searchConsolePermissionLevel || null,
    });
  } catch (error: any) {
    const insufficientScopes = error?.code === 403 || error?.response?.status === 403;
    return NextResponse.json({
      connected: true,
      needsReconnect: insufficientScopes,
      email: integration.email,
      sites: [],
      selectedSiteUrl: integration.searchConsoleSiteUrl || null,
      error: insufficientScopes
        ? 'Google is connected, but Search Console permission is missing. Reconnect Google to grant Search Console access.'
        : error.message || 'Failed to load Search Console properties',
    }, { status: insufficientScopes ? 200 : 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { siteUrl } = await request.json();
  if (!siteUrl || typeof siteUrl !== 'string') {
    return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 });
  }

  await dbConnect();
  const integration = await GoogleIntegration.findOne({ userId: user.clerkId });
  if (!integration?.refreshToken) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
  }

  const sites = await listSearchConsoleSites(integration.refreshToken);
  const selected = sites.find((site) => site.siteUrl === siteUrl);
  if (!selected) {
    return NextResponse.json({ error: 'Search Console property not found for this Google account' }, { status: 404 });
  }

  integration.searchConsoleSiteUrl = selected.siteUrl;
  integration.searchConsolePermissionLevel = selected.permissionLevel;
  integration.searchConsoleConnectedAt = new Date();
  await integration.save();

  return NextResponse.json({
    success: true,
    selectedSiteUrl: integration.searchConsoleSiteUrl,
    selectedPermissionLevel: integration.searchConsolePermissionLevel,
  });
}
