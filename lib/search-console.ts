import { google } from 'googleapis';

export interface SearchConsoleSite {
  siteUrl: string;
  permissionLevel?: string;
}

export interface SearchConsolePageMetric {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function getAuthenticatedClient(refreshToken: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_DOCS_CLIENT_ID,
    process.env.GOOGLE_DOCS_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/integrations/google/callback`
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function isoDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function listSearchConsoleSites(refreshToken: string): Promise<SearchConsoleSite[]> {
  const auth = getAuthenticatedClient(refreshToken);
  const webmasters = google.webmasters({ version: 'v3', auth });
  const res = await webmasters.sites.list();

  return (res.data.siteEntry || []).map((site: any) => ({
    siteUrl: site.siteUrl,
    permissionLevel: site.permissionLevel,
  }));
}

export async function getSearchConsolePagePerformance(options: {
  refreshToken: string;
  siteUrl: string;
  days?: number;
  limit?: number;
}): Promise<SearchConsolePageMetric[]> {
  const auth = getAuthenticatedClient(options.refreshToken);
  const webmasters = google.webmasters({ version: 'v3', auth });
  const days = options.days || 28;

  const res = await webmasters.searchanalytics.query({
    siteUrl: options.siteUrl,
    requestBody: {
      startDate: isoDateDaysAgo(days),
      endDate: isoDateDaysAgo(2),
      dimensions: ['page'],
      rowLimit: options.limit || 25,
      searchType: 'web',
    },
  });

  return (res.data.rows || []).map((row: any) => ({
    page: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

export async function getSearchConsoleUrlPerformance(options: {
  refreshToken: string;
  siteUrl: string;
  url: string;
  days?: number;
  limit?: number;
}): Promise<Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>> {
  const auth = getAuthenticatedClient(options.refreshToken);
  const webmasters = google.webmasters({ version: 'v3', auth });
  const days = options.days || 28;

  const res = await webmasters.searchanalytics.query({
    siteUrl: options.siteUrl,
    requestBody: {
      startDate: isoDateDaysAgo(days),
      endDate: isoDateDaysAgo(2),
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: options.url,
        }],
      }],
      rowLimit: options.limit || 25,
      searchType: 'web',
    },
  });

  return (res.data.rows || []).map((row: any) => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}
