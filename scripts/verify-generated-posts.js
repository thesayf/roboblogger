const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

async function verifyGeneratedPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all completed topics with generated post IDs
    const completedTopics = await mongoose.connection.db.collection('topics').find({
      status: 'completed',
      generatedPostId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`\n=== VERIFYING GENERATED POSTS ===`);
    console.log(`Found ${completedTopics.length} topics marked as completed with post IDs`);
    
    // Check each post ID
    let foundPosts = 0;
    let missingPosts = 0;
    
    for (const topic of completedTopics) {
      try {
        // Convert string ID to ObjectId
        const postId = new mongoose.Types.ObjectId(topic.generatedPostId);
        
        // Check if post exists
        const post = await mongoose.connection.db.collection('blogposts').findOne({ _id: postId });
        
        if (post) {
          foundPosts++;
          console.log(`\n✓ Found post for topic: "${topic.topic}"`);
          console.log(`  Post Title: ${post.title}`);
          console.log(`  Post Status: ${post.status}`);
          console.log(`  Components: ${post.components ? post.components.length : 0}`);
        } else {
          missingPosts++;
          console.log(`\n✗ Missing post for topic: "${topic.topic}"`);
          console.log(`  Expected Post ID: ${topic.generatedPostId}`);
        }
      } catch (error) {
        missingPosts++;
        console.log(`\n✗ Error checking post for topic: "${topic.topic}"`);
        console.log(`  Error: ${error.message}`);
      }
    }
    
    console.log(`\n--- SUMMARY ---`);
    console.log(`Total completed topics: ${completedTopics.length}`);
    console.log(`Posts found: ${foundPosts}`);
    console.log(`Posts missing: ${missingPosts}`);
    
    // Also check if there are any blog posts at all
    const totalPosts = await mongoose.connection.db.collection('blogposts').countDocuments();
    console.log(`\nTotal blog posts in database: ${totalPosts}`);
    
    if (totalPosts > 0) {
      const samplePosts = await mongoose.connection.db.collection('blogposts').find({}).limit(5).toArray();
      console.log(`\nSample blog posts:`);
      samplePosts.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title} (Status: ${post.status}, Created: ${post.createdAt})`);
      });
    }
    
    // Check for any errors in pending topics
    const failedTopics = await mongoose.connection.db.collection('topics').find({
      status: 'failed'
    }).toArray();
    
    if (failedTopics.length > 0) {
      console.log(`\n--- FAILED TOPICS ---`);
      console.log(`Found ${failedTopics.length} failed topics:`);
      failedTopics.forEach((topic, i) => {
        console.log(`\n${i + 1}. ${topic.topic}`);
        console.log(`   Error: ${topic.errorMessage || 'No error message'}`);
      });
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nVerification complete. Connection closed.');
    
  } catch (error) {
    console.error('Error verifying posts:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the verification
verifyGeneratedPosts();