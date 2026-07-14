import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import {
  contentStructureErrorResponse,
  resolveContentStructure,
  uniqueOwnedSlug,
} from '@/lib/content-structure';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import Series from '@/models/Series';
import Topic from '@/models/Topic';

async function ownedSeries(id: string, ownerId: string) {
  return Series.findOne({ _id: id, owner: ownerId });
}

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
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

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

    const series = await ownedSeries(params.id, currentUser.mongoId);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const body = await request.json();
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      series.name = body.name;
    }
    if (body.description !== undefined) series.description = body.description || undefined;
    if (body.status !== undefined) series.status = body.status;
    if (body.slug !== undefined || body.name !== undefined) {
      series.slug = await uniqueOwnedSlug(
        Series,
        currentUser.mongoId,
        typeof body.slug === 'string' ? body.slug : series.name,
        params.id
      );
    }

    if (body.clusterId !== undefined) {
      const structure = await resolveContentStructure({
        ownerId: currentUser.mongoId,
        clusterId: body.clusterId,
      });
      series.clusterId = structure.clusterId;

      const contentFilter = { owner: currentUser.mongoId, seriesId: series._id };
      const structureUpdate = structure.clusterId
        ? { $set: { clusterId: structure.clusterId } }
        : { $unset: { clusterId: '' } };
      await Promise.all([
        Topic.updateMany(contentFilter, structureUpdate),
        BlogPost.updateMany(contentFilter, structureUpdate),
      ]);
    }

    await series.save();
    return NextResponse.json(series);
  } catch (error) {
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

    const series = await ownedSeries(params.id, currentUser.mongoId);
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const contentFilter = { owner: currentUser.mongoId, seriesId: series._id };
    await Promise.all([
      Topic.updateMany(contentFilter, { $unset: { seriesId: '' } }),
      BlogPost.updateMany(contentFilter, { $unset: { seriesId: '' } }),
    ]);
    await series.deleteOne();

    return NextResponse.json({ message: 'Series deleted; its content was left intact' });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
