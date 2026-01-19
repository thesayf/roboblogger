# MongoDB Atlas Vector Search Setup

This guide explains how to set up vector search indexes for the SEO topic research feature.

## Prerequisites

- MongoDB Atlas M10 tier or higher (vector search requires Atlas, not self-hosted MongoDB)
- Your cluster must be running MongoDB 6.0.11+ or 7.0.2+

## Create Vector Search Indexes

You need to create two vector search indexes: one for `blogposts` and one for `topics`.

### Option 1: Using Atlas UI

1. Go to your MongoDB Atlas cluster
2. Click on **Atlas Search** tab
3. Click **Create Search Index**
4. Select **JSON Editor**
5. Create the following indexes:

#### BlogPosts Index

**Index Name:** `blog_post_embeddings`
**Collection:** `blogposts`

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "document",
        "fields": {
          "vector": {
            "dimensions": 1536,
            "similarity": "cosine",
            "type": "knnVector"
          }
        }
      }
    }
  }
}
```

#### Topics Index

**Index Name:** `topic_embeddings`
**Collection:** `topics`

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "document",
        "fields": {
          "vector": {
            "dimensions": 1536,
            "similarity": "cosine",
            "type": "knnVector"
          }
        }
      }
    }
  }
}
```

### Option 2: Using MongoDB Shell (mongosh)

Connect to your Atlas cluster and run:

```javascript
// Create BlogPosts vector index
db.blogposts.createSearchIndex({
  name: "blog_post_embeddings",
  definition: {
    mappings: {
      dynamic: true,
      fields: {
        embedding: {
          type: "document",
          fields: {
            vector: {
              dimensions: 1536,
              similarity: "cosine",
              type: "knnVector"
            }
          }
        }
      }
    }
  }
});

// Create Topics vector index
db.topics.createSearchIndex({
  name: "topic_embeddings",
  definition: {
    mappings: {
      dynamic: true,
      fields: {
        embedding: {
          type: "document",
          fields: {
            vector: {
              dimensions: 1536,
              similarity: "cosine",
              type: "knnVector"
            }
          }
        }
      }
    }
  }
});
```

## Verify Index Creation

After creating the indexes, they may take a few minutes to build. You can check the status:

1. In Atlas UI: Go to **Atlas Search** tab and check the index status
2. In mongosh: `db.blogposts.getSearchIndexes()` and `db.topics.getSearchIndexes()`

The status should show "READY" when the indexes are built.

## Backfill Existing Data

After creating the indexes, run the backfill script to generate embeddings for existing posts:

```bash
npm run backfill:embeddings
```

This will:
1. Find all BlogPosts without embeddings
2. Find all completed Topics without embeddings
3. Generate OpenAI embeddings for each
4. Save them to the database

## Troubleshooting

### "Index not found" errors
- Make sure the index names match: `blog_post_embeddings` and `topic_embeddings`
- Ensure you're using the `embedding.vector` field path (not just `embedding`)

### Empty search results
- Run the backfill script to ensure documents have embeddings
- Check that the embedding dimension (1536) matches your OpenAI model

### Search takes too long
- Vector search indexes can take several minutes to build initially
- Large collections may take longer to index

## Cost Considerations

- Vector search queries consume Atlas Search resources
- OpenAI embedding generation costs approximately $0.02 per 1M tokens
- Average blog post embedding: ~500-1000 tokens

## Field Mapping

The embedding field structure:

```typescript
embedding: {
  vector: number[];      // 1536-dimensional vector
  model: string;         // "text-embedding-3-small"
  generatedAt: Date;     // When embedding was generated
}
```

The vector search queries use the `embedding.vector` field path.
