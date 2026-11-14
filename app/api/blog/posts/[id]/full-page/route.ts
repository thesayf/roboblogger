import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import FullPage from '@/models/FullPage';
import { validateFullPage, publicationDocument } from '@/lib/blog/full-page';
import { buildArticlePreview } from '@/lib/blog/interactions';
export const dynamic = 'force-dynamic';
type Context = { params: { id: string } };
async function owner(id: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  await dbConnect();
  return !!await BlogPost.exists({ _id: id, owner: user.mongoId });
}
export async function GET(_: NextRequest, { params }: Context) {
  if (!await owner(params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(await FullPage.findOne({ post: params.id }).lean() || {}, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: NextRequest, { params }: Context) {
  if (!await owner(params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await request.json();
    if (JSON.stringify(body).length > 400000) throw new Error('Document too large');
    const action = body.action;
    if (action === 'components') {
      await FullPage.updateOne({ post: params.id }, { $set: { enabled: false } });
      return NextResponse.json({ ok: true });
    }
    if (action === 'restore') {
      const prior = await FullPage.findOne({ post: params.id });
      if (!prior?.previousPublished) throw new Error('No previous published design to restore');
      validateFullPage(prior.previousPublished, process.env.IMAGEKIT_URL_ENDPOINT || '');
      await FullPage.updateOne({ _id: prior._id }, { $set: { published: prior.previousPublished, previousPublished: prior.published, enabled: true }, $inc: { revision: 1 } });
      return NextResponse.json({ ok: true });
    }
    if (!['preview','save','publish'].includes(action)) throw new Error('Unknown action');
    const document = body.document;
    const rendered = validateFullPage(document, process.env.IMAGEKIT_URL_ENDPOINT || '');
    if (action === 'publish') {
      // Only an explicit request here can replace the public full-page snapshot.
      const prior = await FullPage.findOne({ post: params.id });
      await FullPage.findOneAndUpdate({ post: params.id }, { $set: { draft: document, published: publicationDocument(document, rendered), previousPublished: prior?.published, enabled: true }, $inc: { revision: 1 } }, { upsert: true });
    } else if (action === 'save') {
      await FullPage.findOneAndUpdate({ post: params.id }, { $set: { draft: document }, $inc: { revision: 1 } }, { upsert: true });
    }
    return NextResponse.json({ rendered, articleMode: rendered.interactions?.length ? 'interactive' : 'standard', previewHtml: buildArticlePreview(rendered.html, rendered.css, rendered.interactions || [], process.env.IMAGEKIT_URL_ENDPOINT || '') }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid document' }, { status: 400 }); }
}
