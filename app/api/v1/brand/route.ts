import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import BrandSettings from '@/models/BrandSettings';
import User from '@/models/User';
import { authenticateApiRequest, optionsResponse, withCors } from '@/lib/api/v1-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, 'brand:read');
  if ('error' in auth) return auth.error;

  await dbConnect();
  const user = await User.findById(auth.validation.ownerId).lean() as any;
  if (!user?.clerkId) {
    return withCors(NextResponse.json({ error: 'Owner not found' }, { status: 404 }));
  }

  const settings = await BrandSettings.findOne({ userId: user.clerkId })
    .select('-_id blogName blogDescription blogUrl targetAudience tone customTone styleGuidelines topicsWeCover thingsToAvoid industryNiche referenceImages updatedAt')
    .lean();

  return withCors(NextResponse.json({ brand: settings || null }));
}

export async function OPTIONS() {
  return optionsResponse();
}
