/**
 * Backfill Embeddings Script
 *
 * This script generates vector embeddings for existing BlogPosts and Topics
 * that don't have embeddings yet. Run this after setting up the embedding service.
 *
 * Usage:
 *   npx ts-node scripts/backfill-embeddings.ts
 *
 * Or with environment variables:
 *   MONGODB_URI=your_uri OPENAI_API_KEY=your_key npx ts-node scripts/backfill-embeddings.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models and embedding service
import BlogPost from '../models/BlogPost';
import Topic from '../models/Topic';
import {
  generateEmbedding,
  createPostEmbeddingText,
  createTopicEmbeddingText,
  EMBEDDING_MODEL,
} from '../lib/embeddings/embedding-service';

const BATCH_SIZE = 10; // Process in batches to avoid rate limits
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillBlogPosts(): Promise<{ processed: number; errors: number }> {
  console.log('\n📝 Backfilling BlogPost embeddings...');

  // Find posts without embeddings
  const postsWithoutEmbeddings = await BlogPost.find({
    $or: [
      { embedding: { $exists: false } },
      { 'embedding.vector': { $exists: false } },
      { 'embedding.vector': { $size: 0 } }
    ]
  }).select('_id title description seoDescription tags');

  console.log(`   Found ${postsWithoutEmbeddings.length} posts without embeddings`);

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < postsWithoutEmbeddings.length; i += BATCH_SIZE) {
    const batch = postsWithoutEmbeddings.slice(i, i + BATCH_SIZE);

    console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(postsWithoutEmbeddings.length / BATCH_SIZE)}...`);

    for (const post of batch) {
      try {
        // Create text for embedding
        const text = createPostEmbeddingText({
          title: post.title,
          content: post.description, // description serves as content summary
          seo: {
            metaDescription: post.seoDescription,
          },
          tags: post.tags,
        });

        // Generate embedding
        const vector = await generateEmbedding(text);

        // Update the post
        await BlogPost.updateOne(
          { _id: post._id },
          {
            $set: {
              embedding: {
                vector,
                model: EMBEDDING_MODEL,
                generatedAt: new Date(),
              }
            }
          }
        );

        processed++;
        console.log(`   ✓ Processed post: ${post.title.substring(0, 50)}...`);
      } catch (error) {
        errors++;
        console.error(`   ✗ Error processing post ${post._id}:`, error instanceof Error ? error.message : error);
      }
    }

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < postsWithoutEmbeddings.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  return { processed, errors };
}

async function backfillTopics(): Promise<{ processed: number; errors: number }> {
  console.log('\n📋 Backfilling Topic embeddings...');

  // Find topics without embeddings (only completed ones to avoid embedding incomplete topics)
  const topicsWithoutEmbeddings = await Topic.find({
    status: 'completed',
    $or: [
      { embedding: { $exists: false } },
      { 'embedding.vector': { $exists: false } },
      { 'embedding.vector': { $size: 0 } }
    ]
  }).select('_id topic audience additionalRequirements seo');

  console.log(`   Found ${topicsWithoutEmbeddings.length} completed topics without embeddings`);

  let processed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < topicsWithoutEmbeddings.length; i += BATCH_SIZE) {
    const batch = topicsWithoutEmbeddings.slice(i, i + BATCH_SIZE);

    console.log(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(topicsWithoutEmbeddings.length / BATCH_SIZE)}...`);

    for (const topic of batch) {
      try {
        // Create text for embedding
        const text = createTopicEmbeddingText({
          topic: topic.topic,
          audience: topic.audience,
          additionalRequirements: topic.additionalRequirements,
          seo: topic.seo ? {
            primaryKeyword: topic.seo.primaryKeyword,
            secondaryKeywords: topic.seo.secondaryKeywords,
          } : undefined,
        });

        // Generate embedding
        const vector = await generateEmbedding(text);

        // Update the topic
        await Topic.updateOne(
          { _id: topic._id },
          {
            $set: {
              embedding: {
                vector,
                model: EMBEDDING_MODEL,
                generatedAt: new Date(),
              }
            }
          }
        );

        processed++;
        console.log(`   ✓ Processed topic: ${topic.topic.substring(0, 50)}...`);
      } catch (error) {
        errors++;
        console.error(`   ✗ Error processing topic ${topic._id}:`, error instanceof Error ? error.message : error);
      }
    }

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < topicsWithoutEmbeddings.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  return { processed, errors };
}

async function main() {
  console.log('🚀 Starting embedding backfill process...');
  console.log(`   Using model: ${EMBEDDING_MODEL}`);

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }

  try {
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('   Connected successfully');

    // Backfill blog posts
    const postResults = await backfillBlogPosts();

    // Backfill topics
    const topicResults = await backfillTopics();

    // Summary
    console.log('\n📊 Backfill Summary:');
    console.log('   Blog Posts:');
    console.log(`     - Processed: ${postResults.processed}`);
    console.log(`     - Errors: ${postResults.errors}`);
    console.log('   Topics:');
    console.log(`     - Processed: ${topicResults.processed}`);
    console.log(`     - Errors: ${topicResults.errors}`);

    if (postResults.errors > 0 || topicResults.errors > 0) {
      console.log('\n⚠️  Some items failed to process. Check the errors above.');
    } else {
      console.log('\n✅ All embeddings generated successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
main();
