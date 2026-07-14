import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import Series from '@/models/Series';
import {
  contentStrategyServiceError,
  deleteContentSeries,
  updateContentSeries,
} from '@/lib/content-strategy-service';
import { contentStructureErrorResponse } from '@/lib/content-structure';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const series = await Series.findOne({ _id: params.id, owner: currentUser.mongoId })
      .populate('clusterId', 'name slug status')
      .lean();
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const series = await updateContentSeries(
      currentUser.mongoId,
      params.id,
      await request.json()
    );
    return NextResponse.json(series);
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json({ error: structureError.message }, { status: structureError.status });
    }
    console.error('Error updating series:', error);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await deleteContentSeries(currentUser.mongoId, params.id));
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    console.error('Error deleting series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
