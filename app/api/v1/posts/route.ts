import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import { validateApiKey, apiKeyError, checkRateLimit } from '@/lib/auth/validateApiKey';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/posts - List published blog posts
 *
 * Query parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Posts per page (default: 10, max: 100)
 * - category (string): Filter by category
 * - tag (string): Filter by tag
 *
 * Headers:
 * - Authorization: Bearer <api_key>
 * - X-API-Key: <api_key>
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const validation = await validateApiKey(request);
  if (!validation.valid) {
    return apiKeyError(validation);
  }

  // Check rate limit
  const rateLimit = checkRateLimit(
    validation.apiKey!._id.toString(),
    validation.apiKey!.rateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        resetAt: new Date(rateLimit.resetAt).toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': validation.apiKey!.rateLimit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      }
    );
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    // Build query - only published posts for this owner
    const query: any = {
      owner: validation.ownerId,
      status: 'published'
    };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    const skip = (page - 1) * limit;

    // Fetch posts with populated components
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'name imageUrl')
        .populate({
          path: 'components',
          options: { sort: { order: 1 } }
        })
        .select('-owner') // Don't expose owner ID
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(query)
    ]);

    const response = NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', validation.apiKey!.rateLimit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());

    // Add CORS headers for external access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, X-API-Key, Content-Type');

    return response;
  } catch (error) {
    console.error('Error fetching posts via API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-API-Key, Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
