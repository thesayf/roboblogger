import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { getContentStrategy } from '@/lib/content-strategy-service';
import dbConnect from '@/lib/mongo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getContentStrategy(currentUser.mongoId));
  } catch (error) {
    console.error('Error fetching content strategy:', error);
    return NextResponse.json({ error: 'Failed to fetch content strategy' }, { status: 500 });
  }
}
