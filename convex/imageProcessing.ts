import sharp from "sharp";

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
 * 
 * Requirements handled:
 * 1. Accept image input (Buffer or Base64).
 * 2. Validate (not corrupted, supported formats).
 * 3. Normalize (convert to RGB, remove alpha).
 * 4. Resize (max 1024 width/height).
 * 5. Compress (85% quality JPEG).
 * 6. Standard format (JPEG).
 * 7. Size limit (< 5MB).
 * 8. Safe error handling.
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

    // 2. Load and Validate
    const pipeline = sharp(imageBuffer);
    const metadata = await pipeline.metadata().catch((e) => {
      throw new Error(`Invalid or corrupted image: ${e.message}`);
    });

    if (!metadata.format) {
      throw new Error("Unknown image format");
    }

    if (debug) {
      console.log(`[ImageProcessor] Format: ${metadata.format}, Source: ${metadata.width}x${metadata.height}`);
    }

    // 3. Normalize & 4. Resize & 5. Compress
    // - .flatten(): removes alpha channel, blends with white background
    // - .resize(): scales down if exceeds limits
    // - .jpeg(): converts to optimized JPEG
    const processed = await pipeline
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true, // Optimized compression
      })
      .toBuffer({ resolveWithObject: true });

    let finalData = processed.data;
    let finalInfo = processed.info;

    // 6. Enforce Size Limit
    if (finalData.length > maxSizeBytes) {
      if (debug) console.log(`[ImageProcessor] Result ${(finalData.length / 1024 / 1024).toFixed(2)} MB still exceeds limit. Applying aggressive compression...`);
      
      const aggressive = await sharp(finalData)
        .jpeg({ quality: 60 })
        .toBuffer({ resolveWithObject: true });
        
      finalData = aggressive.data;
      finalInfo = aggressive.info;

      if (finalData.length > maxSizeBytes) {
        throw new Error(`Image remains too large (${(finalData.length / 1024 / 1024).toFixed(2)} MB) even after aggressive compression.`);
      }
    }

    const base64 = finalData.toString("base64");

    if (debug) {
      console.log(`[ImageProcessor] Processed successfully: ${finalInfo.width}x${finalInfo.height}, Final size: ${(finalData.length / 1024).toFixed(2)} KB`);
    }

    return {
      buffer: finalData,
      mimeType: "image/jpeg",
      width: finalInfo.width,
      height: finalInfo.height,
      size: finalData.length,
      base64,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ImageProcessor] Failure: ${errorMessage}`);
    // 8. Safe error return: throwing here allows the Convex action to catch and handle gracefully
    throw new Error(errorMessage);
  }
}
