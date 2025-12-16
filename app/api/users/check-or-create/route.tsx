import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clerkId = request.nextUrl.searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ clerkId }).session(session);

    if (!user) {
      user = new User({
        clerkId,
        days: [],
        createdAt: new Date(),
      });
      await user.save({ session });
    }

    await session.commitTransaction();

    return NextResponse.json(user);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error checking or creating user:", error);
    return NextResponse.json(
      { error: "Error checking or creating user" },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
