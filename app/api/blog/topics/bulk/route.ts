import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering to prevent Clerk auth issues during build
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongo';
import Topic from '@/models/Topic';

export const maxDuration = 300;

// POST /api/blog/topics/bulk - Import multiple topics from JSON
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    await dbConnect();

    const body = await request.json();
    const { topics, defaultSettings } = body;

    // Validate input
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { message: 'Topics array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (topics.length > 50) {
      return NextResponse.json(
        { message: 'Maximum 50 topics allowed per bulk import' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[]
    };

    const createdTopics = [];

    // Process each topic
    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i];
      
      try {
        // Validate required fields
        if (!topicData.topic || typeof topicData.topic !== 'string') {
          results.failed++;
          results.errors.push(`Topic ${i + 1}: 'topic' field is required and must be a string`);
          continue;
        }

        // Merge with default settings if provided
        const finalTopicData = {
          // Default values
          audience: '',
          tone: 'Professional but approachable',
          length: 'Medium (800-1200 words)',
          includeImages: true,
          includeCallouts: true,
          includeCTA: true,
          priority: 'medium',
          tags: [],
          
          // Apply default settings
          ...defaultSettings,
          
          // Apply individual topic data (highest priority)
          ...topicData,
          
          // System fields (cannot be overridden)
          createdBy: userId || 'anonymous',
          status: 'pending',
          retryCount: 0,
          source: 'bulk'
        };

        // Create and save the topic
        const topic = new Topic(finalTopicData);
        await topic.save();
        
        createdTopics.push(topic);
        results.created++;

      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.errors.push(`Topic ${i + 1}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      message: `Bulk import completed. Created ${results.created}, Failed ${results.failed}`,
      results,
      createdTopics
    }, { 
      status: results.created > 0 ? 201 : 400 
    });

  } catch (error) {
    console.error('Error in bulk topic import:', error);
    return NextResponse.json(
      { message: 'Failed to import topics', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET /api/blog/topics/bulk - Get bulk import template and examples
export async function GET() {
  const template = {
    defaultSettings: {
      audience: "Working professionals and entrepreneurs",
      tone: "Professional but approachable", 
      length: "Medium (800-1200 words)",
      includeImages: true,
      includeCallouts: true,
      includeCTA: true,
      priority: "medium",
      imageContext: "Modern, clean design with professional business aesthetic. Use blue and white color scheme with minimalist styling.",
      tags: ["business", "productivity"]
    },
    topics: [
      {
        topic: "The Psychology of Remote Work: Maintaining Productivity and Mental Health",
        audience: "Remote workers and team managers",
        additionalRequirements: "Include statistics about remote work trends and practical tips for home office setup",
        priority: "high",
        tags: ["remote-work", "psychology", "productivity"]
      },
      {
        topic: "Building Sustainable Business Practices in the Digital Age",
        tone: "Authoritative yet accessible",
        additionalRequirements: "Focus on actionable steps companies can take, include case studies",
        tags: ["sustainability", "business-strategy"]
      },
      {
        topic: "The Future of AI in Customer Service: Opportunities and Challenges",
        length: "Long (1200-1500 words)",
        includeCallouts: true,
        additionalRequirements: "Include both technical insights and practical business implications",
        priority: "high",
        tags: ["ai", "customer-service", "technology"]
      }
    ]
  };

  const instructions = {
    format: "JSON object with 'defaultSettings' and 'topics' arrays",
    requiredFields: ["topic"],
    optionalFields: [
      "audience", "tone", "length", "includeImages", "includeCallouts", 
      "includeCTA", "additionalRequirements", "imageContext", "referenceImages",
      "priority", "tags", "notes", "scheduledAt"
    ],
    limits: {
      maxTopics: 50,
      maxTopicLength: 500,
      maxNotesLength: 2000,
      maxTagsPerTopic: 10
    },
    examples: {
      priorities: ["low", "medium", "high"],
      lengths: ["Short (400-600 words)", "Medium (800-1200 words)", "Long (1200-1500 words)"],
      tones: ["Professional", "Casual", "Technical", "Friendly", "Authoritative"]
    }
  };

  return NextResponse.json({
    template,
    instructions
  });
}