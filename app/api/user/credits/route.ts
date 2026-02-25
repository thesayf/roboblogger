import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/getCurrentUser';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

// GET - Get user's credits and subscription status
export async function GET() {
  try {
    const currentUser = await requireCurrentUser();
    await dbConnect();

    const user = await User.findOne({ clerkId: currentUser.clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      trialEndsAt: user.trialEndsAt,
      freeCreditsUsed: user.freeCreditsUsed,
      lifetimeCreditsUsed: user.lifetimeCreditsUsed,
      lifetimeCreditsPurchased: user.lifetimeCreditsPurchased,
    });
  } catch (error) {
    console.error('Get credits error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get credits' },
      { status: 500 }
    );
  }
}

// POST - Deduct credits (called when generating a post)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser();
    await dbConnect();

    const body = await request.json();
    const { amount = 1, action } = body as { amount?: number; action?: string };

    const user = await User.findOne({ clerkId: currentUser.clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough credits
    if (user.credits < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          credits: user.credits,
          required: amount,
        },
        { status: 402 } // Payment Required
      );
    }

    // Deduct credits
    user.credits -= amount;
    user.lifetimeCreditsUsed += amount;
    await user.save();

    console.log(`Deducted ${amount} credit(s) for action: ${action || 'unknown'}`);

    return NextResponse.json({
      success: true,
      credits: user.credits,
      deducted: amount,
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}
