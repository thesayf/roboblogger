"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Sparkles,
  Code,
} from "lucide-react";

interface PostsTabProps {
  blogPosts: any[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  handleEditPost: (id: string) => void;
  handleDeletePost: (id: string) => void;
  refreshPosts: () => void;
}

export function PostsTab({
  blogPosts,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  handleEditPost,
  handleDeletePost,
  refreshPosts,
}: PostsTabProps) {
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPostThumbnail = (post: any) => {
    const imageComponent = post.components?.find(
      (c: any) => c.type === "image"
    );
    return imageComponent?.content?.url;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Blog Posts</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                  <DialogDescription>
                    {`Choose how you'd like to create your new blog post`}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <Card
                    className="cursor-pointer hover:bg-blue-50 border-blue-200"
                    onClick={() => {
                      setShowNewPostDialog(false);
                      window.location.href = "/blog/admin/ai";
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Sparkles className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Generate with AI
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Enter a topic and let AI create a complete blog
                            structure
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          Recommended
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:bg-green-50 border-green-200"
                    onClick={() => {
                      setShowNewPostDialog(false);
                      window.location.href = "/blog/admin/manual";
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          <Edit className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Manual Editor
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Build your post component by component with full
                            control
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:bg-purple-50 border-purple-200"
                    onClick={() => {
                      setShowNewPostDialog(false);
                      window.location.href = "/blog/admin/import";
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Code className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Import JSON
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Paste a JSON structure to quickly create a post
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading posts...</span>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No blog posts found.</p>
            <Button className="mt-4" onClick={() => setShowNewPostDialog(true)}>
              Create your first post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post: any) => (
              <div
                key={post._id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleEditPost(post._id)}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {getPostThumbnail(post) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getPostThumbnail(post)}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {post.description || "No description available"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      {formatDate(post.updatedAt || post.createdAt)}
                    </span>
                    <span>{post.components?.length || 0} components</span>
                    <span>by {post.author?.name || "Anonymous"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      post.status === "published" ? "default" : "secondary"
                    }
                    className={
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {post.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPost(post._id);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}