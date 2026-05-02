"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { processImage } from "./imageProcessing";

/**
 * Example Convex Action demonstrating the image preprocessing module.
 * This action takes an image, processes it to ensure compatibility,
 * and sends it to the Groq API for analysis.
 */
export const analyzeFoodWithGroq = action({
  args: {
    imageBase64: v.optional(v.string()), // Can be raw base64 or data URI
    description: v.optional(v.string()),
    debug: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { imageBase64, description, debug = false } = args;

    try {
      let processed = null;

      // --- STEP 1: IMAGE PREPROCESSING ---
      if (imageBase64) {
        if (debug) console.log("[Action] Starting image preprocessing...");
        
        // This ensures the image is valid, resized, normalized to RGB, 
        // and converted to a standard JPEG under 5MB.
        processed = await processImage(imageBase64, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 85,
          debug: debug,
        });
        
        if (debug) console.log("[Action] Preprocessing complete.");
      }

      // --- STEP 2: PREPARE GROQ API CALL ---
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error("GROQ_API_KEY environment variable is not set");
      }

      // Use a vision-capable model if an image is present
      const model = processed 
        ? "llama-3.2-11b-vision-preview" 
        : "llama-3.3-70b-versatile";

      const messages: any[] = [
        { 
          role: "system", 
          content: "You are a precise nutritionist. Analyze the food and return raw JSON: { \"foodName\": string, \"calories\": number, \"protein\": number, \"carbs\": number, \"fats\": number }" 
        },
      ];

      const content: any[] = [];
      if (description) {
        content.push({ type: "text", text: description });
      } else if (!processed) {
        throw new Error("Either an image or a description is required.");
      }

      if (processed) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${processed.base64}`
          }
        });
      }

      messages.push({ role: "user", content });

      // --- STEP 3: EXECUTE API CALL ---
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const analysisText = result.choices[0].message.content;

      // Return the clean analysis result
      return JSON.parse(analysisText);

    } catch (error) {
      // --- STEP 4: SAFE ERROR HANDLING ---
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[analyzeFoodWithGroq] Failed: ${errorMessage}`);
      
      // Return a structured error instead of crashing the action
      return {
        success: false,
        error: "Preprocessing or Analysis failed",
        details: errorMessage
      };
    }
  },
});
