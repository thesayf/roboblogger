"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Building2,
  Users,
  MessageSquare,
  FileText,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle,
  Target,
  Sparkles,
  ImageIcon,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";

interface BrandSettings {
  blogName: string;
  blogDescription: string;
  blogUrl: string;
  targetAudience: string;
  tone: 'professional' | 'casual' | 'technical' | 'conversational' | 'authoritative' | 'friendly' | 'custom';
  customTone: string;
  styleGuidelines: string;
  topicsWeCover: string;
  thingsToAvoid: string;
  exampleContent: string;
  industryNiche: string;
  referenceImages: string[];
}

interface MediaImage {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
}

const defaultSettings: BrandSettings = {
  blogName: '',
  blogDescription: '',
  blogUrl: '',
  targetAudience: '',
  tone: 'professional',
  customTone: '',
  styleGuidelines: '',
  topicsWeCover: '',
  thingsToAvoid: '',
  exampleContent: '',
  industryNiche: '',
  referenceImages: [],
};

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, friendly' },
  { value: 'technical', label: 'Technical', description: 'Detailed, expert-level' },
  { value: 'conversational', label: 'Conversational', description: 'Like talking to a friend' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable' },
  { value: 'custom', label: 'Custom', description: 'Define your own' },
];

export function BrandTab() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaImages, setMediaImages] = useState<MediaImage[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Refresh when chat agent updates brand settings
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collections?.includes('brand')) fetchSettings();
    };
    window.addEventListener('chat-data-changed', handler);
    return () => window.removeEventListener('chat-data-changed', handler);
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/blog/brand-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          blogName: data.blogName || '',
          blogDescription: data.blogDescription || '',
          blogUrl: data.blogUrl || '',
          targetAudience: data.targetAudience || '',
          tone: data.tone || 'professional',
          customTone: data.customTone || '',
          styleGuidelines: data.styleGuidelines || '',
          topicsWeCover: data.topicsWeCover || '',
          thingsToAvoid: data.thingsToAvoid || '',
          exampleContent: data.exampleContent || '',
          industryNiche: data.industryNiche || '',
          referenceImages: data.referenceImages || [],
        });
      }
    } catch (err) {
      console.error('Error fetching brand settings:', err);
      setError('Failed to load brand settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setError(null);

      const response = await fetch('/api/blog/brand-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save settings');
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving brand settings:', err);
      setError('Failed to save brand settings');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof BrandSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const fetchMediaImages = async () => {
    try {
      setIsLoadingMedia(true);
      const res = await fetch('/api/images?limit=50');
      if (res.ok) {
        const data = await res.json();
        setMediaImages(data.images || []);
      }
    } catch (err) {
      console.error('Error fetching media images:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const openMediaPicker = () => {
    setShowMediaPicker(true);
    fetchMediaImages();
  };

  const addReferenceImage = (url: string) => {
    if (settings.referenceImages.length >= 5) return;
    if (settings.referenceImages.includes(url)) return;
    setSettings(prev => ({ ...prev, referenceImages: [...prev.referenceImages, url] }));
    setSaveStatus('idle');
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        // Add to media list and auto-select
        setMediaImages(prev => [{ fileId: data.fileId, name: data.name, url: data.url, thumbnailUrl: data.thumbnailUrl || data.url }, ...prev]);
        addReferenceImage(data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeReferenceImage = (index: number) => {
    setSettings(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
    setSaveStatus('idle');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#888888]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[24px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            Brand Settings
          </h2>
          <p className="text-[14px] text-[#666666] mt-1">
            Configure your brand context for consistent AI-generated content
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#111111] hover:bg-[#333333] text-white rounded-full px-5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-[14px]">{error}</span>
        </div>
      )}

      {/* Blog Identity */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Blog Identity
            </h3>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Basic information that helps AI understand your brand
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="text-[13px] text-[#444444] font-medium">Blog / Brand Name</Label>
            <Input
              value={settings.blogName}
              onChange={(e) => updateField('blogName', e.target.value)}
              placeholder="e.g., TechStartup Blog, Marketing Insights"
              className="mt-1.5 h-10 border-[#E0DED8] focus:border-[#111111] focus:ring-0"
            />
          </div>
          <div>
            <Label className="text-[13px] text-[#444444] font-medium">Blog Description</Label>
            <Textarea
              value={settings.blogDescription}
              onChange={(e) => updateField('blogDescription', e.target.value)}
              placeholder="Describe what your blog is about, its mission, and the value it provides..."
              rows={3}
              className="mt-1.5 border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
            />
            <p className="text-[12px] text-[#888888] mt-1.5">
              Helps AI understand the purpose and focus of your content
            </p>
          </div>
          <div>
            <Label className="text-[13px] text-[#444444] font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Industry / Niche
            </Label>
            <Input
              value={settings.industryNiche}
              onChange={(e) => updateField('industryNiche', e.target.value)}
              placeholder="e.g., SaaS, E-commerce, Health & Wellness, B2B Marketing"
              className="mt-1.5 h-10 border-[#E0DED8] focus:border-[#111111] focus:ring-0"
            />
            <p className="text-[12px] text-[#888888] mt-1.5">
              Used for SEO research and topic generation
            </p>
          </div>
          <div>
            <Label className="text-[13px] text-[#444444] font-medium flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Blog URL
            </Label>
            <div className="mt-1.5 flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#E0DED8] bg-[#F5F4F0] text-[13px] text-[#888888]">
                https://
              </span>
              <Input
                value={settings.blogUrl.replace(/^https?:\/\//, '')}
                onChange={(e) => updateField('blogUrl', 'https://' + e.target.value.replace(/^https?:\/\//, ''))}
                placeholder="yourdomain.com/blog"
                className="h-10 border-[#E0DED8] focus:border-[#111111] focus:ring-0 rounded-l-none"
              />
            </div>
            <p className="text-[12px] text-[#888888] mt-1.5">
              Your live blog URL — used for &quot;View live&quot; links and SEO analysis
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Target Audience
            </h3>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Who are you writing for? This helps tailor content to your readers
          </p>
        </div>
        <div className="p-6">
          <Textarea
            value={settings.targetAudience}
            onChange={(e) => updateField('targetAudience', e.target.value)}
            placeholder="Describe your target audience: demographics, pain points, expertise level, what they're looking for..."
            rows={4}
            className="border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
          />
        </div>
      </section>

      {/* Voice & Style */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Voice & Style
            </h3>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Define how your content should sound and feel
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="text-[13px] text-[#444444] font-medium">Tone</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('tone', option.value)}
                  className={`px-4 py-2 text-[13px] rounded-full border transition-colors ${
                    settings.tone === option.value
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#444444] border-[#E0DED8] hover:border-[#CCCCCC]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {settings.tone !== 'custom' && (
              <p className="text-[12px] text-[#888888] mt-2">
                {toneOptions.find(t => t.value === settings.tone)?.description}
              </p>
            )}
          </div>

          {settings.tone === 'custom' && (
            <div>
              <Label className="text-[13px] text-[#444444] font-medium">Custom Tone Description</Label>
              <Textarea
                value={settings.customTone}
                onChange={(e) => updateField('customTone', e.target.value)}
                placeholder="Describe your unique tone in detail..."
                rows={2}
                className="mt-1.5 border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
              />
            </div>
          )}

          <div>
            <Label className="text-[13px] text-[#444444] font-medium">Style Guidelines</Label>
            <Textarea
              value={settings.styleGuidelines}
              onChange={(e) => updateField('styleGuidelines', e.target.value)}
              placeholder="Any specific style rules or preferences...

Example:
- Use short paragraphs (2-3 sentences)
- Include practical examples
- Avoid jargon unless explained
- Address the reader directly using 'you'"
              rows={5}
              className="mt-1.5 border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Content Guidelines */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Content Guidelines
            </h3>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Define what topics to focus on and what to avoid
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <Label className="text-[13px] text-[#444444] font-medium">Topics We Cover</Label>
            <Textarea
              value={settings.topicsWeCover}
              onChange={(e) => updateField('topicsWeCover', e.target.value)}
              placeholder="List the main topics and themes your blog covers..."
              rows={4}
              className="mt-1.5 border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
            />
          </div>
          <div>
            <Label className="text-[13px] text-[#444444] font-medium flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              Things to Avoid
            </Label>
            <Textarea
              value={settings.thingsToAvoid}
              onChange={(e) => updateField('thingsToAvoid', e.target.value)}
              placeholder="Topics, words, competitors, or approaches to avoid..."
              rows={4}
              className="mt-1.5 border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Example Content */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Example Content
            </h3>
            <span className="text-[12px] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Paste samples of your best content to help AI match your style
          </p>
        </div>
        <div className="p-6">
          <Textarea
            value={settings.exampleContent}
            onChange={(e) => updateField('exampleContent', e.target.value)}
            placeholder="Paste 2-3 paragraphs from your best blog posts that exemplify your writing style..."
            rows={6}
            className="border-[#E0DED8] focus:border-[#111111] focus:ring-0 resize-none"
          />
          <p className="text-[12px] text-[#888888] mt-2">
            Used as a reference for style matching during content generation
          </p>
        </div>
      </section>

      {/* Brand Reference Images */}
      <section className="bg-white rounded-xl border border-[#E0DED8] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0EEE8]">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#666666]" />
            <h3 className="text-[16px] font-semibold text-[#111111]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Brand Image Style
            </h3>
            <span className="text-[12px] text-[#888888] bg-[#F5F4F0] px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <p className="text-[13px] text-[#888888] mt-1">
            Select up to 5 images from your media library as style inspiration. These will be analyzed by AI to generate images that match your brand aesthetic. Used as a fallback when topics don&apos;t have their own reference images.
          </p>
        </div>
        <div className="p-6">
          {/* Selected reference images */}
          {settings.referenceImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {settings.referenceImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-[#E0DED8]"
                  />
                  <button
                    type="button"
                    onClick={() => removeReferenceImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {settings.referenceImages.length < 5 && (
            <Button
              type="button"
              variant="outline"
              onClick={openMediaPicker}
              className="border-dashed border-[#E0DED8] text-[#666666] hover:border-[#CCCCCC]"
            >
              <Plus className="h-4 w-4 mr-2" />
              {settings.referenceImages.length === 0 ? 'Select from Media Library' : 'Add More Images'}
            </Button>
          )}

          {/* Media picker modal */}
          {showMediaPicker && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-[#F0EEE8] flex items-center justify-between">
                  <h4 className="text-[16px] font-semibold text-[#111111]">Select Reference Images</h4>
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border border-[#E0DED8] hover:bg-[#F5F4F0] transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Upload
                      <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                    </label>
                    <button onClick={() => setShowMediaPicker(false)} className="text-[#888888] hover:text-[#111111]">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#888888]" />
                    </div>
                  ) : mediaImages.length === 0 ? (
                    <div className="text-center py-12 text-[#888888]">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-[14px]">No images in your media library</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {mediaImages.map((img) => {
                        const isSelected = settings.referenceImages.includes(img.url);
                        return (
                          <button
                            key={img.fileId}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                const idx = settings.referenceImages.indexOf(img.url);
                                if (idx !== -1) removeReferenceImage(idx);
                              } else {
                                addReferenceImage(img.url);
                              }
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                              isSelected
                                ? 'border-[#111111] ring-2 ring-[#111111]/20'
                                : 'border-transparent hover:border-[#CCCCCC]'
                            }`}
                          >
                            <img
                              src={img.thumbnailUrl || img.url}
                              alt={img.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="px-6 py-3 border-t border-[#F0EEE8] flex items-center justify-between">
                  <span className="text-[12px] text-[#888888]">
                    {settings.referenceImages.length}/5 images selected
                  </span>
                  <Button
                    onClick={() => setShowMediaPicker(false)}
                    className="bg-[#111111] hover:bg-[#333333] text-white rounded-full px-5"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Save */}
      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#111111] hover:bg-[#333333] text-white rounded-full px-6 h-11"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Changes Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
