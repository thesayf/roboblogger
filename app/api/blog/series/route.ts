import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import {
  contentStructureErrorResponse,
  resolveContentStructure,
  uniqueOwnedSlug,
} from '@/lib/content-structure';
import dbConnect from '@/lib/mongo';
import Series from '@/models/Series';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = { owner: currentUser.mongoId };
    if (searchParams.get('status')) filter.status = searchParams.get('status');
    if (searchParams.get('clusterId')) filter.clusterId = searchParams.get('clusterId');
    if (searchParams.get('standalone') === 'true') filter.clusterId = { $exists: false };

    const series = await Series.find(filter)
      .populate('clusterId', 'name slug status')
      .sort({ status: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
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

    const structure = await resolveContentStructure({
      ownerId: currentUser.mongoId,
      clusterId: body.clusterId,
    });
    const slug = await uniqueOwnedSlug(
      Series,
      currentUser.mongoId,
      typeof body.slug === 'string' ? body.slug : body.name
    );
    const series = await Series.create({
      owner: currentUser.mongoId,
      name: body.name,
      description: body.description,
      slug,
      clusterId: structure.clusterId,
      status: body.status || 'draft',
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json({ error: structureError.message }, { status: structureError.status });
    }
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
