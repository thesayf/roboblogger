import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { contentStructureErrorResponse } from '@/lib/content-structure';
import {
  assignContentStructure,
  assignContentStructureBulk,
  contentStrategyServiceError,
} from '@/lib/content-strategy-service';
import dbConnect from '@/lib/mongo';

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    if (Array.isArray(body.assignments)) {
      const results = await assignContentStructureBulk(currentUser.mongoId, body.assignments);
      return NextResponse.json({
        success: results.every((result) => result.success),
        results,
      });
    }
    const content = await assignContentStructure(currentUser.mongoId, body);
    return NextResponse.json({ success: true, content });
  } catch (error) {
    const strategyError = contentStrategyServiceError(error);
    if (strategyError) {
      return NextResponse.json({ error: strategyError.message }, { status: strategyError.status });
    }
    const structureError = contentStructureErrorResponse(error);
    if (structureError) {
      return NextResponse.json({ error: structureError.message }, { status: structureError.status });
    }
    console.error('Error assigning content strategy:', error);
    return NextResponse.json({ error: 'Failed to assign content strategy' }, { status: 500 });
  }
}
