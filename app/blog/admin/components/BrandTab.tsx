"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, friendly, conversational' },
  { value: 'technical', label: 'Technical', description: 'Detailed, precise, expert-level' },
  { value: 'conversational', label: 'Conversational', description: 'Like talking to a friend' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident, trustworthy' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, helpful' },
  { value: 'custom', label: 'Custom', description: 'Define your own tone' },
];

export function BrandTab() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
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
    setSaveStatus('idle'); // Reset save status when editing
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Brand Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure your brand context to ensure consistent content generation
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Blog Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Blog Identity
          </CardTitle>
          <CardDescription>
            Basic information about your blog that helps AI understand your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="blogName">Blog / Brand Name</Label>
            <Input
              id="blogName"
              value={settings.blogName}
              onChange={(e) => updateField('blogName', e.target.value)}
              placeholder="e.g., TechStartup Blog, Marketing Insights"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="blogDescription">Blog Description</Label>
            <Textarea
              id="blogDescription"
              value={settings.blogDescription}
              onChange={(e) => updateField('blogDescription', e.target.value)}
              placeholder="Describe what your blog is about, its mission, and the value it provides to readers..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps AI understand the purpose and focus of your content
            </p>
          </div>
          <div>
            <Label htmlFor="industryNiche" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Industry / Niche
            </Label>
            <Input
              id="industryNiche"
              value={settings.industryNiche}
              onChange={(e) => updateField('industryNiche', e.target.value)}
              placeholder="e.g., SaaS, E-commerce, Health & Wellness, B2B Marketing"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for SEO research and topic generation
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Target Audience
          </CardTitle>
          <CardDescription>
            Who are you writing for? This helps tailor content to your readers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.targetAudience}
            onChange={(e) => updateField('targetAudience', e.target.value)}
            placeholder="Describe your target audience: demographics, pain points, expertise level, what they're looking for...

Example: Small business owners and marketing managers at companies with 10-50 employees. They're looking for practical, actionable marketing advice that doesn't require a big budget or dedicated marketing team. Most have basic digital marketing knowledge but want to improve their skills."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Voice & Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Voice & Style
          </CardTitle>
          <CardDescription>
            Define how your content should sound and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tone</Label>
            <Select
              value={settings.tone}
              onValueChange={(value) => updateField('tone', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-gray-500 ml-2">- {option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settings.tone === 'custom' && (
            <div>
              <Label htmlFor="customTone">Custom Tone Description</Label>
              <Textarea
                id="customTone"
                value={settings.customTone}
                onChange={(e) => updateField('customTone', e.target.value)}
                placeholder="Describe your unique tone in detail..."
                rows={2}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="styleGuidelines">Style Guidelines</Label>
            <Textarea
              id="styleGuidelines"
              value={settings.styleGuidelines}
              onChange={(e) => updateField('styleGuidelines', e.target.value)}
              placeholder="Any specific style rules or preferences...

Example:
- Use short paragraphs (2-3 sentences max)
- Include practical examples and case studies
- Avoid jargon unless explained
- Use bullet points for lists
- Address the reader directly using 'you'"
              rows={5}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Guidelines
          </CardTitle>
          <CardDescription>
            Define what topics to focus on and what to avoid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topicsWeCover">Topics We Cover</Label>
            <Textarea
              id="topicsWeCover"
              value={settings.topicsWeCover}
              onChange={(e) => updateField('topicsWeCover', e.target.value)}
              placeholder="List the main topics and themes your blog covers...

Example:
- Email marketing strategies
- Social media marketing
- Content marketing and SEO
- Marketing automation
- Small business growth tips"
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="thingsToAvoid" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Things to Avoid
            </Label>
            <Textarea
              id="thingsToAvoid"
              value={settings.thingsToAvoid}
              onChange={(e) => updateField('thingsToAvoid', e.target.value)}
              placeholder="Topics, words, competitors, or approaches to avoid...

Example:
- Don't mention competitor X by name
- Avoid political topics
- Don't use overly salesy language
- Avoid making income claims or guarantees"
              rows={4}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Example Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Example Content (Optional)
          </CardTitle>
          <CardDescription>
            Paste samples of your best content to help AI match your style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.exampleContent}
            onChange={(e) => updateField('exampleContent', e.target.value)}
            placeholder="Paste 2-3 paragraphs from your best blog posts that exemplify your writing style..."
            rows={8}
          />
          <p className="text-xs text-gray-500 mt-2">
            This is used as a reference for style matching during content generation
          </p>
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
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
