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

// Define schemas
const BlogComponentSchema = new mongoose.Schema({
  blogPost: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' },
  type: String,
  order: Number,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const BlogPostSchema = new mongoose.Schema({
  title: String,
  slug: String,
  status: String,
  components: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogComponent' }],
}, { timestamps: true });

const BlogComponent = mongoose.models.BlogComponent || mongoose.model('BlogComponent', BlogComponentSchema);
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);

async function findSpecificComparison() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find pros_cons components with the specific title or description
    const prosConsComponents = await BlogComponent.find({
      type: 'pros_cons',
      $or: [
        { 'data.title': { $regex: /DIY.*Professional.*Installation/i } },
        { 'data.description': { $regex: /self-installation.*versus.*hiring.*professionals/i } }
      ]
    }).populate('blogPost', 'title slug status');

    console.log(`\nFound ${prosConsComponents.length} pros_cons components matching the criteria\n`);

    for (const table of prosConsComponents) {
      console.log('='.repeat(80));
      console.log(`Blog Post: ${table.blogPost?.title || 'Unknown'}`);
      console.log(`Blog Status: ${table.blogPost?.status || 'Unknown'}`);
      console.log(`Blog Slug: ${table.blogPost?.slug || 'Unknown'}`);
      console.log(`Component ID: ${table._id}`);
      console.log(`Component Order: ${table.order}`);
      console.log('\nFull Data Structure:');
      console.log(JSON.stringify(table.data, null, 2));
      console.log('='.repeat(80));
    }

    // Also search more broadly
    console.log('\n\nSearching for "7 Sustainable Home Improvements" blog post...\n');
    
    const sustainableBlog = await BlogPost.findOne({
      title: { $regex: /sustainable.*home.*improvements/i }
    }).populate('components');

    if (sustainableBlog) {
      console.log(`Found blog: "${sustainableBlog.title}"`);
      console.log(`Status: ${sustainableBlog.status}`);
      console.log(`Total components: ${sustainableBlog.components.length}\n`);

      // List all components with their types
      sustainableBlog.components.forEach((comp, index) => {
        console.log(`Component ${index + 1}:`);
        console.log(`  Type: ${comp.type}`);
        console.log(`  Order: ${comp.order}`);
        
        if (comp.type === 'comparison_table') {
          console.log('  >>> COMPARISON TABLE FOUND <<<');
          console.log(`  Has data field: ${!!comp.data}`);
          if (comp.data) {
            console.log(`  Title: ${comp.data.title || 'NO TITLE'}`);
            console.log(`  Description: ${comp.data.description || 'NO DESCRIPTION'}`);
            console.log(`  Full data:`);
            console.log(JSON.stringify(comp.data, null, 4));
          }
        }
        
        if (comp.type === 'pros_cons') {
          console.log('  >>> PROS_CONS FOUND <<<');
          console.log(`  Has data field: ${!!comp.data}`);
          if (comp.data) {
            console.log(`  Title: ${comp.data.title || 'NO TITLE'}`);
            console.log(`  Description: ${comp.data.description || 'NO DESCRIPTION'}`);
            console.log(`  Full data:`);
            console.log(JSON.stringify(comp.data, null, 4));
          }
        }
      });
    }

    await mongoose.connection.close();
    console.log('\nAnalysis complete.');

  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

findSpecificComparison();