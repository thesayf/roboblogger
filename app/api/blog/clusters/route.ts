import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { uniqueOwnedSlug } from '@/lib/content-structure';
import dbConnect from '@/lib/mongo';
import TopicCluster from '@/models/TopicCluster';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = new URL(request.url).searchParams.get('status');
    const filter: Record<string, unknown> = { owner: currentUser.mongoId };
    if (status) filter.status = status;

    const clusters = await TopicCluster.find(filter)
      .populate('primaryPillarTopicId', 'topic status generatedPostId')
      .populate('primaryPillarPostId', 'title slug status')
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ clusters });
  } catch (error) {
    console.error('Error fetching topic clusters:', error);
    return NextResponse.json({ error: 'Failed to fetch topic clusters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = await uniqueOwnedSlug(
      TopicCluster,
      currentUser.mongoId,
      typeof body.slug === 'string' ? body.slug : body.name
    );
    const cluster = await TopicCluster.create({
      owner: currentUser.mongoId,
      name: body.name,
      description: body.description,
      slug,
      status: body.status || 'draft',
    });

    return NextResponse.json(cluster, { status: 201 });
  } catch (error) {
    console.error('Error creating topic cluster:', error);
    return NextResponse.json({ error: 'Failed to create topic cluster' }, { status: 500 });
  }
}
