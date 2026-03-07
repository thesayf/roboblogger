import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/getCurrentUser';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

// POST - Sync subscription status from Stripe to DB
export async function POST() {
  try {
    const currentUser = await requireCurrentUser();
    await dbConnect();

    const user = await User.findOne({ clerkId: currentUser.clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({
        synced: false,
        subscriptionStatus: user.subscriptionStatus,
        message: 'No Stripe customer ID',
      });
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      // No subscription in Stripe - set to none
      user.subscriptionStatus = 'none';
      await user.save();
      return NextResponse.json({
        synced: true,
        subscriptionStatus: 'none',
      });
    }

    // Map Stripe status
    const statusMap: Record<string, typeof user.subscriptionStatus> = {
      trialing: 'trialing',
      active: 'active',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
    };

    const newStatus = statusMap[subscription.status] || 'none';
    user.subscriptionStatus = newStatus;
    user.subscriptionId = subscription.id;
    user.subscriptionPriceId = subscription.items.data[0]?.price?.id;

    if (subscription.current_period_end) {
      user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }
    if (subscription.trial_end) {
      user.trialEndsAt = new Date(subscription.trial_end * 1000);
    }

    await user.save();

    return NextResponse.json({
      synced: true,
      subscriptionStatus: newStatus,
      credits: user.credits,
    });
  } catch (error) {
    console.error('Sync subscription error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
