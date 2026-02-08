import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AllowedTags } from "../../../../../lib/tags";

function safeJsonParse(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json(
        { suggestedTags: [], confidence: 0, error: "Text too short" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        { suggestedTags: [], confidence: 0, error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
You assign topic tags for a student support matching app.
Rules:
- Choose tags ONLY from AllowedTags.
- Return 3 to 6 tags.
- Output MUST be valid JSON only (no extra text).
JSON schema:
{"suggestedTags": string[], "confidence": number}
StudentText:
"${text.replaceAll('"', '\\"')}"
AllowedTags:
${JSON.stringify(AllowedTags)}
`.trim();

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = safeJsonParse(raw) ?? {};

    const aiTags: string[] = Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags
      : [];
    const confidence =
      typeof parsed.confidence === "number" ? parsed.confidence : 0.6;

    const allowedSet = new Set(AllowedTags);
    const cleaned = Array.from(
      new Set(aiTags.map((t) => String(t).toLowerCase().trim()))
    )
      .filter((t) => allowedSet.has(t as any))
      .slice(0, 6);

    if (cleaned.length < 1) {
      const lower = text.toLowerCase();
      const fallback = AllowedTags.filter((tag) => lower.includes(tag));
      return NextResponse.json({
        suggestedTags: fallback.slice(0, 6),
        confidence: 0.5,
      });
    }

    return NextResponse.json({ suggestedTags: cleaned, confidence });
  } catch (error) {
    console.error("AI endpoint error:", error);
    return NextResponse.json(
      { suggestedTags: [], confidence: 0, error: `AI endpoint failed: ${error}` },
      { status: 500 }
    );
  }
}