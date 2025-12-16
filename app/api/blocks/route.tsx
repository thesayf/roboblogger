import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const clerkId = request.nextUrl.searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({
        clerkId,
        createdAt: new Date(),
      });
      await user.save();
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error checking or creating user:", error);
    return NextResponse.json(
      { error: "Error checking or creating user" },
      { status: 500 }
    );
  }
}
