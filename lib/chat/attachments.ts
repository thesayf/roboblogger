export const CHAT_IMAGE_MAX_COUNT = 4;
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const CHAT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export interface ChatImageAttachment {
  type: 'image';
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export function validateChatImageFile(file: File): string | null {
  if (!CHAT_IMAGE_MIME_TYPES.includes(file.type as (typeof CHAT_IMAGE_MIME_TYPES)[number])) {
    return 'Use a JPEG, PNG, GIF, or WebP image.';
  }

  if (file.size > CHAT_IMAGE_MAX_BYTES) {
    return `${file.name} is larger than 10MB.`;
  }

  return null;
}
