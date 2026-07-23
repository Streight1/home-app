import type { LayoutTextBlock } from './extraction.types.js';

export const IMAGE_OCR_PORT = Symbol('IMAGE_OCR_PORT');
export interface ImageOcrPort {
  extractLayout(
    image: Uint8Array,
    signal: AbortSignal,
  ): Promise<readonly LayoutTextBlock[]>;
}
