import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

// Update user profile data
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    console.log('Profile PATCH - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const profileData = await req.json();
    console.log('Profile PATCH - data received:', profileData);

    // Update or create user profile
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $set: {
          name: profileData.name,
          email: profileData.email,
          occupation: profileData.occupation,
          location: profileData.location,
          bio: profileData.bio,
          workHours: profileData.workHours,
          commuteTime: profileData.commuteTime,
          sleepSchedule: profileData.sleepSchedule,
          idealSchedule: profileData.idealSchedule,
        }
      },
      { new: true, upsert: true, runValidators: false }
    );
    
    console.log('Profile PATCH - user saved:', user);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}