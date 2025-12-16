"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import {
  Upload,
  Copy,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FileJson,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JSON_TEMPLATE = [
  {
    topic: "Your Blog Post Title Here",
    audience: "Target audience description",
    tone: "professional", // professional, casual, academic, conversational, etc.
    length: "Medium (800-1200 words)", // Short (400-600), Medium (800-1200), Long (1500-2000), Comprehensive (2500+)
    includeImages: true,
    includeCallouts: true,
    includeCTA: true,
    additionalRequirements: "Any special requirements or notes",
    brandContext: "Brand voice and style guide specific to this topic",
    priority: "medium", // low, medium, high
    tags: ["tag1", "tag2", "tag3"],
    imageContext: "Describe the visual style for this specific topic",
    referenceImages: ["https://your-image-url.com/image1.jpg"], // Array of image URLs from your image library
    notes: "Internal notes about this topic",
    estimatedDuration: 5, // minutes to generate
    scheduledAt: "2025-07-22T09:00:00", // Local time format - will be converted to UTC automatically
    seo: {
      primaryKeyword: "main keyword",
      secondaryKeywords: ["related keyword 1", "related keyword 2"],
      longTailKeywords: ["longer search phrase 1", "longer search phrase 2"],
      lsiKeywords: ["semantically related 1", "semantically related 2"],
      keywordDensity: 1.5, // target percentage
      searchIntent: "informational", // informational, commercial, navigational, transactional
      metaTitle: "SEO optimized title (50-60 chars)",
      metaDescription: "Compelling meta description (max 155 chars)",
      openGraph: {
        title: "Social media title",
        description: "Social media description",
        type: "article"
      },
      schemaType: "BlogPosting", // Article, BlogPosting, NewsArticle, HowToArticle, FAQPage
      slug: "url-friendly-slug",
      canonicalUrl: null
    }
  }
];

export default function BulkImportPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedTopics, setParsedTopics] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cleanedJson, setCleanedJson] = useState("");

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(JSON_TEMPLATE, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setJsonInput(text);
        validateJson(text);
      } catch (error) {
        setValidationErrors(["Failed to read file"]);
      }
    }
  };


  const cleanJsonInput = (input: string): string => {
    // First pass: Handle all smart quotes and special characters
    let cleaned = input
      // Replace all types of smart quotes
      .replace(/[\u201C\u201D]/g, '"')  // Replace " and "
      .replace(/[\u2018\u2019]/g, "'")  // Replace ' and '
      .replace(/[\u201A\u201B]/g, "'")  // Replace ‚ and ‛
      .replace(/[\u201E\u201F]/g, '"')  // Replace „ and ‟
      // Remove zero-width spaces and other invisible characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Replace en/em dashes with regular dashes
      .replace(/[\u2013\u2014]/g, '-')
      // Replace ellipsis with three dots
      .replace(/\u2026/g, '...')
      // Remove all control characters (0x00-0x1F) except tab (0x09), newline (0x0A), and carriage return (0x0D)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove other problematic Unicode characters
      .replace(/[\u2028\u2029]/g, '') // Line and paragraph separators
      .replace(/[\u00A0]/g, ' '); // Non-breaking spaces to regular spaces

    // Second pass: More aggressive cleaning within strings
    const stringPattern = /"([^"\\]|\\.)*"/g;
    cleaned = cleaned.replace(stringPattern, function(match) {
      // Clean the content inside quotes
      let content = match.slice(1, -1); // Remove quotes
      content = content
        // Replace all line breaks with spaces
        .replace(/[\r\n\u2028\u2029]+/g, ' ')
        // Replace tabs with spaces
        .replace(/\t/g, ' ')
        // Remove any remaining control characters
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ')
        // Trim
        .trim();
      return '"' + content + '"';
    });

    // Third pass: Fix JSON structure issues
    cleaned = cleaned
      // Remove trailing commas (with optional whitespace)
      .replace(/,(\s*)([\]}])/g, '$1$2')
      // Ensure proper spacing around colons
      .replace(/:\s*(["\[\{])/g, ': $1')
      // Remove any comments (if accidentally included)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Trim each line
      .split('\n').map(line => line.trim()).join('\n')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove any BOM at the start
      .replace(/^\uFEFF/, '')
      // Final trim
      .trim();

    // Final safety check: ensure it starts with [ or { and ends with ] or }
    if (!cleaned.match(/^\s*[\[\{]/)) {
      cleaned = cleaned.replace(/^[^[\{]*/, '');
    }
    if (!cleaned.match(/[\]\}]\s*$/)) {
      cleaned = cleaned.replace(/[^\]}\s]*$/, '');
    }

    return cleaned;
  };

  const validateJson = (input: string) => {
    setIsValidating(true);
    setValidationErrors([]);
    
    try {
      // Try multiple parsing strategies
      let parsed;
      let parseErrors = [];
      
      // Strategy 1: Try parsing as-is
      try {
        parsed = JSON.parse(input);
      } catch (e1) {
        parseErrors.push("Raw parse failed");
        
        // Strategy 2: Try with basic cleaning
        try {
          const basicCleaned = input
            .replace(/[\u201C\u201D]/g, '"')  // Smart quotes
            .replace(/[\u2018\u2019]/g, "'")  // Smart apostrophes
            .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
            .replace(/[\u2026]/g, '...');     // Ellipsis
          parsed = JSON.parse(basicCleaned);
        } catch (e2) {
          parseErrors.push("Basic cleaning failed");
          
          // Strategy 3: Try with aggressive cleaning
          try {
            const cleanedInput = cleanJsonInput(input);
            parsed = JSON.parse(cleanedInput);
          } catch (e3) {
            parseErrors.push("Aggressive cleaning failed");
            
            // Strategy 4: Last resort - try to extract JSON array
            const arrayMatch = input.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
              try {
                const extracted = cleanJsonInput(arrayMatch[0]);
                parsed = JSON.parse(extracted);
              } catch (e4) {
                throw new Error(`Unable to parse JSON after multiple attempts. Original error: ${e1}`);
              }
            } else {
              throw new Error(`Unable to parse JSON. Please ensure your JSON is valid. You can test it at jsonlint.com`);
            }
          }
        }
      }
      
      const topics = Array.isArray(parsed) ? parsed : parsed.topics || [];
      
      if (!Array.isArray(topics) || topics.length === 0) {
        setValidationErrors(["Input must be an array of topics or an object with a 'topics' array"]);
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const validatedTopics = topics.map((topic, index) => {
        // Only check for the absolute minimum required field
        if (!topic.topic) {
          errors.push(`Topic ${index + 1}: Missing required 'topic' field`);
          return null;
        }

        // Auto-fix priority if provided but invalid (don't error, just fix it)
        if (topic.priority && typeof topic.priority === 'string') {
          const priority = topic.priority.toLowerCase();
          if (!['low', 'medium', 'high'].includes(priority)) {
            topic.priority = 'medium'; // Just default it silently
          }
        }

        // Auto-fix SEO fields silently without warnings
        if (topic.seo) {
          if (topic.seo.searchIntent) {
            const intent = topic.seo.searchIntent.toLowerCase();
            const validIntents = ['informational', 'commercial', 'navigational', 'transactional'];
            if (!validIntents.includes(intent)) {
              topic.seo.searchIntent = 'informational'; // Just default it
            }
          }
          
          // Silently truncate to match backend limit of 155 chars
          if (topic.seo.metaDescription && topic.seo.metaDescription.length > 155) {
            topic.seo.metaDescription = topic.seo.metaDescription.substring(0, 155);
          }
        }

        // Handle scheduled date - just try to parse it
        if (topic.scheduledAt) {
          try {
            const scheduledDate = new Date(topic.scheduledAt);
            if (!isNaN(scheduledDate.getTime())) {
              topic.scheduledAt = scheduledDate.toISOString();
            }
          } catch {
            // Just skip it if it fails
            delete topic.scheduledAt;
          }
        }

        return topic;
      });

      // Filter out null topics
      const finalTopics = validatedTopics.filter(Boolean);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else if (finalTopics.length === 0) {
        setValidationErrors(["No valid topics found in the JSON"]);
      } else {
        // Success! Don't bother with warnings
        setParsedTopics(finalTopics);
        setCleanedJson(JSON.stringify(finalTopics, null, 2));
        setShowPreview(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Much simpler error message
      const errors = [
        "Unable to parse JSON. Try this:",
        "",
        "1. Copy your JSON to jsonlint.com",
        "2. Click 'Validate JSON'", 
        "3. Fix any errors it shows",
        "4. Copy the validated JSON back here",
        "",
        `Error: ${errorMessage.substring(0, 150)}`
      ];
      
      setValidationErrors(errors);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (parsedTopics.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/blog/topics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: parsedTopics
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${result.created} topics!`);
        router.push("/blog/admin");
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.message}`);
      }
    } catch (error) {
      alert("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminPasswordGate>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Import Topics</h1>
                <p className="text-gray-600 mt-2">
                  Import pre-written blog topics via JSON format
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/blog/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* JSON Template Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileJson className="h-5 w-5" />
                      JSON Template
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTemplate}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Template
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Copy this template and modify it with your topics. All fields except &apos;topic&apos; are optional.
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{JSON.stringify(JSON_TEMPLATE, null, 2)}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* Input Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Import Your Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="paste">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="paste">Paste JSON</TabsTrigger>
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="space-y-4">
                      <div>
                        <Label>Paste your JSON data</Label>
                        <Textarea
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder="Paste your JSON array of topics here..."
                          className="min-h-[300px] font-mono text-sm"
                        />
                      </div>
                      <Button 
                        onClick={() => validateJson(jsonInput)}
                        disabled={!jsonInput || isValidating}
                        className="w-full"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          "Validate JSON"
                        )}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <div>
                        <Label>Upload JSON file</Label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="json-upload"
                        />
                        <label htmlFor="json-upload">
                          <Button variant="outline" asChild className="w-full">
                            <span className="cursor-pointer">
                              <Upload className="h-4 w-4 mr-2" />
                              Choose JSON File
                            </span>
                          </Button>
                        </label>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <Alert 
                      variant={validationErrors[0].startsWith("✓") ? "default" : "destructive"} 
                      className="mt-4"
                    >
                      {validationErrors[0].startsWith("✓") ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <ul className={validationErrors[0].startsWith("✓") ? "space-y-1" : "list-disc list-inside"}>
                          {validationErrors.map((error, index) => (
                            <li key={index} className={error === "" ? "list-none" : ""}>
                              {error}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Preview */}
                  {showPreview && parsedTopics.length > 0 && (
                    <>
                      <Alert className="mt-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Valid JSON! Found {parsedTopics.length} topics ready to import.
                        </AlertDescription>
                      </Alert>
                      
                      {/* Cleaned JSON */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label>Cleaned JSON (copy this for future use)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(cleanedJson);
                              alert("Cleaned JSON copied to clipboard!");
                            }}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy Cleaned JSON
                          </Button>
                        </div>
                        <Textarea
                          value={cleanedJson}
                          readOnly
                          className="min-h-[200px] font-mono text-sm bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Import Action */}
              {showPreview && (
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full"
                      size="lg"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Import {parsedTopics.length} Topics
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Help */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>• Only the &apos;topic&apos; field is required</p>
                  <p>• Use lowercase for priority values</p>
                  <p>• Meta descriptions must be under 155 chars</p>
                  <p>• <strong>Timezone handling:</strong></p>
                  <p className="ml-4">- Use local time format: &quot;2025-08-01T14:00:00&quot;</p>
                  <p className="ml-4">- Avoid &quot;Z&quot; suffix (that means UTC)</p>
                  <p className="ml-4">- Times will be scheduled in YOUR timezone</p>
                  <p>• Each topic can have its own brandContext</p>
                  <p>• Use referenceImages to link existing images</p>
                </CardContent>
              </Card>

              {/* Image Reference Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Using Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium">To add images to topics:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Upload images through the Image Library</li>
                    <li>Copy the image URL</li>
                    <li>Add to <code className="bg-gray-100 px-1 rounded">referenceImages</code> array</li>
                  </ol>
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs font-mono">
                      &quot;referenceImages&quot;: [<br />
                      &nbsp;&nbsp;&quot;https://your-cdn.com/image1.jpg&quot;,<br />
                      &nbsp;&nbsp;&quot;https://your-cdn.com/image2.jpg&quot;<br />
                      ]
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminPasswordGate>
  );
}