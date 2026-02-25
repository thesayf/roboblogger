import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/getCurrentUser';
import { stripe, PRICING, getCreditPack } from '@/lib/stripe';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser();
    await dbConnect();

    const user = await User.findOne({ clerkId: currentUser.clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, creditPack } = body as {
      type: 'subscription' | 'credits';
      creditPack?: 'small' | 'medium' | 'large';
    };

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          clerkId: currentUser.clerkId,
          mongoId: currentUser.mongoId,
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Use the request origin to ensure redirect back to the same domain
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/');
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (type === 'subscription') {
      // Check if user already has an active subscription
      if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
        return NextResponse.json(
          { error: 'You already have an active subscription' },
          { status: 400 }
        );
      }

      // Validate price ID is configured
      if (!PRICING.subscription.priceId) {
        console.error('STRIPE_SUBSCRIPTION_PRICE_ID is not configured');
        return NextResponse.json(
          { error: 'Subscription not configured. Please contact support.' },
          { status: 500 }
        );
      }

      console.log('Creating subscription checkout with price:', PRICING.subscription.priceId);

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: PRICING.subscription.priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: PRICING.subscription.trialDays,
          metadata: {
            clerkId: currentUser.clerkId,
          },
        },
        success_url: `${baseUrl}/blog/admin?subscription=success`,
        cancel_url: `${baseUrl}/blog/admin?subscription=canceled`,
        metadata: {
          clerkId: currentUser.clerkId,
          type: 'subscription',
        },
      });

      return NextResponse.json({ url: session.url });
    } else if (type === 'credits') {
      if (!creditPack || !['small', 'medium', 'large'].includes(creditPack)) {
        return NextResponse.json(
          { error: 'Invalid credit pack' },
          { status: 400 }
        );
      }

      const pack = getCreditPack(creditPack);

      // Create one-time payment checkout session for credits
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: pack.priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/blog/admin?credits=success&pack=${creditPack}`,
        cancel_url: `${baseUrl}/blog/admin?credits=canceled`,
        metadata: {
          clerkId: currentUser.clerkId,
          type: 'credits',
          creditPack,
          creditsAmount: pack.credits.toString(),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
  } catch (error) {
    console.error('Stripe checkout error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    );
  }
}
