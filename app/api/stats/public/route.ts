import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';
import Topic from '@/models/Topic';
import BlogComponent from '@/models/BlogComponent';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    await dbConnect();

    const [publishedPosts, topicsResearched, components] = await Promise.all([
      BlogPost.countDocuments({ status: 'published' }),
      Topic.countDocuments(),
      BlogComponent.countDocuments(),
    ]);

    return NextResponse.json({
      publishedPosts,
      topicsResearched,
      components,
    });
  } catch {
    return NextResponse.json(
      { publishedPosts: 0, topicsResearched: 0, components: 0 },
      { status: 500 }
    );
  }
}
