"use client";

import React, { useState, useEffect } from "react";
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

export default function AIGeneratePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    topicDescription: "",
    numberOfTopics: "5",
    brandContext: "",
    topicFocus: "variety",
    imageStyle: "",
    scheduling: {
      type: "manual",
      frequency: "daily-1",
      preferredTimes: [] as string[],
      startDate: "",
    }
  });
  const [brandImages, setBrandImages] = useState<File[]>([]);

  const handleGenerate = async () => {
    if (!formData.topicDescription.trim()) {
      alert("Please describe what topics you want to generate");
      return;
    }

    setIsGenerating(true);
    try {
      // Create a controlled prompt that will generate the requested number of topics
      const prompt = `Generate exactly ${formData.numberOfTopics} blog topics about: ${formData.topicDescription}

Focus type: ${formData.topicFocus === 'variety' ? 'Mix of different topics' : formData.topicFocus === 'series' ? 'Related topics that build on each other' : 'Comprehensive pillar content'}

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
          imageStyle: formData.imageStyle
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Topics
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminPasswordGate>
  );
}