import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';
import User from '@/models/User';
import {
  authenticateApiRequest,
  optionsResponse,
  sanitizeTopicPayload,
  withCors,
} from '@/lib/api/v1-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'topics:read');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const filter: any = { owner: new Types.ObjectId(auth.validation.ownerId) };
  if (status && status !== 'all') filter.status = status;
  if (search) {
    filter.$or = [
      { topic: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { additionalRequirements: { $regex: search, $options: 'i' } },
      { 'seo.primaryKeyword': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [topics, total] = await Promise.all([
    Topic.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-embedding -researchState')
      .lean(),
    Topic.countDocuments(filter),
  ]);

  return withCors(NextResponse.json({
    topics,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'topics:write');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const user = await User.findById(auth.validation.ownerId).lean() as any;
  if (!user?.clerkId) {
    return withCors(NextResponse.json({ error: 'Owner not found' }, { status: 404 }));
  }

  const body = await request.json();
  const inputTopics = Array.isArray(body.topics) ? body.topics : [body];
  if (inputTopics.length === 0 || inputTopics.length > 20) {
    return withCors(NextResponse.json({ error: 'Provide between 1 and 20 topics' }, { status: 400 }));
  }
  if (inputTopics.some((topic: any) => !topic.topic || typeof topic.topic !== 'string')) {
    return withCors(NextResponse.json({ error: 'Each topic must include a topic string' }, { status: 400 }));
  }

  const docs = inputTopics.map((topic: any) => ({
    ...sanitizeTopicPayload(topic),
    owner: auth.validation.ownerId,
    createdBy: user.clerkId,
    status: 'pending',
    retryCount: 0,
    source: inputTopics.length > 1 ? 'bulk' : (topic.source || 'individual'),
  }));

  const created = await Topic.insertMany(docs);

  return withCors(NextResponse.json({
    topics: created,
    count: created.length,
  }, { status: 201 }));
}

export async function OPTIONS() {
  return optionsResponse();
}
