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

// Define schemas inline to avoid import issues
const BlogPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  slug: String,
  featuredImage: String,
  featuredImageThumbnail: String,
  category: String,
  status: String,
  publishedAt: Date,
  readTime: Number,
  views: Number,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  components: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogComponent' }],
  tags: [String],
  seoTitle: String,
  seoDescription: String,
}, { timestamps: true });

const BlogComponentSchema = new mongoose.Schema({
  blogPost: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' },
  type: String,
  order: Number,
  content: String,
  url: String,
  src: String,
  alt: String,
  caption: String,
  variant: String,
  title: String,
  author: String,
  citation: String,
  text: String,
  link: String,
  style: String,
  videoUrl: String,
  thumbnail: String,
  videoTitle: String,
  headers: [String],
  rows: [[String]],
  tableCaption: String,
  tableStyle: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
const BlogComponent = mongoose.models.BlogComponent || mongoose.model('BlogComponent', BlogComponentSchema);

async function analyzeBlogContent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all blog posts
    const posts = await BlogPost.find({})
      .populate('components')
      .sort({ createdAt: -1 });

    console.log('\n=== BLOG CONTENT ANALYSIS ===\n');
    console.log(`Total blog posts: ${posts.length}`);

    // Analyze by status
    const statusCounts = {
      draft: 0,
      published: 0,
      archived: 0
    };

    posts.forEach(post => {
      statusCounts[post.status]++;
    });

    console.log('\n--- Post Status Distribution ---');
    console.log(`Published: ${statusCounts.published}`);
    console.log(`Draft: ${statusCounts.draft}`);
    console.log(`Archived: ${statusCounts.archived}`);

    // Analyze published posts only
    const publishedPosts = posts.filter(post => post.status === 'published');
    console.log(`\n--- Published Posts Analysis (${publishedPosts.length} posts) ---`);

    if (publishedPosts.length > 0) {
      // Content quality metrics
      let totalWordCount = 0;
      let postsWithDescription = 0;
      let postsWithSEO = 0;
      let postsWithImages = 0;
      let postsWithMultipleComponents = 0;
      const componentTypeCounts = {};
      const categories = {};
      const tagCounts = {};

      publishedPosts.forEach(post => {
        // Check for description
        if (post.description && post.description.length > 0) {
          postsWithDescription++;
        }

        // Check for SEO optimization
        if (post.seoTitle || post.seoDescription) {
          postsWithSEO++;
        }

        // Check for featured image
        if (post.featuredImage) {
          postsWithImages++;
        }

        // Analyze components
        if (post.components && post.components.length > 3) {
          postsWithMultipleComponents++;
        }

        // Count component types
        if (post.components) {
          post.components.forEach(comp => {
            componentTypeCounts[comp.type] = (componentTypeCounts[comp.type] || 0) + 1;
            
            // Estimate word count from rich_text components
            if (comp.type === 'rich_text' && comp.content) {
              const wordCount = comp.content.split(/\s+/).filter(word => word.length > 0).length;
              totalWordCount += wordCount;
            }
          });
        }

        // Count categories
        if (post.category) {
          categories[post.category] = (categories[post.category] || 0) + 1;
        }

        // Count tags
        if (post.tags && post.tags.length > 0) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const avgWordCount = publishedPosts.length > 0 ? Math.round(totalWordCount / publishedPosts.length) : 0;

      console.log(`\nContent Quality Metrics:`);
      console.log(`- Average word count per post: ${avgWordCount}`);
      console.log(`- Posts with descriptions: ${postsWithDescription} (${Math.round(postsWithDescription / publishedPosts.length * 100)}%)`);
      console.log(`- Posts with SEO optimization: ${postsWithSEO} (${Math.round(postsWithSEO / publishedPosts.length * 100)}%)`);
      console.log(`- Posts with featured images: ${postsWithImages} (${Math.round(postsWithImages / publishedPosts.length * 100)}%)`);
      console.log(`- Posts with >3 components: ${postsWithMultipleComponents} (${Math.round(postsWithMultipleComponents / publishedPosts.length * 100)}%)`);

      console.log(`\nComponent Types Usage:`);
      Object.entries(componentTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`- ${type}: ${count}`);
        });

      console.log(`\nCategories (${Object.keys(categories).length} unique):`);
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([category, count]) => {
          console.log(`- ${category}: ${count} posts`);
        });

      console.log(`\nTop Tags (${Object.keys(tagCounts).length} unique):`);
      Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([tag, count]) => {
          console.log(`- ${tag}: ${count} posts`);
        });

      // Sample some actual content
      console.log(`\n--- Sample Blog Posts (Latest 5) ---`);
      publishedPosts.slice(0, 5).forEach((post, index) => {
        console.log(`\n${index + 1}. "${post.title}"`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Category: ${post.category || 'None'}`);
        console.log(`   Published: ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}`);
        console.log(`   Components: ${post.components ? post.components.length : 0}`);
        console.log(`   Tags: ${post.tags && post.tags.length > 0 ? post.tags.join(', ') : 'None'}`);
        console.log(`   SEO Title: ${post.seoTitle || 'Not set'}`);
        console.log(`   SEO Description: ${post.seoDescription ? post.seoDescription.substring(0, 100) + '...' : 'Not set'}`);
        
        if (post.description) {
          console.log(`   Description: ${post.description.substring(0, 150)}...`);
        }
      });

      // Technical SEO Assessment
      console.log(`\n--- Technical SEO Assessment ---`);
      const seoIssues = [];
      
      publishedPosts.forEach(post => {
        const postIssues = [];
        
        if (!post.seoTitle) postIssues.push('Missing SEO title');
        if (!post.seoDescription) postIssues.push('Missing SEO description');
        if (!post.description) postIssues.push('Missing post description');
        if (!post.featuredImage) postIssues.push('Missing featured image');
        if (!post.tags || post.tags.length === 0) postIssues.push('No tags');
        if (!post.category) postIssues.push('No category assigned');
        
        if (postIssues.length > 0) {
          seoIssues.push({
            title: post.title,
            slug: post.slug,
            issues: postIssues
          });
        }
      });

      console.log(`Posts with SEO issues: ${seoIssues.length} out of ${publishedPosts.length}`);
      if (seoIssues.length > 0) {
        console.log(`\nTop 5 posts needing SEO improvements:`);
        seoIssues.slice(0, 5).forEach((post, index) => {
          console.log(`${index + 1}. "${post.title}" (${post.slug})`);
          post.issues.forEach(issue => console.log(`   - ${issue}`));
        });
      }
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\nAnalysis complete. Connection closed.');

  } catch (error) {
    console.error('Error analyzing blog content:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the analysis
analyzeBlogContent();