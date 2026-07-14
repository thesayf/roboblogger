import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import {
  contentStructureErrorResponse,
} from '@/lib/content-structure';
import dbConnect from '@/lib/mongo';
import Series from '@/models/Series';
import {
  contentStrategyServiceError,
  createContentSeries,
} from '@/lib/content-strategy-service';

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
    const series = await createContentSeries(currentUser.mongoId, body);

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json({ error: structureError.message }, { status: structureError.status });
    }
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
