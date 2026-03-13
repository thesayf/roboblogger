import { auth, currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongo';
import User from '@/models/User';

export interface CurrentUser {
  clerkId: string;
  mongoId: string;
  email?: string;
  name?: string;
  credits: number;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
}

/**
 * Get the current authenticated user from Clerk and ensure they exist in MongoDB.
 * Creates the user in MongoDB if they don't exist.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  await dbConnect();

  // Try to find existing user
  let user = await User.findOne({ clerkId: userId });

  // If user doesn't exist by clerkId, check by email to prevent duplicates
  // (e.g., same person signing in via different Clerk auth methods)
  if (!user) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link existing account to this Clerk ID
        user.clerkId = userId;
        if (clerkUser?.imageUrl) user.imageUrl = clerkUser.imageUrl;
        await user.save();
      }
    }

    // Truly new user — create them
    if (!user) {
      user = await User.create({
        clerkId: userId,
        email,
        name: clerkUser?.firstName
          ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
          : undefined,
        imageUrl: clerkUser?.imageUrl,
      });
    }
  }

  return {
    clerkId: userId,
    mongoId: user._id.toString(),
    email: user.email,
    name: user.name,
    credits: user.credits ?? 0,
    subscriptionStatus: user.subscriptionStatus ?? 'none',
  };
}

/**
 * Get the current user or throw an error if not authenticated.
 * Use this in protected API routes.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
