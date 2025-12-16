import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongo';
import BlogPost from '@/models/BlogPost';

export const maxDuration = 300;

// Helper function to check if a string is a URL
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper function to fetch image from URL and convert to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`Fetching image from URL: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch image from URL: ${response.status}`);
      return '';
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    console.log(`Successfully converted URL image to base64 (${base64.length} chars)`);
    return base64;
  } catch (error) {
    console.error(`Error fetching image from URL:`, error);
    return '';
  }
}

// Function to analyze reference images using GPT-4 Vision
async function analyzeReferenceImages(referenceImages: string[]): Promise<string> {
  if (!referenceImages || referenceImages.length === 0) {
    return '';
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OpenAI API key not found for image analysis');
    return '';
  }

  try {
    console.log(`Analyzing ${referenceImages.length} reference images with GPT-4 Vision`);

    // Process each reference image - convert URLs to base64 if needed
    const processedImages = await Promise.all(
      referenceImages.map(async (imageRef) => {
        if (isValidUrl(imageRef)) {
          // It's a URL - fetch and convert to base64
          const base64 = await fetchImageAsBase64(imageRef);
          return base64 || null;
        } else {
          // Assume it's already base64
          return imageRef;
        }
      })
    );

    // Filter out any failed conversions
    const validImages = processedImages.filter(img => img !== null && img !== '');
    
    if (validImages.length === 0) {
      console.error('No valid images to analyze after processing');
      return '';
    }

    // Prepare the message content with multiple images
    const imageContent = validImages.map((base64Image, index) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: "high" as const
      }
    }));

    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: `Analyze these reference images and describe their visual style in detail. Focus on:

1. Color palette and schemes
2. Design elements and composition
3. Typography style (if visible)
4. Overall aesthetic and mood
5. Geometric patterns or shapes
6. Lighting and visual effects
7. Art style (minimalist, corporate, abstract, etc.)
8. Any brand-specific design elements

Provide a concise but detailed description that could be used to generate similar-style images. Focus on concrete visual elements rather than abstract concepts.

Return your analysis as a single paragraph that can be used as a style prompt for image generation.`
          },
          ...imageContent
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error('GPT-4 Vision API error:', await response.text());
      return '';
    }

    const result = await response.json();
    const analysis = result.choices[0]?.message?.content || '';
    
    console.log('Reference image analysis completed:', analysis.substring(0, 200) + '...');
    return analysis;

  } catch (error) {
    console.error('Error analyzing reference images:', error);
    return '';
  }
}

// Helper function to build unified image style prompts
function buildImageStylePrompt(imageContext: string, referenceAnalysis: string = ''): string {
  let stylePrompt = '';
  
  // Add reference image analysis (highest priority)
  if (referenceAnalysis?.trim()) {
    stylePrompt += `Reference style analysis: ${referenceAnalysis.trim()}. `;
  }
  
  // Add unified image context
  if (imageContext?.trim()) {
    stylePrompt += `Brand and style context: ${imageContext.trim()}. `;
  }
  
  // Default fallback if no context provided
  if (!stylePrompt.trim()) {
    stylePrompt = 'Professional business style with clean, modern design. ';
  }
  
  return stylePrompt.trim();
}

// Function to generate images using GPT Image 1 (superior quality)
async function generateImageWithGPTImage(prompt: string, styleInstructions: string, referenceAnalysis: string = '', title?: string, isFeaturedImage: boolean = false): Promise<string | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OpenAI API key not found for GPT Image generation');
    return null;
  }

  try {
    console.log(`Generating image with GPT Image 1: ${prompt.substring(0, 100)}...`);

    // Use landscape dimensions for blog header images
    const imageSize = '1536x1024';
    
    console.log(`Using image size: ${imageSize} for title: "${title?.substring(0, 50)}..."`);

    // Build enhanced prompt combining original prompt, style instructions, and reference analysis
    let enhancedPrompt = prompt;
    
    // Add NO TEXT instruction for component images (non-featured images)
    if (!isFeaturedImage) {
      enhancedPrompt = `Create a photorealistic image with NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY of any kind. Focus only on visual elements: ${prompt}`;
    }
    
    if (styleInstructions?.trim()) {
      enhancedPrompt += `. Style: ${styleInstructions}`;
    }
    
    if (referenceAnalysis?.trim()) {
      enhancedPrompt += `. Reference style: ${referenceAnalysis}`;
    }
    
    // Add layout instructions - different for featured vs component images
    if (isFeaturedImage) {
      // Featured images can have text
      enhancedPrompt += '. CRITICAL LAYOUT RULES: Create image in LANDSCAPE orientation (wider than tall). Center all text with at least 15% margin from every edge. Never place text near image borders. All text must be COMPLETELY visible - no letters or words can touch or approach the edges. Use only the center 70% of the image for text. Think of the image as having a large invisible border that text cannot enter. If the title is long, break it into multiple centered lines rather than extending to edges. VERIFICATION: Before finalizing, ensure every single character of text is fully visible with substantial space around it. The final image must be in landscape format suitable for blog headers.';
    } else {
      // Component images should have NO text
      enhancedPrompt += '. CRITICAL: This image must contain NO TEXT whatsoever. No words, no letters, no numbers, no typography. Create a purely visual image focusing on the scene, objects, people, and environment described. Any text-like elements should be represented abstractly or symbolically without actual readable characters.';
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        size: imageSize,
        quality: 'high' // Use high quality for best results
      })
    });

    if (!response.ok) {
      console.error('GPT Image API error:', await response.text());
      return null;
    }

    const result = await response.json();
    console.log('GPT Image API response structure:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.length > 0) {
      // GPT Image 1 returns base64 encoded images by default
      const imageData = result.data[0];
      if (imageData.url) {
        console.log('GPT Image generated successfully with URL');
        return imageData.url;
      } else if (imageData.b64_json) {
        console.log('GPT Image generated successfully with base64');
        // Convert base64 to blob URL for temporary use
        const base64Data = imageData.b64_json;
        const blob = new Blob([Buffer.from(base64Data, 'base64')], { type: 'image/png' });
        return `data:image/png;base64,${base64Data}`;
      } else {
        console.error('No URL or base64 data in GPT Image response:', imageData);
        return null;
      }
    } else {
      console.error('No image data returned from GPT Image');
      return null;
    }

  } catch (error) {
    console.error('Error generating image with GPT Image:', error);
    return null;
  }
}

interface ImageGenerationRequest {
  blogPostId?: string; // Make optional for pre-save generation
  title: string;
  topic: string;
  imageContext?: string;
  referenceImages?: string[];
  components: Array<{
    _id?: string;
    type: string;
    order: number;
    imageDescription?: string;
    alt?: string;
    caption?: string;
    needsImageGeneration?: boolean;
  }>;
  generateFeaturedImage: boolean;
  returnOnly?: boolean; // New flag to return URLs without saving
}

export async function POST(request: NextRequest) {
  console.log(`[GenerateImages] ========== IMAGE GENERATION STARTED ==========`);
  console.log(`[GenerateImages] Timestamp: ${new Date().toISOString()}`);
  
  try {
    const body: ImageGenerationRequest = await request.json();
    const {
      blogPostId,
      title,
      topic,
      imageContext,
      referenceImages,
      components,
      generateFeaturedImage,
      returnOnly = false
    } = body;

    console.log(`[GenerateImages] Blog Post ID: ${blogPostId || 'Not saved yet'}`);
    console.log(`[GenerateImages] Title: ${title}`);
    console.log(`[GenerateImages] Generate Featured Image: ${generateFeaturedImage}`);
    console.log(`[GenerateImages] Components with images: ${components.filter(c => c.type === 'image' || c.needsImageGeneration).length}`);
    console.log(`[GenerateImages] Reference images provided: ${referenceImages?.length || 0}`);
    console.log(`[GenerateImages] Return only mode: ${returnOnly}`);

    await dbConnect();

    // Only verify blog post exists if we're updating an existing post
    let blogPost = null;
    if (blogPostId && !returnOnly) {
      blogPost = await BlogPost.findById(blogPostId);
      if (!blogPost) {
        return NextResponse.json(
          { message: 'Blog post not found' },
          { status: 404 }
        );
      }
    }

    // Analyze reference images if provided
    const referenceAnalysis = referenceImages && referenceImages.length > 0 
      ? await analyzeReferenceImages(referenceImages)
      : '';

    // Build style instructions for all images
    const styleInstructions = buildImageStylePrompt(
      imageContext || '', 
      referenceAnalysis
    );

    const updates: any = {};
    const generatedImages: any[] = [];

    // Generate featured image if requested
    if (generateFeaturedImage) {
      try {
        console.log(`Generating featured image for blog post: ${title}`);
        
        // Create a featured image prompt based on the blog topic and title
        const featuredImagePrompt = `Create a featured image for blog post in LANDSCAPE orientation (16:9 ratio). CRITICAL: Place this title text "${title}" in the CENTER of the image with massive margins on all sides. The text must occupy only the middle 60% of the image. Leave the outer 20% of the image completely empty on all edges. Never let any text approach the borders. If the title is long, split it into 2-3 centered lines. Design an eye-catching hero image about ${topic} with the title text as the clear focal point, surrounded by plenty of empty space. The image must be wider than it is tall, suitable for a blog header.`;
        
        // Generate image using GPT Image 1 API with enhanced prompting
        const generatedImageUrl = await generateImageWithGPTImage(
          featuredImagePrompt,
          styleInstructions,
          referenceAnalysis,
          title,
          true // isFeaturedImage = true
        );
        
        if (generatedImageUrl) {
          console.log(`Featured image generated successfully with GPT Image, uploading to ImageKit...`);
          
          // Download the image from GPT Image
          const imageResponse = await fetch(generatedImageUrl);
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            
            // Create form data for ImageKit upload
            const formData = new FormData();
            const fileName = `featured-${Date.now()}.png`;
            formData.append('file', imageBlob, fileName);
            
            // Upload to ImageKit using our existing upload endpoint
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                           'http://localhost:3000');
            const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
              method: 'POST',
              body: formData,
            });
            
            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json();
              console.log(`Featured image uploaded to ImageKit successfully:`, uploadData.url);
              
              // Update blog post with featured image
              updates.featuredImage = uploadData.url;
              updates.featuredImageThumbnail = uploadData.thumbnailUrl;
              
              generatedImages.push({
                type: 'featured',
                url: uploadData.url,
                thumbnailUrl: uploadData.thumbnailUrl
              });
              
            } else {
              console.error('Failed to upload featured image to ImageKit:', await uploadResponse.text());
            }
          } else {
            console.error('Failed to download featured image from GPT Image');
          }
        } else {
          console.error('No featured image URL returned from GPT Image');
        }
      } catch (featuredImageError) {
        console.error("Error generating featured image:", featuredImageError);
      }
    }

    // Process component images
    const updatedComponents = returnOnly ? [...components] : [...(blogPost?.components || [])];
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      
      if ((component.type === "image" || component.needsImageGeneration) && component.imageDescription) {
        try {
          console.log(`Generating image for component: ${component.imageDescription}`);
          
          // Generate image using GPT Image 1 API with unified context and reference analysis
          const generatedImageUrl = await generateImageWithGPTImage(
            component.imageDescription,
            styleInstructions,
            referenceAnalysis,
            title,
            false // isFeaturedImage = false for component images
          );
          
          if (generatedImageUrl) {
            console.log(`Component image generated successfully with GPT Image, uploading to ImageKit...`);
            
            // Download the image from GPT Image
            const imageResponse = await fetch(generatedImageUrl);
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob();
              
              // Create form data for ImageKit upload
              const formData = new FormData();
              const fileName = `ai-component-${Date.now()}.png`;
              formData.append('file', imageBlob, fileName);
              
              // Upload to ImageKit using our existing upload endpoint
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                             (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                             'http://localhost:3000');
              const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
                method: 'POST',
                body: formData,
              });
              
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                console.log(`Component image uploaded to ImageKit successfully:`, uploadData.url);
                
                // Find the corresponding component and update it
                const componentIndex = returnOnly 
                  ? i // For returnOnly mode, use the same index
                  : updatedComponents.findIndex(
                      (c: any) => c.order === component.order && c.type === 'image'
                    );
                
                if (componentIndex !== -1) {
                  updatedComponents[componentIndex] = {
                    ...updatedComponents[componentIndex],
                    url: uploadData.url,
                    fileId: uploadData.fileId,
                    thumbnailUrl: uploadData.thumbnailUrl,
                    width: uploadData.width,
                    height: uploadData.height,
                    alt: component.alt || component.imageDescription,
                    // Remove temporary fields
                    imageDescription: undefined,
                    needsImageGeneration: undefined,
                    needsUpload: undefined
                  };
                  
                  generatedImages.push({
                    type: 'component',
                    order: component.order,
                    url: uploadData.url,
                    thumbnailUrl: uploadData.thumbnailUrl
                  });
                }
                
              } else {
                console.error('Failed to upload component image to ImageKit:', await uploadResponse.text());
              }
            } else {
              console.error('Failed to download component image from GPT Image');
            }
          } else {
            console.error('No component image URL returned from GPT Image');
          }
        } catch (imageError) {
          console.error("Error generating and uploading component image:", imageError);
          // Continue with other images if one fails
        }
      }
    }

    // If returnOnly mode, return the updated data without saving
    if (returnOnly) {
      console.log(`[GenerateImages] ========== IMAGE GENERATION COMPLETED (Return Only) ==========`);
      console.log(`[GenerateImages] Total images generated: ${generatedImages.length}`);
      console.log(`[GenerateImages] Featured image: ${updates.featuredImage || 'none'}`);
      console.log(`[GenerateImages] Component images: ${generatedImages.filter(img => img.type === 'component').length}`);
      
      return NextResponse.json({
        success: true,
        generated: true,
        saved: false,
        featuredImage: updates.featuredImage,
        featuredImageThumbnail: updates.featuredImageThumbnail,
        components: updatedComponents,
        generatedImages,
        totalImages: generatedImages.length,
        message: `Successfully generated ${generatedImages.length} images`
      });
    }

    // Otherwise, update the blog post with all changes
    if (Object.keys(updates).length > 0 || updatedComponents.length > 0) {
      if (updatedComponents.length > 0) {
        updates.components = updatedComponents;
      }
      
      await BlogPost.findByIdAndUpdate(blogPostId, updates);
      console.log(`[GenerateImages] Updated blog post ${blogPostId} with ${generatedImages.length} generated images`);
    }

    console.log(`[GenerateImages] ========== IMAGE GENERATION COMPLETED ==========`);
    console.log(`[GenerateImages] Total images generated: ${generatedImages.length}`);
    console.log(`[GenerateImages] Featured image: ${generatedImages.filter(img => img.type === 'featured').length}`);
    console.log(`[GenerateImages] Component images: ${generatedImages.filter(img => img.type === 'component').length}`);
    console.log(`[GenerateImages] Blog post ${blogPostId} updated successfully`);

    return NextResponse.json({
      success: true,
      blogPostId,
      generatedImages,
      totalImages: generatedImages.length,
      message: `Successfully generated ${generatedImages.length} images`
    });

  } catch (error) {
    console.error('[GenerateImages] Error:', error);
    return NextResponse.json(
      { 
        message: 'Error generating images',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}