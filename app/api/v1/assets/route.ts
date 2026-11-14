import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authorize, assetResponse, DraftApiError, failure, imagekit, isOwnerAsset, readJson, reply } from '@/lib/api/full-page-drafts';
import { optionsResponse } from '@/lib/api/v1-helpers';
export const dynamic = 'force-dynamic';
export const OPTIONS = optionsResponse;
export async function GET(request: NextRequest) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') || 20), skip = Number(request.nextUrl.searchParams.get('skip') || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(skip) || skip < 0 || skip > 100000) throw new DraftApiError(400, 'Invalid pagination');
    const files = await imagekit().listFiles({ path: `/blog-images/${auth.ownerId}`, limit, skip, sort: 'DESC_CREATED' });
    return reply({ assets: files.filter(f => isOwnerAsset(f, auth.ownerId)).map(assetResponse), limit, skip, hasMore: files.length === limit });
  } catch (e) { return failure(e); }
}
const uploadInput = z.object({ fileName: z.string().max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp)$/i), fileBase64: z.string().min(1), alt: z.string().trim().min(1).max(500) }).strict();
export async function POST(request: NextRequest) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const input = uploadInput.parse(await readJson(request, 12000000));
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input.fileBase64)) throw new DraftApiError(400, 'Provide raw base64 image bytes, not a URL');
    const bytes = Buffer.from(input.fileBase64, 'base64');
    if (!bytes.length || bytes.length > 8000000) throw new DraftApiError(413, 'Image must be at most 8 MB');
    const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
    if (!(png && /\.png$/i.test(input.fileName) || jpg && /\.jpe?g$/i.test(input.fileName) || webp && /\.webp$/i.test(input.fileName))) throw new DraftApiError(415, 'Only PNG, JPEG and WebP images are supported');
    const file = await imagekit().upload({ file: bytes, fileName: input.fileName, folder: `/blog-images/${auth.ownerId}`, useUniqueFileName: true });
    return reply({ asset: { ...assetResponse(file), alt: input.alt } }, 201);
  } catch (e) { return failure(e); }
}
