import { NextRequest, NextResponse } from 'next/server';
import { deductCredits, TOOL_COSTS } from '@/lib/billing/credit-service';
import { authenticateApiRequest, optionsResponse, withCors } from '@/lib/api/v1-helpers';
import { executeSearchKeywordData } from '@/lib/seo-research/tool-executors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'seo:read');
  if ('error' in auth) return auth.error;

  const body = await request.json();
  if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
    return withCors(NextResponse.json({ error: 'keywords array is required' }, { status: 400 }));
  }

  const amount = TOOL_COSTS.search_keyword_data || 0.05;
  const creditResult = await deductCredits(
    auth.validation.ownerId!,
    amount,
    'chat',
    `API SEO keyword data (${body.keywords.length} keywords)`,
    { endpoint: '/api/v1/research/keyword-data', apiKeyId: auth.validation.apiKey!._id.toString() }
  );
  if (!creditResult.success) {
    return withCors(NextResponse.json({ error: 'Insufficient credits', required: amount, available: creditResult.available }, { status: 402 }));
  }

  const result = await executeSearchKeywordData({
    keywords: body.keywords.slice(0, 10),
    location: body.location,
    language: body.language,
  });

  return withCors(NextResponse.json({
    ...result,
    creditsUsed: amount,
  }));
}

export async function OPTIONS() {
  return optionsResponse();
}
