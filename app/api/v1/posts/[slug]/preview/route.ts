import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, requireApiPermission, checkRateLimit } from '@/lib/auth/validateApiKey';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const validation = await validateApiKey(request);
  const denied = requireApiPermission(validation, 'posts:read');
  if (denied) return denied;
  const key = validation.apiKey!;
  if (!checkRateLimit(String(key._id), key.rateLimit).allowed) return NextResponse.json({error:'Rate limit exceeded'}, {status:429});
  // Published-read permission alone never grants draft access.
  const post = await BlogPost.findOne({ slug: params.slug, owner: validation.ownerId, _id: {$in: key.previewPostIds || []} }).lean() as any;
  if (!post) return NextResponse.json({error:'Not found'}, {status:404});
  const design = await FullPage.findOne({post:post._id}).lean() as any;
  if (!design?.draft) return NextResponse.json({error:'Not found'}, {status:404});
  return NextResponse.json({post: { _id:post._id, slug:post.slug, title:post.title, description:post.description, seoTitle:post.seoTitle, seoDescription:post.seoDescription, featuredImage:post.featuredImage, status:post.status, updatedAt:post.updatedAt, renderMode:'full_page', articleMode:design.draft.interactions?.length ? 'interactive' : 'standard', fullPageDocument:design.draft }}, {headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
}
