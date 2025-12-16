"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Eye,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Image as ImageIcon,
  Quote,
  Type,
  MousePointer,
  Video,
  EyeOff,
  FileText,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { blogApi, generateSlug } from "@/lib/blogApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIBlogEditorProps {
  onBack: () => void;
}

// Mock generated components for demonstration
const mockGeneratedContent = {
  title:
    "Email Marketing Automation: 10 Strategies That Boost Conversion Rates",
  description:
    "Discover proven email automation strategies that leading companies use to increase conversions by 300% and build stronger customer relationships.",
  components: [
    {
      id: "intro",
      type: "rich_text",
      content:
        "# Introduction\n\nEmail marketing automation has become the backbone of successful digital marketing strategies. When done right, it can increase conversion rates by up to 300% while saving countless hours of manual work.\n\nIn this comprehensive guide, we'll explore 10 proven strategies that top companies use to build powerful email automation workflows.",
    },
    {
      id: "img1",
      type: "image",
      src: "email-automation-dashboard-overview",
      alt: "Email automation dashboard showing campaign performance metrics",
      caption:
        "A modern email automation dashboard displaying key performance indicators",
      needsUpload: true,
    },
    {
      id: "callout1",
      type: "callout",
      variant: "info",
      title: "Quick Stat",
      content:
        "Companies using email automation see an average of 451% increase in qualified leads compared to manual email campaigns.",
    },
    {
      id: "content1",
      type: "rich_text",
      content:
        "## Strategy 1: Welcome Series Automation\n\nYour welcome series is often the first impression new subscribers have of your brand. A well-crafted welcome sequence can:\n\n- Increase engagement by 86%\n- Improve brand recognition\n- Set clear expectations\n- Drive early conversions",
    },
    {
      id: "quote1",
      type: "quote",
      content:
        "The welcome email series is your handshake with new subscribers. Make it count.",
      author: "Ann Handley",
      citation: "Chief Content Officer at MarketingProfs",
    },
    {
      id: "img2",
      type: "image",
      src: "welcome-email-sequence-examples",
      alt: "Examples of effective welcome email sequences from leading brands",
      caption: "Three examples of high-converting welcome email sequences",
      needsUpload: true,
    },
    {
      id: "cta1",
      type: "cta",
      text: "Get Our Free Email Template Library",
      link: "/templates",
      style: "primary",
    },
  ],
};

const componentIcons = {
  rich_text: Type,
  image: ImageIcon,
  callout: Info,
  quote: Quote,
  cta: MousePointer,
  video: Video,
  table: FileText,
  bar_chart: FileText,
  line_chart: FileText,
  pie_chart: FileText,
  comparison_table: FileText,
  pros_cons: FileText,
  timeline: FileText,
  flowchart: FileText,
  step_by_step: FileText,
};

const calloutVariants = {
  info: { color: "blue", icon: Info },
  success: { color: "green", icon: CheckCircle },
  warning: { color: "yellow", icon: AlertTriangle },
  error: { color: "red", icon: AlertCircle },
};

export default function AIBlogEditor({ onBack }: AIBlogEditorProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<
    "input" | "generating" | "editing"
  >("input");
  
  // Form state
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeCallouts, setIncludeCallouts] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  
  // Streamlined image controls
  const [imageContext, setImageContext] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [showAdvancedImageOptions, setShowAdvancedImageOptions] = useState(false);
  
  // Brand context
  const [brandContext, setBrandContext] = useState("");
  const [brandExamplesFile, setBrandExamplesFile] = useState<File | null>(null);
  const [showBrandOptions, setShowBrandOptions] = useState(false);
  
  // SEO fields
  const [showSeoOptions, setShowSeoOptions] = useState(false);
  const [seoForm, setSeoForm] = useState({
    primaryKeyword: "",
    secondaryKeywords: [] as string[],
    longTailKeywords: [] as string[],
    lsiKeywords: [] as string[],
    keywordDensity: 1.5,
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
  });
  
  // SEO keyword inputs
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState("");
  const [newLongTailKeyword, setNewLongTailKeyword] = useState("");
  const [newLsiKeyword, setNewLsiKeyword] = useState("");
  
  // Generated content state
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState<{[key: string]: boolean}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);

  // Helper functions for reference images
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024); // 5MB limit
    
    // Limit to 3 images total
    const newImages = [...referenceImages, ...validFiles].slice(0, 3);
    setReferenceImages(newImages);
  };

  const removeReferenceImage = (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
  };

  const handleBrandExamplesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandExamplesFile(file);
    }
  };

  // SEO keyword management functions
  const addSecondaryKeyword = () => {
    if (newSecondaryKeyword.trim() && !seoForm.secondaryKeywords.includes(newSecondaryKeyword.trim())) {
      setSeoForm(prev => ({
        ...prev,
        secondaryKeywords: [...prev.secondaryKeywords, newSecondaryKeyword.trim()]
      }));
      setNewSecondaryKeyword("");
    }
  };

  const removeSecondaryKeyword = (keyword: string) => {
    setSeoForm(prev => ({
      ...prev,
      secondaryKeywords: prev.secondaryKeywords.filter(k => k !== keyword)
    }));
  };

  const addLongTailKeyword = () => {
    if (newLongTailKeyword.trim() && !seoForm.longTailKeywords.includes(newLongTailKeyword.trim())) {
      setSeoForm(prev => ({
        ...prev,
        longTailKeywords: [...prev.longTailKeywords, newLongTailKeyword.trim()]
      }));
      setNewLongTailKeyword("");
    }
  };

  const removeLongTailKeyword = (keyword: string) => {
    setSeoForm(prev => ({
      ...prev,
      longTailKeywords: prev.longTailKeywords.filter(k => k !== keyword)
    }));
  };

  const addLsiKeyword = () => {
    if (newLsiKeyword.trim() && !seoForm.lsiKeywords.includes(newLsiKeyword.trim())) {
      setSeoForm(prev => ({
        ...prev,
        lsiKeywords: [...prev.lsiKeywords, newLsiKeyword.trim()]
      }));
      setNewLsiKeyword("");
    }
  };

  const removeLsiKeyword = (keyword: string) => {
    setSeoForm(prev => ({
      ...prev,
      lsiKeywords: prev.lsiKeywords.filter(k => k !== keyword)
    }));
  };

  const generateSlugFromTitle = () => {
    const slug = (seoForm.metaTitle || topic)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setSeoForm(prev => ({ ...prev, slug }));
  };

  const checkSlugAvailability = async () => {
    if (!seoForm.slug) return;
    
    try {
      const response = await fetch(`/api/blog/topics/check-slug?slug=${encodeURIComponent(seoForm.slug)}`);
      const data = await response.json();
      
      if (!data.available) {
        alert(`Slug "${seoForm.slug}" is already taken. Try: ${data.suggestion}`);
      } else {
        alert("Slug is available!");
      }
    } catch (error) {
      console.error("Error checking slug:", error);
    }
  };

  // Convert images to base64 for API
  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    const promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    return Promise.all(promises);
  };

  const handleGenerate = async () => {
    setCurrentStep("generating");
    
    try {
      // Convert reference images to base64 if any are uploaded
      const referenceImagesBase64 = referenceImages.length > 0 
        ? await convertImagesToBase64(referenceImages)
        : [];

      // Read brand examples file if provided
      let brandExamples = '';
      if (brandExamplesFile) {
        try {
          brandExamples = await brandExamplesFile.text();
        } catch (error) {
          console.warn('Could not read brand examples file:', error);
        }
      }

      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          audience,
          tone,
          length,
          includeImages,
          includeCallouts,
          includeCTA,
          additionalRequirements,
          imageContext,
          referenceImages: referenceImagesBase64,
          brandContext: brandContext.trim() || undefined,
          brandExamples: brandExamples.trim() || undefined,
          seo: {
            primaryKeyword: seoForm.primaryKeyword.trim() || undefined,
            secondaryKeywords: seoForm.secondaryKeywords.length > 0 ? seoForm.secondaryKeywords : undefined,
            longTailKeywords: seoForm.longTailKeywords.length > 0 ? seoForm.longTailKeywords : undefined,
            lsiKeywords: seoForm.lsiKeywords.length > 0 ? seoForm.lsiKeywords : undefined,
            keywordDensity: seoForm.keywordDensity,
            searchIntent: seoForm.searchIntent,
            metaTitle: seoForm.metaTitle.trim() || undefined,
            metaDescription: seoForm.metaDescription.trim() || undefined,
            openGraph: {
              title: seoForm.openGraph.title.trim() || undefined,
              description: seoForm.openGraph.description.trim() || undefined,
              type: seoForm.openGraph.type,
            },
            schemaType: seoForm.schemaType,
            slug: seoForm.slug.trim() || undefined,
            canonicalUrl: seoForm.canonicalUrl.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Detailed logging to understand the data structure
      console.log("=== BLOG GENERATION RESULT ===");
      console.log("Full result:", result);
      console.log("Blog post data:", result.blogPost);
      console.log("Components array:", result.components);
      console.log("Components count:", result.components?.length);
      
      if (result.components) {
        result.components.forEach((comp: any, index: number) => {
          console.log(`Component ${index}:`, {
            id: comp.id,
            type: comp.type,
            order: comp.order,
            hasContent: !!comp.content,
            hasUrl: !!comp.url,
            hasAlt: !!comp.alt,
            keys: Object.keys(comp)
          });
        });
      }
      
      setGeneratedContent(result);
      console.log("Blog generation successful, auto-saving and redirecting...");
      
      // Auto-save the generated content and redirect to full editor
      await autoSaveAndRedirect(result);
    } catch (error) {
      console.error("Error generating blog content:", error);
      alert("Failed to generate blog content. Please try again.");
      setCurrentStep("input");
    }
  };

  const autoSaveAndRedirect = async (generatedData: any) => {
    try {
      const slug = generateSlug(generatedData.blogPost.title);
      
      const postDataToSave = {
        title: generatedData.blogPost.title,
        description: generatedData.blogPost.description,
        slug,
        category: generatedData.blogPost.category,
        tags: generatedData.blogPost.tags || [],
        seoTitle: generatedData.blogPost.seoTitle,
        seoDescription: generatedData.blogPost.seoDescription,
        readTime: generatedData.blogPost.readTime,
        featuredImage: generatedData.blogPost.featuredImage,
        featuredImageThumbnail: generatedData.blogPost.featuredImageThumbnail,
        status: "draft" as const,
        components: generatedData.components.map((comp: any, index: number) => ({
          ...comp,
          order: index,
        })),
      };

      console.log("Auto-saving generated blog post...");
      const newPost = await blogApi.createPost(postDataToSave, "anonymous");
      
      console.log(`Blog post saved with ID: ${newPost._id}, redirecting to editor...`);
      router.push(`/blog/admin/manual?edit=${newPost._id}`);
      
    } catch (error) {
      console.error("Error auto-saving blog post:", error);
      // Fallback to showing the editing interface if auto-save fails
      setCurrentStep("editing");
    }
  };

  const toggleMarkdownPreview = (componentId: string) => {
    setMarkdownPreview(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  const updateComponent = (componentId: string, updates: any) => {
    if (!generatedContent) return;
    
    setGeneratedContent({
      ...generatedContent,
      components: generatedContent.components.map((comp: any) =>
        comp.order === componentId ? { ...comp, ...updates } : comp
      ),
    });
  };

  const saveDraft = async () => {
    if (!generatedContent) return;
    
    setIsSaving(true);
    try {
      const slug = generateSlug(generatedContent.blogPost.title);
      
      const postDataToSave = {
        title: generatedContent.blogPost.title,
        description: generatedContent.blogPost.description,
        slug,
        category: generatedContent.blogPost.category,
        tags: generatedContent.blogPost.tags || [],
        seoTitle: generatedContent.blogPost.seoTitle,
        seoDescription: generatedContent.blogPost.seoDescription,
        readTime: generatedContent.blogPost.readTime,
        featuredImage: generatedContent.blogPost.featuredImage,
        featuredImageThumbnail: generatedContent.blogPost.featuredImageThumbnail,
        status: "draft" as const,
        components: generatedContent.components.map((comp: any, index: number) => {
          const componentData = {
            ...comp,
            order: index,
          };
          console.log(`Component ${index} (${comp.type}) data:`, componentData);
          return componentData;
        }),
      };

      console.log("Saving blog post with data:", {
        ...postDataToSave,
        componentsCount: postDataToSave.components.length
      });

      let postId = currentPostId;
      if (currentPostId) {
        await blogApi.updatePost(currentPostId, postDataToSave, "anonymous");
      } else {
        const newPost = await blogApi.createPost(postDataToSave, "anonymous");
        setCurrentPostId(newPost._id);
        postId = newPost._id;
      }

      // Redirect to the full editor
      router.push(`/blog/admin/manual?edit=${postId}`);
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent || !currentPostId) {
      alert("Please save the draft first before publishing.");
      return;
    }

    setIsSaving(true);
    try {
      const slug = generateSlug(generatedContent.blogPost.title);
      
      const postDataToPublish = {
        title: generatedContent.blogPost.title,
        description: generatedContent.blogPost.description,
        slug,
        category: generatedContent.blogPost.category,
        tags: generatedContent.blogPost.tags || [],
        seoTitle: generatedContent.blogPost.seoTitle,
        seoDescription: generatedContent.blogPost.seoDescription,
        readTime: generatedContent.blogPost.readTime,
        featuredImage: generatedContent.blogPost.featuredImage,
        featuredImageThumbnail: generatedContent.blogPost.featuredImageThumbnail,
        status: "published" as const,
        publishedAt: new Date(),
        components: generatedContent.components.map((comp: any, index: number) => {
          const componentData = {
            ...comp,
            order: index,
          };
          return componentData;
        }),
      };

      console.log("Publishing blog post with data:", {
        ...postDataToPublish,
        componentsCount: postDataToPublish.components.length
      });

      await blogApi.updatePost(currentPostId, postDataToPublish, "anonymous");
      
      alert("Blog post published successfully!");
      
      // Optionally redirect to the published post
      // window.open(`/blog/${slug}`, '_blank');
      
    } catch (error) {
      console.error("Error publishing blog post:", error);
      alert("Failed to publish blog post. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderComponentEditor = (component: any, index: number) => {
    const IconComponent =
      componentIcons[component.type as keyof typeof componentIcons] || FileText;

    return (
      <Card key={component.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
              <IconComponent className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-sm capitalize">
                {component.type.replace("_", " ")}
              </span>
              {component.needsUpload && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-200"
                >
                  Needs Image
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600">
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
                  onClick={() => toggleMarkdownPreview(component.order)}
                  className="flex items-center gap-2"
                >
                  {markdownPreview[component.order] ? (
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
              
              {markdownPreview[component.order] ? (
                <div className="min-h-[200px] p-4 border rounded-md bg-white">
                  <div className="min-h-[200px] p-4 border rounded-md bg-white">
                    <pre className="whitespace-pre-wrap">
                      {component.content || "*No content yet. Switch to edit mode to add content.*"}
                    </pre>
                  </div>
                </div>
              ) : (
                <Textarea
                  value={component.content || ""}
                  onChange={(e) => {
                    updateComponent(component.order, { content: e.target.value });
                  }}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Enter markdown content..."
                />
              )}
            </div>
          )}

          {component.type === "image" && (
            <div className="space-y-4">
              {/* AI Generated Image Preview */}
              {(component.url || component.dalleUrl) && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <img
                    src={component.url || component.dalleUrl}
                    alt={component.alt || "AI generated blog image"}
                    className="w-full h-auto max-h-64 object-cover rounded"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {component.url ? "Auto-uploaded to ImageKit" : "Temporary DALL-E URL"}
                    </p>
                    {component.url && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image Description */}
              {component.imageDescription && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        AI Image Prompt:
                      </p>
                      <p className="text-sm text-blue-700">
                        {component.imageDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Alt Text
                </label>
                <Input
                  value={component.alt || ""}
                  onChange={(e) => {
                    updateComponent(component.order, { alt: e.target.value });
                  }}
                  placeholder="Descriptive alt text"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Caption (Optional)
                </label>
                <Input
                  value={component.caption || ""}
                  onChange={(e) => {
                    updateComponent(component.order, { caption: e.target.value });
                  }}
                  placeholder="Image caption"
                />
              </div>
              
              {/* Status indicators */}
              {component.url && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Image Ready
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    AI-generated image has been automatically uploaded to ImageKit and is ready for publication.
                  </p>
                </div>
              )}

              {component.dalleUrl && !component.url && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Upload Failed
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    Image was generated but upload to ImageKit failed. Using temporary DALL-E URL - consider regenerating.
                  </p>
                </div>
              )}

              {!component.dalleUrl && !component.url && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      No image generated
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    DALL-E failed to generate an image for this component. Try regenerating the blog post.
                  </p>
                </div>
              )}
            </div>
          )}

          {component.type === "callout" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <Input
                    value={component.title || ""}
                    onChange={(e) => {
                      updateComponent(component.order, { title: e.target.value });
                    }}
                    placeholder="Callout title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Variant
                  </label>
                  <Select value={component.variant || "info"} onValueChange={(value) => {
                    updateComponent(component.order, { variant: value });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Content
                </label>
                <Textarea
                  value={component.content || ""}
                  onChange={(e) => {
                    updateComponent(component.order, { content: e.target.value });
                  }}
                  placeholder="Callout content"
                />
              </div>
              {/* Preview */}
              <div className="border rounded-lg p-3">
                {(() => {
                  const variant =
                    (component.variant as keyof typeof calloutVariants) ||
                    "info";
                  const variantConfig = calloutVariants[variant];
                  return (
                    <div
                      className={`bg-${variantConfig.color}-50 border border-${variantConfig.color}-200 rounded-lg p-4`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {variantConfig.icon && React.createElement(variantConfig.icon, {
                          className: `h-4 w-4 text-${variantConfig.color}-600`,
                        })}
                        <span
                          className={`font-medium text-${variantConfig.color}-800`}
                        >
                          {component.title}
                        </span>
                      </div>
                      <p className={`text-${variantConfig.color}-700`}>
                        {component.content}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {component.type === "quote" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Quote Text
                </label>
                <Textarea
                  value={component.content || ""}
                  onChange={(e) => {
                    updateComponent(component.order, { content: e.target.value });
                  }}
                  placeholder="Quote content"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Author
                  </label>
                  <Input
                    value={component.author || ""}
                    onChange={(e) => {
                      updateComponent(component.order, { author: e.target.value });
                    }}
                    placeholder="Author name"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Citation
                  </label>
                  <Input
                    value={component.citation || ""}
                    onChange={(e) => {
                      updateComponent(component.order, { citation: e.target.value });
                    }}
                    placeholder="Title or source"
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="border rounded-lg p-3">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-md">
                  <blockquote className="text-gray-800 text-lg leading-relaxed italic font-medium">
                    &quot;{component.content}&quot;
                  </blockquote>
                  <footer className="text-gray-600 text-base mt-3 not-italic">
                    — {component.author}, {component.citation}
                  </footer>
                </div>
              </div>
            </div>
          )}

          {component.type === "cta" && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Button Text
                  </label>
                  <Input
                    value={component.text || ""}
                    onChange={(e) => {
                      updateComponent(component.order, { text: e.target.value });
                    }}
                    placeholder="Call to action text"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Link
                  </label>
                  <Input
                    value={component.link || ""}
                    onChange={(e) => {
                      updateComponent(component.order, { link: e.target.value });
                    }}
                    placeholder="/link-path"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Style
                  </label>
                  <Select value={component.style || "primary"} onValueChange={(value) => {
                    updateComponent(component.order, { style: value });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Preview */}
              <div className="border rounded-lg p-3 text-center">
                <Button
                  className={
                    component.style === "primary"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : component.style === "secondary"
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                  }
                  variant={
                    component.style === "outline" ? "outline" : "default"
                  }
                >
                  {component.text}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (currentStep === "input") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Blog Post with AI
          </h1>
          <p className="text-gray-600">
            Enter a topic and optional keywords to generate a complete blog post
            structure.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Blog Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Blog Topic *
              </label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Ultimate Guide to Email Marketing Automation for Small Businesses"
                className="text-lg font-medium resize-none"
                rows={2}
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific and descriptive. This will be the main focus of your blog post.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Target Audience
                </label>
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Small business owners, Marketing professionals"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tone
                </label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Content Length
              </label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (400-600 words)</SelectItem>
                  <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                  <SelectItem value="long">Long (1500-2500 words)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (3000+ words)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Content Options
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="images"
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                  />
                  <label htmlFor="images" className="text-sm text-gray-700">
                    Include custom AI-generated images (created by DALL-E)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="callouts"
                    checked={includeCallouts}
                    onCheckedChange={(checked) => setIncludeCallouts(checked as boolean)}
                  />
                  <label htmlFor="callouts" className="text-sm text-gray-700">
                    Include callout boxes with tips and highlights
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cta"
                    checked={includeCTA}
                    onCheckedChange={(checked) => setIncludeCTA(checked as boolean)}
                  />
                  <label htmlFor="cta" className="text-sm text-gray-700">
                    Include call-to-action sections
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Requirements (Optional)
              </label>
              <Textarea
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="Any specific requirements, examples to include, keywords to focus on, or particular angles you want covered..."
                className="resize-none"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide any specific instructions, keywords, or requirements for the content.
              </p>
            </div>

            {/* Brand Voice & Guidelines */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowBrandOptions(!showBrandOptions)}
              >
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Brand Voice & Guidelines
                </h3>
                <Button variant="ghost" size="sm">
                  {showBrandOptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {showBrandOptions && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Brand Voice & Guidelines
                    </label>
                    <Textarea
                      value={brandContext}
                      onChange={(e) => setBrandContext(e.target.value)}
                      placeholder="Describe your brand voice, tone guidelines, key messaging, and any specific writing rules. For example: 'We use friendly, conversational tone. Avoid jargon. Always include practical examples. Focus on empowering small business owners.'"
                      className="resize-none"
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      These guidelines will ensure the generated content matches your brand&apos;s voice and style.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Previous Posts Examples
                    </label>
                    <div className="space-y-2">
                      {brandExamplesFile ? (
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{brandExamplesFile.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(brandExamplesFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBrandExamplesFile(null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            id="brand-examples"
                            className="hidden"
                            accept=".txt,.md,.doc,.docx"
                            onChange={handleBrandExamplesUpload}
                          />
                          <label
                            htmlFor="brand-examples"
                            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            <Upload className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Upload examples of your previous posts (.txt, .md, .doc)
                            </span>
                          </label>
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        Upload 2-3 examples of your best blog posts. The AI will analyze and match your writing style.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SEO Strategy */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowSeoOptions(!showSeoOptions)}
              >
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  SEO Strategy & Optimization
                </h3>
                <Button variant="ghost" size="sm">
                  {showSeoOptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSeoOptions ? "Hide" : "Show"}
                </Button>
              </div>
              
              {showSeoOptions && (
                <div className="mt-4 space-y-6">
                  {/* Keywords Strategy */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Keywords Strategy
                    </h4>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Primary Keyword
                      </label>
                      <Input
                        value={seoForm.primaryKeyword}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, primaryKeyword: e.target.value }))}
                        placeholder="Main target keyword (2-4 words)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The main keyword you want to rank for
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Secondary Keywords
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newSecondaryKeyword}
                          onChange={(e) => setNewSecondaryKeyword(e.target.value)}
                          placeholder="Add related keyword"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
                        />
                        <Button type="button" onClick={addSecondaryKeyword} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {seoForm.secondaryKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {seoForm.secondaryKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {keyword}
                              <button
                                onClick={() => removeSecondaryKeyword(keyword)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Long-tail Keywords
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newLongTailKeyword}
                          onChange={(e) => setNewLongTailKeyword(e.target.value)}
                          placeholder="Add specific long phrase"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLongTailKeyword())}
                        />
                        <Button type="button" onClick={addLongTailKeyword} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {seoForm.longTailKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {seoForm.longTailKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              {keyword}
                              <button
                                onClick={() => removeLongTailKeyword(keyword)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        LSI Keywords
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newLsiKeyword}
                          onChange={(e) => setNewLsiKeyword(e.target.value)}
                          placeholder="Add semantically related term"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLsiKeyword())}
                        />
                        <Button type="button" onClick={addLsiKeyword} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {seoForm.lsiKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {seoForm.lsiKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1 bg-blue-50">
                              {keyword}
                              <button
                                onClick={() => removeLsiKeyword(keyword)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Search Intent
                        </label>
                        <Select value={seoForm.searchIntent} onValueChange={(value: any) => setSeoForm(prev => ({ ...prev, searchIntent: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="informational">Informational</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="navigational">Navigational</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Keyword Density (%)
                        </label>
                        <Input
                          type="number"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={seoForm.keywordDensity}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, keywordDensity: parseFloat(e.target.value) || 1.5 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meta Data */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Meta Data
                    </h4>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Meta Title
                      </label>
                      <Input
                        value={seoForm.metaTitle}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                        placeholder="SEO-optimized title (50-60 characters)"
                        maxLength={60}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {seoForm.metaTitle.length}/60 characters
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Meta Description
                      </label>
                      <Textarea
                        value={seoForm.metaDescription}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                        placeholder="Compelling description for search results"
                        maxLength={155}
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {seoForm.metaDescription.length}/155 characters
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Open Graph Title
                        </label>
                        <Input
                          value={seoForm.openGraph.title}
                          onChange={(e) => setSeoForm(prev => ({ 
                            ...prev, 
                            openGraph: { ...prev.openGraph, title: e.target.value }
                          }))}
                          placeholder="Social media title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Schema Type
                        </label>
                        <Select value={seoForm.schemaType} onValueChange={(value: any) => setSeoForm(prev => ({ ...prev, schemaType: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Article">Article</SelectItem>
                            <SelectItem value="BlogPosting">Blog Posting</SelectItem>
                            <SelectItem value="NewsArticle">News Article</SelectItem>
                            <SelectItem value="HowToArticle">How-To Article</SelectItem>
                            <SelectItem value="FAQPage">FAQ Page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Open Graph Description
                      </label>
                      <Textarea
                        value={seoForm.openGraph.description}
                        onChange={(e) => setSeoForm(prev => ({ 
                          ...prev, 
                          openGraph: { ...prev.openGraph, description: e.target.value }
                        }))}
                        placeholder="Social media description"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* URL Optimization */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      URL Optimization
                    </h4>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        URL Slug
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={seoForm.slug}
                          onChange={(e) => setSeoForm(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="url-friendly-slug"
                        />
                        <Button type="button" onClick={generateSlugFromTitle} variant="outline" size="sm">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                        <Button type="button" onClick={checkSlugAvailability} variant="outline" size="sm">
                          Check
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        SEO-friendly URL: /blog/{seoForm.slug || 'your-slug-here'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Canonical URL (Optional)
                      </label>
                      <Input
                        value={seoForm.canonicalUrl}
                        onChange={(e) => setSeoForm(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                        placeholder="https://example.com/canonical-url"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use if this content exists elsewhere
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Image Controls */}
            {includeImages && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowAdvancedImageOptions(!showAdvancedImageOptions)}
                >
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Advanced Image Controls
                  </h3>
                  <Button variant="ghost" size="sm">
                    {showAdvancedImageOptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvancedImageOptions ? "Hide" : "Show"}
                  </Button>
                </div>
                
                {showAdvancedImageOptions && (
                  <div className="mt-4 space-y-4">
                    {/* Unified Image Context */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Image Style & Brand Context
                      </label>
                      <Textarea
                        value={imageContext}
                        onChange={(e) => setImageContext(e.target.value)}
                        placeholder="Describe your brand and desired image style: colors (e.g., blue and white), design philosophy (e.g., clean, modern, minimal), inspiration (e.g., IBM, Apple), art style (e.g., abstract geometric, data visualization, professional business), mood and composition preferences. This will be applied to ALL generated images."
                        className="resize-none"
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        This context will be applied to both the featured image and all content images for consistent branding.
                      </p>
                    </div>

                    {/* Reference Images Upload */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Reference Images (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleReferenceImageUpload}
                          className="hidden"
                          id="reference-images"
                        />
                        <label
                          htmlFor="reference-images"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            Upload 1-3 reference images for style inspiration
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            AI will analyze these images and apply similar styles
                          </span>
                        </label>
                      </div>
                      
                      {/* Display uploaded reference images */}
                      {referenceImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {referenceImages.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Reference ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                              <button
                                onClick={() => removeReferenceImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Upload images that represent your desired style. AI will analyze colors, composition, and design elements.
                      </p>
                    </div>

                    {/* Style Examples */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Example Context:</h4>
                      <div className="text-xs text-gray-600 space-y-2">
                        <div><strong>Corporate Tech:</strong> &quot;ScheduleGenius brand: Professional blue and white color scheme, clean minimal design inspired by IBM and Apple. Abstract geometric elements, data visualization style, corporate presentation quality.&quot;</div>
                        <div><strong>Creative Agency:</strong> &quot;Modern creative brand with bold colors and dynamic compositions. Flat illustration style with vibrant gradients, contemporary design elements, artistic but professional.&quot;</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">
                What you&apos;ll get:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• **SEO-optimized content** using your keywords and strategy</li>
                <li>• **8-12 structured content components** tailored to your topic</li>
                <li>• **Rich text sections** with markdown formatting</li>
                <li>• **Context-aware content** based on your additional details</li>
                <li>• **Custom AI-generated images** created by DALL-E</li>
                <li>• **Callouts, quotes, and CTAs** relevant to your audience</li>
                <li>• **Keyword-optimized structure** matching your search intent</li>
                <li>• **Meta tags and Open Graph** data for social sharing</li>
                <li>• **SEO-friendly URLs** and canonical optimization</li>
                <li>• **Ready-to-edit format** with drag-and-drop capability</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === "generating") {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generating Your Blog Post
          </h1>
          <p className="text-gray-600">
            AI is creating a comprehensive blog structure for &quot;{topic}&quot;
          </p>
        </div>

        <Card className="p-12">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <Sparkles className="h-8 w-8 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                Analyzing topic and keywords...
              </p>
              <p className="text-sm text-gray-600">
                This usually takes 30-60 seconds
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-w-md">
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> While you wait, the AI is researching your
                topic, creating an optimal structure, and suggesting relevant
                images.
              </p>
            </div>
          </div>
        </Card>
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
              Edit Generated Blog Post
            </h1>
            <p className="text-gray-600">
              Review and customize your AI-generated content before publishing.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={!currentPostId || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
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
              value={generatedContent?.blogPost?.title || ""}
              onChange={(e) => {
                setGeneratedContent({
                  ...generatedContent,
                  blogPost: {
                    ...generatedContent.blogPost,
                    title: e.target.value,
                  },
                });
              }}
              className="text-lg font-medium"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </label>
              <Input
                value={generatedContent?.blogPost?.category || ""}
                onChange={(e) => {
                  setGeneratedContent({
                    ...generatedContent,
                    blogPost: {
                      ...generatedContent.blogPost,
                      category: e.target.value,
                    },
                  });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Read Time (minutes)
              </label>
              <Input
                type="number"
                value={generatedContent?.blogPost?.readTime || ""}
                onChange={(e) => {
                  setGeneratedContent({
                    ...generatedContent,
                    blogPost: {
                      ...generatedContent.blogPost,
                      readTime: parseInt(e.target.value) || 0,
                    },
                  });
                }}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Meta Description
            </label>
            <Textarea
              value={generatedContent?.blogPost?.description || ""}
              onChange={(e) => {
                setGeneratedContent({
                  ...generatedContent,
                  blogPost: {
                    ...generatedContent.blogPost,
                    description: e.target.value,
                  },
                });
              }}
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              {(generatedContent?.blogPost?.description?.length || 0)}/160 characters
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tags (comma-separated)
            </label>
            <Input
              value={generatedContent?.blogPost?.tags?.join(", ") || ""}
              onChange={(e) => {
                setGeneratedContent({
                  ...generatedContent,
                  blogPost: {
                    ...generatedContent.blogPost,
                    tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean),
                  },
                });
              }}
              placeholder="productivity, technology, tips"
            />
          </div>
          
          {/* Featured Image Display */}
          {generatedContent?.blogPost?.featuredImage && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Featured Image
              </label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <img
                  src={generatedContent.blogPost.featuredImageThumbnail || generatedContent.blogPost.featuredImage}
                  alt="Featured image"
                  className="w-full h-40 object-cover rounded"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Auto-generated featured image
                  </p>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Content Components
          </h2>
          <Dialog open={showAddComponent} onOpenChange={setShowAddComponent}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Component</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {Object.entries(componentIcons).map(([type, Icon]) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => {
                      // Add new component logic
                      setShowAddComponent(false);
                    }}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="capitalize">{type.replace("_", " ")}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {generatedContent?.components?.map((component: any, index: number) =>
          renderComponentEditor(component, index)
        ) || <p className="text-gray-500 text-center py-8">No components generated yet.</p>}
      </div>

      {/* Image Upload Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Upload Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generatedContent.components
              .filter((c: any) => c.type === "image")
              .map((component: any) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{component.src}</p>
                      <p className="text-xs text-gray-600">{component.alt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {component.needsUpload ? (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-200"
                      >
                        Upload Required
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        Uploaded
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
