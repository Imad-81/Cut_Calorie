// import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { parseFoodAnalysis } from "@/lib/food-analysis";

// Use gemini-1.5-flash as the reliable default; override via env if needed
// const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const systemPrompt = `You are a highly precise nutritionist AI.

Given a food description and/or image, return ONLY a valid JSON object (no markdown, no code fences) with exactly these keys:
{ "foodName": string, "servingSize": string, "calories": number, "protein": number, "carbs": number, "fats": number, "fiber": number }

Rules:
- All values must correspond to the described serving size.
- If portion size is unclear, assume a realistic but slightly generous (higher-end) serving.
- Always lean toward the higher side of calorie estimates to avoid underestimation.
- Include hidden calories (oil, butter, ghee, sugar, sauces, frying, etc.), especially in Indian dishes.
- Use real-world average nutritional data (USDA or standard Indian diet references).
- Ensure macronutrients are internally consistent with calories (approx: protein/carbs = 4 kcal/g, fats = 9 kcal/g).
- If multiple food items are present, combine them into a single total estimate.

Output constraints:
- Return ONLY raw JSON.
- No explanations, no assumptions, no extra keys.
- Values must be realistic and not rounded excessively (avoid overly neat numbers like exactly 100 unless justified).

Be especially accurate with Indian foods (roti, dal, sabzi, rice, paneer, etc.), considering typical cooking methods (oil/ghee usage).`;

export async function POST(request: Request) {
  try {
    const { description, imageBase64, mimeType } = (await request.json()) as {
      description?: string;
      imageBase64?: string;
      mimeType?: string;
    };

    if (!description && !imageBase64) {
      return NextResponse.json({ error: "Missing food input" }, { status: 400 });
    }

    /*
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: geminiModel });

    // Build parts array — support description-only, image-only, or both together
    type Part = { text: string } | { inlineData: { data: string; mimeType: string } };
    const parts: Part[] = [];

    if (imageBase64 && mimeType) {
      // Multimodal: system instruction as first text part, then image, then optional description
      parts.push({ text: systemPrompt });
      parts.push({ inlineData: { data: imageBase64, mimeType } });
      if (description?.trim()) {
        parts.push({ text: `User also says: ${description.trim()}` });
      }
    } else {
      // Text-only
      parts.push({ text: `${systemPrompt}\n\nFood: ${description}` });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    */

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Missing Groq API key" }, { status: 500 });
    }

    // Default to Llama 3 models
    const groqModel = process.env.GROQ_MODEL ?? (imageBase64 ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile");

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64 && mimeType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content: any[] = [];
      if (description?.trim()) {
        content.push({ type: "text", text: `User also says: ${description.trim()}` });
      } else {
        content.push({ type: "text", text: "Analyze this food image." });
      }
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${imageBase64}`
        }
      });
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: `Food: ${description}` });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const text = data.choices[0].message.content;

    return NextResponse.json(parseFoodAnalysis(text));
  } catch (error) {
    // Log the real error so it's visible in the server console
    console.error("[analyze-food] error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Unable to analyze food" }, { status: 502 });
  }
}
