"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/blogApi";
import {
  Brain,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ImageIcon,
  Upload,
  Eye,
  Copy,
  Sparkles,
  Code,
  ArrowLeft,
  Loader2,
  Clock,
  Calendar,
  PlayCircle,
  PauseCircle,
  FileText,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileUp,
  Type,
  Wand2,
  AlertCircle,
  MousePointer,
  RefreshCw,
  FileJson,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { SchedulerTab } from "./components/SchedulerTabNew";
import { localDateTimeToUTC, utcToLocalDateTime } from "@/lib/timezone-utils";

export default function BlogAdminClient() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("posts");
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostMethod, setNewPostMethod] = useState<
    "ai" | "manual" | "import" | null
  >(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBulkTopicsDialog, setShowBulkTopicsDialog] = useState(false);
  const [bulkTopicsInput, setBulkTopicsInput] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicStats, setTopicStats] = useState<any>({});
  const [showAddTopicDialog, setShowAddTopicDialog] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [showEditTopicDialog, setShowEditTopicDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Topic form state
  const [topicForm, setTopicForm] = useState({
    topic: "",
    audience: "",
    tone: "Professional but approachable",
    length: "Medium (800-1200 words)",
    includeImages: true,
    includeCallouts: true,
    includeCTA: true,
    additionalRequirements: "",
    brandContext: "",
    imageContext: "",
    referenceImages: [] as string[],
    scheduledAt: "",
    priority: "medium",
    tags: [] as string[],
    notes: "",
    estimatedDuration: 5,
    // SEO fields
    seo: {
      primaryKeyword: "",
      secondaryKeywords: [] as string[],
      longTailKeywords: [] as string[],
      lsiKeywords: [] as string[],
      searchIntent: "informational" as 'informational' | 'commercial' | 'navigational' | 'transactional',
      metaTitle: "",
      metaDescription: "",
      openGraph: {
        title: "",
        description: "",
        image: "",
        type: "article",
      },
      schemaType: "BlogPosting" as 'Article' | 'BlogPosting' | 'NewsArticle' | 'HowToArticle' | 'FAQPage',
      slug: "",
      canonicalUrl: "",
    }
  });
  const [selectedExistingImages, setSelectedExistingImages] = useState<
    string[]
  >([]);
  const [newReferenceImages, setNewReferenceImages] = useState<File[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  // SEO keyword inputs
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [newLongTailKeyword, setNewLongTailKeyword] = useState("");
  const [newLsiKeyword, setNewLsiKeyword] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [bulkUploadImages, setBulkUploadImages] = useState<File[]>([]);
  const [bulkInputMethod, setBulkInputMethod] = useState<"text" | "file">(
    "text"
  );
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [brandContext, setBrandContext] = useState("");
  const [brandExamplesFile, setBrandExamplesFile] = useState<File | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretedData, setInterpretedData] = useState<any>(null);
  const [showInterpretedPreview, setShowInterpretedPreview] = useState(false);
  const [selectedExistingImagesForBulk, setSelectedExistingImagesForBulk] =
    useState<string[]>([]);
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [queueTab, setQueueTab] = useState<"pending" | "completed">("pending");
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [pendingTopics, setPendingTopics] = useState<any[]>([]);
  const [completedTopics, setCompletedTopics] = useState<any[]>([]);
  const [pendingPagination, setPendingPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [completedPagination, setCompletedPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Fetch blog posts from API
  useEffect(() => {
    fetchBlogPosts();
  }, [statusFilter]);

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBlogPosts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch images when Images tab is selected
  useEffect(() => {
    if (selectedTab === "images") {
      fetchImages();
    }
  }, [selectedTab]);

  // Fetch topics when Queue tab is selected or pages change
  useEffect(() => {
    if (selectedTab === "queue") {
      fetchTopics();
    }
  }, [selectedTab, pendingPage, completedPage]);

  const fetchBlogPosts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/blog/posts?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setBlogPosts(data.posts || []);
      } else {
        console.error("Failed to fetch posts:", data.error);
        setBlogPosts([]);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      setBlogPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      setIsLoadingTopics(true);
      
      // Fetch all topics without pagination to get accurate counts and stats
      const allResponse = await fetch(`/api/blog/topics?limit=1000`);
      const allData = await allResponse.json();
      
      if (allResponse.ok) {
        const allTopics = allData.topics || [];
        
        // Filter topics by status
        const pendingAndFailedTopics = allTopics.filter((t: any) => t.status === "pending" || t.status === "failed");
        const completedTopicsAll = allTopics.filter((t: any) => t.status === "completed");
        
        // Sort by scheduledAt
        pendingAndFailedTopics.sort((a: any, b: any) => {
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        });
        
        completedTopicsAll.sort((a: any, b: any) => {
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        });
        
        // Calculate pagination
        const pendingStart = (pendingPage - 1) * 10;
        const pendingEnd = pendingStart + 10;
        const completedStart = (completedPage - 1) * 10;
        const completedEnd = completedStart + 10;
        
        // Set paginated topics
        setPendingTopics(pendingAndFailedTopics.slice(pendingStart, pendingEnd));
        setCompletedTopics(completedTopicsAll.slice(completedStart, completedEnd));
        
        // Update pagination
        setPendingPagination({
          page: pendingPage,
          limit: 10,
          total: pendingAndFailedTopics.length,
          pages: Math.ceil(pendingAndFailedTopics.length / 10)
        });
        
        setCompletedPagination({
          page: completedPage,
          limit: 10,
          total: completedTopicsAll.length,
          pages: Math.ceil(completedTopicsAll.length / 10)
        });
        
        // Set all topics for other parts of the app
        setTopics(allTopics);
        setTopicStats(allData.stats || {});
      } else {
        console.error("Failed to fetch topics");
        setPendingTopics([]);
        setCompletedTopics([]);
        setTopics([]);
        setTopicStats({});
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setPendingTopics([]);
      setCompletedTopics([]);
      setTopics([]);
      setTopicStats({});
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/blog/admin/manual?edit=${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(
        `/api/blog/posts/${postId}?clerkId=anonymous`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchBlogPosts(); // Refresh the list
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPostThumbnail = (post: any) => {
    // First, check if post has a featured image (prioritize thumbnail version)
    if (post.featuredImageThumbnail) {
      return post.featuredImageThumbnail;
    }
    if (post.featuredImage) {
      return post.featuredImage;
    }

    // If not, look for the first image component
    if (post.components && Array.isArray(post.components)) {
      const firstImage = post.components.find(
        (comp: any) => comp.type === "image" && (comp.url || comp.src)
      );
      if (firstImage) {
        return firstImage.thumbnailUrl || firstImage.url || firstImage.src;
      }
    }

    return null;
  };

  // Image management functions
  const fetchImages = async () => {
    try {
      setIsLoadingImages(true);

      const response = await fetch("/api/images");
      const data = await response.json();

      if (response.ok && data.success) {
        setImages(data.images || []);
      } else {
        console.error("Failed to fetch images:", data.error);
        setImages([]);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Add new image to the list
        const newImage = {
          fileId: result.fileId,
          name: result.name,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          size: result.size,
          width: result.width,
          height: result.height,
          format: result.format,
          createdAt: new Date().toISOString(),
        };

        setImages((prev) => [newImage, ...prev]);

        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // TODO: Add toast notification
    alert("Image URL copied to clipboard!");
  };

  const deleteImage = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch("/api/images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Remove from local state
        setImages((prev) => prev.filter((img) => img.fileId !== fileId));
        alert("Image deleted successfully!");
      } else {
        throw new Error(data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert(
        `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Topic management functions
  const handleGenerateTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/blog/topics/${topicId}/generate`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Blog post generated successfully! Post ID: ${result.blogPost._id}`
        );
        fetchTopics(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to generate blog post: ${error.message}`);
      }
    } catch (error) {
      console.error("Error generating topic:", error);
      alert("Error generating blog post");
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;

    try {
      const response = await fetch(`/api/blog/topics/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTopics(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to delete topic: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Error deleting topic");
    }
  };


  const handleEditTopic = (topic: any) => {
    setEditingTopic(topic);
    setTopicForm({
      topic: topic.topic || "",
      audience: topic.audience || "",
      tone: topic.tone || "Professional but approachable",
      length: topic.length || "Medium (800-1200 words)",
      includeImages:
        topic.includeImages !== undefined ? topic.includeImages : true,
      includeCallouts:
        topic.includeCallouts !== undefined ? topic.includeCallouts : true,
      includeCTA: topic.includeCTA !== undefined ? topic.includeCTA : true,
      additionalRequirements: topic.additionalRequirements || "",
      brandContext: topic.brandContext || "",
      imageContext: topic.imageContext || "",
      referenceImages: topic.referenceImages || [],
      priority: topic.priority || "medium",
      tags: topic.tags || [],
      notes: topic.notes || "",
      estimatedDuration: topic.estimatedDuration || 5,
      scheduledAt: topic.scheduledAt
        ? utcToLocalDateTime(topic.scheduledAt)
        : "",
      seo: {
        primaryKeyword: topic.seo?.primaryKeyword || "",
        secondaryKeywords: topic.seo?.secondaryKeywords || [],
        longTailKeywords: topic.seo?.longTailKeywords || [],
        lsiKeywords: topic.seo?.lsiKeywords || [],
        searchIntent: topic.seo?.searchIntent || "informational",
        metaTitle: topic.seo?.metaTitle || "",
        metaDescription: topic.seo?.metaDescription || "",
        openGraph: {
          title: topic.seo?.openGraph?.title || "",
          description: topic.seo?.openGraph?.description || "",
          image: topic.seo?.openGraph?.image || "",
          type: topic.seo?.openGraph?.type || "article",
        },
        schemaType: topic.seo?.schemaType || "BlogPosting",
        slug: topic.seo?.slug || "",
        canonicalUrl: topic.seo?.canonicalUrl || "",
      }
    });
    setSelectedExistingImages(topic.referenceImages || []);
    setShowEditTopicDialog(true);
  };

  const handleRescheduleTopic = async () => {
    if (!editingTopic || !topicForm.scheduledAt) return;
    
    // Prevent rescheduling published topics
    if (editingTopic.status === 'completed' || editingTopic.generatedPostId) {
      alert("Cannot reschedule published topics");
      return;
    }

    try {
      setIsUpdatingTopic(true);
      const response = await fetch(`/api/blog/topics/${editingTopic._id}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scheduledAt: topicForm.scheduledAt ? localDateTimeToUTC(topicForm.scheduledAt) : undefined
        }),
      });

      if (response.ok) {
        await fetchTopics();
        setShowEditTopicDialog(false);
        setEditingTopic(null);
        alert("Topic rescheduled successfully!");
      } else {
        const data = await response.json();
        alert(`Error rescheduling topic: ${data.error}`);
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      alert("Error rescheduling topic");
    } finally {
      setIsUpdatingTopic(false);
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic) return;

    setIsUpdatingTopic(true);
    try {
      const topicData = {
        ...topicForm,
        referenceImages: selectedExistingImages,
        tags: Array.isArray(topicForm.tags) ? topicForm.tags : [],
      };

      const response = await fetch(`/api/blog/topics/${editingTopic._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(topicData),
      });

      if (response.ok) {
        setShowEditTopicDialog(false);
        setEditingTopic(null);
        fetchTopics(); // Refresh the list
        alert("Topic updated successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to update topic: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating topic:", error);
      alert("Error updating topic");
    } finally {
      setIsUpdatingTopic(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "pending":
      default:
        return <Clock className="h-6 w-6 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "pending":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  // Slug generation helper
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
      .slice(0, 100); // Max length
  };

  // Generate slug from primary keyword or topic
  const updateSlug = () => {
    const source = topicForm.seo.primaryKeyword || topicForm.topic;
    if (source && !topicForm.seo.slug) {
      setTopicForm(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          slug: generateSlug(source)
        }
      }));
    }
  };

  // Topic form helpers
  const resetTopicForm = () => {
    setTopicForm({
      topic: "",
      audience: "",
      tone: "Professional but approachable",
      length: "Medium (800-1200 words)",
      includeImages: true,
      includeCallouts: true,
      includeCTA: true,
      additionalRequirements: "",
      brandContext: "",
      imageContext: "",
      priority: "medium",
      tags: [],
      notes: "",
      estimatedDuration: 5,
      scheduledAt: "",
      referenceImages: [],
      seo: {
        primaryKeyword: "",
        secondaryKeywords: [],
        longTailKeywords: [],
        lsiKeywords: [],
        searchIntent: "informational",
        metaTitle: "",
        metaDescription: "",
        openGraph: {
          title: "",
          description: "",
          image: "",
          type: "article",
        },
        schemaType: "BlogPosting",
        slug: "",
        canonicalUrl: "",
      }
    });
    setSelectedExistingImages([]);
    setNewReferenceImages([]);
    setNewTagInput("");
    // Clear SEO keyword inputs
    setNewSecondaryKeyword("");
    setNewLongTailKeyword("");
    setNewLsiKeyword("");
  };

  const addTag = () => {
    if (newTagInput.trim() && !topicForm.tags.includes(newTagInput.trim())) {
      setTopicForm((prev) => ({
        ...prev,
        tags: [...prev.tags, newTagInput.trim()],
      }));
      setNewTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTopicForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // SEO keyword management functions
  const addSecondaryKeyword = () => {
    if (newSecondaryKeyword.trim() && topicForm.seo.secondaryKeywords.length < 3) {
      setTopicForm((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          secondaryKeywords: [...prev.seo.secondaryKeywords, newSecondaryKeyword.trim()],
        }
      }));
      setNewSecondaryKeyword("");
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    setTopicForm((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        secondaryKeywords: prev.seo.secondaryKeywords.filter((k) => k !== keyword),
      }
    }));
  };

  const addLongTailKeyword = () => {
    if (newLongTailKeyword.trim() && topicForm.seo.longTailKeywords.length < 3) {
      setTopicForm((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          longTailKeywords: [...prev.seo.longTailKeywords, newLongTailKeyword.trim()],
        }
      }));
      setNewLongTailKeyword("");
    }
  };

  const removeLongTailKeyword = (keyword: string) => {
    setTopicForm((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        longTailKeywords: prev.seo.longTailKeywords.filter((k) => k !== keyword),
      }
    }));
  };

  const addLsiKeyword = () => {
    if (newLsiKeyword.trim() && topicForm.seo.lsiKeywords.length < 5) {
      setTopicForm((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          lsiKeywords: [...prev.seo.lsiKeywords, newLsiKeyword.trim()],
        }
      }));
      setNewLsiKeyword("");
    }
  };

  const removeLsiKeyword = (keyword: string) => {
    setTopicForm((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        lsiKeywords: prev.seo.lsiKeywords.filter((k) => k !== keyword),
      }
    }));
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedExistingImages((prev) =>
      prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleReferenceImageUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).slice(
        0,
        5 - newReferenceImages.length
      ); // Limit to 5 total
      setNewReferenceImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeReferenceImage = (index: number) => {
    setNewReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreateTopic = async () => {
    if (!topicForm.topic.trim()) {
      alert("Topic title is required");
      return;
    }

    try {
      setIsCreatingTopic(true);

      // Convert new reference images to base64
      const referenceImagesBase64 = await Promise.all(
        newReferenceImages.map((file) => convertImageToBase64(file))
      );

      // Combine existing image URLs and new base64 images
      const allReferenceImages = [
        ...selectedExistingImages,
        ...referenceImagesBase64,
      ];

      // Auto-generate meta data if not provided
      const seoData = { ...topicForm.seo };
      
      // Auto-generate meta title if empty
      if (!seoData.metaTitle && topicForm.topic) {
        // Take topic and add primary keyword if available
        const baseTitle = topicForm.topic.slice(0, 50);
        seoData.metaTitle = seoData.primaryKeyword 
          ? `${baseTitle} | ${seoData.primaryKeyword}`.slice(0, 60)
          : baseTitle;
      }
      
      // Auto-generate meta description if empty
      if (!seoData.metaDescription && topicForm.topic) {
        const keyword = seoData.primaryKeyword ? `${seoData.primaryKeyword}. ` : '';
        seoData.metaDescription = `${keyword}Learn about ${topicForm.topic.toLowerCase()}. ${topicForm.audience ? `Perfect for ${topicForm.audience}.` : ''}`.slice(0, 155);
      }
      
      // Use meta data for Open Graph if not specified
      if (!seoData.openGraph.title && seoData.metaTitle) {
        seoData.openGraph.title = seoData.metaTitle;
      }
      if (!seoData.openGraph.description && seoData.metaDescription) {
        seoData.openGraph.description = seoData.metaDescription;
      }
      
      // Auto-generate slug if not provided
      if (!seoData.slug) {
        const slugSource = seoData.primaryKeyword || topicForm.topic;
        seoData.slug = generateSlug(slugSource);
      }

      const topicData = {
        ...topicForm,
        seo: seoData,
        referenceImages: allReferenceImages,
        source: "individual",
        // Convert scheduledAt to UTC if provided
        scheduledAt: topicForm.scheduledAt
          ? localDateTimeToUTC(topicForm.scheduledAt)
          : undefined,
      };

      const response = await fetch("/api/blog/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(topicData),
      });

      if (response.ok) {
        const newTopic = await response.json();
        setTopics((prev) => [newTopic, ...prev]);
        resetTopicForm();
        setShowAddTopicDialog(false);
        await fetchTopics(); // Refresh to get updated stats
      } else {
        const error = await response.json();
        alert(`Failed to create topic: ${error.message}`);
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("Error creating topic");
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkTopicsInput.trim()) {
      alert("Please enter JSON data for bulk import");
      return;
    }

    try {
      setIsBulkImporting(true);

      // Parse the JSON input
      let topicsData;
      try {
        // Clean up common JSON issues
        let cleanedInput = bulkTopicsInput
          // Replace smart quotes with straight quotes
          .replace(/[\u201C\u201D]/g, '"')  // Replace " and "
          .replace(/[\u2018\u2019]/g, "'")  // Replace ' and '
          // Remove any zero-width spaces
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          // Remove any trailing commas before closing brackets/braces
          .replace(/,(\s*[}\]])/g, '$1')
          // Trim whitespace
          .trim();
          
        topicsData = JSON.parse(cleanedInput);
      } catch (parseError) {
        let errorMsg = "Invalid JSON format. ";
        if (bulkTopicsInput.includes('\u201C') || bulkTopicsInput.includes('\u201D') || bulkTopicsInput.includes('\u2018') || bulkTopicsInput.includes('\u2019')) {
          errorMsg += "Smart quotes detected - try copying from a plain text editor instead.";
        } else {
          errorMsg += "Please check for missing commas, brackets, or quotes.";
        }
        alert(errorMsg);
        return;
      }

      // Ensure the data has the expected structure
      if (!topicsData.topics || !Array.isArray(topicsData.topics)) {
        alert('JSON must have a "topics" array. Please check the format.');
        return;
      }

      // Process uploaded images and create reference map
      const imageReferenceMap: { [key: string]: string } = {};
      if (bulkUploadImages.length > 0) {
        for (let i = 0; i < bulkUploadImages.length; i++) {
          const file = bulkUploadImages[i];
          const base64 = await convertImageToBase64(file);
          // Create reference key based on filename (without extension)
          const referenceKey = file.name.split(".")[0];
          imageReferenceMap[referenceKey] = base64;
        }
      }

      // Read brand examples file if provided
      let brandExamplesText = "";
      if (brandExamplesFile) {
        try {
          brandExamplesText = await brandExamplesFile.text();
        } catch (error) {
          console.warn("Could not read brand examples file:", error);
        }
      }

      // Process topics and replace image references
      const processedTopics = topicsData.topics.map((topic: any) => {
        let processedTopic = { ...topic };

        // Add brand context to each topic
        if (brandContext || brandExamplesText) {
          processedTopic.brandContext = brandContext || "";
          processedTopic.brandExamples = brandExamplesText || "";
        }

        // Convert scheduled dates
        if (topic.scheduledAt) {
          processedTopic.scheduledAt = localDateTimeToUTC(topic.scheduledAt);
        }

        // Process referenceImages to replace file references with base64 and names with URLs
        if (topic.referenceImages && Array.isArray(topic.referenceImages)) {
          processedTopic.referenceImages = topic.referenceImages.map(
            (ref: string) => {
              // Check if this is a file reference (matches uploaded image name)
              const fileRef = Object.keys(imageReferenceMap).find((key) =>
                ref.includes(key)
              );
              if (fileRef) {
                return imageReferenceMap[fileRef];
              }

              // Check if this is an existing image name (convert to URL)
              const existingImage = images.find((img) => img.name === ref);
              if (existingImage) {
                return existingImage.url;
              }

              return ref; // Return as-is if not a file reference (could be URL or base64)
            }
          );
        }

        return processedTopic;
      });

      // Update the topicsData with processed topics
      const finalTopicsData = {
        ...topicsData,
        topics: processedTopics,
      };

      // Call the bulk import API (use main topics endpoint which handles Agenda jobs)
      const response = await fetch("/api/blog/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalTopicsData),
      });

      const result = await response.json();

      if (response.ok) {
        // Handle success case - main topics endpoint returns different format
        let message = `Bulk import completed! Created: ${result.count || result.topics?.length || 0} topics`;

        alert(message);

        // Clear form and refresh
        setBulkTopicsInput("");
        setBulkUploadImages([]);
        setSelectedExistingImagesForBulk([]);
        setShowImageSelection(false);
        setBrandContext("");
        setBrandExamplesFile(null);
        setBulkUploadFile(null);
        setShowBulkTopicsDialog(false);
        await fetchTopics(); // Refresh the list
      } else {
        alert(`Bulk import failed: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error in bulk import:", error);
      alert("Error during bulk import");
    } finally {
      setIsBulkImporting(false);
    }
  };

  const loadBulkTemplate = async () => {
    try {
      const response = await fetch("/api/blog/topics/bulk");
      if (response.ok) {
        const data = await response.json();
        setBulkTopicsInput(JSON.stringify(data.template, null, 2));
      }
    } catch (error) {
      console.error("Error loading template:", error);
    }
  };

  const handleInterpretInput = async () => {
    let inputToInterpret = "";

    if (bulkInputMethod === "text") {
      inputToInterpret = bulkTopicsInput;
    } else if (bulkUploadFile) {
      try {
        inputToInterpret = await bulkUploadFile.text();
      } catch (error) {
        alert("Error reading file content");
        return;
      }
    }

    if (!inputToInterpret.trim()) {
      alert("Please provide input to interpret");
      return;
    }

    try {
      setIsInterpreting(true);

      // Prepare image data for AI context
      const availableImages = selectedExistingImagesForBulk
        .map((url) => {
          const image = images.find((img) => img.url === url);
          return image
            ? {
                name: image.name,
                url: image.url,
                width: image.width,
                height: image.height,
              }
            : null;
        })
        .filter(Boolean);

      const uploadedImageNames = bulkUploadImages.map((file) => file.name);

      // Read brand examples file if provided
      let brandExamples = "";
      if (brandExamplesFile) {
        try {
          brandExamples = await brandExamplesFile.text();
        } catch (error) {
          console.warn("Could not read brand examples file:", error);
        }
      }

      const response = await fetch("/api/blog/topics/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: inputToInterpret,
          brandContext: brandContext.trim() || undefined,
          brandExamples: brandExamples.trim() || undefined,
          inputType: bulkInputMethod,
          availableImages,
          uploadedImages: uploadedImageNames,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInterpretedData(result.interpretedData);
        setShowInterpretedPreview(true);
        setCurrentStep("preview"); // Set step to preview topics
      } else {
        const error = await response.json();
        alert(`Failed to interpret input: ${error.message}`);
      }
    } catch (error) {
      console.error("Error interpreting input:", error);
      alert("Error interpreting input");
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleUseInterpretedData = () => {
    if (interpretedData) {
      setBulkTopicsInput(JSON.stringify(interpretedData, null, 2));
      setShowInterpretedPreview(false);
      setInterpretedData(null);
    }
  };

  const handleCreateTopicsFromAI = async () => {
    if (!interpretedData) return;

    setIsBulkImporting(true);
    try {
      // Read brand examples file if provided
      let brandExamplesText = "";
      if (brandExamplesFile) {
        try {
          brandExamplesText = await brandExamplesFile.text();
        } catch (error) {
          console.warn("Could not read brand examples file:", error);
        }
      }

      // Process topics and add brand context
      const processedTopics = interpretedData.topics.map((topic: any) => ({
        ...topic,
        // Add brand context to each topic
        brandContext: brandContext || "",
        brandExamples: brandExamplesText || "",
        // Convert scheduled dates
        scheduledAt: topic.scheduledAt
          ? localDateTimeToUTC(topic.scheduledAt)
          : undefined,
      }));

      // Create topics directly using main topics endpoint
      const response = await fetch("/api/blog/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topics: processedTopics }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Successfully created ${result.count || processedTopics.length} topics!`
        );

        // Reset form and close modal
        setBrandContext("");
        setBrandExamplesFile(null);
        setBulkUploadFile(null);
        setInterpretedData(null);
        setCurrentStep("form");
        setShowBulkTopicsDialog(false);
        await fetchTopics(); // Refresh the topics list
      } else {
        const error = await response.json();
        alert(`Failed to create topics: ${error.message}`);
      }
    } catch (error) {
      console.error("Error creating topics:", error);
      alert("Error creating topics");
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleDiscardTopics = () => {
    setInterpretedData(null);
    setCurrentStep("form");
  };

  const handleBatchGeneration = async () => {
    if (selectedTopics.length === 0) {
      alert("Please select topics to generate");
      return;
    }

    const confirmMessage = `Generate ${selectedTopics.length} blog posts? This may take several minutes.`;
    if (!confirm(confirmMessage)) return;

    try {
      setIsBatchGenerating(true);

      const response = await fetch("/api/blog/topics/generate-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicIds: selectedTopics,
          maxConcurrent: 3,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Batch generation completed! Successful: ${result.results.successful}, Failed: ${result.results.failed}`
        );
        setSelectedTopics([]);
        await fetchTopics(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Batch generation failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in batch generation:", error);
      alert("Error during batch generation");
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const selectAllPendingTopics = () => {
    const pendingTopics = topics.filter((topic) => topic.status === "pending");
    setSelectedTopics(pendingTopics.map((topic) => topic._id));
  };

  const clearSelection = () => {
    setSelectedTopics([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Admin</h1>
              <p className="text-gray-600 mt-2">
                Manage your blog content and settings
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/blog")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            </TabsList>
          </div>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
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
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog
                      open={showNewPostDialog}
                      onOpenChange={setShowNewPostDialog}
                    >
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
                            Choose how you&apos;d like to create your new blog post
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                          {/* AI Generation Option */}
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
                                    Enter a topic and let AI create a complete
                                    blog structure
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

                          {/* Manual Creation Option */}
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
                                    Build your post component by component with
                                    full control
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* JSON Import Option */}
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
                                    Paste a JSON structure to quickly create a
                                    post
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setShowNewPostDialog(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* List View */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading posts...</span>
                  </div>
                ) : blogPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No blog posts found.</p>
                    <Button
                      className="mt-4"
                      onClick={() => setShowNewPostDialog(true)}
                    >
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
                            <img
                              src={getPostThumbnail(post)}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.style.display = "none";
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                      <polyline points="9,22 9,12 15,12 15,22"></polyline>
                                    </svg>
                                  </div>
                                `;
                              }}
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
                            <span>
                              {post.components?.length || 0} components
                            </span>
                            <span>by {post.author?.name || "Anonymous"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : "secondary"
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
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Scheduled Blog Queue
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedTopics.length > 0 && (
                      <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm text-blue-700">
                          {selectedTopics.length} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {selectedTopics.length > 0 && (
                      <Button
                        onClick={handleBatchGeneration}
                        disabled={isBatchGenerating}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isBatchGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate {selectedTopics.length}
                          </>
                        )}
                      </Button>
                    )}

                    {topics.filter((t) => t.status === "pending").length > 0 &&
                      selectedTopics.length === 0 && (
                        <Button
                          variant="outline"
                          onClick={selectAllPendingTopics}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Select All Pending
                        </Button>
                      )}

                    <Button
                      variant="outline"
                      onClick={() => router.push("/blog/admin/bulk/generate")}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/blog/admin/bulk/import")}
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      Import JSON
                    </Button>

                    <Dialog
                      open={showAddTopicDialog}
                      onOpenChange={setShowAddTopicDialog}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Topic
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Topic</DialogTitle>
                          <DialogDescription>
                            Add a new topic to the queue for AI blog generation
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {/* Basic Topic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Topic Title *
                              </label>
                              <Input
                                value={topicForm.topic}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    topic: e.target.value,
                                  }))
                                }
                                placeholder="e.g., The Future of Remote Work in 2025"
                                className="w-full"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Target Audience
                              </label>
                              <Input
                                value={topicForm.audience}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    audience: e.target.value,
                                  }))
                                }
                                placeholder="e.g., Working professionals and entrepreneurs"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Tone
                              </label>
                              <Select
                                value={topicForm.tone}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    tone: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Professional but approachable">
                                    Professional but approachable
                                  </SelectItem>
                                  <SelectItem value="Casual and friendly">
                                    Casual and friendly
                                  </SelectItem>
                                  <SelectItem value="Technical and authoritative">
                                    Technical and authoritative
                                  </SelectItem>
                                  <SelectItem value="Conversational">
                                    Conversational
                                  </SelectItem>
                                  <SelectItem value="Formal and academic">
                                    Formal and academic
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Length
                              </label>
                              <Select
                                value={topicForm.length}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    length: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Short (400-600 words)">
                                    Short (400-600 words)
                                  </SelectItem>
                                  <SelectItem value="Medium (800-1200 words)">
                                    Medium (800-1200 words)
                                  </SelectItem>
                                  <SelectItem value="Long (1200-1500 words)">
                                    Long (1200-1500 words)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Priority
                              </label>
                              <Select
                                value={topicForm.priority}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    priority: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Content Options */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 block">
                              Content Options
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="includeImages"
                                  checked={topicForm.includeImages}
                                  onCheckedChange={(checked) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeImages: !!checked,
                                    }))
                                  }
                                />
                                <label
                                  htmlFor="includeImages"
                                  className="text-sm text-gray-700"
                                >
                                  Include Images
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="includeCallouts"
                                  checked={topicForm.includeCallouts}
                                  onCheckedChange={(checked) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeCallouts: !!checked,
                                    }))
                                  }
                                />
                                <label
                                  htmlFor="includeCallouts"
                                  className="text-sm text-gray-700"
                                >
                                  Include Callouts
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="includeCTA"
                                  checked={topicForm.includeCTA}
                                  onCheckedChange={(checked) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeCTA: !!checked,
                                    }))
                                  }
                                />
                                <label
                                  htmlFor="includeCTA"
                                  className="text-sm text-gray-700"
                                >
                                  Include CTA
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Additional Requirements */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Additional Requirements
                            </label>
                            <Textarea
                              value={topicForm.additionalRequirements}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  additionalRequirements: e.target.value,
                                }))
                              }
                              placeholder="Any specific requirements, keywords, or focus areas..."
                              rows={3}
                            />
                          </div>

                          {/* Brand Context */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Brand Context & Style Guide
                            </label>
                            <Textarea
                              value={topicForm.brandContext}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  brandContext: e.target.value,
                                }))
                              }
                              placeholder="Brand voice, tone, style guidelines specific to this topic..."
                              rows={3}
                            />
                          </div>

                          {/* Image Context */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Image Style Preferences
                            </label>
                            <Textarea
                              value={topicForm.imageContext}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  imageContext: e.target.value,
                                }))
                              }
                              placeholder="Describe desired image style: colors, design philosophy, inspiration, art style, mood and composition preferences..."
                              rows={3}
                            />
                          </div>

                          {/* Tags */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Tags
                            </label>
                            <div className="flex gap-2 mb-2">
                              <Input
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                placeholder="Add a tag..."
                                onKeyPress={(e) =>
                                  e.key === "Enter" && addTag()
                                }
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={addTag}
                                disabled={!newTagInput.trim()}
                              >
                                Add
                              </Button>
                            </div>
                            {topicForm.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {topicForm.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-red-100"
                                    onClick={() => removeTag(tag)}
                                  >
                                    {tag} ×
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reference Images Section */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 block">
                              Reference Images (Optional)
                            </label>

                            {/* Existing Images */}
                            {images.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-600 mb-2">
                                  Select from existing images:
                                </h4>
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                                  {images.slice(0, 20).map((image) => (
                                    <div
                                      key={image.fileId}
                                      className={`relative cursor-pointer rounded border-2 ${
                                        selectedExistingImages.includes(
                                          image.url
                                        )
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      onClick={() =>
                                        handleImageSelect(image.url)
                                      }
                                    >
                                      <img
                                        src={image.thumbnailUrl}
                                        alt={image.name}
                                        className="w-full h-16 object-cover rounded"
                                      />
                                      {selectedExistingImages.includes(
                                        image.url
                                      ) && (
                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                                          ✓
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload New Images */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2">
                                Or upload new reference images:
                              </h4>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleReferenceImageUpload(e.target.files)
                                }
                                className="hidden"
                                id="reference-images"
                              />
                              <label htmlFor="reference-images">
                                <Button type="button" variant="outline" asChild>
                                  <span className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Images
                                  </span>
                                </Button>
                              </label>

                              {newReferenceImages.length > 0 && (
                                <div className="mt-2 grid grid-cols-4 gap-2">
                                  {newReferenceImages.map((file, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-full h-16 object-cover rounded border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-1 right-1 w-4 h-4 p-0"
                                        onClick={() =>
                                          removeReferenceImage(index)
                                        }
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Upload up to 5 images to guide the AI&apos;s style
                                and aesthetic
                              </p>
                            </div>
                          </div>

                          {/* Scheduled Date */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Scheduled Generation Date (Optional)
                              </label>
                              <div className="text-xs text-gray-500 mb-1">
                                Your local time (UTC{new Date().getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(new Date().getTimezoneOffset() / 60)})
                              </div>
                              <Input
                                type="datetime-local"
                                value={topicForm.scheduledAt}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    scheduledAt: e.target.value,
                                  }))
                                }
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                When specified, the blog will be automatically
                                generated at this date/time
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Estimated Duration (minutes)
                              </label>
                              <Input
                                type="number"
                                min="1"
                                max="60"
                                value={topicForm.estimatedDuration}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    estimatedDuration:
                                      parseInt(e.target.value) || 5,
                                  }))
                                }
                                placeholder="5"
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Notes (Optional)
                            </label>
                            <Textarea
                              value={topicForm.notes}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                              placeholder="Any additional notes or context..."
                              rows={2}
                            />
                          </div>

                          {/* SEO Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">SEO Keywords</h3>
                            
                            {/* Primary Keyword */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Primary Keyword *
                              </label>
                              <Input
                                value={topicForm.seo.primaryKeyword}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, primaryKeyword: e.target.value },
                                  }))
                                }
                                placeholder="e.g., remote work productivity"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The main keyword you want to rank for
                              </p>
                            </div>

                            {/* Secondary Keywords */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Secondary Keywords (max 3)
                              </label>
                              <div className="flex gap-2 mb-2">
                                <Input
                                  value={newSecondaryKeyword}
                                  onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                                  placeholder="Add secondary keyword..."
                                  onKeyPress={(e) =>
                                    e.key === "Enter" && addSecondaryKeyword()
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addSecondaryKeyword}
                                  disabled={!newSecondaryKeyword.trim() || topicForm.seo.secondaryKeywords.length >= 3}
                                >
                                  Add
                                </Button>
                              </div>
                              {topicForm.seo.secondaryKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {topicForm.seo.secondaryKeywords.map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-red-100"
                                      onClick={() => removeSecondaryKeyword(keyword)}
                                    >
                                      {keyword} ×
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Long-tail Keywords */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Long-tail Keywords (max 3)
                              </label>
                              <div className="flex gap-2 mb-2">
                                <Input
                                  value={newLongTailKeyword}
                                  onChange={(e) => setNewLongTailKeyword(e.target.value)}
                                  placeholder="e.g., how to improve remote work productivity 2025"
                                  onKeyPress={(e) =>
                                    e.key === "Enter" && addLongTailKeyword()
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addLongTailKeyword}
                                  disabled={!newLongTailKeyword.trim() || topicForm.seo.longTailKeywords.length >= 3}
                                >
                                  Add
                                </Button>
                              </div>
                              {topicForm.seo.longTailKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {topicForm.seo.longTailKeywords.map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-red-100"
                                      onClick={() => removeLongTailKeyword(keyword)}
                                    >
                                      {keyword} ×
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Search Intent */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Search Intent
                              </label>
                              <Select
                                value={topicForm.seo.searchIntent}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, searchIntent: value as any },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="informational">
                                    Informational (How-to, guides, definitions)
                                  </SelectItem>
                                  <SelectItem value="commercial">
                                    Commercial (Reviews, comparisons, best of)
                                  </SelectItem>
                                  <SelectItem value="transactional">
                                    Transactional (Product pages, services)
                                  </SelectItem>
                                  <SelectItem value="navigational">
                                    Navigational (Brand/company specific)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Meta Data Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">Meta Data</h3>
                            
                            {/* Meta Title */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Meta Title (max 60 characters)
                              </label>
                              <div className="relative">
                                <Input
                                  value={topicForm.seo.metaTitle}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, metaTitle: e.target.value.slice(0, 60) },
                                    }))
                                  }
                                  placeholder="Leave blank to auto-generate from topic"
                                  className="w-full pr-12"
                                  maxLength={60}
                                />
                                <span className={`absolute right-2 top-2.5 text-xs ${
                                  topicForm.seo.metaTitle.length > 50 ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                  {topicForm.seo.metaTitle.length}/60
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Appears in browser tabs and search results
                              </p>
                            </div>

                            {/* Meta Description */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Meta Description (max 155 characters)
                              </label>
                              <div className="relative">
                                <Textarea
                                  value={topicForm.seo.metaDescription}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, metaDescription: e.target.value.slice(0, 155) },
                                    }))
                                  }
                                  placeholder="Leave blank to auto-generate a compelling description"
                                  className="w-full pr-12"
                                  rows={3}
                                  maxLength={155}
                                />
                                <span className={`absolute right-2 top-2 text-xs ${
                                  topicForm.seo.metaDescription.length > 140 ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                  {topicForm.seo.metaDescription.length}/155
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Appears in search result snippets
                              </p>
                            </div>

                            {/* Open Graph Title */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Social Media Title (Open Graph)
                              </label>
                              <Input
                                value={topicForm.seo.openGraph.title}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { 
                                      ...prev.seo, 
                                      openGraph: { ...prev.seo.openGraph, title: e.target.value }
                                    },
                                  }))
                                }
                                placeholder="Leave blank to use meta title"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Title shown when shared on social media
                              </p>
                            </div>

                            {/* Open Graph Description */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Social Media Description
                              </label>
                              <Textarea
                                value={topicForm.seo.openGraph.description}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { 
                                      ...prev.seo, 
                                      openGraph: { ...prev.seo.openGraph, description: e.target.value }
                                    },
                                  }))
                                }
                                placeholder="Leave blank to use meta description"
                                className="w-full"
                                rows={2}
                              />
                            </div>

                            {/* Schema Type */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Schema Type
                              </label>
                              <Select
                                value={topicForm.seo.schemaType}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, schemaType: value as any },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Article">
                                    Article (General articles)
                                  </SelectItem>
                                  <SelectItem value="BlogPosting">
                                    Blog Posting (Blog posts)
                                  </SelectItem>
                                  <SelectItem value="NewsArticle">
                                    News Article (News content)
                                  </SelectItem>
                                  <SelectItem value="HowToArticle">
                                    How-To Article (Tutorials)
                                  </SelectItem>
                                  <SelectItem value="FAQPage">
                                    FAQ Page (Q&A format)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500 mt-1">
                                Helps search engines understand content type
                              </p>
                            </div>
                          </div>

                          {/* URL Optimization Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">URL Optimization</h3>
                            
                            {/* URL Slug */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                URL Slug
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  value={topicForm.seo.slug}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, slug: generateSlug(e.target.value) },
                                    }))
                                  }
                                  placeholder="auto-generated-from-keyword"
                                  className="flex-1 font-mono text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={updateSlug}
                                  disabled={!topicForm.seo.primaryKeyword && !topicForm.topic}
                                >
                                  Auto Generate
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                SEO-friendly URL: /blog/{topicForm.seo.slug || 'your-slug-here'}
                              </p>
                              {topicForm.seo.slug && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <strong>Preview:</strong> https://yourdomain.com/blog/{topicForm.seo.slug}
                                </div>
                              )}
                            </div>

                            {/* Canonical URL */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Canonical URL (Optional)
                              </label>
                              <Input
                                value={topicForm.seo.canonicalUrl}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, canonicalUrl: e.target.value },
                                  }))
                                }
                                placeholder="Leave blank to use the generated URL"
                                className="w-full"
                                type="url"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Only set if this content exists elsewhere (prevents duplicate content issues)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              resetTopicForm();
                              setShowAddTopicDialog(false);
                            }}
                            disabled={isCreatingTopic}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateTopic}
                            disabled={
                              isCreatingTopic || !topicForm.topic.trim()
                            }
                          >
                            {isCreatingTopic ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Topic
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Topic Dialog */}
                    <Dialog
                      open={showEditTopicDialog}
                      onOpenChange={setShowEditTopicDialog}
                    >
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Topic</DialogTitle>
                          <DialogDescription>
                            Update the topic details for AI blog generation
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {/* Basic Topic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-topic">Topic Title *</Label>
                              <Input
                                id="edit-topic"
                                placeholder="Enter your blog topic..."
                                value={topicForm.topic}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    topic: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-audience">
                                Target Audience
                              </Label>
                              <Input
                                id="edit-audience"
                                placeholder="e.g., Working professionals, entrepreneurs..."
                                value={topicForm.audience}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    audience: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-tone">Tone</Label>
                              <Select
                                value={topicForm.tone}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    tone: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Professional">
                                    Professional
                                  </SelectItem>
                                  <SelectItem value="Professional but approachable">
                                    Professional but approachable
                                  </SelectItem>
                                  <SelectItem value="Casual">Casual</SelectItem>
                                  <SelectItem value="Technical">
                                    Technical
                                  </SelectItem>
                                  <SelectItem value="Friendly">
                                    Friendly
                                  </SelectItem>
                                  <SelectItem value="Authoritative">
                                    Authoritative
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-length">
                                Article Length
                              </Label>
                              <Select
                                value={topicForm.length}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    length: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Short (400-600 words)">
                                    Short (400-600 words)
                                  </SelectItem>
                                  <SelectItem value="Medium (800-1200 words)">
                                    Medium (800-1200 words)
                                  </SelectItem>
                                  <SelectItem value="Long (1200-1500 words)">
                                    Long (1200-1500 words)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-priority">Priority</Label>
                              <Select
                                value={topicForm.priority}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    priority: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-scheduled">
                                Scheduled Date/Time
                              </Label>
                              <div className="text-xs text-gray-500 mb-1">
                                Your local time (UTC{new Date().getTimezoneOffset() > 0 ? '-' : '+'}{Math.abs(new Date().getTimezoneOffset() / 60)})
                              </div>
                              <Input
                                id="edit-scheduled"
                                type="datetime-local"
                                value={topicForm.scheduledAt}
                                min={new Date().toISOString().slice(0, 16)}
                                disabled={editingTopic?.status === 'completed' || editingTopic?.generatedPostId ? true : false}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    scheduledAt: e.target.value,
                                  }))
                                }
                                className={editingTopic?.status === 'completed' || editingTopic?.generatedPostId ? "bg-gray-100 text-gray-500" : ""}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {editingTopic?.status === 'completed' || editingTopic?.generatedPostId
                                  ? "Cannot reschedule published topics"
                                  : "When changed, the topic will be rescheduled with the new date/time"
                                }
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-duration">
                                Estimated Duration (minutes)
                              </Label>
                              <Input
                                id="edit-duration"
                                type="number"
                                min="1"
                                max="60"
                                value={topicForm.estimatedDuration}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    estimatedDuration:
                                      parseInt(e.target.value) || 5,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          {/* Content Options */}
                          <div className="space-y-4">
                            <Label>Content Options</Label>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={topicForm.includeImages}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeImages: e.target.checked,
                                    }))
                                  }
                                />
                                <span>Include Images</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={topicForm.includeCallouts}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeCallouts: e.target.checked,
                                    }))
                                  }
                                />
                                <span>Include Callouts</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={topicForm.includeCTA}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      includeCTA: e.target.checked,
                                    }))
                                  }
                                />
                                <span>Include Call-to-Action</span>
                              </label>
                            </div>
                          </div>

                          {/* Additional Requirements */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-requirements">
                              Additional Requirements
                            </Label>
                            <Textarea
                              id="edit-requirements"
                              placeholder="Any specific requirements, key points to cover, or style preferences..."
                              value={topicForm.additionalRequirements}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  additionalRequirements: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Brand Context */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-brand-context">
                              Brand Context & Style Guide
                            </Label>
                            <Textarea
                              id="edit-brand-context"
                              placeholder="Brand voice, tone, style guidelines specific to this topic..."
                              value={topicForm.brandContext}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  brandContext: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                          </div>

                          {/* Image Context */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-image-context">
                              Image Context
                            </Label>
                            <Textarea
                              id="edit-image-context"
                              placeholder="Context for image generation (style, mood, specific requirements)..."
                              value={topicForm.imageContext}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  imageContext: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* Reference Images */}
                          <div className="space-y-2">
                            <Label>Reference Images</Label>
                            {selectedExistingImages.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {selectedExistingImages.map(
                                  (imageRef, index) => {
                                    // Handle both URL and ID references
                                    const image = images.find(
                                      (img) => img._id === imageRef || img.url === imageRef
                                    );
                                    return (
                                      <div
                                        key={index}
                                        className="relative group"
                                      >
                                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                          {image ? (
                                            <img
                                              src={image.url}
                                              alt={
                                                image.alt || "Reference image"
                                              }
                                              className="w-full h-full object-cover"
                                            />
                                          ) : imageRef.startsWith('http') ? (
                                            // Handle external URLs not in library
                                            <img
                                              src={imageRef}
                                              alt="External reference image"
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <ImageIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            setSelectedExistingImages((prev) =>
                                              prev.filter(
                                                (ref) => ref !== imageRef
                                              )
                                            );
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                        {(image || imageRef.startsWith('http')) && (
                                          <p className="text-xs text-gray-500 mt-1 truncate">
                                            {image ? (image.alt || "No description") : "External image"}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                No reference images selected
                              </p>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowImagePicker(true)}
                              className="mt-2"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Browse Images
                            </Button>
                          </div>

                          {/* Tags */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-tags">Tags</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {topicForm.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTopicForm((prev) => ({
                                        ...prev,
                                        tags: prev.tags.filter(
                                          (_, i) => i !== index
                                        ),
                                      }))
                                    }
                                    className="ml-1 text-xs hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add tag..."
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newTagInput.trim()) {
                                    e.preventDefault();
                                    if (
                                      !topicForm.tags.includes(
                                        newTagInput.trim()
                                      )
                                    ) {
                                      setTopicForm((prev) => ({
                                        ...prev,
                                        tags: [
                                          ...prev.tags,
                                          newTagInput.trim(),
                                        ],
                                      }));
                                    }
                                    setNewTagInput("");
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    newTagInput.trim() &&
                                    !topicForm.tags.includes(newTagInput.trim())
                                  ) {
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      tags: [...prev.tags, newTagInput.trim()],
                                    }));
                                    setNewTagInput("");
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <Textarea
                              id="edit-notes"
                              placeholder="Internal notes about this topic..."
                              value={topicForm.notes}
                              onChange={(e) =>
                                setTopicForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                          </div>

                          {/* SEO Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">SEO Keywords</h3>
                            
                            {/* Primary Keyword */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Primary Keyword *
                              </label>
                              <Input
                                value={topicForm.seo.primaryKeyword}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, primaryKeyword: e.target.value },
                                  }))
                                }
                                placeholder="e.g., remote work productivity"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The main keyword you want to rank for
                              </p>
                            </div>

                            {/* Secondary Keywords */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Secondary Keywords (max 3)
                              </label>
                              <div className="flex gap-2 mb-2">
                                <Input
                                  value={newSecondaryKeyword}
                                  onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                                  placeholder="Add secondary keyword..."
                                  onKeyPress={(e) =>
                                    e.key === "Enter" && addSecondaryKeyword()
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addSecondaryKeyword}
                                  disabled={!newSecondaryKeyword.trim() || topicForm.seo.secondaryKeywords.length >= 3}
                                >
                                  Add
                                </Button>
                              </div>
                              {topicForm.seo.secondaryKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {topicForm.seo.secondaryKeywords.map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-red-100"
                                      onClick={() => removeSecondaryKeyword(keyword)}
                                    >
                                      {keyword} ×
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Long-tail Keywords */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Long-tail Keywords (max 3)
                              </label>
                              <div className="flex gap-2 mb-2">
                                <Input
                                  value={newLongTailKeyword}
                                  onChange={(e) => setNewLongTailKeyword(e.target.value)}
                                  placeholder="e.g., how to improve remote work productivity 2025"
                                  onKeyPress={(e) =>
                                    e.key === "Enter" && addLongTailKeyword()
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addLongTailKeyword}
                                  disabled={!newLongTailKeyword.trim() || topicForm.seo.longTailKeywords.length >= 3}
                                >
                                  Add
                                </Button>
                              </div>
                              {topicForm.seo.longTailKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {topicForm.seo.longTailKeywords.map((keyword, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-red-100"
                                      onClick={() => removeLongTailKeyword(keyword)}
                                    >
                                      {keyword} ×
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Search Intent */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Search Intent
                              </label>
                              <Select
                                value={topicForm.seo.searchIntent}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, searchIntent: value as any },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="informational">
                                    Informational (How-to, guides, definitions)
                                  </SelectItem>
                                  <SelectItem value="commercial">
                                    Commercial (Reviews, comparisons, best of)
                                  </SelectItem>
                                  <SelectItem value="transactional">
                                    Transactional (Product pages, services)
                                  </SelectItem>
                                  <SelectItem value="navigational">
                                    Navigational (Brand/company specific)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Meta Data Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">Meta Data</h3>
                            
                            {/* Meta Title */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Meta Title (max 60 characters)
                              </label>
                              <div className="relative">
                                <Input
                                  value={topicForm.seo.metaTitle}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, metaTitle: e.target.value.slice(0, 60) },
                                    }))
                                  }
                                  placeholder="Leave blank to auto-generate from topic"
                                  className="w-full pr-12"
                                  maxLength={60}
                                />
                                <span className={`absolute right-2 top-2.5 text-xs ${
                                  topicForm.seo.metaTitle.length > 50 ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                  {topicForm.seo.metaTitle.length}/60
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Appears in browser tabs and search results
                              </p>
                            </div>

                            {/* Meta Description */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Meta Description (max 155 characters)
                              </label>
                              <div className="relative">
                                <Textarea
                                  value={topicForm.seo.metaDescription}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, metaDescription: e.target.value.slice(0, 155) },
                                    }))
                                  }
                                  placeholder="Leave blank to auto-generate a compelling description"
                                  className="w-full pr-12"
                                  rows={3}
                                  maxLength={155}
                                />
                                <span className={`absolute right-2 top-2 text-xs ${
                                  topicForm.seo.metaDescription.length > 140 ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                  {topicForm.seo.metaDescription.length}/155
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Appears in search result snippets
                              </p>
                            </div>

                            {/* Open Graph Title */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Social Media Title (Open Graph)
                              </label>
                              <Input
                                value={topicForm.seo.openGraph.title}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { 
                                      ...prev.seo, 
                                      openGraph: { ...prev.seo.openGraph, title: e.target.value }
                                    },
                                  }))
                                }
                                placeholder="Leave blank to use meta title"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Title shown when shared on social media
                              </p>
                            </div>

                            {/* Open Graph Description */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Social Media Description
                              </label>
                              <Textarea
                                value={topicForm.seo.openGraph.description}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { 
                                      ...prev.seo, 
                                      openGraph: { ...prev.seo.openGraph, description: e.target.value }
                                    },
                                  }))
                                }
                                placeholder="Leave blank to use meta description"
                                className="w-full"
                                rows={2}
                              />
                            </div>

                            {/* Schema Type */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Schema Type
                              </label>
                              <Select
                                value={topicForm.seo.schemaType}
                                onValueChange={(value) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, schemaType: value as any },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Article">
                                    Article (General articles)
                                  </SelectItem>
                                  <SelectItem value="BlogPosting">
                                    Blog Posting (Blog posts)
                                  </SelectItem>
                                  <SelectItem value="NewsArticle">
                                    News Article (News content)
                                  </SelectItem>
                                  <SelectItem value="HowToArticle">
                                    How-To Article (Tutorials)
                                  </SelectItem>
                                  <SelectItem value="FAQPage">
                                    FAQ Page (Q&A format)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500 mt-1">
                                Helps search engines understand content type
                              </p>
                            </div>
                          </div>

                          {/* URL Optimization Section */}
                          <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-900">URL Optimization</h3>
                            
                            {/* URL Slug */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                URL Slug
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  value={topicForm.seo.slug}
                                  onChange={(e) =>
                                    setTopicForm((prev) => ({
                                      ...prev,
                                      seo: { ...prev.seo, slug: generateSlug(e.target.value) },
                                    }))
                                  }
                                  placeholder="auto-generated-from-keyword"
                                  className="flex-1 font-mono text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={updateSlug}
                                  disabled={!topicForm.seo.primaryKeyword && !topicForm.topic}
                                >
                                  Auto Generate
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                SEO-friendly URL: /blog/{topicForm.seo.slug || 'your-slug-here'}
                              </p>
                              {topicForm.seo.slug && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                  <strong>Preview:</strong> https://yourdomain.com/blog/{topicForm.seo.slug}
                                </div>
                              )}
                            </div>

                            {/* Canonical URL */}
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Canonical URL (Optional)
                              </label>
                              <Input
                                value={topicForm.seo.canonicalUrl}
                                onChange={(e) =>
                                  setTopicForm((prev) => ({
                                    ...prev,
                                    seo: { ...prev.seo, canonicalUrl: e.target.value },
                                  }))
                                }
                                placeholder="Leave blank to use the generated URL"
                                className="w-full"
                                type="url"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Only set if this content exists elsewhere (prevents duplicate content issues)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowEditTopicDialog(false)}
                          >
                            Cancel
                          </Button>
                          
                          {topicForm.scheduledAt && !editingTopic?.generatedPostId && editingTopic?.status !== 'completed' && (
                            <Button
                              variant="outline"
                              onClick={handleRescheduleTopic}
                              disabled={isUpdatingTopic}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              {isUpdatingTopic ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Rescheduling...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reschedule Only
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            onClick={handleUpdateTopic}
                            disabled={
                              isUpdatingTopic || !topicForm.topic.trim()
                            }
                          >
                            {isUpdatingTopic ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Edit className="h-4 w-4 mr-2" />
                                Update Topic
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Image Picker Dialog */}
                    <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Select Reference Images</DialogTitle>
                          <DialogDescription>
                            Choose images from your library to use as references
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                          {images.map((image) => (
                            <div
                              key={image.fileId}
                              className={`relative cursor-pointer rounded border-2 transition-all ${
                                selectedExistingImages.includes(image.url) || selectedExistingImages.includes(image._id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => {
                                setSelectedExistingImages(prev => {
                                  const imageRef = image.url || image._id;
                                  if (prev.includes(imageRef)) {
                                    return prev.filter(ref => ref !== imageRef);
                                  } else {
                                    return [...prev, imageRef];
                                  }
                                });
                              }}
                            >
                              <img
                                src={image.thumbnailUrl || image.url}
                                alt={image.name}
                                className="w-full h-20 object-cover rounded"
                              />
                              {(selectedExistingImages.includes(image.url) || selectedExistingImages.includes(image._id)) && (
                                <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  ✓
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" onClick={() => setShowImagePicker(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setShowImagePicker(false)}>
                            Done ({selectedExistingImages.length} selected)
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTopics ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading topics...</span>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No topics in queue</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Add topics for automatic blog generation
                    </p>
                    <Button onClick={() => router.push("/blog/admin/bulk")}>
                      <Zap className="h-4 w-4 mr-2" />
                      Add Topics
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Inner tabs for pending/completed */}
                    <Tabs value={queueTab} onValueChange={(value) => setQueueTab(value as "pending" | "completed")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">
                          Pending ({pendingPagination.total})
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                          Completed ({completedPagination.total})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="pending" className="mt-4">
                        {pendingTopics.map((topic) => (
                      <div
                        key={topic._id}
                        className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedTopics.includes(topic._id)
                            ? "bg-blue-50 border-blue-200"
                            : ""
                        }`}
                      >
                        {/* Selection checkbox */}
                        {(topic.status === "pending" ||
                          topic.status === "failed") && (
                          <Checkbox
                            checked={selectedTopics.includes(topic._id)}
                            onCheckedChange={() =>
                              toggleTopicSelection(topic._id)
                            }
                            className="flex-shrink-0"
                          />
                        )}

                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(topic.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {topic.topic}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(topic.createdAt).toLocaleDateString()}
                            </span>
                            {topic.scheduledAt && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Calendar className="h-4 w-4" />
                                Scheduled:{" "}
                                {new Date(topic.scheduledAt).toLocaleString()}
                              </span>
                            )}
                            {topic.estimatedDuration && (
                              <span>{topic.estimatedDuration} min est.</span>
                            )}
                            <span className="capitalize">
                              {topic.priority} priority
                            </span>
                          </div>
                          {topic.tags && topic.tags.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              {topic.tags.map((tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {topic.audience && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              Audience: {topic.audience}
                            </p>
                          )}
                          {topic.errorMessage && (
                            <p className="text-xs text-red-600 mt-1 truncate">
                              Error: {topic.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getStatusBadge(topic.status)}
                          >
                            {topic.status}
                          </Badge>
                          {topic.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateTopic(topic._id)}
                              title="Generate blog post"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {topic.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateTopic(topic._id)}
                              title="Retry generation"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {topic.status === "completed" &&
                            topic.generatedPostId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditPost(topic.generatedPostId)
                                }
                                title="View generated post"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTopic(topic)}
                            title="Edit topic"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTopic(topic._id)}
                            title="Delete topic"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                        </TabsContent>

                        <TabsContent value="completed" className="mt-4">
                          {completedTopics.map((topic) => (
                              <div
                                key={topic._id}
                                className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                                  selectedTopics.includes(topic._id)
                                    ? "bg-blue-50 border-blue-200"
                                    : ""
                                }`}
                              >
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {getStatusIcon(topic.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {topic.topic}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {new Date(topic.createdAt).toLocaleDateString()}
                                    </span>
                                    {topic.scheduledAt && (
                                      <span className="flex items-center gap-1 text-blue-600">
                                        <Calendar className="h-4 w-4" />
                                        Scheduled:{" "}
                                        {new Date(topic.scheduledAt).toLocaleString()}
                                      </span>
                                    )}
                                    {topic.estimatedDuration && (
                                      <span>{topic.estimatedDuration} min est.</span>
                                    )}
                                    <span className="capitalize">
                                      {topic.priority} priority
                                    </span>
                                  </div>
                                  {topic.tags && topic.tags.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      {topic.tags.map((tag: string, index: number) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {topic.audience && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      Audience: {topic.audience}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={getStatusBadge(topic.status)}
                                  >
                                    {topic.status}
                                  </Badge>
                                  {topic.status === "completed" &&
                                    topic.generatedPostId && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditPost(topic.generatedPostId)
                                        }
                                        title="View generated post"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTopic(topic)}
                                    title="Edit topic"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTopic(topic._id)}
                                    title="Delete topic"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </TabsContent>
                      </Tabs>
                      
                      {/* Pagination Controls */}
                      {(() => {
                        const currentPagination = queueTab === "pending" ? pendingPagination : completedPagination;
                        const currentPage = queueTab === "pending" ? pendingPage : completedPage;
                        const setCurrentPage = queueTab === "pending" ? setPendingPage : setCompletedPage;
                        
                        if (currentPagination.pages <= 1) return null;
                        
                        return (
                          <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-600">
                              Showing {((currentPage - 1) * currentPagination.limit) + 1} to {Math.min(currentPage * currentPagination.limit, currentPagination.total)} of {currentPagination.total} topics
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                              </Button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, currentPagination.pages) }, (_, i) => {
                                  let pageNum;
                                  if (currentPagination.pages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= currentPagination.pages - 2) {
                                    pageNum = currentPagination.pages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={pageNum === currentPage ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className="w-8 h-8 p-0"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(currentPagination.pages, prev + 1))}
                                disabled={currentPage === currentPagination.pages}
                              >
                                Next
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Queue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {topicStats.pending || 0}
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {topicStats.generating || 0}
                      </p>
                      <p className="text-sm text-gray-600">Generating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {topicStats.completed || 0}
                      </p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {topicStats.failed || 0}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Image Library
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <label htmlFor="image-upload">
                      <Button asChild disabled={isUploading}>
                        <span className="cursor-pointer">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Images
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>Uploading to ImageKit...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading images...</span>
                  </div>
                ) : images.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No images uploaded yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload images to your ImageKit library
                    </p>
                    <label htmlFor="image-upload">
                      <Button asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Your First Image
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image: any) => (
                      <Card
                        key={image.fileId}
                        className="hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-gray-100 rounded-t-lg relative overflow-hidden">
                          <img
                            src={image.thumbnailUrl}
                            alt={image.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {image.format.toUpperCase()}
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm text-gray-900 mb-1 truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            {formatFileSize(image.size)}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {image.width} × {image.height}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              ImageKit
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(image.url, "_blank")
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Size
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyImageUrl(image.url)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy URL
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    copyImageUrl(image.thumbnailUrl)
                                  }
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Thumbnail URL
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => deleteImage(image.fileId)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Statistics */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{images.length}</p>
                        <p className="text-sm text-gray-600">Total Images</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {formatFileSize(
                            images.reduce((total, img) => total + img.size, 0)
                          )}
                        </p>
                        <p className="text-sm text-gray-600">Total Size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {
                            images.filter(
                              (img) =>
                                img.format === "jpg" || img.format === "jpeg"
                            ).length
                          }
                        </p>
                        <p className="text-sm text-gray-600">JPG Images</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {images.filter((img) => img.format === "png").length}
                        </p>
                        <p className="text-sm text-gray-600">PNG Images</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Scheduler/Monitoring Tab */}
          <TabsContent value="scheduler" className="space-y-6">
            <SchedulerTab 
              topics={topics}
              isLoadingTopics={isLoadingTopics}
              onRefresh={fetchTopics}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
  //     <div className="min-h-screen bg-gray-50">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //         {/* Header */}
  //         <div className="mb-8">
  //           <div className="flex items-center justify-between">
  //             <div>
  //               <h1 className="text-3xl font-bold text-gray-900">Blog Admin</h1>
  //               <p className="text-gray-600 mt-2">
  //                 Manage your blog content and settings
  //               </p>
  //             </div>
  //             <Button
  //               variant="outline"
  //               onClick={() => (window.location.href = "/blog")}
  //               className="flex items-center gap-2"
  //             >
  //               <ArrowLeft className="h-4 w-4" />
  //               Back to Blog
  //             </Button>
  //           </div>
  //         </div>

  //         {/* Main Content */}
  //         <Tabs
  //           value={selectedTab}
  //           onValueChange={setSelectedTab}
  //           className="space-y-6"
  //         >
  //           <div className="flex items-center justify-between">
  //             <TabsList className="grid w-full max-w-lg grid-cols-4">
  //               <TabsTrigger value="posts">Posts</TabsTrigger>
  //               <TabsTrigger value="queue">Queue</TabsTrigger>
  //               <TabsTrigger value="images">Images</TabsTrigger>
  //               <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
  //             </TabsList>
  //           </div>

  //           {/* Posts Tab */}
  //           <TabsContent value="posts" className="space-y-6">
  //             <Card>
  //               <CardHeader>
  //                 <div className="flex items-center justify-between">
  //                   <CardTitle>Blog Posts</CardTitle>
  //                   <div className="flex items-center gap-4">
  //                     <div className="relative flex-1 md:w-80">
  //                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  //                       <Input
  //                         placeholder="Search posts..."
  //                         className="pl-10"
  //                         value={searchTerm}
  //                         onChange={(e) => setSearchTerm(e.target.value)}
  //                       />
  //                     </div>
  //                     <Select
  //                       value={statusFilter}
  //                       onValueChange={setStatusFilter}
  //                     >
  //                       <SelectTrigger className="w-32">
  //                         <SelectValue />
  //                       </SelectTrigger>
  //                       <SelectContent>
  //                         <SelectItem value="all">All Status</SelectItem>
  //                         <SelectItem value="published">Published</SelectItem>
  //                         <SelectItem value="draft">Draft</SelectItem>
  //                       </SelectContent>
  //                     </Select>

  //                     <Dialog
  //                       open={showNewPostDialog}
  //                       onOpenChange={setShowNewPostDialog}
  //                     >
  //                       <DialogTrigger asChild>
  //                         <Button className="bg-blue-600 hover:bg-blue-700">
  //                           <Plus className="h-4 w-4 mr-2" />
  //                           New Post
  //                         </Button>
  //                       </DialogTrigger>
  //                       <DialogContent className="max-w-2xl">
  //                         <DialogHeader>
  //                           <DialogTitle>Create New Blog Post</DialogTitle>
  //                           <DialogDescription>
  //                             Choose how you'd like to create your new blog post
  //                           </DialogDescription>
  //                         </DialogHeader>

  //                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
  //                           {/* AI Generation Option */}
  //                           <Card
  //                             className="cursor-pointer hover:bg-blue-50 border-blue-200"
  //                             onClick={() => {
  //                               setShowNewPostDialog(false);
  //                               window.location.href = "/blog/admin/ai";
  //                             }}
  //                           >
  //                             <CardContent className="p-6 text-center">
  //                               <div className="flex flex-col items-center space-y-4">
  //                                 <div className="p-3 bg-blue-100 rounded-full">
  //                                   <Sparkles className="h-8 w-8 text-blue-600" />
  //                                 </div>
  //                                 <div>
  //                                   <h3 className="font-semibold text-gray-900">
  //                                     Generate with AI
  //                                   </h3>
  //                                   <p className="text-sm text-gray-600 mt-1">
  //                                     Enter a topic and let AI create a complete
  //                                     blog structure
  //                                   </p>
  //                                 </div>
  //                                 <Badge
  //                                   variant="secondary"
  //                                   className="bg-blue-100 text-blue-700"
  //                                 >
  //                                   Recommended
  //                                 </Badge>
  //                               </div>
  //                             </CardContent>
  //                           </Card>

  //                           {/* Manual Creation Option */}
  //                           <Card
  //                             className="cursor-pointer hover:bg-green-50 border-green-200"
  //                             onClick={() => {
  //                               setShowNewPostDialog(false);
  //                               window.location.href = "/blog/admin/manual";
  //                             }}
  //                           >
  //                             <CardContent className="p-6 text-center">
  //                               <div className="flex flex-col items-center space-y-4">
  //                                 <div className="p-3 bg-green-100 rounded-full">
  //                                   <Edit className="h-8 w-8 text-green-600" />
  //                                 </div>
  //                                 <div>
  //                                   <h3 className="font-semibold text-gray-900">
  //                                     Manual Editor
  //                                   </h3>
  //                                   <p className="text-sm text-gray-600 mt-1">
  //                                     Build your post component by component with
  //                                     full control
  //                                   </p>
  //                                 </div>
  //                               </div>
  //                             </CardContent>
  //                           </Card>

  //                           {/* JSON Import Option */}
  //                           <Card
  //                             className="cursor-pointer hover:bg-purple-50 border-purple-200"
  //                             onClick={() => {
  //                               setShowNewPostDialog(false);
  //                               window.location.href = "/blog/admin/import";
  //                             }}
  //                           >
  //                             <CardContent className="p-6 text-center">
  //                               <div className="flex flex-col items-center space-y-4">
  //                                 <div className="p-3 bg-purple-100 rounded-full">
  //                                   <Code className="h-8 w-8 text-purple-600" />
  //                                 </div>
  //                                 <div>
  //                                   <h3 className="font-semibold text-gray-900">
  //                                     Import JSON
  //                                   </h3>
  //                                   <p className="text-sm text-gray-600 mt-1">
  //                                     Paste a JSON structure to quickly create a
  //                                     post
  //                                   </p>
  //                                 </div>
  //                               </div>
  //                             </CardContent>
  //                           </Card>
  //                         </div>

  //                         <div className="border-t pt-4">
  //                           <div className="flex gap-2 justify-end">
  //                             <Button
  //                               variant="outline"
  //                               onClick={() => setShowNewPostDialog(false)}
  //                             >
  //                               Cancel
  //                             </Button>
  //                           </div>
  //                         </div>
  //                       </DialogContent>
  //                     </Dialog>
  //                   </div>
  //                 </div>
  //               </CardHeader>
  //               <CardContent>
  //                 {/* List View */}
  //                 {isLoading ? (
  //                   <div className="flex items-center justify-center py-8">
  //                     <Loader2 className="h-6 w-6 animate-spin mr-2" />
  //                     <span>Loading posts...</span>
  //                   </div>
  //                 ) : blogPosts.length === 0 ? (
  //                   <div className="text-center py-8">
  //                     <p className="text-gray-500">No blog posts found.</p>
  //                     <Button
  //                       className="mt-4"
  //                       onClick={() => setShowNewPostDialog(true)}
  //                     >
  //                       Create your first post
  //                     </Button>
  //                   </div>
  //                 ) : (
  //                   <div className="space-y-4">
  //                     {blogPosts.map((post: any) => (
  //                       <div
  //                         key={post._id}
  //                         className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
  //                         onClick={() => handleEditPost(post._id)}
  //                       >
  //                         <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
  //                           {getPostThumbnail(post) ? (
  //                             <img
  //                               src={getPostThumbnail(post)}
  //                               alt={post.title}
  //                               className="w-full h-full object-cover"
  //                               onError={(e) => {
  //                                 // Fallback if image fails to load
  //                                 e.currentTarget.style.display = "none";
  //                                 e.currentTarget.parentElement!.innerHTML = `
  //                                   <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
  //                                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
  //                                       <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
  //                                       <polyline points="9,22 9,12 15,12 15,22"></polyline>
  //                                     </svg>
  //                                   </div>
  //                                 `;
  //                               }}
  //                             />
  //                           ) : (
  //                             <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
  //                               <FileText className="h-6 w-6 text-gray-400" />
  //                             </div>
  //                           )}
  //                         </div>
  //                         <div className="flex-1 min-w-0">
  //                           <h3 className="font-medium text-gray-900 truncate">
  //                             {post.title}
  //                           </h3>
  //                           <p className="text-sm text-gray-600 mt-1 line-clamp-2">
  //                             {post.description || "No description available"}
  //                           </p>
  //                           <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
  //                             <span>
  //                               {formatDate(post.updatedAt || post.createdAt)}
  //                             </span>
  //                             <span>
  //                               {post.components?.length || 0} components
  //                             </span>
  //                             <span>by {post.author?.name || "Anonymous"}</span>
  //                           </div>
  //                         </div>
  //                         <div className="flex items-center gap-2">
  //                           <Badge
  //                             variant={
  //                               post.status === "published"
  //                                 ? "default"
  //                                 : "secondary"
  //                             }
  //                             className={
  //                               post.status === "published"
  //                                 ? "bg-green-100 text-green-700"
  //                                 : "bg-yellow-100 text-yellow-700"
  //                             }
  //                           >
  //                             {post.status}
  //                           </Badge>
  //                           <Button
  //                             variant="ghost"
  //                             size="sm"
  //                             onClick={(e) => {
  //                               e.stopPropagation();
  //                               handleEditPost(post._id);
  //                             }}
  //                           >
  //                             <Edit className="h-4 w-4" />
  //                           </Button>
  //                           <Button
  //                             variant="ghost"
  //                             size="sm"
  //                             onClick={(e) => {
  //                               e.stopPropagation();
  //                               handleDeletePost(post._id);
  //                             }}
  //                           >
  //                             <Trash2 className="h-4 w-4" />
  //                           </Button>
  //                         </div>
  //                       </div>
  //                     ))}
  //                   </div>
  //                 )}
  //               </CardContent>
  //             </Card>
  //           </TabsContent>

  //           {/* Queue Tab */}
  //           <TabsContent value="queue" className="space-y-6">
  //             <Card>
  //               <CardHeader>
  //                 <div className="flex items-center justify-between">
  //                   <CardTitle className="flex items-center gap-2">
  //                     <Clock className="h-5 w-5" />
  //                     Scheduled Blog Queue
  //                   </CardTitle>
  //                   <div className="flex items-center gap-2">
  //                     {selectedTopics.length > 0 && (
  //                       <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
  //                         <span className="text-sm text-blue-700">
  //                           {selectedTopics.length} selected
  //                         </span>
  //                         <Button
  //                           variant="ghost"
  //                           size="sm"
  //                           onClick={clearSelection}
  //                           className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
  //                         >
  //                           ×
  //                         </Button>
  //                       </div>
  //                     )}

  //                     {selectedTopics.length > 0 && (
  //                       <Button
  //                         onClick={handleBatchGeneration}
  //                         disabled={isBatchGenerating}
  //                         className="bg-purple-600 hover:bg-purple-700"
  //                       >
  //                         {isBatchGenerating ? (
  //                           <>
  //                             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                             Generating...
  //                           </>
  //                         ) : (
  //                           <>
  //                             <Sparkles className="h-4 w-4 mr-2" />
  //                             Generate {selectedTopics.length}
  //                           </>
  //                         )}
  //                       </Button>
  //                     )}

  //                     {topics.filter((t) => t.status === "pending").length > 0 &&
  //                       selectedTopics.length === 0 && (
  //                         <Button
  //                           variant="outline"
  //                           onClick={selectAllPendingTopics}
  //                           className="text-purple-600 border-purple-200 hover:bg-purple-50"
  //                         >
  //                           <CheckCircle className="h-4 w-4 mr-2" />
  //                           Select All Pending
  //                         </Button>
  //                       )}

  //                     <Button
  //                       variant="outline"
  //                       onClick={() => router.push('/blog/admin/bulk')}
  //                     >
  //                       <Zap className="h-4 w-4 mr-2" />
  //                       Bulk Import
  //                     </Button>
  //                           </DialogDescription>
  //                         </DialogHeader>

  //                         <Tabs defaultValue="smart-import" className="w-full">
  //                           <TabsList className="grid w-full grid-cols-2">
  //                             <TabsTrigger
  //                               value="smart-import"
  //                               className="flex items-center gap-2"
  //                             >
  //                               <Wand2 className="h-4 w-4" />
  //                               Smart Import
  //                             </TabsTrigger>
  //                             <TabsTrigger
  //                               value="json-import"
  //                               className="flex items-center gap-2"
  //                             >
  //                               <Code className="h-4 w-4" />
  //                               JSON Import
  //                             </TabsTrigger>
  //                           </TabsList>

  //                           {/* Smart Import Tab */}
  //                           <TabsContent
  //                             value="smart-import"
  //                             className="space-y-4"
  //                           >
  //                             {currentStep === "form" ? (
  //                               <>
  //                                 <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
  //                                   <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
  //                                     <Wand2 className="h-4 w-4" />
  //                                     AI-Powered Topic Generation
  //                                   </h4>
  //                                   <p className="text-sm text-blue-700">
  //                                     Provide your content ideas in any format -
  //                                     bullet points, paragraphs, CSV data, or even
  //                                     just keywords. Our AI will interpret your
  //                                     input and create structured blog topics.
  //                                   </p>
  //                                 </div>

  //                                 {/* Input Method Selection */}
  //                                 <div className="space-y-3">
  //                                   <Label className="text-sm font-medium text-gray-700">
  //                                     Input Method
  //                                   </Label>
  //                                   <div className="flex gap-2">
  //                                     <Button
  //                                       variant={
  //                                         bulkInputMethod === "text"
  //                                           ? "default"
  //                                           : "outline"
  //                                       }
  //                                       size="sm"
  //                                       onClick={() => setBulkInputMethod("text")}
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     >
  //                                       <Type className="h-4 w-4 mr-2" />
  //                                       Text Input
  //                                     </Button>
  //                                     <Button
  //                                       variant={
  //                                         bulkInputMethod === "file"
  //                                           ? "default"
  //                                           : "outline"
  //                                       }
  //                                       size="sm"
  //                                       onClick={() => setBulkInputMethod("file")}
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     >
  //                                       <FileUp className="h-4 w-4 mr-2" />
  //                                       File Upload
  //                                     </Button>
  //                                   </div>
  //                                 </div>

  //                                 {/* Text Input */}
  //                                 {bulkInputMethod === "text" && (
  //                                   <div className="space-y-3">
  //                                     <Label className="text-sm font-medium text-gray-700">
  //                                       Content Ideas
  //                                     </Label>
  //                                     <Textarea
  //                                       value={bulkTopicsInput}
  //                                       onChange={(e) =>
  //                                         setBulkTopicsInput(e.target.value)
  //                                       }
  //                                       placeholder="Enter your content ideas in any format:

  // • Bullet points of topics
  // • Paragraph descriptions
  // • Keywords separated by commas
  // • Research notes
  // • Competitor analysis
  // • Customer questions
  // • Industry trends

  // Example:
  // - Remote work productivity tips
  // - AI in customer service
  // - Sustainable business practices
  // - Digital transformation for SMBs
  // - Employee engagement strategies"
  //                                       className="min-h-[300px] text-sm"
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     />
  //                                   </div>
  //                                 )}

  //                                 {/* File Upload */}
  //                                 {bulkInputMethod === "file" && (
  //                                   <div className="space-y-3">
  //                                     <Label className="text-sm font-medium text-gray-700">
  //                                       Upload File (CSV, TXT, or any text file)
  //                                     </Label>
  //                                     <input
  //                                       type="file"
  //                                       accept=".csv,.txt,.json,.md,.docx"
  //                                       onChange={(e) => {
  //                                         if (e.target.files) {
  //                                           setBulkUploadFile(e.target.files[0]);
  //                                         }
  //                                       }}
  //                                       className="hidden"
  //                                       id="bulk-file-upload"
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     />
  //                                     <label htmlFor="bulk-file-upload">
  //                                       <Button
  //                                         type="button"
  //                                         variant="outline"
  //                                         asChild
  //                                         disabled={
  //                                           isBulkImporting || isInterpreting
  //                                         }
  //                                       >
  //                                         <span className="cursor-pointer">
  //                                           <FileUp className="h-4 w-4 mr-2" />
  //                                           Choose File
  //                                         </span>
  //                                       </Button>
  //                                     </label>
  //                                     {bulkUploadFile && (
  //                                       <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
  //                                         <p className="text-sm text-gray-700">
  //                                           <strong>Selected file:</strong>{" "}
  //                                           {bulkUploadFile.name}
  //                                         </p>
  //                                         <p className="text-xs text-gray-500 mt-1">
  //                                           Size:{" "}
  //                                           {(bulkUploadFile.size / 1024).toFixed(
  //                                             1
  //                                           )}{" "}
  //                                           KB
  //                                         </p>
  //                                       </div>
  //                                     )}
  //                                   </div>
  //                                 )}

  //                                 {/* Brand Context Section */}
  //                                 <div className="space-y-4 border-t pt-4">
  //                                   <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
  //                                     <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
  //                                       <Sparkles className="h-4 w-4" />
  //                                       Brand Context (Optional but Recommended)
  //                                     </h4>
  //                                     <p className="text-sm text-purple-700">
  //                                       Help AI understand your brand voice and
  //                                       style for more authentic, human-like
  //                                       results.
  //                                     </p>
  //                                   </div>

  //                                   {/* Brand Description */}
  //                                   <div className="space-y-3">
  //                                     <Label className="text-sm font-medium text-gray-700">
  //                                       Brand Voice & Guidelines
  //                                     </Label>
  //                                     <Textarea
  //                                       value={brandContext}
  //                                       onChange={(e) =>
  //                                         setBrandContext(e.target.value)
  //                                       }
  //                                       placeholder="Describe your brand voice, target audience, industry, and content style preferences. For example:

  // • Industry: SaaS/Technology
  // • Target Audience: Small business owners and entrepreneurs
  // • Tone: Professional but approachable, conversational
  // • Content Style: Actionable tips, case studies, how-to guides
  // • Brand Values: Innovation, efficiency, customer success
  // • Avoid: Overly technical jargon, lengthy theoretical discussions"
  //                                       className="min-h-[120px] text-sm"
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     />
  //                                   </div>

  //                                   {/* Brand Examples File Upload */}
  //                                   <div className="space-y-3">
  //                                     <Label className="text-sm font-medium text-gray-700">
  //                                       Previous Posts Examples
  //                                     </Label>
  //                                     <p className="text-xs text-gray-600">
  //                                       Upload a file containing examples of your
  //                                       previous blog posts, social media content,
  //                                       or marketing copy. AI will analyze the
  //                                       writing style to match your brand voice.
  //                                     </p>
  //                                     <input
  //                                       type="file"
  //                                       accept=".txt,.md,.csv,.json,.docx"
  //                                       onChange={(e) => {
  //                                         if (e.target.files) {
  //                                           setBrandExamplesFile(
  //                                             e.target.files[0]
  //                                           );
  //                                         }
  //                                       }}
  //                                       className="hidden"
  //                                       id="brand-examples-upload"
  //                                       disabled={
  //                                         isBulkImporting || isInterpreting
  //                                       }
  //                                     />
  //                                     <label htmlFor="brand-examples-upload">
  //                                       <Button
  //                                         type="button"
  //                                         variant="outline"
  //                                         asChild
  //                                         disabled={
  //                                           isBulkImporting || isInterpreting
  //                                         }
  //                                       >
  //                                         <span className="cursor-pointer">
  //                                           <FileText className="h-4 w-4 mr-2" />
  //                                           Upload Writing Examples
  //                                         </span>
  //                                       </Button>
  //                                     </label>
  //                                     {brandExamplesFile && (
  //                                       <div className="bg-green-50 border border-green-200 rounded-lg p-3">
  //                                         <div className="flex items-center justify-between">
  //                                           <div>
  //                                             <p className="text-sm text-green-700">
  //                                               <strong>Examples file:</strong>{" "}
  //                                               {brandExamplesFile.name}
  //                                             </p>
  //                                             <p className="text-xs text-green-600 mt-1">
  //                                               Size:{" "}
  //                                               {(
  //                                                 brandExamplesFile.size / 1024
  //                                               ).toFixed(1)}{" "}
  //                                               KB
  //                                             </p>
  //                                           </div>
  //                                           <Button
  //                                             variant="outline"
  //                                             size="sm"
  //                                             onClick={() =>
  //                                               setBrandExamplesFile(null)
  //                                             }
  //                                             disabled={
  //                                               isBulkImporting || isInterpreting
  //                                             }
  //                                           >
  //                                             Remove
  //                                           </Button>
  //                                         </div>
  //                                       </div>
  //                                     )}
  //                                   </div>

  //                                   {/* Brand Images Section */}
  //                                   <div className="space-y-3">
  //                                     <Label className="text-sm font-medium text-gray-700">
  //                                       Brand Images (Optional)
  //                                     </Label>
  //                                     <p className="text-xs text-gray-600">
  //                                       Upload or select images that represent
  //                                       your brand style. AI will use these as
  //                                       visual context for generating topics.
  //                                     </p>

  //                                     <div className="flex gap-2">
  //                                       <Button
  //                                         variant="outline"
  //                                         size="sm"
  //                                         onClick={() => {
  //                                           if (images.length === 0) {
  //                                             fetchImages();
  //                                           }
  //                                           setShowImageSelection(
  //                                             !showImageSelection
  //                                           );
  //                                         }}
  //                                         disabled={
  //                                           isBulkImporting || isInterpreting
  //                                         }
  //                                       >
  //                                         <ImageIcon className="h-4 w-4 mr-2" />
  //                                         {showImageSelection
  //                                           ? "Hide Library"
  //                                           : "Browse Library"}
  //                                       </Button>

  //                                       <input
  //                                         type="file"
  //                                         accept="image/*"
  //                                         multiple
  //                                         onChange={(e) => {
  //                                           if (e.target.files) {
  //                                             const newFiles = Array.from(
  //                                               e.target.files
  //                                             );
  //                                             setBulkUploadImages((prev) => [
  //                                               ...prev,
  //                                               ...newFiles,
  //                                             ]);
  //                                           }
  //                                         }}
  //                                         className="hidden"
  //                                         id="brand-image-upload"
  //                                         disabled={
  //                                           isBulkImporting || isInterpreting
  //                                         }
  //                                       />
  //                                       <label htmlFor="brand-image-upload">
  //                                         <Button
  //                                           type="button"
  //                                           variant="outline"
  //                                           size="sm"
  //                                           asChild
  //                                           disabled={
  //                                             isBulkImporting || isInterpreting
  //                                           }
  //                                         >
  //                                           <span className="cursor-pointer">
  //                                             <Upload className="h-4 w-4 mr-2" />
  //                                             Upload New
  //                                           </span>
  //                                         </Button>
  //                                       </label>
  //                                     </div>

  //                                     {/* Library Images Selection */}
  //                                     {showImageSelection && (
  //                                       <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
  //                                         {isLoadingImages ? (
  //                                           <div className="flex items-center justify-center py-8">
  //                                             <Loader2 className="h-6 w-6 animate-spin mr-2" />
  //                                             Loading images...
  //                                           </div>
  //                                         ) : images.length === 0 ? (
  //                                           <div className="text-center py-8 text-gray-500">
  //                                             No images found. Upload some images
  //                                             first.
  //                                           </div>
  //                                         ) : (
  //                                           <>
  //                                             <div className="mb-3 flex items-center justify-between">
  //                                               <p className="text-sm text-gray-600">
  //                                                 Select images that represent
  //                                                 your brand style
  //                                               </p>
  //                                               {selectedExistingImagesForBulk.length >
  //                                                 0 && (
  //                                                 <Button
  //                                                   variant="outline"
  //                                                   size="sm"
  //                                                   onClick={() =>
  //                                                     setSelectedExistingImagesForBulk(
  //                                                       []
  //                                                     )
  //                                                   }
  //                                                 >
  //                                                   Clear (
  //                                                   {
  //                                                     selectedExistingImagesForBulk.length
  //                                                   }
  //                                                   )
  //                                                 </Button>
  //                                               )}
  //                                             </div>
  //                                             <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
  //                                               {images.map((image: any) => (
  //                                                 <div
  //                                                   key={image.fileId}
  //                                                   className={`relative border-2 rounded-lg p-1 cursor-pointer transition-all ${
  //                                                     selectedExistingImagesForBulk.includes(
  //                                                       image.url
  //                                                     )
  //                                                       ? "border-blue-500 bg-blue-50"
  //                                                       : "border-gray-200 hover:border-gray-300"
  //                                                   }`}
  //                                                   onClick={() => {
  //                                                     setSelectedExistingImagesForBulk(
  //                                                       (prev) =>
  //                                                         prev.includes(image.url)
  //                                                           ? prev.filter(
  //                                                               (url) =>
  //                                                                 url !==
  //                                                                 image.url
  //                                                             )
  //                                                           : [...prev, image.url]
  //                                                     );
  //                                                   }}
  //                                                 >
  //                                                   <img
  //                                                     src={image.thumbnailUrl}
  //                                                     alt={image.name}
  //                                                     className="w-full h-12 object-cover rounded"
  //                                                   />
  //                                                   {selectedExistingImagesForBulk.includes(
  //                                                     image.url
  //                                                   ) && (
  //                                                     <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
  //                                                       ✓
  //                                                     </div>
  //                                                   )}
  //                                                 </div>
  //                                               ))}
  //                                             </div>
  //                                           </>
  //                                         )}
  //                                       </div>
  //                                     )}

  //                                     {/* Uploaded Images Display */}
  //                                     {bulkUploadImages.length > 0 && (
  //                                       <div className="border border-gray-200 rounded-lg p-3">
  //                                         <div className="mb-2 flex items-center justify-between">
  //                                           <p className="text-sm font-medium text-gray-700">
  //                                             Uploaded Images (
  //                                             {bulkUploadImages.length})
  //                                           </p>
  //                                           <Button
  //                                             variant="outline"
  //                                             size="sm"
  //                                             onClick={() =>
  //                                               setBulkUploadImages([])
  //                                             }
  //                                             disabled={
  //                                               isBulkImporting || isInterpreting
  //                                             }
  //                                           >
  //                                             Clear All
  //                                           </Button>
  //                                         </div>
  //                                         <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
  //                                           {bulkUploadImages.map(
  //                                             (file, index) => (
  //                                               <div
  //                                                 key={index}
  //                                                 className="relative border border-gray-200 rounded-lg p-1"
  //                                               >
  //                                                 <img
  //                                                   src={URL.createObjectURL(
  //                                                     file
  //                                                   )}
  //                                                   alt={file.name}
  //                                                   className="w-full h-12 object-cover rounded"
  //                                                 />
  //                                                 <Button
  //                                                   type="button"
  //                                                   variant="destructive"
  //                                                   size="sm"
  //                                                   className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs rounded-full"
  //                                                   onClick={() =>
  //                                                     setBulkUploadImages(
  //                                                       (prev) =>
  //                                                         prev.filter(
  //                                                           (_, i) => i !== index
  //                                                         )
  //                                                     )
  //                                                   }
  //                                                   disabled={
  //                                                     isBulkImporting ||
  //                                                     isInterpreting
  //                                                   }
  //                                                 >
  //                                                   ×
  //                                                 </Button>
  //                                               </div>
  //                                             )
  //                                           )}
  //                                         </div>
  //                                       </div>
  //                                     )}

  //                                     {/* Selected Images Summary */}
  //                                     {(selectedExistingImagesForBulk.length >
  //                                       0 ||
  //                                       bulkUploadImages.length > 0) && (
  //                                       <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
  //                                         <p className="text-sm text-blue-700">
  //                                           <strong>Brand context images:</strong>{" "}
  //                                           {selectedExistingImagesForBulk.length +
  //                                             bulkUploadImages.length}{" "}
  //                                           images selected. AI will use these to
  //                                           understand your visual style when
  //                                           generating topics.
  //                                         </p>
  //                                       </div>
  //                                     )}
  //                                   </div>
  //                                 </div>

  //                                 {/* AI Process Button */}
  //                                 <div className="flex gap-2">
  //                                   <Button
  //                                     onClick={handleInterpretInput}
  //                                     disabled={
  //                                       isInterpreting ||
  //                                       isBulkImporting ||
  //                                       (bulkInputMethod === "text" &&
  //                                         !bulkTopicsInput.trim()) ||
  //                                       (bulkInputMethod === "file" &&
  //                                         !bulkUploadFile)
  //                                     }
  //                                     className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
  //                                   >
  //                                     {isInterpreting ? (
  //                                       <>
  //                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                                         AI Processing...
  //                                       </>
  //                                     ) : (
  //                                       <>
  //                                         <Wand2 className="h-4 w-4 mr-2" />
  //                                         Generate Topics with AI
  //                                       </>
  //                                     )}
  //                                   </Button>
  //                                   <Button
  //                                     variant="outline"
  //                                     onClick={() => {
  //                                       setBulkTopicsInput("");
  //                                       setBulkUploadFile(null);
  //                                       setBrandContext("");
  //                                       setBrandExamplesFile(null);
  //                                       setInterpretedData(null);
  //                                       setShowInterpretedPreview(false);
  //                                       setSelectedExistingImagesForBulk([]);
  //                                       setShowImageSelection(false);
  //                                     }}
  //                                     disabled={isBulkImporting || isInterpreting}
  //                                   >
  //                                     Clear All
  //                                   </Button>
  //                                 </div>
  //                               </>
  //                             ) : (
  //                               /* Topic Preview Section */
  //                               <div className="space-y-4">
  //                                 <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
  //                                   <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
  //                                     <CheckCircle className="h-4 w-4" />
  //                                     Generated Topics Preview
  //                                   </h4>
  //                                   <p className="text-sm text-green-700">
  //                                     Review your AI-generated topics below. Each
  //                                     topic has been individually optimized for
  //                                     SEO and engagement.
  //                                   </p>
  //                                 </div>

  //                                 {/* Topics Preview */}
  //                                 <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-4">
  //                                   {interpretedData?.topics?.map(
  //                                     (topic: any, index: number) => (
  //                                       <div
  //                                         key={index}
  //                                         className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
  //                                       >
  //                                         <div className="flex items-start justify-between mb-3">
  //                                           <h5 className="font-medium text-gray-900 flex-1 pr-4">
  //                                             {index + 1}. {topic.topic}
  //                                           </h5>
  //                                           <Badge
  //                                             variant="outline"
  //                                             className={`${
  //                                               topic.priority === "high"
  //                                                 ? "border-red-300 text-red-700 bg-red-50"
  //                                                 : topic.priority === "medium"
  //                                                   ? "border-yellow-300 text-yellow-700 bg-yellow-50"
  //                                                   : "border-gray-300 text-gray-700 bg-gray-50"
  //                                             }`}
  //                                           >
  //                                             {topic.priority}
  //                                           </Badge>
  //                                         </div>

  //                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
  //                                           <div>
  //                                             <span className="font-medium">
  //                                               Audience:
  //                                             </span>{" "}
  //                                             {topic.audience}
  //                                           </div>
  //                                           <div>
  //                                             <span className="font-medium">
  //                                               Tone:
  //                                             </span>{" "}
  //                                             {topic.tone}
  //                                           </div>
  //                                           <div>
  //                                             <span className="font-medium">
  //                                               Length:
  //                                             </span>{" "}
  //                                             {topic.length}
  //                                           </div>
  //                                           {topic.scheduledAt && (
  //                                             <div>
  //                                               <span className="font-medium">
  //                                                 Scheduled:
  //                                               </span>{" "}
  //                                               {new Date(
  //                                                 topic.scheduledAt
  //                                               ).toLocaleString()}
  //                                             </div>
  //                                           )}
  //                                         </div>

  //                                         {topic.additionalRequirements && (
  //                                           <div className="mt-3 text-sm">
  //                                             <span className="font-medium text-gray-700">
  //                                               Requirements:
  //                                             </span>
  //                                             <p className="text-gray-600 mt-1">
  //                                               {topic.additionalRequirements}
  //                                             </p>
  //                                           </div>
  //                                         )}

  //                                         {topic.tags &&
  //                                           topic.tags.length > 0 && (
  //                                             <div className="mt-3 flex flex-wrap gap-1">
  //                                               {topic.tags.map(
  //                                                 (
  //                                                   tag: string,
  //                                                   tagIndex: number
  //                                                 ) => (
  //                                                   <Badge
  //                                                     key={tagIndex}
  //                                                     variant="secondary"
  //                                                     className="text-xs"
  //                                                   >
  //                                                     {tag}
  //                                                   </Badge>
  //                                                 )
  //                                               )}
  //                                             </div>
  //                                           )}

  //                                         <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
  //                                           <span className="flex items-center gap-1">
  //                                             <ImageIcon className="h-3 w-3" />
  //                                             Images:{" "}
  //                                             {topic.includeImages ? "Yes" : "No"}
  //                                           </span>
  //                                           <span className="flex items-center gap-1">
  //                                             <AlertCircle className="h-3 w-3" />
  //                                             Callouts:{" "}
  //                                             {topic.includeCallouts
  //                                               ? "Yes"
  //                                               : "No"}
  //                                           </span>
  //                                           <span className="flex items-center gap-1">
  //                                             <MousePointer className="h-3 w-3" />
  //                                             CTA:{" "}
  //                                             {topic.includeCTA ? "Yes" : "No"}
  //                                           </span>
  //                                         </div>
  //                                       </div>
  //                                     )
  //                                   )}
  //                                 </div>

  //                                 {/* Action Buttons */}
  //                                 <div className="flex gap-3 pt-4 border-t">
  //                                   <Button
  //                                     onClick={handleCreateTopicsFromAI}
  //                                     disabled={isBulkImporting}
  //                                     className="flex-1 bg-green-600 hover:bg-green-700"
  //                                   >
  //                                     {isBulkImporting ? (
  //                                       <>
  //                                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                                         Creating Topics...
  //                                       </>
  //                                     ) : (
  //                                       <>
  //                                         <CheckCircle className="h-4 w-4 mr-2" />
  //                                         Create{" "}
  //                                         {interpretedData?.topics?.length ||
  //                                           0}{" "}
  //                                         Topics
  //                                       </>
  //                                     )}
  //                                   </Button>
  //                                   <Button
  //                                     variant="outline"
  //                                     onClick={handleDiscardTopics}
  //                                     disabled={isBulkImporting}
  //                                   >
  //                                     <ArrowLeft className="h-4 w-4 mr-2" />
  //                                     Back to Form
  //                                   </Button>
  //                                 </div>
  //                               </div>
  //                             )}
  //                           </TabsContent>

  //                           {/* JSON Import Tab - Original functionality */}
  //                           <TabsContent
  //                             value="json-import"
  //                             className="space-y-4"
  //                           >
  //                             <div className="flex gap-2 mb-4">
  //                               <Button
  //                                 variant="outline"
  //                                 onClick={loadBulkTemplate}
  //                                 disabled={isBulkImporting || isInterpreting}
  //                               >
  //                                 <Code className="h-4 w-4 mr-2" />
  //                                 Load Template
  //                               </Button>
  //                               <Button
  //                                 variant="outline"
  //                                 onClick={() => setBulkTopicsInput("")}
  //                                 disabled={isBulkImporting || isInterpreting}
  //                               >
  //                                 Clear
  //                               </Button>
  //                             </div>
  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 JSON Topics Data
  //                               </label>
  //                               <Textarea
  //                                 value={bulkTopicsInput}
  //                                 onChange={(e) =>
  //                                   setBulkTopicsInput(e.target.value)
  //                                 }
  //                                 placeholder={`{
  //   "defaultSettings": {
  //     "audience": "Working professionals and entrepreneurs",
  //     "tone": "Professional but approachable",
  //     "length": "Medium (800-1200 words)",
  //     "includeImages": true,
  //     "includeCallouts": true,
  //     "includeCTA": true,
  //     "priority": "medium",
  //     "imageContext": "Modern, clean design with professional business aesthetic",
  //     "tags": ["business", "productivity"]
  //   },
  //   "topics": [
  //     {
  //       "topic": "The Psychology of Remote Work: Maintaining Productivity and Mental Health",
  //       "audience": "Remote workers and team managers",
  //       "additionalRequirements": "Include statistics about remote work trends",
  //       "priority": "high",
  //       "referenceImages": ["team-meeting", "productivity-chart"],
  //       "scheduledAt": "2024-12-25T10:00:00",
  //       "tags": ["remote-work", "psychology", "productivity"]
  //     }
  //   ]
  // }`}
  //                                 className="min-h-[400px] font-mono text-sm"
  //                                 disabled={isBulkImporting || isInterpreting}
  //                               />
  //                             </div>
  //                             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  //                               <h4 className="font-medium text-blue-900 mb-2">
  //                                 Format Guidelines:
  //                               </h4>
  //                               <ul className="text-sm text-blue-700 space-y-1">
  //                                 <li>
  //                                   • Use <code>defaultSettings</code> to set
  //                                   common values for all topics
  //                                 </li>
  //                                 <li>
  //                                   • Individual topics can override default
  //                                   settings
  //                                 </li>
  //                                 <li>
  //                                   • Only <code>topic</code> field is required
  //                                   for each topic
  //                                 </li>
  //                                 <li>• Maximum 50 topics per import</li>
  //                                 <li>
  //                                   • <strong>Scheduled Dates:</strong> Use{" "}
  //                                   <code>
  //                                     "scheduledAt": "2024-12-25T10:00:00"
  //                                   </code>{" "}
  //                                   for automatic generation
  //                                 </li>
  //                                 <li>
  //                                   • Use "Load Template" to see full example with
  //                                   all options
  //                                 </li>
  //                               </ul>
  //                             </div>
  //                           </TabsContent>
  //                         </Tabs>

  //                         {/* Action Buttons */}
  //                         <div className="flex gap-2 justify-end border-t pt-4">
  //                           <Button
  //                             variant="outline"
  //                             onClick={() => {
  //                               setShowBulkTopicsDialog(false);
  //                               setBulkTopicsInput("");
  //                               setBulkUploadFile(null);
  //                               setBrandContext("");
  //                               setBrandExamplesFile(null);
  //                               setInterpretedData(null);
  //                               setShowInterpretedPreview(false);
  //                               setSelectedExistingImagesForBulk([]);
  //                               setShowImageSelection(false);
  //                             }}
  //                             disabled={isBulkImporting || isInterpreting}
  //                           >
  //                             Cancel
  //                           </Button>
  //                           <Button
  //                             onClick={handleBulkImport}
  //                             disabled={
  //                               isBulkImporting ||
  //                               isInterpreting ||
  //                               !bulkTopicsInput.trim()
  //                             }
  //                           >
  //                             {isBulkImporting ? (
  //                               <>
  //                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                                 Importing...
  //                               </>
  //                             ) : (
  //                               <>
  //                                 <Upload className="h-4 w-4 mr-2" />
  //                                 Import Topics
  //                               </>
  //                             )}
  //                           </Button>
  //                         </div>
  //                       </DialogContent>
  //                     </Dialog>

  //                     {/* AI Preview Dialog */}
  //                     <Dialog
  //                       open={showInterpretedPreview}
  //                       onOpenChange={setShowInterpretedPreview}
  //                     >
  //                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
  //                         <DialogHeader>
  //                           <DialogTitle>AI-Generated Topics Preview</DialogTitle>
  //                           <DialogDescription>
  //                             Review the AI-generated topics before importing. You
  //                             can edit the JSON or use it as-is.
  //                           </DialogDescription>
  //                         </DialogHeader>
  //                         <div className="space-y-4">
  //                           {interpretedData && (
  //                             <>
  //                               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
  //                                 <h4 className="font-medium text-green-900 mb-2">
  //                                   ✨ Generated{" "}
  //                                   {interpretedData.topics?.length || 0} topics
  //                                 </h4>
  //                                 <p className="text-sm text-green-700">
  //                                   AI has processed your input and generated
  //                                   structured blog topics. Review and edit if
  //                                   needed.
  //                                 </p>
  //                               </div>
  //                               <div>
  //                                 <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                   Generated JSON (Editable)
  //                                 </label>
  //                                 <Textarea
  //                                   value={JSON.stringify(
  //                                     interpretedData,
  //                                     null,
  //                                     2
  //                                   )}
  //                                   onChange={(e) => {
  //                                     try {
  //                                       const parsed = JSON.parse(e.target.value);
  //                                       setInterpretedData(parsed);
  //                                     } catch (error) {
  //                                       // Invalid JSON, don't update
  //                                     }
  //                                   }}
  //                                   className="min-h-[400px] font-mono text-sm"
  //                                 />
  //                               </div>
  //                             </>
  //                           )}
  //                           <div className="flex gap-2 justify-end border-t pt-4">
  //                             <Button
  //                               variant="outline"
  //                               onClick={() => setShowInterpretedPreview(false)}
  //                             >
  //                               Cancel
  //                             </Button>
  //                             <Button
  //                               onClick={handleUseInterpretedData}
  //                               className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
  //                             >
  //                               <CheckCircle className="h-4 w-4 mr-2" />
  //                               Use These Topics
  //                             </Button>
  //                           </div>
  //                         </div>
  //                       </DialogContent>
  //                     </Dialog>
  //                     <Dialog
  //                       open={showAddTopicDialog}
  //                       onOpenChange={setShowAddTopicDialog}
  //                     >
  //                       <DialogTrigger asChild>
  //                         <Button>
  //                           <Plus className="h-4 w-4 mr-2" />
  //                           Add Topic
  //                         </Button>
  //                       </DialogTrigger>
  //                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
  //                         <DialogHeader>
  //                           <DialogTitle>Create New Topic</DialogTitle>
  //                           <DialogDescription>
  //                             Add a new topic to the queue for AI blog generation
  //                           </DialogDescription>
  //                         </DialogHeader>

  //                         <div className="space-y-6 py-4">
  //                           {/* Basic Topic Info */}
  //                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                             <div className="md:col-span-2">
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Topic Title *
  //                               </label>
  //                               <Input
  //                                 value={topicForm.topic}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     topic: e.target.value,
  //                                   }))
  //                                 }
  //                                 placeholder="e.g., The Future of Remote Work in 2025"
  //                                 className="w-full"
  //                               />
  //                             </div>

  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Target Audience
  //                               </label>
  //                               <Input
  //                                 value={topicForm.audience}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     audience: e.target.value,
  //                                   }))
  //                                 }
  //                                 placeholder="e.g., Working professionals and entrepreneurs"
  //                               />
  //                             </div>

  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Tone
  //                               </label>
  //                               <Select
  //                                 value={topicForm.tone}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     tone: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="Professional but approachable">
  //                                     Professional but approachable
  //                                   </SelectItem>
  //                                   <SelectItem value="Casual and friendly">
  //                                     Casual and friendly
  //                                   </SelectItem>
  //                                   <SelectItem value="Technical and authoritative">
  //                                     Technical and authoritative
  //                                   </SelectItem>
  //                                   <SelectItem value="Conversational">
  //                                     Conversational
  //                                   </SelectItem>
  //                                   <SelectItem value="Formal and academic">
  //                                     Formal and academic
  //                                   </SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>

  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Length
  //                               </label>
  //                               <Select
  //                                 value={topicForm.length}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     length: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="Short (400-600 words)">
  //                                     Short (400-600 words)
  //                                   </SelectItem>
  //                                   <SelectItem value="Medium (800-1200 words)">
  //                                     Medium (800-1200 words)
  //                                   </SelectItem>
  //                                   <SelectItem value="Long (1200-1500 words)">
  //                                     Long (1200-1500 words)
  //                                   </SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>

  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Priority
  //                               </label>
  //                               <Select
  //                                 value={topicForm.priority}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     priority: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="low">Low</SelectItem>
  //                                   <SelectItem value="medium">Medium</SelectItem>
  //                                   <SelectItem value="high">High</SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>
  //                           </div>

  //                           {/* Content Options */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-3 block">
  //                               Content Options
  //                             </label>
  //                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //                               <div className="flex items-center space-x-2">
  //                                 <Checkbox
  //                                   id="includeImages"
  //                                   checked={topicForm.includeImages}
  //                                   onCheckedChange={(checked) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeImages: !!checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <label
  //                                   htmlFor="includeImages"
  //                                   className="text-sm text-gray-700"
  //                                 >
  //                                   Include Images
  //                                 </label>
  //                               </div>
  //                               <div className="flex items-center space-x-2">
  //                                 <Checkbox
  //                                   id="includeCallouts"
  //                                   checked={topicForm.includeCallouts}
  //                                   onCheckedChange={(checked) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeCallouts: !!checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <label
  //                                   htmlFor="includeCallouts"
  //                                   className="text-sm text-gray-700"
  //                                 >
  //                                   Include Callouts
  //                                 </label>
  //                               </div>
  //                               <div className="flex items-center space-x-2">
  //                                 <Checkbox
  //                                   id="includeCTA"
  //                                   checked={topicForm.includeCTA}
  //                                   onCheckedChange={(checked) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeCTA: !!checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <label
  //                                   htmlFor="includeCTA"
  //                                   className="text-sm text-gray-700"
  //                                 >
  //                                   Include CTA
  //                                 </label>
  //                               </div>
  //                             </div>
  //                           </div>

  //                           {/* Additional Requirements */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                               Additional Requirements
  //                             </label>
  //                             <Textarea
  //                               value={topicForm.additionalRequirements}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   additionalRequirements: e.target.value,
  //                                 }))
  //                               }
  //                               placeholder="Any specific requirements, keywords, or focus areas..."
  //                               rows={3}
  //                             />
  //                           </div>

  //                           {/* Image Context */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                               Image Style & Brand Context
  //                             </label>
  //                             <Textarea
  //                               value={topicForm.imageContext}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   imageContext: e.target.value,
  //                                 }))
  //                               }
  //                               placeholder="Describe your brand and desired image style: colors, design philosophy, inspiration, art style, mood and composition preferences..."
  //                               rows={3}
  //                             />
  //                           </div>

  //                           {/* Tags */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                               Tags
  //                             </label>
  //                             <div className="flex gap-2 mb-2">
  //                               <Input
  //                                 value={newTagInput}
  //                                 onChange={(e) => setNewTagInput(e.target.value)}
  //                                 placeholder="Add a tag..."
  //                                 onKeyPress={(e) =>
  //                                   e.key === "Enter" && addTag()
  //                                 }
  //                                 className="flex-1"
  //                               />
  //                               <Button
  //                                 type="button"
  //                                 variant="outline"
  //                                 onClick={addTag}
  //                                 disabled={!newTagInput.trim()}
  //                               >
  //                                 Add
  //                               </Button>
  //                             </div>
  //                             {topicForm.tags.length > 0 && (
  //                               <div className="flex flex-wrap gap-2">
  //                                 {topicForm.tags.map((tag, index) => (
  //                                   <Badge
  //                                     key={index}
  //                                     variant="secondary"
  //                                     className="cursor-pointer hover:bg-red-100"
  //                                     onClick={() => removeTag(tag)}
  //                                   >
  //                                     {tag} ×
  //                                   </Badge>
  //                                 ))}
  //                               </div>
  //                             )}
  //                           </div>

  //                           {/* Reference Images Section */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-3 block">
  //                               Reference Images (Optional)
  //                             </label>

  //                             {/* Existing Images */}
  //                             {images.length > 0 && (
  //                               <div className="mb-4">
  //                                 <h4 className="text-sm font-medium text-gray-600 mb-2">
  //                                   Select from existing images:
  //                                 </h4>
  //                                 <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto border rounded p-2">
  //                                   {images.slice(0, 20).map((image) => (
  //                                     <div
  //                                       key={image.fileId}
  //                                       className={`relative cursor-pointer rounded border-2 ${
  //                                         selectedExistingImages.includes(
  //                                           image.url
  //                                         )
  //                                           ? "border-blue-500 bg-blue-50"
  //                                           : "border-gray-200 hover:border-gray-300"
  //                                       }`}
  //                                       onClick={() =>
  //                                         handleImageSelect(image.url)
  //                                       }
  //                                     >
  //                                       <img
  //                                         src={image.thumbnailUrl}
  //                                         alt={image.name}
  //                                         className="w-full h-16 object-cover rounded"
  //                                       />
  //                                       {selectedExistingImages.includes(
  //                                         image.url
  //                                       ) && (
  //                                         <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
  //                                           ✓
  //                                         </div>
  //                                       )}
  //                                     </div>
  //                                   ))}
  //                                 </div>
  //                               </div>
  //                             )}

  //                             {/* Upload New Images */}
  //                             <div>
  //                               <h4 className="text-sm font-medium text-gray-600 mb-2">
  //                                 Or upload new reference images:
  //                               </h4>
  //                               <input
  //                                 type="file"
  //                                 accept="image/*"
  //                                 multiple
  //                                 onChange={(e) =>
  //                                   handleReferenceImageUpload(e.target.files)
  //                                 }
  //                                 className="hidden"
  //                                 id="reference-images"
  //                               />
  //                               <label htmlFor="reference-images">
  //                                 <Button type="button" variant="outline" asChild>
  //                                   <span className="cursor-pointer">
  //                                     <Upload className="h-4 w-4 mr-2" />
  //                                     Upload Images
  //                                   </span>
  //                                 </Button>
  //                               </label>

  //                               {newReferenceImages.length > 0 && (
  //                                 <div className="mt-2 grid grid-cols-4 gap-2">
  //                                   {newReferenceImages.map((file, index) => (
  //                                     <div key={index} className="relative">
  //                                       <img
  //                                         src={URL.createObjectURL(file)}
  //                                         alt={file.name}
  //                                         className="w-full h-16 object-cover rounded border"
  //                                       />
  //                                       <Button
  //                                         type="button"
  //                                         variant="destructive"
  //                                         size="sm"
  //                                         className="absolute top-1 right-1 w-4 h-4 p-0"
  //                                         onClick={() =>
  //                                           removeReferenceImage(index)
  //                                         }
  //                                       >
  //                                         ×
  //                                       </Button>
  //                                     </div>
  //                                   ))}
  //                                 </div>
  //                               )}
  //                               <p className="text-xs text-gray-500 mt-1">
  //                                 Upload up to 5 images to guide the AI's style
  //                                 and aesthetic
  //                               </p>
  //                             </div>
  //                           </div>

  //                           {/* Scheduled Date */}
  //                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Scheduled Generation Date (Optional)
  //                               </label>
  //                               <Input
  //                                 type="datetime-local"
  //                                 value={topicForm.scheduledAt}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     scheduledAt: e.target.value,
  //                                   }))
  //                                 }
  //                                 className="w-full"
  //                               />
  //                               <p className="text-xs text-gray-500 mt-1">
  //                                 When specified, the blog will be automatically
  //                                 generated at this date/time
  //                               </p>
  //                             </div>
  //                             <div>
  //                               <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                                 Estimated Duration (minutes)
  //                               </label>
  //                               <Input
  //                                 type="number"
  //                                 min="1"
  //                                 max="60"
  //                                 value={topicForm.estimatedDuration}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     estimatedDuration:
  //                                       parseInt(e.target.value) || 5,
  //                                   }))
  //                                 }
  //                                 placeholder="5"
  //                                 className="w-full"
  //                               />
  //                             </div>
  //                           </div>

  //                           {/* Notes */}
  //                           <div>
  //                             <label className="text-sm font-medium text-gray-700 mb-2 block">
  //                               Notes (Optional)
  //                             </label>
  //                             <Textarea
  //                               value={topicForm.notes}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   notes: e.target.value,
  //                                 }))
  //                               }
  //                               placeholder="Any additional notes or context..."
  //                               rows={2}
  //                             />
  //                           </div>
  //                         </div>

  //                         <div className="flex gap-2 justify-end border-t pt-4">
  //                           <Button
  //                             variant="outline"
  //                             onClick={() => {
  //                               resetTopicForm();
  //                               setShowAddTopicDialog(false);
  //                             }}
  //                             disabled={isCreatingTopic}
  //                           >
  //                             Cancel
  //                           </Button>
  //                           <Button
  //                             onClick={handleCreateTopic}
  //                             disabled={
  //                               isCreatingTopic || !topicForm.topic.trim()
  //                             }
  //                           >
  //                             {isCreatingTopic ? (
  //                               <>
  //                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                                 Creating...
  //                               </>
  //                             ) : (
  //                               <>
  //                                 <Plus className="h-4 w-4 mr-2" />
  //                                 Create Topic
  //                               </>
  //                             )}
  //                           </Button>
  //                         </div>
  //                       </DialogContent>
  //                     </Dialog>

  //                     {/* Edit Topic Dialog */}
  //                     <Dialog
  //                       open={showEditTopicDialog}
  //                       onOpenChange={setShowEditTopicDialog}
  //                     >
  //                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
  //                         <DialogHeader>
  //                           <DialogTitle>Edit Topic</DialogTitle>
  //                           <DialogDescription>
  //                             Update the topic details for AI blog generation
  //                           </DialogDescription>
  //                         </DialogHeader>

  //                         <div className="space-y-6 py-4">
  //                           {/* Basic Topic Info */}
  //                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-topic">Topic Title *</Label>
  //                               <Input
  //                                 id="edit-topic"
  //                                 placeholder="Enter your blog topic..."
  //                                 value={topicForm.topic}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     topic: e.target.value,
  //                                   }))
  //                                 }
  //                               />
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-audience">
  //                                 Target Audience
  //                               </Label>
  //                               <Input
  //                                 id="edit-audience"
  //                                 placeholder="e.g., Working professionals, entrepreneurs..."
  //                                 value={topicForm.audience}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     audience: e.target.value,
  //                                   }))
  //                                 }
  //                               />
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-tone">Tone</Label>
  //                               <Select
  //                                 value={topicForm.tone}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     tone: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="Professional">
  //                                     Professional
  //                                   </SelectItem>
  //                                   <SelectItem value="Professional but approachable">
  //                                     Professional but approachable
  //                                   </SelectItem>
  //                                   <SelectItem value="Casual">Casual</SelectItem>
  //                                   <SelectItem value="Technical">
  //                                     Technical
  //                                   </SelectItem>
  //                                   <SelectItem value="Friendly">
  //                                     Friendly
  //                                   </SelectItem>
  //                                   <SelectItem value="Authoritative">
  //                                     Authoritative
  //                                   </SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-length">
  //                                 Article Length
  //                               </Label>
  //                               <Select
  //                                 value={topicForm.length}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     length: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="Short (400-600 words)">
  //                                     Short (400-600 words)
  //                                   </SelectItem>
  //                                   <SelectItem value="Medium (800-1200 words)">
  //                                     Medium (800-1200 words)
  //                                   </SelectItem>
  //                                   <SelectItem value="Long (1200-1500 words)">
  //                                     Long (1200-1500 words)
  //                                   </SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-priority">Priority</Label>
  //                               <Select
  //                                 value={topicForm.priority}
  //                                 onValueChange={(value) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     priority: value,
  //                                   }))
  //                                 }
  //                               >
  //                                 <SelectTrigger>
  //                                   <SelectValue />
  //                                 </SelectTrigger>
  //                                 <SelectContent>
  //                                   <SelectItem value="low">Low</SelectItem>
  //                                   <SelectItem value="medium">Medium</SelectItem>
  //                                   <SelectItem value="high">High</SelectItem>
  //                                 </SelectContent>
  //                               </Select>
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-scheduled">
  //                                 Scheduled Date/Time
  //                               </Label>
  //                               <Input
  //                                 id="edit-scheduled"
  //                                 type="datetime-local"
  //                                 value={topicForm.scheduledAt}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     scheduledAt: e.target.value,
  //                                   }))
  //                                 }
  //                               />
  //                             </div>

  //                             <div className="space-y-2">
  //                               <Label htmlFor="edit-duration">
  //                                 Estimated Duration (minutes)
  //                               </Label>
  //                               <Input
  //                                 id="edit-duration"
  //                                 type="number"
  //                                 min="1"
  //                                 max="60"
  //                                 value={topicForm.estimatedDuration}
  //                                 onChange={(e) =>
  //                                   setTopicForm((prev) => ({
  //                                     ...prev,
  //                                     estimatedDuration:
  //                                       parseInt(e.target.value) || 5,
  //                                   }))
  //                                 }
  //                               />
  //                             </div>
  //                           </div>

  //                           {/* Content Options */}
  //                           <div className="space-y-4">
  //                             <Label>Content Options</Label>
  //                             <div className="flex flex-wrap gap-4">
  //                               <label className="flex items-center space-x-2">
  //                                 <input
  //                                   type="checkbox"
  //                                   checked={topicForm.includeImages}
  //                                   onChange={(e) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeImages: e.target.checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <span>Include Images</span>
  //                               </label>
  //                               <label className="flex items-center space-x-2">
  //                                 <input
  //                                   type="checkbox"
  //                                   checked={topicForm.includeCallouts}
  //                                   onChange={(e) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeCallouts: e.target.checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <span>Include Callouts</span>
  //                               </label>
  //                               <label className="flex items-center space-x-2">
  //                                 <input
  //                                   type="checkbox"
  //                                   checked={topicForm.includeCTA}
  //                                   onChange={(e) =>
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       includeCTA: e.target.checked,
  //                                     }))
  //                                   }
  //                                 />
  //                                 <span>Include Call-to-Action</span>
  //                               </label>
  //                             </div>
  //                           </div>

  //                           {/* Additional Requirements */}
  //                           <div className="space-y-2">
  //                             <Label htmlFor="edit-requirements">
  //                               Additional Requirements
  //                             </Label>
  //                             <Textarea
  //                               id="edit-requirements"
  //                               placeholder="Any specific requirements, key points to cover, or style preferences..."
  //                               value={topicForm.additionalRequirements}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   additionalRequirements: e.target.value,
  //                                 }))
  //                               }
  //                             />
  //                           </div>

  //                           {/* Image Context */}
  //                           <div className="space-y-2">
  //                             <Label htmlFor="edit-image-context">
  //                               Image Context
  //                             </Label>
  //                             <Textarea
  //                               id="edit-image-context"
  //                               placeholder="Context for image generation (style, mood, specific requirements)..."
  //                               value={topicForm.imageContext}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   imageContext: e.target.value,
  //                                 }))
  //                               }
  //                             />
  //                           </div>

  //                           {/* Reference Images */}
  //                           <div className="space-y-2">
  //                             <Label>Reference Images</Label>
  //                             {selectedExistingImages.length > 0 ? (
  //                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  //                                 {selectedExistingImages.map(
  //                                   (imageId, index) => {
  //                                     const image = images.find(
  //                                       (img) => img._id === imageId
  //                                     );
  //                                     return (
  //                                       <div
  //                                         key={index}
  //                                         className="relative group"
  //                                       >
  //                                         <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
  //                                           {image ? (
  //                                             <img
  //                                               src={image.url}
  //                                               alt={
  //                                                 image.alt || "Reference image"
  //                                               }
  //                                               className="w-full h-full object-cover"
  //                                             />
  //                                           ) : (
  //                                             <div className="w-full h-full flex items-center justify-center">
  //                                               <ImageIcon className="h-8 w-8 text-gray-400" />
  //                                             </div>
  //                                           )}
  //                                         </div>
  //                                         <Button
  //                                           size="sm"
  //                                           variant="destructive"
  //                                           className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
  //                                           onClick={() => {
  //                                             setSelectedExistingImages((prev) =>
  //                                               prev.filter(
  //                                                 (id) => id !== imageId
  //                                               )
  //                                             );
  //                                           }}
  //                                         >
  //                                           <Trash2 className="h-3 w-3" />
  //                                         </Button>
  //                                         {image && (
  //                                           <p className="text-xs text-gray-500 mt-1 truncate">
  //                                             {image.alt || "No description"}
  //                                           </p>
  //                                         )}
  //                                       </div>
  //                                     );
  //                                   }
  //                                 )}
  //                               </div>
  //                             ) : (
  //                               <p className="text-sm text-gray-500">
  //                                 No reference images selected
  //                               </p>
  //                             )}

  //                             <Button
  //                               type="button"
  //                               variant="outline"
  //                               onClick={() => setSelectedTab("images")}
  //                               className="mt-2"
  //                             >
  //                               <ImageIcon className="h-4 w-4 mr-2" />
  //                               Browse Images
  //                             </Button>
  //                           </div>

  //                           {/* Tags */}
  //                           <div className="space-y-2">
  //                             <Label htmlFor="edit-tags">Tags</Label>
  //                             <div className="flex flex-wrap gap-2 mb-2">
  //                               {topicForm.tags.map((tag, index) => (
  //                                 <Badge
  //                                   key={index}
  //                                   variant="secondary"
  //                                   className="flex items-center gap-1"
  //                                 >
  //                                   {tag}
  //                                   <button
  //                                     type="button"
  //                                     onClick={() =>
  //                                       setTopicForm((prev) => ({
  //                                         ...prev,
  //                                         tags: prev.tags.filter(
  //                                           (_, i) => i !== index
  //                                         ),
  //                                       }))
  //                                     }
  //                                     className="ml-1 text-xs hover:text-red-500"
  //                                   >
  //                                     ×
  //                                   </button>
  //                                 </Badge>
  //                               ))}
  //                             </div>
  //                             <div className="flex gap-2">
  //                               <Input
  //                                 placeholder="Add tag..."
  //                                 value={newTagInput}
  //                                 onChange={(e) => setNewTagInput(e.target.value)}
  //                                 onKeyDown={(e) => {
  //                                   if (e.key === "Enter" && newTagInput.trim()) {
  //                                     e.preventDefault();
  //                                     if (
  //                                       !topicForm.tags.includes(
  //                                         newTagInput.trim()
  //                                       )
  //                                     ) {
  //                                       setTopicForm((prev) => ({
  //                                         ...prev,
  //                                         tags: [
  //                                           ...prev.tags,
  //                                           newTagInput.trim(),
  //                                         ],
  //                                       }));
  //                                     }
  //                                     setNewTagInput("");
  //                                   }
  //                                 }}
  //                               />
  //                               <Button
  //                                 type="button"
  //                                 variant="outline"
  //                                 onClick={() => {
  //                                   if (
  //                                     newTagInput.trim() &&
  //                                     !topicForm.tags.includes(newTagInput.trim())
  //                                   ) {
  //                                     setTopicForm((prev) => ({
  //                                       ...prev,
  //                                       tags: [...prev.tags, newTagInput.trim()],
  //                                     }));
  //                                     setNewTagInput("");
  //                                   }
  //                                 }}
  //                               >
  //                                 Add
  //                               </Button>
  //                             </div>
  //                           </div>

  //                           {/* Notes */}
  //                           <div className="space-y-2">
  //                             <Label htmlFor="edit-notes">Notes</Label>
  //                             <Textarea
  //                               id="edit-notes"
  //                               placeholder="Internal notes about this topic..."
  //                               value={topicForm.notes}
  //                               onChange={(e) =>
  //                                 setTopicForm((prev) => ({
  //                                   ...prev,
  //                                   notes: e.target.value,
  //                                 }))
  //                               }
  //                             />
  //                           </div>
  //                         </div>

  //                         <div className="flex gap-2 justify-end border-t pt-4">
  //                           <Button
  //                             variant="outline"
  //                             onClick={() => setShowEditTopicDialog(false)}
  //                           >
  //                             Cancel
  //                           </Button>
  //                           <Button
  //                             onClick={handleUpdateTopic}
  //                             disabled={
  //                               isUpdatingTopic || !topicForm.topic.trim()
  //                             }
  //                           >
  //                             {isUpdatingTopic ? (
  //                               <>
  //                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                                 Updating...
  //                               </>
  //                             ) : (
  //                               <>
  //                                 <Edit className="h-4 w-4 mr-2" />
  //                                 Update Topic
  //                               </>
  //                             )}
  //                           </Button>
  //                         </div>
  //                       </DialogContent>
  //                     </Dialog>
  //                   </div>
  //                 </div>
  //               </CardHeader>
  //               <CardContent>
  //                 {isLoadingTopics ? (
  //                   <div className="flex items-center justify-center py-12">
  //                     <Loader2 className="h-8 w-8 animate-spin mr-2" />
  //                     <span>Loading topics...</span>
  //                   </div>
  //                 ) : topics.length === 0 ? (
  //                   <div className="text-center py-8">
  //                     <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
  //                     <p className="text-gray-500 mb-2">No topics in queue</p>
  //                     <p className="text-sm text-gray-400 mb-4">
  //                       Add topics for automatic blog generation
  //                     </p>
  //                     <Button onClick={() => router.push('/blog/admin/bulk')}>
  //                       <Zap className="h-4 w-4 mr-2" />
  //                       Add Topics
  //                     </Button>
  //                   </div>
  //                 ) : (
  //                   <div className="space-y-4">
  //                     {topics.map((topic) => (
  //                       <div
  //                         key={topic._id}
  //                         className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
  //                           selectedTopics.includes(topic._id)
  //                             ? "bg-blue-50 border-blue-200"
  //                             : ""
  //                         }`}
  //                       >
  //                         {/* Selection checkbox */}
  //                         {(topic.status === "pending" ||
  //                           topic.status === "failed") && (
  //                           <Checkbox
  //                             checked={selectedTopics.includes(topic._id)}
  //                             onCheckedChange={() =>
  //                               toggleTopicSelection(topic._id)
  //                             }
  //                             className="flex-shrink-0"
  //                           />
  //                         )}

  //                         <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //                           {getStatusIcon(topic.status)}
  //                         </div>
  //                         <div className="flex-1 min-w-0">
  //                           <h3 className="font-medium text-gray-900 truncate">
  //                             {topic.topic}
  //                           </h3>
  //                           <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
  //                             <span className="flex items-center gap-1">
  //                               <Clock className="h-4 w-4" />
  //                               {new Date(topic.createdAt).toLocaleDateString()}
  //                             </span>
  //                             {topic.scheduledAt && (
  //                               <span className="flex items-center gap-1 text-blue-600">
  //                                 <Calendar className="h-4 w-4" />
  //                                 Scheduled:{" "}
  //                                 {new Date(topic.scheduledAt).toLocaleString()}
  //                               </span>
  //                             )}
  //                             {topic.estimatedDuration && (
  //                               <span>{topic.estimatedDuration} min est.</span>
  //                             )}
  //                             <span className="capitalize">
  //                               {topic.priority} priority
  //                             </span>
  //                           </div>
  //                           {topic.tags && topic.tags.length > 0 && (
  //                             <div className="flex items-center gap-2 mt-2">
  //                               {topic.tags.map((tag: string, index: number) => (
  //                                 <Badge
  //                                   key={index}
  //                                   variant="outline"
  //                                   className="text-xs"
  //                                 >
  //                                   {tag}
  //                                 </Badge>
  //                               ))}
  //                             </div>
  //                           )}
  //                           {topic.audience && (
  //                             <p className="text-xs text-gray-500 mt-1 truncate">
  //                               Audience: {topic.audience}
  //                             </p>
  //                           )}
  //                           {topic.errorMessage && (
  //                             <p className="text-xs text-red-600 mt-1 truncate">
  //                               Error: {topic.errorMessage}
  //                             </p>
  //                           )}
  //                         </div>
  //                         <div className="flex items-center gap-2">
  //                           <Badge
  //                             variant="secondary"
  //                             className={getStatusBadge(topic.status)}
  //                           >
  //                             {topic.status}
  //                           </Badge>
  //                           {topic.status === "pending" && (
  //                             <Button
  //                               variant="ghost"
  //                               size="sm"
  //                               onClick={() => handleGenerateTopic(topic._id)}
  //                               title="Generate blog post"
  //                             >
  //                               <PlayCircle className="h-4 w-4" />
  //                             </Button>
  //                           )}
  //                           {topic.status === "failed" && (
  //                             <Button
  //                               variant="ghost"
  //                               size="sm"
  //                               onClick={() => handleGenerateTopic(topic._id)}
  //                               title="Retry generation"
  //                             >
  //                               <PlayCircle className="h-4 w-4" />
  //                             </Button>
  //                           )}
  //                           {topic.status === "completed" &&
  //                             topic.generatedPostId && (
  //                               <Button
  //                                 variant="ghost"
  //                                 size="sm"
  //                                 onClick={() =>
  //                                   handleEditPost(topic.generatedPostId)
  //                                 }
  //                                 title="View generated post"
  //                               >
  //                                 <Eye className="h-4 w-4" />
  //                               </Button>
  //                             )}
  //                           <Button
  //                             variant="ghost"
  //                             size="sm"
  //                             onClick={() => handleEditTopic(topic)}
  //                             title="Edit topic"
  //                           >
  //                             <Edit className="h-4 w-4" />
  //                           </Button>
  //                           <Button
  //                             variant="ghost"
  //                             size="sm"
  //                             onClick={() => handleDeleteTopic(topic._id)}
  //                             title="Delete topic"
  //                           >
  //                             <Trash2 className="h-4 w-4" />
  //                           </Button>
  //                         </div>
  //                       </div>
  //                     ))}
  //                   </div>
  //                 )}
  //               </CardContent>
  //             </Card>

  //             {/* Queue Statistics */}
  //             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  //               <Card>
  //                 <CardContent className="p-4">
  //                   <div className="flex items-center gap-2">
  //                     <Clock className="h-5 w-5 text-blue-600" />
  //                     <div>
  //                       <p className="text-2xl font-bold">
  //                         {topicStats.pending || 0}
  //                       </p>
  //                       <p className="text-sm text-gray-600">Pending</p>
  //                     </div>
  //                   </div>
  //                 </CardContent>
  //               </Card>
  //               <Card>
  //                 <CardContent className="p-4">
  //                   <div className="flex items-center gap-2">
  //                     <Loader2 className="h-5 w-5 text-purple-600" />
  //                     <div>
  //                       <p className="text-2xl font-bold">
  //                         {topicStats.generating || 0}
  //                       </p>
  //                       <p className="text-sm text-gray-600">Generating</p>
  //                     </div>
  //                   </div>
  //                 </CardContent>
  //               </Card>
  //               <Card>
  //                 <CardContent className="p-4">
  //                   <div className="flex items-center gap-2">
  //                     <CheckCircle className="h-5 w-5 text-green-600" />
  //                     <div>
  //                       <p className="text-2xl font-bold">
  //                         {topicStats.completed || 0}
  //                       </p>
  //                       <p className="text-sm text-gray-600">Completed</p>
  //                     </div>
  //                   </div>
  //                 </CardContent>
  //               </Card>
  //               <Card>
  //                 <CardContent className="p-4">
  //                   <div className="flex items-center gap-2">
  //                     <AlertTriangle className="h-5 w-5 text-red-600" />
  //                     <div>
  //                       <p className="text-2xl font-bold">
  //                         {topicStats.failed || 0}
  //                       </p>
  //                       <p className="text-sm text-gray-600">Failed</p>
  //                     </div>
  //                   </div>
  //                 </CardContent>
  //               </Card>
  //             </div>
  //           </TabsContent>

  //           {/* Images Tab */}
  //           <TabsContent value="images" className="space-y-6">
  //             <Card>
  //               <CardHeader>
  //                 <div className="flex items-center justify-between">
  //                   <CardTitle className="flex items-center gap-2">
  //                     <ImageIcon className="h-5 w-5" />
  //                     Image Library
  //                   </CardTitle>
  //                   <div className="flex items-center gap-2">
  //                     <input
  //                       type="file"
  //                       accept="image/*"
  //                       onChange={handleFileSelect}
  //                       className="hidden"
  //                       id="image-upload"
  //                       disabled={isUploading}
  //                     />
  //                     <label htmlFor="image-upload">
  //                       <Button asChild disabled={isUploading}>
  //                         <span className="cursor-pointer">
  //                           {isUploading ? (
  //                             <>
  //                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  //                               Uploading...
  //                             </>
  //                           ) : (
  //                             <>
  //                               <Upload className="h-4 w-4 mr-2" />
  //                               Upload Images
  //                             </>
  //                           )}
  //                         </span>
  //                       </Button>
  //                     </label>
  //                   </div>
  //                 </div>
  //                 {isUploading && (
  //                   <div className="mt-4">
  //                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
  //                       <span>Uploading to ImageKit...</span>
  //                       <span>{uploadProgress}%</span>
  //                     </div>
  //                     <div className="w-full bg-gray-200 rounded-full h-2">
  //                       <div
  //                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
  //                         style={{ width: `${uploadProgress}%` }}
  //                       />
  //                     </div>
  //                   </div>
  //                 )}
  //               </CardHeader>
  //               <CardContent>
  //                 {isLoadingImages ? (
  //                   <div className="flex items-center justify-center py-12">
  //                     <Loader2 className="h-8 w-8 animate-spin mr-2" />
  //                     <span>Loading images...</span>
  //                   </div>
  //                 ) : images.length === 0 ? (
  //                   <div className="text-center py-12">
  //                     <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
  //                     <p className="text-gray-500 mb-2">No images uploaded yet</p>
  //                     <p className="text-sm text-gray-400 mb-4">
  //                       Upload images to your ImageKit library
  //                     </p>
  //                     <label htmlFor="image-upload">
  //                       <Button asChild>
  //                         <span className="cursor-pointer">
  //                           <Upload className="h-4 w-4 mr-2" />
  //                           Upload Your First Image
  //                         </span>
  //                       </Button>
  //                     </label>
  //                   </div>
  //                 ) : (
  //                   <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
  //                     {images.map((image: any) => (
  //                       <Card
  //                         key={image.fileId}
  //                         className="hover:shadow-md transition-shadow"
  //                       >
  //                         <div className="aspect-square bg-gray-100 rounded-t-lg relative overflow-hidden">
  //                           <img
  //                             src={image.thumbnailUrl}
  //                             alt={image.name}
  //                             className="w-full h-full object-cover"
  //                             loading="lazy"
  //                           />
  //                           <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
  //                             {image.format.toUpperCase()}
  //                           </div>
  //                         </div>
  //                         <CardContent className="p-3">
  //                           <p className="font-medium text-sm text-gray-900 mb-1 truncate">
  //                             {image.name}
  //                           </p>
  //                           <p className="text-xs text-gray-600 mb-1">
  //                             {formatFileSize(image.size)}
  //                           </p>
  //                           <p className="text-xs text-gray-500 mb-2">
  //                             {image.width} × {image.height}
  //                           </p>
  //                           <div className="flex items-center justify-between">
  //                             <Badge variant="outline" className="text-xs">
  //                               ImageKit
  //                             </Badge>
  //                             <DropdownMenu>
  //                               <DropdownMenuTrigger asChild>
  //                                 <Button size="sm" variant="ghost">
  //                                   <ChevronDown className="h-3 w-3" />
  //                                 </Button>
  //                               </DropdownMenuTrigger>
  //                               <DropdownMenuContent align="end">
  //                                 <DropdownMenuItem
  //                                   onClick={() =>
  //                                     window.open(image.url, "_blank")
  //                                   }
  //                                 >
  //                                   <Eye className="h-4 w-4 mr-2" />
  //                                   View Full Size
  //                                 </DropdownMenuItem>
  //                                 <DropdownMenuItem
  //                                   onClick={() => copyImageUrl(image.url)}
  //                                 >
  //                                   <Copy className="h-4 w-4 mr-2" />
  //                                   Copy URL
  //                                 </DropdownMenuItem>
  //                                 <DropdownMenuItem
  //                                   onClick={() =>
  //                                     copyImageUrl(image.thumbnailUrl)
  //                                   }
  //                                 >
  //                                   <Copy className="h-4 w-4 mr-2" />
  //                                   Copy Thumbnail URL
  //                                 </DropdownMenuItem>
  //                                 <DropdownMenuItem
  //                                   className="text-red-600"
  //                                   onClick={() => deleteImage(image.fileId)}
  //                                 >
  //                                   <Trash2 className="h-4 w-4 mr-2" />
  //                                   Delete
  //                                 </DropdownMenuItem>
  //                               </DropdownMenuContent>
  //                             </DropdownMenu>
  //                           </div>
  //                         </CardContent>
  //                       </Card>
  //                     ))}
  //                   </div>
  //                 )}
  //               </CardContent>
  //             </Card>

  //             {/* Image Statistics */}
  //             {images.length > 0 && (
  //               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  //                 <Card>
  //                   <CardContent className="p-4">
  //                     <div className="flex items-center gap-2">
  //                       <ImageIcon className="h-5 w-5 text-blue-600" />
  //                       <div>
  //                         <p className="text-2xl font-bold">{images.length}</p>
  //                         <p className="text-sm text-gray-600">Total Images</p>
  //                       </div>
  //                     </div>
  //                   </CardContent>
  //                 </Card>
  //                 <Card>
  //                   <CardContent className="p-4">
  //                     <div className="flex items-center gap-2">
  //                       <Upload className="h-5 w-5 text-green-600" />
  //                       <div>
  //                         <p className="text-2xl font-bold">
  //                           {formatFileSize(
  //                             images.reduce((total, img) => total + img.size, 0)
  //                           )}
  //                         </p>
  //                         <p className="text-sm text-gray-600">Total Size</p>
  //                       </div>
  //                     </div>
  //                   </CardContent>
  //                 </Card>
  //                 <Card>
  //                   <CardContent className="p-4">
  //                     <div className="flex items-center gap-2">
  //                       <FileText className="h-5 w-5 text-purple-600" />
  //                       <div>
  //                         <p className="text-2xl font-bold">
  //                           {
  //                             images.filter(
  //                               (img) =>
  //                                 img.format === "jpg" || img.format === "jpeg"
  //                             ).length
  //                           }
  //                         </p>
  //                         <p className="text-sm text-gray-600">JPG Images</p>
  //                       </div>
  //                     </div>
  //                   </CardContent>
  //                 </Card>
  //                 <Card>
  //                   <CardContent className="p-4">
  //                     <div className="flex items-center gap-2">
  //                       <Eye className="h-5 w-5 text-orange-600" />
  //                       <div>
  //                         <p className="text-2xl font-bold">
  //                           {images.filter((img) => img.format === "png").length}
  //                         </p>
  //                         <p className="text-sm text-gray-600">PNG Images</p>
  //                       </div>
  //                     </div>
  //                   </CardContent>
  //                 </Card>
  //               </div>
  //             )}
  //           </TabsContent>

  //           {/* Scheduler/Monitoring Tab */}
  //           <TabsContent value="scheduler" className="space-y-6">
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle className="flex items-center gap-2">
  //                   <Clock className="h-5 w-5" />
  //                   Automated Scheduler Monitor
  //                 </CardTitle>
  //                 <CardContent className="p-6">
  //                   <div className="text-sm text-gray-600 mb-4">
  //                     Monitor the automated blog post generation system and cron
  //                     job performance.
  //                   </div>
  //                 </CardContent>
  //               </CardHeader>
  //             </Card>

  //             {/* Scheduler Status */}
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle>Agenda.js Scheduler Status</CardTitle>
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //                   <div className="p-4 border rounded-lg">
  //                     <div className="flex items-center gap-2 mb-2">
  //                       <CheckCircle className="h-4 w-4 text-green-600" />
  //                       <span className="font-medium">Status</span>
  //                     </div>
  //                     <div className="text-2xl font-bold text-green-600">
  //                       Active
  //                     </div>
  //                     <div className="text-sm text-gray-500">
  //                       Individual job scheduling
  //                     </div>
  //                   </div>

  //                   <div className="p-4 border rounded-lg">
  //                     <div className="flex items-center gap-2 mb-2">
  //                       <Clock className="h-4 w-4 text-blue-600" />
  //                       <span className="font-medium">Scheduled Jobs</span>
  //                     </div>
  //                     <div className="text-2xl font-bold text-blue-600">
  //                       {
  //                         topics.filter(
  //                           (topic) =>
  //                             topic.scheduledAt &&
  //                             new Date(topic.scheduledAt) > new Date() &&
  //                             topic.status === "pending"
  //                         ).length
  //                       }
  //                     </div>
  //                     <div className="text-sm text-gray-500">
  //                       Pending execution
  //                     </div>
  //                   </div>

  //                   <div className="p-4 border rounded-lg">
  //                     <div className="flex items-center gap-2 mb-2">
  //                       <Zap className="h-4 w-4 text-purple-600" />
  //                       <span className="font-medium">Concurrency</span>
  //                     </div>
  //                     <div className="text-2xl font-bold text-purple-600">3</div>
  //                     <div className="text-sm text-gray-500">
  //                       Max concurrent jobs
  //                     </div>
  //                   </div>
  //                 </div>
  //               </CardContent>
  //             </Card>

  //             {/* Scheduled Topics */}
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle>Upcoming Scheduled Posts</CardTitle>
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="space-y-2">
  //                   {topics
  //                     .filter(
  //                       (topic) =>
  //                         topic.scheduledAt &&
  //                         new Date(topic.scheduledAt) > new Date() &&
  //                         topic.status === "pending"
  //                     )
  //                     .sort(
  //                       (a, b) =>
  //                         new Date(a.scheduledAt).getTime() -
  //                         new Date(b.scheduledAt).getTime()
  //                     )
  //                     .slice(0, 20)
  //                     .map((topic) => (
  //                       <div
  //                         key={topic._id}
  //                         className="flex items-center justify-between p-3 border rounded-lg"
  //                       >
  //                         <div>
  //                           <div className="font-medium truncate max-w-md">
  //                             {topic.topic}
  //                           </div>
  //                           <div className="text-sm text-gray-500">
  //                             Scheduled:{" "}
  //                             {new Date(topic.scheduledAt).toLocaleString()}
  //                           </div>
  //                         </div>
  //                         <Badge
  //                           variant="secondary"
  //                           className={`${
  //                             topic.priority === "high"
  //                               ? "bg-red-100 text-red-700"
  //                               : topic.priority === "medium"
  //                                 ? "bg-yellow-100 text-yellow-700"
  //                                 : "bg-gray-100 text-gray-700"
  //                           }`}
  //                         >
  //                           {topic.priority}
  //                         </Badge>
  //                       </div>
  //                     ))}

  //                   {topics.filter(
  //                     (topic) =>
  //                       topic.scheduledAt &&
  //                       new Date(topic.scheduledAt) > new Date() &&
  //                       topic.status === "pending"
  //                   ).length === 0 && (
  //                     <div className="text-center py-8 text-gray-500">
  //                       No scheduled posts found. Topics will appear here when
  //                       scheduled for future generation.
  //                     </div>
  //                   )}
  //                 </div>
  //               </CardContent>
  //             </Card>

  //             {/* Failed/Retry Topics */}
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle>Failed & Retry Queue</CardTitle>
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="space-y-2">
  //                   {topics
  //                     .filter(
  //                       (topic) =>
  //                         topic.status === "failed" ||
  //                         (topic.retryAfter &&
  //                           new Date(topic.retryAfter) > new Date())
  //                     )
  //                     .map((topic) => (
  //                       <div
  //                         key={topic._id}
  //                         className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
  //                       >
  //                         <div>
  //                           <div className="font-medium truncate max-w-md">
  //                             {topic.topic}
  //                           </div>
  //                           <div className="text-sm text-red-600">
  //                             {topic.status === "failed" ? (
  //                               <>
  //                                 Failed:{" "}
  //                                 {topic.failureReason ||
  //                                   topic.errorMessage ||
  //                                   "Unknown error"}
  //                               </>
  //                             ) : (
  //                               <>
  //                                 Retry after:{" "}
  //                                 {topic.retryAfter
  //                                   ? new Date(topic.retryAfter).toLocaleString()
  //                                   : "Unknown"}
  //                               </>
  //                             )}
  //                           </div>
  //                           <div className="text-xs text-gray-500">
  //                             Retry count: {topic.retryCount || 0}/3
  //                           </div>
  //                         </div>
  //                         <div className="flex items-center gap-2">
  //                           <Badge
  //                             variant="outline"
  //                             className="text-red-600 border-red-300"
  //                           >
  //                             {topic.status}
  //                           </Badge>
  //                           <Button
  //                             variant="ghost"
  //                             size="sm"
  //                             onClick={() => handleGenerateTopic(topic._id)}
  //                             title="Retry now"
  //                           >
  //                             <PlayCircle className="h-4 w-4" />
  //                           </Button>
  //                         </div>
  //                       </div>
  //                     ))}

  //                   {topics.filter(
  //                     (topic) =>
  //                       topic.status === "failed" ||
  //                       (topic.retryAfter &&
  //                         new Date(topic.retryAfter) > new Date())
  //                   ).length === 0 && (
  //                     <div className="text-center py-8 text-gray-500">
  //                       No failed or retry topics. This is good news!
  //                     </div>
  //                   )}
  //                 </div>
  //               </CardContent>
  //             </Card>

  //             {/* Configuration */}
  //             <Card>
  //               <CardHeader>
  //                 <CardTitle>Agenda.js Scheduler Configuration</CardTitle>
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="space-y-4">
  //                   <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
  //                     <div className="flex items-center gap-2 mb-2">
  //                       <CheckCircle className="h-4 w-4 text-green-600" />
  //                       <span className="font-medium text-green-800">
  //                         Automatic Scheduling
  //                       </span>
  //                     </div>
  //                     <div className="text-sm text-green-700 space-y-2">
  //                       <p>
  //                         ✅ Individual jobs are automatically created when you:
  //                       </p>
  //                       <ul className="list-disc list-inside text-xs space-y-1">
  //                         <li>Create a topic with a scheduled date/time</li>
  //                         <li>Update a topic's scheduled date/time</li>
  //                         <li>
  //                           Jobs are automatically cancelled when topics are
  //                           deleted
  //                         </li>
  //                       </ul>
  //                       <p className="text-xs font-medium">
  //                         No manual setup required! The system works
  //                         automatically.
  //                       </p>
  //                     </div>
  //                   </div>

  //                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                     <div className="p-3 border rounded-lg">
  //                       <div className="font-medium text-sm">
  //                         Concurrency Settings
  //                       </div>
  //                       <div className="text-xs text-gray-600 mt-1">
  //                         • Max 3 concurrent jobs
  //                         <br />
  //                         • 1 job per topic at a time
  //                         <br />• 30-minute job timeout
  //                       </div>
  //                     </div>

  //                     <div className="p-3 border rounded-lg">
  //                       <div className="font-medium text-sm">
  //                         Reliability Features
  //                       </div>
  //                       <div className="text-xs text-gray-600 mt-1">
  //                         • 3 automatic retry attempts
  //                         <br />
  //                         • Exponential backoff (5min, 10min, 20min)
  //                         <br />• Persistent job storage in MongoDB
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               </CardContent>
  //             </Card>
  //           </TabsContent>
  //         </Tabs>
  //       </div>
  //     </div>
  //   );
}
