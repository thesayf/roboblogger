import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth/getCurrentUser';
import { stripe } from '@/lib/stripe';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

export async function POST() {
  try {
    const currentUser = await requireCurrentUser();
    await dbConnect();

    const user = await User.findOne({ clerkId: currentUser.clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/blog/admin`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
