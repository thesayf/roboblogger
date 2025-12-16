import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongo";
import BlogPost from "@/models/BlogPost";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { action, ...params } = await request.json();
    
    switch (action) {
      case 'searchByKeywords':
        return await searchByKeywords(params);
      case 'searchByCategory':
        return await searchByCategory(params);
      case 'searchRelatedBlogs':
        return await searchRelatedBlogs(params);
      case 'getBlogsByTags':
        return await getBlogsByTags(params);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Blog search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

async function searchByKeywords({ keywords, limit = 5 }: { keywords: string[], limit?: number }) {
  try {
    // Create text search query for keywords
    const keywordRegex = keywords.map(keyword => 
      new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    );
    
    const blogs = await BlogPost.find({
      status: 'published',
      $or: [
        { title: { $in: keywordRegex } },
        { description: { $in: keywordRegex } },
        { tags: { $in: keywords.map(k => new RegExp(k, 'i')) } }
      ]
    })
    .select('title slug description category tags readTime createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const results = blogs.map(blog => ({
      title: blog.title,
      slug: blog.slug,
      description: blog.description,
      category: blog.category,
      readTime: blog.readTime,
      relevanceScore: calculateRelevanceScore(blog, keywords)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in searchByKeywords:', error);
    return NextResponse.json({ error: 'Keyword search failed' }, { status: 500 });
  }
}

async function searchByCategory({ category, limit = 5 }: { category: string, limit?: number }) {
  try {
    const blogs = await BlogPost.find({
      status: 'published',
      category: new RegExp(category, 'i')
    })
    .select('title slug description category tags readTime createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const results = blogs.map(blog => ({
      title: blog.title,
      slug: blog.slug,
      description: blog.description,
      category: blog.category,
      readTime: blog.readTime,
      relevanceScore: 0.8 // High relevance for category matches
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in searchByCategory:', error);
    return NextResponse.json({ error: 'Category search failed' }, { status: 500 });
  }
}

async function searchRelatedBlogs({ topic, limit = 5 }: { topic: string, limit?: number }) {
  try {
    // Extract keywords from topic for similarity search
    const topicKeywords = topic.toLowerCase().split(/\s+/).filter(word => 
      word.length > 3 && !['and', 'the', 'for', 'with', 'how', 'to'].includes(word)
    );

    const keywordRegex = topicKeywords.map(keyword => 
      new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    );

    const blogs = await BlogPost.find({
      status: 'published',
      $or: [
        { title: { $in: keywordRegex } },
        { description: { $in: keywordRegex } },
        { tags: { $in: topicKeywords.map(k => new RegExp(k, 'i')) } }
      ]
    })
    .select('title slug description category tags readTime createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 2) // Get more to filter better matches
    .lean();

    const results = blogs.map(blog => ({
      title: blog.title,
      slug: blog.slug,
      description: blog.description,
      category: blog.category,
      readTime: blog.readTime,
      relevanceScore: calculateRelevanceScore(blog, topicKeywords)
    }))
    .filter(blog => blog.relevanceScore > 0.3) // Filter out weak matches
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in searchRelatedBlogs:', error);
    return NextResponse.json({ error: 'Related blog search failed' }, { status: 500 });
  }
}

async function getBlogsByTags({ tags, limit = 5 }: { tags: string[], limit?: number }) {
  try {
    const blogs = await BlogPost.find({
      status: 'published',
      tags: { $in: tags.map(tag => new RegExp(tag, 'i')) }
    })
    .select('title slug description category tags readTime createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    const results = blogs.map(blog => ({
      title: blog.title,
      slug: blog.slug,
      description: blog.description,
      category: blog.category,
      readTime: blog.readTime,
      tags: blog.tags,
      relevanceScore: calculateTagRelevanceScore(blog.tags, tags)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in getBlogsByTags:', error);
    return NextResponse.json({ error: 'Tag search failed' }, { status: 500 });
  }
}

function calculateRelevanceScore(blog: any, keywords: string[]): number {
  let score = 0;
  const titleLower = blog.title.toLowerCase();
  const descriptionLower = blog.description?.toLowerCase() || '';
  const tagsLower = blog.tags?.map((t: string) => t.toLowerCase()) || [];

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    // Title matches are highest priority
    if (titleLower.includes(keywordLower)) {
      score += 0.4;
    }
    
    // Description matches are medium priority
    if (descriptionLower.includes(keywordLower)) {
      score += 0.2;
    }
    
    // Tag matches are high priority
    if (tagsLower.some((tag: string) => tag.includes(keywordLower))) {
      score += 0.3;
    }
  });

  return Math.min(score, 1.0); // Cap at 1.0
}

function calculateTagRelevanceScore(blogTags: string[], searchTags: string[]): number {
  const matchingTags = blogTags.filter(blogTag => 
    searchTags.some(searchTag => 
      blogTag.toLowerCase().includes(searchTag.toLowerCase())
    )
  );
  
  return matchingTags.length / searchTags.length;
}