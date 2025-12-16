"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPasswordGate from "@/components/auth/AdminPasswordGate";
import {
  ArrowLeft,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportJSONPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleBack = () => {
    router.push("/blog/admin");
  };

  const validateJSON = (jsonString: string) => {
    if (!jsonString.trim()) {
      setValidationError("");
      setIsValid(false);
      setParsedData(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);

      // Basic validation for blog post structure
      if (typeof parsed !== "object" || parsed === null) {
        setValidationError("JSON must be an object");
        setIsValid(false);
        setParsedData(null);
        return;
      }

      // Check for required fields
      const requiredFields = ["title", "description", "components"];
      const missingFields = requiredFields.filter(
        (field) => !(field in parsed)
      );

      if (missingFields.length > 0) {
        setValidationError(
          `Missing required fields: ${missingFields.join(", ")}`
        );
        setIsValid(false);
        setParsedData(null);
        return;
      }

      // Validate components array
      if (!Array.isArray(parsed.components)) {
        setValidationError("Components must be an array");
        setIsValid(false);
        setParsedData(null);
        return;
      }

      // Validate each component
      for (let i = 0; i < parsed.components.length; i++) {
        const component = parsed.components[i];
        if (!component.id || !component.type) {
          setValidationError(
            `Component ${i + 1} is missing required fields (id, type)`
          );
          setIsValid(false);
          setParsedData(null);
          return;
        }
      }

      setValidationError("");
      setIsValid(true);
      setParsedData(parsed);
    } catch (error) {
      setValidationError("Invalid JSON format");
      setIsValid(false);
      setParsedData(null);
    }
  };

  const handleInputChange = (value: string) => {
    setJsonInput(value);
    validateJSON(value);
  };

  const handleImport = () => {
    if (isValid && parsedData) {
      // Store the data in localStorage or pass it to the manual editor
      localStorage.setItem("importedBlogData", JSON.stringify(parsedData));
      router.push("/blog/admin/manual?imported=true");
    }
  };

  const sampleJSON = {
    title: "Sample Blog Post",
    description:
      "This is a sample blog post description for SEO and social sharing.",
    featuredImage: "https://example.com/featured-image.jpg",
    components: [
      {
        id: "intro_1",
        type: "rich_text",
        content:
          "# Welcome to My Blog\n\nThis is the introduction paragraph of my blog post.",
      },
      {
        id: "image_1",
        type: "image",
        src: "sample-image",
        alt: "Sample image description",
        caption: "This is a sample image caption",
      },
      {
        id: "callout_1",
        type: "callout",
        variant: "info",
        title: "Important Note",
        content: "This is an important callout box with useful information.",
      },
    ],
  };

  const insertSample = () => {
    const sampleString = JSON.stringify(sampleJSON, null, 2);
    setJsonInput(sampleString);
    validateJSON(sampleString);
  };

  return (
    <AdminPasswordGate>
      <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Import Blog Post from JSON
            </h1>
            <p className="text-gray-600">
              Paste your JSON structure to quickly create a blog post with all
              components.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* JSON Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                JSON Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Paste your JSON structure
                </label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Paste your JSON here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {isValid && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    JSON is valid! Ready to import{" "}
                    {parsedData?.components?.length || 0} components.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={insertSample}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Insert Sample
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!isValid}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import & Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Help */}
        <div className="space-y-6">
          {/* Preview */}
          {parsedData && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Title</h3>
                    <p className="text-gray-600">{parsedData.title}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Description</h3>
                    <p className="text-gray-600">{parsedData.description}</p>
                  </div>
                  {parsedData.featuredImage && (
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Featured Image
                      </h3>
                      <p className="text-gray-600 break-all">
                        {parsedData.featuredImage}
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">Components</h3>
                    <div className="space-y-2">
                      {parsedData.components.map(
                        (component: any, index: number) => (
                          <div
                            key={component.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="font-medium">
                              {component.type}
                            </span>
                            <span className="text-gray-500">
                              ({component.id})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>JSON Structure Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Required Fields:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      <code className="bg-gray-100 px-1 rounded">title</code> -
                      Blog post title
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        description
                      </code>{" "}
                      - Meta description
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        components
                      </code>{" "}
                      - Array of components
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Optional Fields:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        featuredImage
                      </code>{" "}
                      - URL for the main thumbnail image
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">category</code>{" "}
                      - Post category
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">tags</code> -
                      Array of tag strings
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Component Types:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      <code className="bg-gray-100 px-1 rounded">
                        rich_text
                      </code>{" "}
                      - Markdown content
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">image</code> -
                      Image with alt text
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">callout</code>{" "}
                      - Info/warning boxes
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">quote</code> -
                      Quoted text
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">cta</code> -
                      Call-to-action button
                    </li>
                    <li>
                      <code className="bg-gray-100 px-1 rounded">video</code> -
                      Video embed
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>
                      Each component needs a unique{" "}
                      <code className="bg-gray-100 px-1 rounded">id</code>
                    </li>
                    <li>{`Use the "Insert Sample" button to see the structure`}</li>
                    <li>You can export JSON from existing posts to reuse</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AdminPasswordGate>
  );
}
