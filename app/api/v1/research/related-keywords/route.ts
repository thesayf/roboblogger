import { NextRequest, NextResponse } from 'next/server';
import { deductCredits, TOOL_COSTS } from '@/lib/billing/credit-service';
import { authenticateApiRequest, optionsResponse, withCors } from '@/lib/api/v1-helpers';
import { executeSearchRelatedKeywords } from '@/lib/seo-research/tool-executors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'seo:read');
  if ('error' in auth) return auth.error;

  const body = await request.json();
  if (!body.seedKeyword || typeof body.seedKeyword !== 'string') {
    return withCors(NextResponse.json({ error: 'seedKeyword is required' }, { status: 400 }));
  }

  const amount = TOOL_COSTS.search_related_keywords || 0.05;
  const creditResult = await deductCredits(
    auth.validation.ownerId!,
    amount,
    'chat',
    `API related keywords: "${body.seedKeyword}"`,
    { endpoint: '/api/v1/research/related-keywords', apiKeyId: auth.validation.apiKey!._id.toString() }
  );
  if (!creditResult.success) {
    return withCors(NextResponse.json({ error: 'Insufficient credits', required: amount, available: creditResult.available }, { status: 402 }));
  }

  const result = await executeSearchRelatedKeywords({
    seedKeyword: body.seedKeyword,
    limit: body.limit,
    location: body.location,
  });

  return withCors(NextResponse.json({
    ...result,
    creditsUsed: amount,
  }));
}

export async function OPTIONS() {
  return optionsResponse();
}
