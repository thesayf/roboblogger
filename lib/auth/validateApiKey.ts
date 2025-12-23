import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import ApiKey, { hashApiKey, IApiKey } from '@/models/ApiKey';

export interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  apiKey?: IApiKey;
  ownerId?: string;
}

/**
 * Extract API key from request headers
 * Supports both "Authorization: Bearer <key>" and "X-API-Key: <key>"
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate an API key and return the associated owner
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidation> {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return {
      valid: false,
      error: 'Missing API key. Include it in the Authorization header as "Bearer <key>" or in the "X-API-Key" header.'
    };
  }

  // Validate key format
  if (!rawKey.startsWith('rb_live_')) {
    return {
      valid: false,
      error: 'Invalid API key format'
    };
  }

  try {
    await dbConnect();

    // Hash the key and look it up
    const keyHash = hashApiKey(rawKey);
    const apiKey = await ApiKey.findOne({ keyHash });

    if (!apiKey) {
      return {
        valid: false,
        error: 'Invalid API key'
      };
    }

    if (!apiKey.isActive) {
      return {
        valid: false,
        error: 'API key has been revoked'
      };
    }

    // Update usage stats (fire and forget - don't block the request)
    ApiKey.updateOne(
      { _id: apiKey._id },
      {
        $inc: { requestCount: 1 },
        $set: { lastUsedAt: new Date() }
      }
    ).exec();

    return {
      valid: true,
      apiKey,
      ownerId: apiKey.owner.toString()
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      valid: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Helper to create an error response for invalid API keys
 */
export function apiKeyError(validation: ApiKeyValidation): NextResponse {
  return NextResponse.json(
    { error: validation.error },
    { status: 401 }
  );
}

/**
 * Simple in-memory rate limiting
 * In production, you'd want Redis for this
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(apiKeyId: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window

  let entry = rateLimitMap.get(apiKeyId);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // Start new window
    entry = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(apiKeyId, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
