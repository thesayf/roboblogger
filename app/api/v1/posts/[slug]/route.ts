import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import { validateApiKey, apiKeyError, checkRateLimit } from '@/lib/auth/validateApiKey';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/posts/[slug] - Get a single blog post by slug
 *
 * Headers:
 * - Authorization: Bearer <api_key>
 * - X-API-Key: <api_key>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    const { slug } = params;

    // Find the post - must be published and owned by the API key owner
    const post = await BlogPost.findOne({
      slug,
      owner: validation.ownerId,
      status: 'published'
    })
      .populate('author', 'name imageUrl')
      .populate({
        path: 'components',
        options: { sort: { order: 1 } }
      })
      .select('-owner')
      .lean();

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ post });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', validation.apiKey!.rateLimit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, X-API-Key, Content-Type');

    return response;
  } catch (error) {
    console.error('Error fetching post via API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
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
