// Types for API responses
export interface BlogPost {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  featuredImage?: string;
  featuredImageThumbnail?: string;
  category?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  readTime?: number;
  views: number;
  author: {
    _id: string;
    name?: string;
    email?: string;
    imageUrl?: string;
  };
  components: BlogComponent[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogComponent {
  _id: string;
  blogPost: string;
  type: "rich_text" | "image" | "callout" | "quote" | "cta" | "video";
  order: number;

  // Rich Text Component
  content?: string;

  // Image Component
  src?: string; // Legacy field for backwards compatibility
  url?: string; // New primary image URL from ImageKit
  alt?: string;
  caption?: string;
  // Direct ImageKit fields (from auto-upload)
  fileId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  // Legacy ImageKit metadata
  imageKit?: {
    fileId?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };

  // Callout Component
  variant?: "info" | "success" | "warning" | "error";
  title?: string;

  // Quote Component
  author?: string;
  citation?: string;

  // CTA Component
  text?: string;
  link?: string;
  style?: "primary" | "secondary" | "outline";

  // Video Component
  videoUrl?: string;
  thumbnail?: string;
  videoTitle?: string;

  createdAt: Date;
  updatedAt: Date;
}

// API Functions
export const blogApi = {
  // Blog Posts
  async createPost(
    postData: Partial<BlogPost>,
    clerkId: string
  ): Promise<BlogPost> {
    const response = await fetch(`/api/blog/posts?clerkId=${clerkId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create post");
    }

    return response.json();
  },

  async updatePost(
    postId: string,
    postData: Partial<BlogPost>,
    clerkId: string
  ): Promise<BlogPost> {
    const response = await fetch(
      `/api/blog/posts/${postId}?clerkId=${clerkId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update post");
    }

    return response.json();
  },

  async getPost(postId: string, clerkId?: string): Promise<BlogPost> {
    const url = clerkId
      ? `/api/blog/posts/${postId}?clerkId=${clerkId}`
      : `/api/blog/posts/${postId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch post");
    }

    return response.json();
  },

  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await fetch(`/api/blog/posts/slug/${slug}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch post");
    }

    return response.json();
  },

  async deletePost(postId: string, clerkId: string): Promise<void> {
    const response = await fetch(
      `/api/blog/posts/${postId}?clerkId=${clerkId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete post");
    }
  },

  async getPosts(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    clerkId?: string;
  }): Promise<{ posts: BlogPost[]; pagination: any }> {
    const searchParams = new URLSearchParams();

    if (params?.clerkId) searchParams.append("clerkId", params.clerkId);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const response = await fetch(`/api/blog/posts?${searchParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch posts");
    }

    return response.json();
  },

  // Blog Components
  async createComponent(
    componentData: Partial<BlogComponent>,
    clerkId: string
  ): Promise<BlogComponent> {
    const response = await fetch(`/api/blog/components?clerkId=${clerkId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(componentData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Component creation failed:", error);
      throw new Error(error.details || error.error || "Failed to create component");
    }

    return response.json();
  },

  async updateComponent(
    componentId: string,
    componentData: Partial<BlogComponent>,
    clerkId: string
  ): Promise<BlogComponent> {
    const response = await fetch(
      `/api/blog/components/${componentId}?clerkId=${clerkId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(componentData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update component");
    }

    return response.json();
  },

  async deleteComponent(componentId: string, clerkId: string): Promise<void> {
    const response = await fetch(
      `/api/blog/components/${componentId}?clerkId=${clerkId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete component");
    }
  },

  async reorderComponents(
    blogPostId: string,
    componentOrders: { componentId: string; order: number }[],
    clerkId: string
  ): Promise<BlogComponent[]> {
    const response = await fetch(
      `/api/blog/components/reorder?clerkId=${clerkId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogPostId,
          componentOrders,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to reorder components");
    }

    const result = await response.json();
    return result.components;
  },
};

// Utility function to generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
};
