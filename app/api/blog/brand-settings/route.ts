import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import BrandSettings from '@/models/BrandSettings';

// GET /api/blog/brand-settings - Get brand settings for current user
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find or return empty settings
    const existingSettings = await BrandSettings.findOne({ userId: currentUser.clerkId }).lean();

    if (!existingSettings) {
      // Return default empty settings
      const defaultSettings = {
        userId: currentUser.clerkId,
        blogName: '',
        blogDescription: '',
        targetAudience: '',
        tone: 'professional',
        customTone: '',
        styleGuidelines: '',
        topicsWeCover: '',
        thingsToAvoid: '',
        exampleContent: '',
        industryNiche: '',
        referenceImages: [],
      };
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(existingSettings);

  } catch (error) {
    console.error('Error fetching brand settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch brand settings', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/blog/brand-settings - Update brand settings for current user
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();

    // Validate tone enum
    const validTones = ['professional', 'casual', 'technical', 'conversational', 'authoritative', 'friendly', 'custom'];
    if (body.tone && !validTones.includes(body.tone)) {
      return NextResponse.json(
        { error: 'Invalid tone value' },
        { status: 400 }
      );
    }

    // Upsert - create if doesn't exist, update if it does
    const settings = await BrandSettings.findOneAndUpdate(
      { userId: currentUser.clerkId },
      {
        $set: {
          blogName: body.blogName ?? '',
          blogDescription: body.blogDescription ?? '',
          targetAudience: body.targetAudience ?? '',
          tone: body.tone ?? 'professional',
          customTone: body.customTone ?? '',
          styleGuidelines: body.styleGuidelines ?? '',
          topicsWeCover: body.topicsWeCover ?? '',
          thingsToAvoid: body.thingsToAvoid ?? '',
          exampleContent: body.exampleContent ?? '',
          industryNiche: body.industryNiche ?? '',
          referenceImages: body.referenceImages ?? [],
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).lean();

    return NextResponse.json({
      message: 'Brand settings updated successfully',
      settings
    });

  } catch (error) {
    console.error('Error updating brand settings:', error);
    return NextResponse.json(
      { message: 'Failed to update brand settings', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
