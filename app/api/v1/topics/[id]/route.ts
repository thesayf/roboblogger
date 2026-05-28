import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import {
  authenticateApiRequest,
  optionsResponse,
  sanitizeTopicPayload,
  withCors,
} from '@/lib/api/v1-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, 'topics:read');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const topic = await Topic.findOne({ _id: params.id, owner: auth.validation.ownerId })
    .select('-embedding -researchState')
    .lean();

  if (!topic) {
    return withCors(NextResponse.json({ error: 'Topic not found' }, { status: 404 }));
  }

  return withCors(NextResponse.json({ topic }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, 'topics:write');
  if ('error' in auth) return auth.error;

  const body = await request.json();
  const { _id, createdAt, generatedPostId, owner, createdBy, retryCount, status, ...allowed } = sanitizeTopicPayload(body);

  await dbConnect();
  const topic = await Topic.findOneAndUpdate(
    { _id: params.id, owner: auth.validation.ownerId },
    { $set: { ...allowed, updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).select('-embedding -researchState');

  if (!topic) {
    return withCors(NextResponse.json({ error: 'Topic not found' }, { status: 404 }));
  }

  return withCors(NextResponse.json({ topic }));
}

export async function OPTIONS() {
  return optionsResponse();
}
