import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
import { authorize, DraftApiError, draftResponse, failure, prepareDocument, readJson, reply, revisionFilter, updateInput } from '@/lib/api/full-page-drafts';
import { optionsResponse } from '@/lib/api/v1-helpers';
export const dynamic = 'force-dynamic';
export const OPTIONS = optionsResponse;
type Context = { params: { id: string } };
function postFilter(id: string, ownerId: string) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new DraftApiError(404, 'Draft not found');
  return { _id: id, owner: ownerId, status: 'draft' };
}
export async function GET(request: NextRequest, { params }: Context) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const post = await BlogPost.findOne(postFilter(params.id, auth.ownerId)).lean();
    if (!post) throw new DraftApiError(404, 'Draft not found');
    return reply(draftResponse(post, await FullPage.findOne({ post: params.id }).lean()));
  } catch (e) { return failure(e); }
}
export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const filter = postFilter(params.id, auth.ownerId);
    if (!await BlogPost.exists(filter)) throw new DraftApiError(404, 'Draft not found');
    const input = updateInput.parse(await readJson(request));
    const { document } = await prepareDocument(input.document, auth.ownerId);
    const session = await mongoose.startSession(); let result: any;
    try { await session.withTransaction(async () => {
      // Write-lock the private post, so concurrent publication cannot race this save.
      const post = await BlogPost.findOneAndUpdate(filter, { $set: { updatedAt: new Date() } }, { session, new: true });
      if (!post) throw new DraftApiError(404, 'Draft not found');
      const exists = await FullPage.exists({ post: params.id }).session(session);
      if (!exists && input.expectedRevision !== 0) throw new DraftApiError(409, 'Draft revision changed; reload before saving');
      const design = await FullPage.findOneAndUpdate(revisionFilter(params.id, input.expectedRevision),
        { $set: { draft: document }, $inc: { revision: 1 } }, { session, new: true, upsert: !exists });
      if (!design) throw new DraftApiError(409, 'Draft revision changed; reload before saving');
      result = draftResponse(post, design);
    }); } finally { await session.endSession(); }
    return reply(result);
  } catch (e) { return failure(e); }
}
