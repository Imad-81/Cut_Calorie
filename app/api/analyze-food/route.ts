import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { parseFoodAnalysis } from "@/lib/food-analysis";

const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const systemPrompt = `You are a precise nutritionist AI. Given a food description or image,
return a JSON object with:
{ foodName, servingSize, calories, protein, carbs, fats, fiber }
All numeric values are per the described serving. Be accurate for Indian foods too.
Only return valid JSON, nothing else.`;

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key" }, { status: 500 });
    }
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: geminiModel,
      generationConfig: { responseMimeType: "application/json" },
    });
    const parts =
      imageBase64 && mimeType
        ? [
            { text: systemPrompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            },
          ]
        : [{ text: `${systemPrompt}\n\nFood: ${description}` }];
    const result = await model.generateContent(parts);
    const text = result.response.text();
    return NextResponse.json(parseFoodAnalysis(text));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to analyze food" }, { status: 502 });
  }
}
