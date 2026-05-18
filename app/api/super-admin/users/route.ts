import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (!process.env.BLOG_ADMIN_PASSWORD || password !== process.env.BLOG_ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ users });
}
