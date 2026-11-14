import { NextRequest } from 'next/server';
import { authorize, failure, prepareDocument, readJson, reply, validateInput } from '@/lib/api/full-page-drafts';
import { optionsResponse } from '@/lib/api/v1-helpers';
export const dynamic = 'force-dynamic';
export const OPTIONS = optionsResponse;
export async function POST(request: NextRequest) {
  const auth = await authorize(request); if ('error' in auth) return auth.error;
  try {
    const input = validateInput.parse(await readJson(request));
    return reply({ valid: true, ...await prepareDocument(input.document, auth.ownerId) });
  } catch (e) { return failure(e); }
}
