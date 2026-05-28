import { NextRequest, NextResponse } from 'next/server';
import { ApiPermission } from '@/models/ApiKey';
import {
  apiKeyError,
  checkRateLimit,
  requireApiPermission,
  validateApiKey,
} from '@/lib/auth/validateApiKey';

export async function authenticateApiRequest(
  request: NextRequest,
  permission: ApiPermission
) {
  const validation = await validateApiKey(request);
  if (!validation.valid) {
    return { error: apiKeyError(validation) };
  }

  const permissionError = requireApiPermission(validation, permission);
  if (permissionError) {
    return { error: permissionError };
  }

  const rateLimit = checkRateLimit(
    validation.apiKey!._id.toString(),
    validation.apiKey!.rateLimit
  );
  if (!rateLimit.allowed) {
    return {
      error: withCors(NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': validation.apiKey!.rateLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      )),
    };
  }

  return { validation, rateLimit };
}

export function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, X-API-Key, Content-Type');
  return response;
}

export function optionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export function sanitizeTopicPayload(input: any) {
  const payload = { ...input };

  if (payload.seo) {
    if (payload.seo.metaTitle && payload.seo.metaTitle.length > 60) {
      payload.seo.metaTitle = payload.seo.metaTitle.substring(0, 60);
    }
    if (payload.seo.metaDescription && payload.seo.metaDescription.length > 155) {
      payload.seo.metaDescription = payload.seo.metaDescription.substring(0, 155);
    }
    if (payload.seo.openGraph?.title && payload.seo.openGraph.title.length > 100) {
      payload.seo.openGraph.title = payload.seo.openGraph.title.substring(0, 100);
    }
    if (payload.seo.openGraph?.description && payload.seo.openGraph.description.length > 200) {
      payload.seo.openGraph.description = payload.seo.openGraph.description.substring(0, 200);
    }
  }

  return payload;
}
