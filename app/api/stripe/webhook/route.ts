import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, PRICING } from '@/lib/stripe';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';
import CreditTransaction from '@/models/CreditTransaction';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const checkoutType = session.metadata?.type;

        if (!clerkId) {
          console.error('No clerkId in checkout session metadata');
          break;
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
          console.error('User not found for clerkId:', clerkId);
          break;
        }

        if (checkoutType === 'credits') {
          // Add credits to user's wallet
          const creditsAmount = parseInt(session.metadata?.creditsAmount || '0', 10);
          if (creditsAmount > 0) {
            const balanceBefore = user.credits;
            user.credits += creditsAmount;
            user.lifetimeCreditsPurchased += creditsAmount;
            await user.save();

            // Log to transaction ledger
            await CreditTransaction.create({
              user: user._id,
              amount: creditsAmount,
              balanceBefore,
              balanceAfter: user.credits,
              action: 'topup_purchase',
              description: `Purchased ${creditsAmount} credits (${session.metadata?.creditPack || 'unknown'} pack)`,
              metadata: {
                stripePaymentId: session.payment_intent as string,
                creditPack: session.metadata?.creditPack,
              },
            }).catch((err: Error) => console.error('Failed to log credit transaction:', err));

            console.log(`Added ${creditsAmount} credits to user ${clerkId}`);
          }
        } else if (checkoutType === 'subscription') {
          // Subscription will be handled by customer.subscription.created event
          console.log(`Subscription checkout completed for user ${clerkId}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (!user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        // Map Stripe status to our status
        let status: typeof user.subscriptionStatus = 'none';
        switch (subscription.status) {
          case 'trialing':
            status = 'trialing';
            break;
          case 'active':
            status = 'active';
            break;
          case 'past_due':
            status = 'past_due';
            break;
          case 'canceled':
            status = 'canceled';
            break;
          case 'unpaid':
            status = 'unpaid';
            break;
          default:
            status = 'none';
        }

        user.subscriptionStatus = status;
        user.subscriptionId = subscription.id;
        user.subscriptionPriceId = subscription.items.data[0]?.price?.id;

        if (subscription.current_period_end) {
          user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }

        if (subscription.trial_end) {
          user.trialEndsAt = new Date(subscription.trial_end * 1000);
        }

        // Grant free trial credits on first subscription (trial start)
        if (
          subscription.status === 'trialing' &&
          !user.freeCreditsUsed &&
          event.type === 'customer.subscription.created'
        ) {
          const balanceBefore = user.credits;
          user.credits += PRICING.freeTrialCredits;
          user.freeCreditsUsed = true;

          await CreditTransaction.create({
            user: user._id,
            amount: PRICING.freeTrialCredits,
            balanceBefore,
            balanceAfter: user.credits,
            action: 'trial_grant',
            description: `Free trial: ${PRICING.freeTrialCredits} credits granted`,
          }).catch((err: Error) => console.error('Failed to log trial credit transaction:', err));

          console.log(`Granted ${PRICING.freeTrialCredits} free trial credits to user`);
        }

        await user.save();
        console.log(`Updated subscription for user: status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (!user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        user.subscriptionStatus = 'canceled';
        user.subscriptionId = undefined;
        user.subscriptionPriceId = undefined;
        user.subscriptionCurrentPeriodEnd = undefined;
        await user.save();
        console.log(`Subscription canceled for user`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Log successful payment
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = 'past_due';
          await user.save();
          console.log(`Payment failed for user, status set to past_due`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
