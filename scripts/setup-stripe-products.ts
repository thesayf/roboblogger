/**
 * Stripe Products Setup Script
 *
 * Run this once to create the subscription and credit pack products in Stripe.
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-products.ts
 *
 * After running, add the outputted price IDs to your .env.local file.
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function setupStripeProducts() {
  console.log('\n🚀 Setting up Stripe products for Vibeblogger...\n');

  // 1. Create the subscription product
  console.log('📦 Creating subscription product...');
  const subscriptionProduct = await stripe.products.create({
    name: 'Vibeblogger Pro',
    description: 'Monthly subscription to Vibeblogger AI blog generation platform',
    metadata: {
      type: 'subscription',
    },
  });
  console.log(`   Product created: ${subscriptionProduct.id}`);

  // Create the subscription price ($49/month)
  const subscriptionPrice = await stripe.prices.create({
    product: subscriptionProduct.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      type: 'subscription',
    },
  });
  console.log(`   Price created: ${subscriptionPrice.id} ($49/month)\n`);

  // 2. Create credit pack products
  console.log('📦 Creating credit pack products...');

  // Credit pack product (one product, multiple prices)
  const creditsProduct = await stripe.products.create({
    name: 'Vibeblogger Credits',
    description: 'Credits for AI blog post generation. 1 credit = 1 blog post.',
    metadata: {
      type: 'credits',
    },
  });
  console.log(`   Credits product created: ${creditsProduct.id}`);

  // Small pack - $25 for 5 credits
  const smallPrice = await stripe.prices.create({
    product: creditsProduct.id,
    unit_amount: 2500,
    currency: 'usd',
    nickname: '5 Credits',
    metadata: {
      type: 'credits',
      pack: 'small',
      credits: '5',
    },
  });
  console.log(`   Small pack price: ${smallPrice.id} ($25 for 5 credits)`);

  // Medium pack - $50 for 10 credits
  const mediumPrice = await stripe.prices.create({
    product: creditsProduct.id,
    unit_amount: 5000,
    currency: 'usd',
    nickname: '10 Credits',
    metadata: {
      type: 'credits',
      pack: 'medium',
      credits: '10',
    },
  });
  console.log(`   Medium pack price: ${mediumPrice.id} ($50 for 10 credits)`);

  // Large pack - $100 for 22 credits (2 bonus)
  const largePrice = await stripe.prices.create({
    product: creditsProduct.id,
    unit_amount: 10000,
    currency: 'usd',
    nickname: '22 Credits (Best Value)',
    metadata: {
      type: 'credits',
      pack: 'large',
      credits: '22',
    },
  });
  console.log(`   Large pack price: ${largePrice.id} ($100 for 22 credits)\n`);

  // Output the environment variables to add
  console.log('✅ Setup complete!\n');
  console.log('Add these to your .env.local file:\n');
  console.log('```');
  console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${subscriptionPrice.id}`);
  console.log(`STRIPE_CREDIT_SMALL_PRICE_ID=${smallPrice.id}`);
  console.log(`STRIPE_CREDIT_MEDIUM_PRICE_ID=${mediumPrice.id}`);
  console.log(`STRIPE_CREDIT_LARGE_PRICE_ID=${largePrice.id}`);
  console.log('```\n');
}

setupStripeProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting up Stripe products:', error);
    process.exit(1);
  });
