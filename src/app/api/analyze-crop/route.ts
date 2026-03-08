import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const SYSTEM_PROMPT = `You are an expert agricultural scientist and plant pathologist specializing in Indian crops. 
Analyze the provided crop image and diagnose any diseases or health issues.

ALWAYS respond with ONLY a valid JSON object (no markdown fences, no extra text):
{
  "disease": "Name of the disease or 'Healthy' if no disease",
  "confidence": 85,
  "crop": "Detected crop name",
  "severity": "low | moderate | severe",
  "description": "Brief description of the disease and its impact on crops",
  "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
  "treatment": {
    "immediate": ["immediate action 1", "immediate action 2"],
    "organic": ["organic treatment 1", "organic treatment 2"],
    "chemical": ["chemical treatment with dosage 1"],
    "prevention": ["prevention measure 1", "prevention measure 2"]
  }
}

Consider common Indian crop diseases. Include specific product names available in India with proper dosages.
If the image is not a crop/plant, set disease to "Not a crop image" and confidence to 0.`;

const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/** Groq vision: 4MB limit for base64. Use data URL as-is if under limit. */
async function analyzeWithGroq(imageDataUrl: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this crop image for diseases. Respond ONLY with a valid JSON object in the exact format specified in the system prompt.",
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message || res.statusText;
    if (res.status === 413) {
      throw new Error("Image too large. Use a smaller image (under 4MB) or retake.");
    }
    throw new Error(message);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Invalid Groq response");
  return content;
}

function getBedrockClient() {
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const hasAws =
      process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (groqKey) {
      const text = await analyzeWithGroq(image, groqKey);
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    }

    if (!hasAws) {
      return NextResponse.json(
        {
          error:
            "Crop analysis requires Groq or AWS. Add GROQ_API_KEY in .env.local (get a free key at console.groq.com) or set AWS credentials for Bedrock.",
        },
        { status: 503 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mediaMatch = image.match(/^data:(image\/\w+);base64,/);
    const format = mediaMatch?.[1]?.split("/")?.[1] || "jpeg";
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const bedrock = getBedrockClient();

    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: "user",
          content: [
            {
              image: {
                format: format as "jpeg" | "png" | "gif" | "webp",
                source: { bytes: imageBytes },
              },
            },
            { text: "Analyze this crop image for diseases. Respond ONLY with JSON." },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 1500, temperature: 0.3 },
    });

    const response = await bedrock.send(command);
    const text = response.output?.message?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Non-JSON response from Bedrock:", text);
      return NextResponse.json(
        { error: "Analysis failed. Please try again or use a clearer crop image." },
        { status: 502 }
      );
    }
    const diagnosis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(diagnosis);
  } catch (error: unknown) {
    console.error("Crop analysis error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Analysis failed. Please try again or use a clearer crop image.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
