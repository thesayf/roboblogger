import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
import User from '@/models/User';
import BrandSettings from '@/models/BrandSettings';
import { authorize, DraftApiError, failure, prepareDocument, readJson, reply } from '@/lib/api/full-page-drafts';
import { optionsResponse } from '@/lib/api/v1-helpers';
export const dynamic = 'force-dynamic';
export const OPTIONS = optionsResponse;
const inputSchema = z.object({ action: z.literal('publish'), expectedRevision: z.number().int().nonnegative() }).strict();

export function articleUrl(base: string | undefined, slug: string) {
  if (!base) return null;
  try {
    const url = new URL(base);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    url.search = ''; url.hash = '';
    url.pathname = url.pathname.replace(/\/$/, '') + '/' + encodeURIComponent(slug);
    return url.href;
  } catch { return null; }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorize(request, 'full-page:publish');
  if ('error' in auth) return auth.error;
  try {
    const input = inputSchema.parse(await readJson(request, 4096));
    if (!/^[a-f0-9]{24}$/i.test(params.id)) throw new DraftApiError(404, 'Post not found');
    const owner = await User.findById(auth.ownerId).lean() as any;
    const brand = owner?.clerkId ? await BrandSettings.findOne({ userId: owner.clerkId }).lean() as any : null;
    const session = await mongoose.startSession();
    let result: any;
    try { await session.withTransaction(async () => {
      const filter = { _id: params.id, owner: auth.ownerId, status: { $in: ['draft', 'published'] } };
      const post = await BlogPost.findOne(filter).session(session).lean() as any;
      if (!post) throw new DraftApiError(404, 'Post not found');
      if (!post.title?.trim() || !post.description?.trim() || !post.slug) throw new DraftApiError(422, 'Title, description and slug are required to publish');
      const design = await FullPage.findOne({ post: params.id }).session(session).lean() as any;
      if (!design?.draft) throw new DraftApiError(422, 'Save a full-page draft before publishing');
      if ((design.revision || 0) !== input.expectedRevision) throw new DraftApiError(409, 'Draft revision changed; reload before publishing');
      // Validate the stored revision; never accept a replacement document in a publish request.
      const { document, articleMode } = await prepareDocument(design.draft, auth.ownerId);
      const updated = await FullPage.findOneAndUpdate({ _id: design._id, revision: input.expectedRevision }, {
        $set: { published: document, previousPublished: design.published || null, enabled: true }, $inc: { revision: 1 },
      }, { session, new: true });
      if (!updated) throw new DraftApiError(409, 'Draft revision changed; reload before publishing');
      const published = await BlogPost.findOneAndUpdate(filter, { $set: { status: 'published', publishedAt: post.publishedAt || new Date() } }, { session, new: true, runValidators: true });
      if (!published) throw new DraftApiError(409, 'Post changed; reload before publishing');
      result = { postId: String(post._id), slug: post.slug, status: 'published', renderMode: 'full_page', articleMode,
        revision: updated.revision, publishedAt: published.publishedAt, liveUrl: articleUrl(brand?.blogUrl, post.slug),
        publicApiUrl: `https://vibeblogger.io/api/v1/posts/${encodeURIComponent(post.slug)}`,
        message: 'Published saved revision. Consumer websites may cache the previous version. liveUrl uses the configured brand blog URL.' };
    }); } finally { await session.endSession(); }
    return reply(result);
  } catch (e) { return failure(e); }
}
