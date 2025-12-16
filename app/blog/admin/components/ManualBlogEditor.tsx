"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { blogApi, generateSlug, BlogPost, BlogComponent } from "@/lib/blogApi";
import {
  validateImageFile,
  formatFileSize,
  getOptimizedImageUrl,
  ImageKitResponse,
} from "@/lib/imagekit-utils";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  Upload,
  Code,
  Type,
  Image as ImageIcon,
  Quote,
  MousePointer,
  Video,
  Info,
  Grid3X3,
  BarChart3,
  TrendingUp,
  PieChart,
  Columns,
  Scale,
  Clock,
  GitBranch,
  List,
  GripVertical,
  Trash2,
  Copy,
  EyeOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ManualBlogEditorProps {
  onBack: () => void;
}

const componentTypes = [
  {
    type: "rich_text",
    name: "Rich Text",
    description: "Markdown/HTML editor for main content",
    icon: Type,
  },
  {
    type: "image",
    name: "Image",
    description: "Upload field + alt text + caption",
    icon: ImageIcon,
  },
  {
    type: "callout",
    name: "Callout",
    description: "Title + content + variant styling",
    icon: Info,
  },
  {
    type: "quote",
    name: "Quote",
    description: "Quote text + author + citation",
    icon: Quote,
  },
  {
    type: "cta",
    name: "Call to Action",
    description: "Button text + link + style options",
    icon: MousePointer,
  },
  {
    type: "video",
    name: "Video",
    description: "Upload/URL + thumbnail + title",
    icon: Video,
  },
  {
    type: "table",
    name: "Table",
    description: "Data table with headers and rows",
    icon: Grid3X3,
  },
  {
    type: "bar_chart",
    name: "Bar Chart",
    description: "Vertical bar chart visualization",
    icon: BarChart3,
  },
  {
    type: "line_chart",
    name: "Line Chart",
    description: "Line graph for trends over time",
    icon: TrendingUp,
  },
  {
    type: "pie_chart",
    name: "Pie Chart",
    description: "Circular chart for proportional data",
    icon: PieChart,
  },
  {
    type: "comparison_table",
    name: "Comparison Table",
    description: "Feature comparison table",
    icon: Columns,
  },
  {
    type: "pros_cons",
    name: "Pros & Cons",
    description: "Advantages and disadvantages list",
    icon: Scale,
  },
  {
    type: "timeline",
    name: "Timeline",
    description: "Chronological sequence of events",
    icon: Clock,
  },
  {
    type: "flowchart",
    name: "Flowchart",
    description: "Process flow diagram",
    icon: GitBranch,
  },
  {
    type: "step_by_step",
    name: "Step by Step",
    description: "Sequential process guide",
    icon: List,
  },
];

export default function ManualBlogEditor({ onBack }: ManualBlogEditorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showJSONImport, setShowJSONImport] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] =
    useState(false);
  const [featuredImageUploadProgress, setFeaturedImageUploadProgress] =
    useState(0);
  const [markdownPreview, setMarkdownPreview] = useState<{[key: string]: boolean}>({});
  const [postData, setPostData] = useState({
    title: "",
    description: "",
    slug: "",
    featuredImage: "",
    status: "draft" as "draft" | "published" | "archived",
    category: "",
    tags: [] as string[],
    components: [] as any[],
  });

  // Check for imported data or edit mode on component mount
  useEffect(() => {
    const imported = searchParams.get("imported");
    const editId = searchParams.get("edit");

    if (imported === "true") {
      const importedData = localStorage.getItem("importedBlogData");
      if (importedData) {
        try {
          const parsedData = JSON.parse(importedData);
          setPostData(parsedData);
          // Clear the imported data from localStorage
          localStorage.removeItem("importedBlogData");
        } catch (error) {
          console.error("Error parsing imported data:", error);
        }
      }
    } else if (editId) {
      loadPostForEditing(editId);
    }
  }, [searchParams, user]);

  const loadPostForEditing = async (postId: string) => {
    setIsLoading(true);
    try {
      const post = await blogApi.getPost(postId, "anonymous");

      setCurrentPostId(post._id);
      setPostData({
        title: post.title,
        description: post.description || "",
        slug: post.slug,
        featuredImage: post.featuredImage || "",
        status: post.status,
        category: post.category || "",
        tags: post.tags || [],
        components: post.components.map((comp) => ({
          ...comp,
          id: comp._id, // Use _id as id for local state
        })),
      });
    } catch (error) {
      console.error("Error loading post:", error);
      alert("Failed to load post for editing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addComponent = async (type: string) => {
    try {
      // If no post exists yet, create a draft post first
      let postId = currentPostId;
      if (!postId) {
        if (!postData.title.trim()) {
          alert("Please enter a title before adding components.");
          return;
        }

        const slug = postData.slug || generateSlug(postData.title);
        const newPost = await blogApi.createPost(
          {
            title: postData.title,
            description: postData.description || "",
            slug,
            featuredImage: postData.featuredImage || "",
            status: "draft" as const,
            category: postData.category || "",
            tags: postData.tags || [],
            components: [],
          },
          "anonymous" // Use anonymous as dummy clerkId
        );

        postId = newPost._id;
        setCurrentPostId(postId);
      }

      const componentData: Partial<BlogComponent> = {
        blogPost: postId,
        type: type as BlogComponent["type"],
        order: postData.components.length,
        ...(type === "rich_text" && { content: "" }),
        ...(type === "image" && { src: "", alt: "", caption: "" }),
        ...(type === "callout" && {
          variant: "info" as const,
          title: "",
          content: "",
        }),
        ...(type === "quote" && { content: "", author: "", citation: "" }),
        ...(type === "cta" && {
          text: "",
          link: "",
          style: "primary" as const,
        }),
        ...(type === "video" && {
          videoUrl: "",
          videoTitle: "",
          thumbnail: "",
        }),
        ...(type === "table" && {
          headers: ["Header 1", "Header 2", "Header 3"],
          rows: [["Cell 1", "Cell 2", "Cell 3"], ["Cell 4", "Cell 5", "Cell 6"]],
          tableCaption: "",
          tableStyle: "data" as const,
        }),
        ...(type === "bar_chart" && {
          data: {
            title: "Chart Title",
            description: "Chart description",
            chartData: [
              { name: "Category 1", value: 10 },
              { name: "Category 2", value: 20 },
              { name: "Category 3", value: 30 },
            ],
            xAxisLabel: "Categories",
            yAxisLabel: "Values",
            color: "#3b82f6",
          },
        }),
        ...(type === "line_chart" && {
          data: {
            title: "Chart Title",
            description: "Chart description",
            chartData: [
              { name: "Jan", value: 10 },
              { name: "Feb", value: 20 },
              { name: "Mar", value: 30 },
            ],
            xAxisLabel: "Months",
            yAxisLabel: "Values",
            color: "#3b82f6",
          },
        }),
        ...(type === "pie_chart" && {
          data: {
            title: "Chart Title",
            description: "Chart description",
            chartData: [
              { name: "Category 1", value: 30, color: "#3b82f6" },
              { name: "Category 2", value: 40, color: "#ef4444" },
              { name: "Category 3", value: 30, color: "#10b981" },
            ],
          },
        }),
        ...(type === "comparison_table" && {
          data: {
            title: "Comparison Table",
            description: "Feature comparison",
            columns: [
              { name: "Feature" },
              { name: "Option A" },
              { name: "Option B" },
            ],
            rows: [
              ["Feature 1", "✓", "✗"],
              ["Feature 2", "✓", "✓"],
              ["Feature 3", "✗", "✓"],
            ],
            highlightColumn: 0,
          },
        }),
        ...(type === "pros_cons" && {
          data: {
            title: "Pros & Cons",
            description: "Analysis",
            pros: ["Advantage 1", "Advantage 2", "Advantage 3"],
            cons: ["Disadvantage 1", "Disadvantage 2", "Disadvantage 3"],
            prosTitle: "Pros",
            consTitle: "Cons",
          },
        }),
        ...(type === "timeline" && {
          data: {
            title: "Timeline",
            description: "Chronological events",
            events: [
              { date: "2023", title: "Event 1", description: "Description 1" },
              { date: "2024", title: "Event 2", description: "Description 2" },
              { date: "2025", title: "Event 3", description: "Description 3" },
            ],
            layout: "vertical" as const,
          },
        }),
        ...(type === "flowchart" && {
          data: {
            title: "Flowchart",
            description: "Process flow",
            layout: "vertical" as const,
            nodes: [
              { id: "start", type: "start", title: "Start", description: "Begin process" },
              { id: "process", type: "process", title: "Process", description: "Main process" },
              { id: "end", type: "end", title: "End", description: "End process" },
            ],
            connections: [
              { from: "start", to: "process", label: "Next" },
              { from: "process", to: "end", label: "Complete" },
            ],
          },
        }),
        ...(type === "step_by_step" && {
          data: {
            title: "Step by Step Guide",
            description: "Sequential instructions",
            layout: "vertical" as const,
            showProgress: true,
            steps: [
              { title: "Step 1", description: "First step description", completed: false },
              { title: "Step 2", description: "Second step description", completed: false },
              { title: "Step 3", description: "Third step description", completed: false },
            ],
          },
        }),
      };

      const newComponent = await blogApi.createComponent(
        componentData,
        "anonymous" // Use anonymous as dummy clerkId
      );

      setPostData({
        ...postData,
        components: [
          ...postData.components,
          { ...newComponent, id: newComponent._id },
        ],
      });
      setShowAddComponent(false);
    } catch (error) {
      console.error("Error adding component:", error);
      alert("Failed to add component. Please try again.");
    }
  };

  const removeComponent = async (id: string) => {
    const component = postData.components.find((c) => c.id === id);
    if (!component) {
      alert("Component not found.");
      return;
    }

    try {
      // Delete from backend if it's a real component
      if (component._id) {
        await blogApi.deleteComponent(component._id, "anonymous");
      }

      // Update local state
      setPostData({
        ...postData,
        components: postData.components.filter((c) => c.id !== id),
      });
    } catch (error) {
      console.error("Error removing component:", error);
      alert(
        `Failed to remove component: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const duplicateComponent = async (id: string) => {
    const component = postData.components.find((c) => c.id === id);
    if (!component) return;

    try {
      // Ensure we have a post to add the component to
      let postId = currentPostId;
      if (!postId) {
        if (!postData.title.trim()) {
          alert("Please enter a title before duplicating components.");
          return;
        }

        const slug = postData.slug || generateSlug(postData.title);
        const newPost = await blogApi.createPost(
          {
            title: postData.title,
            description: postData.description || "",
            slug,
            featuredImage: postData.featuredImage || "",
            status: "draft" as const,
            category: postData.category || "",
            tags: postData.tags || [],
            components: [],
          },
          "anonymous"
        );

        postId = newPost._id;
        setCurrentPostId(postId);
      }

      const {
        _id,
        blogPost,
        createdAt,
        updatedAt,
        id: componentId,
        ...componentData
      } = component;
      const createdComponent = await blogApi.createComponent(
        {
          ...componentData,
          blogPost: postId,
          order: postData.components.length,
        },
        "anonymous"
      );

      const newComponent = {
        ...createdComponent,
        id: createdComponent._id,
      };

      const index = postData.components.findIndex((c) => c.id === id);
      const newComponents = [...postData.components];
      newComponents.splice(index + 1, 0, newComponent);
      setPostData({ ...postData, components: newComponents });
    } catch (error) {
      console.error("Error duplicating component:", error);
      alert("Failed to duplicate component. Please try again.");
    }
  };

  const updateComponent = async (componentId: string, updates: any) => {
    // Update local state immediately for better UX
    const newComponents = postData.components.map((c) =>
      c.id === componentId ? { ...c, ...updates } : c
    );
    setPostData({ ...postData, components: newComponents });

    // Update in backend if it's a real component
    const component = postData.components.find((c) => c.id === componentId);
    if (component?._id) {
      try {
        await blogApi.updateComponent(component._id, updates, "anonymous");
      } catch (error) {
        console.error("Error updating component:", error);
        // For now, we'll keep the local state change
        // In a production app, you might want to revert or show a retry option
      }
    }
  };

  const handleImageUpload = async (componentId: string, file: File) => {
    if (!file) return;

    // Validate the file before uploading
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      return;
    }

    // Show loading state with file info
    await updateComponent(componentId, {
      uploading: true,
      uploadProgress: `Preparing ${file.name} (${formatFileSize(file.size)})...`,
      src: "", // Clear previous image while uploading
    });

    try {
      // Create FormData for the upload
      const formData = new FormData();
      formData.append("file", file);

      // Update progress
      await updateComponent(componentId, {
        uploadProgress: "Uploading to ImageKit...",
      });

      // Upload to ImageKit via our API route
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result: ImageKitResponse = await response.json();

      // Update progress
      await updateComponent(componentId, {
        uploadProgress: "Processing image...",
      });

      // Update the component with the ImageKit URL and metadata
      await updateComponent(componentId, {
        src: result.url,
        alt: file.name.split(".")[0], // Use filename without extension as default alt text
        caption: "", // Clear caption, user can add if needed
        uploading: false,
        uploadProgress: undefined, // Clear progress message
        // Store additional ImageKit metadata
        imageKit: {
          fileId: result.fileId,
          thumbnailUrl: result.thumbnailUrl,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size,
        },
      });

      alert(
        `Image uploaded successfully! 🎉\n${result.width}×${result.height} • ${result.format?.toUpperCase()} • ${formatFileSize(result.size)}`
      );
    } catch (error) {
      console.error("Error uploading image:", error);

      // Clear loading state and show error
      await updateComponent(componentId, {
        uploading: false,
        uploadProgress: undefined,
        src: "", // Clear any partial data
      });

      alert(
        `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    if (!file) return;

    // Validate the file before uploading
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      return;
    }

    try {
      setIsUploadingFeaturedImage(true);
      setFeaturedImageUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFeaturedImageUploadProgress((prev) => {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      if (result.success) {
        clearInterval(progressInterval);
        setFeaturedImageUploadProgress(100);

        // Update the featured image URL
        setPostData({ ...postData, featuredImage: result.url });

        setTimeout(() => {
          setFeaturedImageUploadProgress(0);
        }, 1000);

        alert(
          `Featured image uploaded successfully! 🎉\n${result.width}×${result.height} • ${result.format?.toUpperCase()} • ${formatFileSize(result.size)}`
        );
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading featured image:", error);
      alert(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploadingFeaturedImage(false);
    }
  };

  const handleFeaturedImageFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFeaturedImageUpload(file);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = "";
  };

  const handleJSONImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setPostData(parsed);
      setShowJSONImport(false);
      setJsonInput("");
    } catch (error) {
      alert("Invalid JSON format. Please check your input.");
    }
  };

  const saveDraft = async () => {
    if (!postData.title.trim()) {
      alert("Please enter a title before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const slug = postData.slug || generateSlug(postData.title);

      const postDataToSave = {
        title: postData.title,
        description: postData.description || "",
        slug,
        featuredImage: postData.featuredImage || "",
        status: "draft" as const,
        category: postData.category || "",
        tags: postData.tags || [],
        // Only include components that have _id (real components)
        components: postData.components
          .filter((comp) => comp._id)
          .map((comp, index) => ({
            ...comp,
            order: index,
          })),
      };

      if (currentPostId) {
        // Update existing post
        const updatedPost = await blogApi.updatePost(
          currentPostId,
          postDataToSave,
          "anonymous"
        );
      } else {
        // Create new post
        const newPost = await blogApi.createPost(postDataToSave, "anonymous");
        setCurrentPostId(newPost._id);

        // Update local components with real IDs
        setPostData({
          ...postData,
          components: newPost.components.map((comp) => ({
            ...comp,
            id: comp._id,
          })),
        });
      }

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert(
        `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const publishPost = async () => {
    if (!postData.title.trim()) {
      alert("Please enter a title before publishing.");
      return;
    }

    if (!postData.description?.trim()) {
      alert("Please enter a description before publishing.");
      return;
    }

    setIsSaving(true);
    try {
      const slug = postData.slug || generateSlug(postData.title);

      const postDataToSave = {
        title: postData.title,
        description: postData.description || "",
        slug,
        featuredImage: postData.featuredImage || "",
        status: "published" as const,
        publishedAt: new Date(),
        category: postData.category || "",
        tags: postData.tags || [],
        // Only include components that have _id (real components)
        components: postData.components
          .filter((comp) => comp._id)
          .map((comp, index) => ({
            ...comp,
            order: index,
          })),
      };

      if (currentPostId) {
        await blogApi.updatePost(currentPostId, postDataToSave, "anonymous");
      } else {
        const newPost = await blogApi.createPost(postDataToSave, "anonymous");
        setCurrentPostId(newPost._id);
      }

      alert("Post published successfully!");
      router.push("/blog/admin");
    } catch (error) {
      console.error("Error publishing post:", error);
      alert(
        `Failed to publish post: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const exportJSON = () => {
    const jsonString = JSON.stringify(postData, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert("JSON copied to clipboard!");
  };

  const toggleMarkdownPreview = (componentId: string) => {
    setMarkdownPreview(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newComponents = [...postData.components];
    const draggedComponent = newComponents[draggedItem];

    // Remove the dragged item
    newComponents.splice(draggedItem, 1);

    // Insert at new position
    let insertIndex = dropIndex;
    if (dropIndex > postData.components.length - 1) {
      // Dropping at the end
      insertIndex = newComponents.length;
    } else if (draggedItem < dropIndex) {
      // Dragged from above, adjust index
      insertIndex = dropIndex - 1;
    }

    newComponents.splice(insertIndex, 0, draggedComponent);

    // Update local state immediately for better UX
    setPostData({ ...postData, components: newComponents });
    setDraggedItem(null);
    setDragOverItem(null);

    // If we have a post ID, update the order in the backend
    if (currentPostId) {
      try {
        const componentOrders = newComponents
          .filter((comp) => comp._id) // Only real components
          .map((comp, index) => ({
            componentId: comp._id,
            order: index,
          }));

        if (componentOrders.length > 0) {
          await blogApi.reorderComponents(
            currentPostId,
            componentOrders,
            "anonymous"
          );
        }
      } catch (error) {
        console.error("Error reordering components:", error);
        // Could optionally revert the local state change here
      }
    }
  };

  const renderComponentEditor = (component: any, index: number) => {
    const componentType = componentTypes.find((t) => t.type === component.type);
    const IconComponent = componentType?.icon || Type;

    return (
      <Card
        key={component.id}
        className={`mb-4 transition-all duration-200 ${
          draggedItem === index ? "opacity-50 scale-95" : ""
        } ${dragOverItem === index ? "ring-2 ring-blue-400 bg-blue-50" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
              <IconComponent className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm">
                {componentType?.name || component.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => duplicateComponent(component.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => removeComponent(component.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {component.type === "rich_text" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Content (Markdown)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMarkdownPreview(component.id)}
                  className="flex items-center gap-2"
                >
                  {markdownPreview[component.id] ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              
              {markdownPreview[component.id] ? (
                <div className="min-h-[200px] p-4 border rounded-md bg-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                      p: ({children}) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">{children}</blockquote>,
                      code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                      pre: ({children}) => <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-4">{children}</pre>,
                    }}
                  >
                    {component.content || "*No content yet. Switch to edit mode to add content.*"}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    value={component.content || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { content: e.target.value });
                    }}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Enter your content using Markdown formatting...

Examples:
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

[Link text](https://example.com)

> This is a blockquote

`Inline code`"
                  />
                  <p className="text-xs text-gray-500">
                    Tip: Use # for headers, ** for bold, * for italic, - for bullets, 1. for numbers
                  </p>
                </div>
              )}
            </div>
          )}

          {component.type === "image" && (
            <div className="space-y-4">
              {/* Image Preview */}
              {(component.url || component.src) && !component.uploading && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={component.thumbnailUrl || component.url || component.src}
                    alt={component.alt || "Preview"}
                    className="max-w-full h-auto max-h-48 rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {component.imageKit && (
                    <div className="mt-2 text-xs text-gray-500">
                      {component.imageKit.width} × {component.imageKit.height} •{" "}
                      {component.imageKit.format?.toUpperCase()} •{" "}
                      {Math.round(component.imageKit.size / 1024)}KB
                    </div>
                  )}
                </div>
              )}

              {/* Upload Area */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Image URL
                  </label>
                  <Input
                    value={component.url || component.src || ""}
                    onChange={(e) => {
                      // Update both fields for compatibility
                      updateComponent(component.id, { 
                        src: e.target.value,
                        url: e.target.value 
                      });
                    }}
                    placeholder="https://example.com/image.jpg or upload below"
                    disabled={component.uploading}
                  />
                </div>
                <div className="mt-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(component.id, file);
                      }
                    }}
                    style={{ display: "none" }}
                    id={`image-upload-${component.id}`}
                    disabled={component.uploading}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      document
                        .getElementById(`image-upload-${component.id}`)
                        ?.click();
                    }}
                    disabled={component.uploading}
                  >
                    {component.uploading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload to ImageKit
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Upload Status */}
              {component.uploading && (
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border">
                  📤{" "}
                  {component.uploadProgress ||
                    "Uploading to ImageKit... Please wait."}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Alt Text
                </label>
                <Input
                  value={component.alt || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { alt: e.target.value });
                  }}
                  placeholder="Descriptive alt text for accessibility"
                  disabled={component.uploading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Caption (Optional)
                </label>
                <Input
                  value={component.caption || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { caption: e.target.value });
                  }}
                  placeholder="Image caption"
                  disabled={component.uploading}
                />
              </div>
            </div>
          )}

          {component.type === "callout" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Title
                  </label>
                  <Input
                    value={component.title || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { title: e.target.value });
                    }}
                    placeholder="Callout title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Style
                  </label>
                  <select
                    value={component.variant || "info"}
                    onChange={(e) => {
                      updateComponent(component.id, {
                        variant: e.target.value,
                      });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Content
                </label>
                <Textarea
                  value={component.content || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { content: e.target.value });
                  }}
                  placeholder="Callout content"
                />
              </div>
            </div>
          )}

          {component.type === "quote" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quote Text
                </label>
                <Textarea
                  value={component.content || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { content: e.target.value });
                  }}
                  placeholder="Enter the quote text"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Author
                  </label>
                  <Input
                    value={component.author || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { author: e.target.value });
                    }}
                    placeholder="Author name"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Citation
                  </label>
                  <Input
                    value={component.citation || ""}
                    onChange={(e) => {
                      updateComponent(component.id, {
                        citation: e.target.value,
                      });
                    }}
                    placeholder="Title or source"
                  />
                </div>
              </div>
            </div>
          )}

          {component.type === "cta" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Button Text
                  </label>
                  <Input
                    value={component.text || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { text: e.target.value });
                    }}
                    placeholder="Get Started Today"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Link URL
                  </label>
                  <Input
                    value={component.link || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { link: e.target.value });
                    }}
                    placeholder="/signup"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Style
                  </label>
                  <select
                    value={component.style || "primary"}
                    onChange={(e) => {
                      updateComponent(component.id, { style: e.target.value });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {component.type === "video" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Video Title
                </label>
                <Input
                  value={component.videoTitle || ""}
                  onChange={(e) => {
                    updateComponent(component.id, {
                      videoTitle: e.target.value,
                    });
                  }}
                  placeholder="Video title"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Video URL or Filename
                  </label>
                  <Input
                    value={component.videoUrl || ""}
                    onChange={(e) => {
                      updateComponent(component.id, {
                        videoUrl: e.target.value,
                      });
                    }}
                    placeholder="https://youtube.com/watch?v=... or video-file.mp4"
                  />
                </div>
                <div className="mt-6">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileName = `${Date.now()}-${file.name}`;
                        updateComponent(component.id, { videoUrl: fileName });
                        alert(
                          "Video uploaded successfully! Note: In production, this would upload to a cloud service."
                        );
                      }
                    }}
                    style={{ display: "none" }}
                    id={`video-upload-${component.id}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      document
                        .getElementById(`video-upload-${component.id}`)
                        ?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Thumbnail Image
                </label>
                <Input
                  value={component.thumbnail || ""}
                  onChange={(e) => {
                    updateComponent(component.id, {
                      thumbnail: e.target.value,
                    });
                  }}
                  placeholder="thumbnail-image-name"
                />
              </div>
            </div>
          )}

          {component.type === "table" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Table Caption
                </label>
                <Input
                  value={component.tableCaption || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { tableCaption: e.target.value });
                  }}
                  placeholder="Table caption (optional)"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Headers</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const headers = component.headers || [];
                      updateComponent(component.id, { headers: [...headers, "New Header"] });
                    }}
                  >
                    Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.headers || []).map((header: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={header}
                        onChange={(e) => {
                          const headers = [...(component.headers || [])];
                          headers[index] = e.target.value;
                          updateComponent(component.id, { headers });
                        }}
                        placeholder={`Header ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const headers = [...(component.headers || [])];
                          headers.splice(index, 1);
                          const rows = (component.rows || []).map((row: any) => {
                            const newRow = [...row];
                            newRow.splice(index, 1);
                            return newRow;
                          });
                          updateComponent(component.id, { headers, rows });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Rows</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const rows = component.rows || [];
                      const headerCount = (component.headers || []).length;
                      const newRow = new Array(headerCount).fill("");
                      updateComponent(component.id, { rows: [...rows, newRow] });
                    }}
                  >
                    Add Row
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.rows || []).map((row: any, rowIndex: number) => (
                    <div key={rowIndex} className="flex gap-2">
                      {row.map((cell: any, cellIndex: number) => (
                        <Input
                          key={cellIndex}
                          value={cell}
                          onChange={(e) => {
                            const rows = [...(component.rows || [])];
                            rows[rowIndex][cellIndex] = e.target.value;
                            updateComponent(component.id, { rows });
                          }}
                          placeholder={`Cell ${rowIndex + 1},${cellIndex + 1}`}
                        />
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const rows = [...(component.rows || [])];
                          rows.splice(rowIndex, 1);
                          updateComponent(component.id, { rows });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(component.type === "bar_chart" || component.type === "line_chart") && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Chart Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Chart title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Chart description"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    X-Axis Label
                  </label>
                  <Input
                    value={component.data?.xAxisLabel || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { 
                        data: { ...component.data, xAxisLabel: e.target.value }
                      });
                    }}
                    placeholder="X-axis label"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Y-Axis Label
                  </label>
                  <Input
                    value={component.data?.yAxisLabel || ""}
                    onChange={(e) => {
                      updateComponent(component.id, { 
                        data: { ...component.data, yAxisLabel: e.target.value }
                      });
                    }}
                    placeholder="Y-axis label"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Chart Data</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const chartData = component.data?.chartData || [];
                      const newDataPoint = { name: "New Category", value: 0 };
                      updateComponent(component.id, { 
                        data: { ...component.data, chartData: [...chartData, newDataPoint] }
                      });
                    }}
                  >
                    Add Data Point
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.data?.chartData || []).map((dataPoint: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          value={dataPoint.name}
                          onChange={(e) => {
                            const chartData = [...(component.data?.chartData || [])];
                            chartData[index] = { ...chartData[index], name: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, chartData }
                            });
                          }}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={dataPoint.value}
                          onChange={(e) => {
                            const chartData = [...(component.data?.chartData || [])];
                            chartData[index] = { ...chartData[index], value: parseInt(e.target.value) || 0 };
                            updateComponent(component.id, { 
                              data: { ...component.data, chartData }
                            });
                          }}
                          placeholder="Value"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const chartData = [...(component.data?.chartData || [])];
                          chartData.splice(index, 1);
                          updateComponent(component.id, { 
                            data: { ...component.data, chartData }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {component.type === "pie_chart" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Chart Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Chart title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Chart description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Chart Data</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const chartData = component.data?.chartData || [];
                      const newSlice = { name: "New Category", value: 10, color: "#3b82f6" };
                      updateComponent(component.id, { 
                        data: { ...component.data, chartData: [...chartData, newSlice] }
                      });
                    }}
                  >
                    Add Slice
                  </Button>
                </div>
                <div className="space-y-3">
                  {(component.data?.chartData || []).map((slice: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <Input
                          value={slice.name}
                          onChange={(e) => {
                            const chartData = [...(component.data?.chartData || [])];
                            chartData[index] = { ...chartData[index], name: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, chartData }
                            });
                          }}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          value={slice.value}
                          onChange={(e) => {
                            const chartData = [...(component.data?.chartData || [])];
                            chartData[index] = { ...chartData[index], value: parseInt(e.target.value) || 0 };
                            updateComponent(component.id, { 
                              data: { ...component.data, chartData }
                            });
                          }}
                          placeholder="Value"
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          type="color"
                          value={slice.color}
                          onChange={(e) => {
                            const chartData = [...(component.data?.chartData || [])];
                            chartData[index] = { ...chartData[index], color: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, chartData }
                            });
                          }}
                          className="w-full h-10"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const chartData = [...(component.data?.chartData || [])];
                          chartData.splice(index, 1);
                          updateComponent(component.id, { 
                            data: { ...component.data, chartData }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {component.type === "comparison_table" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Table Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Comparison table title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Table description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Columns</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const columns = component.data?.columns || [];
                      const newColumn = { name: "New Column" };
                      updateComponent(component.id, { 
                        data: { ...component.data, columns: [...columns, newColumn] }
                      });
                    }}
                  >
                    Add Column
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.data?.columns || []).map((column: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={column.name}
                        onChange={(e) => {
                          const columns = [...(component.data?.columns || [])];
                          columns[index] = { ...columns[index], name: e.target.value };
                          updateComponent(component.id, { 
                            data: { ...component.data, columns }
                          });
                        }}
                        placeholder={`Column ${index + 1} name`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const columns = [...(component.data?.columns || [])];
                          columns.splice(index, 1);
                          const rows = (component.data?.rows || []).map((row: any) => {
                            const newRow = [...row];
                            newRow.splice(index, 1);
                            return newRow;
                          });
                          updateComponent(component.id, { 
                            data: { ...component.data, columns, rows }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Rows</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const rows = component.data?.rows || [];
                      const columnCount = (component.data?.columns || []).length;
                      const newRow = new Array(columnCount).fill("");
                      updateComponent(component.id, { 
                        data: { ...component.data, rows: [...rows, newRow] }
                      });
                    }}
                  >
                    Add Row
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.data?.rows || []).map((row: any, rowIndex: number) => (
                    <div key={rowIndex} className="flex gap-2">
                      {row.map((cell: any, cellIndex: number) => (
                        <Input
                          key={cellIndex}
                          value={cell}
                          onChange={(e) => {
                            const rows = [...(component.data?.rows || [])];
                            rows[rowIndex][cellIndex] = e.target.value;
                            updateComponent(component.id, { 
                              data: { ...component.data, rows }
                            });
                          }}
                          placeholder={`Row ${rowIndex + 1}, Col ${cellIndex + 1}`}
                        />
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const rows = [...(component.data?.rows || [])];
                          rows.splice(rowIndex, 1);
                          updateComponent(component.id, { 
                            data: { ...component.data, rows }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {component.type === "pros_cons" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Pros & Cons title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Pros</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const pros = component.data?.pros || [];
                        updateComponent(component.id, { 
                          data: { ...component.data, pros: [...pros, ""] }
                        });
                      }}
                    >
                      Add Pro
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(component.data?.pros || []).map((pro: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={pro}
                          onChange={(e) => {
                            const pros = [...(component.data?.pros || [])];
                            pros[index] = e.target.value;
                            updateComponent(component.id, { 
                              data: { ...component.data, pros }
                            });
                          }}
                          placeholder={`Pro ${index + 1}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const pros = [...(component.data?.pros || [])];
                            pros.splice(index, 1);
                            updateComponent(component.id, { 
                              data: { ...component.data, pros }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Cons</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const cons = component.data?.cons || [];
                        updateComponent(component.id, { 
                          data: { ...component.data, cons: [...cons, ""] }
                        });
                      }}
                    >
                      Add Con
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(component.data?.cons || []).map((con: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={con}
                          onChange={(e) => {
                            const cons = [...(component.data?.cons || [])];
                            cons[index] = e.target.value;
                            updateComponent(component.id, { 
                              data: { ...component.data, cons }
                            });
                          }}
                          placeholder={`Con ${index + 1}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const cons = [...(component.data?.cons || [])];
                            cons.splice(index, 1);
                            updateComponent(component.id, { 
                              data: { ...component.data, cons }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {component.type === "timeline" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Timeline Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Timeline title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Timeline description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Timeline Events</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const events = component.data?.events || [];
                      const newEvent = { date: "2025", title: "New Event", description: "Event description" };
                      updateComponent(component.id, { 
                        data: { ...component.data, events: [...events, newEvent] }
                      });
                    }}
                  >
                    Add Event
                  </Button>
                </div>
                <div className="space-y-3">
                  {(component.data?.events || []).map((event: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <div className="w-24">
                          <Input
                            value={event.date}
                            onChange={(e) => {
                              const events = [...(component.data?.events || [])];
                              events[index] = { ...events[index], date: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, events }
                              });
                            }}
                            placeholder="Date"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={event.title}
                            onChange={(e) => {
                              const events = [...(component.data?.events || [])];
                              events[index] = { ...events[index], title: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, events }
                              });
                            }}
                            placeholder="Event title"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const events = [...(component.data?.events || [])];
                            events.splice(index, 1);
                            updateComponent(component.id, { 
                              data: { ...component.data, events }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div>
                        <Textarea
                          value={event.description}
                          onChange={(e) => {
                            const events = [...(component.data?.events || [])];
                            events[index] = { ...events[index], description: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, events }
                            });
                          }}
                          placeholder="Event description"
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {component.type === "flowchart" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Flowchart Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Flowchart title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Flowchart description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Flowchart Nodes</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nodes = component.data?.nodes || [];
                      const newNode = { 
                        id: `node-${Date.now()}`, 
                        type: "process", 
                        title: "New Node", 
                        description: "Node description" 
                      };
                      updateComponent(component.id, { 
                        data: { ...component.data, nodes: [...nodes, newNode] }
                      });
                    }}
                  >
                    Add Node
                  </Button>
                </div>
                <div className="space-y-3">
                  {(component.data?.nodes || []).map((node: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <div className="w-32">
                          <Input
                            value={node.id}
                            onChange={(e) => {
                              const nodes = [...(component.data?.nodes || [])];
                              nodes[index] = { ...nodes[index], id: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, nodes }
                              });
                            }}
                            placeholder="Node ID"
                          />
                        </div>
                        <div className="w-24">
                          <select
                            value={node.type}
                            onChange={(e) => {
                              const nodes = [...(component.data?.nodes || [])];
                              nodes[index] = { ...nodes[index], type: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, nodes }
                              });
                            }}
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="start">Start</option>
                            <option value="process">Process</option>
                            <option value="decision">Decision</option>
                            <option value="end">End</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={node.title}
                            onChange={(e) => {
                              const nodes = [...(component.data?.nodes || [])];
                              nodes[index] = { ...nodes[index], title: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, nodes }
                              });
                            }}
                            placeholder="Node title"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const nodes = [...(component.data?.nodes || [])];
                            nodes.splice(index, 1);
                            updateComponent(component.id, { 
                              data: { ...component.data, nodes }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div>
                        <Input
                          value={node.description}
                          onChange={(e) => {
                            const nodes = [...(component.data?.nodes || [])];
                            nodes[index] = { ...nodes[index], description: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, nodes }
                            });
                          }}
                          placeholder="Node description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Connections</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const connections = component.data?.connections || [];
                      const newConnection = { from: "", to: "", label: "Next" };
                      updateComponent(component.id, { 
                        data: { ...component.data, connections: [...connections, newConnection] }
                      });
                    }}
                  >
                    Add Connection
                  </Button>
                </div>
                <div className="space-y-2">
                  {(component.data?.connections || []).map((connection: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          value={connection.from}
                          onChange={(e) => {
                            const connections = [...(component.data?.connections || [])];
                            connections[index] = { ...connections[index], from: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, connections }
                            });
                          }}
                          placeholder="From node ID"
                        />
                      </div>
                      <span className="text-gray-500">→</span>
                      <div className="flex-1">
                        <Input
                          value={connection.to}
                          onChange={(e) => {
                            const connections = [...(component.data?.connections || [])];
                            connections[index] = { ...connections[index], to: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, connections }
                            });
                          }}
                          placeholder="To node ID"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={connection.label}
                          onChange={(e) => {
                            const connections = [...(component.data?.connections || [])];
                            connections[index] = { ...connections[index], label: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, connections }
                            });
                          }}
                          placeholder="Connection label"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const connections = [...(component.data?.connections || [])];
                          connections.splice(index, 1);
                          updateComponent(component.id, { 
                            data: { ...component.data, connections }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {component.type === "step_by_step" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Guide Title
                </label>
                <Input
                  value={component.data?.title || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, title: e.target.value }
                    });
                  }}
                  placeholder="Step-by-step guide title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Input
                  value={component.data?.description || ""}
                  onChange={(e) => {
                    updateComponent(component.id, { 
                      data: { ...component.data, description: e.target.value }
                    });
                  }}
                  placeholder="Guide description"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Steps</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const steps = component.data?.steps || [];
                      const newStep = { 
                        title: "New Step", 
                        description: "Step description", 
                        completed: false 
                      };
                      updateComponent(component.id, { 
                        data: { ...component.data, steps: [...steps, newStep] }
                      });
                    }}
                  >
                    Add Step
                  </Button>
                </div>
                <div className="space-y-3">
                  {(component.data?.steps || []).map((step: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={step.title}
                            onChange={(e) => {
                              const steps = [...(component.data?.steps || [])];
                              steps[index] = { ...steps[index], title: e.target.value };
                              updateComponent(component.id, { 
                                data: { ...component.data, steps }
                              });
                            }}
                            placeholder="Step title"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={(e) => {
                              const steps = [...(component.data?.steps || [])];
                              steps[index] = { ...steps[index], completed: e.target.checked };
                              updateComponent(component.id, { 
                                data: { ...component.data, steps }
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-500">Complete</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const steps = [...(component.data?.steps || [])];
                            steps.splice(index, 1);
                            updateComponent(component.id, { 
                              data: { ...component.data, steps }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div>
                        <Textarea
                          value={step.description}
                          onChange={(e) => {
                            const steps = [...(component.data?.steps || [])];
                            steps[index] = { ...steps[index], description: e.target.value };
                            updateComponent(component.id, { 
                              data: { ...component.data, steps }
                            });
                          }}
                          placeholder="Step description"
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!["rich_text", "image", "callout", "quote", "cta", "video", "table", "bar_chart", "line_chart", "pie_chart", "comparison_table", "pros_cons", "timeline", "flowchart", "step_by_step"].includes(component.type) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {`Component type "${component.type}" is not supported for manual editing yet.`}
              </p>
              <p className="text-xs text-gray-500">
                This component was likely created by AI. You can view its data below:
              </p>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(component, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manual Blog Editor
            </h1>
            <p className="text-gray-600">
              Build your blog post component by component with full control.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showJSONImport} onOpenChange={setShowJSONImport}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Import JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Blog Post from JSON</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your JSON structure here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowJSONImport(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleJSONImport}>Import</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={exportJSON}>
              <Code className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={saveDraft} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={publishPost}
              disabled={isSaving}
            >
              {isSaving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Post Meta */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Title
            </label>
            <Input
              value={postData.title}
              onChange={(e) => {
                console.log(
                  "Title changing from:",
                  postData.title,
                  "to:",
                  e.target.value
                );
                setPostData({ ...postData, title: e.target.value });
              }}
              placeholder="Your blog post title"
              className="text-lg font-medium"
            />
            <div className="text-xs text-gray-500 mt-1">
              Debug: Current title = &quot;{postData.title}&quot; (length:{" "}
              {postData.title.length})
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Meta Description
            </label>
            <Textarea
              value={postData.description}
              onChange={(e) =>
                setPostData({ ...postData, description: e.target.value })
              }
              placeholder="A brief description of your blog post for SEO and social sharing"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              {postData.description.length}/160 characters
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Featured Image
            </label>
            <div className="flex gap-2">
              <Input
                value={postData.featuredImage}
                onChange={(e) =>
                  setPostData({ ...postData, featuredImage: e.target.value })
                }
                placeholder="https://example.com/image.jpg or upload below"
                className="flex-1"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageFileSelect}
                  className="hidden"
                  id="featured-image-upload"
                  disabled={isUploadingFeaturedImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("featured-image-upload")?.click()
                  }
                  disabled={isUploadingFeaturedImage}
                  className="whitespace-nowrap"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingFeaturedImage ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>

            {/* Upload progress */}
            {isUploadingFeaturedImage && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${featuredImageUploadProgress}%` }}
                    />
                  </div>
                  <span>{featuredImageUploadProgress}%</span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-1">
              This image will be displayed as the thumbnail in the blog list
            </p>
            {postData.featuredImage && !isUploadingFeaturedImage && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postData.featuredImage}
                  alt="Featured image preview"
                  className="w-32 h-20 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                URL Slug
              </label>
              <Input
                value={postData.slug}
                onChange={(e) =>
                  setPostData({ ...postData, slug: e.target.value })
                }
                placeholder={
                  postData.title
                    ? generateSlug(postData.title)
                    : "auto-generated-from-title"
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to auto-generate from title
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </label>
              <Input
                value={postData.category}
                onChange={(e) =>
                  setPostData({ ...postData, category: e.target.value })
                }
                placeholder="e.g., Productivity, Time Management"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tags
            </label>
            <Input
              value={postData.tags.join(", ")}
              onChange={(e) =>
                setPostData({
                  ...postData,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0),
                })
              }
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Content Components
          </h2>
          <Dialog open={showAddComponent} onOpenChange={setShowAddComponent}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Component</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {componentTypes.map((componentType) => (
                  <Card
                    key={componentType.type}
                    className="cursor-pointer hover:bg-blue-50 border-2 hover:border-blue-200 transition-colors"
                    onClick={() => addComponent(componentType.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <componentType.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {componentType.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {componentType.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {postData.components.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Blog Post
              </h3>
              <p className="text-gray-600 mb-4">
                Add components to build your blog post. Start with a rich text
                component for your introduction.
              </p>
              <Button onClick={() => setShowAddComponent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Component
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {postData.components.map((component, index) => (
              <div key={component.id}>
                {/* Drop zone indicator above each component */}
                <div
                  className={`h-2 transition-all duration-200 ${
                    dragOverItem === index && draggedItem !== index
                      ? "bg-blue-400 rounded-full mb-2"
                      : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                />
                {renderComponentEditor(component, index)}
              </div>
            ))}
            {/* Drop zone at the end */}
            <div
              className={`h-8 transition-all duration-200 ${
                dragOverItem === postData.components.length
                  ? "bg-blue-400 rounded-full"
                  : "border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverItem(postData.components.length);
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, postData.components.length)}
            >
              {dragOverItem !== postData.components.length && (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Drop component here
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
