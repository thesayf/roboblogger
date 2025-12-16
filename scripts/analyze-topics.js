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

async function analyzeTopics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check topics collection
    const topicsCount = await mongoose.connection.db.collection('topics').countDocuments();
    console.log('\n=== TOPICS ANALYSIS ===');
    console.log(`Total topics in database: ${topicsCount}`);
    
    if (topicsCount > 0) {
      // Get topic status breakdown
      const statusBreakdown = await mongoose.connection.db.collection('topics').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray();
      
      console.log('\nTopic status breakdown:');
      statusBreakdown.forEach(item => {
        console.log(`- ${item._id}: ${item.count}`);
      });
      
      // Get priority breakdown
      const priorityBreakdown = await mongoose.connection.db.collection('topics').aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]).toArray();
      
      console.log('\nTopic priority breakdown:');
      priorityBreakdown.forEach(item => {
        console.log(`- ${item._id}: ${item.count}`);
      });
      
      // Get sample topics
      const sampleTopics = await mongoose.connection.db.collection('topics').find({}).limit(10).toArray();
      console.log('\nSample topics:');
      sampleTopics.forEach((topic, i) => {
        console.log(`\n${i + 1}. Topic: ${topic.topic}`);
        console.log(`   Status: ${topic.status}`);
        console.log(`   Priority: ${topic.priority}`);
        console.log(`   Source: ${topic.source}`);
        console.log(`   SEO Primary Keyword: ${topic.seo?.primaryKeyword || 'Not set'}`);
        console.log(`   SEO Secondary Keywords: ${topic.seo?.secondaryKeywords?.join(', ') || 'None'}`);
        console.log(`   Search Intent: ${topic.seo?.searchIntent || 'Not set'}`);
        console.log(`   Created: ${topic.createdAt}`);
        if (topic.generatedPostId) {
          console.log(`   Generated Post ID: ${topic.generatedPostId}`);
        }
        if (topic.errorMessage) {
          console.log(`   Error: ${topic.errorMessage}`);
        }
      });
      
      // Check for topics with SEO optimization
      const topicsWithSEO = await mongoose.connection.db.collection('topics').countDocuments({
        'seo.primaryKeyword': { $exists: true, $ne: '' }
      });
      
      console.log(`\n--- SEO Analysis ---`);
      console.log(`Topics with primary keywords: ${topicsWithSEO} (${Math.round(topicsWithSEO / topicsCount * 100)}%)`);
      
      // Get topics ready for generation
      const pendingTopics = await mongoose.connection.db.collection('topics').find({
        status: 'pending',
        $or: [
          { scheduledAt: { $exists: false } },
          { scheduledAt: { $lte: new Date() } }
        ]
      }).limit(5).toArray();
      
      console.log(`\n--- Topics Ready for Generation ---`);
      console.log(`Found ${pendingTopics.length} topics ready for generation`);
      pendingTopics.forEach((topic, i) => {
        console.log(`${i + 1}. ${topic.topic} (Priority: ${topic.priority})`);
      });
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nAnalysis complete. Connection closed.');
    
  } catch (error) {
    console.error('Error analyzing topics:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the analysis
analyzeTopics();