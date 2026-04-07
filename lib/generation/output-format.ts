/**
 * Blog post JSON output format specification
 * Used in the unified generation agent's system prompt to define the expected structure
 */

export const outputJsonFormat = `{
  "blogPost": {
    "title": "Compelling, SEO-optimized blog post title",
    "description": "Engaging 1-2 sentence description for SEO and social sharing",
    "category": "Appropriate category (e.g., Productivity, Technology, Health, etc.)",
    "readTime": 8,
    "seoTitle": "SEO optimized title (50-60 characters)",
    "seoDescription": "SEO meta description (150-160 characters)",
    "tags": ["tag1", "tag2", "tag3"],
    "featuredImage": "URL of the featured image (from generateImage tool)",
    "featuredImageThumbnail": "Thumbnail URL (from generateImage tool)"
  },
  "components": [
    {
      "type": "rich_text",
      "order": 0,
      "content": "markdown content here - ## or ### headers, lists, bold, italic. Do NOT include H1 title. Do NOT include code blocks (use code_block component)."
    },
    {
      "type": "image",
      "order": 1,
      "alt": "descriptive alt text",
      "caption": "Optional caption",
      "url": "URL from generateImage tool",
      "thumbnailUrl": "Thumbnail URL from generateImage tool"
    },
    {
      "type": "callout",
      "order": 2,
      "variant": "info | success | warning | error",
      "title": "Callout title",
      "content": "markdown content"
    },
    {
      "type": "quote",
      "order": 3,
      "content": "The quote text",
      "author": "Author name",
      "citation": "Source (optional)"
    },
    {
      "type": "cta",
      "order": 4,
      "title": "CTA title",
      "content": "CTA description",
      "text": "Button text",
      "link": "URL",
      "style": "primary | secondary | outline"
    },
    {
      "type": "table",
      "order": 5,
      "headers": ["Col 1", "Col 2"],
      "rows": [["R1C1", "R1C2"]],
      "tableCaption": "Table description",
      "tableStyle": "comparison | data | pricing"
    },
    {
      "type": "bar_chart | line_chart | pie_chart",
      "order": 6,
      "data": { "title": "...", "description": "...", "chartData": [{"name": "...", "value": 0}] }
    },
    {
      "type": "comparison_table",
      "order": 7,
      "data": { "title": "...", "columns": [{"name": "..."}], "rows": [[]] }
    },
    {
      "type": "pros_cons",
      "order": 8,
      "data": { "title": "...", "comparison": [{"name": "...", "pros": [], "cons": []}] }
    },
    {
      "type": "timeline",
      "order": 9,
      "data": { "title": "...", "events": [{"title": "...", "description": "...", "date": "..."}] }
    },
    {
      "type": "step_by_step",
      "order": 10,
      "data": { "title": "...", "steps": [{"title": "...", "description": "..."}] }
    },
    {
      "type": "code_block",
      "order": 11,
      "content": "code here",
      "metadata": { "language": "javascript", "title": "Optional title" }
    }
  ]
}`;
