import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (!process.env.BLOG_ADMIN_PASSWORD || password !== process.env.BLOG_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const [stats] = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeSubscribers: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] },
        },
        trialingUsers: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "trialing"] }, 1, 0] },
        },
        canceledUsers: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "canceled"] }, 1, 0] },
        },
        pastDueUsers: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "past_due"] }, 1, 0] },
        },
        totalCreditsInCirculation: { $sum: "$credits" },
        totalLifetimeCreditsUsed: { $sum: "$lifetimeCreditsUsed" },
        totalLifetimeCreditsPurchased: { $sum: "$lifetimeCreditsPurchased" },
      },
    },
  ]);

  const result = stats || {
    totalUsers: 0,
    activeSubscribers: 0,
    trialingUsers: 0,
    canceledUsers: 0,
    pastDueUsers: 0,
    totalCreditsInCirculation: 0,
    totalLifetimeCreditsUsed: 0,
    totalLifetimeCreditsPurchased: 0,
  };

  delete result._id;

  return NextResponse.json(result);
}
