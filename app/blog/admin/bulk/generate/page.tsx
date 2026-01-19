"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/blogApi";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import {
  Brain,
  ArrowLeft,
  Loader2,
  Wand2,
  Calendar,
  Clock,
  Image,
  X,
  Search,
  Target,
  Globe,
  TrendingUp,
  CheckCircle2,
  Database,
  FileSearch,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

// Research phases for progress tracking
const RESEARCH_PHASES = [
  { id: 'searching_existing', label: 'Searching existing content', duration: 5000 },
  { id: 'keyword_research', label: 'Researching keywords & SEO data', duration: 10000 },
  { id: 'trending_topics', label: 'Finding trending topics', duration: 8000 },
  { id: 'competitor_analysis', label: 'Analyzing competitors', duration: 10000 },
  { id: 'content_gaps', label: 'Identifying content gaps', duration: 8000 },
  { id: 'generating', label: 'Generating optimized topics', duration: 5000 },
];

export default function AIGeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    topicDescription: "",
    numberOfTopics: "5",
    brandContext: "",
    topicFocus: "variety",
    imageStyle: "",
    // SEO Research fields
    industryNiche: "",
    seedKeywords: "",
    competitorUrls: "",
    searchIntents: [] as string[],
    contentGoals: [] as string[],
    enableSeoResearch: true,
    scheduling: {
      type: "manual",
      frequency: "daily-1",
      preferredTimes: [] as string[],
      startDate: "",
    }
  });
  const [brandImages, setBrandImages] = useState<File[]>([]);

  // Effect to cycle through phases when generating with SEO research
  useEffect(() => {
    if (isGenerating && formData.enableSeoResearch) {
      // Start elapsed timer
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Start phase cycling
      const cyclePhases = () => {
        setCurrentPhase(prev => {
          // If we're at the last phase, stay there
          if (prev >= RESEARCH_PHASES.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      };

      // Schedule phase transitions
      let accumulatedTime = 0;
      const timeouts: NodeJS.Timeout[] = [];
      RESEARCH_PHASES.forEach((phase, index) => {
        if (index > 0) {
          accumulatedTime += RESEARCH_PHASES[index - 1].duration;
          const timeout = setTimeout(() => {
            setCurrentPhase(index);
          }, accumulatedTime);
          timeouts.push(timeout);
        }
      });

      return () => {
        timeouts.forEach(t => clearTimeout(t));
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      };
    } else {
      setCurrentPhase(0);
      setElapsedTime(0);
    }
  }, [isGenerating, formData.enableSeoResearch]);

  const handleGenerate = async () => {
    if (!formData.topicDescription.trim()) {
      alert("Please describe what topics you want to generate");
      return;
    }

    setIsGenerating(true);
    try {
      // Build SEO context for the prompt
      const seoContext = formData.enableSeoResearch ? `

SEO RESEARCH REQUIREMENTS:
${formData.industryNiche ? `Industry/Niche: ${formData.industryNiche}` : ''}
${formData.seedKeywords ? `Seed Keywords to research and expand: ${formData.seedKeywords}` : ''}
${formData.competitorUrls ? `Competitor URLs to analyze for topic ideas: ${formData.competitorUrls}` : ''}
${formData.searchIntents.length > 0 ? `Target Search Intents: ${formData.searchIntents.join(', ')}` : ''}
${formData.contentGoals.length > 0 ? `Content Goals: ${formData.contentGoals.join(', ')}` : ''}

IMPORTANT: Use web search to research:
1. Trending topics and keywords in this niche
2. Content gaps and opportunities
3. What competitors are writing about (if URLs provided)
4. High-value keyword opportunities based on seed keywords
` : '';

      // Create a controlled prompt that will generate the requested number of topics
      const prompt = `Generate exactly ${formData.numberOfTopics} blog topics about: ${formData.topicDescription}

Focus type: ${formData.topicFocus === 'variety' ? 'Mix of different topics' : formData.topicFocus === 'series' ? 'Related topics that build on each other' : 'Comprehensive pillar content'}
${seoContext}
${formData.imageStyle ? `Image style preference: ${formData.imageStyle}` : ''}

${formData.scheduling.type !== 'manual' ? `The user wants to publish ${formData.scheduling.frequency} starting from ${formData.scheduling.startDate || 'today'}` : ''}`;

      const response = await fetch("/api/blog/topics/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt,
          brandContext: formData.brandContext,
          inputType: "text",
          uploadedImages: brandImages.map(f => f.name),
          imageStyle: formData.imageStyle,
          // Pass SEO research config
          seoResearch: formData.enableSeoResearch ? {
            enabled: true,
            industryNiche: formData.industryNiche,
            seedKeywords: formData.seedKeywords.split(',').map(k => k.trim()).filter(Boolean),
            competitorUrls: formData.competitorUrls.split('\n').map(u => u.trim()).filter(Boolean),
            searchIntents: formData.searchIntents,
            contentGoals: formData.contentGoals,
          } : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Navigate to review page or handle success
        alert(`Successfully generated ${result.interpretedData.topics.length} topics!`);
        router.push("/blog/admin");
      } else {
        const error = await response.json();
        alert(`Failed to generate topics: ${error.message}`);
      }
    } catch (error) {
      console.error("Error generating topics:", error);
      alert("Error generating topics");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTimeToggle = (time: string) => {
    setFormData(prev => ({
      ...prev,
      scheduling: {
        ...prev.scheduling,
        preferredTimes: prev.scheduling.preferredTimes.includes(time)
          ? prev.scheduling.preferredTimes.filter(t => t !== time)
          : [...prev.scheduling.preferredTimes, time]
      }
    }));
  };

  const handleSearchIntentToggle = (intent: string) => {
    setFormData(prev => ({
      ...prev,
      searchIntents: prev.searchIntents.includes(intent)
        ? prev.searchIntents.filter(i => i !== intent)
        : [...prev.searchIntents, intent]
    }));
  };

  const handleContentGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      contentGoals: prev.contentGoals.includes(goal)
        ? prev.contentGoals.filter(g => g !== goal)
        : [...prev.contentGoals, goal]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setBrandImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setBrandImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AdminPasswordGate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Topic Generation</h1>
                <p className="text-gray-600 mt-2">
                  Let AI create optimized blog topics based on your needs
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/blog/admin/bulk")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Number of topics */}
                <div>
                  <Label>How many topics do you want to generate?</Label>
                  <Select 
                    value={formData.numberOfTopics}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, numberOfTopics: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 topics</SelectItem>
                      <SelectItem value="5">5 topics</SelectItem>
                      <SelectItem value="7">7 topics</SelectItem>
                      <SelectItem value="10">10 topics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Focus */}
                <div>
                  <Label>Topic Generation Approach</Label>
                  <RadioGroup 
                    value={formData.topicFocus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, topicFocus: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="variety" id="variety" />
                      <Label htmlFor="variety">Variety (mix of different topics)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="series" id="series" />
                      <Label htmlFor="series">Series (related topics that build on each other)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pillar" id="pillar" />
                      <Label htmlFor="pillar">Pillar content (comprehensive guides)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Topic Description */}
                <div>
                  <Label>Describe what topics you want</Label>
                  <Textarea 
                    value={formData.topicDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, topicDescription: e.target.value }))}
                    placeholder="Example: I need content about AI scheduling tools, productivity tips, and time management strategies for busy professionals. Focus on practical advice and real-world applications."
                    rows={4}
                  />
                </div>

                {/* Brand Context */}
                <div>
                  <Label>Brand Context & Style Guide (Optional)</Label>
                  <Textarea 
                    value={formData.brandContext}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandContext: e.target.value }))}
                    placeholder="Describe your brand voice, target audience, and any specific requirements..."
                    rows={3}
                  />
                </div>

                {/* Image Style */}
                <div>
                  <Label>Image Style Preferences (Optional)</Label>
                  <Textarea 
                    value={formData.imageStyle}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageStyle: e.target.value }))}
                    placeholder="Describe the visual style for images (e.g., modern, minimalist, colorful, professional, tech-focused, illustrations vs photos)..."
                    rows={2}
                  />
                </div>

                {/* Brand Images */}
                <div>
                  <Label>Brand Reference Images (Optional)</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="brand-image-upload"
                    />
                    <label htmlFor="brand-image-upload">
                      <Button variant="outline" asChild size="sm" className="w-full">
                        <span className="cursor-pointer">
                          <Image className="h-4 w-4 mr-2" />
                          Upload Reference Images
                        </span>
                      </Button>
                    </label>
                    
                    {brandImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {brandImages.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Upload images that represent your brand&apos;s visual style
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Research Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO Research Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable SEO Research Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableSeoResearch"
                    checked={formData.enableSeoResearch}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSeoResearch: checked as boolean }))}
                  />
                  <Label htmlFor="enableSeoResearch" className="font-medium">
                    Enable SEO-focused topic research (uses web search)
                  </Label>
                </div>

                {formData.enableSeoResearch && (
                  <div className="space-y-6 border-l-2 border-blue-200 pl-4 ml-2">
                    {/* Industry/Niche */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Industry / Niche
                      </Label>
                      <Input
                        value={formData.industryNiche}
                        onChange={(e) => setFormData(prev => ({ ...prev, industryNiche: e.target.value }))}
                        placeholder="e.g., SaaS, E-commerce, Health & Wellness, B2B Marketing"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Helps target research to your specific market
                      </p>
                    </div>

                    {/* Seed Keywords */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Seed Keywords
                      </Label>
                      <Input
                        value={formData.seedKeywords}
                        onChange={(e) => setFormData(prev => ({ ...prev, seedKeywords: e.target.value }))}
                        placeholder="e.g., email marketing, lead generation, conversion optimization"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comma-separated keywords to research and expand upon
                      </p>
                    </div>

                    {/* Competitor URLs */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Competitor URLs (Optional)
                      </Label>
                      <Textarea
                        value={formData.competitorUrls}
                        onChange={(e) => setFormData(prev => ({ ...prev, competitorUrls: e.target.value }))}
                        placeholder="https://competitor1.com/blog&#10;https://competitor2.com/blog&#10;https://competitor3.com/blog"
                        rows={3}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        One URL per line. AI will analyze these for topic inspiration and gaps.
                      </p>
                    </div>

                    {/* Search Intent Focus */}
                    <div>
                      <Label>Search Intent Focus</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        What type of content should we prioritize?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "informational", label: "Informational", desc: "How-to guides, tutorials, explanations" },
                          { value: "commercial", label: "Commercial", desc: "Product comparisons, reviews, best-of lists" },
                          { value: "transactional", label: "Transactional", desc: "Buying guides, pricing, deals" },
                          { value: "navigational", label: "Navigational", desc: "Brand-specific, feature pages" }
                        ].map((intent) => (
                          <div key={intent.value} className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50">
                            <Checkbox
                              id={`intent-${intent.value}`}
                              checked={formData.searchIntents.includes(intent.value)}
                              onCheckedChange={() => handleSearchIntentToggle(intent.value)}
                            />
                            <div>
                              <Label htmlFor={`intent-${intent.value}`} className="text-sm font-medium cursor-pointer">
                                {intent.label}
                              </Label>
                              <p className="text-xs text-gray-500">{intent.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Goals */}
                    <div>
                      <Label>Content Goals</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        What should the AI prioritize when researching topics?
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { value: "trending", label: "Trending Topics", desc: "Find what's currently popular in your niche" },
                          { value: "gaps", label: "Content Gaps", desc: "Topics competitors haven't covered well" },
                          { value: "high-volume", label: "High Search Volume", desc: "Target keywords with significant traffic potential" },
                          { value: "long-tail", label: "Long-tail Opportunities", desc: "Specific, lower-competition keywords" },
                          { value: "evergreen", label: "Evergreen Content", desc: "Topics that stay relevant over time" }
                        ].map((goal) => (
                          <div key={goal.value} className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50">
                            <Checkbox
                              id={`goal-${goal.value}`}
                              checked={formData.contentGoals.includes(goal.value)}
                              onCheckedChange={() => handleContentGoalToggle(goal.value)}
                            />
                            <div>
                              <Label htmlFor={`goal-${goal.value}`} className="text-sm font-medium cursor-pointer">
                                {goal.label}
                              </Label>
                              <p className="text-xs text-gray-500">{goal.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduling Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publishing Schedule (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={formData.scheduling.type}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    scheduling: { ...prev.scheduling, type: value }
                  }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual">Manual (I&apos;ll schedule them myself)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">Automatic scheduling</Label>
                  </div>
                </RadioGroup>

                {formData.scheduling.type === "auto" && (
                  <div className="ml-6 space-y-4 border-l-2 pl-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select 
                        value={formData.scheduling.frequency}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          scheduling: { ...prev.scheduling, frequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily-1">1 per day</SelectItem>
                          <SelectItem value="daily-2">2 per day</SelectItem>
                          <SelectItem value="weekly-3">3 per week</SelectItem>
                          <SelectItem value="weekly-5">5 per week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Preferred Publishing Times</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { value: "morning", label: "Morning (6 AM - 12 PM)" },
                          { value: "afternoon", label: "Afternoon (12 PM - 5 PM)" },
                          { value: "evening", label: "Evening (5 PM - 9 PM)" },
                          { value: "night", label: "Night (9 PM - 6 AM)" }
                        ].map((time) => (
                          <div key={time.value} className="flex items-center space-x-2">
                            <Checkbox 
                              id={time.value}
                              checked={formData.scheduling.preferredTimes.includes(time.value)}
                              onCheckedChange={() => handleTimeToggle(time.value)}
                            />
                            <Label htmlFor={time.value} className="text-sm">{time.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      <Input 
                        type="date" 
                        value={formData.scheduling.startDate}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          scheduling: { ...prev.scheduling, startDate: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push("/blog/admin/bulk")}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.topicDescription.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Topics
                  </>
                )}
              </Button>
            </div>

            {/* Progress Overlay for SEO Research */}
            {isGenerating && formData.enableSeoResearch && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Search className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">SEO Research in Progress</h3>
                      <p className="text-sm text-blue-700">
                        Analyzing keywords, trends, and competitors...
                      </p>
                    </div>
                    <div className="ml-auto text-sm text-blue-600 font-mono">
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {RESEARCH_PHASES.map((phase, index) => {
                      const isActive = index === currentPhase;
                      const isComplete = index < currentPhase;
                      const isPending = index > currentPhase;

                      return (
                        <div
                          key={phase.id}
                          className={`flex items-center gap-3 p-2 rounded transition-all ${
                            isActive ? 'bg-blue-100 border border-blue-200' : ''
                          } ${isComplete ? 'opacity-60' : ''} ${isPending ? 'opacity-40' : ''}`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : isActive ? (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={`text-sm ${isActive ? 'font-medium text-blue-900' : 'text-gray-600'}`}>
                            {phase.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={((currentPhase + 1) / RESEARCH_PHASES.length) * 100}
                      className="h-2"
                    />
                  </div>

                  <p className="text-xs text-center text-blue-600 mt-3">
                    This typically takes 1-2 minutes. The AI is researching SEO opportunities for your topics.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Simple progress for non-SEO research */}
            {isGenerating && !formData.enableSeoResearch && (
              <Card className="border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                    <span className="text-gray-700">Generating your topics...</span>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminPasswordGate>
  );
}