import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
import { authorize, createInput, draftResponse, failure, prepareDocument, readJson, reply, DraftApiError } from '@/lib/api/full-page-drafts';
import { optionsResponse } from '@/lib/api/v1-helpers';
export const dynamic = 'force-dynamic';
export const OPTIONS = optionsResponse;
export async function GET(request: NextRequest) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || 20), skip = Number(request.nextUrl.searchParams.get('skip') || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(skip) || skip < 0 || skip > 100000) throw new DraftApiError(400, 'Invalid pagination');
    const filter = { owner: auth.ownerId, status: 'draft' };
    const posts = await BlogPost.find(filter).select('_id slug title description updatedAt').sort({ _id: -1 }).skip(skip).limit(limit).lean();
    return reply({ drafts: posts, limit, skip, total: await BlogPost.countDocuments(filter) });
  } catch (e) { return failure(e); }
}
export async function POST(request: NextRequest) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const { document: source, ...metadata } = createInput.parse(await readJson(request));
    const { document } = await prepareDocument(source, auth.ownerId);
    const session = await mongoose.startSession();
    let result: any;
    try { await session.withTransaction(async () => {
      const [post] = await BlogPost.create([{ ...metadata, owner: auth.ownerId, author: auth.ownerId, status: 'draft', components: [] }], { session });
      const [design] = await FullPage.create([{ post: post._id, draft: document, revision: 1, enabled: false }], { session });
      result = draftResponse(post, design);
    }); } finally { await session.endSession(); }
    return reply(result, 201);
  } catch (e) { return failure(e); }
}
