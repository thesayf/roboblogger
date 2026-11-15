import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import ImageKit from 'imagekit';
import { validateFullPage, publicationDocument, FullPageDocument } from '@/lib/blog/full-page';
import { authenticateApiRequest, withCors } from './v1-helpers';

export class DraftApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function reply(body: unknown, status = 200) {
  return withCors(NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
  } }));
}
export async function authorize(request: NextRequest, permission: 'full-page:write' | 'full-page:publish' = 'full-page:write') {
  const auth = await authenticateApiRequest(request, permission);
  if ('error' in auth) {
    auth.error!.headers.set('Cache-Control', 'private, no-store');
    return { error: withCors(auth.error!) };
  }
  return { ownerId: auth.validation.ownerId! };
}
export function failure(error: unknown) {
  if (error instanceof DraftApiError) return reply({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return reply({ error: 'Invalid request', issues: error.issues.map(i => ({ path: i.path, message: i.message })) }, 400);
  if ((error as any)?.code === 11000) return reply({ error: 'Slug or draft already exists; read the latest draft before retrying.' }, 409);
  return reply({ error: 'Could not complete draft request' }, 500);
}
// Bound the actual stream, not just the caller-controlled Content-Length header.
export async function readJson(request: NextRequest, maxBytes = 1600000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new DraftApiError(415, 'Use application/json');
  const reader = request.body?.getReader();
  if (!reader) throw new DraftApiError(400, 'JSON body required');
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new DraftApiError(413, 'Request too large'); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new DraftApiError(400, 'Invalid JSON'); }
  } finally { reader.releaseLock(); }
}
const documentInput = z.unknown().refine(d => d !== undefined, 'document is required');
export const createInput = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(320),
  slug: z.string().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  authorName: z.string().trim().max(160).optional(), category: z.string().trim().max(160).optional(),
  tags: z.array(z.string().max(80)).max(30).optional(),
  seoTitle: z.string().max(100).optional(), seoDescription: z.string().max(320).optional(),
  document: documentInput,
}).strict();
export const updateInput = z.object({ expectedRevision: z.number().int().nonnegative(), document: documentInput }).strict();
export const validateInput = z.object({ document: documentInput }).strict();
export function imagekit() {
  return new ImageKit({ publicKey: process.env.IMAGEKIT_PUBLIC_KEY!, privateKey: process.env.IMAGEKIT_PRIVATE_KEY!, urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT! });
}
export function isOwnerAsset(file: any, ownerId: string) {
  return typeof file?.filePath === 'string' && file.filePath.startsWith(`/blog-images/${ownerId}/`) && file.fileType === 'image';
}
export function canonicalAssetUrl(url: string) {
  const value = new URL(url);
  // ImageKit adds this cache timestamp to list/detail URLs but not upload URLs.
  value.searchParams.delete('updatedAt');
  return value.href;
}
export function assetResponse(file: any) {
  return { assetId: file.fileId, url: canonicalAssetUrl(file.url), width: file.width, height: file.height, name: file.name, alt: '', size: file.size };
}
export async function prepareDocument(input: unknown, ownerId: string) {
  let rendered: FullPageDocument;
  try { rendered = validateFullPage(input, process.env.IMAGEKIT_URL_ENDPOINT || ''); }
  catch (e) { throw new DraftApiError(422, e instanceof Error ? e.message : 'Invalid document'); }
  if (rendered.assets.length) {
    const kit = imagekit();
    // Verify IDs against ImageKit, not a caller-supplied URL or folder claim.
    for (const asset of rendered.assets) {
      let file: any;
      try { file = await kit.getFileDetails(asset.assetId); }
      catch { throw new DraftApiError(422, 'Managed asset unavailable'); }
      if (!isOwnerAsset(file, ownerId) || canonicalAssetUrl(file.url) !== canonicalAssetUrl(asset.url) || file.width !== asset.width || file.height !== asset.height)
        throw new DraftApiError(422, 'Managed asset must belong to this API key owner and use its original URL and dimensions');
    }
  }
  return { document: publicationDocument(input as FullPageDocument, rendered), articleMode: rendered.interactions?.length ? 'interactive' : 'standard' };
}
export function revisionFilter(post: unknown, expectedRevision: number) {
  return { post, ...(expectedRevision === 0 ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] } : { revision: expectedRevision }) };
}
export function draftResponse(post: any, design: any) {
  return { postId: String(post._id), slug: post.slug, title: post.title, description: post.description,
    authorName: post.authorName, category: post.category, tags: post.tags, seoTitle: post.seoTitle, seoDescription: post.seoDescription,
    status: post.status, revision: design?.revision || 0, document: design?.draft || null,
    articleMode: design?.draft?.interactions?.length ? 'interactive' : 'standard',
    editorUrl: `https://vibeblogger.io/blog/admin/manual?edit=${post._id}`,
    previewApiUrl: `https://vibeblogger.io/api/v1/full-page/drafts/${post._id}`,
    message: 'Draft revision only; the current live snapshot is unchanged. Publication requires a separate explicit action with full-page:publish or the authenticated editor.' };
}
