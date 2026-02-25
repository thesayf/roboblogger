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
} from "lucide-react";

interface BrandSettings {
  blogName: string;
  blogDescription: string;
  targetAudience: string;
  tone: 'professional' | 'casual' | 'technical' | 'conversational' | 'authoritative' | 'friendly' | 'custom';
  customTone: string;
  styleGuidelines: string;
  topicsWeCover: string;
  thingsToAvoid: string;
  exampleContent: string;
  industryNiche: string;
}

const defaultSettings: BrandSettings = {
  blogName: '',
  blogDescription: '',
  targetAudience: '',
  tone: 'professional',
  customTone: '',
  styleGuidelines: '',
  topicsWeCover: '',
  thingsToAvoid: '',
  exampleContent: '',
  industryNiche: '',
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

  useEffect(() => {
    fetchSettings();
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
          targetAudience: data.targetAudience || '',
          tone: data.tone || 'professional',
          customTone: data.customTone || '',
          styleGuidelines: data.styleGuidelines || '',
          topicsWeCover: data.topicsWeCover || '',
          thingsToAvoid: data.thingsToAvoid || '',
          exampleContent: data.exampleContent || '',
          industryNiche: data.industryNiche || '',
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
