"use node";

import { Jimp } from "jimp";
import convert from "heic-convert";

/**
 * Result of the image processing.
 */
export type ProcessedImage = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  base64: string; // Convenience for API submission
};

/**
 * Preprocesses an image to ensure compatibility with APIs like Groq.
 * Now handles JPEG, PNG, and HEIC (iPhone) formats.
 * 
 * @param input - Buffer or Base64 string of the image.
 * @param options - Configuration for resizing, quality, and debugging.
 * @returns Promise<ProcessedImage>
 */
export async function processImage(
  input: Buffer | string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    debug?: boolean;
    maxSizeBytes?: number;
  } = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 85,
    debug = false,
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  } = options;

  try {
    let imageBuffer: Buffer;

    // 1. Handle input types
    if (typeof input === "string") {
      const base64Data = input.includes("base64,") 
        ? input.split("base64,")[1] 
        : input;
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      imageBuffer = input;
    }

    if (imageBuffer.length === 0) {
      throw new Error("Empty image buffer provided");
    }

    if (debug) {
      console.log(`[ImageProcessor] Input size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    }

    // 2. Handle HEIC (iPhone) format conversion
    // Check if it's HEIC (starts with 'ftypheic' or similar, but simpler to check via a small check)
    const isHeic = imageBuffer.slice(4, 12).toString('ascii').includes('ftyp');
    // More specifically, HEIC usually has 'heic' or 'mif1' in the ftyp block
    const ftyp = imageBuffer.slice(8, 12).toString('ascii');
    
    if (ftyp === 'heic' || ftyp === 'mif1' || ftyp === 'hevc') {
      if (debug) console.log("[ImageProcessor] Detected HEIC format. Converting to JPEG...");
      imageBuffer = Buffer.from(await convert({
        buffer: imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength) as ArrayBuffer,
        format: 'JPEG',
        quality: 90
      }));
    }

    // 3. Load and Validate
    const image = await Jimp.read(imageBuffer).catch((e) => {
      throw new Error(`Invalid or unsupported image format: ${e.message}`);
    });

    if (debug) {
      console.log(`[ImageProcessor] Source: ${image.width}x${image.height}`);
    }

    // 4. Normalize & Resize
    if (image.width > maxWidth || image.height > maxHeight) {
      image.scaleToFit({ w: maxWidth, h: maxHeight });
    }

    // 5. Compress
    let finalBuffer = await image.getBuffer("image/jpeg", { quality });

    // 6. Enforce Size Limit
    if (finalBuffer.length > maxSizeBytes) {
      if (debug) console.log(`[ImageProcessor] Result ${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB still exceeds limit. Applying aggressive compression...`);
      
      finalBuffer = await image.getBuffer("image/jpeg", { quality: 60 });

      if (finalBuffer.length > maxSizeBytes) {
        throw new Error(`Image remains too large (${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB) even after aggressive compression.`);
      }
    }

    const base64 = finalBuffer.toString("base64");

    if (debug) {
      console.log(`[ImageProcessor] Processed successfully: ${image.width}x${image.height}, Final size: ${(finalBuffer.length / 1024).toFixed(2)} KB`);
    }

    return {
      buffer: finalBuffer,
      mimeType: "image/jpeg",
      width: image.width,
      height: image.height,
      size: finalBuffer.length,
      base64,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ImageProcessor] Failure: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}
