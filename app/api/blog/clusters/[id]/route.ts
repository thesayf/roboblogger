import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import TopicCluster from '@/models/TopicCluster';
import {
  contentStrategyServiceError,
  deleteTopicCluster,
  updateTopicCluster,
} from '@/lib/content-strategy-service';

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

    const cluster = await TopicCluster.findOne({
      _id: params.id,
      owner: currentUser.mongoId,
    })
      .populate('primaryPillarTopicId', 'topic status generatedPostId')
      .populate('primaryPillarPostId', 'title slug status')
      .lean();
    if (!cluster) {
      return NextResponse.json({ error: 'Topic cluster not found' }, { status: 404 });
    }
    return NextResponse.json(cluster);
  } catch (error) {
    console.error('Error fetching topic cluster:', error);
    return NextResponse.json({ error: 'Failed to fetch topic cluster' }, { status: 500 });
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
    const cluster = await updateTopicCluster(
      currentUser.mongoId,
      params.id,
      await request.json()
    );
    return NextResponse.json(cluster);
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    console.error('Error updating topic cluster:', error);
    return NextResponse.json({ error: 'Failed to update topic cluster' }, { status: 500 });
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
    return NextResponse.json(await deleteTopicCluster(currentUser.mongoId, params.id));
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    console.error('Error deleting topic cluster:', error);
    return NextResponse.json({ error: 'Failed to delete topic cluster' }, { status: 500 });
  }
}
