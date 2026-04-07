/**
 * Shared image generation utilities
 * Extracted from app/api/blog/generate-images/route.ts for reuse
 */

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return '';
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch {
    return '';
  }
}

/**
 * Analyze reference images using GPT-4 Vision to extract style description
 */
export async function analyzeReferenceImages(referenceImages: string[]): Promise<string> {
  if (!referenceImages || referenceImages.length === 0) return '';

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return '';

  try {
    const processedImages = await Promise.all(
      referenceImages.map(async (imageRef) => {
        if (isValidUrl(imageRef)) {
          const base64 = await fetchImageAsBase64(imageRef);
          return base64 || null;
        }
        return imageRef;
      })
    );

    const validImages = processedImages.filter(img => img !== null && img !== '');
    if (validImages.length === 0) return '';

    const imageContent = validImages.map((base64Image) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: "high" as const
      }
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these reference images and describe their visual style in detail. Focus on color palette, composition, aesthetic, mood, lighting, and art style. Return a single paragraph that can be used as a style prompt for image generation.`
            },
            ...imageContent
          ]
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) return '';
    const result = await response.json();
    return result.choices[0]?.message?.content || '';
  } catch {
    return '';
  }
}

/**
 * Build unified style prompt from image context and reference analysis
 */
export function buildImageStylePrompt(imageContext: string, referenceAnalysis: string = ''): string {
  let stylePrompt = '';
  if (referenceAnalysis?.trim()) {
    stylePrompt += `Reference style analysis: ${referenceAnalysis.trim()}. `;
  }
  if (imageContext?.trim()) {
    stylePrompt += `Brand and style context: ${imageContext.trim()}. `;
  }
  return stylePrompt.trim();
}

/**
 * Generate an image using GPT Image API
 */
export async function generateImageWithGPTImage(
  prompt: string,
  styleInstructions: string,
  referenceAnalysis: string = '',
): Promise<string | null> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) return null;

  try {
    let enhancedPrompt = prompt;
    if (styleInstructions?.trim()) {
      enhancedPrompt += `. Style: ${styleInstructions}`;
    }
    if (referenceAnalysis?.trim()) {
      enhancedPrompt += `. Reference style: ${referenceAnalysis}`;
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-image-1.5',
        prompt: enhancedPrompt,
        size: '1536x1024',
        quality: 'high'
      })
    });

    if (!response.ok) {
      console.error('[image-utils] GPT Image API error:', await response.text());
      return null;
    }

    const result = await response.json();
    if (result.data?.[0]) {
      const imageData = result.data[0];
      if (imageData.url) return imageData.url;
      if (imageData.b64_json) return `data:image/png;base64,${imageData.b64_json}`;
    }
    return null;
  } catch (error) {
    console.error('[image-utils] Error generating image:', error);
    return null;
  }
}

/**
 * Upload an image (from URL or data URI) to ImageKit via the upload endpoint
 */
export async function uploadImageToImageKit(
  imageUrl: string,
  fileName: string,
  ownerId?: string,
): Promise<{ url: string; thumbnailUrl: string; fileId: string; width: number; height: number } | null> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;

    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('file', imageBlob, fileName);
    if (ownerId) formData.append('ownerId', ownerId);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) return null;
    return await uploadResponse.json();
  } catch {
    return null;
  }
}
